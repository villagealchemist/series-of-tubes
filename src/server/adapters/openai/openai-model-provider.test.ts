import assert from "node:assert/strict";
import test from "node:test";

import { createOpenAiModelProvider } from "./openai-model-provider.js";

await test(
  "OpenAI adapter requests structured output without provider storage",
  async () => {
    let requestBody: unknown;
    const provider = createOpenAiModelProvider({
      apiKey: "test-key",
      model: "gpt-5.6-luna",
      fetchImplementation: (_input, init) => {
        requestBody =
          typeof init?.body === "string" ? JSON.parse(init.body) : undefined;
        return Promise.resolve(
          new Response(
            JSON.stringify({
              output: [
                {
                  type: "message",
                  content: [
                    {
                      type: "output_text",
                      text: JSON.stringify({ answer: "hello" }),
                    },
                  ],
                },
              ],
            }),
            {
              status: 200,
              headers: { "x-request-id": "req_test" },
            },
          ),
        );
      },
    });

    const result = await provider.generateStructured({
      schemaName: "answer",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["answer"],
        properties: { answer: { type: "string" } },
      },
      instructions: "Return an answer.",
      input: "hello",
      safetyIdentifier: "principal:mj",
    });

    assert.deepEqual(result.value, { answer: "hello" });
    assert.equal(result.requestId, "req_test");
    assert.ok(isRecord(requestBody));
    assert.equal(requestBody.store, false);
    assert.equal(requestBody.safety_identifier, "principal:mj");
  },
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
