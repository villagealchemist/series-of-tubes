import {
  findCapabilityContract,
  MCCP_CONTRACT_REGISTRY,
} from "../contracts/registry.js";
import type { CreateContractProposalRequest } from "../models/requests/CreateContractProposalRequest.js";
import type {
  CapabilityContractResponse,
  ContractManifestResponse,
  ContractProposalResponse,
} from "../models/responses/ContractResponses.js";
import type { ContractProposalProvider } from "../providers/ContractProposalProvider.js";

export class ContractNotFoundError extends Error {
  public constructor(public readonly capabilityId: string) {
    super(`Capability contract "${capabilityId}" was not found.`);
    this.name = "ContractNotFoundError";
  }
}

export class ContractService {
  public constructor(
    private readonly proposalProvider: ContractProposalProvider,
  ) {}

  public getManifest(): ContractManifestResponse {
    return MCCP_CONTRACT_REGISTRY;
  }

  public getCapability(capabilityId: string): CapabilityContractResponse {
    const capability = findCapabilityContract(capabilityId);
    if (capability === undefined) throw new ContractNotFoundError(capabilityId);
    return capability;
  }

  public async propose(
    request: CreateContractProposalRequest,
  ): Promise<ContractProposalResponse> {
    return this.proposalProvider.propose(request);
  }
}
