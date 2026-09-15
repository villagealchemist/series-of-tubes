import {
  Body,
  Controller,
  Path,
  Post,
  Response,
  Route,
  SuccessResponse,
  Tags,
} from "tsoa";
import { portAuthorityService } from "../composition.js";
import type { EvaluateDecisionRequest } from "../models/requests/EvaluateDecisionRequest.js";
import type { DecisionResponse } from "../models/responses/DecisionResponse.js";
import type { ValidationErrorResponse } from "../models/responses/ErrorResponse.js";

@Route("v0/workspaces/{workspaceId}/decisions")
@Tags("Port Authority")
export class DecisionsController extends Controller {
  /**
   * Evaluate one capability invocation before execution and persist an auditable receipt.
   * This endpoint evaluates policy only. It does not execute the requested action.
   */
  @Post("evaluate")
  @SuccessResponse("200", "Policy decision and receipt")
  @Response<ValidationErrorResponse>(422, "Request validation failed")
  public async evaluate(
    @Path() workspaceId: string,
    @Body() request: EvaluateDecisionRequest,
  ): Promise<DecisionResponse> {
    return portAuthorityService.evaluate(workspaceId, request);
  }
}
