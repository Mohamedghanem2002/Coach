"use client";
import React from "react";
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
  IdCard,
} from "lucide-react";

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
  const statusOptions = [
    { id: "all", label: "جميع الحسابات" },
    { id: "active", label: "حسابات نشطة" },
    { id: "suspended", label: "موقوفة مؤقتاً" },
    { id: "expired", label: "منتهية الصلاحية" },
    { id: "pending", label: "غير مسددة" },
  ];

  const dateFilterOptions = [
    { id: "all", label: "كل فترات الانضمام" },
    { id: "today", label: "انضموا اليوم" },
    { id: "week", label: "آخر 7 أيام" },
    { id: "month", label: "آخر 30 يوماً" },
    { id: "year", label: "هذا العام" },
  ];

  const sortOptions = [
    { id: "newest", label: "الأحدث انضماماً ⏱️" },
    { id: "oldest", label: "الأقدم انضماماً 📅" },
    { id: "players_desc", label: "الأكثر لاعبين 👥 (تنازلي)" },
    { id: "players_asc", label: "الأقل لاعبين 👥 (تصاعدي)" },
    { id: "halls_desc", label: "الأكثر صالات 🏟️ (تنازلي)" },
    { id: "halls_asc", label: "الأقل صالات 🏟️ (تصاعدي)" },
    { id: "events_desc", label: "الأكثر فعاليات 🏆 (تنازلي)" },
    { id: "events_asc", label: "الأقل فعاليات 🏆 (تصاعدي)" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" dir="rtl">
      {/* 1. TOP REAL-DATABASE SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Captains */}
        <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-linear-to-br from-red-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">إجمالي الكباتن والمدربين</span>
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <User className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalCaptains ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            حسابات كباتن مسجلة بالمنصة
          </span>
        </div>

        {/* Total Players */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-linear-to-br from-violet-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">إجمالي اللاعبين المسجلين</span>
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalPlayers ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            لاعب وبطل تحت إشراف الكباتن
          </span>
        </div>

        {/* Total Halls / Branches */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">إجمالي صالات وفروع التدريب</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalHalls ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            صالة تدريب معتمدة ونشطة
          </span>
        </div>

        {/* Total Events */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-linear-to-br from-amber-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">إجمالي الفعاليات والبطولات</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalEvents ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            فعالية وبطولة تم تنظيمها
          </span>
        </div>
      </div>

      {/* 2. SEARCH, FILTERS & SORTING CONTROLS */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        {/* Search & Actions Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث باسم الكابتن، الأكاديمية، البريد الإلكتروني، رقم الهاتف أو المعرف..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-300 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => onSortByChange && onSortByChange(e.target.value)}
                className="pr-8 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs font-black text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer appearance-none"
              >
                {sortOptions.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-black transition cursor-pointer shrink-0"
                title="تحديث البيانات"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
                <span className="hidden sm:inline">تحديث</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills (Status & Join Date) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-black text-slate-400 shrink-0 ml-1">الحالة:</span>
            {statusOptions.map((opt) => {
              const active = statusFilter === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onStatusFilterChange(opt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                    active
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Join Date Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-black text-slate-400 shrink-0 ml-1">تاريخ الانضمام:</span>
            {dateFilterOptions.map((dopt) => {
              const active = dateFilter === dopt.id;
              return (
                <button
                  key={dopt.id}
                  onClick={() => onDateFilterChange && onDateFilterChange(dopt.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-black shrink-0 transition cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {dopt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. RESULTS HEADER & COUNTER */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
        <div>
          {pagination?.total !== undefined ? (
            <span>
              عرض{" "}
              <strong className="text-slate-800 font-black">
                {captains.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              من إجمالي <strong className="text-slate-800 font-black">{pagination.total}</strong> كابتن
            </span>
          ) : (
            <span>{captains.length} كابتن مسجل</span>
          )}
        </div>

        {loading && (
          <span className="text-red-600 font-black animate-pulse flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            جارٍ استرداد البيانات من قاعدة البيانات...
          </span>
        )}
      </div>

      {/* 4. CONTENT: DESKTOP TABLE & MOBILE CARDS */}
      {captains.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center text-slate-400">
          <User className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <h3 className="text-base font-black text-slate-700 mb-1">لا يوجد كباتن يطابقون معايير البحث</h3>
          <p className="text-xs font-bold">جرّب تغيير عبارة البحث أو إزالة فلاتر التصفية</p>
        </div>
      ) : (
        <>
          {/* DESKTOP DATA TABLE (Visible on md and up) */}
          <div className="hidden md:block rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/90 text-slate-500 font-black border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">الكابتن والأكاديمية</th>
                    <th className="p-4">تاريخ الانضمام</th>
                    <th className="p-4 text-center">اللاعبين</th>
                    <th className="p-4 text-center">الصالات</th>
                    <th className="p-4 text-center">الفعاليات</th>
                    <th className="p-4">حالة الحساب</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {captains.map((c) => {
                    const isSuspended = c.subscriptionStatus === "suspended" || c.status === "suspended";
                    const isExpired = c.subscriptionStatus === "expired";

                    const formattedJoined = c.createdAt
                      ? new Intl.DateTimeFormat("ar-EG", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }).format(new Date(c.createdAt))
                      : "غير محدد";

                    const playersCount = c.stats?.players ?? c.playersCount ?? 0;
                    const hallsCount = c.stats?.halls ?? c.branchesCount ?? c.hallsCount ?? 0;
                    const eventsCount = c.stats?.events ?? c.eventsCount ?? 0;

                    return (
                      <tr key={c.id || c._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Captain Profile & Academy */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                              {(c.name || "C").charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => onSelectCaptain(c.id || c._id)}
                                className="font-black text-slate-900 hover:text-red-600 transition text-sm text-right truncate max-w-[220px] cursor-pointer block"
                              >
                                {c.name}
                              </button>
                              <span className="block text-[11px] text-red-600 font-bold truncate">
                                🏟️ {c.academyName}
                              </span>
                              <span className="block text-[10px] text-slate-400 font-mono truncate" dir="ltr">
                                {c.email} {c.phone ? `• ${c.phone}` : ""}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Exact Join Date */}
                        <td className="p-4">
                          <span className="block text-xs font-black text-slate-900">{formattedJoined}</span>
                          <span className="block text-[10px] font-bold text-slate-400 font-mono" dir="ltr">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-GB") : ""}
                          </span>
                        </td>

                        {/* Players Count Badge */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1 min-w-[70px] px-3 py-1.5 rounded-xl bg-violet-50 text-violet-800 border border-violet-200/80 font-black text-xs shadow-xs">
                            <Users className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                            <span>{playersCount}</span>
                          </span>
                        </td>

                        {/* Halls Count Badge & Mini breakdown */}
                        <td className="p-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="inline-flex items-center justify-center gap-1 min-w-[70px] px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 font-black text-xs shadow-xs">
                              <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{hallsCount}</span>
                            </span>
                            {Array.isArray(c.branchesDetails) && c.branchesDetails.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-[180px]">
                                {c.branchesDetails.slice(0, 2).map((b) => (
                                  <span
                                    key={b.id || b.name}
                                    className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px] font-bold truncate max-w-[85px]"
                                    title={`${b.name} (${b.playersCount} لاعب)`}
                                  >
                                    {b.name} ({b.playersCount})
                                  </span>
                                ))}
                                {c.branchesDetails.length > 2 && (
                                  <span className="text-[9px] text-slate-400 font-bold">
                                    +{c.branchesDetails.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Events Count Badge */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1 min-w-[70px] px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 font-black text-xs shadow-xs">
                            <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{eventsCount}</span>
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="p-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-100 text-red-700 text-[11px] font-black border border-red-200">
                              <ShieldAlert className="w-3 h-3 shrink-0" />
                              <span>موقوف مؤقتاً</span>
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-200">
                              <Clock className="w-3 h-3 shrink-0" />
                              <span>منتهي</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-200">
                              <CheckCircle className="w-3 h-3 shrink-0" />
                              <span>نشط</span>
                            </span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Details */}
                            <button
                              type="button"
                              onClick={() => onSelectCaptain(c.id || c._id)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs flex items-center gap-1 transition cursor-pointer"
                              title="عرض التفاصيل الكاملة للكابتن"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>عرض</span>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={() => onOpenDelete && onOpenDelete(c)}
                              className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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

          {/* MOBILE RESPONSIVE CARDS (Visible on mobile, hidden on md+) */}
          <div className="md:hidden space-y-3">
            {captains.map((c) => {
              const isSuspended = c.subscriptionStatus === "suspended" || c.status === "suspended";
              const isExpired = c.subscriptionStatus === "expired";

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

              return (
                <div
                  key={c.id || c._id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3"
                >
                  {/* Top Bar: Name, Academy & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                        {(c.name || "C").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-slate-900 truncate">
                          {c.name}
                        </strong>
                        <span className="block text-[11px] text-red-600 font-bold truncate">
                          🏟️ {c.academyName}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isSuspended ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black border border-red-200">
                          موقوف
                        </span>
                      ) : isExpired ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                          منتهي
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                          نشط
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Joined Date & Contact Info */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-500 font-medium">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5" />
                        تاريخ الانضمام:
                      </span>
                      <strong className="text-slate-800 font-black">{formattedJoined}</strong>
                    </div>

                    <div className="flex items-center justify-between text-slate-500 font-medium truncate pt-0.5">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Mail className="w-3.5 h-3.5" />
                        البريد:
                      </span>
                      <span className="font-mono text-slate-700 truncate" dir="ltr">
                        {c.email}
                      </span>
                    </div>

                    {c.phone && (
                      <div className="flex items-center justify-between text-slate-500 font-medium pt-0.5">
                        <span className="flex items-center gap-1 text-slate-400">
                          <Phone className="w-3.5 h-3.5" />
                          الهاتف:
                        </span>
                        <span className="font-mono text-slate-700" dir="ltr">
                          {c.phone}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 3 Prominent Statistics Badges */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-2xl bg-violet-50 border border-violet-100">
                      <span className="block text-[10px] font-black text-violet-600">اللاعبين</span>
                      <strong className="text-base font-black text-violet-900">{playersCount}</strong>
                    </div>

                    <div className="p-2 rounded-2xl bg-blue-50 border border-blue-100">
                      <span className="block text-[10px] font-black text-blue-600">الصالات</span>
                      <strong className="text-base font-black text-blue-900">{hallsCount}</strong>
                    </div>

                    <div className="p-2 rounded-2xl bg-amber-50 border border-amber-100">
                      <span className="block text-[10px] font-black text-amber-700">الفعاليات</span>
                      <strong className="text-base font-black text-amber-900">{eventsCount}</strong>
                    </div>
                  </div>

                  {/* Mobile Actions Button */}
                  <button
                    type="button"
                    onClick={() => onSelectCaptain(c.id || c._id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>عرض تفاصيل الكابتن واللاعبين</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* 5. PAGINATION CONTROLS */}
          {pagination?.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 px-2 text-xs font-bold text-slate-500">
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

                {/* Page numbers */}
                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === pagination.totalPages || Math.abs(p - pagination.page) <= 1)
                    .map((p, idx, arr) => {
                      const prev = arr[idx - 1];
                      const active = p === pagination.page;
                      return (
                        <React.Fragment key={p}>
                          {prev && p - prev > 1 && <span className="px-1 text-slate-400">...</span>}
                          <button
                            type="button"
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 rounded-xl font-black transition cursor-pointer ${
                              active
                                ? "bg-red-600 text-white shadow-xs"
                                : "hover:bg-slate-100 text-slate-700"
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}
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
    </div>
  );
}
