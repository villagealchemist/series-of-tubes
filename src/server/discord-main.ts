import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";

import type { StructuredModelProvider } from "./aapi/model-provider.js";
import {
  createDiscordRestClient,
  type DiscordRestClient,
} from "./adapters/discord/discord-rest-client.js";
import { verifyDiscordSignature } from "./adapters/discord/discord-signature.js";
import { planDiscordInteraction } from "./adapters/discord/interaction-handler.js";
import { createOpenAiModelProvider } from "./adapters/openai/openai-model-provider.js";
import {
  loadDiscordRuntimeConfig,
  type DiscordRuntimeConfig,
} from "./config/environment.js";

const maxRequestBytes = 1_048_576;

interface RequestDependencies {
  readonly config: DiscordRuntimeConfig;
  readonly modelProvider: StructuredModelProvider;
  readonly discordRestClient: DiscordRestClient;
}

function main(): void {
  const config = loadDiscordRuntimeConfig();
  const modelProvider = createOpenAiModelProvider({
    apiKey: config.openAiApiKey,
    model: config.openAiModel,
  });
  const discordRestClient = createDiscordRestClient({
    applicationId: config.discordApplicationId,
    botToken: config.discordBotToken,
  });
  const dependencies: RequestDependencies = {
    config,
    modelProvider,
    discordRestClient,
  };

  const server = createServer(
    (request: IncomingMessage, response: ServerResponse): void => {
      void handleRequest(request, response, dependencies).catch(
        (error: unknown) => {
          console.error("Discord interaction request failed.", error);
          if (!response.headersSent) {
            writeJson(response, 500, { error: "internal_error" });
          } else {
            response.end();
          }
        },
      );
    },
  );

  server.listen(config.port, () => {
    console.log(`AAPI Discord adapter listening on port ${config.port}.`);
  });
}

async function handleRequest(
  request: IncomingMessage,
  response: ServerResponse,
  dependencies: RequestDependencies,
): Promise<void> {
  if (request.method === "GET" && request.url === "/health") {
    writeJson(response, 200, { status: "ok" });
    return;
  }

  if (request.method !== "POST" || request.url !== "/discord/interactions") {
    writeJson(response, 404, { error: "not_found" });
    return;
  }

  const rawBody = await readRequestBody(request);
  const signature = request.headers["x-signature-ed25519"];
  const timestamp = request.headers["x-signature-timestamp"];

  if (
    typeof signature !== "string" ||
    typeof timestamp !== "string" ||
    !verifyDiscordSignature({
      publicKeyHex: dependencies.config.discordPublicKey,
      signatureHex: signature,
      timestamp,
      rawBody,
    })
  ) {
    writeJson(response, 401, { error: "invalid_signature" });
    return;
  }

  const payload: unknown = JSON.parse(rawBody);
  const plan = planDiscordInteraction(
    payload,
    {
      ownerPrincipalId: dependencies.config.ownerPrincipalId,
      ownerDiscordUserId: dependencies.config.ownerDiscordUserId,
      allowedGuildIds: dependencies.config.allowedGuildIds,
      allowedChannelIds: dependencies.config.allowedChannelIds,
    },
    {
      modelProvider: dependencies.modelProvider,
      discordRestClient: dependencies.discordRestClient,
    },
  );

  writeJson(response, 200, plan.response);

  if (plan.afterResponse !== undefined) {
    void plan.afterResponse().catch((error: unknown) => {
      console.error("Discord follow-up failed.", error);
    });
  }
}

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let totalBytes = 0;
  const requestStream: AsyncIterable<unknown> = request;

  for await (const chunk of requestStream) {
    const buffer = readChunk(chunk);
    totalBytes += buffer.length;
    if (totalBytes > maxRequestBytes) {
      throw new Error("Discord interaction request exceeded the size limit.");
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks).toString("utf8");
}

function readChunk(chunk: unknown): Buffer {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (typeof chunk === "string") return Buffer.from(chunk);
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);

  throw new Error("Discord interaction request contained an invalid chunk.");
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  body: unknown,
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(body));
}

try {
  main();
} catch (error: unknown) {
  console.error("AAPI Discord adapter failed to start.", error);
  process.exitCode = 1;
}
