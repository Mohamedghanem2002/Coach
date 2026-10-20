"use client";
import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  ShieldAlert,
  Clock,
  RefreshCw,
  LogOut,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Copy,
  Check,
} from "lucide-react";

import CoachMasterLogo from "./dashboard/CoachMasterLogo";
import { WhatsAppIcon } from "./common/SocialIcons";

export default function SubscriptionSuspended({
  reason = "expired", // "suspended" | "expired"
  message,
  academyName = "أكاديميتك",
  subscriptionExpiresAt,
  adminEmail = "mg0447837@gmail.com",
  onRefresh,
  onReactivated,
}) {
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auto-detect when admin reactivates or extends account in real-time
  useEffect(() => {
    let cancelled = false;

    const checkActivation = async () => {
      try {
        const res = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data?.success && !cancelled) {
            if (typeof onReactivated === "function") {
              onReactivated();
            } else if (typeof onRefresh === "function") {
              onRefresh();
            } else {
              window.location.reload();
            }
          }
        }
      } catch (_) {}
    };

    // 1. Check immediately when user switches tabs or window gets focus
    const handleFocus = () => checkActivation();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") checkActivation();
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    // 2. Poll every 2.5s for zero-click automatic recovery
    const interval = setInterval(checkActivation, 2500);

    // 3. Instant 0ms reaction if admin is on the same browser/machine
    let adminBc = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        adminBc = new BroadcastChannel("coachmaster_admin_sync");
        adminBc.onmessage = (event) => {
          const type = event.data?.type;
          if (
            type === "ACADEMY_REACTIVATED" ||
            type === "SUBSCRIPTION_EXTENDED" ||
            type === "PAYMENT_TOGGLED"
          ) {
            checkActivation();
          }
        };
      }
    } catch (_) {}

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (adminBc) {
        adminBc.close();
      }
    };
  }, [onReactivated, onRefresh]);

  const isSuspendedByAdmin = reason === "suspended";

  const formattedDate = subscriptionExpiresAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(subscriptionExpiresAt))
    : null;

  const phoneContacts = [
    {
      number: "01552488179",
      display: "0155 248 8179",
      rawWhatsApp: "201552488179",
      name: "م. محمد غانم",
      role: "الدعم الفني والتجديد",
    },
    {
      number: "01028138408",
      display: "0102 813 8408",
      rawWhatsApp: "201028138408",
      name: "دعم الأكاديميات",
      role: "خدمة العملاء",
    },
  ];

  const handleCopy = (num) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.success) {
          if (typeof onReactivated === "function") {
            onReactivated();
            return;
          }
        }
      }
    } catch (_) {}

    if (onRefresh) {
      onRefresh();
    }
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const defaultSuspensionMessage = isSuspendedByAdmin
    ? (message || "تم تعليق خدمة الأكاديمية مؤقتاً بقرار إداري. يرجى مراجعة إدارة المنصة للتفعيل.")
    : (message || "انتهت فترة اشتراك الأكاديمية في النظام. يرجى سداد الاشتراك الشهري لاستئناف الخدمة.");

  const primaryWhatsAppUrl = `https://wa.me/201552488179?text=${encodeURIComponent(
    `مرحباً إدارة كوتش ماستر، أود تجديد اشتراك أكاديمية (${academyName}) لتفعيل الحساب ومواصلة العمل.`
  )}`;

  return (
    <div
      dir="rtl"
      className="h-dvh max-h-dvh w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col justify-between items-center p-3 sm:p-4 overflow-hidden selection:bg-red-500 selection:text-white select-none"
    >
      {/* ━━━ 1. الهيدر المنسق (Header) ━━━ */}
      <header className="w-full max-w-md flex items-center justify-between pb-2 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center gap-2">
          <CoachMasterLogo size="sm" />
          <div className="text-right leading-none">
            <h1 className="text-xs font-black text-slate-900 tracking-tight">
              منظومة كوتش ماستر
            </h1>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] text-slate-400 font-bold">حساب:</span>
              <span className="text-red-700 font-black text-[10.5px] px-1.5 py-0.5 rounded-md bg-red-50 border border-red-200/70 inline-block max-w-[140px] truncate">
                {academyName}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-[11px] font-bold transition shadow-2xs cursor-pointer active:scale-95"
          title="تسجيل الخروج"
        >
          <LogOut className="w-3 h-3 text-slate-400" />
          <span>خروج</span>
        </button>
      </header>

      {/* ━━━ 2. الكارت المركزي المنسق (بدون سكرول وموزع بالتساوي) ━━━ */}
      <main className="w-full max-w-md flex-1 min-h-0 flex flex-col justify-between my-2 bg-white rounded-3xl border border-slate-200/90 shadow-xs p-3.5 sm:p-4.5 text-center overflow-hidden">
        {/* أ) رأس الحالة والعنوان الهادئ */}
        <div className="shrink-0 flex items-center justify-center gap-2.5 pt-0.5">
          <div className="w-9 h-9 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
            {isSuspendedByAdmin ? (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            ) : (
              <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            )}
          </div>
          <div className="text-right">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight leading-tight">
              {isSuspendedByAdmin ? "تم إيقاف حساب الأكاديمية مؤقتاً" : "انتهت فترة اشتراك الأكاديمية"}
            </h2>
            <p className="text-[10.5px] sm:text-[11px] font-semibold text-slate-500 mt-0.5">
              يرجى التواصل مع الإدارة للتجديد واستئناف فتح الحساب
            </p>
          </div>
        </div>

        {/* ب) كارت سبب الإيقاف والتاريخ (ألوان هادئة ومريحة للعين) */}
        <div className="rounded-2xl border border-rose-200/70 bg-rose-50/50 p-2.5 sm:p-3 text-right space-y-1.5 shrink-0">
          <div className="flex items-start gap-1.5 text-rose-900 text-[11px] sm:text-xs font-bold leading-relaxed">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="flex-1 bg-white/70 p-2 rounded-xl border border-rose-100">
              {defaultSuspensionMessage}
            </span>
          </div>
          {formattedDate && (
            <div className="flex items-center justify-between text-[10px] sm:text-[10.5px] text-slate-500 pt-1 border-t border-rose-200/50 font-semibold px-0.5">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-rose-500" />
                <span>تاريخ الانتهاء المسجل:</span>
              </span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                {formattedDate} (منتهي)
              </span>
            </div>
          )}
        </div>

        {/* ج) شارة الطمأنينة الهادئة */}
        <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-3 py-1.5 flex items-center justify-center gap-1.5 text-[10.5px] text-emerald-900 font-bold shrink-0">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>بيانات اللاعبين والاشتراكات مؤمنة بالكامل ومحفوظة بأمان 🛡️</span>
        </div>

        {/* د) زر التجديد عبر واتساب (الرئيسي الأنيق) */}
        <div className="shrink-0">
          <a
            href={primaryWhatsAppUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 sm:h-11 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-xs shadow-emerald-600/20 active:scale-98 transition cursor-pointer"
            title="تجديد الاشتراك الفوري عبر واتساب"
          >
            <WhatsAppIcon className="w-4 h-4 fill-white shrink-0" />
            <span>تجديد الاشتراك فوراً عبر واتساب 💬</span>
          </a>
        </div>

        {/* هـ) أرقام وقنوات التواصل (ألوان هادئة وراقية جداً بدون صخب) */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-2 sm:p-2.5 text-right space-y-1.5 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] font-bold text-slate-700">
              أرقام الدعم والتجديد المباشر:
            </span>
            <span className="text-[9.5px] font-bold text-emerald-800 bg-emerald-100/70 border border-emerald-200/60 px-2 py-0.2 rounded-full">
              متاح الآن 🟢
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {phoneContacts.map((c) => {
              const isCopied = copiedNumber === c.number;
              const whatsappUrl = `https://wa.me/${c.rawWhatsApp}?text=${encodeURIComponent(
                `مرحباً إدارة كوتش ماستر، أود تجديد اشتراك أكاديمية (${academyName}) لاستئناف الخدمة ومواصلة العمل.`
              )}`;

              return (
                <div
                  key={c.number}
                  className="p-2 rounded-xl border border-slate-200/80 bg-white shadow-2xs flex flex-col justify-between gap-1.5 hover:border-slate-300 transition"
                >
                  <div className="leading-tight px-0.5">
                    <p className="text-[11px] font-bold text-slate-800 truncate">
                      {c.name}
                    </p>
                    <p className="text-[11px] font-bold text-slate-600 font-mono tracking-wide pt-0.5" dir="ltr">
                      {c.display}
                    </p>
                  </div>

                  {/* أزرار الإجراءات بألوان هادئة ومريحة للعين */}
                  <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100">
                    {/* زر اتصال هادئ */}
                    <a
                      href={`tel:${c.number}`}
                      className="flex-1 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 text-[10.5px] font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                      title="اتصال هاتفي"
                    >
                      <Phone className="w-3 h-3 text-slate-600" />
                      <span>اتصال</span>
                    </a>

                    {/* زر واتساب هادئ بلون الباستيل الأخضر */}
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-7 rounded-lg bg-emerald-50/90 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 text-[10.5px] font-bold flex items-center justify-center gap-1 transition active:scale-95 shadow-2xs"
                      title="مراسلة واتساب"
                    >
                      <WhatsAppIcon className="w-3 h-3 fill-emerald-700" />
                      <span>واتساب</span>
                    </a>

                    {/* زر نسخ هادئ */}
                    <button
                      type="button"
                      onClick={() => handleCopy(c.number)}
                      className={`h-7 w-7 rounded-lg border text-[10px] flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs ${
                        isCopied
                          ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-500"
                      }`}
                      title="نسخ الرقم"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* و) زر فحص التفعيل المدمج */}
        <div className="shrink-0 pt-0.5">
          <button
            type="button"
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="w-full h-8 sm:h-8.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-600 hover:text-slate-800 text-[11px] font-bold transition cursor-pointer active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5 shadow-2xs"
          >
            <RefreshCw className={`w-3 h-3 text-slate-500 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "جاري التحقق من التفعيل..." : "فحص حالة التفعيل الآن 🔄"}</span>
          </button>
        </div>
      </main>

      {/* ━━━ 3. سطر الفوتر المنسق ━━━ */}
      <footer className="w-full max-w-md text-center pt-1.5 border-t border-slate-200/70 text-[10px] text-slate-400 font-bold shrink-0">
        كوتش ماستر &bull; منظومة إدارة الأكاديميات الرياضية &bull; بياناتك مشفرة ومحمية 🛡️
      </footer>
    </div>
  );
}
