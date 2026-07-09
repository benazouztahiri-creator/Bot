import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();

  const logs = await db.query(`
    SELECT id, event_type, details, user_id,
      (SELECT first_name || ' ' || last_name FROM users WHERE id = a.user_id) as user_name,
      created_at
    FROM audit_log a
    ORDER BY created_at DESC
    LIMIT 20
  `);

  const mapped = (logs || []).map((l: any) => ({
    id: l.id,
    type: l.event_type,
    description: l.details || l.event_type,
    user_name: l.user_name || "",
    created_at: l.created_at,
  }));

  return NextResponse.json(mapped);
}
