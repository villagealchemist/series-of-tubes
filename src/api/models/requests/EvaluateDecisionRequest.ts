import type { ResourceVisibility } from "../contracts/MccpContract.js";

export interface ActorReference {
  /**
   * Stable actor identifier.
   * @minLength 1
   * @maxLength 128
   */
  id: string;
  /**
   * Workspace in which the actor is currently operating.
   * @minLength 1
   * @maxLength 128
   */
  workspaceId: string;
}

export interface ResourceReference {
  /**
   * Stable resource identifier.
   * @minLength 1
   * @maxLength 256
   */
  id: string;
  /**
   * Workspace that owns the resource.
   * @minLength 1
   * @maxLength 128
   */
  workspaceId: string;
  visibility: ResourceVisibility;
}

export interface EvaluateDecisionRequest {
  actor: ActorReference;
  resource: ResourceReference;
  /**
   * MCCP capability identifier requested by the actor.
   * @minLength 1
   * @maxLength 128
   * @pattern ^[a-z][a-z0-9.]*$
   */
  capabilityId: string;
  /**
   * Human-readable reason for this invocation.
   * @minLength 3
   * @maxLength 1000
   */
  purpose: string;
  /**
   * Caller-generated key used to make evaluation and receipt creation idempotent.
   * @minLength 8
   * @maxLength 128
   * @pattern ^[A-Za-z0-9._:-]+$
   */
  idempotencyKey: string;
}
