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
  Plus,
  RotateCcw,
} from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { WEEK_DAYS, formatBranchDays, formatTime12h, normalizeDayEntry } from "../../lib/dashboard-utils";

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

    // Immediate optimistic update
    setBranchDaysEdits((prev) => ({
      ...prev,
      [branch.name]: nextDays,
    }));

    // Auto-save
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
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-xs animate-fade-in-scale"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        dir="rtl"
      >
        <div className="relative w-full max-w-xl h-auto max-h-[92dvh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl flex flex-col overflow-hidden">
          {/* 1. Header: نظيف وبسيط وواضح */}
          <div className="shrink-0 border-b border-slate-200/80 bg-white px-5 pt-3.5 pb-4">
            {/* مقبض سحب الموبايل */}
            <div className="sheet-drag-handle sm:hidden mb-2" />

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 text-xl font-bold border border-slate-200">
                  🏢
                </div>
                <div>
                  <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900">
                    إدارة الصالات ومواعيد التمرين
                  </h2>
                  <p className="text-xs font-bold text-slate-500">
                    حدد أيام التدريب لكل صالة لتفعيل التحضير الذكي
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

          {/* 2. Scrollable Body: كل شيء معروض بوضوح تام وبدون اختفاء */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* إشعار النظام */}
            {notice && (
              <div
                className={`flex items-center gap-2 rounded-xl border p-3 text-xs sm:text-sm font-bold leading-relaxed ${
                  notice.includes("نجاح") || notice.startsWith("تم")
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-rose-200 bg-rose-50 text-rose-800"
                }`}
                role="status"
              >
                <span>{notice.includes("نجاح") || notice.startsWith("تم") ? "✓" : "⚠️"}</span>
                <span>{notice}</span>
              </div>
            )}

            {/* قسم إضافة صالة جديدة: تصميم هادئ وواضح */}
            <form
              onSubmit={submitNewBranch}
              className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 space-y-3"
            >
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-red-600 stroke-[3]" />
                <h3 className="font-cairo text-sm font-black text-slate-900">
                  إضافة صالة جديدة
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الصالة أو الفرع:
                </label>
                <input
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3.5 text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="اكتب اسم الصالة (مثال: صالة النادي الرئيسي)"
                  required
                  disabled={isAdding}
                />
              </div>

              {/* اختيار أيام الصالة الجديدة */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">
                    أيام تمرين الصالة الجديدة:
                  </span>
                  {/* أزرار التحديد السريع */}
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => applyPresetToNewBranch("sat-mon-wed")}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
                    >
                      سبت/إثنين/أربعاء
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPresetToNewBranch("sun-tue-thu")}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 cursor-pointer"
                    >
                      أحد/ثلاثاء/خميس
                    </button>
                  </div>
                </div>

                {/* شبكة الأيام السبعة */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                  {WEEK_DAYS.map((day) => {
                    const active = selectedDays.find((e) => e.day === day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleNewBranchDay(day.id)}
                        className={`min-h-[42px] px-2 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                          active
                            ? "bg-red-600 text-white shadow-xs"
                            : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        {active ? `✓ ${day.label}` : day.label}
                      </button>
                    );
                  })}
                </div>

                {/* تحديد ساعات الصالة الجديدة إذا تم اختيار أيام */}
                {selectedDays.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <span className="block text-xs font-bold text-slate-600">
                      ساعات تمرين الأيام المحددة (اختياري):
                    </span>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedDays.map((entry) => {
                        const dayLabel = WEEK_DAYS.find((w) => w.id === entry.day)?.label || entry.day;
                        return (
                          <div
                            key={entry.day}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2.5"
                          >
                            <span className="text-xs font-black text-slate-900">{dayLabel}</span>
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                                <span className="text-xs text-slate-500 font-bold">من:</span>
                                <input
                                  type="time"
                                  value={entry.from}
                                  onChange={(e) => updateNewBranchDayTime(entry.day, "from", e.target.value)}
                                  className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                                />
                                {entry.from && (
                                  <span className="shrink-0 text-[11px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                    {formatTime12h(entry.from)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1">
                                <span className="text-xs text-slate-500 font-bold">إلى:</span>
                                <input
                                  type="time"
                                  value={entry.to}
                                  onChange={(e) => updateNewBranchDayTime(entry.day, "to", e.target.value)}
                                  className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                                />
                                {entry.to && (
                                  <span className="shrink-0 text-[11px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                    {formatTime12h(entry.to)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* زر الإضافة */}
              <button
                type="submit"
                disabled={isAdding || !name.trim()}
                className="min-h-[44px] w-full rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري إضافة الصالة...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 stroke-[3]" />
                    <span>إضافة الصالة وحفظها</span>
                  </>
                )}
              </button>
            </form>

            {/* قائمة الصالات المسجلة - معروضة بوضوح ودون أي إخفاء */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between px-1">
                <h3 className="font-cairo text-sm font-black text-slate-900 flex items-center gap-2">
                  <span>الصالات المسجلة</span>
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                    {branches.length}
                  </span>
                </h3>
                <span className="text-xs font-bold text-slate-500">
                  اضغط على أي يوم لتفعيله أو إلغائه فوراً
                </span>
              </div>

              {branches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                  <span className="text-3xl block mb-2">🏢</span>
                  <p className="text-sm font-bold text-slate-700">لا توجد أي صالات مسجلة بعد</p>
                  <p className="text-xs text-slate-500 mt-1">اكتب اسم الصالة بالأعلى وأضفها لتظهر هنا فوراً.</p>
                </div>
              ) : (
                branches.map((branch) => {
                  const playerCount = players.filter(
                    (player) => (player.branch || "").trim() === (branch.name || "").trim()
                  ).length;
                  const isRenamingThis = editingBranchName === branch.name;
                  const currentDays = getEffectiveBranchDays(branch);
                  const changed = hasDaysChanged(branch);
                  const isSavingThis = savingDaysBranch === branch.name;
                  const isSavedSuccess = Boolean(savedSuccessMap[branch.name]);
                  const formattedDays = formatBranchDays({ days: currentDays });

                  return (
                    <div
                      key={branch._id || branch.name}
                      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs"
                    >
                      {/* رأس كارت الصالة: الاسم واللاعبين وأزرار التحكم */}
                      <div className="flex items-start justify-between gap-3">
                        {isRenamingThis ? (
                          <div className="flex flex-col sm:flex-row gap-2 flex-1">
                            <input
                              className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              autoFocus
                              disabled={isRenaming}
                              placeholder="اسم الصالة الجديد"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveRename(branch.name)}
                                disabled={isRenaming || !editingNameValue.trim()}
                                className="flex h-10 px-3.5 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs cursor-pointer"
                              >
                                {isRenaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                <span>حفظ</span>
                              </button>
                              <button
                                type="button"
                                onClick={cancelRename}
                                disabled={isRenaming}
                                className="flex h-10 px-3 items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                                <span>إلغاء</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">🏢</span>
                                <h4 className="font-cairo text-base font-black text-slate-900">
                                  {branch.name}
                                </h4>
                              </div>
                              <span className="inline-block mt-1 text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                👥 {playerCount} لاعب مقيد بالفرع
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => startRename(branch)}
                                className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
                                title="تعديل اسم الصالة"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>تعديل الاسم</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (playerCount) {
                                    onDeleteBlocked?.(branch.name, playerCount);
                                    return;
                                  }
                                  setDeleteTargetBranch(branch.name);
                                }}
                                className="flex items-center gap-1 h-8 px-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer"
                                title="حذف الصالة"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* قسم تحديد أيام التمرين: ظاهر ومباشر ومريح جداً */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            أيام التمرين الرسمية:
                          </span>
                          {/* تحديد سريع */}
                          <div className="flex items-center gap-1 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => applyPresetToBranch(branch, "sat-mon-wed")}
                              disabled={isSavingThis}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            >
                              سبت/إثنين/أربعاء
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetToBranch(branch, "sun-tue-thu")}
                              disabled={isSavingThis}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                            >
                              أحد/ثلاثاء/خميس
                            </button>
                            <button
                              type="button"
                              onClick={() => applyPresetToBranch(branch, "clear")}
                              disabled={isSavingThis}
                              className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 hover:bg-rose-100 cursor-pointer"
                            >
                              تفريغ
                            </button>
                          </div>
                        </div>

                        {/* شبكة الأيام السبعة بالأزرار الواضحة */}
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                          {WEEK_DAYS.map((day) => {
                            const active = currentDays.find((e) => e.day === day.id);
                            return (
                              <button
                                key={day.id}
                                type="button"
                                onClick={() => toggleBranchDay(branch, day.id)}
                                disabled={isSavingThis}
                                className={`min-h-[42px] px-2 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 flex items-center justify-center ${
                                  active
                                    ? "bg-red-600 text-white shadow-xs"
                                    : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                                }`}
                              >
                                {active ? `✓ ${day.label}` : day.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* الساعات والتوقيت للأيام المختارة */}
                        {currentDays.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <span className="block text-xs font-bold text-slate-500">
                              ساعات تدريب الأيام المختارة (اختياري):
                            </span>
                            <div className="grid grid-cols-1 gap-1.5">
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
                                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs"
                                    >
                                      <span className="font-black text-slate-800">{dayLabel}</span>
                                      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
                                          <span className="text-slate-400 font-bold">من:</span>
                                          <input
                                            type="time"
                                            value={entry.from || ""}
                                            onChange={(e) => updateBranchDayTime(branch, entry.day, "from", e.target.value)}
                                            disabled={isSavingThis}
                                            className="w-full bg-transparent font-bold text-slate-800 outline-none"
                                          />
                                          {entry.from && (
                                            <span className="shrink-0 text-[11px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                              {formatTime12h(entry.from)}
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
                                          <span className="text-slate-400 font-bold">إلى:</span>
                                          <input
                                            type="time"
                                            value={entry.to || ""}
                                            onChange={(e) => updateBranchDayTime(branch, entry.day, "to", e.target.value)}
                                            disabled={isSavingThis}
                                            className="w-full bg-transparent font-bold text-slate-800 outline-none"
                                          />
                                          {entry.to && (
                                            <span className="shrink-0 text-[11px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">
                                              {formatTime12h(entry.to)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}

                        {/* ملخص المواعيد وأزرار الحفظ أو التراجع */}
                        <div className="pt-2 flex items-center justify-between text-xs font-bold">
                          <div>
                            {isSavedSuccess ? (
                              <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                                ✓ تم حفظ المواعيد بنجاح
                              </span>
                            ) : (
                              <span className="text-slate-600">
                                {currentDays.length > 0 ? (
                                  <span>المواعيد: <strong className="text-slate-900">{formattedDays}</strong></span>
                                ) : (
                                  <span className="text-amber-700">لم تحدد أيام تدريب بعد</span>
                                )}
                              </span>
                            )}
                          </div>

                          {changed && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => resetBranchDays(branch)}
                                disabled={isSavingThis}
                                className="h-8 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 cursor-pointer"
                              >
                                تراجع
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveBranchDays(branch)}
                                disabled={isSavingThis}
                                className="flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black cursor-pointer shadow-xs"
                              >
                                {isSavingThis ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                )}
                                <span>حفظ المواعيد ✓</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* نافذة تأكيد حذف الصالة */}
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
