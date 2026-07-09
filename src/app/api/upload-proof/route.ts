import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { put } from "@vercel/blob";
import { checkRateLimit, getRateLimitKey } from "@/lib/rateLimit";
import { getRealMimeType } from "@/lib/mimeCheck";
import { csrfGuard } from "@/lib/csrf";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE = 4 * 1024 * 1024;

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function POST(req: Request) {
  const csrfResponse = csrfGuard(req);
  if (csrfResponse) return csrfResponse;

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.banned) {
    return NextResponse.json({ error: "Account banned" }, { status: 403 });
  }

  const rlKey = getRateLimitKey(req, `upload-proof:${user.id}`);
  const rl = await checkRateLimit(rlKey, 10, 60000);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Upload limit reached. Try again later." }, { status: 429 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error("BLOB_READ_WRITE_TOKEN is not set");
    return NextResponse.json({ error: "Blob storage not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const buf = Buffer.from(await file.arrayBuffer());

    const realMime = getRealMimeType(buf);
    if (!realMime || !ALLOWED_TYPES.includes(realMime)) {
      return NextResponse.json({ error: "Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed." }, { status: 400 });
    }

    const ext = EXT_MAP[realMime] || "jpg";
    const safeName = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(safeName, buf, {
      access: "public",
      contentType: realMime,
    });

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
