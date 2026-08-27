# AAPI adapter v0: Discord

**Status:** Proposed  
**Owner:** MJ  
**AAPI orientation:** Platform-neutral  
**First implemented adapter and use case:** Discord  
**Repository:** `villagealchemist/series-of-tubes`

## Architectural correction

AAPI is not a Discord-first API.

AAPI is a platform-neutral application and agent programming interface. Its core contracts must remain useful whether the
caller is Discord, an HTTP client, a web form, ChatGPT, an MCP consumer, a scheduled job, a CLI, or an application that
does not use a language model at all.

Discord is the first concrete adapter and the first user-facing use case because it is immediately useful to MJ. It is a
place to validate AAPI against real work, not the center of the architecture and not the source of the API's domain model.

The dependency direction is always:

```text
Discord adapter
  -> AAPI application services and domain contracts
  -> provider ports
  -> OpenAI, persistence, Discord REST, and other external adapters
```

Never:

```text
AAPI core
  -> Discord SDK or Discord-shaped domain assumptions
```

The AAPI core must not import `discord.js`, require guild or channel concepts, encode slash commands in generic request
models, or assume every operation is conversational. Discord-specific identifiers and behavior remain inside the Discord
adapter or explicit source-provenance extensions.

## What AAPI owns

The platform-neutral core owns contracts and policy for:

- Principals and linked external identities.
- Application, project, property, or private scopes.
- Typed invocations and typed results.
- Capability discovery and execution.
- Authorization, approval requirements, and policy decisions.
- Source provenance and external references.
- Auditable action outcomes.
- Durable memory and task abstractions when a capability needs them.
- Ports for model providers, persistence, messaging platforms, and other external systems.

A language-model runtime is one AAPI capability. It is not the whole API. A future lead-ingestion workflow, checkout
workflow, or deterministic application endpoint can use the same identity, policy, scope, provenance, and audit machinery
without pretending to be a chat interaction.

## Why Discord is implemented first

Discord gives the project an available, high-value vertical slice while other planned consumers are blocked or not yet
ready. It exercises several important AAPI concerns immediately:

- External identity mapping.
- Scoped authorization.
- Untrusted inbound content.
- Private versus public response visibility.
- Model-provider orchestration.
- Capability exposure.
- Human approval before writes.
- Provenance and audit records.

Those concerns are useful beyond Discord. Discord's own transport details are not.

## First adapter product contract

The first product built on AAPI is a private Discord concierge for MJ. It should reduce the work of reading, interpreting,
replying to, and organizing Discord without giving a language model unrestricted server administration powers.

The Discord adapter must:

- Work in one explicitly allowlisted Discord server and in direct messages with the bot.
- Accept commands only from MJ's linked and authorized AAPI principal.
- Return private or ephemeral responses by default when Discord supports them.
- Read Discord content only when an explicit command or approved workflow requires it.
- Treat all Discord content as untrusted data, never as application policy or agent instructions.
- Normalize Discord interactions into platform-neutral AAPI capability invocations.
- Render platform-neutral AAPI results back into Discord responses.
- Keep Discord SDK objects entirely outside AAPI domain and application contracts.
- Record auditable metadata without logging raw private message content by default.

## First vertical slice

The first complete path is:

```text
MJ invokes a Discord command
  -> Discord adapter validates source identity and adapter scope
  -> linked AAPI principal is resolved
  -> adapter creates a typed AAPI capability invocation
  -> AAPI authorizes the principal, scope, capability, and requested visibility
  -> the capability service executes through provider ports
  -> AAPI returns a typed result with provenance and audit metadata
  -> Discord adapter renders a private response
```

The same capability service must be invokable later through an HTTP controller, MCP tool, CLI, or another adapter without
receiving a Discord object.

## Initial platform-neutral contracts

The first named contracts should include at least:

```text
AapiPrincipal
AapiExternalIdentity
AapiScope
AapiInvocation<TInput>
AapiResult<TOutput>
AapiCapability
AapiPolicyDecision
AapiApprovalRequirement
AapiSourceReference
AapiAuditEvent
```

An invocation contains generic information such as:

```text
principal
scope
capability name
validated input
source reference
requested response visibility
correlation ID
```

The generic source reference identifies an adapter and an opaque external resource. Discord-specific message, channel,
thread, and guild identifiers live in a Discord source-reference payload owned and validated by the Discord adapter.

## Initial capabilities exercised by Discord

The Discord interface may name these as commands, but AAPI exposes them as reusable capabilities:

```text
agent.respond
content.explain
communication.draft
system.status
```

Examples:

```text
Discord /ask
  -> agent.respond

Discord message action: Explain with AAPI
  -> content.explain

Discord message action: Draft reply with AAPI
  -> communication.draft
```

A future web UI, browser extension, CLI, or ChatGPT tool can invoke the same capabilities with a different source adapter.

## Discord milestone 0

Milestone 0 proves the adapter and core boundary without requiring a database.

### Slash commands

- `/ask question:<text> context:<none|channel>`
  - Invokes `agent.respond`.
  - Optionally includes a bounded recent-message window normalized as untrusted source content.
  - Responds ephemerally in guilds.

- `/aapi-status`
  - Invokes `system.status`.
  - Reports adapter and provider health without exposing secrets or internal prompts.

### Message context commands

- `Explain with AAPI`
  - Invokes `content.explain` with a normalized content item and source reference.
  - Explains meaning, tone, ambiguity, and likely requested action.

- `Draft reply with AAPI`
  - Invokes `communication.draft` with a normalized content item and requested voice profile.
  - Produces a private draft and never sends it automatically.

### Milestone 0 acceptance criteria

- Commands are registered to one development guild.
- Only MJ's linked AAPI principal can invoke them.
- Guild responses are ephemeral by default.
- Discord interactions are converted into named AAPI inputs before application logic runs.
- No AAPI service accepts a `discord.js` type.
- The same capability can be called in a unit test without Discord.
- Trusted policy and untrusted source content are structurally separated.
- Raw Discord content is not written to application logs.
- Long responses are safely split or attached without exceeding Discord limits.
- Errors return a useful private response and a correlation ID.
- Existing static-site behavior and checks remain intact.

## Discord milestone 1

Milestone 1 adds PostgreSQL persistence plus reusable memory, task, and summarization capabilities.

### Additional capabilities

```text
activity.summarize
activity.triage
memory.propose
memory.search
memory.delete
task.propose
task.create
```

### Discord commands and actions

- `/catch-up` invokes `activity.summarize` for a bounded Discord source range.
- `/triage` invokes `activity.triage` and returns private classifications.
- `/remember` invokes `memory.propose`, then requires confirmation before persistence.
- `/forget` invokes `memory.search`, then requires confirmation before deletion.
- `Save as task` invokes `task.propose`, then requires confirmation before `task.create`.
- `Remember this` invokes `memory.propose` for a selected source item.

The memory and task capabilities are not Discord-specific. Their provenance may point back to Discord through an external
source reference.

## Non-goals

- Designing AAPI resources around Discord nouns.
- Treating Discord as the canonical client or transport.
- Assuming every AAPI operation uses OpenAI or any language model.
- A public multi-tenant Discord bot in v0.
- Autonomous moderation.
- Ambient indexing of every accessible Discord message.
- Reproducing ChatGPT's private internal memory.
- Building a generic workflow engine before one real vertical slice works.

## Proposed source boundaries

The existing static site remains in place. Server-side AAPI work begins behind a separate boundary.

```text
src/
  client/
    existing browser code
  server/
    bootstrap.ts
    api/
      controllers/
    aapi/
      domain/
        models/
        policies/
      application/
        services/
      ports/
        model-provider.ts
        persistence.ts
        messaging-platform.ts
    capabilities/
      agent/
      content/
      communication/
      memory/
      tasks/
    adapters/
      discord/
        client.ts
        command-registry.ts
        interaction-router.ts
        source-normalizer.ts
        response-renderer.ts
      openai/
      persistence/
      http/
    repositories/
    observability/
```

The HTTP boundary follows the repository's required TSOA and `Controllers -> Services -> Repositories` architecture.
Discord Gateway handlers are adapter entry points, not controllers. Both boundaries invoke the same AAPI application
services.

## Runtime choices for the first implementation

- TypeScript for all authored executable code.
- Node.js for the Discord Gateway client and server runtime.
- `discord.js` inside the Discord adapter only.
- TSOA and Express for the HTTP API boundary.
- The official OpenAI TypeScript SDK inside an OpenAI provider adapter only.
- Explicit runtime validation at every untrusted adapter boundary.
- PostgreSQL and Kysely beginning when persistence is introduced.
- Structured logging with content redaction.
- Docker as the runtime deployment boundary after local behavior works.

No OpenAI SDK type, Discord SDK type, or database row type may leak into AAPI domain request or response contracts.

## Persistence boundary

The first generic tables should be deliberately small:

```text
principals
external_identities
scopes
memories
tasks
audit_events
```

Adapter-owned persistence may add records such as:

```text
discord_channel_checkpoints
discord_installations
```

Raw Discord messages are not mirrored into PostgreSQL by default. AAPI stores external references, bounded derived data,
explicitly confirmed memories or tasks, checkpoints, and provenance.

## Provider policy

OpenAI is the first model provider used by several capabilities. It is not an AAPI architectural dependency.

- Model access occurs through an AAPI-owned provider port.
- The model ID remains configurable.
- Discord analysis uses the minimum bounded context required for the explicit invocation.
- Secrets and unrelated history are never sent to a model provider.
- Durable AAPI state remains in AAPI-controlled storage.
- A later provider can implement the same port without changing Discord commands or AAPI domain contracts.

## Authorization and tool safety

Authorization is enforced by AAPI policy, not by prompts and not by Discord display names.

1. The Discord adapter validates the installation and source actor.
2. AAPI resolves the linked principal and scope.
3. AAPI authorizes the requested capability.
4. The capability exposes only the provider operations and tools required for that invocation.
5. Tool inputs are independently validated.
6. Writes receive an explicit approval classification.
7. Destructive actions require a separate strong-confirmation flow.
8. Source content can never approve an action or modify policy.
9. Every attempted action receives a content-safe audit event.

Milestone 0 exposes no Discord mutation capabilities.

## Implementation sequence

### Pull request 1: AAPI core boundary and Discord status slice

- Add platform-neutral principal, scope, invocation, result, capability, policy, source-reference, and audit contracts.
- Add provider port boundaries.
- Add a server compiler and scripts without changing static deployment output.
- Add validated environment loading.
- Add TSOA and Express health access to `system.status`.
- Add the Discord adapter bootstrap and development-guild command registration.
- Link MJ's Discord identity to an AAPI principal through development configuration.
- Add `/aapi-status`.
- Add tests proving the core has no Discord dependency.

### Pull request 2: first model-backed capabilities

- Add the OpenAI provider adapter.
- Add `agent.respond`, `content.explain`, and `communication.draft`.
- Add trusted-policy and untrusted-content separation.
- Add `/ask`, `Explain with AAPI`, and `Draft reply with AAPI`.
- Add response chunking and attachment fallback.
- Add mocked adapter and provider failure tests.

### Pull request 3: persistence and concierge capabilities

- Add PostgreSQL, Kysely, migrations, and repository boundaries.
- Add principal and external-identity persistence.
- Add generic memory, task, and audit persistence.
- Add Discord installation and checkpoint persistence in the Discord adapter boundary.
- Add catch-up, triage, remember, forget, and task proposal flows.

### Pull request 4: deployment

- Add Docker build and runtime health checks.
- Add a server deployment target separate from the static Cloudflare site.
- Register production Discord commands only after development behavior is verified.
- Document key rotation, token recovery, provider shutdown, and incident response.

## First human setup step

Create a private Discord application and bot in the Discord Developer Portal. Record the application ID, development guild
ID, MJ's Discord user ID, and bot token. The bot token and model-provider key must remain in a local or deployment secret
store and must never be committed or pasted into issues or pull requests.

This setup creates the first adapter. It does not define AAPI's identity.
