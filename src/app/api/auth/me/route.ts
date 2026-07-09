import { NextResponse } from "next/server";
import { getSessionUser, sanitizeUser, hashPassword, clearSessionCookie, revokeUserSessions } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";
import { getDb } from "@/lib/db";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: sanitizeUser(user) });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function PUT(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { first_name, last_name, date_of_birth } = body;

    const { queryOne } = await getDb();
    await queryOne(`
      UPDATE users SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        date_of_birth = COALESCE($3, date_of_birth)
      WHERE id = $4
    `, [
      first_name || null,
      last_name || null,
      date_of_birth || null,
      user.id,
    ]);

    const updated = await queryOne<any>("SELECT * FROM users WHERE id = $1", [user.id]);
    return NextResponse.json({ user: sanitizeUser(updated!) });
  } catch {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { getPool } = await getDb();
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query("DELETE FROM notifications WHERE user_id = $1", [user.id]);
      await client.query("DELETE FROM sessions WHERE user_id = $1", [user.id]);
      await client.query("DELETE FROM email_verification_tokens WHERE user_id = $1", [user.id]);
      await client.query("DELETE FROM password_reset_tokens WHERE user_id = $1", [user.id]);

      await client.query("UPDATE orders SET buyer_id = NULL WHERE buyer_id = $1", [user.id]);
      await client.query("DELETE FROM reviews WHERE buyer_id = $1", [user.id]);
      await client.query("DELETE FROM disputes WHERE buyer_id = $1", [user.id]);
      await client.query("DELETE FROM users WHERE id = $1", [user.id]);

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    await clearSessionCookie();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
