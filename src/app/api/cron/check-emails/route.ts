import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") || "";
  const expectedKey = process.env.CRON_API_KEY;
  if (expectedKey) {
    const token = auth.replace(/^Bearer\s+/i, "").trim();
    if (!token || token !== expectedKey) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json({
    ok: true,
    deprecated: true,
    message: "IMAP email checking is deprecated. Use POST /api/webhook/incoming-email instead.",
    checked: 0,
    matched: 0,
    unmatched: 0,
    multiple: 0,
    errors: 0,
  });
}
