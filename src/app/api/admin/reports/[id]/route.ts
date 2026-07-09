import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, logAuditEvent } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, note } = body;

  if (!["resolve", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const status = action === "resolve" ? "resolved" : "dismissed";
  const db = await getDb();

  await db.execute(
    "UPDATE reports SET status = $1, resolution_note = $2, updated_at = NOW() WHERE id = $3",
    [status, note || "", id]
  );

  await logAuditEvent({
    event_type: `report.${status}`,
    user_id: user.id,
    details: `Report ${id} ${status}. Note: ${note || "N/A"}`,
  });

  return NextResponse.json({ ok: true });
}
