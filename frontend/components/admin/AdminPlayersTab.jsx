"use client";
import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Building2,
  Calendar,
  Phone,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  Filter,
  User,
  Medal,
  Award,
} from "lucide-react";

export default function AdminPlayersTab({ onSelectCaptain }) {
  const [players, setPlayers] = useState([]);
  const [summary, setSummary] = useState({ totalPlayers: 0, filteredCount: 0 });
  const [filtersData, setFiltersData] = useState({ belts: [], branches: [], coaches: [] });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
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
      belt: beltFilter,
      branch: branchFilter,
      ownerId: coachFilter,
      sortBy,
    });

    fetch(`/api/admin/players?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data?.success) {
          setPlayers(data.players || []);
          setSummary(data.summary || { totalPlayers: 0, filteredCount: 0 });
          setFiltersData(data.filters || { belts: [], branches: [], coaches: [] });
          setPagination(data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        if (!ignore) console.error("Players fetch error:", err);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentPage, search, beltFilter, branchFilter, coachFilter, sortBy, refreshTrigger]);

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
        {/* Total Players */}
        <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-linear-to-br from-violet-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">إجمالي الأبطال المسجلين</span>
            <div className="w-10 h-10 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md shadow-violet-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {summary.totalPlayers ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            لاعب عبر كافة الأكاديميات
          </span>
        </div>

        {/* Belts Count */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-100 bg-linear-to-br from-amber-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">تنوع الأحزمة والرتب</span>
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {filtersData.belts?.length ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            رتبة وحزام تدريبي مسجل
          </span>
        </div>

        {/* Branches Count */}
        <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-linear-to-br from-blue-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">صالات التدريب النشطة</span>
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {filtersData.branches?.length ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            فرع ودوجو يتدرب به اللاعبون
          </span>
        </div>

        {/* Active Coaches */}
        <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-500/10 via-white to-white p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-600">كباتن يمتلكون لاعبين</span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <User className="w-5 h-5" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {filtersData.coaches?.length ?? 0}
          </span>
          <span className="block text-[11px] font-bold text-slate-400 mt-0.5">
            حساب كابتن لديه أبطال نشطين
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
              placeholder="ابحث باسم اللاعب، الكابتن، الأكاديمية، الصالة، الحزام أو الهاتف..."
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
                <option value="newest">الأحدث تسجيلاً ⏱️</option>
                <option value="oldest">الأقدم تسجيلاً 📅</option>
                <option value="name_asc">الاسم (أ - ي) 🔤</option>
                <option value="name_desc">الاسم (ي - أ)</option>
                <option value="age_desc">العمر (الأكبر سنًا)</option>
                <option value="age_asc">العمر (الأصغر سنًا)</option>
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

        {/* Filter Dropdowns (Belt, Branch, Coach) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
          {/* Belt Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-black shrink-0">الحزام:</span>
            <select
              value={beltFilter}
              onChange={(e) => {
                setBeltFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer"
            >
              <option value="all">كل الأحزمة ({summary.totalPlayers})</option>
              {filtersData.belts?.map((b) => (
                <option key={b} value={b}>
                  حزام {b}
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-black shrink-0">الصالة:</span>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50/60 text-xs font-bold text-slate-700 outline-none focus:border-red-500 focus:bg-white transition cursor-pointer"
            >
              <option value="all">كل الصالات والفروع</option>
              {filtersData.branches?.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>

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
              <option value="all">كل الكباتن</option>
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
          عرض <strong className="text-slate-800 font-black">{players.length}</strong> من إجمالي{" "}
          <strong className="text-slate-800 font-black">{pagination.total}</strong> لاعب مسجل
        </span>

        {loading && (
          <span className="text-red-600 font-black animate-pulse flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            جارٍ تحميل اللاعبين من قاعدة البيانات...
          </span>
        )}
      </div>

      {/* 4. CONTENT TABLE (DESKTOP) & CARDS (MOBILE) */}
      {players.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center text-slate-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
          <h3 className="text-base font-black text-slate-700 mb-1">لا يوجد لاعبين يطابقون معايير البحث</h3>
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
                    <th className="p-4">اسم البطل</th>
                    <th className="p-4">الكابتن والأكاديمية</th>
                    <th className="p-4">صالة التدريب</th>
                    <th className="p-4 text-center">الحزام</th>
                    <th className="p-4 text-center">العمر</th>
                    <th className="p-4">الهاتف</th>
                    <th className="p-4">تاريخ التسجيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {players.map((p) => {
                    const formattedDate = p.createdAt
                      ? new Intl.DateTimeFormat("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(p.createdAt))
                      : "غير محدد";

                    return (
                      <tr key={p.id || p._id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Player Name */}
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-800 font-black flex items-center justify-center text-xs shrink-0">
                              🥋
                            </div>
                            <span className="font-black text-slate-900 text-sm">{p.name}</span>
                          </div>
                        </td>

                        {/* Coach & Academy */}
                        <td className="p-4">
                          {p.ownerId && onSelectCaptain ? (
                            <button
                              type="button"
                              onClick={() => onSelectCaptain(p.ownerId)}
                              className="text-right hover:text-red-600 transition cursor-pointer"
                              title="عرض تفاصيل حساب الكابتن"
                            >
                              <strong className="block text-slate-900 hover:text-red-600 text-xs">
                                {p.coachName}
                              </strong>
                              <span className="block text-[11px] text-slate-400 font-bold">
                                {p.academyName}
                              </span>
                            </button>
                          ) : (
                            <div>
                              <strong className="block text-slate-900 text-xs">{p.coachName}</strong>
                              <span className="block text-[11px] text-slate-400 font-bold">
                                {p.academyName}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Branch / Hall */}
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{p.branch}</span>
                          </span>
                        </td>

                        {/* Belt Badge */}
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-xl bg-violet-50 text-violet-900 border border-violet-200/80 font-black text-xs">
                            {p.belt}
                          </span>
                        </td>

                        {/* Age */}
                        <td className="p-4 text-center">
                          <span className="text-slate-700">{p.age ? `${p.age} سنة` : "-"}</span>
                        </td>

                        {/* Phone */}
                        <td className="p-4">
                          <span className="font-mono text-slate-600 text-xs" dir="ltr">
                            {p.phone || "-"}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="p-4">
                          <span className="block text-xs font-bold text-slate-700">{formattedDate}</span>
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
            {players.map((p) => {
              const formattedDate = p.createdAt
                ? new Intl.DateTimeFormat("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }).format(new Date(p.createdAt))
                : "غير محدد";

              return (
                <div
                  key={p.id || p._id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-800 font-black flex items-center justify-center text-sm shrink-0">
                        🥋
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-slate-900 truncate">
                          {p.name}
                        </strong>
                        <span className="block text-[11px] text-slate-400 font-bold truncate">
                          الكابتن: {p.coachName} &bull; {p.academyName}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-xl bg-violet-50 text-violet-900 border border-violet-200/80 font-black text-xs shrink-0">
                      حزام {p.belt}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] grid grid-cols-2 gap-2 text-slate-600 font-bold">
                    <div className="flex items-center gap-1.5 truncate">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{p.branch}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formattedDate}</span>
                    </div>

                    {p.age && (
                      <div>
                        <span className="text-slate-400">العمر: </span>
                        <span>{p.age} سنة</span>
                      </div>
                    )}

                    {p.phone && (
                      <div className="truncate font-mono" dir="ltr">
                        {p.phone}
                      </div>
                    )}
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
