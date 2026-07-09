import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "50", 10) || 50, 1), 500);
  const emailLogId = url.searchParams.get("email_log_id") || "";

  const db = await getDb();

  if (emailLogId) {
    const logs = await db.query(
      "SELECT * FROM processing_logs WHERE email_log_id = $1 ORDER BY created_at DESC LIMIT $2",
      [emailLogId, limit]
    );
    return NextResponse.json(logs);
  }

  const logs = await db.query(
    "SELECT * FROM processing_logs ORDER BY created_at DESC LIMIT $1",
    [limit]
  );

  return NextResponse.json(logs);
}
