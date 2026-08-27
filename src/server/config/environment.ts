export interface DiscordRuntimeConfig {
  readonly port: number;
  readonly ownerPrincipalId: string;
  readonly ownerDiscordUserId: string;
  readonly allowedGuildIds: ReadonlySet<string>;
  readonly allowedChannelIds: ReadonlySet<string>;
  readonly discordApplicationId: string;
  readonly discordBotToken: string;
  readonly discordPublicKey: string;
  readonly openAiApiKey: string;
  readonly openAiModel: string;
}

export interface DiscordRegistrationConfig {
  readonly discordApplicationId: string;
  readonly discordBotToken: string;
  readonly developmentGuildId: string;
}

export function loadDiscordRuntimeConfig(
  environment: NodeJS.ProcessEnv = process.env,
): DiscordRuntimeConfig {
  return {
    port: readPort(environment.PORT),
    ownerPrincipalId:
      readOptional(environment.AAPI_OWNER_PRINCIPAL_ID) ?? "principal:mj",
    ownerDiscordUserId: readRequired(
      environment,
      "AAPI_OWNER_DISCORD_USER_ID",
    ),
    allowedGuildIds: readCsvSet(
      readRequired(environment, "AAPI_ALLOWED_GUILD_IDS"),
    ),
    allowedChannelIds: readCsvSet(
      readRequired(environment, "AAPI_ALLOWED_CHANNEL_IDS"),
    ),
    discordApplicationId: readRequired(
      environment,
      "DISCORD_APPLICATION_ID",
    ),
    discordBotToken: readRequired(environment, "DISCORD_BOT_TOKEN"),
    discordPublicKey: readRequired(environment, "DISCORD_PUBLIC_KEY"),
    openAiApiKey: readRequired(environment, "OPENAI_API_KEY"),
    openAiModel:
      readOptional(environment.OPENAI_MODEL) ?? "gpt-5.6-luna",
  };
}

export function loadDiscordRegistrationConfig(
  environment: NodeJS.ProcessEnv = process.env,
): DiscordRegistrationConfig {
  return {
    discordApplicationId: readRequired(
      environment,
      "DISCORD_APPLICATION_ID",
    ),
    discordBotToken: readRequired(environment, "DISCORD_BOT_TOKEN"),
    developmentGuildId: readRequired(
      environment,
      "DISCORD_DEVELOPMENT_GUILD_ID",
    ),
  };
}

function readRequired(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = readOptional(environment[name]);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed;
}

function readCsvSet(value: string): ReadonlySet<string> {
  const entries = value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  if (entries.length === 0) {
    throw new Error("An AAPI allowlist cannot be empty.");
  }

  return new Set(entries);
}

function readPort(value: string | undefined): number {
  if (value === undefined) return 3000;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  return port;
}
