import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { updateReview, deleteReview, hideReviewComment } from "@/lib/reviews";

export const runtime = "nodejs";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await ctx.params;
  const body = await req.json();

  if (user.role === "admin") {
    if (body.action === "hide") {
      await hideReviewComment(id);
      return NextResponse.json({ ok: true });
    }
  }

  try {
    const review = await updateReview(id, user.id, body.rating, body.comment);
    return NextResponse.json(review);
  } catch {
    return NextResponse.json({ error: "Failed to update review" }, { status: 400 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  await deleteReview(id);
  return NextResponse.json({ ok: true });
}
