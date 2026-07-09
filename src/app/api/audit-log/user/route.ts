import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const targetId = searchParams.get("id");

  if (!targetId || targetId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const logs = await db.query(
    "SELECT id, event_type, details, ip_address, created_at FROM audit_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20",
    [targetId]
  );

  return NextResponse.json(logs);
}
