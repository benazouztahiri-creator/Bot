import { getDb } from "./db";
import crypto from "crypto";

export type PriceHistoryEntry = {
  id: string;
  product_id: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  reason: string;
  created_at: string;
  changer_name?: string;
  product_title?: string;
};

export async function recordPriceChange(params: {
  product_id: string;
  old_price: number;
  new_price: number;
  changed_by: string;
  reason?: string;
}): Promise<void> {
  const { queryOne } = await getDb();
  const id = `ph-${crypto.randomBytes(12).toString("hex")}`;
  await queryOne(`
    INSERT INTO price_history (id, product_id, old_price, new_price, changed_by, reason)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [id, params.product_id, params.old_price, params.new_price, params.changed_by, params.reason || ""]);
}

export async function getPriceHistory(productId: string): Promise<PriceHistoryEntry[]> {
  const { query } = await getDb();
  return query<PriceHistoryEntry>(`
    SELECT ph.*, u.first_name || ' ' || u.last_name as changer_name
    FROM price_history ph
    LEFT JOIN users u ON ph.changed_by = u.id
    WHERE ph.product_id = $1
    ORDER BY ph.created_at DESC
  `, [productId]);
}

export async function getPriceStats(productId: string) {
  const { query, queryOne } = await getDb();
  const rows = await query<{
    change_count: number;
    highest_price: number;
    lowest_price: number;
    avg_price: number;
  }>(`
    SELECT
      COUNT(*)::int as change_count,
      COALESCE(MAX(new_price),0) as highest_price,
      COALESCE(MIN(new_price),0) as lowest_price,
      COALESCE(AVG(new_price),0) as avg_price
    FROM price_history WHERE product_id = $1
  `, [productId]);

  const row = rows[0] || { change_count: 0, highest_price: 0, lowest_price: 0, avg_price: 0 };

  const lastChange = await queryOne<{ created_at: string }>(`
    SELECT created_at FROM price_history WHERE product_id = $1 ORDER BY created_at DESC LIMIT 1
  `, [productId]);

  return {
    change_count: row.change_count || 0,
    highest_price: row.highest_price || 0,
    lowest_price: row.lowest_price || 0,
    avg_price: Math.round((row.avg_price || 0) * 100) / 100,
    last_change: lastChange?.created_at || null,
  };
}

export async function getAllPriceHistory(filters?: {
  product_id?: string;
  from_date?: string;
  to_date?: string;
}): Promise<PriceHistoryEntry[]> {
  const { query } = await getDb();
  let sql = `
    SELECT ph.*, u.first_name || ' ' || u.last_name as changer_name,
      p.title as product_title
    FROM price_history ph
    LEFT JOIN users u ON ph.changed_by = u.id
    LEFT JOIN products p ON ph.product_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  let idx = 1;

  if (filters?.product_id) { sql += ` AND ph.product_id = $${idx++}`; params.push(filters.product_id); }
  if (filters?.from_date) { sql += ` AND ph.created_at >= $${idx++}`; params.push(filters.from_date); }
  if (filters?.to_date) { sql += ` AND ph.created_at <= $${idx++}`; params.push(filters.to_date); }

  sql += " ORDER BY ph.created_at DESC LIMIT 200";
  return query<PriceHistoryEntry>(sql, params);
}
