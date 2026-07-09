import { NextResponse } from "next/server";
import { getSessionUser, generateVerificationToken, storeVerificationToken, invalidateOldVerificationTokens } from "@/lib/auth";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { csrfGuard } from "@/lib/csrf";
import { sendVerificationEmail } from "@/lib/email";

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.email_verified) {
    return NextResponse.json({ error: "Email already verified" }, { status: 400 });
  }

  const rlKey = getRateLimitKey(req, `send-verification:${user.id}`);
  const rl = await checkRateLimit(rlKey, 1, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Please wait before requesting another verification email." }, { status: 429 });
  }

  try {
    const { raw, hash } = generateVerificationToken();
    await invalidateOldVerificationTokens(user.id);
    await storeVerificationToken(user.id, hash);
    const emailSent = await sendVerificationEmail({ to: user.email, firstName: user.first_name, token: raw });

    if (!emailSent) {
      console.error("[SEND-VERIFICATION] Failed to send email to", user.email);
      return NextResponse.json({ error: "Failed to send verification email. Check server logs." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[SEND-VERIFICATION] Error:", e);
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 });
  }
}
