import { NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOrderById, updateOrderStatus } from "@/lib/orders";
import { updateProduct } from "@/lib/products";
import { csrfGuard } from "@/lib/csrf";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { status, resolution_note } = body;

  if (!["closed", "resolved_buyer"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = await getDb();
  const dispute = await db.queryOne("SELECT * FROM disputes WHERE id = $1", [id]);
  if (!dispute) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const cleanNote = resolution_note ? sanitizeText(resolution_note, MAX_LENGTHS.RESOLUTION_NOTE) : null;
  await db.queryOne(`
    UPDATE disputes SET status = $1, resolved_by = $2, resolution_note = $3 WHERE id = $4
  `, [status, user.id, cleanNote, id]);

  if (status === "resolved_buyer" || status === "closed") {
    await updateOrderStatus(dispute.order_id, "delivered");
    const ord = await getOrderById(dispute.order_id);
    if (ord?.product_id) {
      await updateProduct(ord.product_id, { status: "sold" });
    }
  }

  await logAuditEvent({
    event_type: `dispute.${status}`,
    user_id: user.id,
    order_id: dispute.order_id,
    details: `Dispute resolved: ${resolution_note || "No note"}`,
  });

  return NextResponse.json({ ok: true });
}
