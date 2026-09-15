import {
  Body,
  Controller,
  Get,
  Path,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { contractService } from "../composition.js";
import type { CreateContractProposalRequest } from "../models/requests/CreateContractProposalRequest.js";
import type {
  CapabilityContractResponse,
  ContractManifestResponse,
  ContractProposalResponse,
} from "../models/responses/ContractResponses.js";
import type {
  ErrorResponse,
  ValidationErrorResponse,
} from "../models/responses/ErrorResponse.js";

@Route("v0/contracts")
@Tags("MCCP contracts")
export class ContractsController extends Controller {
  /** Return the accepted transport-independent MCCP contract registry. */
  @Get()
  @SuccessResponse("200", "Accepted contract manifest")
  public getManifest(): ContractManifestResponse {
    return contractService.getManifest();
  }

  /** Return one capability contract by its stable semantic identifier. */
  @Get("{capabilityId}")
  @SuccessResponse("200", "Capability contract")
  @Response<ErrorResponse>(404, "Capability contract not found")
  public getCapability(
    @Path() capabilityId: string,
  ): CapabilityContractResponse {
    return contractService.getCapability(capabilityId);
  }

  /**
   * Ask the configured model adapter to draft an MCCP contract proposal.
   * Proposals are untrusted drafts and never become accepted contracts automatically.
   */
  @Post("proposals")
  @SuccessResponse("200", "Untrusted contract proposal")
  @Response<ValidationErrorResponse>(422, "Request validation failed")
  @Response<ErrorResponse>(503, "No proposal provider configured")
  public async createProposal(
    @Body() request: CreateContractProposalRequest,
  ): Promise<ContractProposalResponse> {
    return contractService.propose(request);
  }
}
