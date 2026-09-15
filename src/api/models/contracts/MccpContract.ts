export type CapabilityEffect = "read" | "write" | "external";
export type ResourceVisibility = "public" | "workspace" | "private";

export interface MccpCapabilityContract {
  /** Stable semantic identifier used by every transport projection. */
  id: string;
  title: string;
  description: string;
  effect: CapabilityEffect;
  allowedResourceVisibilities: readonly ResourceVisibility[];
  requiresHumanApproval: boolean;
}

export interface MccpContractManifest {
  protocol: "MCCP";
  revision: string;
  description: string;
  capabilities: readonly MccpCapabilityContract[];
  projections: readonly ("REST" | "MCP" | "WebMCP")[];
}
