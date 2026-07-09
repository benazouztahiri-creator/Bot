import { NextResponse } from "next/server";
import { getSettings } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    bank_name: settings.bank_name || "—",
    bank_account_holder: settings.bank_account_holder || "—",
    bank_iban: settings.bank_iban || "—",
    usdt_address: settings.usdt_address || "—",
    payment_email: settings.payment_email || "—",
    tax_rate: settings.tax_rate || "1",
  });
}
