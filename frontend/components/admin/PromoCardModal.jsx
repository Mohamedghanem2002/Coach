"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Download,
  RefreshCw,
  Share2,
  Palette,
  Sparkles,
  Check,
} from "lucide-react";
import {
  generatePromoCardCanvas,
  downloadPromoCard,
  canvasToBlob,
} from "../../lib/promo-card-utils";

const THEMES = [
  { id: "dark",  label: "داكن",   from: "#1a1a2e", to: "#16213e",  dot: "#ef4444" },
  { id: "light", label: "فاتح",   from: "#f8fafc", to: "#fff1f2",  dot: "#dc2626" },
  { id: "red",   label: "أحمر",   from: "#7f1d1d", to: "#3b0000",  dot: "#fbbf24" },
];

export default function PromoCardModal({
  isOpen,
  onClose,
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الفنون القتالية",
}) {
  const [theme, setTheme] = useState("dark");
  const [dataUrl, setDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState(null);
  const canvasRef = useRef(null);

  // Lock scroll & Escape key
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Generate card when modal opens or params change
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    // Defer state updates to avoid calling setState synchronously in effect body
    const timer = setTimeout(() => {
      if (cancelled) return;
      setGenerating(true);
      setDataUrl("");

      generatePromoCardCanvas({ captainName, academyName, theme })
        .then((canvas) => {
          if (cancelled || !canvas) return;
          canvasRef.current = canvas;
          setDataUrl(canvas.toDataURL("image/png", 1.0));
        })
        .catch(console.error)
        .finally(() => { if (!cancelled) setGenerating(false); });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isOpen, captainName, academyName, theme]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadPromoCard(
      canvasRef.current,
      `CoachMaster-${academyName.replace(/\s+/g, "-")}.png`
    );
    showNotice("تم تحميل الكارت بنجاح ✅");
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setSharing(true);
    try {
      const blob = await canvasToBlob(canvasRef.current);
      if (!blob) return;
      const file = new File([blob], "CoachMaster-PromoCard.png", { type: "image/png" });
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "CoachMaster - منصة إدارة الأكاديميات",
          text: `أكاديمية ${academyName} تستخدم نظام CoachMaster لإدارة لاعبيها وبطولاتها! 🥋🏆`,
          files: [file],
        });
      } else {
        // Fallback: copy data URL
        await navigator.clipboard?.writeText(dataUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        showNotice("تم نسخ الكارت — افتح واتساب والصق الصورة 📲");
      }
    } catch (err) {
      if (err.name !== "AbortError") showNotice("تعذر المشاركة، جرب زر التحميل", "error");
    } finally {
      setSharing(false);
    }
  };

  const showNotice = (msg, type = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-backdrop"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl h-[92vh] max-h-[92vh] sm:h-auto sm:max-h-[88vh] flex flex-col rounded-t-[28px] sm:rounded-3xl bg-slate-900 border border-slate-700/60 shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white">كارت ترويجي للمنصة</h2>
              <p className="text-[11px] text-slate-400 font-medium">جاهز للمشاركة والطباعة ✨</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Info chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold">
              🏫 {academyName}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-amber-400 font-bold">
              🥋 {captainName}
            </span>
          </div>

          {/* Theme picker */}
          <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-3">
            <div className="flex items-center gap-2 mb-2.5">
              <Palette className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-black text-slate-400">اختر ثيم الكارت</span>
            </div>
            <div className="flex gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-2.5 px-2 rounded-xl border transition cursor-pointer ${
                    theme === t.id
                      ? "border-red-500 bg-red-500/10 shadow-lg shadow-red-900/20"
                      : "border-slate-600 bg-slate-800 hover:border-slate-500"
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg shadow-md flex items-center justify-center relative"
                    style={{
                      background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                      border: `2px solid ${t.dot}`,
                    }}
                  >
                    {theme === t.id && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </div>
                  <span className={`text-[11px] font-bold ${theme === t.id ? "text-red-400" : "text-slate-400"}`}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Card preview */}
          <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 overflow-hidden">
            {generating ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                <div className="w-9 h-9 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-black text-slate-300">جارٍ توليد الكارت الترويجي...</span>
                <span className="text-[11px] text-slate-500">يتم رسم الكارت بجودة عالية HD 🎨</span>
              </div>
            ) : dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt="CoachMaster Promo Card"
                className="w-full h-auto block"
                draggable="false"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-slate-500">
                <Sparkles className="w-10 h-10 text-slate-600" />
                <span className="text-xs font-bold">لا توجد معاينة</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-4 border-t border-slate-700/60 bg-slate-900 shrink-0 space-y-2.5">
          {/* Notice */}
          {notice && (
            <div className={`px-4 py-2.5 rounded-xl text-xs font-black text-center ${
              notice.type === "error"
                ? "bg-red-900/60 text-red-300 border border-red-700"
                : "bg-emerald-900/60 text-emerald-300 border border-emerald-700"
            }`}>
              {notice.msg}
            </div>
          )}

          <div className="flex gap-2.5">
            {/* Regenerate */}
            <button
              type="button"
              onClick={() => setTheme((t) => { const same = t; setTimeout(() => setTheme(same), 0); return t; })}
              disabled={generating}
              className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 transition cursor-pointer disabled:opacity-50"
              title="إعادة التوليد"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            </button>

            {/* Share */}
            <button
              type="button"
              onClick={handleShare}
              disabled={generating || sharing || !dataUrl}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-900/30"
            >
              {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? "تم النسخ!" : sharing ? "جارٍ المشاركة..." : "مشاركة الكارت"}</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={generating || !dataUrl}
              className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-gradient-to-l from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-lg shadow-red-900/30"
            >
              <Download className="w-4 h-4" />
              <span>تحميل الكارت PNG</span>
            </button>
          </div>

          <p className="text-center text-[10px] text-slate-600 font-medium">
            📐 جودة عالية 1080×1350 بكسل — مناسب للنشر على السوشيال ميديا
          </p>
        </div>
      </div>
    </div>
  );
}
