import { memo, useEffect, useRef, useState } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  CreditCard,
  Clock,
  Building2,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { localDate, paymentStatusFor } from "../../lib/dashboard-utils";

/* ── Animated counter hook ─────────────────────────────────────────────── */
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    if (target === prevTarget.current && value !== 0) return;
    prevTarget.current = target;
    if (target === 0) { setValue(0); return; }
    const start = Date.now();
    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  return value;
}

/* ── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, note, Icon, gradient, accentColor, delay }) {
  const animated = useCountUp(value);
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-slate-300/80 animate-card-entrance"
      style={{ animationDelay: delay }}
    >
      {/* Colored right-border accent */}
      <div
        className="absolute right-0 top-3 bottom-3 w-[3px] rounded-full transition-all duration-300 group-hover:top-0 group-hover:bottom-0"
        style={{ background: accentColor }}
      />

      {/* Icon */}
      <div className="flex items-center justify-between gap-2">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg bg-gradient-to-br ${gradient}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-semibold text-slate-400 text-left leading-tight max-w-[70px]">
          {note}
        </span>
      </div>

      {/* Value */}
      <div className="mt-3.5">
        <span className="block text-xs font-semibold text-slate-500 mb-1">{label}</span>
        <strong className="font-cairo text-3xl font-black tracking-tight text-slate-900">
          {animated}
        </strong>
      </div>
    </div>
  );
}

/* ── Main StatsGrid ────────────────────────────────────────────────────── */
function StatsGrid({
  players,
  branches,
  branch,
  sessionDate,
  paymentMonth,
  paymentMonthLabel,
}) {
  const dashboardPlayers =
    branch === "كل الصالات"
      ? players
      : players.filter((p) => p.branch === branch);

  const paidCount = dashboardPlayers.filter(
    (p) => paymentStatusFor(p, paymentMonth) === "paid",
  ).length;

  const presentToday = dashboardPlayers.filter((p) => {
    var _a;
    return ((_a = p.attendance) !== null && _a !== void 0 ? _a : []).some(
      (a) => a.date === sessionDate && a.status === "present",
    );
  }).length;

  const absentToday = dashboardPlayers.filter((p) => {
    var _a;
    return ((_a = p.attendance) !== null && _a !== void 0 ? _a : []).some(
      (a) => a.date === sessionDate && a.status === "absent",
    );
  }).length;

  const unpaidCount = dashboardPlayers.length - paidCount;

  const attendanceDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${sessionDate}T12:00:00`);
    date.setDate(date.getDate() - (6 - index));
    const day = localDate(date);
    const present = dashboardPlayers.filter((player) =>
      player.attendance.some((item) => item.date === day && item.status === "present"),
    ).length;
    const absent = dashboardPlayers.filter((player) =>
      player.attendance.some((item) => item.date === day && item.status === "absent"),
    ).length;
    return {
      date: day,
      isToday: day === sessionDate,
      label: new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(date),
      present,
      absent,
    };
  });

  const attendanceTotal = presentToday + absentToday;
  const attendanceRate = attendanceTotal
    ? Math.round((presentToday / attendanceTotal) * 100)
    : 0;

  const stats = [
    {
      label: "إجمالي اللاعبين",
      value: dashboardPlayers.length,
      note: "لاعب مسجل",
      Icon: Users,
      gradient: "from-red-500 to-rose-600",
      accentColor: "#ef4444",
    },
    {
      label: "حاضرون اليوم",
      value: presentToday,
      note: `بتاريخ ${sessionDate}`,
      Icon: CheckCircle2,
      gradient: "from-emerald-500 to-teal-600",
      accentColor: "#10b981",
    },
    {
      label: "غائبون اليوم",
      value: absentToday,
      note: `بتاريخ ${sessionDate}`,
      Icon: XCircle,
      gradient: "from-rose-500 to-pink-600",
      accentColor: "#f43f5e",
    },
    {
      label: "دفعوا الاشتراك",
      value: paidCount,
      note: paymentMonthLabel,
      Icon: CreditCard,
      gradient: "from-sky-500 to-blue-600",
      accentColor: "#0ea5e9",
    },
    {
      label: "لم يدفعوا بعد",
      value: unpaidCount,
      note: "مستحقات معلقة",
      Icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      accentColor: "#f59e0b",
    },
    {
      label: "الصالات النشطة",
      value: branches.length,
      note: "فروع الأكاديمية",
      Icon: Building2,
      gradient: "from-slate-600 to-slate-800",
      accentColor: "#475569",
    },
  ];

  const maxBarVal = Math.max(...attendanceDays.map((d) => Math.max(d.present, d.absent)), 1);

  return (
    <>
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mt-5">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={`${i * 60}ms`} />
        ))}
      </div>

      {/* Charts row */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">

        {/* Weekly bar chart */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <p className="section-eyebrow">
                <TrendingUp className="h-3 w-3" />
                تحليل الأداء الأسبوعي
              </p>
              <h3 className="mt-1.5 font-cairo text-base font-extrabold text-slate-900">
                متابعة الحضور والغياب (7 أيام)
              </h3>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" /> حاضر
              </span>
              <span className="flex items-center gap-1.5">
                <XCircle className="h-3 w-3 text-rose-500" /> غائب
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-1.5 sm:gap-2.5">
            {attendanceDays.map((day) => {
              const presentH = (day.present / maxBarVal) * 100;
              const absentH = (day.absent / maxBarVal) * 100;
              return (
                <div
                  key={day.date}
                  className={`group flex flex-col items-center rounded-xl p-1.5 transition-all duration-200 ${
                    day.isToday ? "bg-red-50/70 ring-1 ring-red-200" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-center gap-0.5 text-[10px] font-extrabold">
                    <span className="text-emerald-600">{day.present}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-600">{day.absent}</span>
                  </div>
                  <div className="flex h-28 w-full items-end justify-center gap-1 rounded-lg border-b border-slate-100 bg-slate-50/60 px-1 pb-1">
                    <div className="flex h-full w-3 sm:w-4 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs animate-bar-grow transition-all duration-700 group-hover:brightness-110"
                        style={{ height: `${Math.max(presentH, day.present ? 10 : 0)}%`, animationDelay: "200ms" }}
                      />
                    </div>
                    <div className="flex h-full w-3 sm:w-4 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-rose-600 to-red-400 shadow-xs animate-bar-grow transition-all duration-700 group-hover:brightness-110"
                        style={{ height: `${Math.max(absentH, day.absent ? 10 : 0)}%`, animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 text-center">
                    <span className={`block text-[11px] font-bold ${day.isToday ? "text-red-600 font-extrabold" : "text-slate-500"}`}>
                      {day.label}
                    </span>
                    <span className="block text-[9px] font-medium text-slate-400">
                      {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Attendance ring */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <p className="section-eyebrow">
                <CalendarDays className="h-3 w-3" />
                مؤشر اليوم
              </p>
              <h3 className="mt-1.5 font-cairo text-base font-extrabold text-slate-900">
                نسبة الحضور بالصالة
              </h3>
            </div>
            <span className="rounded-lg bg-slate-50 border border-slate-200/60 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {sessionDate}
            </span>
          </div>

          <div className="my-auto flex flex-col sm:flex-row items-center justify-center gap-6 py-5">
            {/* Ring */}
            <div className="relative flex h-32 w-32 items-center justify-center shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 animate-ring-draw transition-all duration-1000 ease-out"
                  strokeDasharray={`${attendanceRate}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="font-cairo text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {attendanceRate}%
                </strong>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">حضور</span>
              </div>
            </div>

            {/* Details */}
            <div className="grid w-full sm:w-auto min-w-[140px] gap-2.5">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>حاضرون</span>
                </div>
                <strong className="font-cairo text-xl font-black text-emerald-700">{presentToday}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  <span>غائبون</span>
                </div>
                <strong className="font-cairo text-xl font-black text-rose-700">{absentToday}</strong>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 text-center text-[10px] font-semibold text-slate-400">
                {attendanceTotal
                  ? `${attendanceTotal} من ${dashboardPlayers.length} لاعب`
                  : "لا توجد تسجيلات لهذا اليوم"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default memo(StatsGrid);
