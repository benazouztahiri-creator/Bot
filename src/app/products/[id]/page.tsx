import Link from "next/link";
import { getProductById } from "@/lib/products";
import { getGameSpec } from "@/lib/game-specs";
import ProductImageGallery from "@/components/ProductImageGallery";
import ProductSpecDisplay from "@/components/ProductSpecDisplay";
import TrustBadge from "@/components/TrustBadge";
import EscrowFlow from "@/components/EscrowFlow";

export default async function ProductDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const product = await getProductById(id);
  if (!product) return <div className="mx-auto max-w-2xl pt-12"><section className="glass rounded-3xl p-6 text-center md:p-10"><h1 className="title">المنتج غير موجود</h1><Link href="/" className="btn-secondary mt-4 inline-block">الرئيسية</Link></section></div>;

  const spec = getGameSpec(product.category);

  const allImages = product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []);

  return (
    <div className="mx-auto max-w-2xl page-transition">
      <Link href="/" className="btn-secondary mb-4 inline-block">← الرجوع</Link>

      {/* Decision Card */}
      <section className="glass rounded-3xl p-6 md:p-8">
        <ProductImageGallery images={allImages} />

        <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="title">{product.title}</h1>
            <p className="subtitle mt-1">{spec?.name || product.category} • {product.product_type === "account" ? "حساب" : "شحن"}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
              product.status === "active" ? "bg-emerald-500/20 text-emerald-300"
              : product.status === "sold" ? "bg-rose-500/20 text-rose-300"
              : "bg-yellow-500/20 text-yellow-300"
            }`}>
              {product.status === "active" ? "متوفر" : product.status === "sold" ? "تم البيع" : "غير نشط"}
            </span>
            <div className="mt-2 text-3xl font-black text-indigo-300">{product.price} {product.currency}</div>
          </div>
        </div>

        {/* Trust Shield Message */}
        <div className="mt-4 decision-badge rounded-2xl p-4 text-center">
          <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-300">
            <span>🛡️</span>
            <span>أموالك محمية بواسطة نظام الوسيط في Nexivo</span>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-6">
          {product.status === "active" ? (
            <Link className="btn-primary w-full py-4 text-center text-lg animate-pulse-glow" href={`/orders/new?productId=${encodeURIComponent(product.id)}`}>
              شراء الآن
            </Link>
          ) : (
            <span className="btn-primary w-full py-4 text-center text-lg opacity-50 cursor-not-allowed block">
              {product.status === "sold" ? "تم البيع" : "غير متوفر"}
            </span>
          )}
        </div>

        {/* Trust Badges */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <TrustBadge variant="shield" />
          <TrustBadge variant="dispute" />
          <TrustBadge variant="secure" />
          <TrustBadge variant="guaranteed" />
        </div>
      </section>

      {/* Organized Specs from Game Spec */}
      {spec && product.attributes && Object.keys(product.attributes).length > 0 && (
        <section className="mt-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-sm font-black text-white/60">المواصفات</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="glass rounded-3xl p-5">
            <ProductSpecDisplay category={product.category} attributes={product.attributes} />
          </div>
        </section>
      )}

      {/* Description */}
      {product.description && (
        <section className="mt-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-sm font-black text-white/60">الوصف</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>
          <div className="glass rounded-3xl p-5">
            <div className="whitespace-pre-wrap break-words text-sm leading-7 text-white/80">
              {product.description}
            </div>
          </div>
        </section>
      )}

      {/* Escrow Flow */}
      {product.status === "active" && (
        <section className="mt-6 animate-fade-in-up stagger-3">
          <EscrowFlow />
        </section>
      )}
    </div>
  );
}
