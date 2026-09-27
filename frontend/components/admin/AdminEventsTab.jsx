"use client";
import React, { useState, useEffect } from "react";
import {
  Trophy,
  Search,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Clock,
  CheckCircle2,
  MapPin,
} from "lucide-react";

export default function AdminEventsTab({ onSelectCaptain }) {
  const [events, setEvents] = useState([]);
  const [summary, setSummary] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    completedEvents: 0,
    filteredCount: 0,
  });
  const [filtersData, setFiltersData] = useState({ coaches: [] });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: "15",
      search,
      status: statusFilter,
      ownerId: coachFilter,
      sortBy,
    });

    fetch(`/api/admin/events?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data?.success) {
          setEvents(data.events || []);
          setSummary(
            data.summary || {
              totalEvents: 0,
              upcomingEvents: 0,
              completedEvents: 0,
              filteredCount: 0,
            }
          );
          setFiltersData(data.filters || { coaches: [] });
          setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        if (!ignore) console.error("Events fetch error:", err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentPage, search, statusFilter, coachFilter, sortBy, refreshTrigger]);

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

        {/* Upcoming Events */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">فعاليات قادمة ونشطة</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.upcomingEvents ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            فعاليات لم تنتهِ مواعيدها بعد
          </span>
        </div>

        {/* Completed Events */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">فعاليات وبطولات منتهية</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.completedEvents ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            فعاليات سابقة مكتملة
          </span>
        </div>

        {/* Total Organizers */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-linear-to-br from-violet-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">كباتن منظمين لفعاليات</span>
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {filtersData.coaches?.length ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            حسابات نظمت بطولات أو رحلات
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
              placeholder="ابحث باسم الفعالية، الكابتن، الأكاديمية، المكان أو التاريخ..."
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
                <option value="newest">الأحدث إنشاءً ⏱️</option>
                <option value="date_desc">تاريخ الفعالية (الأحدث)</option>
                <option value="date_asc">تاريخ الفعالية (الأقدم)</option>
                <option value="participants_desc">الأكثر مشاركين 👥</option>
                <option value="fee_desc">الأعلى رسوماً 💰</option>
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

        {/* Filter Dropdowns (Status, Coach) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-black shrink-0">حالة الفعالية:</span>
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: "all", label: "جميع الفعاليات" },
                { id: "upcoming", label: "قادمة ونشطة ⏱️" },
                { id: "completed", label: "منتهية ومكتملة ✓" },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setStatusFilter(opt.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
                    statusFilter === opt.id
                      ? "bg-amber-500 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Coach Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-black shrink-0">الكابتن المنظم:</span>
            <select
              value={coachFilter}
              onChange={(e) => {
                setCoachFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer"
            >
              <option value="all">كل الكباتن المنظمين ({filtersData.coaches?.length ?? 0})</option>
              {filtersData.coaches?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.academyName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 3. RESULTS COUNTER & LOADING */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
        <span>
          عرض <strong className="text-slate-800 font-black">{events.length}</strong> من إجمالي{" "}
          <strong className="text-slate-800 font-black">{pagination.total}</strong> فعالية وبطولة
        </span>

        {loading && (
          <span className="text-red-600 font-black animate-pulse flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            جارٍ تحميل الفعاليات من قاعدة البيانات...
          </span>
        )}
      </div>

      {/* 4. CONTENT TABLE (DESKTOP) & CARDS (MOBILE) */}
      {events.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center text-slate-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <h3 className="text-base font-black text-slate-700 mb-1">لا توجد فعاليات تطابق معايير البحث</h3>
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
                    <th className="p-4">اسم الفعالية / البطولة</th>
                    <th className="p-4">الكابتن والأكاديمية</th>
                    <th className="p-4">تاريخ الموعد</th>
                    <th className="p-4">الحالة</th>
                    <th className="p-4 text-center">المشاركون</th>
                    <th className="p-4 text-center">رسوم الاشتراك</th>
                    <th className="p-4">تاريخ الإنشاء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {events.map((e) => {
                    const formattedCreated = e.createdAt
                      ? new Intl.DateTimeFormat("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(e.createdAt))
                      : "-";

                    return (
                      <tr key={e.id || e._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Event Title */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-xs shrink-0">
                              <Trophy className="w-4 h-4" />
                            </div>
                            <span className="font-black text-slate-900 text-sm">{e.title}</span>
                          </div>
                        </td>

                        {/* Coach & Academy */}
                        <td className="p-4">
                          {e.ownerId && onSelectCaptain ? (
                            <button
                              type="button"
                              onClick={() => onSelectCaptain(e.ownerId)}
                              className="text-right hover:text-red-600 transition cursor-pointer"
                              title="عرض تفاصيل حساب الكابتن"
                            >
                              <strong className="block text-slate-900 hover:text-red-600 text-xs">
                                {e.coachName}
                              </strong>
                              <span className="block text-[11px] text-slate-400 font-bold">
                                {e.academyName}
                              </span>
                            </button>
                          ) : (
                            <div>
                              <strong className="block text-slate-900 text-xs">{e.coachName}</strong>
                              <span className="block text-[11px] text-slate-400 font-bold">
                                {e.academyName}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Event Date */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 text-slate-800 font-black">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{e.date || "غير محدد"}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-black border ${
                              e.status === "upcoming"
                                ? "bg-blue-50 text-blue-800 border-blue-200"
                                : "bg-emerald-50 text-emerald-800 border-emerald-200"
                            }`}
                          >
                            {e.status === "upcoming" ? (
                              <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                            )}
                            <span>{e.statusLabel}</span>
                          </span>
                        </td>

                        {/* Participants Count */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1 min-w-[70px] px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 font-black text-xs">
                            <Users className="w-3.5 h-3.5" />
                            <span>{e.participantsCount}</span>
                          </span>
                        </td>

                        {/* Fee */}
                        <td className="p-4 text-center">
                          <span className="text-slate-900 font-black text-xs">
                            {e.fee > 0 ? `${e.fee} ج.م` : "مجانية"}
                          </span>
                        </td>

                        {/* Created Date */}
                        <td className="p-4">
                          <span className="text-xs text-slate-500">{formattedCreated}</span>
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
            {events.map((e) => {
              const formattedCreated = e.createdAt
                ? new Intl.DateTimeFormat("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(e.createdAt))
                : "-";

              return (
                <div
                  key={e.id || e._id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center text-sm shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-slate-900 truncate">
                          {e.title}
                        </strong>
                        <span className="block text-[11px] text-slate-400 font-bold truncate">
                          الكابتن: {e.coachName} &bull; {e.academyName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                        e.status === "upcoming"
                          ? "bg-blue-50 text-blue-800 border-blue-200"
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {e.statusLabel}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] grid grid-cols-2 gap-2 text-slate-600 font-bold">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{e.date || "غير محدد"}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{e.participantsCount} مشارك</span>
                    </div>

                    <div>
                      <span className="text-slate-400">الرسوم: </span>
                      <strong className="text-slate-800">{e.fee > 0 ? `${e.fee} ج.م` : "مجانية"}</strong>
                    </div>

                    <div className="text-slate-400 text-[10px]">إنشاء: {formattedCreated}</div>
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
