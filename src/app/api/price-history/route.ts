import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getPriceHistory, getPriceStats, getAllPriceHistory } from "@/lib/priceHistory";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const productId = url.searchParams.get("product_id");
  const admin = url.searchParams.get("admin");

  if (admin === "1" && user.role === "admin") {
    const history = await getAllPriceHistory({
      product_id: url.searchParams.get("product_id") || undefined,
      from_date: url.searchParams.get("from_date") || undefined,
      to_date: url.searchParams.get("to_date") || undefined,
    });
    return NextResponse.json(history);
  }

  if (productId) {
    const [history, stats] = await Promise.all([
      getPriceHistory(productId),
      getPriceStats(productId),
    ]);
    return NextResponse.json({ history, stats });
  }

  return NextResponse.json([]);
}
