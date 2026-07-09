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

  const reports = await db.query(`
    SELECT r.*,
      (SELECT first_name || ' ' || last_name FROM users WHERE id = r.reporter_id) as reporter_name,
      (SELECT first_name || ' ' || last_name FROM users WHERE id = r.reported_user_id) as reported_user_name
    FROM reports r
    ORDER BY r.created_at DESC
    LIMIT 50
  `);

  return NextResponse.json(reports || []);
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { reported_user_id, report_type, description, evidence } = body;

  if (!reported_user_id || !report_type || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await getDb();
  const crypto = await import("crypto");
  const id = `rpt-${crypto.randomBytes(12).toString("hex")}`;

  await db.execute(`
    INSERT INTO reports (id, reporter_id, reported_user_id, report_type, description, evidence, status)
    VALUES ($1, $2, $3, $4, $5, $6, 'open')
  `, [id, user.id, reported_user_id, report_type, description, evidence || ""]);

  return NextResponse.json({ id, ok: true });
}
