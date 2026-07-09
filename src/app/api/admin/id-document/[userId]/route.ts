import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getDownloadUrl } from "@vercel/blob";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ userId: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await ctx.params;

  const db = await getDb();
  const target = await db.queryOne<{ id_file_path: string }>(
    "SELECT id_file_path FROM users WHERE id = $1",
    [userId]
  );

  if (!target || !target.id_file_path) {
    return NextResponse.json({ error: "No ID document found" }, { status: 404 });
  }

  try {
    const signedUrl = getDownloadUrl(target.id_file_path);
    return NextResponse.redirect(signedUrl);
  } catch {
    return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
  }
}
