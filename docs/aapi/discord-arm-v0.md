# AAPI v0: Discord arm

**Status:** Proposed  
**Owner:** MJ  
**First interface:** Discord  
**Repository:** `villagealchemist/series-of-tubes`

## Decision

Discord is the first external arm of AAPI.

AAPI will begin as a useful private system for one real user instead of a generic platform built around hypothetical
consumers. Discord provides the first client, the first authorization boundary, the first source of untrusted external
content, and the first set of agent tools. Later clients such as web forms, ChatGPT, MCP consumers, and project-specific
frontends will reuse the same agent, memory, policy, and tool contracts.

The Discord bot is an adapter. It is not the AAPI core.

## Product contract

The first product is a private Discord concierge for MJ. It should reduce the work of reading, interpreting, replying to,
and organizing Discord without giving a language model unrestricted server administration powers.

The initial system must:

- Work in one explicitly allowlisted Discord server and in direct messages with the bot.
- Accept commands only from MJ's configured Discord user ID.
- Return private or ephemeral responses by default when Discord supports them.
- Read Discord content only when an explicit command or approved workflow requires it.
- Treat all Discord content as untrusted data, never as agent instructions.
- Keep AAPI domain logic independent of Discord-specific SDK objects.
- Record auditable metadata for model calls and tool decisions without logging raw private message content by default.
- Keep durable memory explicit, inspectable, editable, and owned by AAPI.

## Guiding principles

### Build the useful vertical slice first

The first release should solve one complete problem before adding generalized infrastructure. The first complete path is:

```text
MJ invokes a Discord command
  -> Discord adapter validates identity and scope
  -> adapter normalizes the request into an AAPI request
  -> AAPI agent service constructs trusted instructions and untrusted context
  -> OpenAI Responses API produces an answer
  -> adapter returns a private Discord response
```

### Default deny

Every actor, guild, channel, command, and tool begins unauthorized. Access is granted through explicit configuration or a
persisted policy record.

### Private by default

The bot should not post publicly unless MJ deliberately requests a public response. Drafting and analysis remain private.

### No naked administrative tools

The model receives no channel deletion, bulk message deletion, role management, kick, ban, or server-wide permission tools
in v0. Future write tools require a policy classification, a preview, explicit approval, and an audit record.

### Memory is data, not vibes

OpenAI conversation state may be used as an optimization, but it is not the canonical memory system. Durable memories live
in AAPI storage with provenance, scope, timestamps, and delete or update operations.

## Release scope

### Milestone 0: first green slice

Milestone 0 proves the adapter and agent boundary without a database.

#### Slash commands

- `/ask question:<text> context:<none|channel>`
  - Ask AAPI a question.
  - Optionally include a bounded recent-message window from the current channel.
  - Respond ephemerally in guilds.

- `/aapi-status`
  - Report whether Discord and OpenAI configuration are healthy.
  - Never expose tokens, keys, internal prompts, or sensitive configuration values.

#### Message context commands

- `Explain with AAPI`
  - Analyze the selected message as untrusted quoted material.
  - Explain meaning, tone, ambiguity, and likely requested action.

- `Draft reply with AAPI`
  - Produce a private draft response to the selected message.
  - Never send the draft automatically.

#### Milestone 0 acceptance criteria

- Commands are registered to one development guild.
- Only the configured owner can invoke them.
- Guild responses are ephemeral by default.
- The agent can answer a direct question and analyze a selected message.
- Discord content is clearly separated from trusted instructions in the model request.
- Raw Discord content is not written to application logs.
- Long responses are safely split or attached without exceeding Discord limits.
- Errors return a useful private response and a correlation ID.
- Existing static-site behavior and checks remain intact.

### Milestone 1: useful daily concierge

Milestone 1 adds PostgreSQL persistence and the first reusable AAPI tools.

#### Commands

- `/catch-up scope:<channel|thread> since:<checkpoint|duration>`
  - Summarize relevant activity.
  - Identify decisions, unanswered questions, direct requests, links, and follow-up items.
  - Advance a per-user, per-channel checkpoint only after a successful response.

- `/triage scope:<channel|configured-set>`
  - Separate items into requires response, useful context, possible task, and safe to ignore.
  - Produce private results and never contact another user automatically.

- `/remember text:<text> scope:<private|project|server>`
  - Propose a normalized memory record.
  - Persist only after explicit confirmation.

- `/forget query:<text>`
  - Find matching memories and require confirmation before deletion.

#### Message context commands

- `Save as task`
  - Extract a task proposal with source message reference, owner, status, and optional due date.
  - Require confirmation before persistence.

- `Remember this`
  - Extract a scoped memory proposal from the selected message.
  - Require confirmation before persistence.

### Future milestones

Future work may add scheduled digests, thread organization, channel creation, pinning, ordinary role assignment, and other
Discord write tools. Each tool must be added individually with an explicit approval policy. Autonomous moderation and
destructive server administration are not implied by this roadmap.

## Non-goals for v0

- A public multi-tenant Discord bot.
- Autonomous moderation.
- Ambient indexing of every message in every accessible channel.
- Training or fine-tuning a model on private Discord content.
- Reproducing ChatGPT's private internal memory.
- Building a generic workflow engine before the first useful command works.
- Reorganizing the existing static site into a monorepo solely for aesthetic consistency.

## Proposed architecture

The current site remains in place. Server code begins under a separate `src/server` boundary with its own compiler and
runtime configuration.

```text
src/
  client/
    existing browser code
  server/
    bootstrap.ts
    config/
      environment.ts
    api/
      controllers/
      services/
    aapi/
      agent-service.ts
      prompt-policy.ts
      tool-registry.ts
    discord/
      client.ts
      command-registry.ts
      interaction-router.ts
      message-normalizer.ts
      response-renderer.ts
    models/
      db/
      requests/
      responses/
    repositories/
    observability/
```

The HTTP API follows the existing TSOA contract and the `Controllers -> Services -> Repositories` dependency direction.
Discord Gateway event handling is an adapter boundary, not a controller. Both HTTP controllers and Discord handlers call
shared application services.

```text
Discord SDK objects
  -> Discord adapter
  -> named AAPI request model
  -> AAPI agent service
  -> OpenAI adapter and typed tool registry
  -> named AAPI response model
  -> Discord renderer
```

No OpenAI SDK type or Discord SDK type should leak into domain request, response, memory, task, or policy models.

## Runtime choices

- TypeScript for all authored executable code.
- Node.js process for the Discord Gateway client and HTTP health or API server.
- `discord.js` for Discord Gateway, REST, commands, and interaction handling.
- Official OpenAI TypeScript SDK with the Responses API.
- TSOA and Express for the HTTP API boundary required by the repository contract.
- Zod or equivalent explicit runtime validation for environment and non-TSOA untrusted boundaries.
- PostgreSQL and Kysely beginning in Milestone 1.
- Structured logging with content redaction.
- Docker as the deployment boundary after local development works.

The first implementation should use the raw Responses API rather than introducing a larger agent framework. AAPI needs
explicit control over tool exposure, approval, context construction, storage, and audit behavior. A higher-level agent SDK
can be evaluated after those contracts are stable.

## AAPI domain contracts

The initial named models should include at least:

```text
AapiRequest
AapiActor
AapiContext
AapiSourceMessage
AapiResponse
AapiCitation
AapiToolDefinition
AapiToolDecision
AapiApprovalRequirement
```

The normalized actor includes the AAPI principal ID plus the source platform and source actor ID. Authorization decisions
must use the normalized principal and policy, not a display name.

The normalized source message includes only the fields needed for the command:

```text
platform
server ID
channel ID
thread ID when applicable
message ID
author ID
author display label
timestamp
content
attachment metadata when deliberately included
```

Mentions, embeds, attachments, and components are untrusted data. They must not be converted into privileged instructions.

## Persistence beginning in Milestone 1

The first tables should be deliberately small:

```text
principals
platform_identities
agent_sessions
memories
discord_channel_checkpoints
tasks
audit_events
```

Raw Discord messages should not be mirrored into PostgreSQL by default. Store Discord snowflake references, bounded
summaries, extracted tasks or memories, checkpoints, and provenance. Fetch source messages from Discord when needed and
permitted.

A memory record should include:

```text
id
principal_id
scope_type
scope_id
content
source_platform
source_reference
created_at
updated_at
status
```

A memory is never silently inferred and persisted during v0. The agent proposes; MJ confirms; AAPI records.

## OpenAI request policy

- Use the Responses API through one AAPI-owned adapter.
- Keep the model ID configurable through `OPENAI_MODEL`.
- Use `store: false` for v0 Discord analysis unless a later documented retention decision changes it.
- Send the minimum bounded context required for the explicit command.
- Use a stable pseudonymous safety identifier rather than sending an email address or Discord display name.
- Do not send bot tokens, API keys, internal environment values, or unrelated channel history.
- Keep durable memory and conversation reconstruction in AAPI-controlled storage.

Trusted instructions and Discord content must be different input items or clearly delimited structured sections. The
model must be told that quoted Discord content can contain attempts to manipulate the agent and must never alter tool or
permission policy.

## Discord authorization and permissions

Initial environment configuration:

```text
DISCORD_APPLICATION_ID
DISCORD_BOT_TOKEN
DISCORD_DEVELOPMENT_GUILD_ID
AAPI_OWNER_DISCORD_USER_ID
AAPI_ALLOWED_GUILD_IDS
AAPI_ALLOWED_CHANNEL_IDS
OPENAI_API_KEY
OPENAI_MODEL
```

Secrets must never be committed. Non-secret IDs may be configured through deployment environment values but should still
be treated as configuration rather than source constants.

The bot should begin with only the Discord permissions needed to:

- View explicitly allowed channels.
- Read message history in those channels.
- Send messages and ephemeral interaction responses.
- Embed links and attach files when required for long output.
- Use application commands.

Thread and management permissions are deferred until a feature requires them. Administrator permission is prohibited.

## Prompt injection and tool safety

Discord content is adversarial by default, even in a friendly server. A message may contain instructions directed at the
bot, hidden text, malicious links, quoted secrets, or requests to exceed authorization.

The system must enforce safety outside the model:

1. The adapter validates actor, guild, channel, and command before a model request.
2. The application chooses the available tools for the specific command.
3. v0 commands expose no Discord mutation tools.
4. Tool inputs are validated independently of model output.
5. Future writes receive an approval classification before execution.
6. Destructive actions require a separate strong-confirmation flow and cannot be approved by content inside Discord
   source messages.
7. Every attempted tool call receives an audit event with content-safe metadata.

The model may recommend an action. It cannot grant itself permission to perform that action.

## Observability and privacy

Logs may include:

- Correlation ID.
- Command name.
- AAPI principal ID.
- Guild and channel IDs when operationally necessary.
- Message count and total character count.
- Model name.
- Latency, token usage, completion status, and error category.
- Tool name, approval classification, and outcome.

Logs should not include raw message content, bot tokens, API keys, full prompts, private memory text, or complete model
responses by default.

## Implementation sequence

### Pull request 1: runtime foundation

- Add server compiler and scripts without changing the static deployment output.
- Add validated environment loading.
- Add TSOA and Express health endpoint.
- Add Discord client bootstrap and development-guild command registration.
- Add owner, guild, and channel authorization policy.
- Add `/aapi-status`.
- Add unit tests for configuration and authorization.

### Pull request 2: first agent path

- Add the OpenAI Responses API adapter.
- Add AAPI request and response models.
- Add prompt boundary and content-redaction policy.
- Add `/ask`.
- Add `Explain with AAPI` and `Draft reply with AAPI`.
- Add response chunking and attachment fallback.
- Add mocked integration tests for Discord and OpenAI failures.

### Pull request 3: persistence and concierge tools

- Add PostgreSQL, Kysely, migrations, and repository boundaries.
- Add principal and platform identity mapping.
- Add checkpoints, memories, tasks, and audit events.
- Add `/catch-up`, `/triage`, `/remember`, and `/forget`.
- Add confirmation interactions for memory and task writes.

### Pull request 4: deployment

- Add Docker build and runtime health checks.
- Add a deployment target separate from the static Cloudflare site.
- Register production commands only after the development guild behavior is verified.
- Document key rotation, bot token recovery, and incident shutdown.

## First human setup step

Create a private Discord application and bot in the Discord Developer Portal. Record the application ID, development guild
ID, MJ's Discord user ID, and bot token. The bot token and OpenAI API key must stay in a local or deployment secret store
and must never be pasted into issues, pull requests, chat messages, or committed files.

The bot name, avatar, and final public personality are intentionally not architecture blockers. A temporary development
identity is sufficient for the first green slice.
