import { memo } from "react";
import { localDate, paymentStatusFor } from "../../lib/dashboard-utils";

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
      player.attendance.some(
        (item) => item.date === day && item.status === "present",
      ),
    ).length;
    const absent = dashboardPlayers.filter((player) =>
      player.attendance.some(
        (item) => item.date === day && item.status === "absent",
      ),
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
      icon: "👥",
      gradient: "from-red-500 to-rose-600 shadow-red-500/25",
      border: "hover:border-red-200",
      bgLight: "bg-red-50/50",
    },
    {
      label: "حاضرون اليوم",
      value: presentToday,
      note: `بتاريخ ${sessionDate}`,
      icon: "✓",
      gradient: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
      border: "hover:border-emerald-200",
      bgLight: "bg-emerald-50/50",
    },
    {
      label: "غائبون اليوم",
      value: absentToday,
      note: `بتاريخ ${sessionDate}`,
      icon: "×",
      gradient: "from-rose-500 to-pink-600 shadow-rose-500/25",
      border: "hover:border-rose-200",
      bgLight: "bg-rose-50/50",
    },
    {
      label: "دفعوا الاشتراك",
      value: paidCount,
      note: paymentMonthLabel,
      icon: "💳",
      gradient: "from-sky-500 to-blue-600 shadow-sky-500/25",
      border: "hover:border-sky-200",
      bgLight: "bg-sky-50/50",
    },
    {
      label: "لم يدفعوا بعد",
      value: unpaidCount,
      note: "مستحقات معلقة",
      icon: "⏳",
      gradient: "from-amber-500 to-orange-600 shadow-amber-500/25",
      border: "hover:border-amber-200",
      bgLight: "bg-amber-50/50",
    },
    {
      label: "الصالات النشطة",
      value: branches.length,
      note: "فروع الأكاديمية",
      icon: "🥋",
      gradient: "from-slate-700 to-slate-900 shadow-slate-700/25",
      border: "hover:border-slate-300",
      bgLight: "bg-slate-50/70",
    },
  ];

  return (
    <>
      {/* شبكة الإحصائيات العلوية */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6 mt-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-4 ${stat.border}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br text-base font-bold text-white shadow-md transition-transform duration-200 group-hover:scale-110 sm:h-10 sm:w-10 sm:text-lg ${stat.gradient}`}
              >
                {stat.icon}
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {stat.note}
              </span>
            </div>

            <div className="mt-3">
              <span className="block text-xs font-bold text-slate-500">
                {stat.label}
              </span>
              <strong className="mt-1 block font-cairo text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                {stat.value}
              </strong>
            </div>
          </div>
        ))}
      </div>

      {/* الرسوم البيانية وملخص الحضور */}
      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* مخطط الحضور الأسبوعي */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs sm:p-6 transition-shadow hover:shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-600"></span>
                <p className="text-[11px] font-extrabold tracking-wider text-red-600">
                  تحليل الأداء الأسبوعي
                </p>
              </div>
              <h3 className="mt-1 font-cairo text-base font-extrabold text-slate-900">
                متابعة الحضور والغياب (7 أيام)
              </h3>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 border border-slate-200/60">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" /> حاضر
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" /> غائب
              </span>
            </div>
          </div>

          <div
            className="mt-6 grid grid-cols-7 items-end gap-1.5 sm:gap-3"
            aria-label="مخطط الحضور والغياب خلال الأسبوع"
          >
            {attendanceDays.map((day) => {
              const max = Math.max(...attendanceDays.map((d) => Math.max(d.present, d.absent)), 1);
              const presentHeight = (day.present / max) * 100;
              const absentHeight = (day.absent / max) * 100;

              return (
                <div
                  key={day.date}
                  className={`group flex flex-col items-center rounded-xl p-1.5 transition-all duration-200 ${
                    day.isToday ? "bg-red-50/60 ring-1 ring-red-200" : "hover:bg-slate-50"
                  }`}
                >
                  {/* الأرقام أعلى الأعمدة */}
                  <div className="mb-2 flex items-center justify-center gap-1 text-[10px] font-extrabold">
                    <span className="text-emerald-600">{day.present}</span>
                    <span className="text-slate-300">/</span>
                    <span className="text-rose-600">{day.absent}</span>
                  </div>

                  {/* الأعمدة البيانية */}
                  <div className="flex h-32 w-full items-end justify-center gap-1 rounded-lg border-b border-slate-200/80 bg-slate-50/50 px-1 py-1">
                    {/* عمود حاضر */}
                    <div className="flex h-full w-3 sm:w-4 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-emerald-600 to-teal-400 transition-all duration-500 group-hover:brightness-110 shadow-xs"
                        style={{
                          height: `${Math.max(presentHeight, day.present ? 12 : 0)}%`,
                        }}
                        title={`حاضر: ${day.present}`}
                      />
                    </div>
                    {/* عمود غائب */}
                    <div className="flex h-full w-3 sm:w-4 flex-col justify-end">
                      <div
                        className="w-full rounded-t-md bg-gradient-to-t from-rose-600 to-red-400 transition-all duration-500 group-hover:brightness-110 shadow-xs"
                        style={{
                          height: `${Math.max(absentHeight, day.absent ? 12 : 0)}%`,
                        }}
                        title={`غائب: ${day.absent}`}
                      />
                    </div>
                  </div>

                  {/* تسمية اليوم */}
                  <div className="mt-2 text-center">
                    <span
                      className={`block text-[11px] font-bold ${
                        day.isToday ? "text-red-600 font-extrabold" : "text-slate-500"
                      }`}
                    >
                      {day.label}
                    </span>
                    <span className="block text-[9px] font-semibold text-slate-400">
                      {day.date.slice(8, 10)}/{day.date.slice(5, 7)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* مؤشر نسبة حضور اليوم */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4.5 shadow-2xs sm:p-6 transition-shadow hover:shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <p className="text-[11px] font-extrabold tracking-wider text-red-600">
                مؤشر اليوم
              </p>
              <h3 className="mt-0.5 font-cairo text-base font-extrabold text-slate-900">
                نسبة الحضور بالصالة
              </h3>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
              {sessionDate}
            </span>
          </div>

          <div className="my-auto flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
            {/* الحلقة التفاعلية */}
            <div className="relative flex h-32 w-32 items-center justify-center shrink-0">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-100"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-emerald-500 transition-all duration-1000 ease-out"
                  strokeDasharray={`${attendanceRate}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <strong className="font-cairo text-3xl font-black text-slate-900 tracking-tight">
                  {attendanceRate}%
                </strong>
                <span className="text-[10px] font-bold text-slate-400">حضور اليوم</span>
              </div>
            </div>

            {/* تفاصيل الحاضرين والغائبين */}
            <div className="grid w-full sm:w-auto min-w-[140px] gap-2.5">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span>حاضرون</span>
                </div>
                <strong className="font-cairo text-lg font-black text-emerald-700">
                  {presentToday}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-800">
                  <span className="flex h-2 w-2 rounded-full bg-rose-500"></span>
                  <span>غائبون</span>
                </div>
                <strong className="font-cairo text-lg font-black text-rose-700">
                  {absentToday}
                </strong>
              </div>

              <div className="rounded-lg bg-slate-50 p-2 text-center text-[10px] font-bold text-slate-400 border border-slate-100">
                {attendanceTotal
                  ? `تم تسجيل ${attendanceTotal} من أصل ${dashboardPlayers.length} لاعب`
                  : "لا توجد تسجيلات حضور لهذا اليوم بعد"}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default memo(StatsGrid);

