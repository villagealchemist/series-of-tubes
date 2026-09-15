# ADR 0001: Start AAPI as a modular monolith

- Status: Accepted
- Date: 2026-09-15

## Context

AAPI needs one dependable place for contracts, policy, receipts, domain commands, and transport adapters. Splitting these
responsibilities into networked services before the boundaries are proven would add deployment and consistency problems
without improving the first product slice.

## Decision

AAPI starts as a strict TypeScript modular monolith. HTTP controllers own transport concerns, services own orchestration
and policy, and repositories own persistence. Modules communicate through typed interfaces rather than reaching into one
another's storage.

The existing static site remains a separate build and deployment boundary inside the repository.

## Consequences

- Domain behavior can be reused by REST, MCP, and WebMCP adapters.
- Tests can prove adapter parity without a distributed system.
- A module can be extracted later only when its runtime or ownership requirements justify the cost.
- The API is not deployed by the existing Wrangler static-site command.
