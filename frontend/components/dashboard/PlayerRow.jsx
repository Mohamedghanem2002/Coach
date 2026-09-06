import { paymentStatusFor } from "../../lib/dashboard-utils";
export default function PlayerRow({ player, sessionDate, paymentMonth, onOpen, onUpdate, }) {
    const record = player.attendance.find((item) => item.date === sessionDate);
    const present = (record === null || record === void 0 ? void 0 : record.status) === "present";
    const absent = (record === null || record === void 0 ? void 0 : record.status) === "absent";
    const paymentStatus = paymentStatusFor(player, paymentMonth);
    return (<div className="table-row">
      {/* اسم اللاعب */}
      <button className="player-cell" onClick={onOpen}>
        <span className="player-photo">
          {player.photo ? (<img src={player.photo} alt=""/>) : (player.name.charAt(0))}
        </span>
        <span>
          <strong>{player.name}</strong>
          <small>
            تسجيل {new Date(player.createdAt).toLocaleDateString("ar-EG")}
          </small>
        </span>
      </button>

      {/* العمر */}
      <span style={{ fontWeight: 600, color: "var(--text-main)" }}>
        {player.age}
        <span style={{ color: "var(--text-muted)", fontWeight: 400 }}> سنة</span>
      </span>

      {/* الفرع */}
      <span className="branch-name">{player.branch}</span>

      {/* الحضور */}
      <div className="attendance-toggle">
        <button className={present ? "attendance active" : "attendance"} onClick={() => onUpdate(player._id, {
            attendanceStatus: "present",
            date: sessionDate,
        })}>
          ✓ حاضر
        </button>
        <button className={absent ? "absence active" : "absence"} onClick={() => onUpdate(player._id, {
            attendanceStatus: "absent",
            date: sessionDate,
        })}>
          × غياب
        </button>
      </div>

      {/* الدفع */}
      <button className={paymentStatus === "paid" ? "payment paid" : "payment unpaid"} onClick={() => onUpdate(player._id, {
            paymentStatus: paymentStatus === "paid" ? "unpaid" : "paid",
        })}>
        {paymentStatus === "paid" ? "✓ مدفوع" : "لم يدفع"}
      </button>

      {/* تفاصيل */}
      <button className="more" onClick={onOpen} title="عرض الملف">
        ⋯
      </button>
    </div>);
}
