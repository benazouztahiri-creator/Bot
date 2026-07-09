import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

export function encryptDeliveryData(data: string): string {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    console.error("[CRYPTO] ENCRYPTION_KEY missing or too short, length:", keyHex?.length);
    throw new Error("ENCRYPTION_KEY environment variable is not set or too short (need 32+ bytes hex)");
  }

  try {
    const key = Buffer.from(keyHex.slice(0, 64), "hex");
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length} bytes (expected 32)`);
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(data, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");

    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (e) {
    console.error("[CRYPTO] Encryption failed:", e);
    throw e;
  }
}

export function decryptDeliveryData(encoded: string): string {
  const keyHex = process.env.ENCRYPTION_KEY;
  if (!keyHex || keyHex.length < 64) {
    console.error("[CRYPTO] ENCRYPTION_KEY missing or too short, length:", keyHex?.length);
    throw new Error("ENCRYPTION_KEY environment variable is not set or too short (need 32+ bytes hex)");
  }

  try {
    const key = Buffer.from(keyHex.slice(0, 64), "hex");
    if (key.length !== 32) {
      throw new Error(`Invalid key length: ${key.length} bytes (expected 32)`);
    }

    const parts = encoded.split(":");
    if (parts.length !== 3) {
      throw new Error(`Invalid encrypted data format: ${parts.length} parts (expected 3)`);
    }

    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    if (iv.length !== 16) {
      throw new Error(`Invalid IV length: ${iv.length} bytes (expected 16)`);
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (e) {
    console.error("[CRYPTO] Decryption failed:", e);
    throw e;
  }
}
