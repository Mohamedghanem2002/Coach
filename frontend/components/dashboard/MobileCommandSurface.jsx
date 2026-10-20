"use client";
import React from "react";
import {
  FileText,
  FileSpreadsheet,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Check,
  X,
  CreditCard,
  Clock,
  ShoppingBag,
  Cake,
  CheckCircle2,
} from "lucide-react";

export default function MobileCommandSurface({
  attendanceRateToday = 0,
  presentToday = 0,
  absentToday = 0,
  paidCount = 0,
  totalPendingPaymentCount = 0,
  partialCount = 0,
  purchasesDebtCount = 0,
  todayBirthdaysCount = 0,
  dashboardPlayers = [],
  branch = "كل الصالات",
  setBranch,
  branches = [],
  players = [],
  sessionDate,
  setSessionDate,
  today,
  paymentMonth,
  setPaymentMonth,
  currentMonth,
  sortBy = "newest",
  setSortBy,
  statusFilter = "all",
  setStatusFilter,
  search = "",
  setSearch,
  showMobileFilters = false,
  setShowMobileFilters,
  onOpenAttendanceReport,
  onOpenExportExcel,
  onOpenFeatures,
  hasUnreadGuide = false,
  onInstantCloudBackup,
  isCloudBackingUp = false,
  onRestore,
  isRestoring = false,
  onDownloadBackup,
  isBackingUp = false,
  onNavigateToBirthdays,
  onToggleFilteredSelection,
}) {
  return (
    <div className="space-y-1.5 mb-2">
      {/* شريط مؤشر حضور اليوم السريع للموبايل */}
      <div className="flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          <span className="text-[11px] font-black text-slate-800 shrink-0">
            حضور اليوم:
          </span>
          <span className="text-[11px] font-black text-emerald-700 shrink-0">
            {attendanceRateToday}%
          </span>
          <span className="text-[10px] font-bold text-slate-400 truncate">
            ({presentToday} من {dashboardPlayers.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            onOpenAttendanceReport(
              branch === "كل الصالات" ? branches[0]?.name || "كل الصالات" : branch
            )
          }
          className="shrink-0 flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200/80 px-2 py-0.5 text-[10px] font-black transition active-press cursor-pointer touch-manipulation"
          title="توليد كارت تقرير غياب وحضور الصالة للواتساب"
        >
          <FileText className="h-2.5 w-2.5 text-red-600 shrink-0" />
          <span>تقرير الحضور 📋</span>
        </button>
      </div>

      {/* شريط الإجراءات والخدمات السريعة للموبايل (Mobile Primary Actions & Cloud Hub) */}
      <div className="grid grid-cols-2 gap-1.5">
        {/* 1. زر تصدير إكسيل بارز للموبايل */}
        <button
          type="button"
          id="mobile-main-excel-btn"
          onClick={() => onOpenExportExcel("players")}
          className="flex items-center justify-center gap-1 h-8 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-[11px] font-black shadow-xs active-press transition cursor-pointer touch-manipulation"
          title="تصدير كشف اللاعبين والفعاليات إلى Excel"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-white shrink-0" />
          <span className="truncate">تصدير إكسيل 📊</span>
        </button>

        {/* 2. زر دليل المنصة للموبايل */}
        <button
          type="button"
          id="mobile-main-guide-btn"
          onClick={onOpenFeatures}
          className="relative flex items-center justify-center gap-1 h-8 px-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-[11px] font-black shadow-2xs active-press transition cursor-pointer touch-manipulation"
          title="دليل ومميزات المنصة للكابتن"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="truncate">دليل المنصة ✨</span>
          {hasUnreadGuide && (
            <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-600 px-1 text-[8.5px] font-black text-white shadow-xs animate-bounce">
              1
            </span>
          )}
        </button>
      </div>

      {/* شريط أدوات النسخ الاحتياطي السحابي والاستعادة للموبايل */}
      <div className="grid grid-cols-3 gap-1">
        <button
          type="button"
          id="mobile-cloud-backup-btn"
          onClick={onInstantCloudBackup}
          disabled={isCloudBackingUp || isBackingUp || isRestoring}
          className="flex items-center justify-center gap-1 h-7.5 px-1 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-300 text-emerald-900 text-[10px] font-extrabold shadow-2xs active-press transition cursor-pointer touch-manipulation disabled:opacity-50"
          title="حفظ نسخة سحابية فورية بحسابك (Gmail)"
        >
          <Sparkles className={`h-2.5 w-2.5 text-emerald-600 shrink-0 ${isCloudBackingUp ? "animate-spin" : ""}`} />
          <span className="truncate">{isCloudBackingUp ? "جارٍ..." : "نسخ سحابي ☁️"}</span>
        </button>

        <button
          type="button"
          id="mobile-restore-btn"
          onClick={onRestore}
          disabled={isRestoring || isBackingUp || isCloudBackingUp}
          className="flex items-center justify-center gap-1 h-7.5 px-1 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 border border-amber-300 text-amber-950 text-[10px] font-extrabold shadow-2xs active-press transition cursor-pointer touch-manipulation disabled:opacity-50"
          title="استعادة البيانات من نسخة سحابية أو ملف"
        >
          <RotateCcw className={`h-2.5 w-2.5 text-amber-600 shrink-0 ${isRestoring ? "animate-spin" : ""}`} />
          <span className="truncate">{isRestoring ? "جارٍ..." : "استعادة نسخة 🔄"}</span>
        </button>

        <button
          type="button"
          id="mobile-local-backup-btn"
          onClick={onDownloadBackup}
          disabled={isBackingUp || isRestoring}
          className="flex items-center justify-center gap-1 h-7.5 px-1 rounded-lg bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 text-[10px] font-extrabold shadow-2xs active-press transition cursor-pointer touch-manipulation disabled:opacity-50"
          title="تنزيل نسخة احتياطية محلية بصيغة JSON على جهازك"
        >
          <ShieldCheck className={`h-2.5 w-2.5 text-blue-600 shrink-0 ${isBackingUp ? "animate-spin" : ""}`} />
          <span className="truncate">{isBackingUp ? "جارٍ..." : "نسخ محلي 💾"}</span>
        </button>
      </div>

      {/* Row 1: Search Bar + Integrated Branch Selector + Advanced Filters Button */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 flex h-9 min-h-[36px] items-center gap-1.5 rounded-xl border border-slate-200/90 bg-white px-2.5 shadow-2xs focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-100 transition-all">
          <Search className="h-3.5 w-3.5 shrink-0 text-slate-400" />
          <input
            className="min-w-0 flex-1 bg-transparent py-1 text-xs text-slate-900 outline-none placeholder:text-slate-400 placeholder:text-[11px] font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم البطل، رقم الملف، أو الهاتف..."
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-slate-100 text-[9px] text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Branch Quick Dropdown Selector */}
        <div className="relative shrink-0">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/90 bg-white pr-2 pl-5 text-[11px] font-black text-slate-800 shadow-2xs outline-none focus:border-red-500 focus:ring-1 focus:ring-red-100 cursor-pointer appearance-none touch-manipulation max-w-[110px] truncate"
            title="تصفية حسب صالة التدريب"
          >
            <option value="كل الصالات">كل الصالات ({players.length})</option>
            {branches.map((b) => {
              const count = players.filter((p) => p.branch === b.name).length;
              return (
                <option key={b._id} value={b.name}>
                  {b.name} ({count})
                </option>
              );
            })}
          </select>
          <ChevronDown className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
        </div>

        {/* Filter Options & Date Button */}
        <button
          type="button"
          onClick={() => setShowMobileFilters(true)}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition active-press cursor-pointer touch-manipulation ${
            sortBy !== "newest" || sessionDate !== today || paymentMonth !== currentMonth
              ? "border-red-300 bg-red-50 text-red-600 shadow-xs ring-1 ring-red-200/50"
              : "border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50"
          }`}
          title="تخصيص الفلاتر والترتيب وتاريخ الحصة"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Row 2: Swipeable Horizontal Filter Capsules with Live Counts */}
      <div className="w-full max-w-full min-w-0 flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 touch-scroll">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
            statusFilter === "all"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <span>الكل</span>
          <span
            className={`text-[9.5px] px-1 py-0.2 rounded-full ${
              statusFilter === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {dashboardPlayers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "present" ? "all" : "present")}
          className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
            statusFilter === "present"
              ? "bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-300"
              : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
          }`}
        >
          <Check className="h-2.5 w-2.5 stroke-[3]" />
          <span>حاضر</span>
          <span
            className={`text-[9.5px] px-1 py-0.2 rounded-full ${
              statusFilter === "present" ? "bg-white/25 text-white" : "bg-emerald-100 text-emerald-800"
            }`}
          >
            {presentToday}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "absent" ? "all" : "absent")}
          className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
            statusFilter === "absent"
              ? "bg-rose-600 text-white shadow-xs ring-1 ring-rose-300"
              : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
          }`}
        >
          <X className="h-2.5 w-2.5 stroke-[3]" />
          <span>غائب</span>
          <span
            className={`text-[9.5px] px-1 py-0.2 rounded-full ${
              statusFilter === "absent" ? "bg-white/25 text-white" : "bg-rose-100 text-rose-800"
            }`}
          >
            {absentToday}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "paid" ? "all" : "paid")}
          className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
            statusFilter === "paid"
              ? "bg-sky-600 text-white shadow-xs ring-1 ring-sky-300"
              : "bg-white text-sky-800 border border-sky-200 hover:bg-sky-50"
          }`}
        >
          <CreditCard className="h-2.5 w-2.5" />
          <span>مسدد</span>
          <span
            className={`text-[9.5px] px-1 py-0.2 rounded-full ${
              statusFilter === "paid" ? "bg-white/25 text-white" : "bg-sky-100 text-sky-800"
            }`}
          >
            {paidCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === "unpaid" ? "all" : "unpaid")}
          className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
            statusFilter === "unpaid"
              ? "bg-amber-600 text-white shadow-xs ring-1 ring-amber-300"
              : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
          }`}
        >
          <Clock className="h-2.5 w-2.5" />
          <span>متأخر</span>
          <span
            className={`text-[9.5px] px-1 py-0.2 rounded-full ${
              statusFilter === "unpaid" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-900"
            }`}
          >
            {totalPendingPaymentCount}
          </span>
        </button>

        {partialCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "partially_paid" ? "all" : "partially_paid")}
            className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
              statusFilter === "partially_paid"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-50"
            }`}
          >
            <span>دفع جزئي</span>
            <span
              className={`text-[9.5px] px-1 py-0.2 rounded-full ${
                statusFilter === "partially_paid" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-900"
              }`}
            >
              {partialCount}
            </span>
          </button>
        )}

        {purchasesDebtCount > 0 && (
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === "purchases_debt" ? "all" : "purchases_debt")}
            className={`shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation ${
              statusFilter === "purchases_debt"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-50"
            }`}
          >
            <ShoppingBag className="h-2.5 w-2.5 text-amber-600" />
            <span>أدوات</span>
            <span
              className={`text-[9.5px] px-1 py-0.2 rounded-full ${
                statusFilter === "purchases_debt" ? "bg-white/25 text-white" : "bg-amber-100 text-amber-900"
              }`}
            >
              {purchasesDebtCount}
            </span>
          </button>
        )}

        {todayBirthdaysCount > 0 && (
          <button
            type="button"
            onClick={onNavigateToBirthdays}
            className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-black transition-all active-press min-h-[28px] h-7 cursor-pointer touch-manipulation bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs hover:shadow-sm ring-1 ring-rose-300/70 animate-pulse"
          >
            <Cake className="h-3 w-3 text-white animate-bounce" />
            <span>أعياد الميلاد</span>
            <span className="text-[9.5px] px-1 py-0.2 rounded-full bg-white text-rose-700 font-black">
              {todayBirthdaysCount}
            </span>
          </button>
        )}
      </div>



      {/* نافذة الفلاتر السفلية المنبثقة للموبايل (Mobile Bottom Sheet) */}
      {showMobileFilters && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-xs animate-backdrop"
          onClick={() => setShowMobileFilters(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xl space-y-4 animate-bottom-sheet sm:animate-fade-in-scale pb-safe"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="sheet-drag-handle sm:hidden" />

            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <span className="font-cairo text-sm font-black text-slate-900">خيارات متقدمة وتاريخ الحصة</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-600">تاريخ الحصة</span>
                  <button
                    type="button"
                    onClick={() => setSessionDate(today)}
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                      sessionDate === today ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    اليوم
                  </button>
                </div>
                <input
                  type="date"
                  max={today}
                  value={sessionDate}
                  onChange={(e) => {
                    if (e.target.value <= today) setSessionDate(e.target.value);
                  }}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-600">شهر الاشتراك</span>
                  <button
                    type="button"
                    onClick={() => setPaymentMonth(currentMonth)}
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md transition cursor-pointer ${
                      paymentMonth === currentMonth ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    الشهر الحالي
                  </button>
                </div>
                <input
                  type="month"
                  value={paymentMonth}
                  onChange={(e) => setPaymentMonth(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white"
                />
              </label>
            </div>

            <div>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-extrabold text-slate-600">ترتيب عرض اللاعبين</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white cursor-pointer"
                >
                  <option value="newest">الأحدث تسجيلاً (افتراضي)</option>
                  <option value="alphabetical">الاسم أبجدياً (أ - ي)</option>
                  <option value="oldest">الأقدم تسجيلاً</option>
                  <option value="age-asc">السن: الأصغر أولاً</option>
                  <option value="age-desc">السن: الأكبر أولاً</option>
                  <option value="unpaid-first">متأخرو اشتراك الشهر أولاً</option>
                  <option value="purchases-debt-first">متبقي الأدوات والمشتريات أولاً</option>
                  <option value="attendance-desc">الأعلى التزاماً بالحضور</option>
                </select>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onToggleFilteredSelection();
                  setShowMobileFilters(false);
                }}
                className="w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-black text-slate-800 active:scale-95 transition cursor-pointer"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>تحديد كل المعروض للتحضير السريع</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowMobileFilters(false)}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 font-cairo text-xs font-black text-white active:scale-98 transition cursor-pointer shadow-sm"
              >
                تطبيق الفلاتر وإغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
