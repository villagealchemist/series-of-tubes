import type {
  MccpCapabilityContract,
  MccpContractManifest,
} from "../contracts/MccpContract.js";

export type ContractManifestResponse = MccpContractManifest;

export type CapabilityContractResponse = MccpCapabilityContract;

export interface ContractProposal {
  name: string;
  purpose: string;
  capabilities: string[];
}

export interface ContractProposalResponse {
  providerId: string;
  modelId?: string;
  proposal: ContractProposal;
}
