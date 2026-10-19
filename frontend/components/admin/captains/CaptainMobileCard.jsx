"use client";
import React from "react";
import {
  MoreVertical,
  Zap,
  Activity,
  AlertTriangle,
  Calendar,
  Mail,
  Phone,
  Copy,
  Check,
  Eye,
} from "lucide-react";
import { WhatsAppIcon } from "../../common/SocialIcons";

export default function CaptainMobileCard({
  captain: c,
  onSelectCaptain,
  onOpenActionSheet,
  copiedPhone,
  onCopyPhone,
}) {
  const isSuspended = c.subscriptionStatus === "suspended" || c.status === "suspended";
  const isLifetime = c.subscriptionPlan === "lifetime" || c.isLifetime;
  const isExpired = !isLifetime && c.subscriptionStatus === "expired";

  const formattedJoined = c.createdAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date(c.createdAt))
    : "غير محدد";

  const playersCount = c.stats?.players ?? c.playersCount ?? 0;
  const hallsCount = c.stats?.halls ?? c.branchesCount ?? c.hallsCount ?? 0;
  const eventsCount = c.stats?.events ?? c.eventsCount ?? 0;
  const cleanPhone = (c.phone || "").replace(/\D/g, "");
  const isCopied = copiedPhone === c.phone;

  return (
    <div
      className="rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xs space-y-3 transition-all hover:border-slate-300"
    >
      {/* Card Header: Avatar + Coach Name + Academy + Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 via-rose-600 to-amber-600 text-white font-black flex items-center justify-center text-sm shadow-2xs shrink-0">
            {(c.name || "C").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectCaptain(c.id || c._id)}
                className="font-black text-sm text-slate-900 hover:text-red-600 transition text-right truncate max-w-[170px] cursor-pointer"
              >
                {c.name}
              </button>
              {c.isAdmin && (
                <span className="rounded-md bg-purple-100 px-1 py-0.2 text-[9px] font-black text-purple-800 border border-purple-200">
                  ADMIN
                </span>
              )}
            </div>
            <span className="block text-xs text-red-600 font-bold truncate">
              🥋 {c.academyName || "أكاديمية تدريب"}
            </span>
          </div>
        </div>

        {/* Status & Options Menu with Countdown */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1.5">
            {isSuspended ? (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-black border border-rose-200">
                {isExpired ? "منتهي الصلاحية ⛔" : "موقوف ⛔"}
              </span>
            ) : isLifetime ? (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-black border border-purple-200">
                مدى الحياة ♾️
              </span>
            ) : isExpired ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-black border border-amber-200">
                منتهي ⏳
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-black border border-emerald-200">
                نشط 🟢
              </span>
            )}

            {/* 3-Dots Action Sheet Trigger */}
            <button
              type="button"
              onClick={() => onOpenActionSheet(c)}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition cursor-pointer"
              title="إجراءات الحساب"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
          {isLifetime && !c.isAdmin ? (
            <span className="text-[10px] font-bold text-purple-600">
              دائم ومفتوح ♾️
            </span>
          ) : c.daysRemaining !== null && !c.isAdmin && (
            <span
              className={`text-[10px] font-mono font-black ${
                c.daysRemaining <= 0
                  ? "text-rose-600"
                  : c.daysRemaining <= 7
                  ? "text-amber-600"
                  : "text-slate-500"
              }`}
            >
              {c.daysRemaining <= 0
                ? "انتهت الصلاحية"
                : `متبقي ${c.daysRemaining} يوم`}
            </span>
          )}
          {c.subscriptionTotalAmount > 0 && !c.isAdmin && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                (c.subscriptionRemainingAmount || 0) > 0
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {(c.subscriptionRemainingAmount || 0) > 0
                ? `متبقي: ${c.subscriptionRemainingAmount} ج.م`
                : `مسدد بالكامل ✓`}
            </span>
          )}
        </div>
      </div>

      {/* Activity Badge, Online Status, Active Days & Expiry Warning Banner (Mobile) */}
      <div className="p-2.5 rounded-2xl bg-slate-50/90 border border-slate-100 space-y-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Online Status Pill (120s timeout) */}
            {c.isOnline ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>متصل الآن 🟢</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>{c.lastSeenFormatted || "غير متصل"}</span>
              </span>
            )}

            {/* Activity Classification Badge */}
            {c.activityClassification === "frequent" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[10px] font-black border border-purple-200">
                <Zap className="w-3 h-3 text-purple-600" />
                <span>استخدام متكرر ⚡</span>
              </span>
            ) : c.activityClassification === "occasional" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] font-bold border border-blue-200">
                <Activity className="w-3 h-3 text-blue-600" />
                <span>استخدام دوري 🟢</span>
              </span>
            ) : c.activityClassification === "low_activity" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                <span>نشاط منخفض 🟡</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold border border-slate-200">
                <span>بيانات غير كافية ⚪</span>
              </span>
            )}
          </div>

          {c.isExpiringSoon && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-700" />
              <span>ينتهي خلال {c.daysRemaining === 0 ? "اليوم" : c.daysRemaining === 1 ? "يوم" : `${c.daysRemaining} أيام`} ⏳</span>
            </span>
          )}
        </div>

        {/* Active Days Counts & Last Login Strip */}
        <div className="flex flex-wrap items-center justify-between gap-1 pt-1.5 border-t border-slate-200/60 text-[10px]">
          <div className="flex items-center gap-1 font-bold text-slate-700">
            <span className="text-slate-400">أيام النشاط:</span>
            <span className="text-emerald-700 font-black">{c.activeDays7 ?? 0}/7 أيام</span>
            <span className="text-slate-300">•</span>
            <span className="text-blue-700 font-black">{c.activeDays30 ?? 0}/30 يوماً</span>
          </div>
          <div className="text-slate-500 font-medium">
            <span className="text-slate-400">آخر دخول: </span>
            <span className="font-bold text-slate-700" title={c.lastLoginExact || (c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString("ar-EG") : "")}>{c.lastLoginFormatted || "لم يسجل بعد"}</span>
          </div>
        </div>
      </div>

      {/* Quick Contact & Date Strip */}
      <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px] space-y-1.5">
        <div className="flex items-center justify-between text-slate-500">
          <span className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>انضم:</span>
          </span>
          <strong className="text-slate-700 font-bold">{formattedJoined}</strong>
        </div>

        <div className="flex items-center justify-between gap-1 text-slate-500">
          <span className="flex items-center gap-1 text-slate-400 shrink-0">
            <Mail className="w-3.5 h-3.5" />
            <span>البريد:</span>
          </span>
          <span className="font-mono text-slate-700 text-[10px] truncate max-w-[200px]" dir="ltr">
            {c.email}
          </span>
        </div>

        {c.phone ? (
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <div className="flex items-center gap-1 font-mono font-bold text-slate-800 text-xs" dir="ltr">
              <Phone className="w-3 h-3 text-slate-400" />
              <span>{c.phone}</span>
            </div>
            {/* Instant Call & WhatsApp Buttons */}
            <div className="flex items-center gap-1">
              <a
                href={`tel:${cleanPhone}`}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-red-600 text-[10px] font-bold shadow-2xs hover:bg-red-50"
                title="اتصال هاتفي"
              >
                <Phone className="w-3 h-3" />
                <span>اتصال</span>
              </a>
              <a
                href={`https://wa.me/${cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold shadow-2xs hover:bg-emerald-100"
                title="مراسلة واتساب"
              >
                <WhatsAppIcon className="w-3 h-3" />
                <span>واتساب</span>
              </a>
              <button
                type="button"
                onClick={() => onCopyPhone(c.phone)}
                className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                title="نسخ الرقم"
              >
                {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 italic pt-0.5">
            لم يُسجّل رقم هاتف
          </div>
        )}
      </div>

      {/* Expiring Soon Reminder Trigger Button for Mobile */}
      {c.isExpiringSoon && cleanPhone && (
        <a
          href={`https://wa.me/${cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
            `السلام عليكم كابتن ${c.name}، نود تذكيركم بأن اشتراك أكاديمية (${c.academyName}) في منصة CoachMaster متبقي عليه ${c.daysRemaining} أيام. يُرجى التجديد لضمان استمرار الخدمة.`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-black transition shadow-xs"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>إرسال تنبيه تجديد الاشتراك واتساب ({c.daysRemaining} يوم) 💬</span>
        </a>
      )}

      {/* 3 Native KPI Pills */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="p-1.5 rounded-xl bg-violet-50/70 border border-violet-100">
          <span className="block text-[10px] font-bold text-violet-700">الأبطال</span>
          <strong className="text-sm font-black text-violet-900">{playersCount}</strong>
        </div>

        <div className="p-1.5 rounded-xl bg-blue-50/70 border border-blue-100">
          <span className="block text-[10px] font-bold text-blue-700">الصالات</span>
          <strong className="text-sm font-black text-blue-900">{hallsCount}</strong>
        </div>

        <div className="p-1.5 rounded-xl bg-amber-50/70 border border-amber-100">
          <span className="block text-[10px] font-bold text-amber-800">الفعاليات</span>
          <strong className="text-sm font-black text-amber-900">{eventsCount}</strong>
        </div>
      </div>

      {/* Primary View Action Button */}
      <button
        type="button"
        onClick={() => onSelectCaptain(c.id || c._id)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-2xs cursor-pointer active-press"
      >
        <Eye className="w-4 h-4" />
        <span>عرض التفاصيل والحساب</span>
      </button>
    </div>
  );
}
