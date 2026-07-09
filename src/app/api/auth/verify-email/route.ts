import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { invalidateOldVerificationTokens } from "@/lib/auth";
import crypto from "crypto";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    console.warn("[VERIFY-EMAIL] No token provided in query params");
    return NextResponse.redirect(new URL("/login?verification=failed", req.url));
  }

  try {
    const db = await getDb();
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const record = await db.queryOne<{ user_id: string; id: string }>(
      "SELECT id, user_id FROM email_verification_tokens WHERE token_hash = $1 AND expires_at > NOW()",
      [hash]
    );

    if (!record) {
      console.warn("[VERIFY-EMAIL] Invalid or expired token");
      return NextResponse.redirect(new URL("/login?verification=invalid", req.url));
    }

    await db.execute("UPDATE users SET email_verified = 1 WHERE id = $1", [record.user_id]);
    await db.execute("DELETE FROM email_verification_tokens WHERE id = $1", [record.id]);
    await invalidateOldVerificationTokens(record.user_id);

    console.log("[VERIFY-EMAIL] Email verified successfully for user", record.user_id);
    return NextResponse.redirect(new URL("/login?verification=success", req.url));
  } catch (e) {
    console.error("[VERIFY-EMAIL] Error during verification:", e);
    return NextResponse.redirect(new URL("/login?verification=error", req.url));
  }
}
