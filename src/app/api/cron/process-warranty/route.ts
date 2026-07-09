import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const apiKey = process.env.CRON_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  const { headers } = await import("next/headers");
  const h = await headers();
  const auth = h.get("authorization");
  if (auth !== `Bearer ${apiKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Seller payment system has been removed. Warranty processing is no longer needed.
  return NextResponse.json({ processed: 0, total: 0 });
}
