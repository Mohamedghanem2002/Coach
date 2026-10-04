"use client";
import { useMemo } from "react";
import {
  Users,
  CalendarDays,
  CreditCard,
  Sparkles,
  RotateCcw,
  Plus,
  FileText,
  Clock,
  Compass,
  Cake,
  ChevronLeft,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  Zap,
  FileSpreadsheet,
} from "lucide-react";
import { localDate, isBranchWorkingDate } from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";

export default function DashboardHero({
  captainName = "كابتن",
  academyName = "CoachMaster",
  players = [],
  branches = [],
  branch = "كل الصالات",
  events = [],
  sessionDate,
  attendanceRateToday = 0,
  presentToday = 0,
  absentToday = 0,
  paidCount = 0,
  totalPendingPaymentCount = 0,
  purchasesDebtCount = 0,
  todayBirthdays = [],
  isCloudBackingUp = false,
  isBackingUp = false,
  isRestoring = false,
  onAddPlayer,
  onOpenAttendanceReport,
  onInstantCloudBackup,
  onRestore,
  onMarkBranchPresent,
  onOpenEvents,
  onOpenAddEvent,
  onOpenBirthdays,
  onOpenFinances,
  onFilterStatus,
  onOpenFeatures,
  onOpenExportExcel,
  hasUnreadGuide = false,
}) {
  const today = localDate();
  const firstName = (captainName || "").split(" ")[0] || "كابتن";

  const currentHeroBranch = useMemo(() => {
    if (branch && branch !== "كل الصالات") {
      return branches.find((b) => b.name === branch);
    }
    return branches[0] || null;
  }, [branches, branch]);

  const isHeroBranchWorking = useMemo(() => {
    if (!currentHeroBranch) return false;
    return isBranchWorkingDate(currentHeroBranch, sessionDate);
  }, [currentHeroBranch, sessionDate]);

  // Find next upcoming event
  const upcomingEvent = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0) return null;
    const sorted = [...events]
      .filter((e) => e.date && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0] || null;
  }, [events, today]);

  // Days remaining calculation
  const daysRemainingText = useMemo(() => {
    if (!upcomingEvent?.date) return null;
    const todayDate = new Date(today);
    const eventDate = new Date(upcomingEvent.date);
    const diffTime = eventDate - todayDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "اليوم";
    if (diffDays === 1) return "غداً";
    if (diffDays === 2) return "بعد يومين";
    if (diffDays > 2) return `بعد ${diffDays} أيام`;
    return "منتهية";
  }, [upcomingEvent, today]);

  const activeBranchPlayersCount = useMemo(() => {
    if (branch === "كل الصالات") return players.length;
    return players.filter((p) => p.branch === branch).length;
  }, [players, branch]);

  return (
    <div className="w-full space-y-3.5 mb-5 sm:mb-6 animate-fade-in" dir="rtl">
      {/* ━━━ Executive Cockpit Surface (Senior High-Density Desktop Layout) ━━━ */}
      <div className="relative overflow-hidden rounded-2xl xl:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 xl:p-7 shadow-xs hover:shadow-sm transition-all">
        {/* Subtle Ambient Brand Glow */}
        <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-rose-500/5 blur-3xl" />

        {/* Top Header Row: Greeting + Branch Status + Primary Actions */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 xl:pb-5 border-b border-slate-100">
          {/* Greeting and Academy Context */}
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/80 px-3 py-1 text-[11px] xl:text-xs font-black text-red-700 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                {academyName}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] xl:text-xs font-bold text-slate-600 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-full">
                <CalendarDays className="h-3.5 w-3.5 text-red-600" />
                حصة {sessionDate}
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] xl:text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-full">
                <MapPin className="h-3.5 w-3.5 text-slate-500" />
                {branch === "كل الصالات" ? "جميع الصالات" : `صالة ${branch}`}
              </span>
            </div>

            <div className="flex items-baseline gap-2.5 pt-0.5">
              <h2 className="font-cairo text-lg sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                أهلاً بك يا كابتن{" "}
                <span className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">
                  {firstName}
                </span>{" "}
                🥋
              </h2>
            </div>
            <p className="text-xs xl:text-sm text-slate-400 font-semibold hidden sm:block">
              المركز الميداني المباشر • متابعة الحضور والاشتراكات والفعاليات في الوقت الفعلي
            </p>
          </div>

          {/* Quick Primary Actions on Desktop (Clean, Spacious & Focused) */}
          <div className="hidden sm:flex items-center gap-2 xl:gap-2.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onAddPlayer}
              className="flex items-center gap-2 px-4 xl:px-5 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs xl:text-sm font-black shadow-xs shadow-red-600/20 active-press transition cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>تسجيل لاعب جديد</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAttendanceReport?.(branch === "كل الصالات" ? branches[0]?.name || "كل الصالات" : branch)}
              className="flex items-center gap-2 px-3.5 xl:px-4 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl border border-red-200/90 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs xl:text-sm font-black active-press transition cursor-pointer"
              title="توليد كارت تقرير غياب وحضور الصالة للمشاركة عبر واتساب"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>تقرير الحضور 📋</span>
            </button>

            {onOpenExportExcel && (
              <button
                type="button"
                onClick={() => onOpenExportExcel("players")}
                className="flex items-center gap-2 px-3.5 xl:px-4 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl border border-emerald-200/90 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs xl:text-sm font-black active-press transition cursor-pointer"
                title="تصدير بيانات اللاعبين والفعاليات إلى Excel"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>تصدير إكسيل 📊</span>
              </button>
            )}

            <button
              type="button"
              disabled={!isHeroBranchWorking}
              onClick={() => {
                if (!isHeroBranchWorking) return;
                if (branch && branch !== "كل الصالات" && onMarkBranchPresent) {
                  onMarkBranchPresent(branch);
                } else if (branches[0]?.name && onMarkBranchPresent) {
                  onMarkBranchPresent(branches[0].name);
                }
              }}
              className={`flex items-center gap-2 px-3.5 xl:px-4 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl border text-xs xl:text-sm font-black transition-all ${
                isHeroBranchWorking
                  ? "border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-900 shadow-2xs active-press cursor-pointer"
                  : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
              }`}
              title={
                isHeroBranchWorking
                  ? "تحضير جميع أبطال الصالة بضغطة واحدة"
                  : "الصالة خارج مواعيد العمل حالياً"
              }
            >
              <CheckCircle2 className={`h-4 w-4 ${isHeroBranchWorking ? "text-emerald-600" : "text-slate-400"}`} />
              <span>تحضير الصالة ⚡</span>
            </button>

            {onOpenFeatures && (
              <button
                type="button"
                onClick={onOpenFeatures}
                className="relative flex items-center gap-2 px-3.5 xl:px-4 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl border border-amber-300/90 bg-amber-50/70 hover:bg-amber-100 text-amber-900 text-xs xl:text-sm font-black shadow-2xs active-press transition cursor-pointer"
                title="دليل ومميزات المنصة للكابتن"
              >
                <Sparkles className="h-4 w-4 text-amber-600" />
                <span>دليل المنصة ✨</span>
                {hasUnreadGuide && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black text-white shadow-xs animate-bounce">
                    1
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Mobile Quick Action Bar (Grid for Phone) */}
          <div className="grid grid-cols-4 gap-1.5 pt-2 sm:hidden border-t border-slate-100">
            <button
              type="button"
              onClick={onAddPlayer}
              className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white text-[10px] font-black shadow-xs active-press cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span className="truncate">لاعب جديد</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAttendanceReport?.(branch === "كل الصالات" ? branches[0]?.name || "كل الصالات" : branch)}
              className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-red-200 bg-red-50/80 text-red-700 text-[10px] font-black active-press cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-red-600" />
              <span className="truncate">تقرير الحضور</span>
            </button>

            <button
              type="button"
              disabled={!isHeroBranchWorking}
              onClick={() => {
                if (!isHeroBranchWorking) return;
                if (branch && branch !== "كل الصالات" && onMarkBranchPresent) {
                  onMarkBranchPresent(branch);
                } else if (branches[0]?.name && onMarkBranchPresent) {
                  onMarkBranchPresent(branches[0].name);
                }
              }}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border text-[10px] font-black transition-all ${
                isHeroBranchWorking
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-800 active-press cursor-pointer hover:bg-emerald-100/80"
                  : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60"
              }`}
            >
              <CheckCircle2 className={`h-3.5 w-3.5 ${isHeroBranchWorking ? "text-emerald-600" : "text-slate-400"}`} />
              <span className="truncate">تحضير الصالة</span>
            </button>

            {onOpenFeatures ? (
              <button
                type="button"
                onClick={onOpenFeatures}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 text-amber-900 text-[10px] font-black active-press cursor-pointer"
                title="دليل المنصة"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                <span className="truncate">دليل المنصة</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onInstantCloudBackup}
                disabled={isCloudBackingUp || isBackingUp || isRestoring}
                className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-emerald-300 bg-emerald-50/80 text-emerald-800 text-[10px] font-black active-press cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                <span className="truncate">{isCloudBackingUp ? "جارٍ..." : "نسخ سحابي"}</span>
              </button>
            )}
          </div>
        </div>

        {/* ━━━ Executive Micro-KPI Grid (4 Spacious High-Impact Cards) ━━━ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 xl:gap-5 pt-4">
          {/* Card 1: Today's Attendance */}
          <div
            onClick={() => onFilterStatus?.(attendanceRateToday > 0 ? "present" : "all")}
            className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white hover:bg-white p-3.5 sm:p-4 xl:p-5 transition-all duration-200 cursor-pointer hover:border-emerald-300 hover:shadow-md"
            title="انقر لتصفية الحاضرين اليوم"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs xl:text-sm font-bold text-slate-500 group-hover:text-slate-800 transition">
                حضور اليوم
              </span>
              <div className="flex h-8 w-8 xl:h-9 xl:w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                <CheckCircle2 className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <strong className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
                  {attendanceRateToday}%
                </strong>
                <span className="text-[11px] xl:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                  {presentToday} حاضر
                </span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-600 transition" />
            </div>
            {/* Slim progress bar */}
            <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-200/80 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${attendanceRateToday}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">
              <span>غياب: {absentToday}</span>
              <span className="text-slate-500 group-hover:text-emerald-700 transition font-bold">عرض القائمة ←</span>
            </div>
          </div>

          {/* Card 2: Active Champions */}
          <div
            onClick={() => onFilterStatus?.("all")}
            className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white hover:bg-white p-3.5 sm:p-4 xl:p-5 transition-all duration-200 cursor-pointer hover:border-red-300 hover:shadow-md"
            title="انقر لعرض جميع اللاعبين"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs xl:text-sm font-bold text-slate-500 group-hover:text-slate-800 transition">
                الأبطال المقيدون
              </span>
              <div className="flex h-8 w-8 xl:h-9 xl:w-9 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200/80">
                <Users className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <strong className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
                  {activeBranchPlayersCount}
                </strong>
                <span className="text-xs font-bold text-slate-400">لاعب</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-red-600 transition" />
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span className="truncate">
                {branch === "كل الصالات" ? `${branches.length} صالات تدريب مسجلة` : `صالة ${branch}`}
              </span>
              <span className="text-red-600 font-extrabold shrink-0">نشط ✓</span>
            </div>
          </div>

          {/* Card 3: Monthly Subscriptions */}
          <div
            onClick={() => onFilterStatus?.(totalPendingPaymentCount > 0 ? "unpaid" : "all")}
            className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white hover:bg-white p-3.5 sm:p-4 xl:p-5 transition-all duration-200 cursor-pointer hover:border-amber-300 hover:shadow-md"
            title="انقر لتصفية متأخري السداد"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs xl:text-sm font-bold text-slate-500 group-hover:text-slate-800 transition">
                الاشتراكات الشهرية
              </span>
              <div className="flex h-8 w-8 xl:h-9 xl:w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200/80">
                <CreditCard className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <strong className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
                  {paidCount}
                </strong>
                <span className="text-xs font-bold text-slate-400">مسدد</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-amber-600 transition" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              {totalPendingPaymentCount > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                  <Clock className="h-3 w-3 text-amber-600" />
                  {totalPendingPaymentCount} متأخر عن السداد
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                  مكتمل السداد ✨
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Events & Celebrations */}
          <div
            onClick={todayBirthdays.length > 0 ? onOpenBirthdays : onOpenEvents}
            className="group rounded-2xl border border-slate-200/90 bg-gradient-to-b from-slate-50/60 to-white hover:bg-white p-3.5 sm:p-4 xl:p-5 transition-all duration-200 cursor-pointer hover:border-rose-300 hover:shadow-md"
            title="انقر لعرض الفعاليات أو أعياد الميلاد"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs xl:text-sm font-bold text-slate-500 group-hover:text-slate-800 transition">
                الفعاليات والمناسبات
              </span>
              <div className="flex h-8 w-8 xl:h-9 xl:w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
                {todayBirthdays.length > 0 ? (
                  <Cake className="h-4 w-4 xl:h-4.5 xl:w-4.5 text-rose-600" />
                ) : (
                  <Compass className="h-4 w-4 xl:h-4.5 xl:w-4.5 text-amber-600" />
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <strong className="text-xl sm:text-2xl xl:text-3xl font-black text-slate-900 tracking-tight">
                  {events.length}
                </strong>
                <span className="text-xs font-bold text-slate-400">فعالية</span>
              </div>
              <ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-rose-600 transition" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              {todayBirthdays.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200/80 px-2 py-0.5 rounded-md animate-pulse">
                  <Cake className="h-3 w-3" />
                  {todayBirthdays.length} عيد ميلاد اليوم!
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-slate-400 truncate">
                  {upcomingEvent ? `قادمة: ${daysRemainingText}` : "لا فعاليات قادمة"}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Inline Slim Spotlight Pill for Event or Birthday (if any exists) */}
        {(todayBirthdays.length > 0 || upcomingEvent) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs xl:text-sm">
            {todayBirthdays.length > 0 ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                <span className="font-extrabold text-rose-900 truncate">
                  أعياد ميلاد اليوم 🎉: {todayBirthdays.map((b) => b.name).join(" • ")}
                </span>
              </div>
            ) : upcomingEvent ? (
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 shrink-0" />
                <span className="font-bold text-slate-700 truncate">
                  الفعالية القادمة: <strong className="text-slate-900">{upcomingEvent.title}</strong> ({daysRemainingText}) • التاريخ: {upcomingEvent.date}
                </span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {todayBirthdays.length > 0 ? (
                <button
                  type="button"
                  onClick={onOpenBirthdays}
                  className="text-xs xl:text-sm font-black text-rose-700 hover:text-rose-900 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition active-press cursor-pointer"
                >
                  مركز الاحتفالات 🎂
                </button>
              ) : upcomingEvent ? (
                <button
                  type="button"
                  onClick={onOpenEvents}
                  className="text-xs xl:text-sm font-black text-sky-700 hover:text-sky-900 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl transition active-press cursor-pointer"
                >
                  عرض الفعالية 🏆
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
