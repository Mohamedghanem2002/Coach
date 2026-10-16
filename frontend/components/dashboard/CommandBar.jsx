"use client";
import React from "react";
import {
  Search,
  CalendarDays,
  CreditCard,
  ArrowUpDown,
  Check,
  X,
  Clock,
  ShoppingBag,
  Cake,
} from "lucide-react";

export default function CommandBar({
  search = "",
  onSearchChange,
  onClearSearch,
  branch = "كل الصالات",
  onSelectBranch,
  branches = [],
  players = [],
  isAddingBranch = false,
  setIsAddingBranch,
  quickBranchName = "",
  setQuickBranchName,
  onQuickBranchSubmit,
  onOpenManageBranches,
  sessionDate,
  onSessionDateChange,
  today,
  paymentMonth,
  onPaymentMonthChange,
  sortBy = "newest",
  onSortByChange,
  statusFilter = "all",
  onStatusFilterChange,
  dashboardPlayersCount = 0,
  presentToday = 0,
  absentToday = 0,
  paidCount = 0,
  totalPendingPaymentCount = 0,
  purchasesDebtCount = 0,
  todayBirthdaysCount = 0,
}) {
  return (
    <div className="command-bar-surface p-4 sm:p-5 xl:p-6 space-y-4 rounded-2xl xl:rounded-3xl border border-slate-200/90 bg-white shadow-xs">
      {/* Row 1: Search + Branches Segment + Branch Management */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
        {/* Search Box */}
        <div className="relative flex min-h-12 min-w-0 items-center gap-2.5 rounded-xl xl:rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3.5 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-red-100 lg:w-84 xl:w-96">
          <Search className="h-4.5 w-4.5 shrink-0 text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent px-1 py-2 text-xs xl:text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث باسم اللاعب، رقم الملف، أو الهاتف..."
          />
          {search && (
            <button
              type="button"
              onClick={onClearSearch}
              className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer p-1"
            >
              ✕
            </button>
          )}
        </div>

        {/* Branch Pills */}
        <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
          <div className="flex min-w-max items-center gap-2 py-0.5">
            <button
              type="button"
              className={`whitespace-nowrap rounded-xl xl:rounded-2xl px-4 py-2.5 text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                branch === "كل الصالات"
                  ? "bg-red-600 text-white shadow-sm shadow-red-600/20 font-black"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
              }`}
              onClick={() => onSelectBranch("كل الصالات")}
            >
              كل الصالات ({players.length})
            </button>
            {branches.map((item) => {
              const count = players.filter((p) => p.branch === item.name).length;
              return (
                <button
                  type="button"
                  key={item._id}
                  className={`whitespace-nowrap rounded-xl xl:rounded-2xl px-4 py-2.5 text-xs xl:text-sm font-bold transition-all cursor-pointer ${
                    branch === item.name
                      ? "bg-red-600 text-white shadow-sm shadow-red-600/20 font-black"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
                  }`}
                  onClick={() => onSelectBranch(item.name)}
                >
                  {item.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Add Branch Inline / Manage */}
        <div className="flex items-center gap-2 shrink-0">
          {isAddingBranch ? (
            <form
              onSubmit={onQuickBranchSubmit}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-1"
            >
              <input
                value={quickBranchName}
                onChange={(e) => setQuickBranchName(e.target.value)}
                placeholder="اسم الصالة..."
                className="h-10 min-w-0 rounded-lg border border-emerald-300 bg-white px-2.5 text-right text-xs font-bold text-slate-900 outline-none w-36"
                autoFocus
                required
              />
              <button
                className="h-10 whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer"
                type="submit"
              >
                حفظ
              </button>
              <button
                className="h-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 cursor-pointer"
                type="button"
                onClick={() => setIsAddingBranch(false)}
              >
                إلغاء
              </button>
            </form>
          ) : (
            <button
              type="button"
              className="flex h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl xl:rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 text-xs xl:text-sm font-black text-emerald-800 transition hover:bg-emerald-100 cursor-pointer"
              onClick={() => setIsAddingBranch(true)}
            >
              <span>＋</span>
              <span>صالة جديدة</span>
            </button>
          )}

          <button
            type="button"
            className="flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl xl:rounded-2xl border border-slate-200/90 bg-white px-3.5 text-xs xl:text-sm font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 cursor-pointer"
            onClick={onOpenManageBranches}
          >
            <span>⚙️</span>
            <span>إدارة الفروع</span>
          </button>
        </div>
      </div>

      {/* Row 2: Date + Month + Sort + Status Filters */}
      <div className="flex flex-col 2xl:flex-row 2xl:items-center 2xl:justify-between gap-3.5 border-t border-slate-100 pt-3.5">
        {/* Date & Month & Sort */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 rounded-xl xl:rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 text-xs xl:text-sm">
            <CalendarDays className="h-4 w-4 text-red-600 shrink-0" />
            <span className="font-bold text-slate-500 shrink-0">حصة:</span>
            <input
              type="date"
              max={today}
              value={sessionDate}
              onChange={(e) => {
                if (e.target.value <= today) onSessionDateChange(e.target.value);
              }}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer text-xs xl:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl xl:rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 text-xs xl:text-sm">
            <CreditCard className="h-4 w-4 text-red-600 shrink-0" />
            <span className="font-bold text-slate-500 shrink-0">اشتراك:</span>
            <input
              type="month"
              value={paymentMonth}
              onChange={(e) => onPaymentMonthChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer text-xs xl:text-sm"
            />
          </div>

          <div className="flex items-center gap-2 rounded-xl xl:rounded-2xl border border-slate-200/90 bg-slate-50/70 px-3 py-2 text-xs xl:text-sm">
            <ArrowUpDown className="h-4 w-4 text-red-600 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer text-xs xl:text-sm"
            >
              <option value="newest">الأحدث تسجيلاً</option>
              <option value="alphabetical">الاسم أبجدياً (أ - ي)</option>
              <option value="oldest">الأقدم تسجيلاً</option>
              <option value="age-asc">السن: الأصغر أولاً</option>
              <option value="age-desc">السن: الأكبر أولاً</option>
              <option value="unpaid-first">متأخرو اشتراك الشهر أولاً</option>
              <option value="purchases-debt-first">متبقي الأدوات والمشتريات أولاً</option>
              <option value="attendance-desc">الأعلى التزاماً بالحضور</option>
            </select>
          </div>
        </div>

        {/* Fast Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            type="button"
            className={`h-9 xl:h-10 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70"
            }`}
            onClick={() => onStatusFilterChange("all")}
          >
            الكل ({dashboardPlayersCount})
          </button>
          <button
            type="button"
            className={`flex h-9 xl:h-10 items-center gap-1.5 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
              statusFilter === "present"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/70"
            }`}
            onClick={() => onStatusFilterChange("present")}
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>حاضر ({presentToday})</span>
          </button>
          <button
            type="button"
            className={`flex h-9 xl:h-10 items-center gap-1.5 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
              statusFilter === "absent"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-500/20"
                : "bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/70"
            }`}
            onClick={() => onStatusFilterChange("absent")}
          >
            <X className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>غائب ({absentToday})</span>
          </button>
          <button
            type="button"
            className={`flex h-9 xl:h-10 items-center gap-1.5 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
              statusFilter === "paid"
                ? "bg-sky-600 text-white shadow-xs shadow-sky-500/20"
                : "bg-sky-50 text-sky-800 hover:bg-sky-100 border border-sky-200/70"
            }`}
            onClick={() => onStatusFilterChange("paid")}
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>مسدد ({paidCount})</span>
          </button>
          <button
            type="button"
            className={`flex h-9 xl:h-10 items-center gap-1.5 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
              statusFilter === "unpaid"
                ? "bg-amber-600 text-white shadow-xs shadow-amber-500/20"
                : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/70"
            }`}
            onClick={() => onStatusFilterChange("unpaid")}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>متأخر ({totalPendingPaymentCount})</span>
          </button>
          {purchasesDebtCount > 0 && (
            <button
              type="button"
              className={`flex h-9 xl:h-10 items-center gap-1.5 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
                statusFilter === "purchases_debt"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300"
              }`}
              onClick={() =>
                onStatusFilterChange(
                  statusFilter === "purchases_debt" ? "all" : "purchases_debt"
                )
              }
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
              <span>أدوات ({purchasesDebtCount})</span>
            </button>
          )}
          {todayBirthdaysCount > 0 && (
            <button
              type="button"
              className={`flex h-9 xl:h-10 items-center gap-1.5 rounded-xl px-3 xl:px-3.5 text-xs xl:text-sm font-black transition-all cursor-pointer ${
                statusFilter === "birthday"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-rose-100/90 text-rose-800 hover:bg-rose-200 border border-rose-300 ring-2 ring-rose-200/80 animate-pulse"
              }`}
              onClick={() => onStatusFilterChange("birthday")}
            >
              <Cake className="h-3.5 w-3.5 text-rose-600 animate-bounce" />
              <span>عيد ميلاد ({todayBirthdaysCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
