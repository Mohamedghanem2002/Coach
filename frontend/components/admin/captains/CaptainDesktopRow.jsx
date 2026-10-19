"use client";
import React from "react";
import {
  Users,
  Building2,
  Trophy,
  Phone,
  Calendar,
  CreditCard,
  CheckCircle2,
  ShieldAlert,
  Trash2,
  MoreVertical,
  Zap,
  Activity,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { WhatsAppIcon } from "../../common/SocialIcons";

export default function CaptainDesktopRow({
  captain: c,
  onSelectCaptain,
  onOpenExtend,
  onTogglePayment,
  onOpenSuspend,
  onOpenReactivate,
  onOpenDelete,
  onOpenActionSheet,
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

  return (
    <tr className="hover:bg-slate-50/70 transition-colors">
      {/* Captain Profile & Academy */}
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-red-600 via-rose-600 to-amber-600 text-white font-black flex items-center justify-center text-sm shadow-2xs shrink-0">
            {(c.name || "C").charAt(0)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onSelectCaptain(c.id || c._id)}
                className="font-bold text-slate-900 hover:text-red-600 transition text-sm text-right truncate max-w-[200px] cursor-pointer block"
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
      </td>

      {/* Contact & Join Date */}
      <td className="p-4">
        <span className="block text-xs font-bold text-slate-800">{formattedJoined}</span>
        <span className="block text-[11px] text-slate-500 font-mono" dir="ltr">{c.email}</span>
        {c.phone && (
          <div className="flex items-center gap-2 mt-1">
            <span className="font-mono text-slate-700 text-xs font-bold" dir="ltr">{c.phone}</span>
            <a
              href={`tel:${cleanPhone}`}
              className="text-slate-400 hover:text-red-600"
              title="اتصال"
            >
              <Phone className="w-3 h-3" />
            </a>
            <a
              href={`https://wa.me/${cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:text-emerald-700"
              title="واتساب"
            >
              <WhatsAppIcon className="w-3 h-3" />
            </a>
          </div>
        )}
      </td>

      {/* Activity & Platform Usage */}
      <td className="p-4">
        <div className="space-y-1.5">
          {/* Online / Last Seen Badge & Classification Badge */}
          <div className="flex flex-wrap items-center gap-1.5">
            {c.isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-black shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>متصل الآن 🟢</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold" title={c.lastSeenAt ? new Date(c.lastSeenAt).toLocaleString("ar-EG") : ""}>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>{c.lastSeenFormatted || "غير متصل"}</span>
              </span>
            )}

            {/* Activity Classification Badge */}
            {c.activityClassification === "frequent" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-[10px] font-black">
                <Zap className="w-3 h-3 text-purple-600" />
                <span>استخدام متكرر ⚡</span>
              </span>
            ) : c.activityClassification === "occasional" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                <Activity className="w-3 h-3 text-blue-600" />
                <span>استخدام دوري 🟢</span>
              </span>
            ) : c.activityClassification === "low_activity" ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                <span>نشاط منخفض 🟡</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-bold">
                <span>بيانات غير كافية ⚪</span>
              </span>
            )}
          </div>

          {/* Genuine Active Days Counters (7d & 30d) */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-50/80 px-2 py-0.5 rounded-md border border-slate-200/60 w-fit">
            <span className="text-slate-500 text-[10px]">أيام النشاط:</span>
            <span className="font-mono text-emerald-700 font-black">{c.activeDays7 ?? 0}</span>
            <span className="text-slate-400 text-[10px]">/ 7 أيام</span>
            <span className="text-slate-300">•</span>
            <span className="font-mono text-blue-700 font-black">{c.activeDays30 ?? 0}</span>
            <span className="text-slate-400 text-[10px]">/ 30 يوماً</span>
          </div>

          {/* Last Login Timestamp */}
          <div className="text-[10px] text-slate-500 font-medium truncate" title={c.lastLoginExact || (c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString("ar-EG") : "")}>
            <span className="text-slate-400">آخر دخول: </span>
            <strong className="text-slate-700 font-bold">{c.lastLoginFormatted || "لم يسجل بعد"}</strong>
          </div>
        </div>
      </td>

      {/* Players Count Badge */}
      <td className="p-4 text-center">
        <span className="inline-flex items-center justify-center gap-1 min-w-[65px] px-2.5 py-1 rounded-lg bg-violet-50 text-violet-800 border border-violet-200/80 font-bold text-xs">
          <Users className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          <span>{playersCount}</span>
        </span>
      </td>

      {/* Halls Count Badge */}
      <td className="p-4 text-center">
        <span className="inline-flex items-center justify-center gap-1 min-w-[65px] px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200/80 font-bold text-xs">
          <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>{hallsCount}</span>
        </span>
      </td>

      {/* Events Count Badge */}
      <td className="p-4 text-center">
        <span className="inline-flex items-center justify-center gap-1 min-w-[65px] px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-bold text-xs">
          <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>{eventsCount}</span>
        </span>
      </td>

      {/* Status Badge & Dynamic Countdown */}
      <td className="p-4">
        <div className="space-y-1">
          {isSuspended ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 text-[11px] font-bold border border-rose-200">
              {isExpired ? "منتهي الصلاحية ⛔" : "موقوف ⛔"}
            </span>
          ) : isLifetime ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
              مدى الحياة ♾️
            </span>
          ) : isExpired ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200">
              منتهي ⏳
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
              نشط 🟢
            </span>
          )}

          {/* 3-day Expiring Soon Urgent Banner */}
          {c.isExpiringSoon && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black animate-pulse">
              <AlertTriangle className="w-3 h-3 text-amber-600" />
              <span>ينتهي خلال {c.daysRemaining === 0 ? "اليوم" : c.daysRemaining === 1 ? "24 ساعة" : `${c.daysRemaining} أيام`} ⏳</span>
            </span>
          )}

          {isLifetime && !c.isAdmin ? (
            <span className="block text-[10px] font-bold text-purple-600">
              دائم ومفتوح ♾️
            </span>
          ) : c.daysRemaining !== null && !c.isAdmin && !c.isExpiringSoon && (
            <span
              className={`block text-[10px] font-mono font-black ${
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
          {/* Financial status badge */}
          {c.subscriptionTotalAmount > 0 && !c.isAdmin && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                (c.subscriptionRemainingAmount || 0) > 0
                  ? "bg-rose-50 text-rose-800 border-rose-200"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200"
              }`}
            >
              {(c.subscriptionRemainingAmount || 0) > 0
                ? `متبقي: ${c.subscriptionRemainingAmount} ج.م ⚠️`
                : `مسدد بالكامل ✓`}
            </span>
          )}
        </div>
      </td>

      {/* Action Buttons */}
      <td className="p-4 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {/* View Details */}
          <button
            type="button"
            onClick={() => onSelectCaptain(c.id || c._id)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
            title="عرض التفاصيل الكاملة للكابتن"
          >
            <Eye className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden xl:inline">عرض</span>
          </button>

          {/* Expiring Soon: One-click WhatsApp Renewal Reminder */}
          {c.isExpiringSoon && cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
                `السلام عليكم كابتن ${c.name}، نود تذكيركم بأن اشتراك أكاديمية (${c.academyName}) في منصة CoachMaster متبقي عليه ${c.daysRemaining} أيام. يُرجى التجديد لضمان استمرار الخدمة.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1 transition cursor-pointer shadow-2xs active:scale-95 animate-pulse"
              title="إرسال تنبيه تجديد الاشتراك عبر واتساب"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">تنبيه تجديد</span>
            </a>
          )}

          {/* Dormant Coach Assistance WhatsApp */}
          {c.isDormant && c.stats?.players === 0 && cleanPhone && !c.isExpiringSoon && (
            <a
              href={`https://wa.me/${cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone}?text=${encodeURIComponent(
                `السلام عليكم كابتن ${c.name}، مرحباً بك في CoachMaster! لاحظنا تسجيلك حديثاً.. هل تحتاج لأي مساعدة في بدء استخدام النظام وإضافة اللاعبين والصالات؟ فريق الدعم جاهز لمساعدتك.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-blue-200 active:scale-95"
              title="مراسلة الكابتن للمساعدة في بدء الاستخدام"
            >
              <WhatsAppIcon className="w-3.5 h-3.5" />
              <span className="hidden 2xl:inline">مساعدة</span>
            </a>
          )}

          {/* Quick Extend */}
          <button
            type="button"
            onClick={() => onOpenExtend(c)}
            className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-purple-200/80 active:scale-95"
            title="تمديد فترة الصلاحية والاشتراك"
          >
            <Calendar className="w-3.5 h-3.5 text-purple-600" />
            <span className="hidden 2xl:inline">تمديد</span>
          </button>

          {/* Quick Payment Toggle */}
          <button
            type="button"
            onClick={() => onTogglePayment(c)}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition cursor-pointer border active:scale-95 ${
              c.subscriptionPaid
                ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
            }`}
            title={c.subscriptionPaid ? "مسدد (انقر لإلغاء السداد)" : "غير مسدد (انقر لتسجيل السداد)"}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span className="hidden 2xl:inline">{c.subscriptionPaid ? "مسدد" : "سداد"}</span>
          </button>

          {/* Quick Suspend / Reactivate */}
          {isSuspended ? (
            <button
              type="button"
              onClick={() => onOpenReactivate(c)}
              className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer border border-emerald-200"
              title="إعادة تفعيل الحساب"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenSuspend(c)}
              className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer border border-amber-200"
              title="تعليق الحساب مؤقتاً"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
            </button>
          )}

          {/* Quick Delete */}
          <button
            type="button"
            onClick={() => onOpenDelete(c)}
            className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
            title="حذف الحساب نهائياً"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* More Options Dropdown Trigger */}
          <button
            type="button"
            onClick={() => onOpenActionSheet(c)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
            title="خيارات إضافية"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
