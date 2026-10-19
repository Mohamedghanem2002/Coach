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
  Zap,
  AlertTriangle,
  Activity,
} from "lucide-react";

import CaptainMobileCard from "./captains/CaptainMobileCard";
import CaptainDesktopRow from "./captains/CaptainDesktopRow";
import CaptainActionSheet from "./captains/CaptainActionSheet";
import CaptainFilterModal from "./captains/CaptainFilterModal";

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
    { id: "online", label: "متصل الآن 🟢", badge: summary.onlineCaptains ?? null },
    { id: "frequent", label: "استخدام متكرر ⚡", badge: summary.frequentCaptains ?? null },
    { id: "occasional", label: "استخدام دوري 🟢", badge: summary.occasionalCaptains ?? null },
    { id: "low_activity", label: "نشاط منخفض 🟡", badge: summary.lowActivityCaptains ?? null },
    { id: "insufficient_data", label: "بيانات غير كافية ⚪", badge: summary.insufficientDataCaptains ?? null },
    { id: "daily_active", label: "نشط شبه يومي ⚡", badge: summary.dailyActiveCaptains ?? null },
    { id: "weekly_active", label: "نشط أسبوعياً 🟢", badge: summary.weeklyActiveCaptains ?? null },
    { id: "dormant", label: "خامل / لم يبدأ 💤", badge: summary.dormantCaptains ?? null },
    { id: "expiring_soon", label: "ينتهي قريباً (3 أيام) ⏳", badge: summary.expiringSoonCaptains ?? null },
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
    { id: "online_first", label: "المتصلون أولاً 🟢" },
    { id: "active_days_desc", label: "الأكثر أيام نشاط (30 يوم) ⚡" },
    { id: "active_days_asc", label: "الأقل أيام نشاط 💤" },
    { id: "activity_desc", label: "الأكثر تفاعلاً ونشاطاً ⚡" },
    { id: "activity_asc", label: "الخامل والأقل نشاطاً 💤" },
    { id: "last_seen_desc", label: "آخر تواجد الأحدث 👁️" },
    { id: "last_login_desc", label: "آخر تسجيل دخول 🔑" },
    { id: "expiring_soon", label: "الأقرب انتهاءً (تجديد) ⏳" },
    { id: "oldest", label: "الأقدم انضماماً 📅" },
    { id: "players_desc", label: "الأكثر لاعبين 👥" },
    { id: "halls_desc", label: "الأكثر صالات 🏟️" },
    { id: "events_desc", label: "الأكثر فعاليات 🏆" },
    { id: "name_asc", label: "الاسم (أ - ي) 🔤" },
  ];

  const totalDisplayAccounts = summary.totalAccounts ?? summary.totalCaptains ?? 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden animate-fade-in divide-y divide-slate-100" dir="rtl">
      
      {/* ── 1. Integrated Master Header & KPI Capsules Strip ── */}
      <div className="p-4 sm:p-6 bg-linear-to-b from-slate-50/80 via-white to-white">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 tracking-tight">
                  إدارة الكباتن والأكاديميات المسجلة
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200/80 text-xs font-black font-mono">
                  {totalDisplayAccounts} كابتن
                </span>
              </div>
              <p className="text-xs text-slate-500 font-bold mt-0.5">
                متابعة نشاط الكباتن واستخدام المنصة، اشتراكات الأكاديميات، والتواصل المباشر مع مديري الفروع
              </p>
            </div>
          </div>

          {/* Integrated Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title="خيارات الفرز والتصفية المتقدمة"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>تصفية متقدمة</span>
            </button>

            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : "text-slate-500"}`} />
                <span>تحديث</span>
              </button>
            )}
          </div>
        </div>

        {/* Integrated KPI Capsules Strip (Interactive Quick Filters) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4 pt-4 border-t border-slate-200/70">
          {/* Total Captains */}
          <button
            type="button"
            onClick={() => onStatusFilterChange("all")}
            className={`flex items-center justify-between p-3 rounded-2xl border text-right transition cursor-pointer active:scale-95 ${
              statusFilter === "all"
                ? "bg-red-50/70 border-red-300 ring-2 ring-red-100"
                : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
            }`}
          >
            <div>
              <span className="block text-[11px] font-bold text-slate-400">إجمالي الكباتن</span>
              <strong className="text-lg sm:text-xl font-black text-slate-900">{totalDisplayAccounts}</strong>
            </div>
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
          </button>

          {/* Online Captains Now (120s timeout) */}
          <button
            type="button"
            onClick={() => onStatusFilterChange("online")}
            className={`flex items-center justify-between p-3 rounded-2xl border text-right transition cursor-pointer active:scale-95 ${
              statusFilter === "online"
                ? "bg-emerald-50 border-emerald-400 ring-2 ring-emerald-200"
                : (summary.onlineCaptains ?? 0) > 0
                ? "bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100/60"
                : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
            }`}
            title="الكباتن المتصلون الآن بالمنصة (تحديث فوري خلال 120 ثانية)"
          >
            <div>
              <span className="block text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span>متصل الآن</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <strong className="text-lg sm:text-xl font-black text-emerald-800">{summary.onlineCaptains ?? 0}</strong>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Activity className="w-4 h-4" />
            </div>
          </button>

          {/* Daily Active Coaches */}
          <button
            type="button"
            onClick={() => onStatusFilterChange("daily_active")}
            className={`flex items-center justify-between p-3 rounded-2xl border text-right transition cursor-pointer active:scale-95 ${
              statusFilter === "daily_active"
                ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200"
                : "bg-emerald-50/40 border-emerald-200/70 hover:bg-emerald-50/80"
            }`}
            title="الكباتن التي تستخدم الموقع بشكل يومي"
          >
            <div>
              <span className="block text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                <span>نشط يومياً</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </span>
              <strong className="text-lg sm:text-xl font-black text-emerald-800">{summary.dailyActiveCaptains ?? 0}</strong>
            </div>
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Zap className="w-4 h-4" />
            </div>
          </button>

          {/* Dormant / Never Started Coaches */}
          <button
            type="button"
            onClick={() => onStatusFilterChange("dormant")}
            className={`flex items-center justify-between p-3 rounded-2xl border text-right transition cursor-pointer active:scale-95 ${
              statusFilter === "dormant"
                ? "bg-rose-50 border-rose-300 ring-2 ring-rose-200"
                : "bg-slate-50/70 border-slate-200/80 hover:bg-rose-50/40"
            }`}
            title="كباتن سجلت ولم تبدأ الاستخدام أو غير نشطة"
          >
            <div>
              <span className="block text-[11px] font-bold text-rose-700">خامل / لم يبدأ</span>
              <strong className="text-lg sm:text-xl font-black text-rose-900">{summary.dormantCaptains ?? 0}</strong>
            </div>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
          </button>

          {/* Expiring Soon (3 days) */}
          <button
            type="button"
            onClick={() => onStatusFilterChange("expiring_soon")}
            className={`flex items-center justify-between p-3 rounded-2xl border text-right transition cursor-pointer active:scale-95 ${
              statusFilter === "expiring_soon"
                ? "bg-amber-50 border-amber-300 ring-2 ring-amber-200"
                : (summary.expiringSoonCaptains ?? 0) > 0
                ? "bg-amber-50/60 border-amber-200 hover:bg-amber-100/70"
                : "bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70"
            }`}
            title="كباتن متبقي على اشتراكها 3 أيام أو أقل"
          >
            <div>
              <span className="block text-[11px] font-bold text-amber-700">ينتهي خلال 3 أيام</span>
              <strong className="text-lg sm:text-xl font-black text-amber-900">{summary.expiringSoonCaptains ?? 0}</strong>
            </div>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
              (summary.expiringSoonCaptains ?? 0) > 0 ? "bg-amber-500 text-white animate-bounce" : "bg-amber-100 text-amber-700"
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </button>

          {/* Total Players */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <div>
              <span className="block text-[11px] font-bold text-slate-400">إجمالي الأبطال</span>
              <strong className="text-lg sm:text-xl font-black text-violet-700">{summary.totalPlayers ?? 0}</strong>
            </div>
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <User className="w-4 h-4" />
            </div>
          </div>

          {/* Total Halls */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/70 border border-slate-200/80">
            <div>
              <span className="block text-[11px] font-bold text-slate-400">صالات ومقرات</span>
              <strong className="text-lg sm:text-xl font-black text-blue-700">{summary.totalHalls ?? 0}</strong>
            </div>
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Integrated Command Bar Surface (Search + Filters + Sorting) ── */}
      <div className="p-4 sm:p-5 bg-white space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Instant Search Bar */}
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث باسم الكابتن، الأكاديمية، الهاتف، الإيميل..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-9 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 transition placeholder:text-slate-400 placeholder:font-normal"
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

          {/* Quick Date & Sort Dropdowns for Large Screens */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={dateFilter}
                onChange={(e) => onDateFilterChange && onDateFilterChange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                {dateFilterOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/80 text-xs font-bold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => onSortByChange && onSortByChange(e.target.value)}
                className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
              >
                {sortOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Status Filter Segment Chips & Results Counter */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {statusOptions.map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onStatusFilterChange(opt.id)}
                  className={`px-3 py-1.5 rounded-xl font-black shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
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

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-bold shrink-0">
            {loading ? (
              <span className="text-red-600 font-bold animate-pulse flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                جاري التحديث...
              </span>
            ) : (
              <span>عرض {captains.length} من {pagination?.total ?? captains.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Empty State ── */}
      {captains.length === 0 ? (
        <div className="p-10 sm:p-16 text-center text-slate-400 space-y-3">
          <User className="w-12 h-12 mx-auto text-slate-300" />
          <h2 className="text-sm sm:text-base font-black text-slate-700">لا توجد حسابات تطابق البحث أو الفلاتر</h2>
          <p className="text-xs text-slate-400">جرّب تغيير كلمة البحث أو اختيار فلتر آخر.</p>
          {(search || statusFilter !== "all" || dateFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                onSearchChange("");
                onStatusFilterChange("all");
                if (onDateFilterChange) onDateFilterChange("all");
              }}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition cursor-pointer"
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
            {captains.map((c) => (
              <CaptainMobileCard
                key={c.id || c._id}
                captain={c}
                onSelectCaptain={onSelectCaptain}
                onOpenActionSheet={setSelectedActionCaptain}
                copiedPhone={copiedPhone}
                onCopyPhone={handleCopyPhone}
              />
            ))}
          </div>

          {/* ═════════════════════════════════════════════════════════════════
              DESKTOP DATA TABLE (Visible on md and up)
          ═════════════════════════════════════════════════════════════════ */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/90 text-slate-500 font-black border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">الكابتن والأكاديمية</th>
                    <th className="p-4">التواصل والانضمام</th>
                    <th className="p-4">نشاط واستخدام المنصة ⚡</th>
                    <th className="p-4 text-center">اللاعبين</th>
                    <th className="p-4 text-center">الصالات</th>
                    <th className="p-4 text-center">الفعاليات</th>
                    <th className="p-4">حالة الحساب والاشتراك</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-800">
                  {captains.map((c) => (
                    <CaptainDesktopRow
                      key={c.id || c._id}
                      captain={c}
                      onSelectCaptain={onSelectCaptain}
                      onOpenExtend={onOpenExtend}
                      onTogglePayment={onTogglePayment}
                      onOpenSuspend={onOpenSuspend}
                      onOpenReactivate={onOpenReactivate}
                      onOpenDelete={onOpenDelete}
                      onOpenActionSheet={setSelectedActionCaptain}
                    />
                  ))}
                </tbody>
              </table>
            </div>

          {/* ═════════════════════════════════════════════════════════════════
              PAGINATION (Integrated directly into container footer)
          ═════════════════════════════════════════════════════════════════ */}
          {pagination?.totalPages > 1 && (
            <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-bold">
              <span className="text-slate-600">
                الصفحة <strong className="text-slate-900 font-black">{pagination.page}</strong> من <strong className="text-slate-900 font-black">{pagination.totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-black transition cursor-pointer shadow-2xs"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-slate-200 font-mono font-black text-slate-800 shadow-2xs">
                  {pagination.page} / {pagination.totalPages}
                </div>

                <button
                  type="button"
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 font-black transition cursor-pointer shadow-2xs"
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
      <CaptainActionSheet
        captain={selectedActionCaptain}
        onClose={() => setSelectedActionCaptain(null)}
        onSelectCaptain={onSelectCaptain}
        onOpenExtend={onOpenExtend}
        onTogglePayment={onTogglePayment}
        onOpenReactivate={onOpenReactivate}
        onOpenSuspend={onOpenSuspend}
        onOpenDelete={onOpenDelete}
      />

      {/* ═════════════════════════════════════════════════════════════════
          NATIVE FILTER & SORT BOTTOM SHEET (فلترة وترتيب للهاتف)
      ═════════════════════════════════════════════════════════════════ */}
      <CaptainFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sortOptions={sortOptions}
        sortBy={sortBy}
        onSortByChange={onSortByChange}
        dateFilterOptions={dateFilterOptions}
        dateFilter={dateFilter}
        onDateFilterChange={onDateFilterChange}
      />
    </div>
  );
}
