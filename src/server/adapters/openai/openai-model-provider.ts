import type {
  StructuredGenerationRequest,
  StructuredGenerationResult,
  StructuredModelProvider,
} from "../../aapi/model-provider.js";

export interface OpenAiModelProviderConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly endpoint?: string;
  readonly fetchImplementation?: typeof fetch;
}

export function createOpenAiModelProvider(
  config: OpenAiModelProviderConfig,
): StructuredModelProvider {
  const endpoint = config.endpoint ?? "https://api.openai.com/v1/responses";
  const fetchImplementation = config.fetchImplementation ?? fetch;

  return {
    async generateStructured(
      request: StructuredGenerationRequest,
    ): Promise<StructuredGenerationResult> {
      const response = await fetchImplementation(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: config.model,
          store: false,
          safety_identifier: request.safetyIdentifier,
          instructions: request.instructions,
          input: request.input,
          text: {
            verbosity: "medium",
            format: {
              type: "json_schema",
              name: request.schemaName,
              strict: true,
              schema: request.schema,
            },
          },
        }),
      });
      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          `OpenAI request failed with status ${response.status}: ${responseText.slice(0, 500)}`,
        );
      }

      const responseBody: unknown = JSON.parse(responseText);
      const outputText = extractOutputText(responseBody);
      const value: unknown = JSON.parse(outputText);
      const requestId = response.headers.get("x-request-id");

      if (requestId === null) {
        return { value };
      }

      return { value, requestId };
    },
  };
}

function extractOutputText(responseBody: unknown): string {
  if (!isRecord(responseBody) || !Array.isArray(responseBody.output)) {
    throw new Error("OpenAI response did not include an output array.");
  }

  for (const item of responseBody.output) {
    if (!isRecord(item) || !Array.isArray(item.content)) continue;

    for (const content of item.content) {
      if (
        isRecord(content) &&
        content.type === "output_text" &&
        typeof content.text === "string"
      ) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
