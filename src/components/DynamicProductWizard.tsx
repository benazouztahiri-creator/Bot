"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ToastProvider";
import { GAME_SPECS, getGameSpec, type GameSpec, type FieldDef } from "@/lib/game-specs";

type Props = {
  onComplete?: () => void;
};

const STEPS = ["اختيار اللعبة", "معلومات المنتج", "رفع الصور", "السعر", "مراجعة", "نشر"];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${
          i <= current ? "bg-indigo-500" : "bg-white/10"
        }`} />
      ))}
    </div>
  );
}

type BtnState = { loading: boolean; success: boolean; error: boolean };

export default function DynamicProductWizard({ onComplete }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<string>("");
  const [spec, setSpec] = useState<GameSpec | null>(null);
  const [attributes, setAttributes] = useState<Record<string, unknown>>({});
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [price, setPrice] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [draftKey] = useState(() => `product-draft-${Date.now()}`);
  const [publishBtn, setPublishBtn] = useState<BtnState>({ loading: false, success: false, error: false });

  useEffect(() => {
    if (category) {
      const gameSpec = getGameSpec(category);
      setSpec(gameSpec);
      setAttributes({});
    }
  }, [category]);

  // Auto-save draft
  useEffect(() => {
    const draft = { step, category, attributes, title, description, images, price };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draft));
    } catch {}
  }, [step, category, attributes, title, description, images, price, draftKey]);

  // Check for drafts on mount
  useEffect(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("product-draft-")) {
          const saved = localStorage.getItem(key);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.category && parsed.step > 0) {
              const resume = window.confirm(`وجدنا مسودة غير منشورة (${parsed.title || "بدون عنوان"}). هل تريد استكمالها؟`);
              if (resume) {
                setCategory(parsed.category || "");
                setAttributes(parsed.attributes || {});
                setTitle(parsed.title || "");
                setDescription(parsed.description || "");
                setImages(parsed.images || []);
                setPrice(parsed.price || 0);
                setStep(parsed.step || 0);
              } else {
                localStorage.removeItem(key);
              }
            }
          }
        }
      }
    } catch {}
  }, []);

  const handleFieldChange = useCallback((key: string, value: unknown) => {
    setAttributes((prev) => ({ ...prev, [key]: value }));
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append("file", file);
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve(data.url);
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      xhr.onerror = () => { setUploading(false); resolve(null); };
      xhr.open("POST", "/api/upload");
      xhr.send(formData);
    });
  }, []);

  const validateStep = (): string | null => {
    if (step === 0 && !category) return "يرجى اختيار نوع اللعبة";
    if (step === 1 && spec) {
      for (const field of spec.fields) {
        if (field.required) {
          const val = attributes[field.key];
          if (val === undefined || val === null || val === "") {
            return `الحقل "${field.label}" مطلوب`;
          }
        }
      }
    }
    if (step === 3 && price <= 0) return "يرجى إدخال سعر صحيح";
    return null;
  };

  function renderField(field: FieldDef) {
    const value = attributes[field.key] ?? "";

    if (field.type === "select" && field.options) {
      return (
        <label key={field.key} className="grid gap-1">
          <span className="text-xs font-bold text-white/80">
            {field.label} {field.required && <span className="text-rose-400">*</span>}
          </span>
          <select
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-indigo-400/50 transition"
            value={String(value)}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
          >
            <option value="">اختر {field.label}</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "number") {
      return (
        <label key={field.key} className="grid gap-1">
          <span className="text-xs font-bold text-white/80">
            {field.label} {field.required && <span className="text-rose-400">*</span>}
          </span>
          <input
            type="number"
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-indigo-400/50 transition"
            value={value === "" ? "" : Number(value)}
            onChange={(e) => handleFieldChange(field.key, e.target.value ? Number(e.target.value) : "")}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
          />
        </label>
      );
    }

    return (
      <label key={field.key} className="grid gap-1">
        <span className="text-xs font-bold text-white/80">
          {field.label} {field.required && <span className="text-rose-400">*</span>}
        </span>
        <input
          type="text"
          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-indigo-400/50 transition"
          value={String(value)}
          onChange={(e) => handleFieldChange(field.key, e.target.value)}
          placeholder={field.placeholder}
        />
      </label>
    );
  }

  async function publishProduct() {
    setError(null);
    setPublishBtn({ loading: true, success: false, error: false });
    setSaving(true);

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        product_type: spec?.productType || "account",
        category,
        title: title || "منتج جديد",
        description: description || "",
        price,
        images,
        attributes,
        currency: category === "topup" ? "USD" : "DZD",
      }),
    });

    setSaving(false);

    if (res.ok) {
      const product = await res.json();
      try { localStorage.removeItem(draftKey); } catch {}
      setPublishBtn({ loading: false, success: true, error: false });
      setTimeout(() => {
        toast("success", "تم نشر المنتج بنجاح!");
        onComplete?.();
        window.location.href = `/products/${encodeURIComponent(product.id)}`;
      }, 600);
    } else {
      const data = await res.json().catch(() => ({ error: "فشل النشر" }));
      setError(data.error || "حدث خطأ أثناء النشر");
      setPublishBtn({ loading: false, success: false, error: true });
      setTimeout(() => setPublishBtn({ loading: false, success: false, error: false }), 1500);
      toast("error", data.error || "فشل نشر المنتج");
    }
  }

  const canProceed = (): boolean => {
    if (step === 0) return !!category;
    if (step === 1 && spec) {
      return spec.fields.every((f) => {
        if (!f.required) return true;
        const val = attributes[f.key];
        return val !== undefined && val !== null && val !== "";
      });
    }
    if (step === 3) return price > 0;
    return true;
  };

  const publishBtnCls = publishBtn.loading ? "loading" : publishBtn.success ? "success" : publishBtn.error ? "error" : "";

  return (
    <div className="glass rounded-2xl p-5">
      <StepIndicator current={step} total={STEPS.length} />

      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs font-bold text-white/60">
          الخطوة {step + 1} من {STEPS.length}
        </span>
        <span className="text-xs font-bold text-indigo-300">{STEPS[step]}</span>
      </div>

      <div className="mt-4 overflow-y-auto max-h-[calc(100dvh-12rem)]">
        {step === 0 && (
          <div className="grid gap-6 animate-slide-up-fade">
            <div>
              <h2 className="text-lg font-black">اختر نوع المنتج</h2>
              <p className="mt-1 text-sm text-white/60">اختر اللعبة أو الخدمة التي تريد بيعها.</p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(GAME_SPECS).map((g) => (
                <button
                  key={g.id}
                  onClick={() => setCategory(g.id)}
                  className={`group relative rounded-2xl border-2 p-6 text-center transition-all duration-200 ${
                    category === g.id
                      ? "border-indigo-500 bg-indigo-500/10 shadow-[0_0_20px_-4px_rgba(99,102,241,0.15)]"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-[0_0_20px_-4px_rgba(255,255,255,0.05)]"
                  }`}
                >
                  <div className="text-5xl">{g.icon}</div>
                  <div className="mt-3 text-lg font-black text-white">{g.name}</div>
                  <div className="mt-2 text-xs text-white/50">
                    {g.productType === "account" ? "بيع حسابات" : "خدمات شحن"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && spec && (
          <div className="grid gap-3 animate-slide-up-fade">
            <h2 className="text-base font-black">معلومات {spec.name}</h2>
            <p className="text-xs text-white/70">أدخل تفاصيل المنتج بدقة.</p>
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              {spec.fields.map(renderField)}
            </div>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-white/80">العنوان</span>
              <input
                type="text"
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white outline-none focus:border-indigo-400/50 transition"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="عنوان جذاب للمنتج"
              />
            </label>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-white/80">الوصف (اختياري)</span>
              <textarea
                className="min-h-[60px] rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-indigo-400/50 transition"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="وصف إضافي..."
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-3 animate-slide-up-fade">
            <h2 className="text-base font-black">رفع الصور</h2>
            <p className="text-xs text-white/70">الصور الجيدة تزيد الثقة.</p>

            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 group">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[10px] text-white opacity-0 group-hover:opacity-100 transition"
                      onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    >
                      ✕
                    </button>
                    {i === 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500/80 px-2 py-0.5 text-[9px] font-bold text-white">
                        الغلاف
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {images.length < 6 && (
              <label className="flex h-20 cursor-pointer items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/5 text-xs text-white/60 hover:border-indigo-400/50 transition">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadImage(file);
                    if (url) {
                      setImages((prev) => [...prev, url]);
                      toast("success", "تم رفع الصورة");
                    } else {
                      toast("error", "فشل رفع الصورة");
                    }
                    e.target.value = "";
                  }}
                />
                {uploading ? `جاري الرفع... ${uploadProgress}%` : "+ إضافة صورة"}
              </label>
            )}

            {uploading && (
              <div className="h-1 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-3 animate-slide-up-fade max-w-sm">
            <h2 className="text-base font-black">سعر المنتج</h2>
            <p className="text-xs text-white/70">حدد السعر. العمولة تُخصم تلقائياً.</p>
            <label className="grid gap-1">
              <span className="text-xs font-bold text-white/80">
                السعر ({category === "topup" ? "USD" : "دج"})
              </span>
              <input
                type="number"
                className="h-12 text-xl rounded-xl border border-white/10 bg-white/5 px-3 text-white font-black outline-none focus:border-indigo-400/50 transition"
                value={price || ""}
                onChange={(e) => setPrice(Number(e.target.value))}
                placeholder="0"
                min={0}
              />
            </label>
            {price > 0 && (
              <div className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3 text-xs">
                <div className="flex items-center justify-between text-white/70">
                  <span>السعر</span>
                  <span className="font-bold text-white">{price} {category === "topup" ? "USD" : "دج"}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-white/70">
                  <span>عمولة (5%)</span>
                  <span className="font-bold text-rose-300">{(price * 0.05).toFixed(2)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-1 text-white/70">
                  <span>صافي الربح</span>
                  <span className="font-bold text-emerald-300">{(price * 0.95).toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {step === 4 && spec && (
          <div className="grid gap-3 animate-slide-up-fade">
            <h2 className="text-base font-black">مراجعة المنتج</h2>
            <p className="text-xs text-white/70">هكذا سيرى المشتري منتجك.</p>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="relative h-36 overflow-hidden rounded-xl mb-3">
                <img src={images[0] || "/uploads/placeholder.svg"} alt="" className="h-full w-full object-cover" />
              </div>

              <h3 className="text-lg font-black text-white">{title || "عنوان المنتج"}</h3>
              <div className="mt-0.5 text-xs text-white/50">{spec.name}</div>

              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {spec.fields.map((field) => {
                  const val = attributes[field.key];
                  if (val === undefined || val === null || val === "") return null;
                  return (
                    <div key={field.key} className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
                      <div className="text-sm font-black text-white">{String(val)}</div>
                      <div className="mt-0.5 text-[9px] font-bold text-white/50">{field.label}</div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between rounded-xl border border-indigo-400/20 bg-indigo-500/10 p-3">
                <span className="text-xs text-white/70">السعر</span>
                <span className="text-xl font-black text-indigo-300">{price} {category === "topup" ? "USD" : "دج"}</span>
              </div>

              <div className="mt-2 rounded-lg border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-center text-[10px] font-bold text-emerald-300">
                🛡️ أموالك محمية بواسطة نظام الوسيط
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="flex flex-col items-center justify-center py-6 animate-slide-up-fade text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/20 to-emerald-500/20 text-3xl">
              🚀
            </div>
            <h2 className="mt-4 text-xl font-black text-white">المنتج جاهز للنشر</h2>
            <p className="mt-1 text-xs text-white/70 max-w-xs">
              بعد النشر، سيظهر المنتج فوراً في القسم المختار.
            </p>

            {error && (
              <div className="mt-3 w-full max-w-xs rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100">
                {error}
              </div>
            )}

            <div className="mt-6 grid w-full max-w-xs gap-2">
              <button
                className={`btn-primary w-full py-3 text-sm ${publishBtnCls}`}
                onClick={publishProduct}
                disabled={publishBtn.loading}
              >
                {publishBtn.loading ? "جاري النشر..." : publishBtn.success ? "تم النشر!" : publishBtn.error ? "فشل" : "نشر المنتج"}
              </button>
              <button
                className="btn-secondary w-full py-2.5 text-xs"
                onClick={() => {
                  try { localStorage.removeItem(draftKey); } catch {}
                  toast("info", "تم حفظ المسودة");
                  onComplete?.();
                }}
                disabled={publishBtn.loading}
              >
                حفظ كمسودة
              </button>
            </div>
          </div>
        )}
      </div>

      {step < 5 && (
        <div className="mt-6 flex items-center justify-between gap-2">
          <button
            className="btn-secondary text-sm"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            السابق
          </button>

          <button
            className="btn-primary text-sm"
            onClick={() => {
              const err = validateStep();
              if (err) {
                setError(err);
                toast("error", err);
                return;
              }
              setError(null);
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
            }}
            disabled={!canProceed()}
          >
            التالي
          </button>
        </div>
      )}
    </div>
  );
}