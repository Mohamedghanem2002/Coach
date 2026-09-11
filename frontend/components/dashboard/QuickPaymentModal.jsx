"use client";
import { useState } from "react";
import { CreditCard, Check, X, AlertCircle } from "lucide-react";
import { toEnglishDigits } from "../../lib/dashboard-utils";

export default function QuickPaymentModal({
  player,
  paymentMonth,
  initialDetails,
  onClose,
  onSave,
}) {
  const [totalAmount, setTotalAmount] = useState(
    initialDetails?.totalAmount !== undefined ? String(initialDetails.totalAmount) : "100"
  );
  const [paidAmount, setPaidAmount] = useState(
    initialDetails?.paidAmount !== undefined ? String(initialDetails.paidAmount) : "0"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const numTotal = Math.max(0, Number(toEnglishDigits(totalAmount)) || 0);
  const numPaid = Math.max(0, Number(toEnglishDigits(paidAmount)) || 0);
  const numRemaining = Math.max(0, numTotal - numPaid);

  function handleSetFull() {
    setPaidAmount(String(numTotal));
  }

  function handleSetHalf() {
    setPaidAmount(String(Math.round(numTotal / 2)));
  }

  function handleSetZero() {
    setPaidAmount("0");
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    if (numTotal < 0 || numPaid < 0) {
      setError("يرجى إدخال مبالغ صحيحة.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const status =
        numPaid >= numTotal && numTotal > 0
          ? "paid"
          : numPaid > 0
          ? "partially_paid"
          : "unpaid";

      await onSave({
        totalAmount: numTotal,
        paidAmount: numPaid,
        remainingAmount: numRemaining,
        paymentStatus: status,
        paymentMonth,
      });
      onClose();
    } catch (err) {
      setError("تعذر حفظ بيانات الدفع. حاول مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in-scale"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col overflow-hidden animate-bottom-sheet sm:animate-fade-in-scale">
        {/* مقبض سحب الموبايل */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" />

        {/* ترويسة النافذة */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-xs">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                تسجيل وتحصيل اشتراك
              </p>
              <h2 className="font-cairo text-sm sm:text-base font-black text-slate-900 truncate max-w-[220px]">
                {player?.name}
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* المحتوى */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* شهر الاشتراك */}
          <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
            <span className="text-xs font-bold text-slate-500">شهر الاشتراك:</span>
            <span className="text-xs font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200/60 shadow-2xs">
              {paymentMonth}
            </span>
          </div>

          {/* قيمة الاشتراك الإجمالية */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
              قيمة الاشتراك المطلوب (ج.م)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={totalAmount}
              onChange={(e) => setTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
              placeholder="100"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              required
            />
          </div>

          {/* المبلغ المدفوع مع الأزرار السريعة */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-extrabold text-slate-700">
                المبلغ المدفوع حالياً (ج.م)
              </label>
              <span className="text-[11px] font-bold text-slate-400">
                خيارات سريعة:
              </span>
            </div>

            <input
              type="text"
              inputMode="numeric"
              value={paidAmount}
              onChange={(e) => setPaidAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-100"
            />

            {/* أزرار النسب السريعة */}
            <div className="grid grid-cols-3 gap-1.5 mt-2">
              <button
                type="button"
                onClick={handleSetFull}
                className="h-9 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-xs font-black hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
              >
                كامل ({numTotal})
              </button>
              <button
                type="button"
                onClick={handleSetHalf}
                className="h-9 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 text-xs font-black hover:bg-amber-100 active:scale-95 transition cursor-pointer"
              >
                النصف ({Math.round(numTotal / 2)})
              </button>
              <button
                type="button"
                onClick={handleSetZero}
                className="h-9 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs font-black hover:bg-rose-100 active:scale-95 transition cursor-pointer"
              >
                لم يدفع (0)
              </button>
            </div>
          </div>

          {/* بطاقة الحساب الحي للمتبقي */}
          <div
            className={`rounded-2xl border p-3.5 transition-all duration-200 ${
              numPaid >= numTotal && numTotal > 0
                ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                : numPaid > 0
                ? "border-amber-200 bg-amber-50/80 text-amber-900"
                : "border-rose-200 bg-rose-50/80 text-rose-900"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span>المبلغ المدفوع:</span>
              <span className="font-black text-sm">{numPaid} ج.م</span>
            </div>
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span>المبلغ المتبقي:</span>
              <span
                className={`font-black text-sm ${
                  numRemaining > 0 ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {numRemaining} ج.م
              </span>
            </div>

            {/* شارة الحالة النهائية */}
            <div className="pt-2 border-t border-current/10 flex items-center justify-between">
              <span className="text-[11px] font-bold opacity-80">الحالة الناتجة:</span>
              <span className="text-xs font-black">
                {numPaid >= numTotal && numTotal > 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> مدفوع بالكامل
                  </span>
                ) : numPaid > 0 ? (
                  <span className="text-amber-800 font-black">
                    دفع {numPaid} • باقي {numRemaining}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-700">
                    <X className="h-3.5 w-3.5" strokeWidth={3} /> لم يدفع (باقي {numTotal})
                  </span>
                )}
              </span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* زر الحفظ */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-cairo text-sm font-black text-white shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>جاري الحفظ...</span>
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  <span>حفظ بيانات الاشتراك</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
