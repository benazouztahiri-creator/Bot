import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDb();
  const url = new URL(req.url);
  const period = url.searchParams.get("period") || "today";

  const totalSales = await db.queryOne<{ val: number }>("SELECT COALESCE(SUM(product_price),0) as val FROM orders WHERE status = 'delivered'");
  const totalProfit = await db.queryOne<{ val: number }>("SELECT COALESCE(SUM(tax_amount),0) as val FROM orders WHERE status = 'delivered'");
  const totalOrders = await db.queryOne<{ val: number }>("SELECT COUNT(*)::int as val FROM orders");
  const completedOrders = await db.queryOne<{ val: number }>("SELECT COUNT(*)::int as val FROM orders WHERE status = 'delivered'");
  const cancelledOrders = await db.queryOne<{ val: number }>("SELECT COUNT(*)::int as val FROM orders WHERE status = 'payment_rejected'");
  const disputesCount = await db.queryOne<{ val: number }>("SELECT COUNT(*)::int as val FROM disputes WHERE status = 'open'");
  const buyers = await db.queryOne<{ val: number }>("SELECT COUNT(*)::int as val FROM users WHERE role = 'buyer'");
  const products = await db.queryOne<{ val: number }>("SELECT COUNT(*)::int as val FROM products WHERE status = 'active'");
  const totalCommissions = await db.queryOne<{ val: number }>("SELECT COALESCE(SUM(tax_amount),0) as val FROM orders WHERE status = 'delivered'");
  const heldFunds = await db.queryOne<{ val: number }>("SELECT COALESCE(SUM(total_amount),0) as val FROM orders WHERE status = 'delivered'");

  const allowedPeriods = ["today", "week", "month", "year", "all"] as const;
  const safePeriod = allowedPeriods.includes(period as typeof allowedPeriods[number]) ? period : "today";

  const periodFilters: Record<string, string> = {
    today: "DATE(created_at) = CURRENT_DATE",
    week: "created_at >= NOW() - INTERVAL '7 days'",
    month: "created_at >= NOW() - INTERVAL '30 days'",
    year: "created_at >= NOW() - INTERVAL '1 year'",
    all: "1=1",
  };

  const dateFilter = periodFilters[safePeriod] || "1=1";

  const periodSales = await db.queryOne<{ val: number }>(
    `SELECT COALESCE(SUM(product_price),0) as val FROM orders WHERE status = 'delivered' AND ${dateFilter}`
  );
  const periodOrders = await db.queryOne<{ val: number }>(
    `SELECT COUNT(*)::int as val FROM orders WHERE ${dateFilter}`
  );

  const dailySales = await db.query(`
    SELECT DATE(created_at) as label, COALESCE(SUM(product_price),0) as value
    FROM orders WHERE status = 'delivered' AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at) ORDER BY label
  `);

  const topProducts = await db.query(`
    SELECT p.title, COUNT(o.id)::int as sales, COALESCE(SUM(o.product_price),0) as revenue
    FROM orders o JOIN products p ON o.product_id = p.id
    WHERE o.status = 'delivered'
    GROUP BY o.product_id ORDER BY sales DESC LIMIT 5
  `);

  return NextResponse.json({
    cards: {
      total_sales: totalSales?.val || 0,
      total_profit: totalProfit?.val || 0,
      total_orders: totalOrders?.val || 0,
      completed_orders: completedOrders?.val || 0,
      cancelled_orders: cancelledOrders?.val || 0,
      disputes: disputesCount?.val || 0,
      buyers: buyers?.val || 0,
      products: products?.val || 0,
      total_commissions: totalCommissions?.val || 0,
      held_funds: heldFunds?.val || 0,
      period_sales: periodSales?.val || 0,
      period_orders: periodOrders?.val || 0,
    },
    charts: {
      daily_sales: dailySales,
    },
    top_products: topProducts,
  });
}
