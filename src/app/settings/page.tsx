"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import SensitiveToggle from "@/components/SensitiveToggle";
import PasswordInput from "@/components/PasswordInput";

type SafeUser = {
  id: string; role: string; email: string;
  first_name: string; last_name: string; date_of_birth: string;
  payment_full_name: string; payment_surname: string;
  payment_dob: string; payment_rip: string;
  payment_currency: string; payment_usdt_address: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<SafeUser | null>(null);
  const [loading, setLoading] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [savingInfo, setSavingInfo] = useState(false);

  const [payFullName, setPayFullName] = useState("");
  const [paySurname, setPaySurname] = useState("");
  const [payDob, setPayDob] = useState("");
  const [payRip, setPayRip] = useState("");
  const [payCurrency, setPayCurrency] = useState("DZD");
  const [payUsdt, setPayUsdt] = useState("");
  const [savingPay, setSavingPay] = useState(false);

  const [curPassword, setCurPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.user) { router.push("/login"); return; }
        const u = d.user;
        setUser(u);
        setFirstName(u.first_name || "");
        setLastName(u.last_name || "");
        setDob(u.date_of_birth || "");
        setPayFullName(u.payment_full_name || "");
        setPaySurname(u.payment_surname || "");
        setPayDob(u.payment_dob || "");
        setPayRip(u.payment_rip || "");
        setPayCurrency(u.payment_currency || "DZD");
        setPayUsdt(u.payment_usdt_address || "");
        setLoading(false);
        if (d.user?.id) {
          fetch(`/api/audit-log/user?id=${encodeURIComponent(d.user.id)}`, { cache: "no-store" })
            .then((r) => r.ok ? r.json() : [])
            .then((events) => setSecurityEvents(Array.isArray(events) ? events : []))
            .catch(() => {})
            .finally(() => setEventsLoading(false));
        } else {
          setEventsLoading(false);
        }
      })
      .catch(() => router.push("/login"));
  }, [router]);

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, date_of_birth: dob }),
      });
      const data = await res.json();
      if (res.ok) { toast("success", "تم تحديث المعلومات."); setUser(data.user); }
      else { toast("error", data.error || "فشل التحديث."); }
    } catch { toast("error", "خطأ في الاتصال."); }
    setSavingInfo(false);
  }

  async function handleSavePayment(e: React.FormEvent) {
    e.preventDefault();
    setSavingPay(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_full_name: payFullName,
          payment_surname: paySurname,
          payment_dob: payDob,
          payment_rip: payRip,
          payment_currency: payCurrency,
          payment_usdt_address: payUsdt,
        }),
      });
      const data = await res.json();
      if (res.ok) { toast("success", "تم تحديث طريقة الدفع."); setUser(data.user); }
      else { toast("error", data.error || "فشل التحديث."); }
    } catch { toast("error", "خطأ في الاتصال."); }
    setSavingPay(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast("error", "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    setChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: curPassword, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok) { toast("success", "تم تغيير كلمة المرور."); setCurPassword(""); setNewPassword(""); }
      else { toast("error", data.error || "فشل تغيير كلمة المرور."); }
    } catch { toast("error", "خطأ في الاتصال."); }
    setChangingPassword(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/auth/me", { method: "DELETE" });
      if (res.ok) { toast("info", "تم حذف الحساب."); router.push("/"); }
      else { const d = await res.json(); toast("error", d.error || "فشل الحذف."); }
    } catch { toast("error", "خطأ في الاتصال."); }
    setDeleting(false);
  }

  if (loading) return <div className="mx-auto max-w-2xl pt-12"><section className="glass rounded-3xl p-6 md:p-10"><p className="text-center text-white/60">جاري التحميل...</p></section></div>;

  const inputClass = "h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none focus:border-indigo-400/50 w-full";
  const labelClass = "text-sm font-bold text-white/80";

  return (
    <div className="mx-auto max-w-2xl page-transition">
      <h1 className="title mb-6">الإعدادات</h1>

      {/* Personal Info */}
      <section className="glass rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-black">المعلومات الشخصية</h2>
        <p className="mt-1 text-sm text-white/60">
          <SensitiveToggle>{user?.email}</SensitiveToggle>
        </p>
        <form className="mt-4 grid gap-4" onSubmit={handleSaveInfo}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>الاسم</span>
              <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>اللقب</span>
              <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </label>
          </div>
          <label className="grid gap-2">
            <span className={labelClass}>تاريخ الميلاد</span>
            <input className={inputClass} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
          <button className={`btn-primary h-12 w-full sm:w-auto sm:px-8 ${savingInfo ? "loading" : ""}`} type="submit" disabled={savingInfo}>
            {savingInfo ? "جاري الحفظ..." : "حفظ المعلومات"}
          </button>
        </form>
      </section>

      {/* Payment Method */}
      <section className="glass mt-6 rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-black">طريقة الدفع</h2>
        <p className="mt-1 text-sm text-white/60">بيانات الحساب الذي يستقبل عليه الأموال من الإدارة.</p>
        <form className="mt-4 grid gap-4" onSubmit={handleSavePayment}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>الاسم الكامل</span>
              <input className={inputClass} value={payFullName} onChange={(e) => setPayFullName(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>اللقب</span>
              <input className={inputClass} value={paySurname} onChange={(e) => setPaySurname(e.target.value)} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>تاريخ الميلاد (للدفع)</span>
              <input className={inputClass} type="date" value={payDob} onChange={(e) => setPayDob(e.target.value)} />
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>RIP</span>
              <input className={inputClass} value={payRip} onChange={(e) => setPayRip(e.target.value)} dir="ltr" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className={labelClass}>العملة</span>
              <select className={inputClass} value={payCurrency} onChange={(e) => setPayCurrency(e.target.value)}>
                <option value="DZD">DZD (دينار جزائري)</option>
                <option value="USDT">USDT (عملة رقمية)</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className={labelClass}>عنوان USDT (TRC20)</span>
              <input className={inputClass} value={payUsdt} onChange={(e) => setPayUsdt(e.target.value)} dir="ltr" />
            </label>
          </div>
          <button className={`btn-primary h-12 w-full sm:w-auto sm:px-8 ${savingPay ? "loading" : ""}`} type="submit" disabled={savingPay}>
            {savingPay ? "جاري الحفظ..." : "حفظ طريقة الدفع"}
          </button>
        </form>
      </section>

      {/* Change Password */}
      <section className="glass mt-6 rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-black">تغيير كلمة المرور</h2>
        <form className="mt-4 grid gap-4" onSubmit={handleChangePassword}>
          <label className="grid gap-2">
            <span className={labelClass}>كلمة المرور الحالية</span>
            <PasswordInput className={inputClass} value={curPassword} onChange={(e) => setCurPassword(e.target.value)} required />
          </label>
          <label className="grid gap-2">
            <span className={labelClass}>كلمة المرور الجديدة</span>
            <PasswordInput className={inputClass} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} />
          </label>
          <button className={`btn-primary h-12 w-full sm:w-auto sm:px-8 ${changingPassword ? "loading" : ""}`} type="submit" disabled={changingPassword}>
            {changingPassword ? "جاري التغيير..." : "تغيير كلمة المرور"}
          </button>
        </form>
      </section>

      {/* Security Events */}
      <section className="glass mt-6 rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-black">سجل الأمان</h2>
        <p className="mt-1 text-sm text-white/60">أحداث الأمان الأخيرة لحسابك.</p>
        <div className="mt-4 grid gap-2">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-8 text-sm text-white/50">جاري التحميل...</div>
          ) : securityEvents.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/50">
              لا توجد أحداث أمان مسجلة
            </div>
          ) : (
            securityEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="mt-0.5 text-lg">
                  {event.event_type === "login" ? "🔓" :
                   event.event_type === "logout" ? "🔒" :
                   event.event_type === "password_change" ? "🔑" :
                   event.event_type === "account_delete" ? "🗑️" :
                   event.event_type === "profile_update" ? "✏️" :
                   event.event_type === "delivery_data_access" ? "👁️" : "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">
                    {event.event_type === "login" ? "تسجيل دخول" :
                     event.event_type === "logout" ? "تسجيل خروج" :
                     event.event_type === "password_change" ? "تغيير كلمة المرور" :
                     event.event_type === "account_delete" ? "حذف حساب" :
                     event.event_type === "profile_update" ? "تحديث الملف الشخصي" :
                     event.event_type === "delivery_data_access" ? "عرض بيانات التسليم" : event.event_type}
                  </div>
                  {event.details && (
                    <div className="mt-0.5 text-xs text-white/60">{event.details}</div>
                  )}
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-white/40">
                    <span>{new Date(event.created_at).toLocaleString("ar-DZ")}</span>
                    {event.ip_address && <span>• IP: {event.ip_address}</span>}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Delete Account */}
      <section className="glass mt-6 rounded-3xl border border-rose-500/20 p-6 md:p-8">
        <h2 className="text-lg font-black text-rose-300">حذف الحساب</h2>
        <p className="mt-1 text-sm text-white/60">سيتم حذف جميع بياناتك نهائياً. لا يمكن التراجع عن هذا الإجراء.</p>
        {!confirmDelete ? (
          <button className="btn-secondary mt-4 h-12 w-full sm:w-auto border-rose-500/30 text-rose-300 hover:bg-rose-500/10 sm:px-8" onClick={() => setConfirmDelete(true)}>
            حذف الحساب
          </button>
        ) : (
          <div className="mt-4 grid gap-3">
            <p className="text-sm font-bold text-rose-300">هل أنت متأكد؟ سيتم حذف كل شيء نهائياً.</p>
            <div className="flex gap-3">
              <button className="btn-primary h-12 flex-1 bg-rose-600 hover:bg-rose-500 sm:flex-none sm:px-8" onClick={handleDelete} disabled={deleting}>
                {deleting ? "جاري الحذف..." : "تأكيد حذف الحساب"}
              </button>
              <button className="btn-secondary h-12 flex-1 sm:flex-none sm:px-8" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                إلغاء
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
