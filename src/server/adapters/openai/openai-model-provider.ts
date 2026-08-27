import type {
  StructuredGenerationRequest,
  StructuredGenerationResult,
  StructuredModelProvider,
} from "../../aapi/model-provider.js";

const defaultRequestTimeoutMilliseconds = 60_000;
const defaultMaxOutputTokens = 1200;

export interface OpenAiModelProviderConfig {
  readonly apiKey: string;
  readonly model: string;
  readonly endpoint?: string;
  readonly requestTimeoutMilliseconds?: number;
  readonly maxOutputTokens?: number;
  readonly fetchImplementation?: typeof fetch;
}

export function createOpenAiModelProvider(
  config: OpenAiModelProviderConfig,
): StructuredModelProvider {
  const endpoint = config.endpoint ?? "https://api.openai.com/v1/responses";
  const requestTimeoutMilliseconds =
    config.requestTimeoutMilliseconds ?? defaultRequestTimeoutMilliseconds;
  const maxOutputTokens = config.maxOutputTokens ?? defaultMaxOutputTokens;
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
          reasoning: {
            effort: "low",
          },
          instructions: request.instructions,
          input: request.input,
          max_output_tokens: maxOutputTokens,
          text: {
            verbosity: "low",
            format: {
              type: "json_schema",
              name: request.schemaName,
              strict: true,
              schema: request.schema,
            },
          },
        }),
        signal: AbortSignal.timeout(requestTimeoutMilliseconds),
      });

      if (!response.ok) {
        throw createOpenAiRequestError(response);
      }

      const responseText = await response.text();
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

function createOpenAiRequestError(response: Response): Error {
  const requestId = response.headers.get("x-request-id");
  const requestContext = requestId === null ? "" : ` Request ID: ${requestId}.`;

  return new Error(
    `OpenAI request failed with status ${response.status}.${requestContext}`,
  );
}

function extractOutputText(responseBody: unknown): string {
  if (!isRecord(responseBody) || !isUnknownArray(responseBody.output)) {
    throw new Error("OpenAI response did not include an output array.");
  }

  for (const item of responseBody.output) {
    if (!isRecord(item) || !isUnknownArray(item.content)) continue;

    for (const content of item.content) {
      if (!isRecord(content)) continue;

      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }

      if (content.type === "refusal") {
        throw new Error("OpenAI refused the activity summary request.");
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}
