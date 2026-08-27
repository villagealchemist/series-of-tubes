import {
  loadDiscordRegistrationConfig,
  loadDiscordRuntimeConfig,
  type DiscordRegistrationConfig,
  type DiscordRuntimeConfig,
} from "../../config/environment.js";

const discordApiBaseUrl = "https://discord.com/api/v10";
const openAiApiBaseUrl = "https://api.openai.com/v1";
const requestTimeoutMilliseconds = 15_000;
const snowflakePattern = /^\d{17,20}$/u;
const publicKeyPattern = /^[0-9a-f]{64}$/iu;

export interface DiscordDoctorConfig {
  readonly runtime: DiscordRuntimeConfig;
  readonly registration: DiscordRegistrationConfig;
}

export interface DoctorCheck {
  readonly name: string;
  readonly passed: boolean;
  readonly detail: string;
}

export interface DiscordDoctorDependencies {
  readonly fetchImplementation?: typeof fetch;
}

export async function diagnoseDiscordRuntime(
  config: DiscordDoctorConfig,
  dependencies: DiscordDoctorDependencies = {},
): Promise<readonly DoctorCheck[]> {
  const fetchImplementation = dependencies.fetchImplementation ?? fetch;
  const checks: DoctorCheck[] = [];

  checks.push(
    runLocalCheck("Discord identifiers", () => {
      assertSnowflake(config.runtime.discordApplicationId, "application ID");
      assertSnowflake(config.runtime.ownerDiscordUserId, "owner user ID");
      assertSnowflake(
        config.registration.developmentGuildId,
        "development guild ID",
      );
      for (const guildId of config.runtime.allowedGuildIds) {
        assertSnowflake(guildId, "allowed guild ID");
      }
      for (const channelId of config.runtime.allowedChannelIds) {
        assertSnowflake(channelId, "allowed channel ID");
      }
    }),
    runLocalCheck("Discord public key", () => {
      if (!publicKeyPattern.test(config.runtime.discordPublicKey)) {
        throw new Error("must contain exactly 64 hexadecimal characters");
      }
    }),
  );

  checks.push(
    await runRemoteCheck("Discord application and bot token", async () => {
      const application = await requestJson(
        `${discordApiBaseUrl}/oauth2/applications/@me`,
        {
          headers: discordHeaders(config.runtime.discordBotToken),
        },
        fetchImplementation,
        "Discord",
      );
      assertRecordId(
        application,
        config.runtime.discordApplicationId,
        "Discord application",
      );
    }),
  );

  checks.push(
    await runRemoteCheck("Discord development guild", async () => {
      const guild = await requestJson(
        `${discordApiBaseUrl}/guilds/${encodeURIComponent(config.registration.developmentGuildId)}`,
        {
          headers: discordHeaders(config.runtime.discordBotToken),
        },
        fetchImplementation,
        "Discord",
      );
      assertRecordId(
        guild,
        config.registration.developmentGuildId,
        "Discord guild",
      );
    }),
  );

  for (const guildId of config.runtime.allowedGuildIds) {
    checks.push(
      await runRemoteCheck(`Allowed Discord guild ${guildId}`, async () => {
        const guild = await requestJson(
          `${discordApiBaseUrl}/guilds/${encodeURIComponent(guildId)}`,
          {
            headers: discordHeaders(config.runtime.discordBotToken),
          },
          fetchImplementation,
          "Discord",
        );
        assertRecordId(guild, guildId, "Discord guild");
      }),
    );
  }

  for (const channelId of config.runtime.allowedChannelIds) {
    checks.push(
      await runRemoteCheck(`Allowed Discord channel ${channelId}`, async () => {
        const channel = await requestJson(
          `${discordApiBaseUrl}/channels/${encodeURIComponent(channelId)}`,
          {
            headers: discordHeaders(config.runtime.discordBotToken),
          },
          fetchImplementation,
          "Discord",
        );
        assertRecordId(channel, channelId, "Discord channel");
        assertChannelGuildIsAllowed(channel, config.runtime.allowedGuildIds);
      }),
    );
  }

  checks.push(
    await runRemoteCheck(`OpenAI model ${config.runtime.openAiModel}`, async () => {
      const model = await requestJson(
        `${openAiApiBaseUrl}/models/${encodeURIComponent(config.runtime.openAiModel)}`,
        {
          headers: {
            Authorization: `Bearer ${config.runtime.openAiApiKey}`,
          },
        },
        fetchImplementation,
        "OpenAI",
      );
      assertRecordId(model, config.runtime.openAiModel, "OpenAI model");
    }),
  );

  return checks;
}

function runLocalCheck(name: string, check: () => void): DoctorCheck {
  try {
    check();
    return { name, passed: true, detail: "ok" };
  } catch (error: unknown) {
    return { name, passed: false, detail: readErrorMessage(error) };
  }
}

async function runRemoteCheck(
  name: string,
  check: () => Promise<void>,
): Promise<DoctorCheck> {
  try {
    await check();
    return { name, passed: true, detail: "ok" };
  } catch (error: unknown) {
    return { name, passed: false, detail: readErrorMessage(error) };
  }
}

async function requestJson(
  url: string,
  init: RequestInit,
  fetchImplementation: typeof fetch,
  provider: string,
): Promise<unknown> {
  const response = await fetchImplementation(url, {
    ...init,
    signal: AbortSignal.timeout(requestTimeoutMilliseconds),
  });

  if (!response.ok) {
    const requestId = response.headers.get("x-request-id");
    const requestContext = requestId === null ? "" : ` Request ID: ${requestId}.`;
    throw new Error(
      `${provider} preflight failed with status ${response.status}.${requestContext}`,
    );
  }

  const body: unknown = await response.json();
  return body;
}

function discordHeaders(botToken: string): Readonly<Record<string, string>> {
  return { Authorization: `Bot ${botToken}` };
}

function assertSnowflake(value: string, label: string): void {
  if (!snowflakePattern.test(value)) {
    throw new Error(`${label} must be a Discord snowflake`);
  }
}

function assertRecordId(value: unknown, expected: string, label: string): void {
  if (!isRecord(value) || value.id !== expected) {
    throw new Error(`${label} did not match the configured ID`);
  }
}

function assertChannelGuildIsAllowed(
  value: unknown,
  allowedGuildIds: ReadonlySet<string>,
): void {
  if (!isRecord(value)) {
    throw new Error("Discord channel response was invalid");
  }

  const guildId = value.guild_id;
  if (typeof guildId === "string" && !allowedGuildIds.has(guildId)) {
    throw new Error("Discord channel belongs to a guild outside the allowlist");
  }
}

function readErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "unknown failure";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function main(): Promise<void> {
  const config: DiscordDoctorConfig = {
    runtime: loadDiscordRuntimeConfig(),
    registration: loadDiscordRegistrationConfig(),
  };
  const checks = await diagnoseDiscordRuntime(config);

  for (const check of checks) {
    const marker = check.passed ? "PASS" : "FAIL";
    console.log(`${marker} ${check.name}: ${check.detail}`);
  }

  if (checks.some((check) => !check.passed)) {
    process.exitCode = 1;
  }
}

try {
  await main();
} catch (error: unknown) {
  console.error(`FAIL configuration: ${readErrorMessage(error)}`);
  process.exitCode = 1;
}
