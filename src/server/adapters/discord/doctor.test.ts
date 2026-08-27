import assert from "node:assert/strict";
import test from "node:test";

import type {
  DiscordRegistrationConfig,
  DiscordRuntimeConfig,
} from "../../config/environment.js";
import {
  diagnoseDiscordRuntime,
  type DiscordDoctorConfig,
} from "./doctor.js";

const applicationId = "123456789012345678";
const ownerUserId = "223456789012345678";
const guildId = "323456789012345678";
const channelId = "423456789012345678";

await test("doctor verifies Discord resources and the configured OpenAI model", async () => {
  const requestedUrls: string[] = [];
  const checks = await diagnoseDiscordRuntime(createConfig(), {
    fetchImplementation(input) {
      const url = String(input);
      requestedUrls.push(url);

      if (url.endsWith("/oauth2/applications/@me")) {
        return Promise.resolve(jsonResponse({ id: applicationId }));
      }
      if (url.endsWith(`/guilds/${guildId}`)) {
        return Promise.resolve(jsonResponse({ id: guildId }));
      }
      if (url.endsWith(`/channels/${channelId}`)) {
        return Promise.resolve(
          jsonResponse({ id: channelId, guild_id: guildId }),
        );
      }
      if (url.endsWith("/models/gpt-5-mini")) {
        return Promise.resolve(jsonResponse({ id: "gpt-5-mini" }));
      }

      return Promise.resolve(new Response(null, { status: 404 }));
    },
  });

  assert.equal(checks.every((check) => check.passed), true);
  assert.equal(requestedUrls.some((url) => url.includes("secret")), false);
});

await test("doctor reports remote failures without echoing response bodies", async () => {
  const checks = await diagnoseDiscordRuntime(createConfig(), {
    fetchImplementation(input) {
      const url = String(input);
      if (url.endsWith("/models/gpt-5-mini")) {
        return Promise.resolve(
          new Response("private upstream body", {
            status: 404,
            headers: { "x-request-id": "req_doctor" },
          }),
        );
      }

      const id = readLastPathSegment(url);
      const body = url.includes("/channels/")
        ? { id, guild_id: guildId }
        : { id: url.endsWith("/oauth2/applications/@me") ? applicationId : id };
      return Promise.resolve(jsonResponse(body));
    },
  });

  const modelCheck = checks.find((check) => check.name.startsWith("OpenAI"));
  assert.equal(modelCheck?.passed, false);
  assert.match(modelCheck?.detail ?? "", /status 404/u);
  assert.match(modelCheck?.detail ?? "", /req_doctor/u);
  assert.doesNotMatch(modelCheck?.detail ?? "", /private upstream body/u);
});

function createConfig(): DiscordDoctorConfig {
  const runtime: DiscordRuntimeConfig = {
    port: 3000,
    ownerPrincipalId: "principal:mj",
    ownerDiscordUserId: ownerUserId,
    allowedGuildIds: new Set([guildId]),
    allowedChannelIds: new Set([channelId]),
    discordApplicationId: applicationId,
    discordBotToken: "secret-bot-token",
    discordPublicKey:
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    openAiApiKey: "secret-openai-key",
    openAiModel: "gpt-5-mini",
  };
  const registration: DiscordRegistrationConfig = {
    discordApplicationId: applicationId,
    discordBotToken: "secret-bot-token",
    developmentGuildId: guildId,
  };

  return { runtime, registration };
}

function jsonResponse(value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function readLastPathSegment(url: string): string {
  return new URL(url).pathname.split("/").filter(Boolean).at(-1) ?? "";
}
