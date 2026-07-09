"use client";

import { useRouter } from "next/navigation";
import DynamicProductWizard from "@/components/DynamicProductWizard";

export default function AdminNewProductPage() {
  const router = useRouter();

  return (
    <div>
      <DynamicProductWizard onComplete={() => router.push("/admin/products")} />
    </div>
  );
}
