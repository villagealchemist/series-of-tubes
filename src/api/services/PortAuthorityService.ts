import { randomUUID } from "node:crypto";
import {
  findCapabilityContract,
  MCCP_CONTRACT_REGISTRY,
} from "../contracts/registry.js";
import type { MccpCapabilityContract } from "../models/contracts/MccpContract.js";
import type { EvaluateDecisionRequest } from "../models/requests/EvaluateDecisionRequest.js";
import type {
  DecisionReceipt,
  DecisionResponse,
  PortDecision,
} from "../models/responses/DecisionResponse.js";
import type { ReceiptRepository } from "../repositories/ReceiptRepository.js";

const POLICY_REVISION = "2026-09-15.1";

interface Evaluation {
  decision: PortDecision;
  reasonCodes: string[];
}

export class PortAuthorityService {
  public constructor(private readonly receiptRepository: ReceiptRepository) {}

  public async evaluate(
    workspaceId: string,
    request: EvaluateDecisionRequest,
  ): Promise<DecisionResponse> {
    const existing = await this.receiptRepository.findByIdempotencyKey(
      workspaceId,
      request.idempotencyKey,
    );
    if (existing !== undefined) {
      return { decision: existing.decision, receipt: existing };
    }

    const contract = findCapabilityContract(request.capabilityId);
    const evaluation = this.evaluateRequest(workspaceId, request, contract);
    const receipt: DecisionReceipt = {
      receiptId: randomUUID(),
      workspaceId,
      actorId: request.actor.id,
      capabilityId: request.capabilityId,
      resourceId: request.resource.id,
      purpose: request.purpose,
      idempotencyKey: request.idempotencyKey,
      decision: evaluation.decision,
      reasonCodes: evaluation.reasonCodes,
      policyRevision: POLICY_REVISION,
      contractRevision: MCCP_CONTRACT_REGISTRY.revision,
      recordedAt: new Date().toISOString(),
    };

    await this.receiptRepository.save(receipt);
    return { decision: receipt.decision, receipt };
  }

  private evaluateRequest(
    workspaceId: string,
    request: EvaluateDecisionRequest,
    contract: MccpCapabilityContract | undefined,
  ): Evaluation {
    if (
      request.actor.workspaceId !== workspaceId ||
      request.resource.workspaceId !== workspaceId
    ) {
      return { decision: "DENY", reasonCodes: ["WORKSPACE_BOUNDARY"] };
    }

    if (contract === undefined) {
      return { decision: "DENY", reasonCodes: ["UNKNOWN_CAPABILITY"] };
    }

    if (
      !contract.allowedResourceVisibilities.includes(
        request.resource.visibility,
      )
    ) {
      return { decision: "DENY", reasonCodes: ["VISIBILITY_OUT_OF_SCOPE"] };
    }

    if (contract.requiresHumanApproval) {
      return { decision: "ASK", reasonCodes: ["HUMAN_APPROVAL_REQUIRED"] };
    }

    return { decision: "ALLOW", reasonCodes: ["CONTRACT_MATCH"] };
  }
}
