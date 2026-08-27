import { createPublicKey, verify } from "node:crypto";

const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");

export interface DiscordSignatureInput {
  readonly publicKeyHex: string;
  readonly signatureHex: string;
  readonly timestamp: string;
  readonly rawBody: string;
}

export function verifyDiscordSignature(input: DiscordSignatureInput): boolean {
  if (
    !isHex(input.publicKeyHex, 64) ||
    !isHex(input.signatureHex, 128) ||
    input.timestamp.length === 0
  ) {
    return false;
  }

  const publicKey = createPublicKey({
    key: Buffer.concat([
      ed25519SpkiPrefix,
      Buffer.from(input.publicKeyHex, "hex"),
    ]),
    format: "der",
    type: "spki",
  });

  return verify(
    null,
    Buffer.from(`${input.timestamp}${input.rawBody}`, "utf8"),
    publicKey,
    Buffer.from(input.signatureHex, "hex"),
  );
}

function isHex(value: string, length: number): boolean {
  return value.length === length && /^[0-9a-f]+$/iu.test(value);
}
