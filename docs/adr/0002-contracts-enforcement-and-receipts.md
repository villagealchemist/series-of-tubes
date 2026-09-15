# ADR 0002: Separate semantic contracts, enforcement, and receipts

- Status: Accepted
- Date: 2026-09-15

## Context

Transport metadata alone cannot express the complete meaning of an agent capability. Policy decisions also cannot be
delegated to probabilistic model output without losing auditability.

## Decision

The accepted MCCP registry defines capability semantics independently of REST, MCP, or WebMCP. TSOA projects the HTTP
boundary and generates both OpenAPI and runtime validation from TypeScript source.

Port Authority evaluates an invocation against the accepted contract and workspace boundary before execution. The result
is `ALLOW`, `ASK`, or `DENY`. Every evaluation records an idempotent receipt with the actor, resource, purpose, capability,
decision, reason codes, policy revision, and contract revision.

## Consequences

- Documentation and HTTP validation cannot drift into separate handwritten specifications.
- Cross-workspace access is denied before downstream execution.
- Receipts explain what was decided without claiming that evaluation itself executed an action.
- Durable storage can replace the in-memory repository without changing controller or policy contracts.
