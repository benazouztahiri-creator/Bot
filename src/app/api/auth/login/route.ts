import { NextResponse } from "next/server";
import { loginUser, createSession, sanitizeUser } from "@/lib/auth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { csrfGuard } from "@/lib/csrf";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const rlKey = getRateLimitKey(req, "login");
  const rl = await checkRateLimit(rlKey, 10, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many login attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await loginUser(email, password);
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const token = await createSession(user.id);
    const url = new URL(req.url);
    const safeUser = sanitizeUser(user);
    const emailVerified = !!user.email_verified;
    const response = NextResponse.json({
      user: safeUser,
      email_verified: emailVerified,
      requires_verification: !emailVerified,
    });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
