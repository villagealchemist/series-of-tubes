import { Controller, Get, Route, SuccessResponse, Tags } from "tsoa";
import { MCCP_CONTRACT_REGISTRY } from "../contracts/registry.js";
import type { HealthResponse } from "../models/responses/HealthResponse.js";

@Route("v0/health")
@Tags("System")
export class HealthController extends Controller {
  /** Report whether the AAPI process and contract registry are available. */
  @Get()
  @SuccessResponse("200", "AAPI is ready")
  public getHealth(): HealthResponse {
    return {
      status: "ok",
      service: "aapi",
      contractRevision: MCCP_CONTRACT_REGISTRY.revision,
      documentationPath: "/docs",
    };
  }
}
