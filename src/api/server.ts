import { createApp } from "./app.js";

const configuredPort = Number.parseInt(process.env.AAPI_PORT ?? "42100", 10);
if (!Number.isSafeInteger(configuredPort) || configuredPort < 1) {
  throw new Error("AAPI_PORT must be a positive integer.");
}

const app = createApp();
app.listen(configuredPort, "127.0.0.1", () => {
  console.log(`AAPI listening on http://127.0.0.1:${configuredPort}`);
  console.log(`Contract reference: http://127.0.0.1:${configuredPort}/docs`);
});
