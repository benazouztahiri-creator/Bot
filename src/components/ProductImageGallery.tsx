"use client";

import { useState, useCallback, useEffect } from "react";

export default function ProductImageGallery({ images }: { images: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Record<number, boolean>>({});

  const allImages = images.length > 0 ? images : ["/uploads/placeholder.svg"];

  const goTo = useCallback((i: number) => {
    setActiveIndex(Math.max(0, Math.min(i, allImages.length - 1)));
  }, [allImages.length]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!fullscreen) return;
    if (e.key === "Escape") setFullscreen(false);
    if (e.key === "ArrowLeft") goTo(activeIndex + 1);
    if (e.key === "ArrowRight") goTo(activeIndex - 1);
  }, [fullscreen, activeIndex, goTo]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (fullscreen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [fullscreen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) goTo(activeIndex + 1);
      else goTo(activeIndex - 1);
    }
    setTouchStart(null);
  };

  return (
    <>
      {/* Main image */}
      <div
        className="relative h-64 md:h-80 overflow-hidden rounded-2xl product-card-image cursor-pointer group"
        onClick={() => setFullscreen(true)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="button"
        tabIndex={0}
        aria-label="عرض الصورة بالحجم الكامل"
      >
        {!imagesLoaded[activeIndex] && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={allImages[activeIndex]}
          alt=""
          className={`w-full h-full object-cover transition duration-300 group-hover:scale-105 ${imagesLoaded[activeIndex] ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setImagesLoaded((p) => ({ ...p, [activeIndex]: true }))}
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
          <span className="rounded-full bg-white/20 backdrop-blur-md px-4 py-2 text-sm font-bold text-white">
            🔍 اضغط للتكبير
          </span>
        </div>
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
            {activeIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {allImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
          {allImages.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`relative shrink-0 h-16 w-16 overflow-hidden rounded-xl border-2 transition ${
                i === activeIndex ? "border-indigo-400 opacity-100" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-[102] flex items-center justify-center bg-black/90 backdrop-blur-xl"
          onClick={() => setFullscreen(false)}
        >
          <button
            className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            onClick={() => setFullscreen(false)}
            aria-label="إغلاق"
          >
            ✕
          </button>

          {allImages.length > 1 && (
            <>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 transition"
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1); }}
                aria-label="السابق"
              >
                ‹
              </button>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 transition"
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1); }}
                aria-label="التالي"
              >
                ›
              </button>
            </>
          )}

          <img
            src={allImages[activeIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          />

          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm text-white">
              {activeIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
