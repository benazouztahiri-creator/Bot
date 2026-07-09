import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";
import { decryptDeliveryData } from "@/lib/crypto";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isBuyer = order.buyer_id === user.id;
  const isAdmin = user.role === "admin";

  if (!isBuyer && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!order.delivery_data) {
    return NextResponse.json({ error: "No delivery data yet" }, { status: 404 });
  }

  if (order.status !== "delivered" && order.status !== "disputed") {
    return NextResponse.json({ error: "Order not yet delivered" }, { status: 400 });
  }

  let decrypted: string;
  try {
    decrypted = decryptDeliveryData(order.delivery_data);
  } catch (e) {
    console.error("[DELIVERY-DATA] Decryption failed:", e);
    return NextResponse.json({ error: "Failed to decrypt delivery data" }, { status: 500 });
  }

  await logAuditEvent({
    event_type: "delivery_data.viewed",
    user_id: user.id,
    order_id: id,
    details: `Buyer viewed delivery data for order ${order.order_tracking_id}`,
  });

  return NextResponse.json({ delivery_data: decrypted });
}
