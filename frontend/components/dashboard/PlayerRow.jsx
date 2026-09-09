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
  const present = record?.status === "present";
  const absent = record?.status === "absent";
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
    <div
      className={`group mb-2.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border p-3.5 transition-all duration-200 lg:mb-0 lg:grid-cols-[2.3fr_0.7fr_1.1fr_1.8fr_1.2fr_0.4fr] lg:items-center lg:gap-4 lg:rounded-none lg:border-0 lg:border-b lg:border-slate-100 lg:px-6 lg:py-3.5 ${
        isSelected
          ? "border-red-200 bg-red-50/40 lg:bg-red-50/30"
          : "border-slate-200/80 bg-white shadow-2xs hover:border-slate-300 hover:shadow-xs lg:shadow-none"
      }`}
    >
      {/* اسم وصورة اللاعب */}
      <div className="col-span-1 flex min-w-0 items-center gap-3 lg:col-auto">
        <input
          type="checkbox"
          aria-label={`اختيار ${player.name}`}
          checked={isSelected}
          onChange={() => onToggleSelection(player._id)}
          className="h-4.5 w-4.5 shrink-0 rounded-md border-slate-300 accent-red-600 cursor-pointer"
        />
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-right cursor-pointer"
          onClick={onOpen}
        >
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-700 font-cairo text-sm font-black text-white shadow-xs ring-2 ring-white">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{player.name.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <strong className="block truncate font-cairo text-sm font-extrabold text-slate-900 group-hover:text-red-600 transition-colors">
              {player.name}
            </strong>
            <small className="mt-0.5 block text-[11px] font-semibold text-slate-400">
              تسجيل {new Date(player.createdAt).toLocaleDateString("ar-EG")}
            </small>
          </div>
        </button>
      </div>

      {/* العمر والفرع */}
      <div className="col-span-2 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-xs lg:col-auto lg:contents lg:border-0 lg:pt-0">
        <div className="shrink-0 lg:col-start-2">
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 font-bold text-slate-700 text-[11px]">
            {player.age} سنة
          </span>
        </div>
        <div className="max-w-[55%] truncate border-r border-slate-200 pr-3 lg:col-start-3 lg:max-w-none lg:border-0 lg:pr-0">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/60 px-2 py-1 text-[11px] font-bold text-slate-600">
            🏢 {player.branch}
          </span>
        </div>
      </div>

      {/* الحضور والغياب */}
      <div className="col-span-1 grid grid-cols-2 gap-1.5 lg:col-auto lg:flex">
        <button
          type="button"
          className={`min-h-9 sm:min-h-10 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 ${
            present
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-500/30 ring-2 ring-emerald-200"
              : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          }`}
          disabled={Boolean(attendanceBusy)}
          onClick={() => updateAttendance("present")}
        >
          {attendanceBusy === "present" ? (
            <span className="animate-spin text-xs">⏳</span>
          ) : (
            <>
              <span className="text-sm font-black">✓</span>
              <span>حاضر</span>
            </>
          )}
        </button>

        <button
          type="button"
          className={`min-h-9 sm:min-h-10 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 ${
            absent
              ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs shadow-rose-500/30 ring-2 ring-rose-200"
              : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          }`}
          disabled={Boolean(attendanceBusy)}
          onClick={() => updateAttendance("absent")}
        >
          {attendanceBusy === "absent" ? (
            <span className="animate-spin text-xs">⏳</span>
          ) : (
            <>
              <span className="text-sm font-black">×</span>
              <span>غياب</span>
            </>
          )}
        </button>
      </div>

      {/* الدفع */}
      <button
        type="button"
        className={`col-span-1 min-h-9 sm:min-h-10 rounded-xl px-2.5 text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 lg:col-auto active:scale-95 ${
          paymentStatus === "paid"
            ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
        }`}
        disabled={paymentBusy}
        onClick={updatePayment}
      >
        {paymentBusy ? (
          <span className="text-slate-400 font-semibold">جاري...</span>
        ) : paymentStatus === "paid" ? (
          <>
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
            <span>✓ مدفوع</span>
          </>
        ) : (
          <>
            <span className="flex h-1.5 w-1.5 rounded-full bg-rose-600"></span>
            <span>لم يدفع</span>
          </>
        )}
      </button>

      {/* زر تفاصيل الملف */}
      <button
        type="button"
        className="col-start-2 row-start-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 lg:col-auto lg:row-auto cursor-pointer"
        onClick={onOpen}
        title="عرض وتعديل ملف اللاعب"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
          />
        </svg>
      </button>
    </div>
  );
}

export default memo(PlayerRow);

