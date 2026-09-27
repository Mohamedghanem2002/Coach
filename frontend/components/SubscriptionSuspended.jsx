"use client";
import React from "react";
import { signOut } from "next-auth/react";
import {
  ShieldAlert,
  Clock,
  Mail,
  RefreshCw,
  LogOut,
  MessageSquare,
  Lock,
  Calendar,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

export default function SubscriptionSuspended({
  reason = "expired", // "suspended" | "expired"
  message,
  academyName = "أكاديميتك",
  subscriptionExpiresAt,
  adminEmail = "mg0447837@gmail.com",
  onRefresh,
}) {
  const isSuspendedByAdmin = reason === "suspended";

  const formattedDate = subscriptionExpiresAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(subscriptionExpiresAt))
    : null;

  return (
    <div
      dir="rtl"
      className="min-h-screen w-full bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col justify-between items-center px-4 py-8 sm:py-12 selection:bg-red-500 selection:text-white"
    >
      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-red-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header / Branding */}
      <header className="w-full max-w-2xl flex items-center justify-between pb-6 border-b border-slate-800/80 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wide">
              نظام إدارة الأكاديميات
            </h1>
            <p className="text-xs text-slate-400 font-bold">
              حساب الأكاديمية:{" "}
              <span className="text-red-400 font-black">{academyName}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>خروج</span>
        </button>
      </header>

      {/* Center Main Card */}
      <main className="w-full max-w-xl my-auto py-8 z-10">
        <div className="relative rounded-3xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-10 shadow-2xl shadow-black/60 text-center overflow-hidden">
          {/* Top highlight bar */}
          <div
            className={`absolute top-0 inset-x-0 h-1.5 bg-linear-to-r ${
              isSuspendedByAdmin
                ? "from-rose-500 via-red-500 to-orange-500"
                : "from-amber-500 via-orange-500 to-red-500"
            }`}
          />

          {/* Icon Badge */}
          <div className="inline-flex p-4 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-500 mb-6 shadow-inner animate-pulse">
            {isSuspendedByAdmin ? (
              <ShieldAlert className="w-12 h-12 text-red-500" />
            ) : (
              <Clock className="w-12 h-12 text-amber-500" />
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            {isSuspendedByAdmin
              ? "تم إيقاف حساب الأكاديمية مؤقتاً"
              : "انتهت فترة اشتراك الأكاديمية"}
          </h2>

          {/* Prominent Admin Suspension Reason Box */}
          {isSuspendedByAdmin ? (
            <div className="mb-6 p-4 sm:p-5 rounded-2xl border-2 border-red-500/40 bg-red-950/40 text-right shadow-lg">
              <div className="flex items-center gap-2 text-red-400 font-black text-xs sm:text-sm mb-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                <span>سبب الإيقاف من إدارة المنصة:</span>
              </div>
              <p className="text-sm sm:text-base text-red-100 font-bold leading-relaxed whitespace-pre-wrap bg-red-900/30 p-3 rounded-xl border border-red-800/50">
                {message || "تم تعليق خدمة الأكاديمية مؤقتاً من قبل إدارة المنصة."}
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                يرجى مراجعة سبب الإيقاف أعلاه والتواصل مع إدارة المنصة لاستئناف فتح وتفعيل الحساب.
              </p>
            </div>
          ) : (
            <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-md mx-auto mb-6">
              {message ||
                "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد الاشتراك لتجديد الصلاحية ومواصلة الاستخدام."}
            </p>
          )}

          {/* Details / Safe Data Assurance Card */}
          <div className="space-y-3 mb-8 text-right">
            <div className="p-4 rounded-2xl border border-emerald-900/40 bg-emerald-950/20 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-emerald-200 leading-relaxed font-semibold">
                <strong>بياناتك محفوظة بأمان تام:</strong> جميع بيانات اللاعبين،
                سجلات الحضور، الاشتراكات والفعاليات مؤمنة ولن يتم حذف أي جزء منها،
                وستعود للعمل فوراً بمجرد تفعيل الاشتراك.
              </div>
            </div>

            {formattedDate && (
              <div className="p-3 rounded-2xl border border-slate-800 bg-slate-800/40 flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  تاريخ انتهاء الصلاحية:
                </span>
                <span className="text-white font-black">{formattedDate}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a
              href={`mailto:${adminEmail}?subject=${encodeURIComponent(
                `طلب تجديد اشتراك أكاديمية: ${academyName}`
              )}&body=${encodeURIComponent(
                `مرحباً، أود تجديد اشتراك أكاديمية (${academyName}) على المنصة.\n\nالاسم:\nالهاتف:\nشكراً.`
              )}`}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-linear-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-sm shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>تواصل مع الإدارة للتجديد</span>
            </a>

            <a
              href="https://wa.me/201552488179"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-black text-sm transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>واتساب الدعم الفني</span>
            </a>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                className="w-full sm:w-auto flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-slate-700 bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-sm transition cursor-pointer"
                title="إعادة فحص حالة الاشتراك"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="sm:hidden">إعادة المحاولة</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-2xl text-center pt-6 border-t border-slate-800/80 text-xs text-slate-500 font-bold z-10">
        منصة إدارة الأكاديميات الرقمية &bull; الدعم الفني:{" "}
        <span className="text-slate-400 font-mono" dir="ltr">
          {adminEmail}
        </span>
      </footer>
    </div>
  );
}
