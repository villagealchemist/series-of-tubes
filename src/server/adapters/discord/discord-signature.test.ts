import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";

import { verifyDiscordSignature } from "./discord-signature.js";

await test("verifies Discord Ed25519 signatures over timestamp plus raw body", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const timestamp = "1724774400";
  const currentTimeMilliseconds = 1_724_774_400_000;
  const rawBody = '{"type":1}';
  const signature = sign(
    null,
    Buffer.from(`${timestamp}${rawBody}`, "utf8"),
    privateKey,
  );
  const publicKeyDer = publicKey.export({ format: "der", type: "spki" });
  const publicKeyHex = publicKeyDer.subarray(-32).toString("hex");

  assert.equal(
    verifyDiscordSignature({
      publicKeyHex,
      signatureHex: signature.toString("hex"),
      timestamp,
      rawBody,
      currentTimeMilliseconds,
    }),
    true,
  );

  assert.equal(
    verifyDiscordSignature({
      publicKeyHex,
      signatureHex: signature.toString("hex"),
      timestamp,
      rawBody: '{"type":2}',
      currentTimeMilliseconds,
    }),
    false,
  );

  assert.equal(
    verifyDiscordSignature({
      publicKeyHex,
      signatureHex: signature.toString("hex"),
      timestamp,
      rawBody,
      currentTimeMilliseconds: currentTimeMilliseconds + 300_001,
    }),
    false,
  );

  assert.equal(
    verifyDiscordSignature({
      publicKeyHex,
      signatureHex: signature.toString("hex"),
      timestamp: "not-a-timestamp",
      rawBody,
      currentTimeMilliseconds,
    }),
    false,
  );
});
