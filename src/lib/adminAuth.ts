import { cookies } from "next/headers";
import crypto from "crypto";

const ADMIN_COOKIE_NAME = "admin_token";
const TOKEN_EXPIRY_SECONDS = 86400;

function getSigningKey(): string {
  const key = process.env.ADMIN_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  if (!key) throw new Error("ADMIN_JWT_SECRET environment variable is not set");
  return key;
}

export function signAdminToken(userId: string): string {
  const key = getSigningKey();
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: userId,
      role: "admin",
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
      iat: Math.floor(Date.now() / 1000),
    })
  ).toString("base64url");

  const signature = crypto.createHmac("sha256", key).update(`${header}.${payload}`).digest("base64url");

  return `${header}.${payload}.${signature}`;
}

export function verifyAdminToken(token: string): { userId: string } | null {
  try {
    const key = getSigningKey();
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const signature = crypto.createHmac("sha256", key).update(`${parts[0]}.${parts[1]}`).digest("base64url");
    if (signature !== parts[2]) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (payload.role !== "admin") return null;

    return { userId: payload.sub };
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token) !== null;
}

export async function setAdminCookie(userId: string) {
  const cookieStore = await cookies();
  const token = signAdminToken(userId);
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_EXPIRY_SECONDS,
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getAdminCookieName() {
  return ADMIN_COOKIE_NAME;
}
