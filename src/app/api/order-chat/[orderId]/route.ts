import { NextResponse } from "next/server";
import { getSessionUser, generateId } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOrderById } from "@/lib/orders";

export const runtime = "nodejs";

export async function GET(_req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await ctx.params;
  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user.role !== "admin" && order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await getDb();
  const messages = await db.query(`
    SELECT m.*, u.first_name || ' ' || u.last_name AS sender_name
    FROM order_chat_messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.order_id = $1
    ORDER BY m.created_at ASC
  `, [orderId]);

  return NextResponse.json(messages);
}

export async function POST(req: Request, ctx: { params: Promise<{ orderId: string }> }) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json({ error: "Account banned" }, { status: 403 });
  }

  const { orderId } = await ctx.params;
  const order = await getOrderById(orderId);
  if (!order) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (user.role !== "admin" && order.buyer_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { text } = body;

  if (!text || !text.trim()) {
    return NextResponse.json({ error: "Message text is required" }, { status: 400 });
  }

  const db = await getDb();
  const id = generateId("chatmsg");
  const now = new Date().toISOString();

  await db.queryOne(`
    INSERT INTO order_chat_messages (id, order_id, sender_id, text, created_at)
    VALUES ($1, $2, $3, $4, $5) RETURNING id
  `, [id, orderId, user.id, text, now]);

  const rows = await db.query(`
    SELECT m.*, u.first_name || ' ' || u.last_name AS sender_name
    FROM order_chat_messages m
    LEFT JOIN users u ON m.sender_id = u.id
    WHERE m.id = $1
  `, [id]);
  return NextResponse.json(rows[0], { status: 201 });
}
