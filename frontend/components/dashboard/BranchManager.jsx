"use client";
import { useState } from "react";
import {
  Building2,
  Pencil,
  Trash2,
  Check,
  X,
  CalendarDays,
  Loader2,
  Sparkles,
  Clock,
  ChevronDown,
  ChevronUp,
  Plus,
  RotateCcw,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { WEEK_DAYS, formatBranchDays, normalizeDayEntry } from "../../lib/dashboard-utils";

export default function BranchManager({
  branches = [],
  players = [],
  onAdd,
  onRename,
  onUpdateBranch,
  onDelete,
  onDeleteBlocked,
  notice = "",
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(branches.length === 0 ? "add" : "list");
  const [name, setName] = useState("");
  const [selectedDays, setSelectedDays] = useState([]); // [{day, from, to}]
  const [editingBranchName, setEditingBranchName] = useState(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [branchDaysEdits, setBranchDaysEdits] = useState({});
  const [savingDaysBranch, setSavingDaysBranch] = useState(null);
  const [savedSuccessMap, setSavedSuccessMap] = useState({});
  const [deleteTargetBranch, setDeleteTargetBranch] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // By default, expand all branches if 2 or fewer, otherwise keep first one expanded
  const [expandedBranches, setExpandedBranches] = useState(() => {
    const map = {};
    if (Array.isArray(branches) && branches.length <= 2) {
      branches.forEach((b) => {
        if (b?.name) map[b.name] = true;
      });
    } else if (Array.isArray(branches) && branches[0]?.name) {
      map[branches[0].name] = true;
    }
    return map;
  });

  function toggleExpandBranch(branchName) {
    setExpandedBranches((prev) => ({
      ...prev,
      [branchName]: !prev[branchName],
    }));
  }

  // ---- helpers for {day, from, to} arrays ----
  function normalizeDays(rawDays) {
    if (!Array.isArray(rawDays)) return [];
    return rawDays.map(normalizeDayEntry).filter(Boolean);
  }

  // Toggle a day in the "new branch" form
  function toggleNewBranchDay(dayId) {
    setSelectedDays((prev) => {
      const exists = prev.find((e) => e.day === dayId);
      if (exists) return prev.filter((e) => e.day !== dayId);
      return [...prev, { day: dayId, from: "", to: "" }];
    });
  }

  function updateNewBranchDayTime(dayId, field, value) {
    setSelectedDays((prev) =>
      prev.map((e) => (e.day === dayId ? { ...e, [field]: value } : e))
    );
  }

  function applyPresetToNewBranch(presetType) {
    if (presetType === "sat-mon-wed") {
      setSelectedDays([
        { day: "sat", from: "", to: "" },
        { day: "mon", from: "", to: "" },
        { day: "wed", from: "", to: "" },
      ]);
    } else if (presetType === "sun-tue-thu") {
      setSelectedDays([
        { day: "sun", from: "", to: "" },
        { day: "tue", from: "", to: "" },
        { day: "thu", from: "", to: "" },
      ]);
    } else if (presetType === "all") {
      setSelectedDays(WEEK_DAYS.map((w) => ({ day: w.id, from: "", to: "" })));
    } else if (presetType === "clear") {
      setSelectedDays([]);
    }
  }

  function getEffectiveBranchDays(branch) {
    if (branchDaysEdits[branch.name] !== undefined) {
      return normalizeDays(branchDaysEdits[branch.name]);
    }
    return normalizeDays(Array.isArray(branch.days) ? branch.days : []);
  }

  async function toggleBranchDay(branch, dayId) {
    const currentDays = getEffectiveBranchDays(branch);
    const exists = currentDays.find((e) => e.day === dayId);
    const nextDays = exists
      ? currentDays.filter((e) => e.day !== dayId)
      : [...currentDays, { day: dayId, from: "", to: "" }];

    // 1. Immediate optimistic UI update
    setBranchDaysEdits((prev) => ({
      ...prev,
      [branch.name]: nextDays,
    }));

    // 2. Immediate auto-save to database & dashboard so refresh persists
    setSavingDaysBranch(branch.name);
    try {
      if (typeof onUpdateBranch === "function") {
        await onUpdateBranch(branch.name, { days: nextDays });
      }
      setSavedSuccessMap((prev) => ({ ...prev, [branch.name]: true }));
      setTimeout(() => {
        setSavedSuccessMap((prev) => {
          const next = { ...prev };
          delete next[branch.name];
          return next;
        });
      }, 2500);
    } catch (err) {
      console.error("Auto-save branch days failed:", err);
    } finally {
      setSavingDaysBranch(null);
    }
  }

  function updateBranchDayTime(branch, dayId, field, value) {
    const currentDays = getEffectiveBranchDays(branch);
    const nextDays = currentDays.map((e) =>
      e.day === dayId ? { ...e, [field]: value } : e
    );
    setBranchDaysEdits((prev) => ({ ...prev, [branch.name]: nextDays }));
  }

  function applyPresetToBranch(branch, presetType) {
    let nextDays = [];
    if (presetType === "sat-mon-wed") {
      nextDays = [
        { day: "sat", from: "", to: "" },
        { day: "mon", from: "", to: "" },
        { day: "wed", from: "", to: "" },
      ];
    } else if (presetType === "sun-tue-thu") {
      nextDays = [
        { day: "sun", from: "", to: "" },
        { day: "tue", from: "", to: "" },
        { day: "thu", from: "", to: "" },
      ];
    } else if (presetType === "all") {
      nextDays = WEEK_DAYS.map((w) => ({ day: w.id, from: "", to: "" }));
    } else if (presetType === "clear") {
      nextDays = [];
    }
    setBranchDaysEdits((prev) => ({ ...prev, [branch.name]: nextDays }));
  }

  function hasDaysChanged(branch) {
    if (branchDaysEdits[branch.name] === undefined) return false;
    const current = normalizeDays(branchDaysEdits[branch.name]);
    const original = normalizeDays(Array.isArray(branch.days) ? branch.days : []);
    if (current.length !== original.length) return true;
    const sortFn = (a, b) => a.day.localeCompare(b.day);
    const sortedC = [...current].sort(sortFn);
    const sortedO = [...original].sort(sortFn);
    return sortedC.some(
      (c, i) => c.day !== sortedO[i]?.day || c.from !== sortedO[i]?.from || c.to !== sortedO[i]?.to
    );
  }

  async function handleSaveBranchDays(branch) {
    const daysToSave = getEffectiveBranchDays(branch);
    setSavingDaysBranch(branch.name);
    try {
      if (typeof onUpdateBranch === "function") {
        await onUpdateBranch(branch.name, { days: daysToSave });
      }
      setBranchDaysEdits((prev) => {
        const next = { ...prev };
        delete next[branch.name];
        return next;
      });
      setSavedSuccessMap((prev) => ({ ...prev, [branch.name]: true }));
      setTimeout(() => {
        setSavedSuccessMap((prev) => {
          const next = { ...prev };
          delete next[branch.name];
          return next;
        });
      }, 3000);
    } finally {
      setSavingDaysBranch(null);
    }
  }

  function resetBranchDays(branch) {
    setBranchDaysEdits((prev) => {
      const next = { ...prev };
      delete next[branch.name];
      return next;
    });
  }

  async function submitNewBranch(event) {
    if (event) event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      await onAdd(trimmed, selectedDays);
      setName("");
      setSelectedDays([]);
      setActiveTab("list");
      setExpandedBranches((prev) => ({ ...prev, [trimmed]: true }));
    } finally {
      setIsAdding(false);
    }
  }

  function startRename(branch) {
    setEditingBranchName(branch.name);
    setEditingNameValue(branch.name);
  }

  function cancelRename() {
    setEditingBranchName(null);
    setEditingNameValue("");
  }

  async function handleSaveRename(oldName) {
    const trimmed = editingNameValue.trim();
    if (!trimmed || trimmed === oldName) {
      cancelRename();
      return;
    }
    setIsRenaming(true);
    try {
      if (typeof onUpdateBranch === "function") {
        await onUpdateBranch(oldName, { newName: trimmed });
      } else if (typeof onRename === "function") {
        await onRename(oldName, trimmed);
      }
    } finally {
      setIsRenaming(false);
      cancelRename();
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetBranch) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTargetBranch);
    } finally {
      setIsDeleting(false);
      setDeleteTargetBranch(null);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 p-0 sm:p-4 backdrop-blur-sm animate-fade-in-scale"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        dir="rtl"
      >
        <div className="relative w-full max-w-lg sm:max-w-xl h-auto max-h-[94dvh] sm:max-h-[90vh] rounded-t-[32px] sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col overflow-hidden animate-bottom-sheet sm:animate-none">
          {/* 1. Header: Fixed / Non-scrolling at top with grab bar */}
          <div className="shrink-0 border-b border-slate-100 bg-white px-4 sm:px-6 pt-3 pb-3.5 z-10">
            {/* مقبض سحب شيت الموبايل */}
            <div className="sheet-drag-handle sm:hidden mb-2.5" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/25">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900 truncate">
                    إدارة الصالات وأيام العمل
                  </h2>
                  <p className="text-[11px] font-bold text-slate-500 truncate">
                    تحديد مواعيد التمرين وتفعيل التحضير التلقائي
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 active:scale-95 transition cursor-pointer"
                title="إغلاق"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 2. Scrollable Body: Single Smooth Scroll without nested traps */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 overscroll-contain space-y-4">
            {/* Notice Alert if present */}
            {notice && (
              <div
                className={`flex items-center gap-2 rounded-2xl border p-3 text-xs font-bold leading-relaxed ${
                  notice.includes("نجاح") || notice.startsWith("تم")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
                role="status"
              >
                <span className="text-base">{notice.includes("نجاح") || notice.startsWith("تم") ? "✓" : "⚠️"}</span>
                <span>{notice}</span>
              </div>
            )}

            {/* Segmented Navigation Switcher: [ الصالات الحالية (X) ] | [ ＋ إضافة صالة جديدة ] */}
            <div className="flex rounded-2xl bg-slate-100/90 p-1 border border-slate-200/80 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab("list")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "list"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Building2 className="h-4 w-4 text-red-600" />
                <span>الصالات المسجلة</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === "list" ? "bg-red-50 text-red-600" : "bg-slate-200 text-slate-600"
                }`}>
                  {branches.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("add")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  activeTab === "add"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Plus className="h-4 w-4 text-red-600 stroke-[3]" />
                <span>إضافة صالة جديدة</span>
              </button>
            </div>

            {/* TAB 1: LIST OF BRANCHES */}
            {activeTab === "list" && (
              <div className="space-y-3.5">
                {branches.length === 0 ? (
                  <div className="rounded-3xl border-2 border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                    <span className="text-4xl block mb-2.5">🏢</span>
                    <h3 className="font-cairo text-sm font-black text-slate-800 mb-1">
                      لم تتم إضافة صالات أو فروع بعد
                    </h3>
                    <p className="text-xs text-slate-500 mb-4 font-bold">
                      أضف فروع وصالات الأكاديمية وحدد أيام تدريبها لتفعيل الحضور الذكي.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab("add")}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-xs shadow-md shadow-red-600/25 active-press cursor-pointer"
                    >
                      <Plus className="h-4 w-4 stroke-[3]" />
                      <span>إضافة أول صالة تدريب الآن</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-bold">
                      <span>انقر على الصالة لتعديل أيام ومواعيد التمرين 🥋</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("add")}
                        className="text-red-600 hover:text-red-700 font-black flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>صالة جديدة</span>
                      </button>
                    </div>

                    {branches.map((branch) => {
                      const playerCount = players.filter(
                        (player) => (player.branch || "").trim() === (branch.name || "").trim()
                      ).length;
                      const isRenamingThis = editingBranchName === branch.name;
                      const currentDays = getEffectiveBranchDays(branch);
                      const changed = hasDaysChanged(branch);
                      const isSavingThis = savingDaysBranch === branch.name;
                      const isSavedSuccess = Boolean(savedSuccessMap[branch.name]);
                      const formattedDays = formatBranchDays({ days: currentDays });
                      const isExpanded = Boolean(expandedBranches[branch.name]);

                      return (
                        <div
                          key={branch._id || branch.name}
                          className={`rounded-3xl border transition-all shadow-2xs overflow-hidden ${
                            isExpanded
                              ? "border-red-200/90 bg-white shadow-md ring-1 ring-red-100"
                              : "border-slate-200/80 bg-slate-50/70 hover:bg-white hover:border-slate-300"
                          }`}
                        >
                          {/* Branch Header Row */}
                          <div className="p-3.5 sm:p-4">
                            <div className="flex items-start justify-between gap-3">
                              {/* Branch Info / Inline Rename */}
                              <div className="flex items-start gap-3 min-w-0 flex-1">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-lg border border-slate-200 shadow-2xs">
                                  🏢
                                </div>

                                {isRenamingThis ? (
                                  <div className="flex flex-col sm:flex-row gap-2 flex-1 min-w-0">
                                    <input
                                      className="h-10 flex-1 min-w-0 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                      value={editingNameValue}
                                      onChange={(e) => setEditingNameValue(e.target.value)}
                                      autoFocus
                                      disabled={isRenaming}
                                      placeholder="اسم الصالة الجديد"
                                    />
                                    <div className="flex items-center gap-1.5 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveRename(branch.name)}
                                        disabled={isRenaming || !editingNameValue.trim()}
                                        className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 active-press font-bold text-xs cursor-pointer shadow-sm shadow-emerald-600/20"
                                        title="حفظ الاسم الجديد"
                                      >
                                        {isRenaming ? (
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="h-4 w-4" />
                                        )}
                                        <span>حفظ</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelRename}
                                        disabled={isRenaming}
                                        className="flex h-10 px-3 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 active-press cursor-pointer font-bold text-xs"
                                        title="إلغاء التعديل"
                                      >
                                        <X className="h-4 w-4" />
                                        <span>إلغاء</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <h3 className="truncate font-cairo text-sm sm:text-base font-black text-slate-900">
                                        {branch.name}
                                      </h3>
                                      <button
                                        type="button"
                                        onClick={() => startRename(branch)}
                                        className="text-slate-400 hover:text-slate-800 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                        title="تعديل اسم الصالة"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-[11px] font-bold text-slate-600">
                                        👥 {playerCount} لاعب مقيد
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 text-[11px] font-bold text-red-700">
                                        {currentDays.length ? `✓ ${currentDays.length} أيام أسبوعياً` : "لم تحدد أيام"}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons: Delete & Expand */}
                              {!isRenamingThis && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    className="flex items-center justify-center h-9 w-9 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 active-press transition cursor-pointer"
                                    onClick={() => {
                                      if (playerCount) {
                                        onDeleteBlocked?.(branch.name, playerCount);
                                        return;
                                      }
                                      setDeleteTargetBranch(branch.name);
                                    }}
                                    title="حذف الصالة"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => toggleExpandBranch(branch.name)}
                                    className={`flex items-center gap-1.5 h-9 px-3 rounded-xl font-bold text-xs transition cursor-pointer active-press ${
                                      isExpanded
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                    }`}
                                  >
                                    <span>{isExpanded ? "إخفاء المواعيد" : "تعديل المواعيد"}</span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Summary row when collapsed */}
                            {!isExpanded && (
                              <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="text-slate-500 font-bold truncate">
                                  {currentDays.length > 0 ? (
                                    <span>📅 مواعيد التمرين: <strong className="text-slate-800">{formattedDays}</strong></span>
                                  ) : (
                                    <span className="text-amber-600 font-bold">⚠️ لم يتم تحديد مواعيد وتدريبات لهذه الصالة</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Expanded Configuration Section */}
                          {isExpanded && (
                            <div className="border-t border-slate-100 bg-slate-50/50 p-3.5 sm:p-4 space-y-3">
                              {/* Top Bar inside schedule config */}
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                  <CalendarDays className="h-4 w-4 text-red-600" />
                                  حدد أيام تدريب صالة ({branch.name}):
                                </span>

                                {/* Save Status / Success */}
                                {isSavedSuccess && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 animate-pulse">
                                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                                    تم الحفظ بنجاح ✓
                                  </span>
                                )}
                              </div>

                              {/* Quick Presets Bar */}
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                                <span className="text-slate-400 font-bold shrink-0 ml-1">تحديد سريع:</span>
                                <button
                                  type="button"
                                  onClick={() => applyPresetToBranch(branch, "sat-mon-wed")}
                                  disabled={isSavingThis}
                                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:border-red-300 hover:text-red-700 active:scale-95 transition cursor-pointer"
                                >
                                  سبت / إثنين / أربعاء
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPresetToBranch(branch, "sun-tue-thu")}
                                  disabled={isSavingThis}
                                  className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:border-red-300 hover:text-red-700 active:scale-95 transition cursor-pointer"
                                >
                                  أحد / ثلاثاء / خميس
                                </button>
                                <button
                                  type="button"
                                  onClick={() => applyPresetToBranch(branch, "clear")}
                                  disabled={isSavingThis}
                                  className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 font-bold hover:bg-rose-100 active:scale-95 transition cursor-pointer"
                                >
                                  تفريغ الكل
                                </button>
                              </div>

                              {/* 7 Days Grid: 4 columns on mobile, 7 on sm screens with 44px touch targets */}
                              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                                {WEEK_DAYS.map((day) => {
                                  const active = currentDays.find((e) => e.day === day.id);
                                  return (
                                    <button
                                      key={day.id}
                                      type="button"
                                      onClick={() => toggleBranchDay(branch, day.id)}
                                      disabled={isSavingThis}
                                      className={`min-h-[44px] sm:min-h-[40px] px-2 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                                        active
                                          ? "bg-red-600 text-white shadow-sm ring-2 ring-red-400/50"
                                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                                      }`}
                                      title={active ? `إلغاء يوم ${day.label}` : `تفعيل يوم ${day.label}`}
                                    >
                                      <span className="leading-tight">{day.label}</span>
                                      <span className={`text-[9.5px] font-bold ${active ? "text-red-100" : "text-slate-400"}`}>
                                        {active ? "✓ تمرين" : "عطلة"}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Time Slots for Selected Days */}
                              {currentDays.length > 0 && (
                                <div className="space-y-2 pt-2.5 border-t border-slate-200/70">
                                  <div className="flex items-center justify-between text-xs">
                                    <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                                      <Clock className="h-3.5 w-3.5 text-red-500" />
                                      ساعات التدريب للأيام المختارة:
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      (اختياري)
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    {[...currentDays]
                                      .sort((a, b) => {
                                        const order = WEEK_DAYS.map((w) => w.id);
                                        return order.indexOf(a.day) - order.indexOf(b.day);
                                      })
                                      .map((entry) => {
                                        const dayLabel = WEEK_DAYS.find((w) => w.id === entry.day)?.label || entry.day;
                                        return (
                                          <div
                                            key={entry.day}
                                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:px-3 sm:py-2 transition focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-100"
                                          >
                                            <div className="flex items-center gap-2">
                                              <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-red-100 text-red-700 text-[10px] font-black">
                                                ✓
                                              </span>
                                              <span className="text-xs font-black text-slate-900">{dayLabel}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
                                              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                                                <span className="text-[11px] font-black text-slate-400 shrink-0">من:</span>
                                                <input
                                                  type="time"
                                                  value={entry.from || ""}
                                                  onChange={(e) => updateBranchDayTime(branch, entry.day, "from", e.target.value)}
                                                  disabled={isSavingThis}
                                                  className="w-full min-w-0 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                                />
                                              </div>

                                              <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                                                <span className="text-[11px] font-black text-slate-400 shrink-0">إلى:</span>
                                                <input
                                                  type="time"
                                                  value={entry.to || ""}
                                                  onChange={(e) => updateBranchDayTime(branch, entry.day, "to", e.target.value)}
                                                  disabled={isSavingThis}
                                                  className="w-full min-w-0 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                                />
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}

                              {/* Manual Save Actions if times were edited */}
                              {changed && (
                                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => resetBranchDays(branch)}
                                    disabled={isSavingThis}
                                    className="flex items-center gap-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer active:scale-95"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                    <span>تراجع</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSaveBranchDays(branch)}
                                    disabled={isSavingThis}
                                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 cursor-pointer disabled:opacity-50"
                                  >
                                    {isSavingThis ? (
                                      <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span>جاري الحفظ...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Check className="h-4 w-4 stroke-[3]" />
                                        <span>حفظ المواعيد ✓</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}

            {/* TAB 2: ADD NEW BRANCH */}
            {activeTab === "add" && (
              <form
                onSubmit={submitNewBranch}
                className="rounded-3xl border border-red-200/80 bg-gradient-to-b from-red-50/40 via-white to-white p-4 sm:p-5 shadow-sm space-y-4"
              >
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1.5">
                    🏢 اسم الصالة أو الفرع الجديد:
                  </label>
                  <input
                    className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-4 focus:ring-red-100 shadow-2xs"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="مثال: صالة 1 - النادي الرئيسي"
                    required
                    disabled={isAdding}
                    autoFocus
                  />
                </div>

                {/* Days Configuration for New Branch */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4 text-red-600" />
                      أيام التدريب الأسبوعية:
                    </span>
                    <span className="text-[11px] font-bold text-slate-500">
                      {selectedDays.length ? `${selectedDays.length} أيام محددة` : "اضغط لاختيار الأيام"}
                    </span>
                  </div>

                  {/* Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    <span className="text-slate-400 font-bold shrink-0 ml-1">تحديد سريع:</span>
                    <button
                      type="button"
                      onClick={() => applyPresetToNewBranch("sat-mon-wed")}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:border-red-300 hover:text-red-700 active:scale-95 transition cursor-pointer"
                    >
                      سبت / إثنين / أربعاء
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToNewBranch("sun-tue-thu")}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:border-red-300 hover:text-red-700 active:scale-95 transition cursor-pointer"
                    >
                      أحد / ثلاثاء / خميس
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToNewBranch("clear")}
                      className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 font-bold hover:bg-rose-100 active:scale-95 transition cursor-pointer"
                    >
                      تفريغ
                    </button>
                  </div>

                  {/* 7 Days Grid */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2">
                    {WEEK_DAYS.map((day) => {
                      const active = selectedDays.find((e) => e.day === day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={() => toggleNewBranchDay(day.id)}
                          className={`min-h-[44px] sm:min-h-[40px] px-2 py-1.5 rounded-2xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                            active
                              ? "bg-red-600 text-white shadow-sm ring-2 ring-red-400/50"
                              : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                          }`}
                        >
                          <span className="leading-tight">{day.label}</span>
                          <span className={`text-[9.5px] font-bold ${active ? "text-red-100" : "text-slate-400"}`}>
                            {active ? "✓ تمرين" : "عطلة"}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Time Slots for Selected Days */}
                  {selectedDays.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-200/80">
                      <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-red-500" />
                        ساعات التمرين للأيام المحددة (اختياري):
                      </span>

                      <div className="grid grid-cols-1 gap-2">
                        {selectedDays.map((entry) => {
                          const dayLabel = WEEK_DAYS.find((w) => w.id === entry.day)?.label || entry.day;
                          return (
                            <div
                              key={entry.day}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-2.5 sm:px-3 sm:py-2"
                            >
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-red-100 text-red-700 text-[10px] font-black">
                                  ✓
                                </span>
                                <span className="text-xs font-black text-slate-900">{dayLabel}</span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2">
                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                                  <span className="text-[11px] font-black text-slate-400 shrink-0">من:</span>
                                  <input
                                    type="time"
                                    value={entry.from}
                                    onChange={(e) => updateNewBranchDayTime(entry.day, "from", e.target.value)}
                                    className="w-full min-w-0 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                                  <span className="text-[11px] font-black text-slate-400 shrink-0">إلى:</span>
                                  <input
                                    type="time"
                                    value={entry.to}
                                    onChange={(e) => updateNewBranchDayTime(entry.day, "to", e.target.value)}
                                    className="w-full min-w-0 bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isAdding || !name.trim()}
                    className="min-h-[48px] w-full rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-md shadow-red-600/25 active-press cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>جاري حفظ وإضافة الصالة...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 stroke-[3]" />
                        <span>إضافة الصالة الآن وحفظ مواعيدها</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal for deleting branch */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetBranch)}
        title="تأكيد حذف الفرع"
        message={`هل أنت متأكد من رغبتك في حذف فرع "${deleteTargetBranch}"؟ لن يمكنك التراجع عن هذا الإجراء.`}
        confirmText="نعم، احذف الفرع"
        cancelText="تراجع"
        confirmVariant="danger"
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetBranch(null)}
      />
    </>
  );
}
