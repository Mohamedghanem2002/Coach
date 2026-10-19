"use client";
import React from "react";
import { AlertTriangle, Clock, CheckCircle2, X, ExternalLink, ShieldCheck, Zap } from "lucide-react";

import { WhatsAppIcon } from "../common/SocialIcons";


export default function SubscriptionExpiringModal({
  isOpen,
  onClose,
  alertInfo,
  captainName = "كابتن",
  academyName = "CoachMaster",
}) {
  if (!isOpen || !alertInfo) return null;

  const days = alertInfo.daysRemaining;
  const isUrgent = days <= 1;

  const daysText =
    days === 0
      ? "اليوم"
      : days === 1
      ? "يوم واحد"
      : days === 2
      ? "يومان (2)"
      : `${days} أيام`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      dir="rtl"
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-scale-up"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header Card */}
        <div
          className={`relative p-5 sm:p-6 text-white text-center ${
            isUrgent
              ? "bg-gradient-to-br from-rose-600 via-red-600 to-rose-700"
              : "bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 left-4 h-8 w-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner">
            <AlertTriangle className="h-7 w-7 text-white animate-pulse" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-xs font-black backdrop-blur-xs mb-2">
            ⚠️ تنبيه اشتراك الأكاديمية
          </span>

          <h2 className="font-cairo text-lg sm:text-xl font-black leading-tight">
            متبقي {daysText} على انتهاء اشتراكك!
          </h2>

          <p className="mt-1 text-xs sm:text-sm text-white/90 font-medium">
            أهلاً {captainName} ({academyName})
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* Detailed Alert Message */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
            <p>
              ينتهي اشتراك حسابك في منصة <strong>CoachMaster</strong> بتاريخ{" "}
              <span className="font-black text-red-600 font-mono">
                {alertInfo.expiresAtFormatted}
              </span>
              . لتجنب توقف إدارة حضور اللاعبين، والاشتراكات الشهرية، والتقارير الذكية، نرجو التجديد قبل انتهاء المدة المتبقية.
            </p>
          </div>

          {/* Quick Perks / Assurance List */}
          <div className="space-y-2 rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>بيانات جميع لاعبيك وصالاتك محفوظة بأمان تام في السحابة.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>التجديد الفوري يضمن استمرار استقبال اللاعبين بدون أي انقطاع.</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>تواصل مباشر مع إدارة المنصة لتفعيل باقتك في دقائق معدودة.</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            {alertInfo.renewalWhatsAppUrl ? (
              <a
                href={alertInfo.renewalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-sm shadow-md shadow-emerald-600/20 transition cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>تجديد الاشتراك الآن عبر واتساب</span>
                <ExternalLink className="w-4 h-4 text-white/70" />
              </a>
            ) : (
              <div className="text-center text-xs text-slate-500 font-bold">
                يرجى التواصل مع إدارة المنصة لتجديد الاشتراك.
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition cursor-pointer"
            >
              متابعة العمل وتذكيري لاحقاً
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
