import type { CreateContractProposalRequest } from "../models/requests/CreateContractProposalRequest.js";
import type { ContractProposalResponse } from "../models/responses/ContractResponses.js";

export interface ContractProposalProvider {
  readonly providerId: string;
  propose(
    request: CreateContractProposalRequest,
  ): Promise<ContractProposalResponse>;
}

export class ContractProposalProviderUnavailableError extends Error {
  public constructor() {
    super(
      "No contract proposal provider is configured. The AAPI runtime remains available without a model provider.",
    );
    this.name = "ContractProposalProviderUnavailableError";
  }
}

export class DisabledContractProposalProvider implements ContractProposalProvider {
  public readonly providerId = "none";

  public propose(
    request: CreateContractProposalRequest,
  ): Promise<ContractProposalResponse> {
    void request;
    return Promise.reject(new ContractProposalProviderUnavailableError());
  }
}
