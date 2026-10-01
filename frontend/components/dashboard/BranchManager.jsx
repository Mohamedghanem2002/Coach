"use client";
import { useState } from "react";
import { Building2, Pencil, Trash2, Check, X, CalendarDays, Loader2, Sparkles, Clock } from "lucide-react";
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

  function getDayEntry(daysArr, dayId) {
    return normalizeDays(daysArr).find((e) => e.day === dayId) || null;
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

  async function updateBranchDayTime(branch, dayId, field, value) {
    const currentDays = getEffectiveBranchDays(branch);
    const nextDays = currentDays.map((e) =>
      e.day === dayId ? { ...e, [field]: value } : e
    );
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
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsAdding(true);
    try {
      await onAdd(trimmed, selectedDays);
      setName("");
      setSelectedDays([]); // Reset to empty
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
        className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-fade-in-scale"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        dir="rtl"
      >
        <div className="relative w-full max-w-lg rounded-t-3xl border border-slate-200/90 bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7 animate-bottom-sheet sm:animate-none pb-safe max-h-[92dvh] sm:max-h-[90vh] overflow-y-auto">
          {/* مقبض سحب الموبايل */}
          <div className="sheet-drag-handle sm:hidden" />

          {/* رأس النافذة */}
          <div className="mb-4 flex items-start justify-between border-b border-slate-100 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/25 text-lg font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-red-600">
                  إعداد مواعيد العمل والتدريب
                </p>
                <h2 className="font-cairo text-lg font-black text-slate-900 sm:text-xl">
                  إدارة الصالات وأيام العمل
                </h2>
              </div>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              onClick={onClose}
              title="إغلاق"
            >
              ✕
            </button>
          </div>

          <p className="mb-4 text-xs font-semibold leading-5 text-slate-500">
            حدد أيام التدريب الرسمية لكل صالة. سيتم تفعيل أزرار التحضير في أيام العمل وقفلها (مطفية) تلقائياً في الأيام الأخرى لتجنب التسجيل الخاطئ.
          </p>

          {notice && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold leading-6 ${
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

          {/* نموذج إضافة صالة جديدة */}
          <form className="mb-5 rounded-2xl border border-red-200/70 bg-gradient-to-b from-red-50/50 to-white p-3.5 sm:p-4 shadow-2xs" onSubmit={submitNewBranch}>
            <div className="mb-2.5 flex flex-col gap-2 sm:flex-row">
              <input
                className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3.5 text-right text-sm sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-100"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="اسم الصالة (مثال: صالة 1 - النادي الرئيسي)"
                required
                disabled={isAdding}
              />
              <button
                className="min-h-11 whitespace-nowrap rounded-xl bg-red-600 hover:bg-red-700 px-5 text-xs font-black text-white shadow-sm shadow-red-600/25 active-press cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                type="submit"
                disabled={isAdding || !name.trim()}
              >
                {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>＋ إضافة الصالة</span>}
              </button>
            </div>

            {/* اختيار أيام التدريب للصالة الجديدة */}
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-red-600" />
                  أيام تمرين الصالة الجديدة:
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {selectedDays.length ? `${selectedDays.length} أيام مختارة` : "فاضية (اضغط لاختيار الأيام)"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {WEEK_DAYS.map((day) => {
                  const active = selectedDays.find((e) => e.day === day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleNewBranchDay(day.id)}
                      className={`min-h-[32px] px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                        active
                          ? "bg-red-600 text-white shadow-xs ring-1 ring-red-400"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {active ? `✓ ${day.label}` : day.label}
                    </button>
                  );
                })}
              </div>
              {/* حقول الوقت للأيام المختارة */}
              {selectedDays.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-1">
                  {selectedDays.map((entry) => {
                    const dayLabel = WEEK_DAYS.find((w) => w.id === entry.day)?.label || entry.day;
                    return (
                      <div key={entry.day} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5">
                        <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        <span className="text-[11px] font-black text-slate-700 w-16 shrink-0">{dayLabel}</span>
                        <span className="text-[10px] text-slate-400 font-bold">من</span>
                        <input
                          type="time"
                          value={entry.from}
                          onChange={(e) => updateNewBranchDayTime(entry.day, "from", e.target.value)}
                          className="h-7 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 cursor-pointer"
                        />
                        <span className="text-[10px] text-slate-400 font-bold">إلى</span>
                        <input
                          type="time"
                          value={entry.to}
                          onChange={(e) => updateNewBranchDayTime(entry.day, "to", e.target.value)}
                          className="h-7 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </form>

          {/* قائمة الصالات المسجلة */}
          <div className="grid max-h-[50vh] sm:max-h-[44vh] gap-3 overflow-y-auto pr-0.5">
            {branches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <span className="text-3xl block mb-2">🏢</span>
                <p className="text-xs font-bold">لم تتم إضافة فروع أو صالات بعد.</p>
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
                    className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 transition hover:border-slate-300 hover:bg-white shadow-2xs"
                  >
                    {/* الصف العلوي: اسم الصالة وعدد اللاعبين والأزرار */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base shadow-2xs border border-slate-200/70 shrink-0">
                          🏢
                        </div>
                        {isRenamingThis ? (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <input
                              className="h-9 flex-1 min-w-0 rounded-xl border border-slate-300 bg-white px-2.5 text-xs font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              autoFocus
                              disabled={isRenaming}
                              placeholder="اسم الصالة الجديد"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveRename(branch.name)}
                              disabled={isRenaming || !editingNameValue.trim()}
                              className="flex h-9 px-2.5 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 active-press font-bold text-xs cursor-pointer"
                              title="حفظ الاسم الجديد"
                            >
                              {isRenaming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                              <span>حفظ</span>
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              disabled={isRenaming}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 active-press cursor-pointer"
                              title="إلغاء التعديل"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <strong className="block truncate font-cairo text-sm font-black text-slate-900">
                                {branch.name}
                              </strong>
                              <button
                                type="button"
                                onClick={() => startRename(branch)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition cursor-pointer"
                                title="تعديل اسم الصالة"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                            <span className="text-[11px] font-bold text-slate-500">
                              {playerCount} لاعب مقيد
                            </span>
                          </div>
                        )}
                      </div>

                      {/* زر حذف الصالة */}
                      {!isRenamingThis && (
                        <button
                          type="button"
                          className="flex items-center gap-1 h-8 rounded-xl bg-white border border-rose-200/80 px-2.5 text-[11px] font-bold text-rose-700 transition hover:bg-rose-50 active-press cursor-pointer shrink-0"
                          onClick={() => {
                            if (playerCount) {
                              onDeleteBlocked?.(branch.name, playerCount);
                              return;
                            }
                            setDeleteTargetBranch(branch.name);
                          }}
                          title="حذف الصالة"
                        >
                          <Trash2 className="h-3 w-3 text-rose-600" />
                          <span>حذف</span>
                        </button>
                      )}
                    </div>

                    {/* قسم تحديد مواعيد وأيام تدريب الصالة */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-2.5">
                      <div className="mb-2 flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                          <CalendarDays className="h-3.5 w-3.5 text-red-600 shrink-0" />
                          <span>أيام تدريب وتمرين الصالة:</span>
                        </div>

                        {/* إشعار الحفظ أو زر الحفظ عند التعديل */}
                        {isSavedSuccess && (
                          <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 animate-pulse">
                            <Sparkles className="h-3 w-3 text-emerald-600" />
                            تم حفظ المواعيد بنجاح ✓
                          </span>
                        )}

                        {changed && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => resetBranchDays(branch)}
                              disabled={isSavingThis}
                              className="h-7 px-2 rounded-lg border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-slate-100 cursor-pointer active:scale-95"
                              title="إلغاء التغيير"
                            >
                              تراجع
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveBranchDays(branch)}
                              disabled={isSavingThis}
                              className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                              title="حفظ مواعيد التدريب الجديدة لهذه الصالة"
                            >
                              {isSavingThis ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  <span>جاري الحفظ...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                                  <span>حفظ المواعيد ✓</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>

                      {/* أزرار أيام الأسبوع السبعة */}
                      <div className="flex flex-wrap gap-1.5">
                        {WEEK_DAYS.map((day) => {
                          const active = currentDays.find((e) => e.day === day.id);
                          return (
                            <button
                              key={day.id}
                              type="button"
                              onClick={() => toggleBranchDay(branch, day.id)}
                              disabled={isSavingThis}
                              className={`min-h-[28px] px-2.5 py-0.5 rounded-lg text-xs font-black transition-all cursor-pointer select-none active:scale-95 ${
                                active
                                  ? "bg-red-600 text-white shadow-xs ring-1 ring-red-400"
                                  : "bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                              }`}
                              title={active ? `إلغاء يوم ${day.label}` : `تفعيل يوم ${day.label}`}
                            >
                              {active ? `✓ ${day.label}` : day.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* حقول الوقت للأيام المفعلة */}
                      {currentDays.length > 0 && (
                        <div className="flex flex-col gap-1.5 mt-2">
                          {[...currentDays]
                            .sort((a, b) => {
                              const order = WEEK_DAYS.map((w) => w.id);
                              return order.indexOf(a.day) - order.indexOf(b.day);
                            })
                            .map((entry) => {
                              const dayLabel = WEEK_DAYS.find((w) => w.id === entry.day)?.label || entry.day;
                              return (
                                <div key={entry.day} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                                  <Clock className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  <span className="text-[11px] font-black text-slate-700 w-16 shrink-0">{dayLabel}</span>
                                  <span className="text-[10px] text-slate-400 font-bold">من</span>
                                  <input
                                    type="time"
                                    value={entry.from || ""}
                                    onChange={(e) => updateBranchDayTime(branch, entry.day, "from", e.target.value)}
                                    disabled={isSavingThis}
                                    className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 cursor-pointer disabled:opacity-50"
                                  />
                                  <span className="text-[10px] text-slate-400 font-bold">إلى</span>
                                  <input
                                    type="time"
                                    value={entry.to || ""}
                                    onChange={(e) => updateBranchDayTime(branch, entry.day, "to", e.target.value)}
                                    disabled={isSavingThis}
                                    className="h-7 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 cursor-pointer disabled:opacity-50"
                                  />
                                </div>
                              );
                            })}
                        </div>
                      )}

                      {/* ملخص أيام العمل الحالية */}
                      <div className="mt-1.5 text-[10px] font-bold text-slate-500">
                        {currentDays.length > 0 ? (
                          <span>المواعيد المختارة: <strong className="text-red-700">{formattedDays}</strong></span>
                        ) : (
                          <span className="text-slate-400 font-bold">فاضية - لم يتم تحديد أيام بعد (اضغط على الأيام لتحديد مواعيد هذه الصالة)</span>
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

      {/* Confirmation modal for deleting empty branch */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetBranch)}
        title="تأكيد حذف الفرع"
        message={`هل أنت متأكد من رغبتك في حذف فرع "${deleteTargetBranch}"؟ لن يمكنك التراجع عن هذا الإجراء.`}
        confirmText="نعم، احذف الفرع"
        cancelText="تراجع"
        danger
        busy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetBranch(null)}
      />
    </>
  );
}
