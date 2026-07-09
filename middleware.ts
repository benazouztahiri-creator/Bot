import { NextRequest, NextResponse } from "next/server";
import { verifyAdminTokenEdge } from "@/lib/adminAuthEdge";

const SESSION_COOKIE = "session_token";
const ADMIN_COOKIE = "admin_token";

function base64UrlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function getCsp(request: NextRequest): string {
  const hostname = request.nextUrl.hostname;
  const imgSrc = `img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://${hostname}`;
  return `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; ${imgSrc}; font-src 'self' data:; connect-src 'self'; frame-src 'none'; object-src 'none'`;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const adminToken = req.cookies.get(ADMIN_COOKIE)?.value;

  let isAdmin = false;
  let adminUserId: string | null = null;
  if (adminToken) {
    const result = await verifyAdminTokenEdge(adminToken);
    if (result) {
      isAdmin = true;
      adminUserId = result.userId;
    }
  }
  const hasSession = !!sessionToken;

  if (pathname.startsWith("/admin/login") || pathname.startsWith("/api/admin/login")) {
    const response = NextResponse.next();
    addSecurityHeaders(response, req);
    return response;
  }

  if (pathname.startsWith("/admin") && !hasSession && !isAdmin) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    const response = NextResponse.redirect(url);
    addSecurityHeaders(response, req);
    return response;
  }

  if (pathname.startsWith("/register") || pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    const response = NextResponse.next();
    addSecurityHeaders(response, req);
    return response;
  }

  if (pathname.startsWith("/seller") && !sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    addSecurityHeaders(response, req);
    return response;
  }

  if (pathname.startsWith("/orders") && !sessionToken) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    const response = NextResponse.redirect(url);
    addSecurityHeaders(response, req);
    return response;
  }

  const response = NextResponse.next();
  addSecurityHeaders(response, req);
  return response;
}

function addSecurityHeaders(response: NextResponse, req: NextRequest) {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  response.headers.set("Content-Security-Policy", getCsp(req));
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
}

export const config = {
  matcher: ["/admin/:path*", "/seller/:path*", "/orders/:path*"],
};
