import { NextResponse } from "next/server";
import { readProducts, createProduct, type ProductCategory } from "@/lib/products";
import { getSessionUser } from "@/lib/auth";
import { csrfGuard } from "@/lib/csrf";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";
import { validateAttributes } from "@/lib/game-specs";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") as ProductCategory | null;
  let products = await readProducts();
  if (category) products = products.filter((p) => p.category === category);
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (typeof body.price !== "number" || body.price < 0 || !Number.isFinite(body.price)) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  if (!body.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "Product title is required" }, { status: 400 });
  }

  if (!body.category || typeof body.category !== "string") {
    return NextResponse.json({ error: "Product category is required" }, { status: 400 });
  }

  const attributes = body.attributes || {};
  const validationErrors = validateAttributes(body.category, attributes);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: validationErrors.join("، ") }, { status: 400 });
  }

  const product = await createProduct({
    product_type: body.product_type || "account",
    category: body.category || "pubg",
    title: sanitizeText(body.title || "منتج جديد", MAX_LENGTHS.TITLE),
    description: sanitizeText(body.description || "", MAX_LENGTHS.DESCRIPTION),
    price: body.price,
    images: body.images || (body.image ? [body.image] : []),
    currency: body.currency || "DZD",
    attributes,
  });

  return NextResponse.json(product, { status: 201 });
}
