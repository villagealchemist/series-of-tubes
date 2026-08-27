import { randomUUID } from "node:crypto";

import {
  summarizeActivity,
  type ActivitySummaryDependencies,
  type ActivitySummaryInput,
} from "../../aapi/activity-summary.js";
import type {
  AapiContextItem,
  AapiInvocation,
  AapiPrincipal,
  AapiSourceReference,
} from "../../aapi/models.js";
import { renderActivitySummary } from "./activity-renderer.js";
import type { DiscordRestClient } from "./discord-rest-client.js";
import type {
  DiscordInteractionPlan,
  DiscordInteractionResponse,
  DiscordMessage,
} from "./discord-types.js";

const interactionTypePing = 1;
const interactionTypeApplicationCommand = 2;
const responseTypePong = 1;
const responseTypeChannelMessage = 4;
const responseTypeDeferredChannelMessage = 5;
const ephemeralFlag = 64;
const maxContextCharacters = 60_000;
const truncationMarker = "\n[message truncated]";

export interface DiscordInteractionHandlerConfig {
  readonly ownerPrincipalId: string;
  readonly ownerDiscordUserId: string;
  readonly allowedGuildIds: ReadonlySet<string>;
  readonly allowedChannelIds: ReadonlySet<string>;
}

export interface DiscordInteractionHandlerDependencies extends ActivitySummaryDependencies {
  readonly discordRestClient: DiscordRestClient;
}

export function planDiscordInteraction(
  payload: unknown,
  config: DiscordInteractionHandlerConfig,
  dependencies: DiscordInteractionHandlerDependencies,
): DiscordInteractionPlan {
  if (!isRecord(payload)) {
    return immediatePrivateMessage("Discord sent an invalid interaction.");
  }

  const interactionType = payload.type;
  if (interactionType === interactionTypePing) {
    return { response: { type: responseTypePong } };
  }

  if (interactionType !== interactionTypeApplicationCommand) {
    return immediatePrivateMessage(
      "That Discord interaction is not supported.",
    );
  }

  const actorId = readActorId(payload);
  if (actorId !== config.ownerDiscordUserId) {
    return immediatePrivateMessage("This AAPI arm is private.");
  }

  const guildId = readOptionalString(payload, "guild_id");
  const channelId = readOptionalString(payload, "channel_id");

  if (!isAllowed(guildId, config.allowedGuildIds)) {
    return immediatePrivateMessage("This Discord server is not authorized.");
  }

  if (!isAllowed(channelId, config.allowedChannelIds)) {
    return immediatePrivateMessage("This Discord channel is not authorized.");
  }

  const data = payload.data;
  if (!isRecord(data) || typeof data.name !== "string") {
    return immediatePrivateMessage("Discord command data was invalid.");
  }

  if (data.name === "aapi-status") {
    return immediatePrivateMessage(
      "AAPI is awake. Discord is connected as its first adapter.",
    );
  }

  if (data.name !== "catch-up") {
    return immediatePrivateMessage("That AAPI command is not registered.");
  }

  const interactionToken = readOptionalString(payload, "token");
  if (channelId === undefined || interactionToken === undefined) {
    return immediatePrivateMessage(
      "Discord did not provide the channel or interaction token.",
    );
  }

  const limit = readLimit(data);
  const principal: AapiPrincipal = {
    id: config.ownerPrincipalId,
    externalIdentity: {
      provider: "discord",
      subject: actorId,
    },
  };
  const source = createDiscordSourceReference(channelId, guildId);

  return {
    response: {
      type: responseTypeDeferredChannelMessage,
      data: { flags: ephemeralFlag },
    },
    afterResponse: async (): Promise<void> => {
      const correlationId = randomUUID();

      try {
        const messages =
          await dependencies.discordRestClient.getChannelMessages(
            channelId,
            limit,
          );
        const items = normalizeMessages(messages, source);
        const invocation: AapiInvocation<ActivitySummaryInput> = {
          correlationId,
          principal,
          scope: {
            id: `discord:${guildId ?? "dm"}:${channelId}`,
            kind: "external-resource",
          },
          capability: "activity.summarize",
          input: {
            items,
            audience: "MJ",
            objective:
              "Explain what happened, what needs attention, what was decided, and what can be ignored.",
          },
          source,
        };
        const result = await summarizeActivity(invocation, dependencies);
        await dependencies.discordRestClient.editOriginalInteractionResponse(
          interactionToken,
          renderActivitySummary(result.output),
        );
      } catch (error: unknown) {
        console.error(`AAPI catch-up failed [${correlationId}].`, error);
        await dependencies.discordRestClient.editOriginalInteractionResponse(
          interactionToken,
          `AAPI could not complete this catch-up. Reference: ${correlationId}`,
        );
      }
    },
  };
}

function immediatePrivateMessage(content: string): DiscordInteractionPlan {
  const response: DiscordInteractionResponse = {
    type: responseTypeChannelMessage,
    data: {
      content,
      flags: ephemeralFlag,
      allowed_mentions: { parse: [] },
    },
  };
  return { response };
}

function normalizeMessages(
  messages: readonly DiscordMessage[],
  source: AapiSourceReference,
): readonly AapiContextItem[] {
  const selectedNewestFirst: AapiContextItem[] = [];
  let remainingCharacters = maxContextCharacters;

  for (const message of messages) {
    const normalized = normalizeMessage(message, source);
    if (normalized.content.length === 0) continue;
    if (remainingCharacters <= 0) break;

    if (normalized.content.length <= remainingCharacters) {
      selectedNewestFirst.push(normalized);
      remainingCharacters -= normalized.content.length;
      continue;
    }

    if (selectedNewestFirst.length === 0) {
      selectedNewestFirst.push({
        ...normalized,
        content: truncateContent(normalized.content, remainingCharacters),
      });
    }
    break;
  }

  return selectedNewestFirst.reverse();
}

function normalizeMessage(
  message: DiscordMessage,
  source: AapiSourceReference,
): AapiContextItem {
  const attachmentContext = message.attachmentNames
    .map((name) => `[attachment: ${name}]`)
    .join(" ");
  const content = [message.content, attachmentContext]
    .filter((part) => part.length > 0)
    .join("\n");

  return {
    id: message.id,
    authorLabel: message.authorLabel,
    occurredAt: message.timestamp,
    content,
    source: {
      provider: source.provider,
      resourceType: "message",
      resourceId: message.id,
      parentResourceId: source.resourceId,
    },
  };
}

function truncateContent(content: string, limit: number): string {
  if (content.length <= limit) return content;
  if (limit <= truncationMarker.length) return content.slice(0, limit);

  return (
    content.slice(0, limit - truncationMarker.length) + truncationMarker
  );
}

function createDiscordSourceReference(
  channelId: string,
  guildId: string | undefined,
): AapiSourceReference {
  if (guildId === undefined) {
    return {
      provider: "discord",
      resourceType: "channel",
      resourceId: channelId,
    };
  }

  return {
    provider: "discord",
    resourceType: "channel",
    resourceId: channelId,
    parentResourceId: guildId,
  };
}

function isAllowed(
  value: string | undefined,
  allowlist: ReadonlySet<string>,
): boolean {
  return value !== undefined && allowlist.has(value);
}

function readActorId(payload: Readonly<Record<string, unknown>>): string {
  const member = payload.member;
  if (isRecord(member) && isRecord(member.user)) {
    return readString(member.user, "id");
  }

  const user = payload.user;
  if (isRecord(user)) {
    return readString(user, "id");
  }

  return "";
}

function readLimit(data: Readonly<Record<string, unknown>>): number {
  const options = data.options;
  if (!isUnknownArray(options)) return 50;

  for (const option of options) {
    if (
      isRecord(option) &&
      option.name === "limit" &&
      typeof option.value === "number" &&
      Number.isInteger(option.value)
    ) {
      return Math.max(10, Math.min(100, option.value));
    }
  }

  return 50;
}

function readOptionalString(
  value: Readonly<Record<string, unknown>>,
  key: string,
): string | undefined {
  const candidate = value[key];
  return typeof candidate === "string" && candidate.length > 0
    ? candidate
    : undefined;
}

function readString(
  value: Readonly<Record<string, unknown>>,
  key: string,
): string {
  return readOptionalString(value, key) ?? "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
