"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
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
  Building2,
  CheckSquare,
  Square,
  Loader2,
  FileImage,
  Filter,
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

// ─── Single captain card row (for bulk list) ─────────────────────────────────
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
    <div className={`rounded-2xl border bg-white p-3.5 shadow-2xs transition ${
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
  const [mode, setMode] = useState("all"); // "all" | "select" | "manual" | "bulk"
  const [manualName, setManualName] = useState("");
  const [manualAcademy, setManualAcademy] = useState("");
  const [selectedCaptainId, setSelectedCaptainId] = useState("");
  const [selectedBulkIds, setSelectedBulkIds] = useState(new Set());
  const [excludedCaptainIds, setExcludedCaptainIds] = useState(new Set());
  const [theme, setTheme] = useState("dark");
  const [dataUrl, setDataUrl] = useState("");
  const [generating, setGenerating] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [generated, setGenerated] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0, running: false });
  const canvasRef = useRef(null);

  const selectedCaptain = captains.find((c) => (c.id || c._id) === selectedCaptainId) || null;

  const captainName =
    mode === "manual"
      ? manualName || "كابتن الأكاديمية"
      : mode === "select"
      ? selectedCaptain?.name || "كابتن الأكاديمية"
      : "كابتن الأكاديمية";

  const academyName =
    mode === "manual"
      ? manualAcademy || "أكاديمية الفنون القتالية"
      : mode === "select"
      ? selectedCaptain?.academyName || "أكاديمية الفنون القتالية"
      : "كل المشتركين";

  // Bulk selection toggles (for downloading separate cards)
  const toggleBulkId = (id) => {
    setSelectedBulkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllBulk = () => {
    if (selectedBulkIds.size === captains.length) {
      setSelectedBulkIds(new Set());
    } else {
      setSelectedBulkIds(new Set(captains.map((c) => c.id || c._id)));
    }
  };

  const allBulkSelected = captains.length > 0 && selectedBulkIds.size === captains.length;
  const someBulkSelected = selectedBulkIds.size > 0 && !allBulkSelected;

  // Unified all-subscribers inclusion / exclusion toggles
  const toggleIncludeCaptain = (id) => {
    setExcludedCaptainIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const includeAllCaptains = () => {
    setExcludedCaptainIds(new Set());
  };

  const excludeAllCaptains = () => {
    setExcludedCaptainIds(new Set(captains.map((c) => c.id || c._id)));
  };

  const includedCaptainsList = captains.filter((c) => !excludedCaptainIds.has(c.id || c._id));
  const includedCount = includedCaptainsList.length;

  const showNotice = useCallback((msg, type = "success") => {
    setNotice({ msg, type });
    setTimeout(() => setNotice(null), 4000);
  }, []);

  // Auto-generate card on initial mount or mode switch
  const generateCard = useCallback(async () => {
    setGenerating(true);
    setDataUrl("");
    setGenerated(false);
    try {
      let canvas = null;
      if (mode === "all") {
        const targets = captains.filter((c) => !excludedCaptainIds.has(c.id || c._id));
        if (targets.length === 0 && captains.length > 0) {
          showNotice("يرجى تحديد مشترك واحد على الأقل لإدراجه داخل الكارت", "error");
          setGenerating(false);
          return;
        }
        canvas = await generatePromoCardCanvas({
          captains: targets.length > 0 ? targets : [
            { name: "كابتن الأكاديمية", academyName: "أكاديمية الفنون القتالية" },
          ],
          isAllSubscribers: true,
          theme,
        });
      } else if (mode === "select") {
        canvas = await generatePromoCardCanvas({
          captainName: selectedCaptain?.name || "كابتن الأكاديمية",
          academyName: selectedCaptain?.academyName || "أكاديمية الفنون القتالية",
          theme,
        });
      } else if (mode === "manual") {
        canvas = await generatePromoCardCanvas({
          captainName: manualName || "كابتن الأكاديمية",
          academyName: manualAcademy || "أكاديمية الفنون القتالية",
          theme,
        });
      }

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
  }, [mode, captains, excludedCaptainIds, theme, selectedCaptain, manualName, manualAcademy, showNotice]);

  // Bulk download as separate cards
  const generateBulk = async () => {
    const targets = captains.filter((c) => selectedBulkIds.has(c.id || c._id));
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
    const fName =
      mode === "all"
        ? "CoachMaster-All-Subscribers.png"
        : `CoachMaster-${academyName.replace(/\s+/g, "-")}.png`;
    downloadPromoCard(canvasRef.current, fName);
    showNotice("تم تحميل الكارت بنجاح ✅");
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;
    setSharing(true);
    try {
      const blob = await canvasToBlob(canvasRef.current);
      if (!blob) return;
      const fName =
        mode === "all"
          ? "CoachMaster-All-Subscribers.png"
          : "CoachMaster-PromoCard.png";
      const file = new File([blob], fName, { type: "image/png" });
      const shareText =
        mode === "all"
          ? `نخبة المشتركين والأكاديميات المعتمدة على CoachMaster! 🥋`
          : `أكاديمية ${academyName} تستخدم CoachMaster! 🥋`;

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "CoachMaster - منصة إدارة الأكاديميات",
          text: shareText,
          files: [file],
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = fName; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        showNotice("تم تحميل الكارت — شاركه من جهازك 📲");
      }
    } catch (err) {
      if (err.name !== "AbortError") showNotice("تعذر المشاركة — جرب زر التحميل", "error");
    } finally {
      setSharing(false);
    }
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
            <h1 className="text-xl font-black text-slate-900">الكارت الترويجي للمنصة</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium pr-1">
            أنشئ كارت ترويجي مجمّع يجمع كل المشتركين في كارت واحد عالي الدقة مع إمكانية استثناء أي مشترك بسهولة 🚀
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-black">
          <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-amber-400" />CoachMaster
          </span>
          <span className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">1080 × 1350 HD</span>
        </div>
      </div>

      {/* ── Mode Selection Tabs ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: "all",    label: "🌟 كارت مجمّع لكل المشتركين", badge: includedCount },
            { id: "select", label: "👤 كارت كابتن محدد" },
            { id: "manual", label: "✏️ إدخال يدوي" },
            { id: "bulk",   label: "📦 تحميل كل كارت منفصل", badge: captains.length },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMode(m.id);
                setDataUrl("");
                setGenerated(false);
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-lg text-xs font-black transition cursor-pointer text-center ${
                mode === m.id
                  ? "bg-white text-slate-900 shadow-xs scale-[1.01]"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className="truncate">{m.label}</span>
              {m.badge !== undefined && m.badge > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                  mode === m.id ? "bg-red-600 text-white" : "bg-slate-200 text-slate-600"
                }`}>
                  {m.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 1. All Subscribers Mode Banner & Inclusion Checklist */}
        {mode === "all" && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border border-red-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  {includedCount}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-900">
                      كارت مجمّع للمشتركين ({includedCount} من {captains.length} مشمول)
                    </h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-red-200 text-red-700">
                      1080×1350 بكسل
                    </span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    اضغط على أي مشترك بالأسفل لتحديده أو استثنائه من الظهور داخل الكارت 🎯
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={includeAllCaptains}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-black transition cursor-pointer shadow-2xs"
                  title="تحديد وإدراج جميع المشتركين"
                >
                  تحديد الكل ✓
                </button>
                <button
                  type="button"
                  onClick={excludeAllCaptains}
                  className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-700 text-[11px] font-black transition cursor-pointer shadow-2xs"
                  title="استثناء وإلغاء تحديد الجميع"
                >
                  استثناء الكل ✕
                </button>
              </div>
            </div>

            {/* List of included / excluded academies */}
            {captains.length > 0 && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {captains.map((c, i) => {
                    const id = c.id || c._id || String(i);
                    const isIncluded = !excludedCaptainIds.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleIncludeCaptain(id)}
                        className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition cursor-pointer ${
                          isIncluded
                            ? "bg-red-50/70 border-red-200 shadow-2xs"
                            : "bg-slate-50/80 border-slate-200/80 opacity-60 hover:opacity-90"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 text-xs font-black transition ${
                          isIncluded
                            ? "bg-red-600 text-white"
                            : "border border-slate-300 bg-white text-transparent"
                        }`}>
                          ✓
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-black truncate ${isIncluded ? "text-slate-900" : "text-slate-500 line-through"}`}>
                            {c.academyName || c.name || "أكاديمية"}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500 truncate">
                            كابتن: {c.name || "—"}
                          </p>
                        </div>
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md shrink-0 ${
                          isIncluded
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-600"
                        }`}>
                          {isIncluded ? "مشمول ✓" : "مستثنى ✕"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. Single Select Mode */}
        {mode === "select" && (
          <div className="space-y-3">
            <label className="block text-[11px] font-black text-slate-500">اختر المشترك لتوليد كارته الشخصي</label>
            {captains.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-3">لا توجد حسابات مسجلة</p>
            ) : (
              <select
                value={selectedCaptainId}
                onChange={(e) => {
                  setSelectedCaptainId(e.target.value);
                  setDataUrl("");
                  setGenerated(false);
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition cursor-pointer"
                dir="rtl"
              >
                <option value="">-- اضغط لاختيار كابتن --</option>
                {captains.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.academyName ? `${c.academyName} — ` : ""}{c.name}
                  </option>
                ))}
              </select>
            )}
            {selectedCaptain && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  🥋 كابتن: {selectedCaptain.name}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700">
                  🏫 أكاديمية: {selectedCaptain.academyName || "—"}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 3. Manual Mode */}
        {mode === "manual" && (
          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-black text-slate-500 mb-1">اسم المدرب / الكابتن</label>
              <input
                type="text"
                value={manualName}
                onChange={(e) => {
                  setManualName(e.target.value);
                  setDataUrl("");
                  setGenerated(false);
                }}
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
                onChange={(e) => {
                  setManualAcademy(e.target.value);
                  setDataUrl("");
                  setGenerated(false);
                }}
                placeholder="مثال: أكاديمية النصر للكاراتيه"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition"
                dir="rtl"
              />
            </div>
          </div>
        )}

        {/* 4. Bulk Mode (Download each card individually) */}
        {mode === "bulk" && (
          <div className="space-y-3">
            {captains.length === 0 ? (
              <p className="text-xs text-slate-400 font-medium text-center py-4">لا توجد حسابات مسجلة حتى الآن</p>
            ) : (
              <>
                <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 border border-slate-200">
                  <button
                    type="button"
                    onClick={toggleAllBulk}
                    className="flex items-center gap-2.5 text-xs font-black text-slate-800 cursor-pointer"
                  >
                    {allBulkSelected ? (
                      <CheckSquare className="w-4 h-4 text-red-600" />
                    ) : someBulkSelected ? (
                      <CheckSquare className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                    {allBulkSelected ? "إلغاء تحديد الكل" : "تحديد الكل"}
                  </button>
                  <span className="text-[11px] text-slate-500 font-bold">
                    {selectedBulkIds.size} / {captains.length} مُحدَّد
                  </span>
                </div>

                <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                  {captains.map((c) => {
                    const id = c.id || c._id;
                    const checked = selectedBulkIds.has(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggleBulkId(id)}
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
        {/* ── Left: Theme + Generate Button ─────────────────── */}
        <div className="space-y-4">
          {/* Theme picker */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Palette className="w-4 h-4 text-violet-500" />
              ثيم وتصميم الكارت
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setDataUrl("");
                    setGenerated(false);
                  }}
                  className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border transition cursor-pointer ${
                    theme === t.id
                      ? "border-red-500 bg-red-50 shadow-2xs shadow-red-100"
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

          {/* Features badge overview with subtext */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              مميزات تبرز داخل الكارت الترويجي
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SYSTEM_FEATURES.map((feat, i) => (
                <div key={i} className="flex flex-col gap-0.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100/90 text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{feat.icon}</span>
                    <span className="text-xs font-bold text-slate-800 leading-tight">{feat.title || feat.text}</span>
                  </div>
                  {feat.desc && (
                    <p className="text-[10.5px] text-slate-500 font-medium mr-6 leading-tight">{feat.desc}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Generate or Bulk Button */}
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
                disabled={selectedBulkIds.size === 0 || bulkProgress.running}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-l from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-black text-sm transition cursor-pointer disabled:opacity-50 shadow-lg shadow-red-200 active:scale-[0.98]"
              >
                {bulkProgress.running ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /><span>جارٍ التحميل...</span></>
                ) : (
                  <><FileImage className="w-4 h-4" /><span>تحميل {selectedBulkIds.size} كارت دفعةً واحدة ⬇️</span></>
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
                <><Sparkles className="w-4 h-4" /><span>🎨 {mode === "all" ? `توليد كارت المشتركين المجمّع (${includedCount})` : "توليد الكارت الترويجي"}</span></>
              )}
            </button>
          )}

          {/* Publishing tips */}
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

        {/* ── Right: Preview & Download ──────────────────────── */}
        <div className="space-y-4">
          {mode === "bulk" ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  معاينة الكارت الترويجي
                </h3>
                {generated && (
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    جاهز ✓
                  </span>
                )}
              </div>

              <div className="rounded-xl overflow-hidden bg-slate-900 min-h-[300px] flex items-center justify-center p-2">
                {generating ? (
                  <div className="flex flex-col items-center gap-3 text-slate-400 py-16">
                    <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-black text-slate-300">يتم رسم وتنسيق الكارت...</p>
                    <p className="text-[11px] text-slate-500">جودة HD 1080×1350 🎨</p>
                  </div>
                ) : dataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dataUrl} alt="كارت CoachMaster" className="w-full h-auto block rounded-xl shadow-lg" draggable="false" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-500 py-16 px-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-xs font-black text-slate-400">اضغط &quot;توليد الكارت&quot; لعرض المعاينة المباشرة</p>
                    <p className="text-[11px] text-slate-600 max-w-[240px]">
                      {mode === "all" ? `سيتم إدراج المشتركين المحددين (${includedCount}) داخل الكارت المجمّع` : "اختر الثيم والبيانات واضغط توليد"}
                    </p>
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
                    📐 1080×1350 — مقاس رأسي مثالي للمشاركة والطباعة
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
