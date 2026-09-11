"use client";
import { useState } from "react";
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Banknote,
  FileText,
} from "lucide-react";

export default function EventPaymentModal({
  isOpen,
  onClose,
  participant,
  eventTitle = "الفعالية",
  onSavePayment,
  isSubmitting = false,
}) {
  const initialTotal = Number(participant?.totalAmount ?? 100);
  const initialPaid = Number(participant?.paidAmount ?? 0);

  const [totalAmount, setTotalAmount] = useState(initialTotal);
  const [paidAmount, setPaidAmount] = useState(initialPaid);
  const [notes, setNotes] = useState(participant?.notes || "");

  if (!isOpen || !participant) return null;

  const numTotal = Math.max(0, Number(totalAmount) || 0);
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const remaining = Math.max(0, numTotal - numPaid);

  let statusBadge = {
    label: "لم يدفع بعد",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  };
  if (numPaid >= numTotal && numTotal > 0) {
    statusBadge = {
      label: "مدفوع بالكامل",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
    };
  } else if (numPaid > 0 && numPaid < numTotal) {
    statusBadge = {
      label: `دفع جزئي (باقي ${remaining} ج.م)`,
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    };
  }

  function handlePreset(ratio) {
    const calc = Math.round(numTotal * ratio);
    setPaidAmount(calc);
  }

  async function handleConfirm(e) {
    e.preventDefault();
    await onSavePayment({
      playerId: participant.playerId,
      paidAmount: numPaid,
      totalAmount: numTotal,
      notes: notes.trim(),
    });
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs transition-all duration-300"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden animate-bottom-sheet sm:animate-modal-pop max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-4 text-white shrink-0">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/40 sm:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 text-emerald-400 ring-1 ring-white/20">
                <CreditCard className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-cairo text-sm font-black leading-tight text-white">
                  سداد اشتراك الفعالية
                </h3>
                <p className="text-[11px] font-bold text-slate-300 truncate max-w-[200px]">
                  {participant.name} • {eventTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleConfirm} className="flex-1 overflow-y-auto p-5 space-y-4 touch-scroll">
          {/* Status summary pill */}
          <div className={`flex items-center justify-between p-3 rounded-2xl border ${statusBadge.color}`}>
            <div className="flex items-center gap-2 text-xs font-black">
              <statusBadge.icon className="h-4 w-4" />
              <span>{statusBadge.label}</span>
            </div>
            <span className="text-[11px] font-bold">
              المتبقي: <strong className="text-sm font-black">{remaining}</strong> ج.م
            </span>
          </div>

          {/* 3 Quick presets */}
          <div>
            <span className="block text-xs font-bold text-slate-600 mb-2">
              خيارات سريعة بنقرة واحدة:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handlePreset(1)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
              >
                <span className="text-xs font-black">سداد كامل</span>
                <span className="text-[10px] font-bold mt-0.5">{numTotal} ج.م</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreset(0.5)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100 active:scale-95 transition cursor-pointer"
              >
                <span className="text-xs font-black">دفع النصف</span>
                <span className="text-[10px] font-bold mt-0.5">{Math.round(numTotal * 0.5)} ج.م</span>
              </button>

              <button
                type="button"
                onClick={() => handlePreset(0)}
                className="flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
              >
                <span className="text-xs font-black">إلغاء السداد</span>
                <span className="text-[10px] font-bold mt-0.5">0 ج.م</span>
              </button>
            </div>
          </div>

          {/* Amount inputs */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رسوم الفعالية (ج.م)
              </label>
              <div className="relative">
                <Banknote className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-xs font-black text-slate-900 outline-none focus:bg-white focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                المبلغ المدفوع (ج.م)
              </label>
              <div className="relative">
                <Banknote className="absolute right-3 top-2.5 h-4 w-4 text-emerald-600" />
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-xs font-black text-emerald-700 outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Live Remaining Preview */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">المبلغ المتبقي على اللاعب:</span>
            <span className={`text-base font-black ${remaining > 0 ? "text-rose-600" : "text-emerald-600"}`}>
              {remaining.toLocaleString("ar-EG")} ج.م
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظة عن الدفع (اختياري)
            </label>
            <div className="relative">
              <FileText className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: تم دفع 50 كاش والباقي قبل الرحلة..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pr-9 pl-3 py-2 text-xs font-medium text-slate-800 outline-none focus:bg-white focus:border-red-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 sticky bottom-0 bg-white border-t border-slate-100 mt-4 flex items-center justify-end gap-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-10 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-xs font-black text-white shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-teal-700 active:scale-95 transition cursor-pointer"
            >
              {isSubmitting ? "جاري الحفظ..." : "حفظ الدفعة"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
