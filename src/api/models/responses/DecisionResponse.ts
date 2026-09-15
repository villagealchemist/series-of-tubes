export type PortDecision = "ALLOW" | "ASK" | "DENY";

export interface DecisionReceipt {
  /** @format uuid */
  receiptId: string;
  workspaceId: string;
  actorId: string;
  capabilityId: string;
  resourceId: string;
  purpose: string;
  idempotencyKey: string;
  decision: PortDecision;
  reasonCodes: string[];
  policyRevision: string;
  contractRevision: string;
  /** @format date-time */
  recordedAt: string;
}

export interface DecisionResponse {
  decision: PortDecision;
  receipt: DecisionReceipt;
}
