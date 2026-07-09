import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent, createNotification } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOrderById, updateOrderStatus, Order } from "@/lib/orders";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const rawItems = await db.query<Record<string, unknown>>(`
    SELECT u.*,
      o.order_tracking_id,
      o.buyer_id,
      o.total_amount,
      o.currency as order_currency,
      o.status as order_status,
      o.transaction_id as order_transaction_id,
      o.id as order_id
    FROM unmatched_payments u
    LEFT JOIN orders o ON u.resolved_order_id = o.id
    WHERE u.reviewed = 0
      AND u.amount IS NOT NULL
      AND (
        SELECT COUNT(*) FROM orders
        WHERE status = 'waiting_payment_verification'
          AND total_amount = u.amount
      ) > 1
    ORDER BY u.created_at DESC
  `);

  const manualReviewItems: Record<string, unknown>[] = [];
  for (const item of rawItems) {
    const potentialOrders = await db.query(`
      SELECT o.*,
        b.first_name || ' ' || b.last_name as buyer_name,
        p.title as product_title
      FROM orders o
      LEFT JOIN users b ON o.buyer_id = b.id
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.status = 'waiting_payment_verification'
        AND o.total_amount = $1
    `, [item.amount as number]);

    manualReviewItems.push({ ...item, potential_orders: potentialOrders });
  }

  return NextResponse.json(manualReviewItems);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { unmatched_payment_id, selected_order_id, notes } = body;

  if (!unmatched_payment_id || !selected_order_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await getDb();

  const unmatched = await db.queryOne(
    "SELECT * FROM unmatched_payments WHERE id = $1 AND reviewed = 0",
    [unmatched_payment_id]
  );
  if (!unmatched) {
    return NextResponse.json({ error: "Unmatched payment not found or already reviewed" }, { status: 404 });
  }

  const order = await getOrderById(selected_order_id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "waiting_payment_verification") {
    return NextResponse.json({ error: "Order is not in verification status" }, { status: 400 });
  }

  const secretCode = crypto.randomBytes(9).toString("base64url").slice(0, 12);

  await updateOrderStatus(selected_order_id, "paid", {
    order_secret_code: secretCode,
    transaction_id: unmatched.transaction_id as string || "",
    matched_via_email: 1,
    auto_confirmed_at: new Date().toISOString(),
    confirmed_message_id: "",
    confirmed_webhook_id: "",
  });

  await db.execute(
    `UPDATE unmatched_payments SET reviewed = 1, resolved_order_id = $1, notes = $2, reviewed_at = NOW() WHERE id = $3`,
    [selected_order_id, notes || "", unmatched_payment_id]
  );

  await logAuditEvent({
    event_type: "order.payment_manual_review_resolved",
    user_id: user.id,
    order_id: selected_order_id,
    details: `Admin resolved manual review for payment ${unmatched.transaction_id}`,
  });

  await createNotification({
    userId: order.buyer_id,
    orderId: selected_order_id,
    type: "payment_confirmed",
    title: "تم تأكيد الدفع",
    message: "تم تأكيد دفع طلبك بعد المراجعة اليدوية.",
    link: `/orders/${selected_order_id}`,
  });

  return NextResponse.json({ ok: true });
}
