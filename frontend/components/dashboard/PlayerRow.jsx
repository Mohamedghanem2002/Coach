import { memo, useState } from "react";
import {
  Check,
  X,
  CreditCard,
  Clock,
  ChevronRight,
  UserRound,
  Cake,
  MoreHorizontal,
} from "lucide-react";
import { paymentStatusFor, getBirthdayInfo } from "../../lib/dashboard-utils";

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
  const birthdayInfo = getBirthdayInfo(player);

  async function updateAttendance(status) {
    if (attendanceBusy) return;
    setAttendanceBusy(status);
    try {
      await onUpdate(player._id, { attendanceStatus: status, date: sessionDate });
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
      className={`group relative mb-2.5 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-3 rounded-2xl border p-3.5 transition-all duration-200 lg:mb-0 lg:grid-cols-[2.3fr_0.7fr_1.1fr_1.8fr_1.2fr_0.4fr] lg:items-center lg:gap-4 lg:rounded-none lg:border-0 lg:border-b lg:border-slate-100/90 lg:px-6 lg:py-3.5 lg:hover:bg-slate-50/60 ${
        isSelected
          ? "border-red-200 bg-red-50/40 lg:bg-red-50/30"
          : birthdayInfo?.isToday
          ? "border-rose-200/90 bg-rose-50/20 shadow-sm hover:border-rose-300 hover:shadow-md lg:shadow-none"
          : "border-slate-200/70 bg-white shadow-sm hover:border-slate-300 hover:shadow-md lg:shadow-none"
      }`}
    >
      {/* Accent left-border */}
      <div
        className={`absolute right-0 top-0 bottom-0 hidden w-[3px] rounded-l-full lg:block transition-all duration-200 ${
          isSelected ? "bg-red-500 opacity-100" : "bg-red-400 opacity-0 group-hover:opacity-100"
        }`}
      />

      {/* Player name & avatar */}
      <div className="col-span-1 flex min-w-0 items-center gap-3 lg:col-auto">
        <input
          type="checkbox"
          aria-label={`اختيار ${player.name}`}
          checked={isSelected}
          onChange={() => onToggleSelection(player._id)}
          className="h-4 w-4 shrink-0 rounded-md border-slate-300 accent-red-600 cursor-pointer"
        />
        <button
          type="button"
          className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-right cursor-pointer"
          onClick={onOpen}
        >
          <div className={`relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-700 font-cairo text-sm font-black text-white shadow-sm ring-2 ring-white transition-all duration-200 group-hover:ring-red-100 group-hover:shadow-md ${
            birthdayInfo?.isToday ? "ring-rose-200" : ""
          }`}>
            {player.photo ? (
              <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
            ) : (
              <span className="font-cairo text-sm font-black">{player.name.charAt(0)}</span>
            )}
            {birthdayInfo?.isToday && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-1 ring-white">
                <Cake className="h-2.5 w-2.5 text-white" />
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <strong className="truncate font-cairo text-sm font-extrabold text-slate-900 transition-colors group-hover:text-red-600">
                {player.name}
              </strong>
              {birthdayInfo?.isToday && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-rose-600 to-amber-500 px-2 py-0.5 text-[10px] font-black text-white shadow-xs animate-pulse">
                  <Cake className="h-2.5 w-2.5" />
                  {birthdayInfo.turningAge} سنة
                </span>
              )}
              {!birthdayInfo?.isToday && birthdayInfo?.isUpcoming && birthdayInfo?.daysLeft <= 3 && (
                <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                  <Cake className="h-2.5 w-2.5" />
                  {birthdayInfo.daysLeft === 1 ? "غداً" : `بعد ${birthdayInfo.daysLeft} أيام`}
                </span>
              )}
            </div>
            <small className="mt-0.5 block text-[11px] font-medium text-slate-400">
              تسجيل {new Date(player.createdAt).toLocaleDateString("ar-EG")}
            </small>
          </div>
        </button>
      </div>

      {/* Age & Branch */}
      <div className="col-span-2 flex items-center gap-3 border-t border-slate-100 pt-2.5 text-xs lg:col-auto lg:contents lg:border-0 lg:pt-0">
        <div className="shrink-0 lg:col-start-2">
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-[11px] ${
            birthdayInfo?.isToday ? "bg-rose-100 text-rose-800 font-black" : "bg-slate-100/80 text-slate-700"
          }`}>
            <UserRound className="h-3 w-3" />
            {player.age} سنة
            {birthdayInfo?.isToday && <Cake className="h-3 w-3 text-rose-500" />}
          </span>
        </div>
        <div className="max-w-[55%] truncate border-r border-slate-200 pr-3 lg:col-start-3 lg:max-w-none lg:border-0 lg:pr-0">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/60 px-2 py-1 text-[11px] font-semibold text-slate-600">
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {player.branch}
          </span>
        </div>
      </div>

      {/* Attendance buttons */}
      <div className="col-span-1 grid grid-cols-2 gap-1.5 lg:col-auto lg:flex">
        <button
          type="button"
          className={`min-h-9 sm:min-h-10 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 ${
            present
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-200"
              : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
          }`}
          disabled={Boolean(attendanceBusy)}
          onClick={() => updateAttendance("present")}
        >
          {attendanceBusy === "present" ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
          ) : (
            <>
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>حاضر</span>
            </>
          )}
        </button>

        <button
          type="button"
          className={`min-h-9 sm:min-h-10 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 ${
            absent
              ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/25 ring-2 ring-rose-200"
              : "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
          }`}
          disabled={Boolean(attendanceBusy)}
          onClick={() => updateAttendance("absent")}
        >
          {attendanceBusy === "absent" ? (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
          ) : (
            <>
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>غياب</span>
            </>
          )}
        </button>
      </div>

      {/* Payment badge */}
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
          <span className="h-3.5 w-3.5 rounded-full border-2 border-current/40 border-t-current animate-spin inline-block" />
        ) : paymentStatus === "paid" ? (
          <>
            <CreditCard className="h-3.5 w-3.5" />
            <span>مدفوع</span>
          </>
        ) : (
          <>
            <Clock className="h-3.5 w-3.5 animate-pulse" />
            <span>لم يدفع</span>
          </>
        )}
      </button>

      {/* Open profile button */}
      <button
        type="button"
        className="col-start-2 row-start-1 flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 lg:col-auto lg:row-auto cursor-pointer"
        onClick={onOpen}
        title="عرض وتعديل ملف اللاعب"
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </div>
  );
}

export default memo(PlayerRow);
