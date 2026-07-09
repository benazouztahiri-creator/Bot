import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { readChatsResult, writeChats } from "@/lib/chats";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string; messageId: string }> }) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, messageId } = await ctx.params;

  const result = await readChatsResult();
  if (!result.ok) {
    return NextResponse.json({ error: "Storage error" }, { status: 500 });
  }

  const chats = result.chats;
  const chatIdx = chats.findIndex((c) => c.id === id);
  if (chatIdx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const chat = chats[chatIdx];
  const nextMessages = chat.messages.filter((m) => m.id !== messageId);
  if (nextMessages.length === chat.messages.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const nextChats = [...chats];
  nextChats[chatIdx] = { ...chat, messages: nextMessages };
  await writeChats(nextChats);

  return NextResponse.json({ ok: true });
}
