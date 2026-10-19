"use client";
import React, { useState } from "react";
import { AlertTriangle, Clock, X, ExternalLink } from "lucide-react";

import { WhatsAppIcon } from "../common/SocialIcons";


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
