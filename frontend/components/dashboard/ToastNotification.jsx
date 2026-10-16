"use client";
import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export default function ToastNotification({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div
      className={`fixed top-[66px] md:top-[80px] left-1/2 -translate-x-1/2 z-[70]
        w-[calc(100%-32px)] max-w-md
        flex cursor-pointer items-center justify-between gap-2.5
        rounded-2xl border px-4 py-3 text-xs font-bold
        shadow-xl backdrop-blur-sm animate-slide-up ${
        toast.type === "error"
          ? "border-rose-200 bg-rose-50/97 text-rose-800"
          : toast.type === "info"
          ? "border-sky-200 bg-sky-50/97 text-sky-800"
          : "border-emerald-200 bg-emerald-50/97 text-emerald-800"
      }`}
      onClick={onClose}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            toast.type === "error"
              ? "bg-rose-100 text-rose-600"
              : toast.type === "info"
              ? "bg-sky-100 text-sky-600"
              : "bg-emerald-100 text-emerald-600"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4" />
          ) : toast.type === "info" ? (
            <Info className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </span>
        <span className="font-extrabold min-w-0 leading-snug">{toast.message}</span>
      </div>
      <button
        type="button"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
        aria-label="إغلاق الإشعار"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
