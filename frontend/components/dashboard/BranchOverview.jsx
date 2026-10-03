import { useState, useEffect } from "react";
import {
  Building2,
  ChevronLeft,
  MapPin,
  Users,
  FileText,
  Lock,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  paymentStatusFor,
  isPlayerPresentOnDate,
  isPlayerAbsentOnDate,
  isBranchWorkingDate,
  isBranchTooEarly,
  isBranchSessionEnded,
  getBranchDayEntry,
  formatBranchDays,
  getDayKeyFromDate,
} from "../../lib/dashboard-utils";

const BRANCH_GRADIENTS = [
  "from-red-600 to-rose-700",
  "from-slate-700 to-slate-900",
  "from-emerald-600 to-teal-700",
  "from-blue-600 to-indigo-700",
  "from-amber-600 to-orange-700",
  "from-sky-600 to-blue-700",
  "from-zinc-700 to-slate-800",
  "from-red-700 to-slate-900",
];

const BRANCH_ICON_COLORS = [
  "#dc2626", "#334155", "#059669", "#2563eb",
  "#d97706", "#0284c7", "#3f3f46", "#b91c1c",
];

export default function BranchOverview({
  branches,
  players,
  sessionDate,
  paymentMonth,
  onSelectBranch,
  onMarkPresent,
  onOpenAttendanceReport,
  busyBranch,
}) {
  // Re-evaluate every 30 seconds so time-based locks update dynamically
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  if (!branches || !branches.length) return null;

  return (
    <section className="mt-7 w-full max-w-full overflow-hidden">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <p className="section-eyebrow">
            <MapPin className="h-3 w-3" />
            فروع وصالات الأكاديمية
          </p>
          <span className="rounded-full bg-slate-100 border border-slate-200/80 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {branches.length} صالة
          </span>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg bg-white border border-slate-200/70 px-2.5 py-1 text-[11px] font-semibold text-slate-500 shadow-xs">
          <CalIcon className="h-3 w-3 text-red-500" />
          بيانات حصة: {sessionDate}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 w-full max-w-full">
        {branches.map((branch, idx) => {
          const gradient = BRANCH_GRADIENTS[idx % BRANCH_GRADIENTS.length];
          const accentColor = BRANCH_ICON_COLORS[idx % BRANCH_ICON_COLORS.length];
          const branchPlayers = players.filter((p) => p.branch === branch.name);
          const present = branchPlayers.filter((p) =>
            isPlayerPresentOnDate(p, sessionDate)
          ).length;
          const absent = branchPlayers.filter((p) =>
            isPlayerAbsentOnDate(p, branches, sessionDate)
          ).length;
          const paid = branchPlayers.filter(
            (p) => paymentStatusFor(p, paymentMonth) === "paid",
          ).length;
          const unpaid = branchPlayers.length - paid;
          const busy = busyBranch === branch.name;
          const attendanceRate = branchPlayers.length
            ? Math.round((present / branchPlayers.length) * 100)
            : 0;

          // Training working schedule validation
          const isWorking = isBranchWorkingDate(branch, sessionDate, new Date(nowTick));
          const tooEarly = isBranchTooEarly(branch, sessionDate, new Date(nowTick));
          const sessionEnded = isBranchSessionEnded(branch, sessionDate, new Date(nowTick));
          const dayKey = getDayKeyFromDate(sessionDate);
          const dayEntry = getBranchDayEntry(branch, dayKey);
          const formattedDays = formatBranchDays(branch);
          const allAlreadyPresent = branchPlayers.length > 0 && present === branchPlayers.length;
          const canMarkPresent = isWorking && branchPlayers.length > 0 && !allAlreadyPresent && !busy;

          return (
            <article
              key={branch._id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              {/* Top brand strip */}
              <div className="h-1 w-full bg-red-600" />

              <div className="p-4 sm:p-5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-right cursor-pointer"
                    onClick={() => onSelectBranch(branch.name)}
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200/80 transition-transform duration-200 group-hover:scale-105">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate font-cairo text-sm font-black text-slate-900 transition-colors group-hover:text-red-600">
                        {branch.name}
                      </strong>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Users className="h-3 w-3" />
                          {branchPlayers.length} لاعب
                        </span>
                        <span className="text-slate-300">•</span>
                        {isWorking ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {dayEntry?.from && dayEntry?.to ? `${dayEntry.from} - ${dayEntry.to}` : "موعد تدريب نشط"}
                          </span>
                        ) : tooEarly ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                            <Clock className="h-3 w-3 text-amber-500" />
                            يبدأ {dayEntry?.from}
                          </span>
                        ) : sessionEnded ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Lock className="h-3 w-3 text-slate-400" />
                            انتهت الحصة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            <Lock className="h-3 w-3 text-slate-400" />
                            عطلة اليوم
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-[11px] font-black border shadow-2xs ${
                      attendanceRate === 100
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : attendanceRate > 0
                        ? "bg-sky-50 text-sky-700 border-sky-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        attendanceRate === 100
                          ? "bg-emerald-500"
                          : attendanceRate > 0
                          ? "bg-sky-500 animate-pulse"
                          : "bg-slate-300"
                      }`}
                    />
                    <span>{attendanceRate}% حضور</span>
                  </span>
                </div>

                {/* Attendance progress bar */}
                <div className="mt-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">نسبة الحضور اليوم</span>
                    <span className="text-[11px] font-black text-slate-700">{attendanceRate}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`}
                      style={{ width: `${attendanceRate}%` }}
                    />
                  </div>
                </div>

                {/* Mini stats grid */}
                <div className="mt-3.5 grid grid-cols-4 gap-1.5">
                  {[
                    { value: present, label: "حاضر", color: "border-emerald-100 bg-emerald-50/60 text-emerald-700" },
                    { value: absent, label: "غائب", color: "border-rose-100 bg-rose-50/60 text-rose-700" },
                    { value: paid, label: "مدفوع", color: "border-sky-100 bg-sky-50/60 text-sky-700" },
                    { value: unpaid, label: "متبقي", color: "border-amber-100 bg-amber-50/60 text-amber-700" },
                  ].map(({ value, label, color }) => (
                    <div key={label} className={`rounded-xl border p-2 text-center ${color}`}>
                      <strong className="block font-cairo text-sm font-black">{value}</strong>
                      <span className="text-[9px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Attendance & Absence Report Card Button */}
                <div className="mt-3.5 space-y-2">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-1.5 min-h-10 rounded-xl border border-red-200/90 bg-gradient-to-r from-red-50 to-rose-50 hover:from-red-100 hover:to-rose-100 text-red-700 px-3 py-2 text-xs font-black shadow-2xs transition active-press cursor-pointer touch-manipulation"
                    onClick={() => onOpenAttendanceReport?.(branch.name)}
                    title="توليد كارت تقرير الحضور والغياب للصالة للمشاركة على جروب أولياء الأمور عبر واتساب"
                  >
                    <FileText className="h-4 w-4 text-red-600 shrink-0" />
                    <span>تقرير غياب وحضور 📋</span>
                  </button>

                  {/* Secondary Action buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="min-h-11 sm:min-h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-xs font-black text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active-press cursor-pointer"
                      onClick={() => onSelectBranch(branch.name)}
                      title={`عرض قائمة لاعبي فرع ${branch.name}`}
                    >
                      عرض اللاعبين
                    </button>

                    <button
                      type="button"
                      disabled={!canMarkPresent}
                      onClick={() => {
                        if (canMarkPresent) onMarkPresent(branch.name);
                      }}
                      className={`relative min-h-11 sm:min-h-9 flex-1 overflow-hidden rounded-xl px-2.5 text-xs font-black transition-all select-none ${
                        busy
                          ? "bg-emerald-600 text-white cursor-wait opacity-80"
                          : !isWorking
                          ? "bg-slate-100 text-slate-400 border border-slate-200/90 cursor-not-allowed shadow-none"
                          : allAlreadyPresent
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-300/80 cursor-default"
                          : !branchPlayers.length
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none"
                          : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs hover:shadow-md cursor-pointer active-press"
                      }`}
                      title={
                        busy
                          ? "جاري تسجيل الحضور..."
                          : !isWorking
                          ? tooEarly
                            ? `يبدأ موعد التدريب الساعة ${dayEntry?.from}`
                            : sessionEnded
                            ? "انتهت فترة التدريب المحددة لهذه الصالة اليوم"
                            : `اليوم خارج مواعيد عمل الصالة (${formattedDays})`
                          : allAlreadyPresent
                          ? "تم تسجيل حضور جميع لاعبي الصالة بالفعل"
                          : !branchPlayers.length
                          ? "لا يوجد لاعبين مسجلين في هذه الصالة"
                          : `تسجيل حضور جميع أبطال صالة ${branch.name} لحصة اليوم بضغطة واحدة`
                      }
                    >
                      {busy ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                          جاري...
                        </span>
                      ) : !isWorking ? (
                        <span className="flex items-center justify-center gap-1 text-[11px]">
                          {tooEarly ? (
                            <>
                              <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                              <span>يبدأ {dayEntry?.from}</span>
                            </>
                          ) : sessionEnded ? (
                            <>
                              <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>انتهت الحصة</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span>عطلة اليوم</span>
                            </>
                          )}
                        </span>
                      ) : allAlreadyPresent ? (
                        <span className="flex items-center justify-center gap-1 text-emerald-700">
                          <CheckMarkIcon className="h-3.5 w-3.5 text-emerald-600" />
                          تم تحضير الكل ✓
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1">
                          <CheckMarkIcon className="h-3.5 w-3.5" />
                          تحضير الكل
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Clarification hint if outside working hours */}
                  {!isWorking && (
                    <p className="mt-1 text-center text-[10px] font-bold text-slate-400 flex items-center justify-center gap-1 select-none">
                      <Lock className="h-3 w-3 shrink-0 text-slate-400" />
                      <span>
                        {tooEarly
                          ? `التسجيل يفتح الساعة ${dayEntry?.from}`
                          : sessionEnded
                          ? "انتهى موعد تدريب الصالة اليوم"
                          : `أيام عمل الصالة: ${formattedDays}`}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

/* Mini inline icons to avoid repeated imports */
function CalIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function CheckMarkIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
