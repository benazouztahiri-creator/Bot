import { getDb } from "./db";
import crypto from "crypto";

export type ProductCategory = "pubg" | "free-fire" | "topup";

export type Product = {
  id: string;
  product_type: "account" | "recharge";
  category: ProductCategory;
  title: string;
  price: number;
  description: string;
  image?: string;
  images?: string[];
  currency?: string;
  status?: "active" | "inactive" | "sold";
  attributes?: Record<string, unknown>;
  created_at?: string;
};

export type ProductWithSecret = Product & {
  product_secret_code: string;
  delivery_data: string;
};

function rowToProduct(row: Record<string, unknown>): Product {
  const images = (() => {
    try {
      const parsed = JSON.parse((row.images as string) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();

  const attributes = (() => {
    try {
      const raw = row.attributes;
      if (typeof raw === "string") return JSON.parse(raw);
      if (raw && typeof raw === "object") return raw as Record<string, unknown>;
      return {};
    } catch {
      return {};
    }
  })();

  return {
    id: row.id as string,
    product_type: (row.product_type as "account" | "recharge") || "account",
    category: row.category as ProductCategory,
    title: row.title as string,
    price: row.price as number,
    description: row.description as string || "",
    image: images[0] || "/uploads/placeholder.svg",
    images,
    attributes,
    currency: (row.currency as string) || "DZD",
    status: (row.status as "active" | "inactive" | "sold") || "active",
    created_at: row.created_at as string,
  };
}

export async function readProducts(): Promise<Product[]> {
  const { query } = await getDb();
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM products WHERE status IN ('active', 'sold') ORDER BY created_at DESC`
  );
  return rows.map(rowToProduct);
}

export async function readAllProducts(): Promise<Product[]> {
  const { query } = await getDb();
  const rows = await query<Record<string, unknown>>(
    `SELECT * FROM products ORDER BY created_at DESC`
  );
  return rows.map(rowToProduct);
}

export async function writeProducts(products: Product[]): Promise<void> {
  const { query, getPool: getPgPool } = await getDb();
  const pool = getPgPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM products");
    for (const p of products) {
      await client.query(`
        INSERT INTO products (id, product_type, category, title, description, price, currency, images, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        p.id,
        p.product_type || "account",
        p.category,
        p.title,
        p.description || "",
        p.price,
        p.currency || "DZD",
        JSON.stringify(p.images || (p.image ? [p.image] : [])),
        p.status || "active",
      ]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function getProductById(id: string): Promise<Product | null> {
  const { queryOne } = await getDb();
  const row = await queryOne<Record<string, unknown>>(
    `SELECT * FROM products WHERE id = $1`, [id]);
  return row ? rowToProduct(row) : null;
}

export async function getProductWithSecret(id: string): Promise<ProductWithSecret | null> {
  const { queryOne } = await getDb();
  const row = await queryOne<Record<string, unknown>>(`SELECT * FROM products WHERE id = $1`, [id]);
  if (!row) return null;
  const base = rowToProduct(row);
  return {
    ...base,
    product_secret_code: (row.product_secret_code as string) || "",
    delivery_data: (row.delivery_data as string) || "",
  };
}

export async function createProduct(params: {
  product_type: "account" | "recharge";
  category: ProductCategory;
  title: string;
  description: string;
  price: number;
  images?: string[];
  currency?: string;
  attributes?: Record<string, unknown>;
}): Promise<Product> {
  const { queryOne } = await getDb();
  const id = `prod-${crypto.randomBytes(8).toString("hex")}`;
  const secretCode = params.product_type === "account"
    ? crypto.randomBytes(9).toString("base64url").slice(0, 12)
    : "";

  await queryOne(`
    INSERT INTO products (id, product_type, category, title, description, price, currency, images, product_secret_code, attributes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `, [
    id,
    params.product_type,
    params.category,
    params.title,
    params.description,
    params.price,
    params.currency || "DZD",
    JSON.stringify(params.images || []),
    secretCode,
    JSON.stringify(params.attributes || {}),
  ]);

  const row = await queryOne<Record<string, unknown>>("SELECT * FROM products WHERE id = $1", [id]);
  return rowToProduct(row!);
}

export async function updateProduct(id: string, updates: Partial<Product> & { attributes?: Record<string, unknown> }): Promise<Product | null> {
  const { queryOne } = await getDb();
  const existing = await queryOne<Record<string, unknown>>("SELECT * FROM products WHERE id = $1", [id]);
  if (!existing) return null;

  await queryOne(`
    UPDATE products SET
      title = COALESCE($1, title),
      description = COALESCE($2, description),
      price = COALESCE($3, price),
      currency = COALESCE($4, currency),
      category = COALESCE($5, category),
      status = COALESCE($6, status),
      images = COALESCE($7, images),
      attributes = COALESCE($8, attributes)
    WHERE id = $9
  `, [
    updates.title || null,
    updates.description || null,
    updates.price ?? null,
    updates.currency || null,
    updates.category || null,
    updates.status || null,
    updates.images ? JSON.stringify(updates.images) : null,
    updates.attributes ? JSON.stringify(updates.attributes) : null,
    id,
  ]);

  const row = await queryOne<Record<string, unknown>>("SELECT * FROM products WHERE id = $1", [id]);
  return rowToProduct(row!);
}

export async function deleteProduct(id: string): Promise<boolean> {
  const { execute, getPool } = await getDb();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM price_history WHERE product_id = $1", [id]);
    await client.query("DELETE FROM order_chat_messages WHERE order_id IN (SELECT id FROM orders WHERE product_id = $1)", [id]);
    await client.query("UPDATE orders SET product_id = NULL WHERE product_id = $1", [id]);
    const result = await client.query("DELETE FROM products WHERE id = $1", [id]);
    await client.query("COMMIT");
    return (result.rowCount ?? 0) > 0;
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("[PRODUCTS] Failed to delete product", id, ":", e);
    throw e;
  } finally {
    client.release();
  }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
