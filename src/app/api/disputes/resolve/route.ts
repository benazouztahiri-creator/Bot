import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent, createNotification } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { updateOrderStatus, getOrderById } from "@/lib/orders";
import { updateProduct } from "@/lib/products";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { order_id, resolution } = body;

  if (!order_id || !resolution) {
    return NextResponse.json({ error: "order_id and resolution are required" }, { status: 400 });
  }

  const db = await getDb();
  const dispute = await db.queryOne("SELECT * FROM disputes WHERE order_id = $1 AND status = 'open'", [order_id]);
  if (!dispute) {
    return NextResponse.json({ error: "No open dispute for this order" }, { status: 404 });
  }

  const status = resolution === "close" ? "closed" : resolution;
  if (!["closed", "resolved_buyer"].includes(status)) {
    return NextResponse.json({ error: "Invalid resolution" }, { status: 400 });
  }

  await db.queryOne(`
    UPDATE disputes SET status = $1, resolved_by = $2, resolution_note = $3 WHERE id = $4
  `, [status, user.id, null, dispute.id]);

  if (status === "resolved_buyer" || status === "closed") {
    await updateOrderStatus(order_id, "delivered");
    const ord = await getOrderById(order_id);
    if (ord?.product_id) {
      await updateProduct(ord.product_id, { status: "sold" });
    }
  }

  await logAuditEvent({
    event_type: `dispute.${status}`,
    user_id: user.id,
    order_id,
    details: `Dispute resolved via admin orders panel`,
  });

  const d = await db.queryOne("SELECT * FROM disputes WHERE id = $1", [dispute.id]);
  if (d) {
    await createNotification({ userId: d.buyer_id, orderId: order_id, type: "dispute_resolved", message: "تم إغلاق النزاع على طلبك" });
  }

  return NextResponse.json({ ok: true });
}
