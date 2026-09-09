import { paymentStatusFor } from "../../lib/dashboard-utils";

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
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-100 text-red-600 font-black text-xs">
            🏢
          </div>
          <div>
            <h2 className="font-cairo text-base font-extrabold text-slate-900 sm:text-lg">
              فروع وصالات الأكاديمية
            </h2>
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
            {branches.length} صالة
          </span>
        </div>
        <span className="rounded-lg bg-white border border-slate-200/70 px-2.5 py-1 text-[11px] font-bold text-slate-500 shadow-2xs">
          📅 بيانات حصة: {sessionDate}
        </span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((branch) => {
          const branchPlayers = players.filter(
            (player) => player.branch === branch.name,
          );
          const present = branchPlayers.filter((player) =>
            player.attendance.some(
              (item) => item.date === sessionDate && item.status === "present",
            ),
          ).length;
          const absent = branchPlayers.filter((player) =>
            player.attendance.some(
              (item) => item.date === sessionDate && item.status === "absent",
            ),
          ).length;
          const paid = branchPlayers.filter(
            (player) => paymentStatusFor(player, paymentMonth) === "paid",
          ).length;
          const unpaid = branchPlayers.length - paid;
          const busy = busyBranch === branch.name;

          return (
            <article
              key={branch._id}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2.5 text-right cursor-pointer"
                  onClick={() => onSelectBranch(branch.name)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white shadow-xs text-base font-bold">
                    🥋
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate font-cairo text-sm font-black text-slate-900 group-hover:text-red-600 transition-colors">
                      {branch.name}
                    </strong>
                    <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                      {branchPlayers.length} لاعب مسجل
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectBranch(branch.name)}
                  className="rounded-lg bg-slate-50 px-2 py-1 text-[11px] font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  فلترة ←
                </button>
              </div>

              {/* شبكة الإحصائيات الأربعة المصغرة */}
              <div className="mt-3.5 grid grid-cols-4 gap-1.5 rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-center">
                <div className="rounded-lg bg-white p-1.5 shadow-2xs">
                  <strong className="block font-cairo text-sm font-black text-emerald-600">
                    {present}
                  </strong>
                  <span className="text-[10px] font-bold text-slate-400">حاضر</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 shadow-2xs">
                  <strong className="block font-cairo text-sm font-black text-rose-600">
                    {absent}
                  </strong>
                  <span className="text-[10px] font-bold text-slate-400">غائب</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 shadow-2xs">
                  <strong className="block font-cairo text-sm font-black text-sky-600">
                    {paid}
                  </strong>
                  <span className="text-[10px] font-bold text-slate-400">مدفوع</span>
                </div>
                <div className="rounded-lg bg-white p-1.5 shadow-2xs">
                  <strong className="block font-cairo text-sm font-black text-amber-600">
                    {unpaid}
                  </strong>
                  <span className="text-[10px] font-bold text-slate-400">متبقي</span>
                </div>
              </div>

              {/* أزرار الإجراء السريع */}
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="min-h-9 flex-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 transition-all hover:border-red-200 hover:bg-red-50/40 hover:text-red-600 active:scale-98"
                  onClick={() => onSelectBranch(branch.name)}
                >
                  عرض اللاعبين
                </button>
                <button
                  type="button"
                  className="min-h-9 flex-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 text-xs font-bold text-white shadow-xs transition-all hover:brightness-105 active:scale-98 disabled:cursor-wait disabled:opacity-60"
                  disabled={!branchPlayers.length || busy}
                  onClick={() => onMarkPresent(branch.name)}
                >
                  {busy ? "جاري الحفظ..." : "✓ تحضير الكل"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

