"use client";
import React, { useState } from "react";
import { signOut } from "next-auth/react";
import {
  ShieldAlert,
  Clock,
  Mail,
  RefreshCw,
  LogOut,
  Lock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react";

import { WhatsAppIcon } from "./common/SocialIcons";


export default function SubscriptionSuspended({
  reason = "expired", // "suspended" | "expired"
  message,
  academyName = "أكاديميتك",
  subscriptionExpiresAt,
  adminEmail = "mg0447837@gmail.com",
  onRefresh,
}) {
  const [copiedNumber, setCopiedNumber] = useState(null);

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
      title: "خدمة العملاء وتجديد الاشتراكات",
      tag: "الخط الأساسي 1",
    },
    {
      number: "01028138408",
      display: "0102 813 8408",
      rawWhatsApp: "201028138408",
      title: "إدارة المنصة والدعم الفني المباشر",
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

  const defaultSuspensionMessage = isSuspendedByAdmin
    ? (message || "تم تعليق خدمة الأكاديمية مؤقتاً بقرار من إدارة المنصة. يرجى التواصل مع الإدارة لاستئناف فتح الحساب.")
    : (message || "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك لتجديد الصلاحية ومواصلة الاستخدام واستئناف الخدمة.");

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 selection:bg-red-500 selection:text-white"
    >
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header / Branding */}
      <header className="w-full max-w-3xl flex items-center justify-between pb-6 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wide">
              منظومة إدارة الأكاديميات
            </h1>
            <p className="text-xs text-slate-400 font-bold">
              حساب:{" "}
              <span className="text-red-400 font-black">{academyName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>تسجيل الخروج</span>
        </button>
      </header>

      {/* Center Main Card */}
      <main className="w-full max-w-2xl my-auto py-6 sm:py-8 z-10">
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-black/70 text-center overflow-hidden">
          {/* Top highlight bar */}
          <div
            className={`absolute top-0 inset-x-0 h-1.5 bg-linear-to-r ${
              isSuspendedByAdmin
                ? "from-rose-500 via-red-500 to-orange-500"
                : "from-amber-500 via-orange-500 to-red-500"
            }`}
          />

          {/* Icon Badge */}
          <div className="inline-flex p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 mb-5 shadow-inner">
            {isSuspendedByAdmin ? (
              <ShieldAlert className="w-12 h-12 text-red-500" />
            ) : (
              <Clock className="w-12 h-12 text-amber-500 animate-pulse" />
            )}
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            {isSuspendedByAdmin
              ? "تم إيقاف حساب الأكاديمية مؤقتاً"
              : "انتهت فترة اشتراك الأكاديمية"}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-400 mb-6">
            {isSuspendedByAdmin
              ? "تم تعليق صلاحية الوصول بقرار إداري مؤقت"
              : "تم إيقاف الوصول إلى لوحة تحكم الأكاديمية لانتهاء فترة الصلاحية المحددة"}
          </p>

          {/* Prominent Reason Explanation Box */}
          <div className="mb-6 p-4 sm:p-5 rounded-2xl border-2 border-red-500/40 bg-red-950/40 text-right shadow-lg">
            <div className="flex items-center gap-2 text-red-400 font-black text-xs sm:text-sm mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>سبب الإيقاف والتوقف:</span>
            </div>
            <p className="text-sm sm:text-base text-red-100 font-bold leading-relaxed whitespace-pre-wrap bg-red-900/30 p-3.5 rounded-xl border border-red-800/50">
              {defaultSuspensionMessage}
            </p>
            {formattedDate && (
              <div className="mt-3 pt-2.5 border-t border-red-800/40 flex items-center justify-between text-xs text-red-200">
                <span className="flex items-center gap-1.5 font-bold">
                  <Calendar className="w-3.5 h-3.5 text-red-400" />
                  تاريخ انتهاء الصلاحية المسجل:
                </span>
                <span className="font-mono font-black bg-red-900/60 px-2 py-0.5 rounded-md border border-red-700/50">
                  {formattedDate} (منتهي)
                </span>
              </div>
            )}
          </div>

          {/* Data Safety Assurance Card */}
          <div className="p-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 flex items-start gap-3 mb-6 text-right">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-emerald-200 leading-relaxed font-semibold">
              <strong>بياناتك محفوظة بأمان تام:</strong> جميع بيانات اللاعبين،
              سجلات الحضور، الاشتراكات والفعاليات مؤمنة بالكامل ولن يتم حذف أي جزء منها،
              وستعود للعمل فوراً بمجرد تجديد الاشتراك وسداده.
            </div>
          </div>

          {/* ━━━ Prominent Direct Contact Phone Numbers Section ━━━ */}
          <div className="rounded-2xl border border-indigo-900/50 bg-slate-950/70 p-4 sm:p-5 mb-6 text-right">
            <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-black text-white">
                  أرقام وقنوات التواصل المباشرة مع الإدارة للتجديد:
                </h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                متاح الآن 🟢
              </span>
            </div>

            <p className="text-xs text-slate-400 font-medium mb-3.5">
              يمكنك الاتصال هاتفياً أو إرسال رسالة واتساب على الأرقام التالية لتجديد الاشتراك وتفعيل الحساب فوراً:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {phoneContacts.map((c) => {
                const isCopied = copiedNumber === c.number;
                const whatsappUrl = `https://wa.me/${c.rawWhatsApp}?text=${encodeURIComponent(
                  `مرحباً إدارة المنصة، أود تجديد اشتراك أكاديمية (${academyName}) لاستئناف الخدمة ومواصلة العمل.`
                )}`;

                return (
                  <div
                    key={c.number}
                    className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-800/40">
                          {c.tag}
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {c.title}
                        </span>
                      </div>
                      <div className="text-base font-black text-white font-mono tracking-wider pt-1" dir="ltr">
                        {c.display}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
                      {/* Call Button */}
                      <a
                        href={`tel:${c.number}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition cursor-pointer"
                        title="اتصال هاتفي مباشر"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>اتصال</span>
                      </a>

                      {/* WhatsApp Button */}
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer"
                        title="محادثة واتساب"
                      >
                        <WhatsAppIcon className="w-3.5 h-3.5" />
                        <span>واتساب</span>
                      </a>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => handleCopy(c.number)}
                        className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
                          isCopied
                            ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                            : "border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-300"
                        }`}
                        title="نسخ الرقم"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Social & Email Channels */}
            <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <a
                href={`mailto:${adminEmail}?subject=${encodeURIComponent(
                  `طلب تجديد اشتراك أكاديمية: ${academyName}`
                )}&body=${encodeURIComponent(
                  `مرحباً إدارة المنصة، أود تجديد اشتراك أكاديمية (${academyName}) لاستئناف الخدمة.\n\nشكراً.`
                )}`}
                className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition"
              >
                <Mail className="w-3.5 h-3.5 text-red-400" />
                <span>البريد الإلكتروني للإدارة:</span>
                <strong dir="ltr" className="font-mono text-indigo-300">{adminEmail}</strong>
              </a>

              <a
                href={facebookLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-blue-400 transition"
              >
                <span>صفحة فيسبوك</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Refresh Action Button */}
          {onRefresh && (
            <div className="pt-2">
              <button
                type="button"
                onClick={onRefresh}
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>إعادة فحص حالة الحساب والتفعيل</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-3xl text-center pt-6 border-t border-slate-800/80 text-xs text-slate-500 font-bold z-10">
        منظومة إدارة الأكاديميات الرياضية &bull; الدعم الفني:{" "}
        <span className="text-slate-400 font-mono" dir="ltr">
          0155 248 8179 - 0102 813 8408
        </span>
      </footer>
    </div>
  );
}
