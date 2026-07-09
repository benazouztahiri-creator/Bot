"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavAuthButton({ className: linkClass }: { className?: string }) {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setUser(d.user || null))
      .catch(() => setUser(null));
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  if (user) {
    return (
      <button onClick={handleLogout} className={linkClass}>
        تسجيل الخروج
      </button>
    );
  }

  return (
    <Link href="/login" className={linkClass}>
      تسجيل الدخول
    </Link>
  );
}
