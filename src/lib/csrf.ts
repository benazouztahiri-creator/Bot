function normalizeOrigin(urlStr: string): string | null {
  try {
    const parsed = new URL(urlStr);
    let hostname = parsed.hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.slice(4);
    }
    return `${parsed.protocol}//${hostname}${parsed.port ? `:${parsed.port}` : ""}`;
  } catch {
    return null;
  }
}

export function validateOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  if (!origin && !referer) {
    return true;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const allowedOrigins = [
    appUrl,
    "https://nexivo.space",
    "https://www.nexivo.space",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
  ].filter(Boolean);

  const checkUrl = origin || referer || "";
  const normalizedCheck = normalizeOrigin(checkUrl);
  if (!normalizedCheck) return false;

  return allowedOrigins.some((allowed) => {
    if (!allowed) return false;
    const normalizedAllowed = normalizeOrigin(allowed);
    return normalizedAllowed === normalizedCheck;
  });
}

export function csrfGuard(req: Request): Response | null {
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    return null;
  }

  if (!validateOrigin(req)) {
    return new Response(JSON.stringify({ error: "CSRF validation failed" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}
