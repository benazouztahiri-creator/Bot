import { simpleParser } from "mailparser";
import { getDb } from "./db";
import { parseBaridiMobEmail, saveEmailLog, saveUnmatchedPayment, markEmailProcessed } from "./paymentVerification";

const BARIDIMOB_SENDER = "baridimob@poste.dz";

async function getImapConfig(): Promise<{
  host: string;
  port: number;
  user: string;
  password: string;
} | null> {
  const { queryOne } = await getDb();
  const host = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'imap_host'");
  const port = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'imap_port'");
  const user = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'imap_user'");
  const password = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'imap_password'");

  if (!host || !user || !password) return null;

  return {
    host: host.value,
    port: port ? parseInt(port.value, 10) : 993,
    user: user.value,
    password: password.value,
  };
}

async function getLastCheckedUid(): Promise<number> {
  const { queryOne } = await getDb();
  const row = await queryOne<{ value: string }>("SELECT value FROM settings WHERE key = 'last_checked_uid'");
  return row ? parseInt(row.value, 10) || 0 : 0;
}

async function setLastCheckedUid(uid: number): Promise<void> {
  const { execute } = await getDb();
  await execute(
    "INSERT INTO settings (key, value) VALUES ('last_checked_uid', $1) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
    [String(uid)]
  );
}

export async function checkEmailInbox(): Promise<{
  checked: number;
  matched: number;
  unmatched: number;
  multiple: number;
  errors: number;
}> {
  console.log("[EMAIL_CHECKER] DEPRECATED: Use webhook endpoint POST /api/webhook/incoming-email instead");
  return { checked: 0, matched: 0, unmatched: 0, multiple: 0, errors: 0 };
}
