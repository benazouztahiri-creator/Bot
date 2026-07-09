"use client";

import { usePathname } from "next/navigation";
import HeaderNav from "@/components/HeaderNav";

export default function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-zinc-950/50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 pb-3 pt-[calc(0.75rem+env(safe-area-inset-top))] md:flex-row md:items-center md:justify-between md:gap-4 md:py-4">
        <HeaderNav />
      </div>
    </header>
  );
}
