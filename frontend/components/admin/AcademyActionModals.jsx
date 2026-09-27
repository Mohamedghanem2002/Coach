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
 * Modal to extend subscription duration with presets (+30, +90, +180, +365 days)
 * or a custom expiration date.
 */
export function ExtendSubscriptionModal({ isOpen, onClose, onConfirm, academy, isBusy }) {
  const [selectedDays, setSelectedDays] = useState(30);
  const [customDate, setCustomDate] = useState("");
  const [useCustomDate, setUseCustomDate] = useState(false);

  if (!isOpen || !academy) return null;

  // Calculate projected new expiration date
  const now = new Date();
  const baseDate =
    academy.subscriptionExpiresAt && new Date(academy.subscriptionExpiresAt).getTime() > now.getTime()
      ? new Date(academy.subscriptionExpiresAt)
      : now;

  let projectedDate = new Date(baseDate.getTime() + selectedDays * 24 * 60 * 60 * 1000);
  if (useCustomDate && customDate) {
    const parsed = new Date(customDate);
    if (!isNaN(parsed.getTime())) projectedDate = parsed;
  }

  const formattedProjected = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(projectedDate);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (useCustomDate) {
      if (!customDate) return;
      onConfirm({ customDate });
    } else {
      onConfirm({ days: selectedDays });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl animate-scale-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isBusy}
          className="absolute top-5 left-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              تمديد اشتراك الأكاديمية
            </h3>
            <p className="text-xs font-bold text-slate-500">
              الأكاديمية: <span className="text-indigo-600 font-black">{academy.academyName}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-black text-slate-700 mb-2">
              اختر مدة التمديد السريعة:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { days: 30, label: "30 يوماً", badge: "شهر" },
                { days: 90, label: "90 يوماً", badge: "3 أشهر" },
                { days: 180, label: "180 يوماً", badge: "6 أشهر" },
                { days: 365, label: "365 يوماً", badge: "سنة كاملة" },
              ].map((opt) => (
                <button
                  key={opt.days}
                  type="button"
                  onClick={() => {
                    setSelectedDays(opt.days);
                    setUseCustomDate(false);
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition cursor-pointer ${
                    !useCustomDate && selectedDays === opt.days
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-800"
                  }`}
                >
                  <span className="text-xs font-black">{opt.label}</span>
                  <span
                    className={`text-[10px] font-bold mt-0.5 ${
                      !useCustomDate && selectedDays === opt.days ? "text-indigo-100" : "text-slate-400"
                    }`}
                  >
                    {opt.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Or Custom Date */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700">
                أو تحديد تاريخ انتهاء مخصص:
              </label>
              <button
                type="button"
                onClick={() => setUseCustomDate(!useCustomDate)}
                className="text-[11px] font-black text-indigo-600 hover:underline cursor-pointer"
              >
                {useCustomDate ? "الرجوع للباقات السريعة" : "تفعيل التاريخ المخصص"}
              </button>
            </div>

            {useCustomDate && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={now.toISOString().slice(0, 10)}
                required={useCustomDate}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 focus:bg-white"
              />
            )}
          </div>

          {/* Projected Result Card */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="block text-[11px] font-bold text-emerald-800">
                  تاريخ الانتهاء الجديد المتوقع:
                </span>
                <strong className="text-sm font-black text-emerald-950">
                  {formattedProjected}
                </strong>
              </div>
            </div>
            <span className="rounded-full bg-emerald-200/80 px-2.5 py-0.5 text-[10px] font-black text-emerald-900">
              تفعيل فوري ✓
            </span>
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
                  <span>جارٍ التمديد...</span>
                </>
              ) : (
                <span>تأكيد تمديد الاشتراك</span>
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
