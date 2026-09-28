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
} from "lucide-react";
import { localDate } from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";

export default function DashboardHero({
  captainName = "كابتن",
  academyName = "أكاديمية Re_action",
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
}) {
  const today = localDate();
  const firstName = (captainName || "").split(" ")[0] || "كابتن";

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
    <div className="w-full space-y-3.5 sm:space-y-5 mb-4 sm:mb-6 animate-fade-in" dir="rtl">
      {/* ━━━ 1. Captain Welcome Banner + Live Status ━━━ */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs">
        {/* Decorative ambient gradient backdrop */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-44 w-44 rounded-full bg-red-500/8 blur-2xl" />
        <div className="pointer-events-none absolute -right-12 -bottom-12 h-44 w-44 rounded-full bg-rose-500/8 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Welcome Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/80 px-2.5 py-0.5 text-[11px] font-black text-red-700">
                <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                {academyName}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500">
                <CalendarDays className="h-3 w-3 text-slate-400" />
                حصة {sessionDate}
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h2 className="font-cairo text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                أهلاً بك يا كابتن{" "}
                <span className="bg-gradient-to-r from-red-600 to-rose-700 bg-clip-text text-transparent">
                  {firstName}
                </span>{" "}
                🥋
              </h2>
            </div>

            <p className="text-xs text-slate-500 font-semibold leading-relaxed max-w-xl">
              لوحة التحكم الذكية — متابعة حضور أبطال الكاراتيه، السداد الشهري، والفعاليات في{" "}
              <strong className="text-slate-700 font-bold">
                {branch === "كل الصالات" ? "جميع الصالات" : `صالة ${branch}`}
              </strong>
              .
            </p>
          </div>

          {/* Quick Primary Actions (Desktop View) */}
          <div className="hidden sm:flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={onAddPlayer}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-black shadow-sm shadow-red-600/25 active-press transition cursor-pointer"
            >
              <Plus className="h-4 w-4 stroke-[3]" />
              <span>تسجيل لاعب جديد</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenAttendanceReport?.(branch === "كل الصالات" ? branches[0]?.name || "كل الصالات" : branch)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-red-200/90 bg-red-50/70 hover:bg-red-100 text-red-700 text-xs font-black active-press transition cursor-pointer"
              title="توليد كارت تقرير غياب وحضور الصالة للمشاركة عبر واتساب"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>تقرير الحضور</span>
            </button>

            <button
              type="button"
              onClick={onInstantCloudBackup}
              disabled={isCloudBackingUp || isBackingUp || isRestoring}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-800 text-xs font-black shadow-2xs active-press transition cursor-pointer"
              title="حفظ نسخة سحابية فورية بضغطة واحدة"
            >
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>{isCloudBackingUp ? "جارٍ النسخ..." : "نسخ سحابي"}</span>
            </button>
          </div>
        </div>

        {/* ━━━ Mobile Quick Action Bar (Grid for Phone) ━━━ */}
        <div className="grid grid-cols-4 gap-2 pt-3 sm:hidden border-t border-slate-100 mt-3">
          <button
            type="button"
            onClick={onAddPlayer}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 text-white text-[11px] font-black shadow-xs active-press cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="truncate">لاعب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenAttendanceReport?.(branch === "كل الصالات" ? branches[0]?.name || "كل الصالات" : branch)}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-red-200 bg-red-50/80 text-red-700 text-[11px] font-black active-press cursor-pointer"
          >
            <FileText className="h-4 w-4 text-red-600" />
            <span className="truncate">تقرير الحضور</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (branch && branch !== "كل الصالات" && onMarkBranchPresent) {
                onMarkBranchPresent(branch);
              } else if (branches[0]?.name && onMarkBranchPresent) {
                onMarkBranchPresent(branches[0].name);
              }
            }}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-[11px] font-black active-press cursor-pointer"
            title="تحضير جميع أبطال الصالة بضغطة واحدة"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="truncate">تحضير الصالة</span>
          </button>

          <button
            type="button"
            onClick={onInstantCloudBackup}
            disabled={isCloudBackingUp || isBackingUp || isRestoring}
            className="flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-[11px] font-black active-press cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span className="truncate">{isCloudBackingUp ? "جارٍ..." : "نسخ سحابي"}</span>
          </button>
        </div>
      </div>

      {/* ━━━ 2. High-Impact Metrics Grid (Key Metrics) ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* Metric 1: Today's Attendance */}
        <div className="card card-interactive p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500">
              حضور اليوم
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/80">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {attendanceRateToday}%
              </strong>
              <span className="text-[11px] font-bold text-slate-400">
                ({presentToday} حاضر)
              </span>
            </div>
            {/* Visual progress track */}
            <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${attendanceRateToday}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Total Active Champions */}
        <div className="card card-interactive p-3.5 sm:p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500">
              الأبطال المقيدون
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-200/80">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {activeBranchPlayersCount}
              </strong>
              <span className="text-[11px] font-bold text-slate-400">
                لاعب
              </span>
            </div>
            <p className="mt-1 text-[10px] font-semibold text-slate-400 truncate">
              {branch === "كل الصالات" ? `${branches.length} صالات تدريب` : `صالة ${branch}`}
            </p>
          </div>
        </div>

        {/* Metric 3: Subscriptions Status (Paid vs Pending) */}
        <div
          onClick={() => onFilterStatus?.(totalPendingPaymentCount > 0 ? "unpaid" : "all")}
          className="card card-interactive p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group"
          title="اضغط لتصفية المتأخرين عن السداد"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500">
              الاشتراكات الشهرية
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-200/80">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {paidCount}
              </strong>
              <span className="text-[11px] font-bold text-slate-400">مسدد</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              {totalPendingPaymentCount > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                  <Clock className="h-2.5 w-2.5" />
                  {totalPendingPaymentCount} متأخر
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-600">
                  مكتمل السداد ✨
                </span>
              )}
              <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition" />
            </div>
          </div>
        </div>

        {/* Metric 4: Events & Celebrations */}
        <div
          onClick={onOpenEvents}
          className="card card-interactive p-3.5 sm:p-4 flex flex-col justify-between cursor-pointer group"
          title="اضغط لعرض الفعاليات والبطولات"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-bold text-slate-500">
              الفعاليات والأنشطة
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-200/80">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <strong className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {events.length}
              </strong>
              <span className="text-[11px] font-bold text-slate-400">فعالية</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              {todayBirthdays.length > 0 ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md animate-pulse">
                  <Cake className="h-2.5 w-2.5" />
                  {todayBirthdays.length} عيد ميلاد اليوم!
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-slate-400">
                  {upcomingEvent ? `قادمة: ${daysRemainingText}` : "لا فعاليات قادمة"}
                </span>
              )}
              <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition" />
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ 3. Upcoming Event Spotlight (الفعاليات القادمة) ━━━ */}
      {upcomingEvent && (
        <div className="relative overflow-hidden rounded-2xl border border-sky-200/80 bg-gradient-to-r from-sky-50/70 via-white to-blue-50/50 p-3.5 sm:p-4 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white shadow-xs">
                <Compass className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-sm font-black text-slate-900 truncate">
                    {upcomingEvent.title}
                  </strong>
                  <span className="rounded-full bg-sky-100 border border-sky-200 px-2 py-0.5 text-[10px] font-black text-sky-800">
                    {daysRemainingText}
                  </span>
                  {upcomingEvent.type === "belt_exam" && (
                    <span className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
                      اختبار حزام 🥋
                    </span>
                  )}
                  {upcomingEvent.type === "tournament" && (
                    <span className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-black text-red-800">
                      بطولة 🏆
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500 font-semibold truncate">
                  التاريخ: {upcomingEvent.date}
                  {upcomingEvent.location ? ` • المكان: ${upcomingEvent.location}` : ""}
                  {upcomingEvent.fee ? ` • الرسوم: ${upcomingEvent.fee} ج.م` : ""}
                  {` • المشاركون: ${(upcomingEvent.participants || []).length} بطل`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={onOpenEvents}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-black shadow-xs active-press transition cursor-pointer"
              >
                <span>عرض الفعالية والمشاركين</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ 4. Today's Birthday Spotlight Banner (النشاط الأخير / مناسبات اليوم) ━━━ */}
      {todayBirthdays.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl border border-rose-200/90 bg-gradient-to-r from-rose-50/90 via-amber-50/60 to-rose-50/80 p-3.5 sm:p-4 shadow-2xs animate-pulse-glow">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-xs">
                <Cake className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-rose-900">
                    أعياد ميلاد الأبطال اليوم 🎉
                  </h4>
                  <span className="rounded-full bg-rose-600 text-white px-2 py-0.5 text-[10px] font-black">
                    {todayBirthdays.length} بطل
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 flex-wrap">
                  {todayBirthdays.map((p) => (
                    <span
                      key={p._id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/90 border border-rose-200/80 px-2 py-0.5 text-xs font-black text-slate-800"
                    >
                      <span>{p.name}</span>
                      <span className="text-[10px] text-rose-600 font-extrabold">
                        ({p.birthdayInfo?.turningAge} سنة)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
              {todayBirthdays[0] && (
                <button
                  type="button"
                  onClick={() => sendBirthdayCardViaWhatsApp(todayBirthdays[0], firstName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs active-press transition cursor-pointer"
                  title="إرسال كارت التهنئة الرسمي عبر واتساب"
                >
                  <span>🎂</span>
                  <span>كارت واتساب ({todayBirthdays[0].name.split(" ")[0]})</span>
                </button>
              )}
              <button
                type="button"
                onClick={onOpenBirthdays}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-700 text-xs font-black active-press transition cursor-pointer"
              >
                <span>مركز الاحتفالات</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
