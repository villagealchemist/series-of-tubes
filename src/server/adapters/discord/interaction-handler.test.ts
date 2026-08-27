import assert from "node:assert/strict";
import test from "node:test";

import type { StructuredModelProvider } from "../../aapi/model-provider.js";
import type { DiscordRestClient } from "./discord-rest-client.js";
import { planDiscordInteraction } from "./interaction-handler.js";

test("rejects non-owner Discord users before invoking AAPI", async () => {
  const modelProvider: StructuredModelProvider = {
    async generateStructured() {
      throw new Error("Provider should not be called.");
    },
  };
  const discordRestClient: DiscordRestClient = {
    async getChannelMessages() {
      throw new Error("Discord should not be called.");
    },
    async editOriginalInteractionResponse() {
      throw new Error("Discord should not be called.");
    },
  };

  const plan = await planDiscordInteraction(
    {
      type: 2,
      guild_id: "guild-1",
      channel_id: "channel-1",
      member: { user: { id: "someone-else" } },
      data: { name: "catch-up" },
      token: "token",
    },
    {
      ownerPrincipalId: "principal:mj",
      ownerDiscordUserId: "owner-1",
      allowedGuildIds: new Set(["guild-1"]),
      allowedChannelIds: new Set(["channel-1"]),
    },
    {
      modelProvider,
      discordRestClient,
    },
  );

  assert.equal(plan.response.type, 4);
  assert.equal(plan.response.data?.flags, 64);
  assert.equal(plan.afterResponse, undefined);
});

test(
  "catch-up defers privately and executes a generic activity summary",
  async () => {
    let editedContent = "";
    const modelProvider: StructuredModelProvider = {
      async generateStructured(request) {
        assert.match(request.input, /A real message/u);
        return {
          value: {
            headline: "Caught up",
            overview: "One meaningful message.",
            needsAttention: ["Reply to Pat."],
            decisions: [],
            followUps: [],
            safeToIgnore: [],
          },
        };
      },
    };
    const discordRestClient: DiscordRestClient = {
      async getChannelMessages(channelId, limit) {
        assert.equal(channelId, "channel-1");
        assert.equal(limit, 25);
        return [
          {
            id: "message-1",
            content: "A real message",
            timestamp: "2026-08-27T12:00:00.000Z",
            authorLabel: "Pat",
            attachmentNames: [],
          },
        ];
      },
      async editOriginalInteractionResponse(_token, content) {
        editedContent = content;
      },
    };

    const plan = await planDiscordInteraction(
      {
        type: 2,
        guild_id: "guild-1",
        channel_id: "channel-1",
        member: { user: { id: "owner-1" } },
        data: {
          name: "catch-up",
          options: [{ name: "limit", value: 25 }],
        },
        token: "token",
      },
      {
        ownerPrincipalId: "principal:mj",
        ownerDiscordUserId: "owner-1",
        allowedGuildIds: new Set(["guild-1"]),
        allowedChannelIds: new Set(["channel-1"]),
      },
      {
        modelProvider,
        discordRestClient,
      },
    );

    assert.equal(plan.response.type, 5);
    assert.equal(plan.response.data?.flags, 64);
    assert.notEqual(plan.afterResponse, undefined);
    await plan.afterResponse?.();
    assert.match(editedContent, /Reply to Pat/u);
  },
);
