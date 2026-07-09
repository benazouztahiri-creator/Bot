import { NextResponse } from "next/server";
import { processWebhookEmail, WebhookPayload } from "@/lib/paymentVerification";
import { getDb } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const expectedKey = process.env.WEBHOOK_API_KEY;
  if (expectedKey) {
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token || token !== expectedKey) {
      console.log(`[WEBHOOK] Rejected: invalid API key`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch (e) {
    console.error(`[WEBHOOK] Invalid JSON body:`, e);
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.log(`[WEBHOOK] Received webhook: id=${payload?.id}, from=${payload?.from}, messageId=${payload?.message_id}`);

  if (!payload || typeof payload !== "object") {
    console.log(`[WEBHOOK] Invalid payload type`);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (!payload.from || !payload.text) {
    console.log(`[WEBHOOK] Missing required fields: from=${!!payload.from}, text=${!!payload.text}`);
    return NextResponse.json({ error: "Missing required fields: from, text" }, { status: 400 });
  }

  try {
    const result = await processWebhookEmail(payload);
    console.log(`[WEBHOOK] Result: status=${result.status}, reason=${result.reason || "none"}, orderId=${result.order?.id || "none"}`);

    switch (result.status) {
      case "rejected_security":
        return NextResponse.json({ status: "rejected", reason: result.reason }, { status: 200 });
      case "rejected_duplicate":
        return NextResponse.json({ status: "duplicate", reason: result.reason }, { status: 200 });
      case "accepted":
        return NextResponse.json({
          status: "accepted",
          order_id: result.order?.id,
          order_tracking_id: result.order?.order_tracking_id,
        }, { status: 200 });
      case "manual_review":
        return NextResponse.json({ status: "manual_review", reason: result.reason }, { status: 200 });
    }
  } catch (e) {
    console.error(`[WEBHOOK] Unhandled error:`, e);
    try {
      const db = await getDb();
      await db.execute(
        `INSERT INTO processing_logs (id, email_log_id, step, details, created_at) VALUES ($1, $2, $3, $4, NOW())`,
        [`err_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`, "", "webhook_error", JSON.stringify({ error: String(e), payloadId: payload.id })]
      );
    } catch {}
    return NextResponse.json({ status: "error", reason: "Internal server error" }, { status: 500 });
  }
}
