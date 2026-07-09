import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { csrfGuard } from "@/lib/csrf";

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

  if (user.role !== "admin" && order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status: newStatus, ...extra } = body;

  const order = await getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const updated = await updateOrderStatus(id, newStatus, extra);
    await logAuditEvent({
      event_type: `order.${newStatus}`,
      user_id: user.id,
      order_id: id,
      details: `Order status changed to ${newStatus}`,
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
  }
}
