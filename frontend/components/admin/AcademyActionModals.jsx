"use client";
import React, { useState } from "react";
import {
  ShieldAlert,
  Calendar,
  CalendarDays,
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
  Check,
  ChevronDown,
  ChevronUp,
  Settings2,
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
 * Native Mobile App Experience (ستايل تطبيق هاتف ذكي):
 * 1. Bottom Sheet / Native Card form factor with top grab handle and rounded-[32px] squircles.
 * 2. Centered App Store style badge and clean typography.
 * 3. Native captain profile tile with avatar, joined date, and pulsing status badge.
 * 4. Apple-style in-app purchase plan rows with real-time calculated expiry dates.
 * 5. Native iOS segmented picker for presets vs custom calendar date.
 * 6. Live iOS widget result card showing confirmed expiry date and countdown.
 * 7. Prominent full-width native CTA button with tactile feedback.
 */
export function ExtendSubscriptionModal({ isOpen, onClose, onConfirm, academy, isBusy }) {
  const [tab, setTab] = useState("presets"); // "presets" | "custom"
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

  // Helper to compute projected date from entry date for standard cards
  const computeCardDate = (months, isLifetime = false) => {
    if (isLifetime || months >= 1200) {
      return "اشتراك دائم (بدون انتهاء) ♾️";
    }
    const d = new Date(entryDate);
    const targetDay = d.getDate();
    d.setMonth(d.getMonth() + months);
    if (d.getDate() !== targetDay) d.setDate(0);
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  };

  // Calculate projected new expiration date for selected state
  let projectedDate = new Date();
  const effectiveMonths = customMonths ? Math.max(1, parseInt(customMonths, 10) || 1) : selectedMonths;
  const isSelectedLifetime = calcMode === "from_entry" && !customMonths && effectiveMonths >= 1200;

  if (calcMode === "custom_date") {
    if (customDate) {
      const parsed = new Date(customDate);
      if (!isNaN(parsed.getTime())) projectedDate = parsed;
    }
  } else if (isSelectedLifetime) {
    projectedDate = new Date(now.getFullYear() + 100, 11, 31);
  } else if (calcMode === "from_entry") {
    projectedDate = new Date(entryDate);
    const targetDay = projectedDate.getDate();
    projectedDate.setMonth(projectedDate.getMonth() + effectiveMonths);
    if (projectedDate.getDate() !== targetDay) projectedDate.setDate(0);
  } else {
    // Additive from current expiry or now
    const curExp = academy.subscriptionExpiresAt ? new Date(academy.subscriptionExpiresAt) : null;
    const base = curExp && !isNaN(curExp.getTime()) && curExp.getTime() > now.getTime() ? curExp : now;
    projectedDate = new Date(base);
    const targetDay = projectedDate.getDate();
    projectedDate.setMonth(projectedDate.getMonth() + effectiveMonths);
    if (projectedDate.getDate() !== targetDay) projectedDate.setDate(0);
  }

  const formattedProjected = isSelectedLifetime
    ? "اشتراك دائم (مفتوح مدى الحياة ♾️)"
    : new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(projectedDate);

  const diffMs = projectedDate.getTime() - now.getTime();
  const projectedDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const isProjectedPast = !isSelectedLifetime && diffMs < 0;

  const presetPlans = [
    {
      months: 1,
      title: "شهر واحد",
      tag: "أساسي",
      tagColor: "bg-slate-100 text-slate-600 border border-slate-200/60",
      durationBadge: "30 يوم",
      planName: "standard",
    },
    {
      months: 3,
      title: "3 أشهر",
      tag: "الأكثر طلباً ⭐",
      tagColor: "bg-indigo-50 text-indigo-700 border border-indigo-200/80",
      durationBadge: "90 يوم",
      planName: "quarterly",
    },
    {
      months: 6,
      title: "6 أشهر",
      tag: "نصف سنوي",
      tagColor: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
      durationBadge: "180 يوم",
      planName: "semi-annual",
    },
    {
      months: 12,
      title: "سنة كاملة",
      tag: "أفضل قيمة 🏆",
      tagColor: "bg-amber-50 text-amber-800 border border-amber-200/80",
      durationBadge: "365 يوم",
      planName: "annual",
    },
    {
      months: 1200,
      isLifetime: true,
      title: "اشتراك مدى الحياة",
      tag: "دائم ومفتوح ♾️",
      tagColor: "bg-purple-100 text-purple-800 border border-purple-300 font-black",
      durationBadge: "مدى الحياة ♾️",
      planName: "lifetime",
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (calcMode === "custom_date") {
      if (!customDate) return;
      onConfirm({
        mode: "custom_date",
        calculationBase: "custom_date",
        customDate,
      });
    } else if (isSelectedLifetime) {
      onConfirm({
        mode: "lifetime",
        calculationBase: "lifetime",
        months: 1200,
        isLifetime: true,
        plan: "lifetime",
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

  const initialLetter = (academy.name || academy.academyName || "ك").trim().charAt(0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-md rounded-t-[32px] sm:rounded-[36px] border border-slate-150 bg-white p-5 sm:p-6 shadow-2xl animate-scale-up max-h-[92vh] flex flex-col overflow-hidden">
        {/* Native Top Drag Handle */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 shrink-0" />

        {/* Circular Dismiss Button */}
        <button
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-4 left-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 active:scale-90 transition cursor-pointer z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* App Header Badge & Title */}
        <div className="text-center mb-3.5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 text-white flex items-center justify-center mx-auto mb-2 shadow-md shadow-indigo-500/25">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight leading-none">
            صلاحية اشتراك الكابتن
          </h3>
          <p className="text-xs font-bold text-slate-400 mt-1">
            حدد باقة الاشتراك لتطبيقها ديناميكياً
          </p>
        </div>

        {/* Native Captain Profile Card */}
        <div className="mb-3.5 bg-slate-50/90 rounded-2xl p-3 border border-slate-200/70 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
              {initialLetter}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black text-slate-900 truncate">
                {academy.name || academy.academyName}
              </div>
              <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                <span>تاريخ التسجيل:</span>
                <strong className="text-slate-800">{formattedEntryDate}</strong>
              </div>
            </div>
          </div>

          <div className="text-left shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
              academy.daysRemaining > 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${academy.daysRemaining > 0 ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
              {academy.daysRemaining > 0 ? `${academy.daysRemaining} يوم متبقي` : "منتهي"}
            </span>
          </div>
        </div>

        {/* iOS Native Segmented Control */}
        <div className="p-1 bg-slate-100/90 rounded-2xl flex gap-1 mb-3 border border-slate-200/60 shrink-0">
          <button
            type="button"
            onClick={() => {
              setTab("presets");
              setCalcMode("from_entry");
              setCustomDate("");
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "presets"
                ? "bg-white text-indigo-600 shadow-xs font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>الباقات الموصى بها</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("custom");
              setCalcMode("custom_date");
            }}
            className={`flex-1 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === "custom"
                ? "bg-white text-indigo-600 shadow-xs font-black"
                : "text-slate-500 hover:text-slate-800 font-bold"
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>تاريخ مخصص</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Plan Choices */}
          <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-2">
            {tab === "presets" ? (
              presetPlans.map((plan) => {
                const isSelected = calcMode === "from_entry" && !customMonths && selectedMonths === plan.months;
                const expiryText = computeCardDate(plan.months);
                return (
                  <div
                    key={plan.months}
                    onClick={() => {
                      setCalcMode("from_entry");
                      setSelectedMonths(plan.months);
                      setCustomMonths("");
                      setCustomDate("");
                    }}
                    className={`group relative flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all duration-150 active:scale-[0.98] ${
                      isSelected
                        ? "border-indigo-600 bg-gradient-to-r from-indigo-50/90 to-violet-50/40 shadow-xs ring-2 ring-indigo-500/15"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Apple-style Radio Button */}
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "border-2 border-slate-300 text-transparent group-hover:border-slate-400"
                      }`}>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black ${isSelected ? "text-indigo-950" : "text-slate-800"}`}>
                            {plan.title}
                          </span>
                          <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${plan.tagColor}`}>
                            {plan.tag}
                          </span>
                        </div>
                        <div className="text-[11px] font-bold text-slate-500 mt-0.5">
                          ينتهي في: <span className={`font-black ${isSelected ? "text-indigo-900" : "text-slate-700"}`}>{expiryText}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}>
                        {plan.durationBadge}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5">
                    اختر تاريخ الانتهاء من التقويم:
                  </label>
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    min={now.toISOString().slice(0, 10)}
                    required={calcMode === "custom_date"}
                    className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-black text-slate-800 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                  />
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-600">أو عدد أشهر يدوي:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="2"
                      value={customMonths}
                      onChange={(e) => {
                        setCustomMonths(e.target.value);
                        setCalcMode("from_entry");
                      }}
                      className="w-20 rounded-xl border border-slate-300 bg-white px-2 py-1 text-xs font-black text-slate-800 text-center outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-600">شهر</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* iOS Widget Live Result Card */}
          <div className={`p-3 rounded-2xl border transition-all mt-3 shrink-0 flex items-center justify-between gap-2 ${
            isProjectedPast
              ? "border-amber-200 bg-amber-50/80 text-amber-950"
              : "border-emerald-200 bg-emerald-50/90 text-emerald-950"
          }`}>
            <div className="flex items-center gap-2 min-w-0">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isProjectedPast ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="truncate">
                <div className="text-[10px] font-bold text-slate-500">
                  تاريخ الانتهاء المعتمد:
                </div>
                <div className="text-xs font-black truncate">
                  {formattedProjected}
                </div>
              </div>
            </div>

            <div className="text-left shrink-0">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                isProjectedPast ? "bg-amber-200 text-amber-900" : "bg-emerald-200 text-emerald-950"
              }`}>
                {isProjectedPast ? "منتهي الصلاحية ⛔" : `متبقي ${projectedDaysRemaining} يوم ✓`}
              </span>
            </div>
          </div>

          {/* Full-Width Native Action Bar */}
          <div className="pt-3 space-y-1.5 shrink-0">
            <button
              type="submit"
              disabled={isBusy}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 active:scale-[0.98] text-white text-xs font-black shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isBusy ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جارٍ الحفظ...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تأكيد وتفعيل الصلاحية الآن</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="w-full py-1.5 text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              إلغاء الأمر
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
