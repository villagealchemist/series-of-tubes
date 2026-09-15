import type { DecisionReceipt } from "../models/responses/DecisionResponse.js";

export interface ReceiptRepository {
  findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<DecisionReceipt | undefined>;
  save(receipt: DecisionReceipt): Promise<void>;
}
