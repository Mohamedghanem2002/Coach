"use client";
import React, { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  ShieldAlert,
  Clock,
  Mail,
  RefreshCw,
  LogOut,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import CoachMasterLogo from "./dashboard/CoachMasterLogo";
import { WhatsAppIcon, FacebookIcon } from "./common/SocialIcons";

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
      title: "م. محمد غانم (الدعم الفني والتجديد)",
      tag: "الخط الأساسي 1",
    },
    {
      number: "01028138408",
      display: "0102 813 8408",
      rawWhatsApp: "201028138408",
      title: "دعم الكباتن والأكاديميات الرياضية",
      tag: "الخط المباشر 2",
    },
  ];

  const facebookLink = "https://www.facebook.com/share/189fmyCdsT/";

  const handleCopy = (num) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2500);
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
    ? (message || "تم تعليق خدمة الأكاديمية مؤقتاً بقرار من إدارة المنصة. يرجى التواصل مع الإدارة لاستئناف فتح الحساب.")
    : (message || "انتهت فترة اشتراك الأكاديمية في النظام. يرجى سداد الاشتراك الشهري لاستئناف الخدمة ومواصلة استخدام المنظومة.");

  const primaryWhatsAppUrl = `https://wa.me/201552488179?text=${encodeURIComponent(
    `مرحباً إدارة كوتش ماستر، أود تجديد اشتراك أكاديمية (${academyName}) لتفعيل الحساب ومواصلة العمل.`
  )}`;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 flex flex-col justify-between items-center px-3 sm:px-6 py-4 sm:py-8 selection:bg-red-500 selection:text-white"
    >
      {/* ━━━ Top Header / Branding ━━━ */}
      <header className="w-full max-w-2xl flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-200/90 z-10">
        <div className="flex items-center gap-2.5">
          <CoachMasterLogo size="default" />
          <div className="text-right">
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
              منظومة إدارة الأكاديميات
            </h1>
            <p className="text-[11px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
              <span>حساب:</span>
              <span className="text-red-600 font-black px-1.5 py-0.2 rounded-md bg-red-50 border border-red-200/70 inline-block max-w-[150px] truncate">
                {academyName}
              </span>
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          title="تسجيل الخروج من الحساب"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-500" />
          <span>خروج</span>
        </button>
      </header>

      {/* ━━━ Main Suspension Card ━━━ */}
      <main className="w-full max-w-xl my-auto py-4 sm:py-6 z-10">
        <div className="relative rounded-3xl border border-slate-200/90 bg-white p-4.5 sm:p-7 shadow-sm text-center overflow-hidden space-y-4 sm:space-y-5">
          {/* Top Decorative Red Accent Bar */}
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

          {/* Icon Badge */}
          <div className="inline-flex p-3 sm:p-3.5 rounded-2xl bg-gradient-to-br from-red-50 to-rose-100/70 border border-red-200/90 text-red-600 shadow-xs ring-4 ring-red-50/60 mt-1">
            {isSuspendedByAdmin ? (
              <ShieldAlert className="w-9 h-9 sm:w-11 sm:h-11 text-red-600" />
            ) : (
              <Clock className="w-9 h-9 sm:w-11 sm:h-11 text-amber-600 animate-pulse" />
            )}
          </div>

          {/* Main Title & Subtitle */}
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full mb-1.5">
              <Sparkles className="w-3 h-3 text-red-600" />
              <span>تنبيه اشتراك الأكاديمية</span>
            </span>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {isSuspendedByAdmin
                ? "تم إيقاف حساب الأكاديمية مؤقتاً"
                : "انتهت فترة اشتراك الأكاديمية"}
            </h2>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1 max-w-md mx-auto">
              {isSuspendedByAdmin
                ? "تم تعليق صلاحية الوصول بقرار إداري مؤقت، يرجى مراجعة إدارة المنصة للتفعيل."
                : "تم تعليق لوحة تحكم الأكاديمية لانتهاء فترة الصلاحية المسجلة."}
            </p>
          </div>

          {/* ━━━ Reason Explanation Card ━━━ */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-3.5 sm:p-4 text-right space-y-2">
            <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs sm:text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>سبب الإيقاف والتوقف:</span>
            </div>
            <div className="bg-white/95 p-3 rounded-xl border border-rose-200/90 text-xs sm:text-sm text-slate-900 font-bold leading-relaxed whitespace-pre-wrap shadow-2xs">
              {defaultSuspensionMessage}
            </div>
            {formattedDate && (
              <div className="pt-2 border-t border-rose-200/70 flex items-center justify-between text-[11px] text-rose-800">
                <span className="flex items-center gap-1 font-bold">
                  <Calendar className="w-3 h-3 text-rose-600" />
                  <span>تاريخ انتهاء الصلاحية المسجل:</span>
                </span>
                <span className="font-mono font-black bg-rose-100 text-rose-900 px-2 py-0.5 rounded-md border border-rose-300/80">
                  {formattedDate} (منتهي)
                </span>
              </div>
            )}
          </div>

          {/* ━━━ Data Safety Assurance Card ━━━ */}
          <div className="p-3 sm:p-3.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/70 flex items-start gap-2.5 text-right">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-[11px] sm:text-xs text-emerald-950 leading-relaxed font-semibold">
              <strong className="text-emerald-800">بياناتك محفوظة بأمان تام:</strong> جميع بيانات اللاعبين،
              سجلات الحضور، الاشتراكات والفعاليات مؤمنة بالكامل ولن يتم حذف أي سجل،
              وستعود للعمل فوراً بمجرد سداد وتجديد الاشتراك.
            </div>
          </div>

          {/* ━━━ Primary WhatsApp 1-Click Renewal Button ━━━ */}
          <div>
            <a
              href={primaryWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-black shadow-xs shadow-emerald-600/25 active:scale-[0.99] transition cursor-pointer touch-manipulation"
              title="تجديد الاشتراك الفوري عبر واتساب"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 fill-white" />
              <span>تجديد الاشتراك فوراً عبر واتساب 💬</span>
            </a>
          </div>

          {/* ━━━ Direct Phone & WhatsApp Contacts ━━━ */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/80 p-3 sm:p-4 text-right space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-black text-slate-800">
                  قنوات التواصل المباشرة للتجديد الفوري:
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full">
                متاح الآن 🟢
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {phoneContacts.map((c) => {
                const isCopied = copiedNumber === c.number;
                const whatsappUrl = `https://wa.me/${c.rawWhatsApp}?text=${encodeURIComponent(
                  `مرحباً إدارة كوتش ماستر، أود تجديد اشتراك أكاديمية (${academyName}) لاستئناف الخدمة ومواصلة العمل.`
                )}`;

                return (
                  <div
                    key={c.number}
                    className="p-2.5 rounded-xl border border-slate-200/90 bg-white flex flex-col justify-between gap-2 shadow-2xs hover:border-slate-300 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9.5px] font-extrabold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded-md">
                          {c.tag}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-700 truncate">
                        {c.title}
                      </p>
                      <div className="text-xs font-black text-slate-900 font-mono tracking-wider pt-0.5" dir="ltr">
                        {c.display}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-100">
                      {/* Call Button */}
                      <a
                        href={`tel:${c.number}`}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                        title="اتصال هاتفي مباشر"
                      >
                        <Phone className="w-3 h-3" />
                        <span>اتصال</span>
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                        title="محادثة واتساب"
                      >
                        <WhatsAppIcon className="w-3 h-3 fill-white" />
                        <span>واتساب</span>
                      </a>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(c.number)}
                        className={`p-1.5 rounded-lg border text-[11px] transition cursor-pointer active:scale-95 ${
                          isCopied
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
                        }`}
                        title="نسخ الرقم"
                      >
                        {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Email & Facebook Channels */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
              <a
                href={`mailto:${adminEmail}?subject=${encodeURIComponent(
                  `طلب تجديد اشتراك أكاديمية: ${academyName}`
                )}&body=${encodeURIComponent(
                  `مرحباً إدارة المنصة، أود تجديد اشتراك أكاديمية (${academyName}) لاستئناف الخدمة.\n\nشكراً.`
                )}`}
                className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 transition"
              >
                <Mail className="w-3 h-3 text-red-500" />
                <span>البريد:</span>
                <strong dir="ltr" className="font-mono text-slate-800">{adminEmail}</strong>
              </a>

              <a
                href={facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition"
              >
                <FacebookIcon className="w-3 h-3" />
                <span>فيسبوك</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>

          {/* ━━━ Recheck Status Button ━━━ */}
          {onRefresh && (
            <div className="pt-1">
              <button
                type="button"
                onClick={handleRefreshClick}
                disabled={isRefreshing}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl border border-slate-200/90 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-black transition cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isRefreshing ? "animate-spin" : ""}`} />
                <span>{isRefreshing ? "جاري فحص حالة التفعيل..." : "فحص حالة الحساب والتفعيل 🔄"}</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* ━━━ Footer ━━━ */}
      <footer className="w-full max-w-2xl text-center pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 font-bold z-10">
        كوتش ماستر &bull; منظومة إدارة الأكاديميات الرياضية &bull; بياناتك مشفرة ومحمية 🛡️
      </footer>
    </div>
  );
}
