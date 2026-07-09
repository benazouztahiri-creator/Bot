import { NextResponse } from "next/server";
import { registerUser, createSession, sanitizeUser, generateVerificationToken, storeVerificationToken, invalidateOldVerificationTokens } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { csrfGuard } from "@/lib/csrf";
import { sanitizeText, MAX_LENGTHS } from "@/lib/validate";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const rlKey = getRateLimitKey(req, "register");
  const rl = await checkRateLimit(rlKey, 5, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many registration attempts. Try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password, first_name, last_name } = body;

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (password.length > MAX_LENGTHS.PASSWORD) {
      return NextResponse.json({ error: "Password is too long" }, { status: 400 });
    }

    const db = await getDb();
    const existing = await db.queryOne<{ id: string }>("SELECT id FROM users WHERE email = $1", [email]);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const user = await registerUser({
      email: email.trim().toLowerCase(),
      password,
      first_name: sanitizeText(first_name, MAX_LENGTHS.FIRST_NAME),
      last_name: sanitizeText(last_name, MAX_LENGTHS.LAST_NAME),
      role: "buyer",
      date_of_birth: body.date_of_birth || "",
    });

    const { raw, hash } = generateVerificationToken();
    await invalidateOldVerificationTokens(user.id);
    await storeVerificationToken(user.id, hash);
    const emailSent = await sendVerificationEmail({ to: user.email, firstName: user.first_name, token: raw });
    if (!emailSent) {
      console.error("[REGISTER] Failed to send verification email to", user.email, "- account created but email not sent. Check RESEND_API_KEY and RESEND_FROM_EMAIL in env.");
    }

    const token = await createSession(user.id);
    const url = new URL(req.url);
    const safeUser = sanitizeUser(user);
    const response = NextResponse.json({ user: safeUser, email_verified: false, email_sent: emailSent }, { status: 201 });
    response.cookies.set("session_token", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
