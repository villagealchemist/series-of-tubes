import { describe, expect, it } from "vitest";
import type { EvaluateDecisionRequest } from "../models/requests/EvaluateDecisionRequest.js";
import { InMemoryReceiptRepository } from "../repositories/InMemoryReceiptRepository.js";
import { PortAuthorityService } from "./PortAuthorityService.js";

function request(
  overrides: Partial<EvaluateDecisionRequest> = {},
): EvaluateDecisionRequest {
  return {
    actor: { id: "agent-1", workspaceId: "workspace-1" },
    resource: {
      id: "context-1",
      workspaceId: "workspace-1",
      visibility: "workspace",
    },
    capabilityId: "context.read",
    purpose: "Answer an operator question from governed context.",
    idempotencyKey: "request-1",
    ...overrides,
  };
}

describe("PortAuthorityService", () => {
  it("allows a declared read inside the active workspace", async () => {
    const service = new PortAuthorityService(new InMemoryReceiptRepository());

    const result = await service.evaluate("workspace-1", request());

    expect(result.decision).toBe("ALLOW");
    expect(result.receipt.reasonCodes).toEqual(["CONTRACT_MATCH"]);
  });

  it("asks before a capability that requires human approval", async () => {
    const service = new PortAuthorityService(new InMemoryReceiptRepository());

    const result = await service.evaluate(
      "workspace-1",
      request({
        capabilityId: "external.message.send",
        idempotencyKey: "request-2",
      }),
    );

    expect(result.decision).toBe("ASK");
    expect(result.receipt.reasonCodes).toEqual(["HUMAN_APPROVAL_REQUIRED"]);
  });

  it("denies cross-workspace access", async () => {
    const service = new PortAuthorityService(new InMemoryReceiptRepository());

    const result = await service.evaluate(
      "workspace-1",
      request({
        resource: {
          id: "context-2",
          workspaceId: "workspace-2",
          visibility: "workspace",
        },
        idempotencyKey: "request-3",
      }),
    );

    expect(result.decision).toBe("DENY");
    expect(result.receipt.reasonCodes).toEqual(["WORKSPACE_BOUNDARY"]);
  });

  it("returns the original receipt for a repeated idempotency key", async () => {
    const service = new PortAuthorityService(new InMemoryReceiptRepository());
    const original = await service.evaluate("workspace-1", request());
    const repeated = await service.evaluate("workspace-1", request());

    expect(repeated).toEqual(original);
  });
});
