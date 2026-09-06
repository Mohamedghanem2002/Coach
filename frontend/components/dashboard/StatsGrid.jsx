import { paymentStatusFor } from "../../lib/dashboard-utils";
const ICONS = {
    players: "👥",
    present: "✅",
    absent: "❌",
    paid: "💰",
    unpaid: "⏳",
    branches: "🏢",
};
export default function StatsGrid({ players, branches, branch, sessionDate, paymentMonth, paymentMonthLabel, }) {
    const dashboardPlayers = branch === "كل الصالات"
        ? players
        : players.filter((p) => p.branch === branch);
    const paidCount = dashboardPlayers.filter((p) => paymentStatusFor(p, paymentMonth) === "paid").length;
    const presentToday = dashboardPlayers.filter((p) => {
        var _a;
        return ((_a = p.attendance) !== null && _a !== void 0 ? _a : []).some((a) => a.date === sessionDate && a.status === "present");
    }).length;
    const absentToday = dashboardPlayers.filter((p) => {
        var _a;
        return ((_a = p.attendance) !== null && _a !== void 0 ? _a : []).some((a) => a.date === sessionDate && a.status === "absent");
    }).length;
    const unpaidCount = dashboardPlayers.length - paidCount;
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
    return (<div className="stats-grid">
      {stats.map((stat) => (<div key={stat.label} className={`stat-card ${stat.color}`}>
          <div className={`stat-icon ${stat.color}`}>{stat.icon}</div>
          <div>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </div>
        </div>))}
    </div>);
}
