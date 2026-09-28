"use client";
import { AlertTriangle, X, Trash2, AlertCircle } from "lucide-react";

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

  const isDanger  = confirmVariant === "danger";
  const isWarning = confirmVariant === "warning";
  const isPrimary = confirmVariant === "primary";

  const accentColor = isDanger ? "#e11d48" : isWarning ? "#d97706" : "#0284c7";
  const iconBg      = isDanger ? "bg-rose-100 text-rose-600 ring-4 ring-rose-50"
                    : isWarning ? "bg-amber-100 text-amber-600 ring-4 ring-amber-50"
                    : "bg-sky-100 text-sky-600 ring-4 ring-sky-50";
  const confirmBtnClass = isDanger
    ? "bg-red-600 hover:bg-red-700 shadow-red-600/25"
    : isWarning
    ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
    : "bg-sky-600 hover:bg-sky-700 shadow-sky-600/25";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isBusy) onCancel();
      }}
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="dialog-panel dialog-panel-sm animate-fade-in-scale w-full">
        {/* Accent top */}
        <div className="dialog-accent-top" style={{ background: accentColor }} />

        {/* Close button */}
        <button
          type="button"
          disabled={isBusy}
          onClick={onCancel}
          className="dialog-close"
          aria-label="إغلاق"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-7 pt-7">
          {/* Icon + Title */}
          <div className="flex items-start gap-3.5 mb-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconBg}`}>
              {isDanger ? <Trash2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 id="confirm-dialog-title" className="text-base font-black text-slate-900 sm:text-lg">
                {title}
              </h3>
              <p className="mt-1.5 text-xs font-medium text-slate-600 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={isBusy}
              onClick={onCancel}
              className="btn btn-secondary btn-sm disabled:opacity-50 cursor-pointer"
            >
              {cancelText}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={onConfirm}
              className={`btn btn-sm text-white font-bold shadow-sm active-press disabled:opacity-60 cursor-pointer ${confirmBtnClass}`}
            >
              {isBusy ? (
                <>
                  <span className="btn-spinner" />
                  <span>جاري التنفيذ...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
