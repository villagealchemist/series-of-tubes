import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import test from "node:test";

import { verifyDiscordSignature } from "./discord-signature.js";

test("verifies Discord Ed25519 signatures over timestamp plus raw body", () => {
  const { privateKey, publicKey } = generateKeyPairSync("ed25519");
  const timestamp = "1724774400";
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
    }),
    true,
  );

  assert.equal(
    verifyDiscordSignature({
      publicKeyHex,
      signatureHex: signature.toString("hex"),
      timestamp,
      rawBody: '{"type":2}',
    }),
    false,
  );
});
