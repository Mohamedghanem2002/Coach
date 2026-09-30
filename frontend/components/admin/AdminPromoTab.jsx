"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Palette,
  Check,
  ChevronDown,
  Star,
  Zap,
  Shield,
  Users,
  Trophy,
  Building2,
  CreditCard,
  Cake,
  BarChart3,
  Smartphone,
  Lock,
} from "lucide-react";
import {
  generatePromoCardCanvas,
  downloadPromoCard,
  canvasToBlob,
  SYSTEM_FEATURES,
} from "../../lib/promo-card-utils";

const THEMES = [
  {
    id: "dark",
    label: "داكن",
    desc: "احترافي وأنيق",
    from: "#0f0f1a",
    to: "#1a0a0a",
    accent: "#ef4444",
  },
  {
    id: "light",
    label: "فاتح",
    desc: "نظيف وواضح",
    from: "#f8fafc",
    to: "#fff1f2",
    accent: "#dc2626",
  },
  {
    id: "red",
    label: "كلاسيك",
    desc: "دافئ وجذاب",
    from: "#7f1d1d",
    to: "#3b0000",
    accent: "#fbbf24",
  },
];

const FEATURE_ICONS = [Users, Building2, Trophy, CreditCard, Cake, BarChart3, Smartphone, Lock];

export default function AdminPromoTab({ captains = [] }) {
  const [selectedCaptain, setSelectedCaptain] = useState(null);
  const [manualName, setManualName] = useState("");
  const [manualAcademy, setManualAcademy] = useState("");
  const [inputMode, setInputMode] = useState("manual"); // "manual" | "select"
  const [theme, setTheme] = useState("dark");
  const [dataUrl, setDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState(null);
  const [generated, setGenerated] = useState(false);
  const canvasRef = useRef(null);

  const captainName =
    inputMode === "select" && selectedCaptain
      ? selectedCaptain.name || "كابتن الأكاديمية"
      : manualName || "كابتن الأكاديمية";

  const academyName =
    inputMode === "select" && selectedCaptain
      ? selectedCaptain.academyName || "الأكاديمية"
      : manualAcademy || "أكاديمية الفنون القتالية";

  const generateCard = async () => {
    setGenerating(true);
    setDataUrl("");
    setGenerated(false);
    try {
      const canvas = await generatePromoCardCanvas({ captainName, academyName, theme });
      if (!canvas) return;
      canvasRef.current = canvas;
      setDataUrl(canvas.toDataURL("image/png", 1.0));
      setGenerated(true);
    } catch (err) {
      console.error("Card gen error:", err);
      showNotice("تعذر توليد الكارت، حاول مجدداً", "error");
    } finally {
      setGenerating(false);
    }
  };

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
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "CoachMaster - منصة إدارة الأكاديميات",
          text: `أكاديمية ${academyName} تستخدم CoachMaster! 🥋`,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "CoachMaster-PromoCard.png";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotice("تم تحميل الكارت — شاركه من جهازك 📲");
      }
    } catch (err) {
      if (err.name !== "AbortError") showNotice("تعذر المشاركة — جرب زر التحميل", "error");
    } finally {
      setSharing(false);
    }
  };

  const showNotice = (msg, type = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 3500);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">الكارت الترويجي</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium pr-1">
            أنشئ كارتاً دعائياً احترافياً لمشتركي المنصة — جاهز للنشر والمشاركة 🚀
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-black">
          <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />
            CoachMaster
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            1080 × 1350 HD
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left Column: Settings ───────────────────────────── */}
        <div className="space-y-4">

          {/* Input Mode Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3.5">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              بيانات الكارت
            </h3>

            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
              {[
                { id: "manual", label: "إدخال يدوي" },
                { id: "select", label: "اختر مشترك" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setInputMode(m.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                    inputMode === m.id
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {inputMode === "manual" ? (
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1">اسم المدرب / الكابتن</label>
                  <input
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="مثال: كابتن أحمد محمد"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition placeholder:font-medium placeholder:text-slate-400"
                    dir="rtl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-500 mb-1">اسم الأكاديمية</label>
                  <input
                    type="text"
                    value={manualAcademy}
                    onChange={(e) => setManualAcademy(e.target.value)}
                    placeholder="مثال: أكاديمية النصر للكاراتيه"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition placeholder:font-medium placeholder:text-slate-400"
                    dir="rtl"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-black text-slate-500 mb-1">اختر كابتن مشترك</label>
                <select
                  value={selectedCaptain?.id || selectedCaptain?._id || ""}
                  onChange={(e) => {
                    const found = captains.find(
                      (c) => (c.id || c._id) === e.target.value
                    );
                    setSelectedCaptain(found || null);
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition cursor-pointer appearance-none"
                  dir="rtl"
                >
                  <option value="">-- اختر كابتن --</option>
                  {captains.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name} — {c.academyName || "أكاديمية"}
                    </option>
                  ))}
                </select>
                {captains.length === 0 && (
                  <p className="text-[11px] text-slate-400 font-medium mt-1 text-center">
                    لا توجد حسابات مسجلة حتى الآن
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Theme Picker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-500" />
              ثيم التصميم
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition cursor-pointer ${
                    theme === t.id
                      ? "border-red-500 bg-red-50 shadow-sm shadow-red-100"
                      : "border-slate-200 bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {theme === t.id && (
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                  <div
                    className="w-10 h-10 rounded-lg shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                      border: `2px solid ${t.accent}`,
                    }}
                  />
                  <div className="text-center">
                    <p className={`text-[11px] font-black ${theme === t.id ? "text-red-600" : "text-slate-700"}`}>
                      {t.label}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* System Features Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              مميزات تظهر في الكارت
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SYSTEM_FEATURES.map((feat, i) => {
                const Icon = FEATURE_ICONS[i] || Star;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 py-2 px-2.5 rounded-xl bg-slate-50 border border-slate-100"
                  >
                    <span className="text-base leading-none">{feat.icon}</span>
                    <span className="text-[11px] font-bold text-slate-700 leading-tight">{feat.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={generateCard}
            disabled={generating}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-l from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-sm transition cursor-pointer disabled:opacity-60 shadow-lg shadow-red-200 active:scale-[0.98]"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جارٍ توليد الكارت...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>🎨 توليد الكارت الترويجي</span>
              </>
            )}
          </button>
        </div>

        {/* ── Right Column: Preview ───────────────────────────── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                معاينة الكارت
              </h3>
              {generated && (
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                  جاهز للتحميل ✓
                </span>
              )}
            </div>

            {/* Preview area */}
            <div className="rounded-xl overflow-hidden bg-slate-900 min-h-[280px] flex items-center justify-center">
              {generating ? (
                <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
                  <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-black text-slate-300">يتم الرسم...</p>
                  <p className="text-[11px] text-slate-500">جودة HD 1080×1350 🎨</p>
                </div>
              ) : dataUrl ? (
                <img
                  src={dataUrl}
                  alt="كارت CoachMaster الترويجي"
                  className="w-full h-auto block rounded-xl"
                  draggable="false"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-slate-500 py-16 px-4 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-xs font-black text-slate-400">اضغط على &quot;توليد الكارت&quot; لعرض المعاينة</p>
                  <p className="text-[11px] text-slate-600 max-w-[200px]">
                    أدخل اسم المدرب والأكاديمية واختر الثيم المناسب أولاً
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {generated && dataUrl && (
              <>
                {notice && (
                  <div className={`px-4 py-2.5 rounded-xl text-xs font-black text-center ${
                    notice.type === "error"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {notice.msg}
                  </div>
                )}

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={sharing}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{sharing ? "جارٍ المشاركة..." : "مشاركة"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownload}
                    disabled={!dataUrl}
                    className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-l from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>تحميل PNG</span>
                  </button>
                </div>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  📐 صورة عالية الجودة 1080×1350 — مناسبة للإنستجرام وواتساب
                </p>
              </>
            )}
          </div>

          {/* Tips Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              نصائح للنشر الاحترافي
            </h3>
            <div className="space-y-2">
              {[
                { icon: "📱", text: "انشر الكارت في ستوري الإنستجرام أو واتساب" },
                { icon: "🖨️", text: "اطبعه بحجم A4 وعلّقه في الصالة" },
                { icon: "💬", text: "أرسله في مجموعات الأولياء والأبطال" },
                { icon: "🎯", text: "استخدم الثيم الداكن للشاشات والفاتح للطباعة" },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5 text-[11px]">
                  <span className="text-base leading-none shrink-0">{tip.icon}</span>
                  <span className="text-slate-300 font-medium leading-relaxed">{tip.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
