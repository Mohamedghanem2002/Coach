import { memo, useEffect, useRef, useState } from "react";
import {
  Users, CheckCircle2, XCircle, CreditCard, Clock,
  Building2, TrendingUp, CalendarDays, ShoppingBag,
} from "lucide-react";
import {
  localDate, paymentStatusFor, getPaymentDetailsFor,
  getPurchasesSummary,
} from "../../lib/dashboard-utils";

/* ── Animated counter hook ─────────────────────────────────────────────── */
function useCountUp(target, duration = 700) {
  const [value, setValue] = useState(0);
  const prevTarget = useRef(target);
  useEffect(() => {
    if (target === prevTarget.current && value !== 0) return;
    prevTarget.current = target;
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
function StatCard({ label, value, note, Icon, iconBg, accentColor, delay }) {
  const animated = useCountUp(value);
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      style={{ animationDelay: delay }}
    >
      {/* Accent right indicator */}
      <div
        className="absolute right-0 top-0 bottom-0 w-[3px] rounded-r-full transition-all duration-200"
        style={{ background: accentColor }}
      />

      {/* Icon + Note */}
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs shrink-0"
          style={{ background: accentColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 text-left leading-tight max-w-[80px] mt-0.5">
          {note}
        </span>
      </div>

      {/* Value */}
      <div className="mt-3">
        <span className="block text-[11px] font-bold text-slate-500 mb-0.5">{label}</span>
        <strong className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
          {animated}
        </strong>
      </div>

      {/* Subtle hover glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"
        style={{ background: `radial-gradient(circle at 100% 0%, ${accentColor}08 0%, transparent 60%)` }}
      />
    </div>
  );
}

/* ── Revenue Stream Card ───────────────────────────────────────────────── */
function RevenueCard({ title, subtitle, badge, color, icon: Icon, items }) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-xs flex flex-col justify-between"
      style={{
        borderColor: `${color}33`,
        background: `${color}08`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs shrink-0" style={{ background: color }}>
            <Icon className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900">{title}</h4>
            <p className="text-[10px] text-slate-500 font-bold mt-0.5">{subtitle}</p>
          </div>
        </div>
        <span className="text-[10px] font-black px-2 py-1 rounded-lg border shrink-0" style={{ color, background: `${color}15`, borderColor: `${color}30` }}>
          {badge}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t text-center" style={{ borderColor: `${color}25` }}>
        {items.map((item, i) => (
          <div key={i}>
            <span className="block text-[10px] font-bold mb-0.5" style={{ color: item.textColor || "#64748b" }}>{item.label}</span>
            <strong className="text-xs sm:text-sm font-black" style={{ color: item.valueColor || "#0f172a" }}>
              {item.value}
              {item.unit && <span className="text-[9px] font-normal opacity-60 mr-0.5">{item.unit}</span>}
            </strong>
          </div>
        ))}
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

  const paymentDetailsList = dashboardPlayers.map((p) =>
    getPaymentDetailsFor(p, paymentMonth),
  );
  const paidCount     = paymentDetailsList.filter((p) => p.status === "paid").length;
  const partialCount  = paymentDetailsList.filter((p) => p.status === "partially_paid").length;
  const unpaidCount   = paymentDetailsList.filter((p) => p.status === "unpaid").length;
  const totalRemaining   = paymentDetailsList.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const pendingPlayersCount = unpaidCount + partialCount;
  const monthlyCollected   = paymentDetailsList.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  // Purchases stats
  const allPurchases = dashboardPlayers.flatMap((p) =>
    Array.isArray(p.purchases) ? p.purchases : []
  );
  const totalPurchasesAmount    = allPurchases.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  const totalPurchasesPaid      = allPurchases.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const totalPurchasesRemaining = Math.max(0, totalPurchasesAmount - totalPurchasesPaid);

  // Attendance
  const presentToday = dashboardPlayers.filter((p) =>
    (p.attendance ?? []).some((a) => a.date === sessionDate && a.status === "present")
  ).length;
  const absentToday = dashboardPlayers.filter((p) =>
    (p.attendance ?? []).some((a) => a.date === sessionDate && a.status === "absent")
  ).length;

  // Weekly chart
  const attendanceDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${sessionDate}T12:00:00`);
    date.setDate(date.getDate() - (6 - index));
    const day = localDate(date);
    const present = dashboardPlayers.filter((player) =>
      (player.attendance || []).some((item) => item.date === day && item.status === "present")
    ).length;
    const absent = dashboardPlayers.filter((player) =>
      (player.attendance || []).some((item) => item.date === day && item.status === "absent")
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
  const attendanceRate  = attendanceTotal ? Math.round((presentToday / attendanceTotal) * 100) : 0;

  const stats = [
    { label: "إجمالي اللاعبين",        value: dashboardPlayers.length, note: "لاعب مسجل",                               Icon: Users,       accentColor: "#dc2626" },
    { label: "حاضرون اليوم",           value: presentToday,            note: `بتاريخ ${sessionDate}`,                    Icon: CheckCircle2, accentColor: "#059669" },
    { label: "غائبون اليوم",           value: absentToday,             note: `بتاريخ ${sessionDate}`,                    Icon: XCircle,     accentColor: "#e11d48" },
    { label: "مسددو اشتراك الشهر",    value: paidCount,               note: partialCount > 0 ? `+${partialCount} جزئي` : `اشتراك ${paymentMonthLabel}`, Icon: CreditCard,  accentColor: "#0284c7" },
    { label: "متأخرات الاشتراك",      value: pendingPlayersCount,     note: totalRemaining > 0 ? `متبقي ${totalRemaining.toLocaleString("ar-EG")} ج.م` : "لا توجد متأخرات", Icon: Clock, accentColor: "#d97706" },
    { label: "الصالات النشطة",        value: branches.length,         note: "فروع الأكاديمية",                          Icon: Building2,   accentColor: "#475569" },
  ];

  const maxBarVal = Math.max(...attendanceDays.map((d) => Math.max(d.present, d.absent)), 1);

  return (
    <>
      {/* ── Stats Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mt-5">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} delay={`${i * 60}ms`} />
        ))}
      </div>

      {/* ── Revenue Streams ────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <RevenueCard
          title={`إيرادات اشتراك شهر ${paymentMonthLabel}`}
          subtitle="حساب الاشتراكات الشهرية المستقل"
          badge={`شهر ${paymentMonth}`}
          color="#0284c7"
          icon={CreditCard}
          items={[
            { label: "مسدد الشهر", value: `${paidCount}`, unit: "لاعب", textColor: "#475569", valueColor: "#0f172a" },
            { label: "المحصل", value: monthlyCollected.toLocaleString("ar-EG"), unit: "ج.م", textColor: "#059669", valueColor: "#059669" },
            { label: "المتأخرات", value: totalRemaining.toLocaleString("ar-EG"), unit: "ج.م", textColor: "#e11d48", valueColor: "#e11d48" },
          ]}
        />
        <RevenueCard
          title="مدفوعات ومبيعات المشتريات والأدوات"
          subtitle="حساب البدل والمستلزمات المستقل"
          badge={`${allPurchases.length} صنف`}
          color="#d97706"
          icon={ShoppingBag}
          items={[
            { label: "إجمالي المبيعات", value: totalPurchasesAmount.toLocaleString("ar-EG"), unit: "ج.م", textColor: "#475569", valueColor: "#0f172a" },
            { label: "المحصل", value: totalPurchasesPaid.toLocaleString("ar-EG"), unit: "ج.م", textColor: "#059669", valueColor: "#059669" },
            { label: "الباقي", value: totalPurchasesRemaining.toLocaleString("ar-EG"), unit: "ج.م", textColor: "#e11d48", valueColor: "#e11d48" },
          ]}
        />
      </div>

      {/* ── Charts Row ─────────────────────────────────────────────────── */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_1fr]">

        {/* Weekly bar chart */}
        <section className="rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <p className="section-eyebrow">
                <TrendingUp className="h-3 w-3" />
                تحليل الأداء الأسبوعي
              </p>
              <h3 className="mt-1.5 text-base font-extrabold text-slate-900">
                متابعة الحضور والغياب (7 أيام)
              </h3>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-semibold text-slate-600 border border-slate-200/60">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> حاضر</span>
              <span className="flex items-center gap-1.5"><XCircle className="h-3 w-3 text-rose-500" /> غائب</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-7 items-end gap-1.5 sm:gap-2.5">
            {attendanceDays.map((day) => {
              const presentH = (day.present / maxBarVal) * 100;
              const absentH  = (day.absent / maxBarVal) * 100;
              return (
                <div
                  key={day.date}
                  className={`group flex flex-col items-center rounded-xl p-1.5 transition-all duration-200 ${
                    day.isToday ? "bg-red-50/70 ring-1 ring-red-200" : "hover:bg-slate-50"
                  }`}
                >
                  {/* Present/Absent counts */}
                  <div className="mb-2 flex items-center justify-center gap-0.5 text-[10px] font-extrabold">
                    <span className="text-emerald-600">{day.present}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-600">{day.absent}</span>
                  </div>
                  {/* Bars */}
                  <div className="flex h-28 w-full items-end justify-center gap-1 rounded-lg border-b border-slate-100 bg-slate-50/60 px-1 pb-1">
                    <div className="flex h-full w-3 sm:w-4 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 shadow-xs transition-all duration-700 group-hover:brightness-110"
                        style={{ height: `${Math.max(presentH, day.present ? 8 : 0)}%` }}
                      />
                    </div>
                    <div className="flex h-full w-3 sm:w-4 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-rose-600 to-red-400 shadow-xs transition-all duration-700 group-hover:brightness-110"
                        style={{ height: `${Math.max(absentH, day.absent ? 8 : 0)}%` }}
                      />
                    </div>
                  </div>
                  {/* Day label */}
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
              <h3 className="mt-1.5 text-base font-extrabold text-slate-900">
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
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${attendanceRate}, 100`}
                  strokeWidth="3"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {attendanceRate}%
                </strong>
                <span className="text-[10px] font-semibold text-slate-400 mt-0.5">حضور</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid w-full sm:w-auto min-w-[140px] gap-2.5">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  <span>حاضرون</span>
                </div>
                <strong className="text-xl font-black text-emerald-700">{presentToday}</strong>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                  <span>غائبون</span>
                </div>
                <strong className="text-xl font-black text-rose-700">{absentToday}</strong>
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
