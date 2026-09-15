# ADR 0003: Model providers are optional adapters

- Status: Accepted
- Date: 2026-09-15

## Context

A model can help a person translate natural language into a draft contract, but AAPI must continue to function when no
model provider or credential is configured. Vendor identity does not belong in the domain contract.

## Decision

Contract drafting depends on `ContractProposalProvider`. The default provider is explicitly disabled and returns a clear
unavailable response. Provider-specific SDKs, model identifiers, credentials, request mapping, and response validation stay
inside adapter implementations.

A provider may propose and explain. It may not accept a contract, evaluate authorization, execute a domain command, or
write an enforcement receipt.

## Consequences

- AAPI health, contract discovery, generated documentation, validation, and policy evaluation require no model credential.
- GPT-6 Astra can be added for the challenge without making OpenAI the framework.
- Other hosted or local providers can implement the same boundary later.
- Live-provider failures cannot silently masquerade as deterministic mock output.
