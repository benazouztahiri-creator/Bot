import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    await db.query("SELECT 1");
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch (e) {
    return NextResponse.json({ status: "unhealthy", database: "disconnected", error: String(e) }, { status: 500 });
  }
}
