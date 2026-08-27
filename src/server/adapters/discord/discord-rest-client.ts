import type { DiscordMessage } from "./discord-types.js";

const defaultRequestTimeoutMilliseconds = 15_000;

export interface DiscordRestClientConfig {
  readonly botToken: string;
  readonly applicationId: string;
  readonly apiBaseUrl?: string;
  readonly requestTimeoutMilliseconds?: number;
  readonly fetchImplementation?: typeof fetch;
}

export interface DiscordRestClient {
  getChannelMessages(
    channelId: string,
    limit: number,
  ): Promise<readonly DiscordMessage[]>;
  editOriginalInteractionResponse(
    interactionToken: string,
    content: string,
  ): Promise<void>;
}

export function createDiscordRestClient(
  config: DiscordRestClientConfig,
): DiscordRestClient {
  const apiBaseUrl = config.apiBaseUrl ?? "https://discord.com/api/v10";
  const requestTimeoutMilliseconds =
    config.requestTimeoutMilliseconds ?? defaultRequestTimeoutMilliseconds;
  const fetchImplementation = config.fetchImplementation ?? fetch;

  return {
    async getChannelMessages(
      channelId: string,
      limit: number,
    ): Promise<readonly DiscordMessage[]> {
      const response = await fetchImplementation(
        `${apiBaseUrl}/channels/${encodeURIComponent(channelId)}/messages?limit=${limit}`,
        {
          headers: {
            Authorization: `Bot ${config.botToken}`,
          },
          signal: AbortSignal.timeout(requestTimeoutMilliseconds),
        },
      );

      if (!response.ok) {
        throw createDiscordRequestError("message request", response.status);
      }

      const responseText = await response.text();
      const body: unknown = JSON.parse(responseText);
      if (!isUnknownArray(body)) {
        throw new Error("Discord message response must be an array.");
      }

      return body.map(parseDiscordMessage);
    },

    async editOriginalInteractionResponse(
      interactionToken: string,
      content: string,
    ): Promise<void> {
      const response = await fetchImplementation(
        `${apiBaseUrl}/webhooks/${encodeURIComponent(config.applicationId)}/${encodeURIComponent(interactionToken)}/messages/@original`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content,
            allowed_mentions: { parse: [] },
          }),
          signal: AbortSignal.timeout(requestTimeoutMilliseconds),
        },
      );

      if (!response.ok) {
        throw createDiscordRequestError("response update", response.status);
      }
    },
  };
}

function createDiscordRequestError(operation: string, status: number): Error {
  return new Error(`Discord ${operation} failed with status ${status}.`);
}

function parseDiscordMessage(value: unknown): DiscordMessage {
  if (!isRecord(value)) {
    throw new Error("Discord returned an invalid message object.");
  }

  const id = readString(value, "id");
  const content = readString(value, "content");
  const timestamp = readString(value, "timestamp");
  const author = value.author;

  if (!isRecord(author)) {
    throw new Error("Discord message author must be an object.");
  }

  const username = readString(author, "username");
  const globalName = author.global_name;
  const authorLabel =
    typeof globalName === "string" && globalName.length > 0
      ? globalName
      : username;
  const attachments = value.attachments;

  if (!isUnknownArray(attachments)) {
    throw new Error("Discord message attachments must be an array.");
  }

  const attachmentNames = attachments.flatMap((attachment) => {
    if (!isRecord(attachment) || typeof attachment.filename !== "string") {
      return [];
    }
    return [attachment.filename];
  });

  return {
    id,
    content,
    timestamp,
    authorLabel,
    attachmentNames,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function readString(
  value: Readonly<Record<string, unknown>>,
  key: string,
): string {
  const candidate = value[key];
  if (typeof candidate !== "string") {
    throw new Error(`Discord field ${key} must be a string.`);
  }
  return candidate;
}
