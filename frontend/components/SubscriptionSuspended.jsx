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

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
