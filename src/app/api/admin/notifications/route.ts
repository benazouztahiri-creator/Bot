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
  const pendingReview = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM orders WHERE status IN ('payment_under_review', 'waiting_payment_verification')"
  );

  const openDisputes = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM disputes WHERE status = 'open'"
  );

  const manualReview = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM unmatched_payments WHERE reviewed = 0 AND amount IS NOT NULL AND (SELECT COUNT(*) FROM orders WHERE status = 'waiting_payment_verification' AND total_amount = unmatched_payments.amount) > 1"
  );

  const unmatchedPayments = await db.queryOne<{ count: number }>(
    "SELECT COUNT(*)::int as count FROM unmatched_payments WHERE reviewed = 0"
  );

  return NextResponse.json({
    pending_review: pendingReview?.count || 0,
    open_disputes: openDisputes?.count || 0,
    manual_review: manualReview?.count || 0,
    unmatched_payments: unmatchedPayments?.count || 0,
    total: (pendingReview?.count || 0) + (openDisputes?.count || 0),
  });
}
