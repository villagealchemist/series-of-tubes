import { createPublicKey, verify } from "node:crypto";

const ed25519SpkiPrefix = Buffer.from("302a300506032b6570032100", "hex");
const defaultMaximumAgeMilliseconds = 5 * 60 * 1000;

export interface DiscordSignatureInput {
  readonly publicKeyHex: string;
  readonly signatureHex: string;
  readonly timestamp: string;
  readonly rawBody: string;
  readonly currentTimeMilliseconds?: number;
  readonly maximumAgeMilliseconds?: number;
}

export function verifyDiscordSignature(input: DiscordSignatureInput): boolean {
  if (
    !isHex(input.publicKeyHex, 64) ||
    !isHex(input.signatureHex, 128) ||
    !isCurrentTimestamp(input)
  ) {
    return false;
  }

  try {
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
  } catch {
    return false;
  }
}

function isHex(value: string, length: number): boolean {
  return value.length === length && /^[0-9a-f]+$/iu.test(value);
}

function isCurrentTimestamp(input: DiscordSignatureInput): boolean {
  if (!/^\d+$/u.test(input.timestamp)) return false;

  const timestampSeconds = Number(input.timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) return false;

  const currentTimeMilliseconds = input.currentTimeMilliseconds ?? Date.now();
  const maximumAgeMilliseconds =
    input.maximumAgeMilliseconds ?? defaultMaximumAgeMilliseconds;
  const requestTimeMilliseconds = timestampSeconds * 1000;

  return (
    Number.isFinite(currentTimeMilliseconds) &&
    Number.isFinite(maximumAgeMilliseconds) &&
    maximumAgeMilliseconds >= 0 &&
    Math.abs(currentTimeMilliseconds - requestTimeMilliseconds) <=
      maximumAgeMilliseconds
  );
}
