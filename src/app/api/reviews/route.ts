import { NextResponse } from "next/server";
import { getSessionUser, createNotification } from "@/lib/auth";
import { createReview, getAllReviews } from "@/lib/reviews";
import { getOrderById } from "@/lib/orders";
import { csrfGuard } from "@/lib/csrf";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const admin = url.searchParams.get("admin");
  const orderId = url.searchParams.get("order_id");

  if (admin === "1" && user.role === "admin") {
    const reviews = await getAllReviews({
      buyer_id: url.searchParams.get("buyer_id") || undefined,
      from_date: url.searchParams.get("from_date") || undefined,
      to_date: url.searchParams.get("to_date") || undefined,
      order_id: orderId || undefined,
    });
    return NextResponse.json(reviews);
  }

  if (orderId) {
    const reviews = await getAllReviews({ order_id: orderId, buyer_id: user.id });
    return NextResponse.json(reviews);
  }

  return NextResponse.json([]);
}

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { order_id, rating, comment } = body;

  if (!order_id || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "بيانات التقييم غير صحيحة" }, { status: 400 });
  }

  const order = await getOrderById(order_id);
  if (!order) return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  if (order.buyer_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (order.status !== "delivered") return NextResponse.json({ error: "لا يمكن التقييم قبل اكتمال الطلب" }, { status: 400 });

  try {
    const review = await createReview({
      order_id,
      buyer_id: user.id,
      rating,
      comment: sanitizeText(comment || "", MAX_LENGTHS.COMMENT),
    });

    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create review" }, { status: 400 });
  }
}
