import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import { csrfGuard } from "@/lib/csrf";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;

    if (token) {
      const db = await getDb();
      await db.execute("DELETE FROM sessions WHERE token = $1", [token]);
    }

    const url = new URL(req.url);
    const response = NextResponse.json({ ok: true });
    response.cookies.set("session_token", "", {
      httpOnly: true,
      sameSite: "strict",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
