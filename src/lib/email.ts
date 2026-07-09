const RESEND_API = "https://api.resend.com/emails";

export async function sendVerificationEmail(params: {
  to: string;
  firstName: string;
  token: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[EMAIL] RESEND_API_KEY is not set — cannot send verification email");
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    console.error("[EMAIL] RESEND_FROM_EMAIL is not set — cannot send verification email");
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${params.token}`;

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">مرحباً ${params.firstName}!</h2>
      <p>شكراً لتسجيلك في منصتنا. يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط أدناه:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          تأكيد البريد الإلكتروني
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">هذا الرابط صالح لمدة 24 ساعة. إذا لم تقم بالتسجيل، يمكنك تجاهل هذه الرسالة.</p>
      <p style="color: #666; font-size: 14px;">إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:</p>
      <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${verifyUrl}</p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.to,
        subject: "تأكيد البريد الإلكتروني - BUPG",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "no body");
      console.error("[EMAIL] Resend API returned error", res.status, body);
    } else {
      console.log("[EMAIL] Verification email sent to", params.to);
    }

    return res.ok;
  } catch (e) {
    console.error("[EMAIL] Failed to send verification email:", e);
    return false;
  }
}

export async function sendPasswordResetEmail(params: {
  to: string;
  token: string;
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[EMAIL] RESEND_API_KEY is not set");
    return false;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL;
  if (!fromEmail) {
    console.error("[EMAIL] RESEND_FROM_EMAIL is not set");
    return false;
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${params.token}`;

  const html = `
    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4f46e5;">إعادة تعيين كلمة المرور</h2>
      <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
          إعادة تعيين كلمة المرور
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">هذا الرابط صالح لمدة ساعة واحدة. إذا لم تقم بطلب إعادة التعيين، يمكنك تجاهل هذه الرسالة.</p>
      <p style="color: #666; font-size: 14px;">إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:</p>
      <p style="color: #4f46e5; font-size: 12px; word-break: break-all;">${resetUrl}</p>
    </div>
  `;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: params.to,
        subject: "إعادة تعيين كلمة المرور - BUPG",
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "no body");
      console.error("[EMAIL] Resend API returned error", res.status, body);
    }

    return res.ok;
  } catch (e) {
    console.error("[EMAIL] Failed to send password reset email:", e);
    return false;
  }
}
