"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return null;

  return (
    <footer className="border-t border-white/10 py-10 text-white/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 md:flex-row md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} Nexivo</div>
      </div>
    </footer>
  );
}
