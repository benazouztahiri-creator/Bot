import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent, createNotification } from "@/lib/auth";
import { createOrder, getOrdersByBuyer, getAllOrders } from "@/lib/orders";
import { getProductById } from "@/lib/products";
import { getDb } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const all = url.searchParams.get("all");

  if (user.role === "admin" && all === "1") {
    const orders = await getAllOrders();
    return NextResponse.json(orders);
  }

  const orders = await getOrdersByBuyer(user.id);
  return NextResponse.json(orders);
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

  const rlKey = getRateLimitKey(req, `create-order:${user.id}`);
  const rl = await checkRateLimit(rlKey, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many orders. Try again later." }, { status: 429 });
  }

  const body = await req.json();
  const { product_id, payment_proof_file, payment_flow, transaction_id } = body;

  if (!product_id) {
    return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
  }

  const useNewFlow = payment_flow === "new" || !!transaction_id;

  if (!useNewFlow && !payment_proof_file) {
    return NextResponse.json({ error: "Payment proof is required" }, { status: 400 });
  }

  if (useNewFlow && !transaction_id) {
    return NextResponse.json({ error: "Transaction ID is required for auto-verification" }, { status: 400 });
  }

  if (transaction_id) {
    const db = await getDb();
    const existingTx = await db.queryOne(
      "SELECT id FROM orders WHERE transaction_id = $1 AND status IN ('waiting_payment_verification', 'paid')",
      [transaction_id.trim()]
    );
    if (existingTx) {
      return NextResponse.json({ error: "Transaction ID already used for another order" }, { status: 409 });
    }
  }

  const product = await getProductById(product_id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  if (product.status !== "active") {
    return NextResponse.json({ error: "Product is not available" }, { status: 400 });
  }

  const order = await createOrder({
    buyer_id: user.id,
    product_id: product.id,
    product_type: product.product_type,
    currency: product.currency,
    product_price: product.price,
    payment_proof_file: payment_proof_file || "",
    initial_status: useNewFlow ? "waiting_payment_verification" : undefined,
    transaction_id: transaction_id?.trim() || undefined,
  });

  await logAuditEvent({
    event_type: "order.created",
    user_id: user.id,
    order_id: order.id,
    details: `New order created for product ${product.title} (flow: ${useNewFlow ? "auto-verify" : "legacy"})`,
  });

  const db1 = await getDb();
  const admins = await db1.query<{ id: string }>("SELECT id FROM users WHERE role = 'admin'");
  for (const a of admins) {
    await createNotification({ userId: a.id, orderId: order.id, type: "new_order", message: `طلب جديد من ${user.first_name}` });
  }

  return NextResponse.json(order, { status: 201 });
}
