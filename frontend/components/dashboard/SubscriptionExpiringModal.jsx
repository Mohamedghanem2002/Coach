"use client";
import React from "react";
import { AlertTriangle, Clock, CheckCircle2, X, ExternalLink, ShieldCheck, Zap } from "lucide-react";

function WhatsAppIcon({ className = "w-5 h-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
