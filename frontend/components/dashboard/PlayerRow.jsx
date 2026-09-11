import { memo, useState } from "react";
import {
  Check,
  X,
  CreditCard,
  Clock,
  ChevronRight,
  ChevronLeft,
  UserRound,
  Cake,
  Phone,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";
import {
  paymentStatusFor,
  getBirthdayInfo,
  getBeltStyle,
  formatWhatsAppPhone,
} from "../../lib/dashboard-utils";

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

  const record = (player.attendance || []).find((item) => item.date === sessionDate);
  const present = record?.status === "present";
  const absent = record?.status === "absent";
  const paymentStatus = paymentStatusFor(player, paymentMonth);
  const birthdayInfo = getBirthdayInfo(player);
  const beltStyle = getBeltStyle(player.belt);

  const totalSessions = Array.isArray(player.attendance) ? player.attendance.length : 0;
  const attendedSessions = Array.isArray(player.attendance)
    ? player.attendance.filter((item) => item.status === "present").length
    : 0;
  const attendanceRate = totalSessions ? Math.round((attendedSessions / totalSessions) * 100) : 0;

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

  const phone =
    player.guardianPhone ||
    player.parentPhone ||
    player.guardianMobile ||
    player.mobile ||
    player.phone ||
    "";
  const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";

  return (
    <>
      {/* ═══════════ MOBILE CARD LAYOUT (< lg) ═══════════ */}
      <div
        className={`lg:hidden relative mb-3 rounded-2xl border p-3.5 transition-all duration-200 ${
          isSelected
            ? "border-red-300 bg-red-50/50 shadow-sm"
            : birthdayInfo?.isToday
            ? "border-rose-300/80 bg-rose-50/30 shadow-xs"
            : "border-slate-200/80 bg-white shadow-xs hover:border-slate-300"
        }`}
      >
        {/* Top Header Row: Checkbox + Avatar + Name & Belt/Level + Open Profile */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            {/* Checkbox */}
            <input
              type="checkbox"
              aria-label={`اختيار ${player.name}`}
              checked={isSelected}
              onChange={() => onToggleSelection(player._id)}
              className="h-5 w-5 shrink-0 rounded-md border-slate-300 accent-red-600 cursor-pointer touch-manipulation"
            />

            {/* Clickable Player info header */}
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 text-right cursor-pointer touch-manipulation"
              onClick={onOpen}
            >
              {/* Avatar */}
              <div
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-rose-700 font-cairo text-sm font-black text-white shadow-xs ring-2 ${
                  birthdayInfo?.isToday ? "ring-rose-300 animate-pulse" : "ring-white"
                }`}
              >
                {player.photo ? (
                  <img
                    src={player.photo}
                    alt={player.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="font-cairo text-sm font-black">
                    {player.name.charAt(0)}
                  </span>
                )}
                {birthdayInfo?.isToday && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-1 ring-white">
                    <Cake className="h-2.5 w-2.5 text-white" />
                  </span>
                )}
              </div>

              {/* Name, Belt, Level */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <strong className="truncate font-cairo text-sm font-black text-slate-900">
                    {player.name}
                  </strong>
                  {birthdayInfo?.isToday && (
                    <span className="shrink-0 rounded-md bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white shadow-2xs animate-pulse">
                      🎂 اليوم
                    </span>
                  )}
                  {birthdayInfo?.daysLeft === 1 && (
                    <span className="shrink-0 rounded-md bg-amber-100 border border-amber-300 px-1.5 py-0.5 text-[9px] font-black text-amber-800">
                      🎂 غداً
                    </span>
                  )}
                </div>

                {/* Belt & Level pills */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-extrabold ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${beltStyle.dot}`} />
                    <span>حزام {player.belt || "أبيض"}</span>
                  </span>
                  <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200/80 px-1.5 py-0.5 font-black text-red-700">
                    مستوى {player.level || "A"}
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* View Profile Chevron button */}
          <button
            type="button"
            onClick={onOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-400 hover:text-slate-700 active:scale-90 transition-all touch-manipulation cursor-pointer"
            title="عرض ملف اللاعب"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Meta Row: Branch & Age & Attendance & Quick Contact */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
              🏢 {player.branch}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
              🎂 {player.age} سنة
            </span>
            {totalSessions > 0 && (
              <span
                className={`rounded-md px-1.5 py-0.5 font-extrabold ${
                  attendanceRate >= 75
                    ? "bg-emerald-50 text-emerald-700"
                    : attendanceRate >= 50
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                التزام {attendanceRate}%
              </span>
            )}
          </div>

          {/* Guardian Phone quick actions */}
          {phone && (
            <div className="flex items-center gap-1.5">
              <a
                href={`tel:${phone}`}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 border border-blue-200/70 text-blue-700 hover:bg-blue-100 active:scale-90 transition-all touch-manipulation"
                title={`اتصال بولي الأمر (${phone})`}
              >
                <Phone className="h-3.5 w-3.5" />
              </a>
              <a
                href={cleanPhone ? `whatsapp://send?phone=${cleanPhone}` : `whatsapp://send`}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-700 hover:bg-emerald-100 active:scale-90 transition-all touch-manipulation"
                title={`واتساب ولي الأمر (${phone})`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* Main Touch Action Bar: Present / Absent / Payment */}
        <div className="mt-3 grid grid-cols-[1fr_1fr_auto] gap-2 pt-1">
          {/* Present Button */}
          <button
            type="button"
            disabled={Boolean(attendanceBusy)}
            onClick={() => updateAttendance("present")}
            className={`min-h-[44px] rounded-xl px-3 text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer ${
              present
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-300"
                : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
            }`}
          >
            {attendanceBusy === "present" ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
            ) : (
              <>
                <Check className="h-4 w-4 stroke-[3]" />
                <span>حاضر</span>
              </>
            )}
          </button>

          {/* Absent Button */}
          <button
            type="button"
            disabled={Boolean(attendanceBusy)}
            onClick={() => updateAttendance("absent")}
            className={`min-h-[44px] rounded-xl px-3 text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer ${
              absent
                ? "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-sm shadow-rose-500/25 ring-2 ring-rose-300"
                : "bg-slate-50 text-slate-700 border border-slate-200 hover:border-rose-300 hover:bg-rose-50/50"
            }`}
          >
            {attendanceBusy === "absent" ? (
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
            ) : (
              <>
                <X className="h-4 w-4 stroke-[3]" />
                <span>غياب</span>
              </>
            )}
          </button>

          {/* Payment Button */}
          <button
            type="button"
            disabled={paymentBusy}
            onClick={updatePayment}
            className={`min-h-[44px] rounded-xl px-3.5 text-xs font-extrabold transition-all duration-150 flex items-center justify-center gap-1.5 active:scale-95 touch-manipulation cursor-pointer shrink-0 ${
              paymentStatus === "paid"
                ? "border border-emerald-300 bg-emerald-50 text-emerald-800 font-black"
                : "border border-rose-300 bg-rose-50 text-rose-800 font-black"
            }`}
            title="تبديل حالة دفع اشتراك الشهر"
          >
            {paymentBusy ? (
              <span className="h-4 w-4 rounded-full border-2 border-current/40 border-t-current animate-spin inline-block" />
            ) : paymentStatus === "paid" ? (
              <>
                <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                <span>مدفوع</span>
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                <span>لم يدفع</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════ DESKTOP TABLE ROW (>= lg) ═══════════ */}
      <div
        className={`group relative hidden min-w-0 lg:grid lg:grid-cols-[2.3fr_0.7fr_1.1fr_1.8fr_1.2fr_0.4fr] lg:items-center lg:gap-4 lg:border-b lg:border-slate-100/90 lg:px-6 lg:py-3.5 lg:hover:bg-slate-50/60 transition-all duration-200 ${
          isSelected
            ? "lg:bg-red-50/30"
            : birthdayInfo?.isToday
            ? "bg-rose-50/15"
            : "bg-white"
        }`}
      >
        {/* Accent left-border */}
        <div
          className={`absolute right-0 top-0 bottom-0 hidden w-[3px] rounded-l-full lg:block transition-all duration-200 ${
            isSelected ? "bg-red-500 opacity-100" : "bg-red-400 opacity-0 group-hover:opacity-100"
          }`}
        />

        {/* Player name & avatar */}
        <div className="flex min-w-0 items-center gap-3">
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
                {birthdayInfo?.daysLeft === 1 && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                    <Cake className="h-2.5 w-2.5" />
                    غداً
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-bold ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${beltStyle.dot}`} />
                  <span>حزام {player.belt || "أبيض"}</span>
                </span>
                <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200/70 px-1.5 py-0.5 font-black text-red-700">
                  مستوى {player.level || "A"}
                </span>
                <span>•</span>
                <span>تسجيل {new Date(player.createdAt).toLocaleDateString("ar-EG")}</span>
                {totalSessions > 0 && (
                  <>
                    <span>•</span>
                    <span
                      className={`font-bold ${
                        attendanceRate >= 75
                          ? "text-emerald-600"
                          : attendanceRate >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      التزام {attendanceRate}%
                    </span>
                  </>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Age */}
        <div>
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-[11px] ${
            birthdayInfo?.isToday ? "bg-rose-100 text-rose-800 font-black" : "bg-slate-100/80 text-slate-700"
          }`}>
            <UserRound className="h-3 w-3" />
            {player.age} سنة
            {birthdayInfo?.isToday && <Cake className="h-3 w-3 text-rose-500" />}
          </span>
        </div>

        {/* Branch */}
        <div className="truncate">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/60 px-2 py-1 text-[11px] font-semibold text-slate-600">
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {player.branch}
          </span>
        </div>

        {/* Attendance buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`min-h-10 flex-1 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
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
            className={`min-h-10 flex-1 rounded-xl px-2.5 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1 active:scale-95 cursor-pointer ${
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
          className={`min-h-10 rounded-xl px-2.5 text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
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
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 cursor-pointer"
          onClick={onOpen}
          title="عرض وتعديل ملف اللاعب"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>
    </>
  );
}

export default memo(PlayerRow);
