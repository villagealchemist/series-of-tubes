import type {
  MccpCapabilityContract,
  MccpContractManifest,
} from "../models/contracts/MccpContract.js";

export const MCCP_CONTRACT_REGISTRY: MccpContractManifest = {
  protocol: "MCCP",
  revision: "2026-09-15.1",
  description:
    "MCP defines communication. MCCP defines the semantic capability contract.",
  capabilities: [
    {
      id: "context.read",
      title: "Read governed context",
      description:
        "Read public or workspace-scoped context inside the active workspace.",
      effect: "read",
      allowedResourceVisibilities: ["public", "workspace"],
      requiresHumanApproval: false,
    },
    {
      id: "context.write",
      title: "Write governed context",
      description:
        "Propose a write to workspace-scoped context. Human approval is required before execution.",
      effect: "write",
      allowedResourceVisibilities: ["workspace"],
      requiresHumanApproval: true,
    },
    {
      id: "external.message.send",
      title: "Send an external message",
      description:
        "Propose sending content outside the workspace. Human approval is required before execution.",
      effect: "external",
      allowedResourceVisibilities: ["workspace"],
      requiresHumanApproval: true,
    },
  ],
  projections: ["REST", "MCP", "WebMCP"],
};

export function findCapabilityContract(
  capabilityId: string,
): MccpCapabilityContract | undefined {
  return MCCP_CONTRACT_REGISTRY.capabilities.find(
    (capability) => capability.id === capabilityId,
  );
}
