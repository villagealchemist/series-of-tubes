# Discord adapter preflight

Run this after creating the private Discord application and exporting the local runtime environment variables described in
`discord-local-setup.md`.

```sh
npm run discord:doctor
```

The preflight performs no model inference. It checks:

- Discord identifier and public-key formats.
- The application ID and bot token against Discord.
- Access to the configured development and allowlisted guilds.
- Access to each allowlisted channel.
- Availability of the configured OpenAI model for the supplied API key.

The command reports `PASS` or `FAIL` for each boundary. It does not print bot tokens, API keys, or upstream response
bodies. A failed check exits nonzero so it can also be used in a local setup script.

After all checks pass, register the development-guild commands and start the adapter:

```sh
npm run discord:register
npm run discord:start
```

Keep runtime secrets outside the repository. A keychain-backed environment or a mode-`0600` file under the user's home
configuration directory is preferable to a populated environment file inside the checkout.
