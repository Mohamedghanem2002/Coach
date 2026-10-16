"use client";
import React from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";

export default function RestoreProgressModal({ restoreProgressModal }) {
  if (!restoreProgressModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-backdrop"
      dir="rtl"
    >
      <div className="w-full max-w-sm rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl text-center space-y-4 animate-scale-up">
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
          {restoreProgressModal.status === "success" ? (
            <CheckCircle2 className="h-7 w-7 text-emerald-600 animate-bounce" />
          ) : (
            <RotateCcw className="h-7 w-7 animate-spin text-emerald-600" />
          )}
        </div>

        <div>
          <h3 className="font-cairo text-sm font-black text-slate-900">
            {restoreProgressModal.status === "success"
              ? "تمت الاستعادة بنجاح!"
              : "جارٍ استعادة النسخة الاحتياطية..."}
          </h3>
          <p className="text-xs font-bold text-emerald-700 mt-1">
            {restoreProgressModal.stepText}
          </p>
          {restoreProgressModal.subText && (
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              {restoreProgressModal.subText}
            </p>
          )}
          {restoreProgressModal.fileName && (
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-600">
              <span className="truncate max-w-[170px]">{restoreProgressModal.fileName}</span>
              <span>•</span>
              <span>{restoreProgressModal.fileSize}</span>
            </div>
          )}
        </div>

        {/* Animated Progress Bar */}
        {restoreProgressModal.status !== "success" ? (
          <div className="space-y-1.5 pt-1">
            <div className="h-2.5 w-full bg-emerald-100 rounded-full overflow-hidden p-0.5">
              <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full animate-pulse w-full" />
            </div>
            <div className="text-[10px] text-slate-400 font-semibold">
              يرجى الانتظار، جاري قراءة الملف وتحديث الأكاديمية...
            </div>
          </div>
        ) : (
          <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 py-1.5 px-3 rounded-xl border border-emerald-200">
            ✓ تم تحديث جميع القوائم واللاعبين بنجاح
          </div>
        )}
      </div>
    </div>
  );
}
