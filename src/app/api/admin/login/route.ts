import { NextResponse } from "next/server";
import { loginUser, createSession, setSessionCookie } from "@/lib/auth";
import { setAdminCookie } from "@/lib/adminAuth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const rlKey = getRateLimitKey(req, "admin-login");
  const rl = await checkRateLimit(rlKey, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await loginUser(email, password);

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = await createSession(user.id);
    await setSessionCookie(token);
    await setAdminCookie(user.id);

    return NextResponse.json({ ok: true, role: "admin" });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
