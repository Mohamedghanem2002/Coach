import { localDate, paymentStatusFor } from "../../lib/dashboard-utils";
const ICONS = {
  players: "👥",
  present: "✅",
  absent: "❌",
  paid: "💰",
  unpaid: "⏳",
  branches: "🏢",
};
export default function StatsGrid({
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
  return (
    <>
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className={`stat-card ${stat.color}`}>
            <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="attendance-charts">
        <section className="chart-card attendance-trend-card">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">متابعة الحضور</p>
              <h3>الحضور والغياب خلال الأسبوع</h3>
            </div>
            <div className="chart-legend">
              <span>
                <i className="legend-dot present" /> حاضر
              </span>
              <span>
                <i className="legend-dot absent" /> غائب
              </span>
            </div>
          </div>
          <div
            className="attendance-bars"
            aria-label="مخطط الحضور والغياب خلال الأسبوع"
          >
            {attendanceDays.map((day) => {
              const max = Math.max(day.present, day.absent, 1);
              return (
                <div className="attendance-day" key={day.date}>
                  <div className="bar-values">
                    <span>{day.present}</span>
                    <span>{day.absent}</span>
                  </div>
                  <div className="bar-track">
                    <span
                      className="bar present"
                      style={{
                        height: `${Math.max((day.present / max) * 100, day.present ? 8 : 0)}%`,
                      }}
                    />
                    <span
                      className="bar absent"
                      style={{
                        height: `${Math.max((day.absent / max) * 100, day.absent ? 8 : 0)}%`,
                      }}
                    />
                  </div>
                  <small>{day.label}</small>
                </div>
              );
            })}
          </div>
        </section>

        <section className="chart-card attendance-summary-card">
          <div className="chart-heading">
            <div>
              <p className="eyebrow">ملخص اليوم</p>
              <h3>نسبة الحضور</h3>
            </div>
            <span className="chart-date">{sessionDate}</span>
          </div>
          <div className="attendance-summary">
            <div
              className="attendance-donut"
              style={{ "--attendance-rate": `${attendanceRate}%` }}
            >
              <strong>{attendanceRate}%</strong>
              <span>حضور</span>
            </div>
            <div className="summary-values">
              <div>
                <i className="legend-dot present" />
                <span>حاضرون</span>
                <strong>{presentToday}</strong>
              </div>
              <div>
                <i className="legend-dot absent" />
                <span>غائبون</span>
                <strong>{absentToday}</strong>
              </div>
              <small>
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
