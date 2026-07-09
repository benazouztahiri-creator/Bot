"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function AddProductButton() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user?.role === "admin") setIsAdmin(true);
      })
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  return (
    <Link
      href="/admin/products"
      className="group fixed bottom-6 left-1/2 z-40 -translate-x-1/2 md:bottom-10 md:left-auto md:right-10 md:translate-x-0
        flex h-14 items-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-400
        px-6 shadow-xl shadow-indigo-500/30 transition-all duration-200 hover:scale-110 hover:shadow-indigo-500/40 active:scale-95"
    >
      <span className="text-xl font-black leading-none">+</span>
      <span className="text-sm font-bold leading-none max-md:hidden">إضافة منتج</span>
    </Link>
  );
}
