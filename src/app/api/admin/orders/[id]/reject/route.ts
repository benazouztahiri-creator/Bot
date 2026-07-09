import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (order.status !== "payment_under_review" && order.status !== "waiting_payment_verification") {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  const updated = await updateOrderStatus(id, "payment_rejected", {
    payment_reviewed_by: user.id,
  });

  const db = await getDb();
  await db.execute("UPDATE users SET banned = 1 WHERE id = $1", [order.buyer_id]);

  await logAuditEvent({
    event_type: "order.payment_rejected",
    user_id: user.id,
    order_id: id,
    ip_address: _req.headers.get("x-forwarded-for") || undefined,
    details: `Payment rejected for order ${order.order_tracking_id}. Buyer banned.`,
  });

  return NextResponse.json(updated);
}
