import { memo } from "react";
import { localDate, paymentStatusFor } from "../../lib/dashboard-utils";
const ICONS = {
  players: "👥",
  present: "✅",
  absent: "❌",
  paid: "💰",
  unpaid: "⏳",
  branches: "🏢",
};
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
      label: new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(
        date,
      ),
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
      icon: ICONS.players,
      color: "red",
    },
    {
      label: "حاضرون اليوم",
      value: presentToday,
      note: `بتاريخ ${sessionDate}`,
      icon: ICONS.present,
      color: "green",
    },
    {
      label: "غائبون اليوم",
      value: absentToday,
      note: `بتاريخ ${sessionDate}`,
      icon: ICONS.absent,
      color: "orange",
    },
    {
      label: "دفعوا الاشتراك",
      value: paidCount,
      note: paymentMonthLabel,
      icon: ICONS.paid,
      color: "blue",
    },
    {
      label: "لم يدفعوا بعد",
      value: unpaidCount,
      note: "يحتاجون متابعة",
      icon: ICONS.unpaid,
      color: "red",
    },
    {
      label: "الصالات النشطة",
      value: branches.length,
      note: "فروع الأكاديمية",
      icon: ICONS.branches,
      color: "orange",
    },
  ];
  const statStyles = {
    red: {
      card: "border-red-100 bg-red-50/60",
      icon: "bg-red-100 text-red-600",
    },
    green: {
      card: "border-green-100 bg-green-50/60",
      icon: "bg-green-100 text-green-600",
    },
    blue: {
      card: "border-blue-100 bg-blue-50/60",
      icon: "bg-blue-100 text-blue-600",
    },
    orange: {
      card: "border-orange-100 bg-orange-50/60",
      icon: "bg-orange-100 text-orange-600",
    },
  };
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${statStyles[stat.color].card}`}
          >
            <div
              className={`mb-3 grid h-9 w-9 place-items-center rounded-xl text-base ${statStyles[stat.color].icon}`}
            >
              {stat.icon}
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-slate-500">
                {stat.label}
              </span>
              <strong className="mt-1 block font-cairo text-2xl font-extrabold text-slate-900">
                {stat.value}
              </strong>
              <small className="mt-1 block truncate text-[9px] text-slate-400">
                {stat.note}
              </small>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                متابعة الحضور
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                الحضور والغياب خلال الأسبوع
              </h3>
            </div>
            <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-green-500" /> حاضر
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2 w-2 rounded-full bg-red-500" /> غائب
              </span>
            </div>
          </div>
          <div
            className="mt-6 grid min-h-40 grid-cols-7 items-end gap-2"
            aria-label="مخطط الحضور والغياب خلال الأسبوع"
          >
            {attendanceDays.map((day) => {
              const max = Math.max(day.present, day.absent, 1);
              return (
                <div
                  className="grid grid-rows-[20px_112px_20px] items-end text-center"
                  key={day.date}
                >
                  <div className="flex justify-center gap-2 text-[9px] font-bold text-slate-400">
                    <span>{day.present}</span>
                    <span>{day.absent}</span>
                  </div>
                  <div className="flex h-28 items-end justify-center gap-1 border-b border-slate-200 bg-[repeating-linear-gradient(to_top,transparent_0,transparent_27px,#f1f4f7_28px)] px-1">
                    <span
                      className="w-3 rounded-t-md bg-linear-to-t from-green-600 to-green-300"
                      style={{
                        height: `${Math.max((day.present / max) * 100, day.present ? 8 : 0)}%`,
                      }}
                    />
                    <span
                      className="w-3 rounded-t-md bg-linear-to-t from-red-600 to-red-300"
                      style={{
                        height: `${Math.max((day.absent / max) * 100, day.absent ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                  <small className="pt-1 text-[10px] font-semibold text-slate-400">
                    {day.label}
                  </small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                ملخص اليوم
              </p>
              <h3 className="mt-1 text-sm font-bold text-slate-900">
                نسبة الحضور
              </h3>
            </div>
            <span className="text-[10px] text-slate-400">{sessionDate}</span>
          </div>
          <div className="flex min-h-32 items-center justify-center gap-6">
            <div
              className="relative grid h-32 w-32 place-content-center rounded-full text-center after:absolute after:inset-2.5 after:rounded-full after:bg-white"
              style={{
                background: `conic-gradient(#38a169 ${attendanceRate}%, #edf1f4 0)`,
              }}
            >
              <div className="relative z-10">
                <strong className="block text-2xl font-extrabold text-slate-900">
                  {attendanceRate}%
                </strong>
                <span className="text-[10px] text-slate-400">حضور</span>
              </div>
            </div>
            <div className="grid min-w-28 gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <i className="h-2 w-2 rounded-full bg-green-500" />
                <span>حاضرون</span>
                <strong className="mr-auto text-base text-slate-900">
                  {presentToday}
                </strong>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <i className="h-2 w-2 rounded-full bg-red-500" />
                <span>غائبون</span>
                <strong className="mr-auto text-base text-slate-900">
                  {absentToday}
                </strong>
              </div>
              <small className="text-[9px] leading-5 text-slate-400">
                {attendanceTotal
                  ? `${attendanceTotal} لاعب لديهم تسجيل اليوم`
                  : "لا توجد تسجيلات لهذا اليوم"}
              </small>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default memo(StatsGrid);
