"use client";
import React, { useState, useRef, useCallback } from "react";
import {
  Sparkles,
  Download,
  Share2,
  RefreshCw,
  Palette,
  Check,
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
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp,
  Loader2,
  FileImage,
  Info,
  Package,
} from "lucide-react";
import {
  generatePromoCardCanvas,
  downloadPromoCard,
  canvasToBlob,
  SYSTEM_FEATURES,
} from "../../lib/promo-card-utils";

// ─── Themes ──────────────────────────────────────────────────────────────────
const THEMES = [
  { id: "dark",  label: "داكن",   desc: "احترافي وأنيق",  from: "#0f0f1a", to: "#1a0a0a", accent: "#ef4444" },
  { id: "light", label: "فاتح",   desc: "نظيف وواضح",    from: "#f8fafc", to: "#fff1f2", accent: "#dc2626" },
  { id: "red",   label: "كلاسيك", desc: "دافئ وجذاب",    from: "#7f1d1d", to: "#3b0000", accent: "#fbbf24" },
];

// ─── Full system description sections ────────────────────────────────────────
const SYSTEM_SECTIONS = [
  {
    icon: "👥",
    title: "إدارة اللاعبين والأبطال",
    color: "violet",
    points: [
      "تسجيل بيانات اللاعبين كاملةً (الاسم، السن، الحزام، ولي الأمر)",
      "متابعة حالة سداد رسوم كل لاعب",
      "تصفية وبحث متقدم عبر كل الفروع",
      "كارت تهنئة عيد ميلاد لكل لاعب بضغطة واحدة",
    ],
  },
  {
    icon: "🏟️",
    title: "الصالات والفروع",
    color: "blue",
    points: [
      "إضافة أكثر من صالة وفرع تدريبي",
      "تحديد أيام وجداول التدريب لكل فرع",
      "معرفة عدد اللاعبين في كل مقر",
      "إدارة حضور وغياب تفصيلية لكل جلسة",
    ],
  },
  {
    icon: "🏆",
    title: "الفعاليات والبطولات",
    color: "amber",
    points: [
      "إنشاء وإدارة بطولات ورحلات تدريبية",
      "تسجيل المشاركين وتتبع رسوم الاشتراك",
      "جداول الفعاليات القادمة والسابقة",
      "إشعارات تلقائية لأولياء الأمور",
    ],
  },
  {
    icon: "💳",
    title: "الاشتراكات والمالية",
    color: "emerald",
    points: [
      "متابعة رسوم اشتراك كل لاعب شهرياً",
      "تسجيل المدفوع والمتبقي والمتأخر",
      "سجل المدفوعات الكامل مع التواريخ",
      "تنبيهات المتأخرين في السداد",
    ],
  },
  {
    icon: "📊",
    title: "التقارير ولوحة التحكم",
    color: "rose",
    points: [
      "لوحة إحصائيات شاملة في الوقت الفعلي",
      "تقارير دورية قابلة للتصدير",
      "عرض أداء كل فرع مقارنةً بالآخرين",
      "تتبع نمو الأكاديمية على مدار الوقت",
    ],
  },
  {
    icon: "📱",
    title: "يعمل على كل الأجهزة",
    color: "sky",
    points: [
      "تصميم متجاوب يعمل بشكل مثالي على الجوال",
      "واجهة سلسة على الكمبيوتر واللوح",
      "لا يحتاج تحميل تطبيق — يعمل من المتصفح",
      "سرعة عالية وأداء محسّن",
    ],
  },
];

const COLOR_MAP = {
  violet: { bg: "bg-violet-50", border: "border-violet-200", icon: "text-violet-600", dot: "bg-violet-500", title: "text-violet-900" },
  blue:   { bg: "bg-blue-50",   border: "border-blue-200",   icon: "text-blue-600",   dot: "bg-blue-500",   title: "text-blue-900"   },
  amber:  { bg: "bg-amber-50",  border: "border-amber-200",  icon: "text-amber-600",  dot: "bg-amber-500",  title: "text-amber-900"  },
  emerald:{ bg: "bg-emerald-50",border: "border-emerald-200",icon: "text-emerald-600",dot: "bg-emerald-500",title: "text-emerald-900"},
  rose:   { bg: "bg-rose-50",   border: "border-rose-200",   icon: "text-rose-600",   dot: "bg-rose-500",   title: "text-rose-900"   },
  sky:    { bg: "bg-sky-50",    border: "border-sky-200",    icon: "text-sky-600",    dot: "bg-sky-500",    title: "text-sky-900"    },
};

// ─── Single captain card row ─────────────────────────────────────────────────
function CaptainCardRow({ captain, theme, onGenerate }) {
  const [state, setState] = useState("idle"); // idle | generating | done | error
  const [dataUrl, setDataUrl] = useState("");
  const canvasRef = useRef(null);

  const generate = useCallback(async () => {
    setState("generating");
    setDataUrl("");
    try {
      const canvas = await generatePromoCardCanvas({
        captainName: captain.name || "كابتن الأكاديمية",
        academyName: captain.academyName || "الأكاديمية",
        theme,
      });
      if (!canvas) throw new Error("no canvas");
      canvasRef.current = canvas;
      setDataUrl(canvas.toDataURL("image/png", 1.0));
      setState("done");
      onGenerate?.({ captain, canvas });
    } catch {
      setState("error");
    }
  }, [captain, theme, onGenerate]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadPromoCard(
      canvasRef.current,
      `CoachMaster-${(captain.academyName || captain.name || "card").replace(/\s+/g, "-")}.png`
    );
  };

  return (
    <div className={`rounded-2xl border bg-white p-3.5 shadow-sm transition ${
      state === "done" ? "border-emerald-200" : state === "error" ? "border-red-200" : "border-slate-200"
    }`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
          {(captain.name || "ك").charAt(0)}
        </div>
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-900 truncate">{captain.name}</p>
          <p className="text-[11px] text-slate-500 font-medium truncate">🏫 {captain.academyName || "أكاديمية"}</p>
        </div>
        {/* Status + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {state === "idle" && (
            <button
              onClick={generate}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-[11px] font-black transition cursor-pointer"
            >
              توليد
            </button>
          )}
          {state === "generating" && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black">
              <Loader2 className="w-3 h-3 animate-spin" />
              جارٍ...
            </span>
          )}
          {state === "done" && (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                ✓ جاهز
              </span>
              <button
                onClick={handleDownload}
                className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer transition"
                title="تحميل"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={generate}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
                title="إعادة توليد"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
          {state === "error" && (
            <button
              onClick={generate}
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-[11px] font-black border border-red-200 cursor-pointer hover:bg-red-100 transition"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>

      {/* Mini preview */}
      {dataUrl && (
        <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-100 max-h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="preview" className="w-full h-auto block" draggable="false" />
        </div>
      )}
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────
export default function AdminPromoTab({ captains = [] }) {
  const [mode, setMode] = useState("manual"); // "manual" | "select" | "bulk"
  const [manualName, setManualName] = useState("");
  const [manualAcademy, setManualAcademy] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [theme, setTheme] = useState("dark");
  const [dataUrl, setDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, running: false });
  const [showFeatures, setShowFeatures] = useState(false);
  const canvasRef = useRef(null);

  const captainName = mode === "manual" ? (manualName || "كابتن الأكاديمية") : "";
  const academyName = mode === "manual" ? (manualAcademy || "أكاديمية الفنون القتالية") : "";

  const toggleId = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === captains.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(captains.map((c) => c.id || c._id)));
    }
  };

  const allSelected = captains.length > 0 && selectedIds.size === captains.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  // Single card generation (manual or single select)
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
      console.error(err);
      showNotice("تعذر توليد الكارت، حاول مجدداً", "error");
    } finally {
      setGenerating(false);
    }
  };

  // Bulk generation — download all as separate PNGs
  const generateBulk = async () => {
    const targets = captains.filter((c) => selectedIds.has(c.id || c._id));
    if (!targets.length) return;
    setBulkProgress({ done: 0, total: targets.length, running: true });

    for (let i = 0; i < targets.length; i++) {
      const c = targets[i];
      try {
        const canvas = await generatePromoCardCanvas({
          captainName: c.name || "كابتن الأكاديمية",
          academyName: c.academyName || "الأكاديمية",
          theme,
        });
        if (canvas) {
          // slight delay between downloads so browser doesn't block
          await new Promise((r) => setTimeout(r, 300));
          downloadPromoCard(canvas, `CoachMaster-${(c.academyName || c.name || "card").replace(/\s+/g, "-")}.png`);
        }
      } catch (e) {
        console.error("bulk card error for", c.name, e);
      }
      setBulkProgress((p) => ({ ...p, done: i + 1 }));
    }
    setBulkProgress((p) => ({ ...p, running: false }));
    showNotice(`تم تحميل ${targets.length} كارت بنجاح! ✅`);
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadPromoCard(canvasRef.current, `CoachMaster-${academyName.replace(/\s+/g, "-")}.png`);
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
        a.href = url; a.download = "CoachMaster-PromoCard.png"; a.click();
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
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6" dir="rtl">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center shadow-lg shadow-red-200">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-slate-900">الكارت الترويجي</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium pr-1">
            أنشئ كروتاً دعائية احترافية لمشتركي منصة CoachMaster — جاهزة للنشر والطباعة 🚀
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black">
          <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />CoachMaster
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">1080 × 1350 HD</span>
        </div>
      </div>

      {/* ── System Description (collapsible) ───────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFeatures(!showFeatures)}
          className="w-full flex items-center justify-between p-4 text-right cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Package className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-right">
              <p className="text-sm font-black text-white">شرح كامل لمميزات CoachMaster</p>
              <p className="text-[11px] text-slate-400 font-medium">اضغط لعرض/إخفاء قائمة المميزات التفصيلية</p>
            </div>
          </div>
          {showFeatures
            ? <ChevronUp className="w-5 h-5 text-slate-400" />
            : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {showFeatures && (
          <div className="px-4 pb-5 space-y-3 border-t border-slate-700/60 pt-4">
            {/* System intro */}
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[12px] text-slate-300 font-medium leading-relaxed">
              <span className="text-white font-black">CoachMaster</span> هو نظام متكامل لإدارة أكاديميات الفنون القتالية والرياضات القتالية.
              صُمِّم خصيصاً للمدربين والكباتن لتوفير وقتهم وتنظيم عملهم بشكل احترافي —
              من إدارة اللاعبين وصولاً لتتبع المدفوعات وتنظيم البطولات.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SYSTEM_SECTIONS.map((sec) => {
                const col = COLOR_MAP[sec.color];
                return (
                  <div key={sec.title} className={`rounded-xl border p-3.5 ${col.bg} ${col.border} bg-opacity-10`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl leading-none">{sec.icon}</span>
                      <h4 className={`text-xs font-black ${col.title}`}>{sec.title}</h4>
                    </div>
                    <ul className="space-y-1">
                      {sec.points.map((pt, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${col.dot} shrink-0 mt-1`} />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {/* Developer credit */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 font-medium">تصميم وتطوير النظام</span>
              <span className="text-[11px] text-amber-400 font-black">Fox Developer ⭐</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Mode Tabs ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: "manual", label: "✏️  إدخال يدوي" },
            { id: "select", label: "👤  كابتن واحد" },
            { id: "bulk",   label: "👥  كل الكباتن", badge: captains.length },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                mode === m.id
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <span>{m.label}</span>
              {m.badge !== undefined && m.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  mode === m.id ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {m.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Manual mode */}
        {mode === "manual" && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">اسم المدرب / الكابتن</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => setManualName(e.target.value)}
                placeholder="مثال: كابتن أحمد محمد"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                dir="rtl"
              />
            </div>
          </div>
        )}

        {/* Single select mode */}
        {mode === "select" && (
          <div>
            <label className="block text-[11px] font-black text-slate-500 mb-1">اختر كابتن مشترك</label>
            {captains.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-3">لا توجد حسابات مسجلة</p>
            ) : (
              <select
                onChange={(e) => {
                  const found = captains.find((c) => (c.id || c._id) === e.target.value);
                  setManualName(found?.name || "");
                  setManualAcademy(found?.academyName || "");
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                dir="rtl"
              >
                <option value="">-- اختر كابتن --</option>
                {captains.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} — {c.academyName || "أكاديمية"}
                  </option>
                ))}
              </select>
            )}
            {(manualName || manualAcademy) && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  🥋 {manualName}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  🏫 {manualAcademy}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bulk mode */}
        {mode === "bulk" && (
          <div className="space-y-3">
            {captains.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-4">لا توجد حسابات مسجلة حتى الآن</p>
            ) : (
              <>
                {/* Select all toggle */}
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
                  <button
                    type="button"
                    onClick={toggleAll}
                    className="flex items-center gap-2.5 text-xs font-black text-slate-800 cursor-pointer"
                  >
                    {allSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-600" />
                    ) : someSelected ? (
                      <CheckSquare className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    {allSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </button>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {selectedIds.size} / {captains.length} مُحدَّد
                  </span>
                </div>

                {/* Captain list with checkboxes */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {captains.map((c) => {
                    const id = c.id || c._id;
                    const checked = selectedIds.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleId(id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-right transition cursor-pointer ${
                          checked
                            ? "bg-red-50 border-red-200"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-red-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 shrink-0" />
                        )}
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-black text-xs shrink-0">
                          {(c.name || "ك").charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-900 truncate">{c.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{c.academyName || "أكاديمية"}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Left: Theme + Generate ─────────────────────────── */}
        <div className="space-y-4">
          {/* Theme picker */}
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
                    style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})`, border: `2px solid ${t.accent}` }}
                  />
                  <div className="text-center">
                    <p className={`text-[11px] font-black ${theme === t.id ? "text-red-600" : "text-slate-700"}`}>{t.label}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Features on card preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              مميزات تظهر داخل الكارت
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {SYSTEM_FEATURES.map((feat, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-sm leading-none">{feat.icon}</span>
                  <span className="text-[11px] font-bold text-slate-600 leading-tight">{feat.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Generate / Bulk button */}
          {mode === "bulk" ? (
            <div className="space-y-2">
              {bulkProgress.running && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-black text-amber-800 text-center">
                  جارٍ تحميل {bulkProgress.done} من {bulkProgress.total} كارت...
                  <div className="mt-2 w-full bg-amber-200 rounded-full h-1.5">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={generateBulk}
                disabled={selectedIds.size === 0 || bulkProgress.running}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-l from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-sm transition cursor-pointer disabled:opacity-50 shadow-lg shadow-red-200 active:scale-[0.98]"
              >
                {bulkProgress.running ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ التحميل...</span></>
                ) : (
                  <><FileImage className="w-4 h-4" /><span>تحميل {selectedIds.size} كارت دفعةً واحدة ⬇️</span></>
                )}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={generateCard}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-l from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-sm transition cursor-pointer disabled:opacity-60 shadow-lg shadow-red-200 active:scale-[0.98]"
            >
              {generating ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /><span>جارٍ توليد الكارت...</span></>
              ) : (
                <><Sparkles className="w-4 h-4" /><span>🎨 توليد الكارت الترويجي</span></>
              )}
            </button>
          )}

          {/* Tips */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-slate-700 p-4 space-y-2.5">
            <h3 className="text-xs font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />نصائح للنشر
            </h3>
            {[
              { icon: "📱", text: "انشر الكارت في ستوري الإنستجرام أو واتساب" },
              { icon: "🖨️", text: "اطبعه بحجم A4 وعلّقه في الصالة" },
              { icon: "💬", text: "أرسله في مجموعات الأولياء والأبطال" },
              { icon: "🎯", text: "الثيم الداكن للشاشات والفاتح للطباعة" },
            ].map((tip, i) => (
              <div key={i} className="flex items-start gap-2.5 text-[11px]">
                <span className="text-base leading-none shrink-0">{tip.icon}</span>
                <span className="text-slate-300 font-medium leading-relaxed">{tip.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Preview (manual/select) or Per-captain list (bulk) ── */}
        <div className="space-y-4">

          {mode === "bulk" ? (
            /* Bulk: show per-captain card rows */
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <FileImage className="w-4 h-4 text-red-500" />
                  توليد الكروت فردياً
                </h3>
                <span className="text-[10px] text-slate-500 font-bold">أو استخدم &quot;تحميل دفعة&quot; بالجانب</span>
              </div>
              {captains.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium text-center py-8">لا توجد حسابات مسجلة</p>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {captains.map((c) => (
                    <CaptainCardRow
                      key={c.id || c._id}
                      captain={c}
                      theme={theme}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Single / Manual: show preview */
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  معاينة الكارت
                </h3>
                {generated && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    جاهز ✓
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden bg-slate-900 min-h-[260px] flex items-center justify-center">
                {generating ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
                    <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-slate-300">يتم الرسم...</p>
                    <p className="text-[11px] text-slate-500">جودة HD 1080×1350 🎨</p>
                  </div>
                ) : dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dataUrl} alt="كارت CoachMaster" className="w-full h-auto block rounded-xl" draggable="false" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500 py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-xs font-black text-slate-400">اضغط &quot;توليد الكارت&quot; لعرض المعاينة</p>
                    <p className="text-[11px] text-slate-600 max-w-[200px]">أدخل البيانات واختر الثيم أولاً</p>
                  </div>
                )}
              </div>

              {generated && dataUrl && (
                <>
                  {notice && (
                    <div className={`px-4 py-2.5 rounded-xl text-xs font-black text-center ${
                      notice.type === "error"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}>{notice.msg}</div>
                  )}
                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={handleShare}
                      disabled={sharing}
                      className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{sharing ? "جارٍ..." : "مشاركة"}</span>
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
                    📐 1080×1350 — مناسب للإنستجرام وواتساب
                  </p>
                </>
              )}
            </div>
          )}

          {/* Notice for bulk */}
          {mode === "bulk" && notice && (
            <div className={`px-4 py-3 rounded-xl text-xs font-black text-center ${
              notice.type === "error"
                ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
            }`}>{notice.msg}</div>
          )}
        </div>
      </div>
    </div>
  );
}
