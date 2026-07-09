import { NextResponse } from "next/server";
import { csrfGuard } from "@/lib/csrf";
import { consumeResetToken, hashPassword } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const { token, password } = await req.json();
  if (!token || !password) {
    return NextResponse.json({ error: "الرمز وكلمة المرور مطلوبان." }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "كلمة المرور يجب أن تكون 6 أحرف على الأقل." }, { status: 400 });
  }

  const userId = await consumeResetToken(token);
  if (!userId) {
    return NextResponse.json({ error: "الرمز غير صالح أو منتهي الصلاحية." }, { status: 400 });
  }

  const db = await getDb();
  const hash = hashPassword(password);
  await db.execute("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, userId]);
  await db.execute("DELETE FROM sessions WHERE user_id = $1", [userId]);

  return NextResponse.json({ ok: true });
}
