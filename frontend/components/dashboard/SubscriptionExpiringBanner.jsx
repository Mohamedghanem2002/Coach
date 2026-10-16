"use client";
import React, { useState } from "react";
import { AlertTriangle, Clock, X, ExternalLink } from "lucide-react";

function WhatsAppIcon({ className = "w-4 h-4" }) {
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

export default function SubscriptionExpiringBanner({
  alertInfo,
  onOpenModal,
}) {
  const [dismissed, setDismissed] = useState(false);

  if (!alertInfo || !alertInfo.isExpiringSoon || dismissed) {
    return null;
  }

  const days = alertInfo.daysRemaining;
  const isUrgent = days <= 1;

  const daysText =
    days === 0
      ? "اليوم"
      : days === 1
      ? "يوم واحد"
      : days === 2
      ? "يومان"
      : `${days} أيام`;

  return (
    <div
      dir="rtl"
      className={`w-full border-b transition-all duration-300 animate-slide-down ${
        isUrgent
          ? "bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-rose-800 shadow-md"
          : "bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white border-amber-700 shadow-sm"
      }`}
    >
      <div className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1760px] px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2.5 sm:gap-4">
          
          {/* Right side: Icon + Message */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className={`flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-xl backdrop-blur-md shadow-xs ${
                isUrgent ? "bg-white/20 text-white" : "bg-white/25 text-white"
              }`}
            >
              <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-cairo text-xs sm:text-sm font-black tracking-tight leading-snug">
                  تنبيه اشتراك الأكاديمية: متبقي {daysText} على انتهاء اشتراكك!
                </span>
                <span className="hidden md:inline-flex items-center gap-1 rounded-full bg-black/20 px-2 py-0.5 text-[10.5px] font-bold backdrop-blur-xs">
                  <Clock className="h-3 w-3" />
                  <span>ينتهي: {alertInfo.expiresAtFormatted}</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-white/90 font-medium truncate sm:whitespace-normal leading-tight mt-0.5">
                يرجى التجديد لضمان عدم توقف خدمات إدارة الحضور واللاعبين.
              </p>
            </div>
          </div>

          {/* Left side: Action Button & Dismiss */}
          <div className="flex items-center gap-2 shrink-0 mr-auto sm:mr-0">
            {onOpenModal && (
              <button
                type="button"
                onClick={onOpenModal}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black transition cursor-pointer backdrop-blur-xs"
              >
                <span>تفاصيل التجديد</span>
              </button>
            )}

            {alertInfo.renewalWhatsAppUrl && (
              <a
                href={alertInfo.renewalWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>تجديد الاشتراك الآن</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}

            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="إغلاق التنبيه مؤقتاً"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
              title="إخفاء التنبيه مؤقتاً"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
