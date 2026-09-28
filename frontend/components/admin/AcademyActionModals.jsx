"use client";
import React, { useState } from "react";
import {
  ShieldAlert,
  Calendar,
  CheckCircle2,
  X,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
  Trash2,
  Users,
  Building2,
  Info,
} from "lucide-react";

/**
 * Confirmation dialog before suspending an academy.
 * Explicitly assures the administrator that all player and academy data is preserved.
 */
export function SuspendModal({ isOpen, onClose, onConfirm, academy, isBusy }) {
  const [reason, setReason] = useState("");

  if (!isOpen || !academy) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason.trim() || "تم تعليق الحساب بقرار من إدارة المنصة");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-lg rounded-3xl border border-red-200 bg-white p-6 sm:p-8 shadow-2xl shadow-red-950/20 animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              تعليق خدمة الأكاديمية
            </h3>
            <p className="text-xs font-bold text-slate-500">
              الأكاديمية: <span className="text-red-600 font-black">{academy.academyName}</span>
            </p>
          </div>
        </div>

        {/* Data preservation assurance banner */}
        <div className="p-3.5 mb-5 rounded-2xl border border-amber-200 bg-amber-50/70 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs font-bold text-amber-900 leading-relaxed">
            <strong>تأكيد سلامة البيانات:</strong> هذا الإجراء سيمنع مستخدمي الأكاديمية من الوصول إلى النظام مؤقتاً، ولكن <u>لن يتم حذف أي بيانات أو لاعبين نهائياً</u> وسيتم استعادتها فور إعادة التفعيل.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              سبب التعليق (سيظهر لمالك الأكاديمية على شاشته فوراً عند محاولة الدخول):
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="اكتب هنا سبب إيقاف الحساب الذي سيظهر للكابتن..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
              required
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[10px] font-bold text-slate-400 self-center">عبارات سريعة:</span>
              {[
                "يرجى سداد الاشتراك الشهري لتفعيل الحساب",
                "تم إيقاف الحساب مؤقتاً لمراجعة الإدارة",
                "انتهت فترة الصلاحية المحددة للاشتراك",
                "يرجى التواصل مع الإدارة لاستكمال البيانات",
              ].map((msg) => (
                <button
                  key={msg}
                  type="button"
                  onClick={() => setReason(msg)}
                  className="text-[10px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black shadow-md shadow-red-600/20 transition cursor-pointer"
            >
              {isBusy ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ التعليق...</span>
                </>
              ) : (
                <span>تأكيد تعليق الأكاديمية</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Modal to set / extend subscription duration.
 * Accurately supports:
 * 1. "حساب الصلاحية من تاريخ الدخول (الموصى به)" -> Exact calendar months from entry date (e.g. Sept 6 + 1 month = Oct 6).
 * 2. "تمديد إضافي على الصلاحية الحالية" -> Additive extension on top of current expiry.
 * 3. "تحديد تاريخ انتهاء مخصص" -> Specific calendar date.
 */
export function ExtendSubscriptionModal({ isOpen, onClose, onConfirm, academy, isBusy }) {
  // Mode: "from_entry" (default) | "additive" | "custom_date"
  const [calcMode, setCalcMode] = useState("from_entry");
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [customMonths, setCustomMonths] = useState("");
  const [customDate, setCustomDate] = useState("");

  if (!isOpen || !academy) return null;

  const now = new Date();
  const entryDate = academy.subscriptionStartedAt
    ? new Date(academy.subscriptionStartedAt)
    : academy.createdAt
    ? new Date(academy.createdAt)
    : now;

  const formattedEntryDate = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(entryDate);

  const formattedCurrentExpiry = academy.subscriptionExpiresAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(academy.subscriptionExpiresAt))
    : "غير محدد";

  // Calculate projected new expiration date
  let projectedDate = new Date();
  const effectiveMonths = customMonths ? Math.max(1, parseInt(customMonths, 10) || 1) : selectedMonths;

  if (calcMode === "custom_date") {
    if (customDate) {
      const parsed = new Date(customDate);
      if (!isNaN(parsed.getTime())) projectedDate = parsed;
    }
  } else if (calcMode === "from_entry") {
    projectedDate = new Date(entryDate);
    if (effectiveMonths === 12) {
      const targetDay = projectedDate.getDate();
      projectedDate.setFullYear(projectedDate.getFullYear() + 1);
      if (projectedDate.getDate() !== targetDay) projectedDate.setDate(0);
    } else {
      const targetDay = projectedDate.getDate();
      projectedDate.setMonth(projectedDate.getMonth() + effectiveMonths);
      if (projectedDate.getDate() !== targetDay) projectedDate.setDate(0);
    }
  } else {
    // Additive from current expiry or now
    const curExp = academy.subscriptionExpiresAt ? new Date(academy.subscriptionExpiresAt) : null;
    const base = curExp && !isNaN(curExp.getTime()) && curExp.getTime() > now.getTime() ? curExp : now;
    projectedDate = new Date(base);
    const targetDay = projectedDate.getDate();
    projectedDate.setMonth(projectedDate.getMonth() + effectiveMonths);
    if (projectedDate.getDate() !== targetDay) projectedDate.setDate(0);
  }

  const formattedProjected = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(projectedDate);

  const diffMs = projectedDate.getTime() - now.getTime();
  const projectedDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isProjectedPast = diffMs < 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (calcMode === "custom_date") {
      if (!customDate) return;
      onConfirm({
        mode: "custom_date",
        calculationBase: "custom_date",
        customDate,
      });
    } else {
      onConfirm({
        mode: calcMode,
        calculationBase: calcMode,
        months: effectiveMonths,
        days: calcMode === "additive" ? effectiveMonths * 30 : null,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              تحديد وصلاحية اشتراك المنصة
            </h3>
            <p className="text-xs font-bold text-slate-500">
              الكابتن: <span className="text-indigo-600 font-black">{academy.name || academy.academyName}</span>
              {academy.academyName && academy.name !== academy.academyName && (
                <span className="text-slate-400 mr-1.5">({academy.academyName})</span>
              )}
            </p>
          </div>
        </div>

        {/* Account Entry Date & Current Status Banner */}
        <div className="p-3.5 mb-5 rounded-2xl border border-indigo-100 bg-indigo-50/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="text-xs font-bold text-slate-700">
              تاريخ الدخول / التسجيل:
            </span>
            <span className="text-xs font-black text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
              {formattedEntryDate}
            </span>
          </div>

          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
            <span>الانتهاء الحالي:</span>
            <span className="font-black text-slate-700">{formattedCurrentExpiry}</span>
            {academy.daysRemaining !== null && academy.daysRemaining !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
                academy.daysRemaining > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                {academy.daysRemaining > 0 ? `${academy.daysRemaining} يوم متبقي` : "منتهي"}
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Calculation Mode Tabs */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">
              طريقة احتساب الصلاحية:
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setCalcMode("from_entry");
                  setCustomMonths("");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  calcMode === "from_entry"
                    ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>من تاريخ الدخول</span>
                <span className="text-[9px] font-bold text-emerald-600">الموصى به ★</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCalcMode("additive");
                  setCustomMonths("");
                }}
                className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  calcMode === "additive"
                    ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>تمديد إضافي</span>
                <span className="text-[9px] font-bold text-slate-400">على الانتهاء الحالي</span>
              </button>

              <button
                type="button"
                onClick={() => setCalcMode("custom_date")}
                className={`py-2 px-2 rounded-xl text-xs font-black transition cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
                  calcMode === "custom_date"
                    ? "bg-white text-indigo-600 shadow-xs border border-indigo-100"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>تاريخ محدد</span>
                <span className="text-[9px] font-bold text-slate-400">اختيار من التقويم</span>
              </button>
            </div>
          </div>

          {/* Preset Buttons for Entry Date / Additive */}
          {calcMode !== "custom_date" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-black text-slate-700">
                  {calcMode === "from_entry"
                    ? "اختر فترة صلاحية الاشتراك من تاريخ الدخول:"
                    : "اختر مدة التمديد الإضافي:"}
                </label>
                {customMonths && (
                  <button
                    type="button"
                    onClick={() => setCustomMonths("")}
                    className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    الرجوع للباقات
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  {
                    months: 1,
                    label: "شهر واحد",
                    badge: calcMode === "from_entry" ? "شهر من الدخول" : "+ شهر إضافي",
                  },
                  {
                    months: 3,
                    label: "3 أشهر",
                    badge: calcMode === "from_entry" ? "ربع سنوي" : "+ 3 أشهر",
                  },
                  {
                    months: 6,
                    label: "6 أشهر",
                    badge: calcMode === "from_entry" ? "نصف سنوي" : "+ 6 أشهر",
                  },
                  {
                    months: 12,
                    label: "سنة كاملة",
                    badge: calcMode === "from_entry" ? "12 شهراً" : "+ سنة كاملة",
                  },
                ].map((opt) => {
                  const isSelected = !customMonths && selectedMonths === opt.months;
                  return (
                    <button
                      key={opt.months}
                      type="button"
                      onClick={() => {
                        setSelectedMonths(opt.months);
                        setCustomMonths("");
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800"
                      }`}
                    >
                      <span className="text-xs font-black">{opt.label}</span>
                      <span
                        className={`text-[10px] font-bold mt-0.5 ${
                          isSelected ? "text-indigo-100" : "text-slate-400"
                        }`}
                      >
                        {opt.badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Number of Months Option */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 shrink-0">أو عدد أشهر مخصص:</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="مثال: 2 أو 4 أو 5"
                  value={customMonths}
                  onChange={(e) => setCustomMonths(e.target.value)}
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white text-center"
                />
                <span className="text-xs font-bold text-slate-500">شهر</span>
              </div>
            </div>
          )}

          {/* Custom Date Input */}
          {calcMode === "custom_date" && (
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">
                حدد تاريخ الانتهاء الدقيق من التقويم:
              </label>
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={now.toISOString().slice(0, 10)}
                required={calcMode === "custom_date"}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 focus:bg-white cursor-pointer"
              />
            </div>
          )}

          {/* Dynamic Real-Time Projected Result Card */}
          <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition ${
            isProjectedPast
              ? "border-amber-200 bg-amber-50/80"
              : "border-emerald-200 bg-emerald-50/80"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Calendar className={`w-5 h-5 shrink-0 ${isProjectedPast ? "text-amber-600" : "text-emerald-600"}`} />
                <div>
                  <span className={`block text-[11px] font-bold ${isProjectedPast ? "text-amber-800" : "text-emerald-800"}`}>
                    تاريخ الانتهاء الجديد المحسوب:
                  </span>
                  <strong className={`text-base font-black ${isProjectedPast ? "text-amber-950" : "text-emerald-950"}`}>
                    {formattedProjected}
                  </strong>
                </div>
              </div>

              <div className="text-left">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-black ${
                  isProjectedPast
                    ? "bg-amber-200 text-amber-900"
                    : "bg-emerald-200 text-emerald-950"
                }`}>
                  {isProjectedPast ? "منتهي الصلاحية ⛔" : `${projectedDaysRemaining} يوم متبقي ✓`}
                </span>
              </div>
            </div>

            {/* Clear Formula Explanation */}
            <div className="text-[11px] font-bold pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-slate-600">
              <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>
                {calcMode === "from_entry" ? (
                  <>
                    محسوبة بدقة من تاريخ الدخول (<strong>{formattedEntryDate}</strong>) +{" "}
                    <strong>{effectiveMonths} شهر</strong> = <strong>{formattedProjected}</strong>
                  </>
                ) : calcMode === "additive" ? (
                  <>
                    تمديد إضافي قدره <strong>{effectiveMonths} شهر</strong> يُضاف على تاريخ الصلاحية
                  </>
                ) : (
                  <>
                    تاريخ انتهاء مخصص محدد يدوياً بالتقويم
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              {isBusy ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <span>تأكيد وحفظ الصلاحية</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Confirmation dialog to reactivate an academy.
 */
export function ReactivateModal({ isOpen, onClose, onConfirm, academy, isBusy }) {
  if (!isOpen || !academy) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-md rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-2xl animate-scale-up text-center">
        <div className="mx-auto w-14 h-14 rounded-3xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-4 shadow-inner">
          <RotateCcw className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-black text-slate-900 mb-2">
          إعادة تفعيل الأكاديمية
        </h3>

        <p className="text-xs sm:text-sm font-bold text-slate-600 mb-6 leading-relaxed">
          هل تريد استئناف خدمة أكاديمية{" "}
          <span className="text-emerald-700 font-black">&ldquo;{academy.academyName}&rdquo;</span>؟
          <br />
          سيتمكن الكابتن واللاعبون من تسجيل الدخول واستخدام النظام فوراً بكافة بياناتهم المحفوظة.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition cursor-pointer"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => onConfirm()}
            disabled={isBusy}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            {isBusy ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جارٍ التفعيل...</span>
              </>
            ) : (
              <span>تأكيد التفعيل واستئناف الخدمة</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Permanent Academy Deletion Modal (Cascade Delete)
 */
export function DeleteAcademyModal({ isOpen, onClose, onConfirm, academy, isBusy }) {
  const [confirmInput, setConfirmInput] = useState("");

  if (!isOpen || !academy) return null;

  const targetName = academy.academyName || academy.name || "الكابتن";
  const normalized = confirmInput.trim().toUpperCase();
  const isConfirmed = normalized === "DELETE" || normalized === "حذف";

  const handleClose = () => {
    setConfirmInput("");
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isConfirmed) return;
    setConfirmInput("");
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-lg rounded-3xl border border-rose-300 bg-white p-6 sm:p-8 shadow-2xl shadow-black/40 animate-scale-up text-right">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isBusy}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Badge */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-rose-700">
              حذف الحساب نهائياً ⚠️
            </h3>
            <p className="text-xs font-bold text-slate-500">
              {targetName} &bull; {academy.email}
            </p>
          </div>
        </div>

        {/* Danger Warning Callout */}
        <div className="p-4 mb-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-900 text-xs font-bold leading-relaxed space-y-2">
          <div className="flex items-center gap-1.5 font-black text-rose-700 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>تحذير شديد الأهمية (حذف كلي لا يمكن التراجع عنه):</span>
          </div>
          <p>
            سيتم مسح حساب الكابتن بالكامل من قاعدة البيانات وكافة البيانات التابعة له فوراً:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 pr-1 font-semibold">
            <li>حساب الكابتن وبيانات الدخول كاملة.</li>
            <li>
              جميع اللاعبين المسجلين ({academy.playersCount ?? 0} لاعب) وسجلاتهم.
            </li>
            <li>
              جميع الصالات وفروع التدريب ({academy.branchesCount ?? academy.hallsCount ?? 0} صالة).
            </li>
            <li>جميع الفعاليات وحساباتها المالية ({academy.eventsCount ?? 0} فعالية).</li>
            <li>النسخ السحابية وسجلات التدقيق المرتبطة.</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-700 mb-1.5">
              للتأكيد، اكتب كلمة <strong className="text-rose-600 font-mono">DELETE</strong> أو <strong className="text-rose-600">&ldquo;حذف&rdquo;</strong> في المربع أدناه:
            </label>
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              placeholder="اكتب DELETE أو حذف للتأكيد"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-center text-sm font-black text-slate-900 outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100 transition"
              autoFocus
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isBusy}
              className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition cursor-pointer"
            >
              إلغاء التراجع
            </button>
            <button
              type="submit"
              disabled={isBusy || !isConfirmed}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-black shadow-md shadow-rose-600/30 transition cursor-pointer"
            >
              {isBusy ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ الحذف الشامل من قاعدة البيانات...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>حذف الحساب بجميع بياناته نهائياً</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
