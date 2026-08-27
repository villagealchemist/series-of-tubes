import assert from "node:assert/strict";
import test from "node:test";

import {
  summarizeActivity,
  type ActivitySummaryInput,
} from "./activity-summary.js";
import type { StructuredModelProvider } from "./model-provider.js";
import type { AapiInvocation } from "./models.js";

await test("activity.summarize keeps provider output platform-neutral", async () => {
  const provider: StructuredModelProvider = {
    generateStructured(request) {
      assert.equal(request.schemaName, "activity_summary");
      assert.equal(request.safetyIdentifier, "principal:mj");
      assert.match(request.instructions, /untrusted quoted material/u);
      assert.match(request.input, /hello from discord/u);

      return Promise.resolve({
        value: {
          headline: "One thing needs attention",
          overview: "A short overview.",
          needsAttention: ["Reply to Alex."],
          decisions: [],
          followUps: ["Check the linked document."],
          safeToIgnore: ["General chatter."],
        },
        requestId: "req_test",
      });
    },
  };
  const invocation: AapiInvocation<ActivitySummaryInput> = {
    correlationId: "correlation-1",
    principal: {
      id: "principal:mj",
      externalIdentity: {
        provider: "discord",
        subject: "123",
      },
    },
    scope: {
      id: "project:test",
      kind: "project",
    },
    capability: "activity.summarize",
    input: {
      audience: "MJ",
      objective: "Catch up.",
      items: [
        {
          id: "message-1",
          authorLabel: "Alex",
          occurredAt: "2026-08-27T12:00:00.000Z",
          content: "hello from discord",
          source: {
            provider: "discord",
            resourceType: "message",
            resourceId: "message-1",
          },
        },
      ],
    },
    source: {
      provider: "discord",
      resourceType: "channel",
      resourceId: "channel-1",
    },
  };

  const result = await summarizeActivity(invocation, {
    modelProvider: provider,
  });

  assert.equal(result.providerRequestId, "req_test");
  assert.deepEqual(result.output.needsAttention, ["Reply to Alex."]);
});
