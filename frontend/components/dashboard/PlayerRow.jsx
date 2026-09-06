import { memo, useState } from "react";
import { paymentStatusFor } from "../../lib/dashboard-utils";
function PlayerRow({
  player,
  sessionDate,
  paymentMonth,
  onOpen,
  onUpdate,
  isSelected,
  onToggleSelection,
}) {
  const [attendanceBusy, setAttendanceBusy] = useState("");
  const [paymentBusy, setPaymentBusy] = useState(false);
  const record = player.attendance.find((item) => item.date === sessionDate);
  const present =
    (record === null || record === void 0 ? void 0 : record.status) ===
    "present";
  const absent =
    (record === null || record === void 0 ? void 0 : record.status) ===
    "absent";
  const paymentStatus = paymentStatusFor(player, paymentMonth);
  async function updateAttendance(status) {
    if (attendanceBusy) return;
    setAttendanceBusy(status);
    try {
      await onUpdate(player._id, {
        attendanceStatus: status,
        date: sessionDate,
      });
    } finally {
      setAttendanceBusy("");
    }
  }
  async function updatePayment() {
    if (paymentBusy) return;
    setPaymentBusy(true);
    try {
      await onUpdate(player._id, {
        paymentStatus: paymentStatus === "paid" ? "unpaid" : "paid",
      });
    } finally {
      setPaymentBusy(false);
    }
  }
  return (
    <div className="mb-2 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm last:mb-0 lg:mb-0 lg:grid-cols-[2.2fr_0.7fr_1fr_1.7fr_1.15fr_0.35fr] lg:items-center lg:gap-4 lg:rounded-none lg:border-0 lg:border-b lg:border-slate-100 lg:px-6 lg:py-3 lg:shadow-none">
      {/* اسم اللاعب */}
      <div className="col-span-1 flex min-w-0 items-center gap-2 lg:col-auto">
        <input
          type="checkbox"
          aria-label={`اختيار ${player.name}`}
          checked={isSelected}
          onChange={() => onToggleSelection(player._id)}
          className="h-4 w-4 shrink-0 accent-red-600"
        />
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-2 text-right"
          onClick={onOpen}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-linear-to-br from-red-100 to-red-200 text-base font-bold text-red-700 ring-2 ring-white shadow-sm sm:h-11 sm:w-11 sm:text-lg">
            {player.photo ? (
              <img src={player.photo} alt="" />
            ) : (
              player.name.charAt(0)
            )}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-sm font-bold text-slate-900">
              {player.name}
            </strong>
            <small className="mt-0.5 block text-[10px] text-slate-400">
              تسجيل {new Date(player.createdAt).toLocaleDateString("ar-EG")}
            </small>
          </span>
        </button>
      </div>

      {/* العمر والفرع */}
      <div className="col-span-2 flex items-center gap-3 border-t border-slate-100 pt-2 text-[11px] lg:col-auto lg:contents lg:border-0 lg:pt-0">
        <span className="shrink-0 font-semibold text-slate-900 lg:col-start-2">
          {player.age}
          <span className="font-normal text-slate-400"> سنة</span>
        </span>
        <span className="max-w-[55%] truncate border-r border-slate-200 pr-3 text-slate-500 lg:col-start-3 lg:max-w-none">
          {player.branch}
        </span>
      </div>

      {/* الحضور */}
      <div className="col-span-1 grid grid-cols-2 gap-1.5 lg:col-auto lg:flex">
        <button
          type="button"
          className={`min-h-9 rounded-lg px-1.5 text-[10px] font-bold transition sm:min-h-10 sm:px-2 sm:text-[11px] ${present ? "bg-green-100 text-green-700 ring-1 ring-green-200" : "bg-slate-50 text-slate-500 hover:bg-green-50"}`}
          disabled={Boolean(attendanceBusy)}
          onClick={() => updateAttendance("present")}
        >
          {attendanceBusy === "present" ? "جاري..." : "✓ حاضر"}
        </button>
        <button
          type="button"
          className={`min-h-9 rounded-lg px-1.5 text-[10px] font-bold transition sm:min-h-10 sm:px-2 sm:text-[11px] ${absent ? "bg-red-100 text-red-700 ring-1 ring-red-200" : "bg-slate-50 text-slate-500 hover:bg-red-50"}`}
          disabled={Boolean(attendanceBusy)}
          onClick={() => updateAttendance("absent")}
        >
          {attendanceBusy === "absent" ? "جاري..." : "× غياب"}
        </button>
      </div>

      {/* الدفع */}
      <button
        type="button"
        className={`col-span-1 min-h-9 rounded-lg px-1.5 text-[10px] font-bold transition sm:min-h-10 sm:px-2 sm:text-[11px] lg:col-auto ${paymentStatus === "paid" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600 hover:bg-red-100"}`}
        disabled={paymentBusy}
        onClick={updatePayment}
      >
        {paymentBusy
          ? "جاري..."
          : paymentStatus === "paid"
            ? "✓ مدفوع"
            : "لم يدفع"}
      </button>

      {/* تفاصيل */}
      <button
        type="button"
        className="col-start-2 row-start-1 grid h-10 w-10 place-items-center rounded-lg text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 lg:col-auto lg:row-auto"
        onClick={onOpen}
        title="عرض الملف"
      >
        ⋯
      </button>
    </div>
  );
}

export default memo(PlayerRow);
