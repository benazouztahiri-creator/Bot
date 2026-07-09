import { NextResponse } from "next/server";
import { getSessionUser, createNotification } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { csrfGuard } from "@/lib/csrf";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, "broadcast");
  const rl = await checkRateLimit(rlKey, 3, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many broadcasts. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { title, message, userId, type, icon, link } = body;

  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const cleanMessage = sanitizeText(message, MAX_LENGTHS.NOTIF_MESSAGE);
  const cleanTitle = sanitizeText(title || "", MAX_LENGTHS.NOTIF_TITLE);

  if (userId) {
    await createNotification({ userId, type: type || "admin", title: cleanTitle, message: cleanMessage, icon: icon || "", link: link || "" });
    return NextResponse.json({ ok: true });
  }

  const db = await getDb();
  const users = await db.query<{ id: string }>("SELECT id FROM users");
  for (const u of users) {
    await createNotification({ userId: u.id, type: type || "admin_broadcast", title: cleanTitle || "إشعار من الإدارة", message: cleanMessage, icon: icon || "📢", link: link || "" });
  }

  return NextResponse.json({ sent: users.length });
}
