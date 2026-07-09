import { NextResponse } from "next/server";
import { getSessionUser, hashPassword, verifyPassword } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";
import { getDb } from "@/lib/db";

export async function PUT(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { current_password, new_password } = body;

    if (!current_password || !new_password) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }

    if (!verifyPassword(current_password, user.password_hash)) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
    }

    const { execute } = await getDb();
    const newHash = hashPassword(new_password);
    await execute("UPDATE users SET password_hash = $1 WHERE id = $2", [newHash, user.id]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Change password failed" }, { status: 500 });
  }
}
