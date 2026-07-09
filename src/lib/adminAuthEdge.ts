function base64UrlDecode(str: string): ArrayBuffer {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const chars = atob(base64 + padding);
  const bytes = new Uint8Array(chars.length);
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
}

export async function verifyAdminTokenEdge(token: string): Promise<{ userId: string } | null> {
  try {
    const key = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
    if (!key) return null;

    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const encoder = new TextEncoder();
    const data = encoder.encode(`${parts[0]}.${parts[1]}`);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(key),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const signatureBytes = base64UrlDecode(parts[2]);

    const valid = await crypto.subtle.verify("HMAC", cryptoKey, signatureBytes, data);
    if (!valid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlDecode(parts[1]));
    const payload = JSON.parse(payloadJson);

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "admin") return null;

    return { userId: payload.sub };
  } catch {
    return null;
  }
}
