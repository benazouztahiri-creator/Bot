import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { getDb } from "./db";

export type UserRole = "buyer" | "admin";

export type User = {
  id: string;
  role: UserRole;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  banned: number;
  email_verified: number;
  created_at: string;
};

const SESSION_COOKIE = "session_token";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(16).toString("hex")}`;
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generateSecretCode(): string {
  return crypto.randomBytes(9).toString("base64url").slice(0, 12);
}

export function sanitizeUser(user: User): Omit<User, "password_hash"> {
  const { password_hash, ...safe } = user;
  return safe;
}

export async function createSession(userId: string): Promise<string> {
  const { queryOne } = await getDb();
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await queryOne(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4) RETURNING id",
    [generateId("sess"), userId, token, expiresAt]
  );

  return token;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const { queryOne, execute } = await getDb();
  const session = await queryOne<{ user_id: string; expires_at: string }>(
    "SELECT user_id, expires_at FROM sessions WHERE token = $1 AND expires_at > NOW()",
    [token]
  );

  if (!session) return null;

  const expiresAt = new Date(session.expires_at).getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;
  if (expiresAt - Date.now() < oneDayMs) {
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();
    await execute("UPDATE sessions SET expires_at = $1 WHERE token = $2", [newExpiresAt, token]);
    const cookieStore2 = await cookies();
    cookieStore2.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DURATION_MS / 1000,
    });
  }

  const user = await queryOne<User>("SELECT * FROM users WHERE id = $1", [session.user_id]);
  if (!user || user.banned) return null;

  return user;
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  if (user.banned) {
    throw new Error("Banned");
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error("Forbidden");
  }
  return user;
}

export async function loginUser(email: string, password: string): Promise<User | null> {
  const { queryOne } = await getDb();
  const user = await queryOne<User>("SELECT * FROM users WHERE email = $1", [email]);
  if (!user) return null;
  if (user.banned) return null;
  if (!verifyPassword(password, user.password_hash)) return null;
  return user;
}

export async function registerUser(params: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  date_of_birth?: string;
}): Promise<User> {
  const { queryOne } = await getDb();
  const passwordHash = hashPassword(params.password);
  const id = generateId("usr");

  await queryOne(
    `INSERT INTO users (id, role, email, password_hash, first_name, last_name, date_of_birth)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [
      id,
      params.role,
      params.email,
      passwordHash,
      params.first_name,
      params.last_name,
      params.date_of_birth || "",
    ]
  );

  return (await queryOne<User>("SELECT * FROM users WHERE id = $1", [id]))!;
}

export async function logAuditEvent(params: {
  event_type: string;
  user_id?: string;
  order_id?: string;
  ip_address?: string;
  details?: string;
}): Promise<void> {
  const { queryOne } = await getDb();
  await queryOne(
    "INSERT INTO audit_log (id, event_type, user_id, order_id, ip_address, details) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
    [
      generateId("aud"),
      params.event_type,
      params.user_id || null,
      params.order_id || null,
      params.ip_address || null,
      params.details || null,
    ]
  );
}

export async function createNotification(params: {
  userId: string;
  orderId?: string;
  type: string;
  title?: string;
  message: string;
  icon?: string;
  link?: string;
}): Promise<void> {
  const { queryOne } = await getDb();
  await queryOne(
    "INSERT INTO notifications (id, user_id, order_id, type, title, message, icon, link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
    [generateId("notif"), params.userId, params.orderId || null, params.type, params.title || "", params.message, params.icon || "", params.link || ""]
  );
}

export async function getSettings(): Promise<Record<string, string>> {
  const { query } = await getDb();
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const settings: Record<string, string> = {
    tax_rate: "1",
    warranty_days: "16",
    bank_name: "",
    bank_account_holder: "",
    bank_iban: "",
    usdt_address: "",
  };
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  return settings;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const { queryOne } = await getDb();
  await queryOne(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value RETURNING key",
    [key, value]
  );
}

export async function revokeUserSessions(userId: string): Promise<void> {
  const { execute } = await getDb();
  await execute("DELETE FROM sessions WHERE user_id = $1", [userId]);
}

export function generateVerificationToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export async function storeVerificationToken(userId: string, hash: string): Promise<void> {
  const { queryOne } = await getDb();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await queryOne(
    "INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4) RETURNING id",
    [generateId("evt"), userId, hash, expiresAt]
  );
}

export async function consumeVerificationToken(userId: string, rawToken: string): Promise<boolean> {
  const { queryOne, execute } = await getDb();
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const token = await queryOne<{ id: string }>(
    "SELECT id FROM email_verification_tokens WHERE user_id = $1 AND token_hash = $2 AND expires_at > NOW()",
    [userId, hash]
  );
  if (!token) return false;
  await execute("DELETE FROM email_verification_tokens WHERE id = $1", [token.id]);
  return true;
}

export async function invalidateOldVerificationTokens(userId: string): Promise<void> {
  const { execute } = await getDb();
  await execute("DELETE FROM email_verification_tokens WHERE user_id = $1", [userId]);
}

export function generateResetToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, hash };
}

export async function storeResetToken(userId: string, hash: string): Promise<void> {
  const { queryOne } = await getDb();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  await queryOne(
    "INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4) RETURNING id",
    [generateId("prt"), userId, hash, expiresAt]
  );
}

export async function consumeResetToken(rawToken: string): Promise<string | null> {
  const { queryOne, execute } = await getDb();
  const hash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const token = await queryOne<{ id: string; user_id: string }>(
    "SELECT id, user_id FROM password_reset_tokens WHERE token_hash = $1 AND expires_at > NOW() AND used = 0",
    [hash]
  );
  if (!token) return null;
  await execute("UPDATE password_reset_tokens SET used = 1 WHERE id = $1", [token.id]);
  return token.user_id;
}

export function isAccountFullyActivated(user: User): boolean {
  if (!user.email_verified) return false;
  return true;
}
