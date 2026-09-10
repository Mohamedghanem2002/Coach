"use client";
import { AlertTriangle, X } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "تأكيد الإجراء",
  message = "هل أنت متأكد من رغبتك في إتمام هذا الإجراء؟",
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  confirmVariant = "danger", // "danger" | "primary" | "warning"
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const isDanger = confirmVariant === "danger";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm animate-fade-in-scale"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isBusy) onCancel();
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl transition-all sm:p-7">
        {/* Accent top border */}
        <div
          className={`absolute top-0 left-0 right-0 h-1.5 ${
            isDanger
              ? "bg-gradient-to-r from-red-600 via-rose-500 to-amber-500"
              : "bg-gradient-to-r from-blue-600 to-indigo-600"
          }`}
        />

        {/* Close icon */}
        <button
          type="button"
          disabled={isBusy}
          onClick={onCancel}
          className="absolute top-4 left-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50 cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-3.5 mb-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              isDanger
                ? "bg-rose-100 text-rose-600 ring-4 ring-rose-50"
                : "bg-blue-100 text-blue-600 ring-4 ring-blue-50"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="font-cairo text-base font-black text-slate-900 sm:text-lg">
              {title}
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-600 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            disabled={isBusy}
            onClick={onCancel}
            className="min-h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            disabled={isBusy}
            onClick={onConfirm}
            className={`min-h-10 flex items-center justify-center gap-2 rounded-xl px-5 text-xs font-extrabold text-white shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer ${
              isDanger
                ? "bg-gradient-to-r from-red-600 to-rose-600 hover:brightness-110 shadow-red-500/20"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 shadow-blue-500/20"
            }`}
          >
            {isBusy ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>جاري التنفيذ...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
