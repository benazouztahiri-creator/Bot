import { NextResponse } from "next/server";
import { getSessionUser, getSettings, setSetting } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const allowedKeys = [
    "tax_rate", "warranty_days", "bank_name", "bank_account_holder",
    "bank_iban", "usdt_address", "payment_email",
  ];

  for (const [key, value] of Object.entries(body)) {
    if (allowedKeys.includes(key) && typeof value === "string") {
      await setSetting(key, value);
    }
  }

  const settings = await getSettings();
  return NextResponse.json(settings);
}
