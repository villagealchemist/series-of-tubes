# Discord adapter local setup

This is the first implemented adapter for AAPI. It does not define AAPI's core
contracts and it is not the public AAPI HTTP surface.

## What the first slice does

- Accepts signed Discord interactions at `POST /discord/interactions`.
- Answers `/aapi-status` privately.
- Defers `/catch-up` privately, reads a bounded recent message window, maps the
  messages into platform-neutral AAPI context items, and invokes the
  `activity.summarize` capability.
- Uses the OpenAI Responses API through an AAPI-owned provider adapter.
- Keeps provider-side response storage disabled.
- Restricts all commands to one configured Discord user plus explicit server
  and channel allowlists.
- Does not expose Discord mutation tools.

The Node process also exposes `GET /health` for runtime health checks. That
operational route is not the future public AAPI contract. The public HTTP API
still requires TSOA, generated OpenAPI, and the repository's controller,
service, and repository boundaries.

## Discord application setup

1. Create a private Discord application and add its bot user.
2. Enable the Message Content privileged intent. The catch-up capability needs
   readable channel message content.
3. Install the app into the development server with the
   `applications.commands` and `bot` scopes.
4. Grant only `View Channels` and `Read Message History` for the first slice.
5. Copy `.env.discord.example` into a local secret-loading workflow and fill in
   the IDs and secrets. Do not commit the populated file.
6. Register the development-guild commands:

```sh
npm run discord:register
```

7. Start the adapter:

```sh
npm run discord:start
```

8. Expose the local process through a public HTTPS endpoint and configure the
   Discord Interactions Endpoint URL as:

```text
https://your-host.example/discord/interactions
```

Discord validates that URL by sending a signed `PING`. The adapter verifies the
Ed25519 signature before parsing the interaction.

## Environment variables

- `PORT`: Local HTTP port. Defaults to `3000`.
- `AAPI_OWNER_PRINCIPAL_ID`: Platform-neutral AAPI principal ID.
- `AAPI_OWNER_DISCORD_USER_ID`: Only Discord user allowed to invoke commands.
- `AAPI_ALLOWED_GUILD_IDS`: Comma-separated Discord server allowlist.
- `AAPI_ALLOWED_CHANNEL_IDS`: Comma-separated Discord channel allowlist.
- `DISCORD_APPLICATION_ID`: Discord application ID.
- `DISCORD_DEVELOPMENT_GUILD_ID`: Server used for immediate command
  registration.
- `DISCORD_PUBLIC_KEY`: Public key used to verify Discord interaction
  signatures.
- `DISCORD_BOT_TOKEN`: Bot credential used for Discord REST calls.
- `OPENAI_API_KEY`: Model-provider credential.
- `OPENAI_MODEL`: Model ID. Defaults to `gpt-5.6-luna`.

## Verification

```sh
npm run test:aapi
npm run check
```

The AAPI test suite uses fake provider and Discord adapters. It does not call
Discord or OpenAI and does not require credentials.
