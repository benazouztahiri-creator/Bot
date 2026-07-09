import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { getDb } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rlKey = getRateLimitKey(req, `submit-payment:${user.id}`);
  const rl = await checkRateLimit(rlKey, 3, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const { id } = await ctx.params;
  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "waiting_for_payment") {
    return NextResponse.json({ error: "Invalid order status" }, { status: 400 });
  }

  const body = await req.json();
  const { transaction_id, payment_proof_file } = body;

  if (!transaction_id || !transaction_id.trim()) {
    return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
  }

  if (!payment_proof_file || !payment_proof_file.trim()) {
    return NextResponse.json({ error: "Payment proof is required" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.queryOne(
    "SELECT id FROM orders WHERE transaction_id = $1 AND id != $2 AND status IN ('waiting_payment_verification', 'paid')",
    [transaction_id.trim(), id]
  );
  if (existing) {
    return NextResponse.json({ error: "Transaction ID already used for another order" }, { status: 409 });
  }

  const updated = await updateOrderStatus(id, "waiting_payment_verification", {
    transaction_id: transaction_id.trim(),
    payment_proof_file: payment_proof_file.trim(),
    payment_proof_submitted_at: new Date().toISOString(),
  });

  await logAuditEvent({
    event_type: "order.payment_submitted",
    user_id: user.id,
    order_id: id,
    details: `Buyer submitted payment proof for order ${order.order_tracking_id}`,
  });

  return NextResponse.json(updated);
}
