import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGO = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error(
      "ENCRYPTION_KEY debe tener al menos 32 caracteres (.env / runtime del servidor)",
    );
  }
  return Buffer.from(raw.slice(0, 32));
}

export function encryptJson(payload: Record<string, unknown>): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const json = JSON.stringify(payload);
  const enc = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decryptJson<T extends Record<string, unknown>>(
  ciphertext: string,
): T {
  const buf = Buffer.from(ciphertext, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const json = Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
  return JSON.parse(json) as T;
}

export function maskSecret(value: string, visible = 4): string {
  if (value.length <= visible) return "••••";
  return `${"•".repeat(Math.min(12, value.length - visible))}${value.slice(-visible)}`;
}
