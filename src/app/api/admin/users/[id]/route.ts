import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = await getDb();

  const target = await db.queryOne(`
    SELECT id, email, first_name, last_name, role, email_verified,
      banned, id_file_path, date_of_birth, created_at
    FROM users WHERE id = $1
  `, [id]);

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const orders = await db.query(`
    SELECT id, order_tracking_id, status, total_amount, currency, product_title, created_at
    FROM orders WHERE buyer_id = $1 ORDER BY created_at DESC LIMIT 20
  `, [id]);

  const reviews = await db.query(`
    SELECT r.*, p.title as product_title
    FROM reviews r
    LEFT JOIN products p ON r.product_id = p.id
    WHERE r.buyer_id = $1 ORDER BY r.created_at DESC LIMIT 10
  `, [id]);

  const auditLog = await db.query(`
    SELECT id, event_type, details, ip_address, created_at
    FROM audit_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
  `, [id]);

  return NextResponse.json({
    user: target,
    orders,
    reviews,
    audit_log: auditLog,
  });
}
