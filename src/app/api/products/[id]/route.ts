import { NextResponse } from "next/server";
import { updateProduct, deleteProduct, readAllProducts } from "@/lib/products";
import { getSessionUser } from "@/lib/auth";
import { recordPriceChange } from "@/lib/priceHistory";
import { csrfGuard } from "@/lib/csrf";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";

export const runtime = "nodejs";

const ALLOWED_FIELDS = ["title", "description", "price", "images", "status", "currency", "attributes", "category", "product_type", "delivery_data", "product_secret_code"];

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json();

  const products = await readAllProducts();
  const product = products.find((p) => p.id === id);
  if (!product) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filteredBody: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      let value = body[field];
      if (typeof value === "string" && field !== "images" && field !== "price" && field !== "currency" && field !== "status") {
        value = sanitizeText(value, field === "title" ? MAX_LENGTHS.TITLE : MAX_LENGTHS.DESCRIPTION);
      }
      filteredBody[field] = value;
    }
  }

  if (body.price !== undefined && body.price !== product.price) {
    await recordPriceChange({
      product_id: id,
      old_price: product.price,
      new_price: body.price,
      changed_by: user.id,
      reason: body.price_reason || "تعديل السعر",
    });
  }

  const updated = await updateProduct(id, filteredBody);
  return NextResponse.json(updated);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const deleted = await deleteProduct(id);
    return NextResponse.json({ ok: deleted });
  } catch (e) {
    console.error("[PRODUCTS] Error deleting product:", e);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
