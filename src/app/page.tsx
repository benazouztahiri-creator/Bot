import Link from "next/link";
import { getDb } from "@/lib/db";
import EscrowFlow from "@/components/EscrowFlow";
import TrustBadge from "@/components/TrustBadge";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { queryOne } = await getDb();
  const userCount = await queryOne<{ c: number }>("SELECT COUNT(*) as c FROM users");
  const orderCount = await queryOne<{ c: number }>("SELECT COUNT(*) as c FROM orders WHERE status = 'delivered'");

  const stats = [
    { label: "مستخدم مسجل", value: (userCount?.c || 0).toLocaleString("ar-DZ"), icon: "👥" },
    { label: "صفقة مكتملة", value: (orderCount?.c || 0).toLocaleString("ar-DZ"), icon: "✅" },
    { label: "نسبة رضا", value: "98%", icon: "⭐" },
    { label: "وساطة آمنة", value: "100%", icon: "🛡️" },
  ];



  const categories = [
    { href: "/pubg", name: "PUBG", title: "حسابات ببجي", desc: "حسابات وسكنات ومستويات نادرة", gradient: "from-amber-500/20 to-orange-600/10", icon: "🎯" },
    { href: "/free-fire", name: "Free Fire", title: "حسابات فري فاير", desc: "حسابات نادرة وعروض مميزة", gradient: "from-rose-500/20 to-pink-600/10", icon: "🔥" },
    { href: "/topup", name: "Top-up", title: "خدمات الشحن", desc: "شحن شدات وجواهر وعملات بسرعة", gradient: "from-emerald-500/20 to-teal-600/10", icon: "⚡" },
  ];

  const faq = [
    { q: "ما هي الوساطة الرقمية؟", a: "نظام يضمن حق البائع والمشتري. المشتري يدفع للمنصة، المنصة تحتفظ بالمبلغ لحين تأكيد الاستلام، ثم تصرفه للبائع." },
    { q: "كم تستغرق عملية الشراء؟", a: "متوسط وقت التسليم أقل من 24 ساعة من تاريخ تأكيد الدفع." },
    { q: "ماذا لو واجهت مشكلة مع البائع؟", a: "فريق Nexivo للدعم يتدخل فوراً. يمكنك فتح نزاع من لوحة الطلبات، ونقوم بالتحقيق خلال 24 ساعة." },

  ];

  return (
    <div className="grid gap-6 page-transition">
      {/* Hero */}
      <section className="animate-fade-in-up relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10 p-6 md:p-12">
        <div className="absolute left-0 top-0 h-full w-1/2 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
            <span>🛡️</span>
            <span>منصة وساطة رقمية — أمان ١٠٠٪</span>
          </div>
          <h1 className="title mt-6 bg-gradient-to-r from-indigo-200 via-white to-emerald-200 bg-clip-text text-transparent">
            Nexivo
          </h1>
          <p className="subtitle max-w-2xl">
            منصة الوساطة الأكثر أماناً لبيع وشراء المنتجات الرقمية.
            <span className="block mt-1 text-white/90">نحن الحارس بين البائع والمشتري. أموالك في أمان.</span>
          </p>

          <div className="mt-8 grid gap-3 sm:flex sm:flex-wrap">
            <Link className="btn-primary px-8 py-3 text-base animate-pulse-glow" href="/pubg">
              تسوق الآن
            </Link>
            <Link className="btn-secondary px-8 py-3 text-base" href="#how-it-works">
              كيف يعمل؟
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="animate-fade-in-up stagger-1 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {stats.map((s, i) => (
          <div key={i} className="glass rounded-3xl p-5 text-center">
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-2xl font-black text-white">{s.value}</div>
            <div className="mt-1 text-sm text-white/60">{s.label}</div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="animate-fade-in-up stagger-2 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {categories.map((cat) => (
          <Link key={cat.href} href={cat.href} className="product-card glass rounded-3xl p-6 overflow-hidden relative">
            <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient} opacity-60 transition duration-300 group-hover:opacity-100`} />
            <div className="relative">
              <div className="text-3xl">{cat.icon}</div>
              <div className="mt-2 text-xs font-bold text-white/50">{cat.name}</div>
              <div className="mt-1 text-xl font-black text-white">{cat.title}</div>
              <div className="mt-2 text-sm leading-7 text-white/70">{cat.desc}</div>
            </div>
          </Link>
        ))}
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="animate-fade-in-up stagger-3">
        <EscrowFlow />
      </section>

      {/* Trust Signals */}
      <section className="animate-fade-in-up stagger-5 glass rounded-3xl p-6 md:p-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
            <span>🛡️</span>
            <span>لماذا Nexivo؟</span>
          </div>
          <h2 className="title mt-6 text-white">الثقة هي أساسنا</h2>
          <p className="subtitle max-w-xl mx-auto">نظام متكامل يحمي البائع والمشتري من البداية للنهاية.</p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <TrustBadge variant="shield" showDescription />
          <TrustBadge variant="dispute" showDescription />
          <TrustBadge variant="secure" showDescription />
          <TrustBadge variant="guaranteed" showDescription />
        </div>
      </section>

      {/* FAQ */}
      <section className="animate-fade-in-up stagger-6 glass rounded-3xl p-6 md:p-10">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-sm font-bold text-amber-300">
            <span>❓</span>
            <span>أسئلة شائعة</span>
          </div>
          <h2 className="title mt-6 text-white">كل ما تحتاج معرفته</h2>
          <p className="subtitle max-w-xl mx-auto">إجابات سريعة لأكثر الأسئلة شيوعاً حول المنصة.</p>
        </div>

        <div className="mt-10 grid gap-3 max-w-2xl mx-auto">
          {faq.map((item, i) => (
            <details key={i} className="group rounded-2xl border border-white/10 bg-white/[0.03] transition duration-200 hover:bg-white/[0.06]">
              <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-white">
                <span>{item.q}</span>
                <span className="text-white/40 transition duration-200 group-open:rotate-180">▼</span>
              </summary>
              <div className="px-5 pb-5 text-sm leading-7 text-white/70">
                {item.a}
              </div>
            </details>
          ))}
        </div>
      </section>


    </div>
  );
}
