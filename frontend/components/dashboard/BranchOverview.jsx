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
    <section className="mt-5">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-600">
            نظرة سريعة
          </p>
          <h2 className="mt-1 text-base font-extrabold text-slate-900">
            إدارة الصالات
          </h2>
        </div>
        <span className="text-[11px] text-slate-400">بيانات {sessionDate}</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
              className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md sm:p-3"
              key={branch._id}
            >
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg p-1 text-right transition hover:bg-slate-50"
                onClick={() => onSelectBranch(branch.name)}
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-base text-red-600">
                  🏢
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-[13px] font-extrabold text-slate-900">
                    {branch.name}
                  </strong>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    {branchPlayers.length} لاعب مسجل
                  </span>
                </span>
                <span className="whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[9px] font-bold text-slate-500">
                  عرض اللاعبين ←
                </span>
              </button>

              <div className="mt-2 grid grid-cols-4 gap-1 border-y border-slate-100 py-2 text-center">
                <div>
                  <strong className="block text-sm font-extrabold text-green-600">
                    {present}
                  </strong>
                  <span className="text-[10px] text-slate-400">حاضر</span>
                </div>
                <div>
                  <strong className="block text-sm font-extrabold text-red-600">
                    {absent}
                  </strong>
                  <span className="text-[10px] text-slate-400">غائب</span>
                </div>
                <div>
                  <strong className="block text-sm font-extrabold text-blue-600">
                    {paid}
                  </strong>
                  <span className="text-[10px] text-slate-400">مدفوع</span>
                </div>
                <div>
                  <strong className="block text-sm font-extrabold text-orange-600">
                    {unpaid}
                  </strong>
                  <span className="text-[10px] text-slate-400">متأخر</span>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-100 bg-green-50/60 p-2">
                <p className="min-w-0 flex-1 text-[10px] font-semibold leading-5 text-green-700">
                  حضور كل لاعبي الصالة
                </p>
                <button
                  type="button"
                  className="min-h-9 shrink-0 rounded-lg bg-green-600 px-2.5 text-[10px] font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60"
                  disabled={!branchPlayers.length || busy}
                  onClick={() => onMarkPresent(branch.name)}
                >
                  {busy ? "جاري..." : "حضور المجموعة"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
