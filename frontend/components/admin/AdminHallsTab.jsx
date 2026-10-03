"use client";
import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Users,
  Calendar,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  User,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function AdminHallsTab({ onSelectCaptain }) {
  const [halls, setHalls] = useState([]);
  const [summary, setSummary] = useState({ totalHalls: 0, totalHallsWithPlayers: 0, filteredCount: 0 });
  const [filtersData, setFiltersData] = useState({ coaches: [] });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [coachFilter, setCoachFilter] = useState("all");
  const [hasPlayersFilter, setHasPlayersFilter] = useState("all");
  const [sortBy, setSortBy] = useState("players_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
        search,
        ownerId: coachFilter,
        hasPlayers: hasPlayersFilter,
        sortBy,
      });

      fetch(`/api/admin/halls?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data?.success) {
            setHalls(data.halls || []);
            setSummary(data.summary || { totalHalls: 0, totalHallsWithPlayers: 0, filteredCount: 0 });
            setFiltersData(data.filters || { coaches: [] });
            setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
          }
        })
        .catch((err) => {
          if (!ignore) console.error("Halls fetch error:", err);
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [currentPage, search, coachFilter, hasPlayersFilter, sortBy, refreshTrigger]);

  const handleRefresh = () => {
    setLoading(true);
    setRefreshTrigger((k) => k + 1);
  };

  const handleSearchChange = (val) => {
    setLoading(true);
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" dir="rtl">
      {/* 1. TOP SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Halls */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">إجمالي الصالات والملاعب</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalHalls ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            صالة تدريب مسجلة بالنظام
          </span>
        </div>

        {/* Halls With Players */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">صالات نشطة بها لاعبون</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalHallsWithPlayers ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            صالة تضم لاعبين وأبطال فعليين
          </span>
        </div>

        {/* Total Coaches with Halls */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-linear-to-br from-violet-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">كباتن يمتلكون فروعاً</span>
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <User className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {filtersData.coaches?.length ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            حسابات كباتن تدير مقرات تدريب
          </span>
        </div>

        {/* Total Training Spots */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-linear-to-br from-amber-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">صالات بدون لاعبين حالياً</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {Math.max(0, (summary.totalHalls ?? 0) - (summary.totalHallsWithPlayers ?? 0))}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            صالات شاغرة أو جديدة
          </span>
        </div>
      </div>

      {/* 2. SEARCH & FILTERS BAR */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ابحث باسم الصالة، الكابتن، الأكاديمية أو المعرف..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-300 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort Dropdown & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center">
              <ArrowUpDown className="w-3.5 h-3.5 absolute right-3 text-slate-400 pointer-events-none" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setCurrentPage(1);
                }}
                className="pr-8 pl-4 py-2.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs font-black text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer appearance-none"
              >
                <option value="players_desc">الأكثر لاعبين 👥</option>
                <option value="players_asc">الأقل لاعبين</option>
                <option value="newest">الأحدث إضافة ⏱️</option>
                <option value="oldest">الأقدم إضافة 📅</option>
                <option value="name_asc">اسم الصالة (أ - ي) 🔤</option>
              </select>
            </div>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-black transition cursor-pointer shrink-0"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns (Coach, Status) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
          {/* Coach Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-black shrink-0">الكابتن:</span>
            <select
              value={coachFilter}
              onChange={(e) => {
                setCoachFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer"
            >
              <option value="all">كل الكباتن ({filtersData.coaches?.length ?? 0})</option>
              {filtersData.coaches?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academyName})
                </option>
              ))}
            </select>
          </div>

          {/* Has Players Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-black shrink-0">حالة الإشغال:</span>
            <select
              value={hasPlayersFilter}
              onChange={(e) => {
                setHasPlayersFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer"
            >
              <option value="all">كل الصالات ({summary.totalHalls})</option>
              <option value="yes">صالات بها لاعبون فقط ({summary.totalHallsWithPlayers})</option>
              <option value="no">صالات شاغرة (0 لاعب)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. RESULTS COUNTER & LOADING */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
        <span>
          عرض <strong className="text-slate-800 font-black">{halls.length}</strong> من إجمالي{" "}
          <strong className="text-slate-800 font-black">{pagination.total}</strong> صالة ومقر تدريب
        </span>

        {loading && (
          <span className="text-red-600 font-black animate-pulse flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            جارٍ تحميل الصالات من قاعدة البيانات...
          </span>
        )}
      </div>

      {/* 4. CONTENT TABLE (DESKTOP) & CARDS (MOBILE) */}
      {halls.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <h3 className="text-base font-black text-slate-700 mb-1">لا توجد صالات تطابق معايير البحث</h3>
          <p className="text-xs font-bold">جرّب تغيير عبارة البحث أو إزالة الفلاتر المحددة</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/90 text-slate-500 font-black border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">اسم الصالة / الفرع</th>
                    <th className="p-4">الكابتن والأكاديمية</th>
                    <th className="p-4">أيام التدريب</th>
                    <th className="p-4 text-center">أعداد اللاعبين</th>
                    <th className="p-4">تاريخ الإضافة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {halls.map((h) => {
                    const formattedDate = h.createdAt
                      ? new Intl.DateTimeFormat("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(h.createdAt))
                      : "صالة نشطة";

                    return (
                      <tr key={h.id || h._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Hall Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-xs shrink-0">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="font-black text-slate-900 text-sm">{h.name}</span>
                          </div>
                        </td>

                        {/* Coach & Academy */}
                        <td className="p-4">
                          {h.ownerId && onSelectCaptain ? (
                            <button
                              type="button"
                              onClick={() => onSelectCaptain(h.ownerId)}
                              className="text-right hover:text-red-600 transition cursor-pointer"
                              title="عرض تفاصيل حساب الكابتن"
                            >
                              <strong className="block text-slate-900 hover:text-red-600 text-xs">
                                {h.coachName}
                              </strong>
                              <span className="block text-[11px] text-slate-400 font-bold">
                                {h.academyName}
                              </span>
                            </button>
                          ) : (
                            <div>
                              <strong className="block text-slate-900 text-xs">{h.coachName}</strong>
                              <span className="block text-[11px] text-slate-400 font-bold">
                                {h.academyName}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Schedule / Days */}
                        <td className="p-4">
                          {h.days && h.days.length > 0 ? (
                            <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{Array.isArray(h.days) ? h.days.join("، ") : h.days}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-[11px]">مواعيد عامة</span>
                          )}
                        </td>

                        {/* Players Count Badge */}
                        <td className="p-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center gap-1 min-w-[70px] px-3 py-1.5 rounded-xl font-black text-xs border ${
                              h.playersCount > 0
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-slate-100 text-slate-500 border-slate-200"
                            }`}
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>{h.playersCount}</span>
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="p-4">
                          <span className="text-xs text-slate-600">{formattedDate}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {halls.map((h) => {
              const formattedDate = h.createdAt
                ? new Intl.DateTimeFormat("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(h.createdAt))
                : "صالة نشطة";

              return (
                <div
                  key={h.id || h._id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 font-black flex items-center justify-center text-sm shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-slate-900 truncate">
                          {h.name}
                        </strong>
                        <span className="block text-[11px] text-slate-400 font-bold truncate">
                          الكابتن: {h.coachName} &bull; {h.academyName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl font-black text-xs border ${
                        h.playersCount > 0
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      }`}
                    >
                      {h.playersCount} لاعب
                    </span>
                  </div>

                  {/* Schedule & Info */}
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] flex items-center justify-between text-slate-600 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{h.days && h.days.length > 0 ? (Array.isArray(h.days) ? h.days.join("، ") : h.days) : "مواعيد عامة"}</span>
                    </div>

                    <span className="text-slate-400">{formattedDate}</span>
                  </div>
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
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700 transition cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span>السابق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => p + 1)}
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
