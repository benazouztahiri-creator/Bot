import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: Request, props: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await props.params;
    const { queryOne, query } = await getDb();

    const user = await queryOne<{
      id: string; first_name: string; last_name: string;
      role: string; created_at: string;
    }>(
      "SELECT id, first_name, last_name, role, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
