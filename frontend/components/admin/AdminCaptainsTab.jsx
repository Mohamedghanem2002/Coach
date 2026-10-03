"use client";
import React, { useState } from "react";
import {
  Search,
  Building2,
  Users,
  Clock,
  ShieldAlert,
  CheckCircle,
  Eye,
  Calendar,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Trash2,
  Trophy,
  ArrowUpDown,
  Phone,
  Mail,
  User,
  ShieldCheck,
  MoreVertical,
  SlidersHorizontal,
  X,
  CreditCard,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
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

export default function AdminCaptainsTab({
  captains = [],
  summary = { totalCaptains: 0, totalPlayers: 0, totalHalls: 0, totalEvents: 0 },
  pagination = {},
  search = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  dateFilter = "all",
  onDateFilterChange,
  sortBy = "newest",
  onSortByChange,
  onPageChange,
  onSelectCaptain,
  onOpenSuspend,
  onOpenExtend,
  onOpenReactivate,
  onOpenDelete,
  onTogglePayment,
  loading = false,
  onRefresh,
}) {
  const [selectedActionCaptain, setSelectedActionCaptain] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(null);

  const handleCopyPhone = (num) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedPhone(num);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const statusOptions = [
    { id: "all", label: "الكل", badge: summary.totalAccounts ?? summary.totalCaptains ?? null },
    { id: "active", label: "نشطة 🟢" },
    { id: "has_players", label: "بها أبطال 🥋" },
    { id: "suspended", label: "موقوفة ⛔" },
    { id: "expired", label: "منتهية ⏳" },
    { id: "pending", label: "غير مسددة 💰" },
  ];

  const dateFilterOptions = [
    { id: "all", label: "كل الأوقات" },
    { id: "today", label: "انضموا اليوم" },
    { id: "week", label: "آخر 7 أيام" },
    { id: "month", label: "آخر شهر" },
    { id: "year", label: "هذا العام" },
  ];

  const sortOptions = [
    { id: "newest", label: "الأحدث انضماماً ⏱️" },
    { id: "oldest", label: "الأقدم انضماماً 📅" },
    { id: "players_desc", label: "الأكثر لاعبين 👥" },
    { id: "halls_desc", label: "الأكثر صالات 🏟️" },
    { id: "events_desc", label: "الأكثر فعاليات 🏆" },
    { id: "name_asc", label: "الاسم (أ - ي) 🔤" },
  ];

  const totalDisplayAccounts = summary.totalAccounts ?? summary.totalCaptains ?? 0;

  return (
    <div className="space-y-3.5 sm:space-y-5 animate-fade-in" dir="rtl">
      
      {/* ── 1. Mobile App Top Bar & Quick Metrics ── */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center font-black shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  إدارة الحسابات المسجلة
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] font-bold font-mono">
                  {totalDisplayAccounts} كابتن
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                متابعة اشتراكات الأكاديميات، تفعيل الخدمات، والتواصل المباشر مع الكباتن
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition cursor-pointer"
            title="خيارات الفرز والتصفية المتقدمة"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>فلترة وترتيب</span>
          </button>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : "text-slate-500"}`} />
              <span className="hidden xs:inline">تحديث</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. Glance KPI Cards (Horizontal native-style scroll on mobile) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Accounts */}
        <div className="rounded-2xl border border-red-100 bg-linear-to-br from-red-50/70 via-white to-white p-3 sm:p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-slate-500">إجمالي الكباتن</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {totalDisplayAccounts}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
        </div>

        {/* Total Players */}
        <div className="rounded-2xl border border-violet-100 bg-linear-to-br from-violet-50/70 via-white to-white p-3 sm:p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-slate-500">إجمالي الأبطال</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {summary.totalPlayers ?? 0}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
            <User className="w-4 h-4" />
          </div>
        </div>

        {/* Total Halls */}
        <div className="rounded-2xl border border-blue-100 bg-linear-to-br from-blue-50/70 via-white to-white p-3 sm:p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-slate-500">صالات التدريب</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {summary.totalHalls ?? 0}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        {/* Total Events */}
        <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/70 via-white to-white p-3 sm:p-4 shadow-2xs flex items-center justify-between">
          <div>
            <span className="block text-[11px] font-bold text-slate-500">البطولات والأنشطة</span>
            <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {summary.totalEvents ?? 0}
            </strong>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ── 3. Search Bar + Fast Filter Segment Chips ── */}
      <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-4 shadow-2xs space-y-3">
        {/* Instant Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="ابحث باسم الكابتن، الأكاديمية، الهاتف، الإيميل أو المعرف..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-9 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition placeholder:text-slate-400 placeholder:font-normal"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-300 transition cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Chips (Scrollable like native apps) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {statusOptions.map((opt) => {
            const active = statusFilter === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStatusFilterChange(opt.id)}
                className={`px-3 py-1.5 rounded-full font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  active
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                }`}
              >
                <span>{opt.label}</span>
                {opt.badge !== undefined && opt.badge !== null && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${active ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                    {opt.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. Results Counter ── */}
      <div className="flex items-center justify-between px-2 text-xs text-slate-500 font-semibold">
        <div>
          {pagination?.total !== undefined ? (
            <span>
              عرض <strong className="text-slate-800">{captains.length}</strong> من إجمالي{" "}
              <strong className="text-slate-800">{pagination.total}</strong> حساب
            </span>
          ) : (
            <span>{captains.length} كابتن مسجل</span>
          )}
        </div>

        {loading && (
          <span className="text-red-600 font-bold animate-pulse flex items-center gap-1 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
            جاري تحديث البيانات...
          </span>
        )}
      </div>

      {/* ── 5. Empty State ── */}
      {captains.length === 0 ? (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 text-center text-slate-400 space-y-2">
          <User className="w-12 h-12 mx-auto text-slate-300" />
          <h2 className="text-sm font-black text-slate-700">لا توجد حسابات تطابق البحث</h2>
          <p className="text-xs text-slate-400">جرّب تغيير كلمة البحث أو اختيار فلتر آخر.</p>
          {(search || statusFilter !== "all" || dateFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onStatusFilterChange("all");
                if (onDateFilterChange) onDateFilterChange("all");
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
            >
              <span>إعادة ضبط الفلاتر</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ═════════════════════════════════════════════════════════════════
              MOBILE APP CARD FEED (Visible on mobile, hidden on md+)
          ═════════════════════════════════════════════════════════════════ */}
          <div className="md:hidden space-y-3">
            {captains.map((c) => {
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
                  key={c.id || c._id}
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
                          onClick={() => setSelectedActionCaptain(c)}
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
                            onClick={() => handleCopyPhone(c.phone)}
                            className="p-1 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-800"
                            title="نسخ الرقم"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-400 italic pt-0.5">
                        لم يُسجّل رقم هاتف
                      </div>
                    )}
                  </div>

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
            })}
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              DESKTOP DATA TABLE (Visible on md and up)
          ═════════════════════════════════════════════════════════════════ */}
          <div className="hidden md:block rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">الكابتن والأكاديمية</th>
                    <th className="p-4">التواصل والانضمام</th>
                    <th className="p-4 text-center">اللاعبين</th>
                    <th className="p-4 text-center">الصالات</th>
                    <th className="p-4 text-center">الفعاليات</th>
                    <th className="p-4">حالة الحساب</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {captains.map((c) => {
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
                      <tr key={c.id || c._id} className="hover:bg-slate-50/70 transition-colors">
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
                            {isLifetime && !c.isAdmin ? (
                              <span className="block text-[10px] font-bold text-purple-600">
                                دائم ومفتوح ♾️
                              </span>
                            ) : c.daysRemaining !== null && !c.isAdmin && (
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onSelectCaptain(c.id || c._id)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                              title="عرض التفاصيل الكاملة"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedActionCaptain(c)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                              title="إجراءات إضافية"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              PAGINATION
          ═════════════════════════════════════════════════════════════════ */}
          {pagination?.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-2 text-xs text-slate-500 font-semibold">
              <span>
                الصفحة {pagination.page} من {pagination.totalPages}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <div className="flex items-center gap-1 px-2 font-mono font-bold">
                  {pagination.page} / {pagination.totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition cursor-pointer"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          NATIVE MOBILE ACTION BOTTOM SHEET (أكشن شيت للهاتف)
      ═════════════════════════════════════════════════════════════════ */}
      {selectedActionCaptain && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-backdrop"
          onClick={() => setSelectedActionCaptain(null)}
          dir="rtl"
        >
          <div
            className="w-full max-w-lg mx-auto bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-4 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle Drag Bar */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />

            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center shrink-0">
                  {(selectedActionCaptain.name || "C").charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-black text-slate-900 truncate">
                    {selectedActionCaptain.name}
                  </h3>
                  <span className="block text-xs text-red-600 font-bold truncate">
                    🥋 {selectedActionCaptain.academyName}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedActionCaptain(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Native Actions List */}
            <div className="space-y-1.5 text-xs font-bold text-slate-700">
              {/* View Full Profile */}
              <button
                type="button"
                onClick={() => {
                  const cid = selectedActionCaptain.id || selectedActionCaptain._id;
                  setSelectedActionCaptain(null);
                  onSelectCaptain(cid);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-900"
              >
                <Eye className="w-4 h-4 text-blue-600" />
                <span>عرض الملف الرياضي واللاعبين والصالات</span>
              </button>

              {/* Extend Subscription */}
              {!selectedActionCaptain.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedActionCaptain;
                    setSelectedActionCaptain(null);
                    onOpenExtend && onOpenExtend(c);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-900"
                >
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>تمديد فترة الاشتراك والصلاحية</span>
                </button>
              )}

              {/* Toggle Payment */}
              {!selectedActionCaptain.isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedActionCaptain;
                    setSelectedActionCaptain(null);
                    onTogglePayment && onTogglePayment(c);
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span>تعديل حالة السداد</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedActionCaptain.subscriptionTotalAmount > 0
                      ? (selectedActionCaptain.subscriptionRemainingAmount > 0
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200")
                      : (selectedActionCaptain.subscriptionPaid
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800")
                  }`}>
                    {selectedActionCaptain.subscriptionTotalAmount > 0
                      ? (selectedActionCaptain.subscriptionRemainingAmount > 0
                          ? `دفع جزئي (متبقي ${selectedActionCaptain.subscriptionRemainingAmount} ج.م)`
                          : `مسدد بالكامل (${selectedActionCaptain.subscriptionTotalAmount} ج.م) ✓`)
                      : (selectedActionCaptain.subscriptionPaid ? "مسدد ✓" : "غير مسدد")}
                  </span>
                </button>
              )}

              {/* Suspend or Reactivate */}
              {!selectedActionCaptain.isAdmin ? (
                selectedActionCaptain.subscriptionStatus === "suspended" || selectedActionCaptain.status === "suspended" ? (
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedActionCaptain;
                      setSelectedActionCaptain(null);
                      onOpenReactivate && onOpenReactivate(c);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-emerald-700 transition cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>إعادة تفعيل الحساب واستئناف الخدمة</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedActionCaptain;
                      setSelectedActionCaptain(null);
                      onOpenSuspend && onOpenSuspend(c);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 text-amber-800 transition cursor-pointer"
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>إيقاف وتعليق الحساب مؤقتاً</span>
                  </button>
                )
              ) : (
                <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-center text-xs font-black text-purple-700">
                  🛡️ حساب مدير المنصة محمي من أي تعديلات أو تعليق
                </div>
              )}

              {/* Direct Call / WhatsApp if phone available */}
              {selectedActionCaptain.phone && (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <a
                    href={`tel:${selectedActionCaptain.phone.replace(/\D/g, "")}`}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition"
                  >
                    <Phone className="w-3.5 h-3.5 text-red-600" />
                    <span>اتصال هاتف</span>
                  </a>

                  <a
                    href={`https://wa.me/${selectedActionCaptain.phone.replace(/\D/g, "").startsWith("0") ? `2${selectedActionCaptain.phone.replace(/\D/g, "")}` : selectedActionCaptain.phone.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5" />
                    <span>واتساب</span>
                  </a>
                </div>
              )}

              {/* Delete permanently */}
              {!selectedActionCaptain.isAdmin && (
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const c = selectedActionCaptain;
                      setSelectedActionCaptain(null);
                      onOpenDelete && onOpenDelete(c);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحساب بجميع بياناته نهائياً</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          NATIVE FILTER & SORT BOTTOM SHEET (فلترة وترتيب للهاتف)
      ═════════════════════════════════════════════════════════════════ */}
      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-backdrop"
          onClick={() => setShowFilterModal(false)}
          dir="rtl"
        >
          <div
            className="w-full max-w-lg mx-auto bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-4 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-red-600" />
                <span>خيارات الترتيب والتصفية</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFilterModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Options */}
            <div className="space-y-2">
              <span className="block text-xs font-bold text-slate-500">ترتيب النتائج حسب:</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {sortOptions.map((so) => {
                  const isSelected = sortBy === so.id;
                  return (
                    <button
                      key={so.id}
                      type="button"
                      onClick={() => {
                        onSortByChange && onSortByChange(so.id);
                      }}
                      className={`p-2.5 rounded-xl border text-right font-bold transition cursor-pointer ${
                        isSelected
                          ? "border-red-600 bg-red-50 text-red-700 shadow-2xs"
                          : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      {so.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Joined Filter */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="block text-xs font-bold text-slate-500">تاريخ الانضمام:</span>
              <div className="flex flex-wrap gap-1.5 text-xs">
                {dateFilterOptions.map((dopt) => {
                  const isSelected = dateFilter === dopt.id;
                  return (
                    <button
                      key={dopt.id}
                      type="button"
                      onClick={() => {
                        onDateFilterChange && onDateFilterChange(dopt.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      }`}
                    >
                      {dopt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Apply button */}
            <button
              type="button"
              onClick={() => setShowFilterModal(false)}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              تطبيق وإغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
