import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "";
  const verified = searchParams.get("verified") || "";

  const db = await getDb();
  let sql = `
    SELECT id, email, first_name, last_name, role, email_verified,
      banned, created_at,
      0 as product_count,
      (SELECT COUNT(*)::int FROM orders WHERE buyer_id = u.id) as order_count,
      (SELECT COUNT(*)::int FROM disputes WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = u.id)) as dispute_count
    FROM users u WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (q) {
    sql += ` AND (u.email ILIKE $${idx} OR u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.id ILIKE $${idx})`;
    params.push(`%${q}%`);
    idx++;
  }

  if (role) {
    sql += ` AND u.role = $${idx++}`;
    params.push(role);
  }

  if (status === "banned") {
    sql += ` AND u.banned = 1`;
  } else if (status === "active") {
    sql += ` AND u.banned = 0`;
  }

  if (verified === "verified") {
    sql += ` AND u.email_verified = 1`;
  } else if (verified === "unverified") {
    sql += ` AND u.email_verified = 0`;
  }

  sql += " ORDER BY u.created_at DESC LIMIT 100";

  const users = await db.query(sql, params);
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  const csrfResponse = csrfGuard(request);
  if (csrfResponse) return csrfResponse;

  const admin = await getSessionUser();
  if (!admin || admin.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { user_id, action, reason } = body;

  if (!user_id) {
    return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.queryOne("SELECT * FROM users WHERE id = $1", [user_id]);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const validActions = ["ban", "unban", "delete", "promote_admin", "demote_buyer", "verify_email"];
  if (!validActions.includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  if (action === "ban") {
    await db.execute("UPDATE users SET banned = 1 WHERE id = $1", [user_id]);
    await logAuditEvent({ event_type: "user.banned", user_id: admin.id, details: `User ${target.email} banned. Reason: ${reason || "N/A"}` });
  } else if (action === "unban") {
    await db.execute("UPDATE users SET banned = 0 WHERE id = $1", [user_id]);
    await logAuditEvent({ event_type: "user.unbanned", user_id: admin.id, details: `User ${target.email} unbanned` });
  } else if (action === "delete") {
    const pool = db.getPool();
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("DELETE FROM disputes WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = $1)", [user_id]);
      await client.query("DELETE FROM order_chat_messages WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = $1)", [user_id]);
      await client.query("DELETE FROM reviews WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = $1)", [user_id]);
      await client.query("DELETE FROM notifications WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = $1)", [user_id]);
      await client.query("DELETE FROM orders WHERE buyer_id = $1", [user_id]);
      await client.query("DELETE FROM disputes WHERE buyer_id = $1", [user_id]);
      await client.query("DELETE FROM order_chat_messages WHERE sender_id = $1", [user_id]);
      await client.query("DELETE FROM reviews WHERE buyer_id = $1", [user_id]);
      await client.query("DELETE FROM reports WHERE reporter_id = $1 OR reported_user_id = $1", [user_id]);
      await client.query("DELETE FROM price_history WHERE changed_by = $1", [user_id]);
      await client.query("UPDATE orders SET payment_reviewed_by = NULL WHERE payment_reviewed_by = $1", [user_id]);
      await client.query("UPDATE disputes SET resolved_by = NULL WHERE resolved_by = $1", [user_id]);
      await client.query("DELETE FROM audit_log WHERE user_id = $1", [user_id]);
      await client.query("DELETE FROM users WHERE id = $1", [user_id]);
      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK").catch(() => {});
      console.error("Delete user error:", e);
      return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
    } finally {
      client.release();
    }
    await logAuditEvent({ event_type: "user.deleted", user_id: admin.id, details: `User ${target.email} deleted by admin. Reason: ${reason || "N/A"}` });
  } else if (action === "promote_admin") {
    await db.execute("UPDATE users SET role = 'admin' WHERE id = $1", [user_id]);
    await logAuditEvent({ event_type: "user.promoted", user_id: admin.id, details: `User ${target.email} promoted to admin` });
  } else if (action === "demote_buyer") {
    await db.execute("UPDATE users SET role = 'buyer' WHERE id = $1", [user_id]);
    await logAuditEvent({ event_type: "user.demoted", user_id: admin.id, details: `User ${target.email} demoted to buyer` });
  } else if (action === "verify_email") {
    await db.execute("UPDATE users SET email_verified = 1 WHERE id = $1", [user_id]);
    await logAuditEvent({ event_type: "user.email_verified", user_id: admin.id, details: `User ${target.email} email verified by admin` });
  }

  return NextResponse.json({ ok: true });
}
