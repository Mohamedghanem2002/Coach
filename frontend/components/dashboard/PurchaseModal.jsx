"use client";
import { useState } from "react";
import {
  ShoppingBag,
  Check,
  X,
  AlertCircle,
  Tag,
  CreditCard,
  DollarSign,
  Calendar,
  FileText,
  Sparkles,
} from "lucide-react";
import { toEnglishDigits, localDate } from "../../lib/dashboard-utils";

const COMMON_PRESETS = [
  { label: "بدلة كاراتيه 🥋", title: "بدلة كاراتيه" },
  { label: "حزام كاراتيه 🎗️", title: "حزام كاراتيه" },
  { label: "قفازات وواقيات 🥊", title: "قفازات وواقيات كوميتيه" },
  { label: "واقي أسنان 🦷", title: "واقي أسنان" },
  { label: "واقي ساق 🦵", title: "واقي ساق ومشط قدم" },
  { label: "شنطة تدريب 🎒", title: "شنطة تدريب" },
  { label: "تيشرت الأكاديمية 👕", title: "تيشرت الأكاديمية" },
  { label: "اختبار حزام وشهادة 📜", title: "رسوم اختبار حزام وشهادة" },
];

export default function PurchaseModal({
  isOpen,
  mode = "add", // "add" | "edit" | "pay"
  player,
  initialData = null,
  onClose,
  onSave,
}) {
  const [title, setTitle] = useState(
    mode === "edit" || mode === "pay" ? initialData?.title || "" : ""
  );
  const [totalAmount, setTotalAmount] = useState(
    mode === "edit" || mode === "pay" ? String(initialData?.totalAmount ?? "") : ""
  );
  const [paidAmount, setPaidAmount] = useState(
    mode === "edit" || mode === "pay" ? String(initialData?.paidAmount ?? "0") : "0"
  );
  const [addPayment, setAddPayment] = useState(
    mode === "pay" ? String(initialData?.remainingAmount || "") : ""
  );
  const [date, setDate] = useState(
    mode === "edit" && initialData?.date ? initialData.date : localDate()
  );
  const [notes, setNotes] = useState(
    mode === "edit" || mode === "pay" ? initialData?.notes || "" : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  // Numeric calculations
  const numTotal = Math.max(0, Number(toEnglishDigits(totalAmount)) || 0);

  // In pay mode:
  const currentPaid = Number(initialData?.paidAmount) || 0;
  const currentRemaining = Math.max(0, (Number(initialData?.totalAmount) || 0) - currentPaid);
  const numAddPayment = Math.max(0, Number(toEnglishDigits(addPayment)) || 0);
  const newProjectedPaid = Math.min(numTotal, currentPaid + numAddPayment);
  const newProjectedRemaining = Math.max(0, numTotal - newProjectedPaid);

  // In add/edit mode:
  const numPaid = Math.min(numTotal, Math.max(0, Number(toEnglishDigits(paidAmount)) || 0));
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

  function handleSetFullRemaining() {
    setAddPayment(String(currentRemaining));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setError("");

    if (mode !== "pay" && !title.trim()) {
      setError("يرجى إدخال اسم السلعة أو الغرض.");
      return;
    }

    if (numTotal <= 0) {
      setError("يرجى إدخال سعر السلعة (المبلغ المطلوب).");
      return;
    }

    if (mode === "pay" && numAddPayment <= 0) {
      setError("يرجى إدخال مبلغ الدفعة المسددة.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "add") {
        await onSave({
          purchaseAction: "add",
          title: title.trim(),
          totalAmount: numTotal,
          paidAmount: numPaid,
          date,
          notes: notes.trim(),
        });
      } else if (mode === "edit") {
        await onSave({
          purchaseAction: "update",
          purchaseId: initialData?.id,
          title: title.trim(),
          totalAmount: numTotal,
          paidAmount: numPaid,
          date,
          notes: notes.trim(),
        });
      } else if (mode === "pay") {
        await onSave({
          purchaseAction: "update",
          purchaseId: initialData?.id,
          addAmount: numAddPayment,
        });
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in-scale overflow-x-hidden max-w-full"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="relative w-full max-w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-bottom-sheet sm:animate-fade-in-scale">
        {/* Mobile drag handle */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-xs">
              {mode === "pay" ? (
                <CreditCard className="h-5 w-5" />
              ) : (
                <ShoppingBag className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                {mode === "add"
                  ? "إضافة مشتريات / أدوات جديدة"
                  : mode === "edit"
                  ? "تعديل بيانات السلعة"
                  : "تسجيل دفعة على سلعة"}
              </p>
              <h2 className="font-cairo text-sm sm:text-base font-black text-slate-900 truncate max-w-[240px]">
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

        {/* Modal Content Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Quick Presets in Add Mode */}
          {mode === "add" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span>أصناف شائعة سريعة:</span>
                </label>
                <span className="text-[10px] font-bold text-slate-400">
                  انقر للاختيار التلقائي
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_PRESETS.map((preset) => (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => {
                      setTitle(preset.title);
                      setError("");
                    }}
                    className={`rounded-xl border px-2.5 py-1 text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                      title === preset.title
                        ? "border-red-500 bg-red-50 text-red-700 shadow-2xs"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mode: PAY */}
          {mode === "pay" ? (
            <div className="space-y-3.5">
              {/* Card info of what is being paid */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">اسم السلعة:</span>
                  <span className="text-xs font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200/70 shadow-2xs">
                    {initialData?.title}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400">المطلوب</span>
                    <strong className="text-xs font-black text-slate-800">
                      {initialData?.totalAmount} ج.م
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-600">المدفوع سابقاً</span>
                    <strong className="text-xs font-black text-emerald-700">
                      {currentPaid} ج.م
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-rose-600">المتبقي حالياً</span>
                    <strong className="text-xs font-black text-rose-700">
                      {currentRemaining} ج.م
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700">
                    مبلغ الدفعة المسددة الآن (ج.م):
                  </label>
                  <button
                    type="button"
                    onClick={handleSetFullRemaining}
                    className="text-[11px] font-black text-emerald-700 hover:underline cursor-pointer"
                  >
                    سداد كامل المتبقي ({currentRemaining} ج.م)
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={addPayment}
                  onChange={(e) =>
                    setAddPayment(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                  }
                  placeholder={`أقصى مبلغ: ${currentRemaining}`}
                  className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  required
                />
              </div>

              {/* Projected outcome */}
              <div
                className={`rounded-2xl border p-3.5 text-xs font-bold transition-all ${
                  newProjectedRemaining === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span>إجمالي المدفوع الجديد:</span>
                  <span className="font-black text-sm">{newProjectedPaid} ج.م</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>المتبقي بعد هذه الدفعة:</span>
                  <span
                    className={`font-black text-sm ${
                      newProjectedRemaining > 0 ? "text-rose-700" : "text-emerald-700"
                    }`}
                  >
                    {newProjectedRemaining} ج.م
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-current/10 flex items-center justify-between">
                  <span className="text-[11px] opacity-80">الحالة بعد الدفعة:</span>
                  <span className="font-black">
                    {newProjectedRemaining === 0 ? (
                      <span className="text-emerald-700 inline-flex items-center gap-1">
                        <Check className="h-3.5 w-3.5 stroke-[3]" /> سداد كامل ✓
                      </span>
                    ) : (
                      <span className="text-amber-800">
                        دفع جزئي (باقي {newProjectedRemaining} ج.م)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Mode: ADD or EDIT */
            <>
              {/* Item Title */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  اسم السلعة أو الغرض *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: بدلة كاراتيه مقاس 140، حزام برتقالي..."
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 pr-9 pl-3 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    required
                  />
                  <Tag className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              {/* Total Cost & Paid Amount Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Total Cost */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    سعر السلعة / المطلوب (ج.م) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={totalAmount}
                    onChange={(e) =>
                      setTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                    }
                    placeholder="650"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    required
                  />
                </div>

                {/* Paid Amount */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-extrabold text-slate-700">
                      المدفوع حالياً (ج.م)
                    </label>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={paidAmount}
                    onChange={(e) =>
                      setPaidAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                    }
                    placeholder="0"
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  />
                </div>
              </div>

              {/* Quick Ratio Buttons */}
              {numTotal > 0 && (
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={handleSetFull}
                    className="h-9 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs font-black hover:bg-emerald-100 active-press transition cursor-pointer touch-manipulation"
                  >
                    سداد كامل ({numTotal})
                  </button>
                  <button
                    type="button"
                    onClick={handleSetHalf}
                    className="h-9 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-800 text-xs font-black hover:bg-amber-100 active-press transition cursor-pointer touch-manipulation"
                  >
                    النصف ({Math.round(numTotal / 2)})
                  </button>
                  <button
                    type="button"
                    onClick={handleSetZero}
                    className="h-9 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs font-black hover:bg-rose-100 active-press transition cursor-pointer touch-manipulation"
                  >
                    لم يدفع (0)
                  </button>
                </div>
              )}

              {/* Live Balance Card */}
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
                  <span>المبلغ المطلوب:</span>
                  <span className="font-black text-sm">{numTotal} ج.م</span>
                </div>
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

                <div className="pt-2 border-t border-current/10 flex items-center justify-between">
                  <span className="text-[11px] font-bold opacity-80">الحالة الناتجة:</span>
                  <span className="text-xs font-black">
                    {numPaid >= numTotal && numTotal > 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Check className="h-3.5 w-3.5" strokeWidth={3} /> مدفوع بالكامل
                      </span>
                    ) : numPaid > 0 ? (
                      <span className="text-amber-800 font-black">
                        دفع {numPaid} • باقي {numRemaining} ج.م
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700">
                        <X className="h-3.5 w-3.5" strokeWidth={3} /> غير مدفوع / آجل (باقي {numTotal} ج.م)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Date */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    تاريخ الشراء / العملية
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    ملاحظات (المقاس / تفاصيل)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: مقاس 150، تم التسليم..."
                    className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white"
                  />
                </div>
              </div>
            </>
          )}

          {/* Error notice */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 font-cairo text-sm font-black text-white shadow-md shadow-red-500/20 hover:brightness-110 active:scale-98 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 touch-manipulation"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>جاري الحفظ...</span>
                </span>
              ) : (
                <>
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                  <span>
                    {mode === "add"
                      ? "إضافة السلعة للبروفايل"
                      : mode === "edit"
                      ? "حفظ التعديلات"
                      : "تأكيد تسجيل الدفعة"}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
