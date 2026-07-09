import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent, createNotification } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { getProductWithSecret } from "@/lib/products";
import crypto from "crypto";

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

  let secretCode = "";

  if (order.product_type === "account" && order.product_id) {
    const product = await getProductWithSecret(order.product_id);
    if (product?.product_secret_code) {
      secretCode = product.product_secret_code;
    }
  }

  if (!secretCode) {
    secretCode = crypto.randomBytes(9).toString("base64url").slice(0, 12);
  }

  const updated = await updateOrderStatus(id, "payment_confirmed_waiting_code", {
    payment_reviewed_by: user.id,
    order_secret_code: secretCode,
  });

  await logAuditEvent({
    event_type: "order.payment_confirmed",
    user_id: user.id,
    order_id: id,
    ip_address: _req.headers.get("x-forwarded-for") || undefined,
    details: `Payment confirmed for order ${order.order_tracking_id}`,
  });

  await createNotification({ userId: order.buyer_id, orderId: id, type: "payment_confirmed", message: "تم تأكيد الدفع، يمكنك الآن إرسال الكود للبائع" });

  return NextResponse.json(updated);
}
