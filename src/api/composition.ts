import { DisabledContractProposalProvider } from "./providers/ContractProposalProvider.js";
import { InMemoryReceiptRepository } from "./repositories/InMemoryReceiptRepository.js";
import { ContractService } from "./services/ContractService.js";
import { PortAuthorityService } from "./services/PortAuthorityService.js";

const receiptRepository = new InMemoryReceiptRepository();
const contractProposalProvider = new DisabledContractProposalProvider();

export const contractService = new ContractService(contractProposalProvider);
export const portAuthorityService = new PortAuthorityService(receiptRepository);
