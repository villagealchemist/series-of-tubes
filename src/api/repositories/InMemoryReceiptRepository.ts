import type { DecisionReceipt } from "../models/responses/DecisionResponse.js";
import type { ReceiptRepository } from "./ReceiptRepository.js";

export class InMemoryReceiptRepository implements ReceiptRepository {
  private readonly receipts = new Map<string, DecisionReceipt>();

  public findByIdempotencyKey(
    workspaceId: string,
    idempotencyKey: string,
  ): Promise<DecisionReceipt | undefined> {
    return Promise.resolve(
      this.receipts.get(this.key(workspaceId, idempotencyKey)),
    );
  }

  public save(receipt: DecisionReceipt): Promise<void> {
    this.receipts.set(
      this.key(receipt.workspaceId, receipt.idempotencyKey),
      receipt,
    );
    return Promise.resolve();
  }

  private key(workspaceId: string, idempotencyKey: string): string {
    return `${workspaceId}:${idempotencyKey}`;
  }
}
