import { Building2, ChevronLeft, MapPin, Users } from "lucide-react";
import { paymentStatusFor } from "../../lib/dashboard-utils";

const BRANCH_GRADIENTS = [
  "from-red-500 to-rose-600",
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-purple-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
  "from-pink-500 to-rose-600",
  "from-slate-600 to-slate-800",
];

const BRANCH_ICON_COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#8b5cf6",
  "#f59e0b", "#06b6d4", "#ec4899", "#475569",
];

export default function BranchOverview({
  branches,
  players,
  sessionDate,
  paymentMonth,
  onSelectBranch,
  onMarkPresent,
  busyBranch,
}) {
  if (!branches.length) return null;

  return (
    <section className="mt-7">
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch, idx) => {
          const gradient = BRANCH_GRADIENTS[idx % BRANCH_GRADIENTS.length];
          const accentColor = BRANCH_ICON_COLORS[idx % BRANCH_ICON_COLORS.length];
          const branchPlayers = players.filter((p) => p.branch === branch.name);
          const present = branchPlayers.filter((p) =>
            (p.attendance || []).some(
              (a) => a.date === sessionDate && a.status === "present"
            )
          ).length;
          const absent = branchPlayers.filter((p) =>
            (p.attendance || []).some(
              (a) => a.date === sessionDate && a.status === "absent"
            )
          ).length;
          const paid = branchPlayers.filter(
            (p) => paymentStatusFor(p, paymentMonth) === "paid",
          ).length;
          const unpaid = branchPlayers.length - paid;
          const busy = busyBranch === branch.name;
          const attendanceRate = branchPlayers.length
            ? Math.round((present / branchPlayers.length) * 100)
            : 0;

          return (
            <article
              key={branch._id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-slate-300/80 animate-card-entrance"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              {/* Gradient header strip */}
              <div className={`h-1.5 w-full bg-gradient-to-r ${gradient}`} />

              <div className="p-4 sm:p-5">
                {/* Title row */}
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 text-right cursor-pointer"
                    onClick={() => onSelectBranch(branch.name)}
                  >
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md transition-transform duration-300 group-hover:scale-105`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate font-cairo text-sm font-black text-slate-900 transition-colors group-hover:text-red-600">
                        {branch.name}
                      </strong>
                      <span className="flex items-center gap-1 mt-0.5 text-[11px] font-semibold text-slate-400">
                        <Users className="h-3 w-3" />
                        {branchPlayers.length} لاعب مسجل
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectBranch(branch.name)}
                    className="shrink-0 flex items-center gap-0.5 rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                  >
                    عرض
                    <ChevronLeft className="h-3 w-3" />
                  </button>
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

                {/* Action buttons */}
                <div className="mt-3.5 flex gap-2">
                  <button
                    type="button"
                    className="min-h-11 sm:min-h-9 flex-1 rounded-xl border border-slate-200 bg-slate-50/80 px-2.5 text-xs font-black text-slate-700 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active-press cursor-pointer"
                    onClick={() => onSelectBranch(branch.name)}
                  >
                    عرض اللاعبين
                  </button>
                  <button
                    type="button"
                    className="relative min-h-11 sm:min-h-9 flex-1 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 text-xs font-black text-white shadow-sm shadow-emerald-500/20 transition-all hover:brightness-105 hover:shadow-md active-press cursor-pointer disabled:cursor-wait disabled:opacity-60"
                    disabled={!branchPlayers.length || busy}
                    onClick={() => onMarkPresent(branch.name)}
                  >
                    {busy ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                        جاري...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1">
                        <CheckMarkIcon className="h-3.5 w-3.5" />
                        تحضير الكل
                      </span>
                    )}
                  </button>
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
