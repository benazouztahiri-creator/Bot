import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { csrfGuard } from "@/lib/csrf";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { generateResetToken, storeResetToken } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const rlKey = getRateLimitKey(req, "forgot-password");
  const rl = await checkRateLimit(rlKey, 1, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "الرجاء الانتظار قبل طلب رابط جديد." }, { status: 429 });
  }

  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "البريد الإلكتروني مطلوب." }, { status: 400 });
  }

  const db = await getDb();
  const user = await db.queryOne<{ id: string; email: string }>(
    "SELECT id, email FROM users WHERE email = $1",
    [email]
  );

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  await db.execute("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);

  const { raw, hash } = generateResetToken();
  await storeResetToken(user.id, hash);
  await sendPasswordResetEmail({ to: user.email, token: raw });

  return NextResponse.json({ ok: true });
}
