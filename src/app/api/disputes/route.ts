import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent, generateId, createNotification } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { csrfGuard } from "@/lib/csrf";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  if (user.role === "admin") {
    const rows = await db.query(`
      SELECT d.*,
        b.first_name || ' ' || b.last_name as buyer_name,
        o.order_tracking_id
      FROM disputes d
      LEFT JOIN users b ON d.buyer_id = b.id
      LEFT JOIN orders o ON d.order_id = o.id
      ORDER BY d.created_at DESC
    `);
    return NextResponse.json(rows);
  }

  const rows = await db.query(`
    SELECT d.*,
      o.order_tracking_id
    FROM disputes d
    LEFT JOIN orders o ON d.order_id = o.id
    WHERE d.buyer_id = $1
    ORDER BY d.created_at DESC
  `, [user.id]);
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json({ error: "Account banned" }, { status: 403 });
  }

  const body = await req.json();
  const { order_id, reason } = body;

  if (!order_id || !reason) {
    return NextResponse.json({ error: "Order ID and reason are required" }, { status: 400 });
  }

  const order = await getOrderById(order_id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();

  const existingDispute = await db.queryOne<{ id: string }>(
    "SELECT id FROM disputes WHERE order_id = $1 AND status = 'open'",
    [order_id]
  );
  if (existingDispute) {
    return NextResponse.json({ error: "A dispute is already open for this order" }, { status: 409 });
  }

  const id = generateId("disp");
  await db.queryOne(`
    INSERT INTO disputes (id, order_id, buyer_id, reason, evidence_files)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [id, order_id, order.buyer_id, sanitizeText(reason, MAX_LENGTHS.REASON), JSON.stringify([])]);

  await updateOrderStatus(order_id, "disputed");

  await logAuditEvent({
    event_type: "dispute.created",
    user_id: user.id,
    order_id,
    details: `Dispute opened: ${reason}`,
  });

  const admins = await db.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    await createNotification({ userId: a.id, orderId: order_id, type: "dispute_opened", message: "تم فتح نزاع على طلب" });
  }

  const dispute = await db.queryOne("SELECT * FROM disputes WHERE id = $1", [id]);
  return NextResponse.json(dispute, { status: 201 });
}
