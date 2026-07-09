"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavDashboardLink({ className: linkClass }: { className?: string }) {
  const [role, setRole] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setRole(d.user?.role || null))
      .catch(() => setRole(null));
  }, [pathname]);

  if (role === null) return null;

  let href = "/";
  let label = "";

  if (role === "admin") { href = "/admin"; label = "لوحة الإدارة"; }
  else if (role === "buyer") { href = "/orders"; label = "طلباتي"; }

  return (
    <Link href={href} className={linkClass}>
      {label}
    </Link>
  );
}
