import { useState } from "react";
export default function BranchManager({
  branches,
  players = [],
  onAdd,
  onDelete,
  onDeleteBlocked,
  onClose,
}) {
  const [name, setName] = useState("");
  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  }
  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
              إعداد الأكاديمية
            </p>
            <h2 className="text-xl font-extrabold text-slate-900">
              إدارة الفروع
            </h2>
          </div>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-lg text-slate-500"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <p className="mb-4 text-sm leading-7 text-slate-500">
          أضف عدد الصالات وأسماءها، وستظهر تلقائيًا عند تسجيل أي لاعب.
        </p>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
          <input
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 text-right text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اسم الفرع، مثال: صالة أكتوبر"
          />
          <button
            className="min-h-11 whitespace-nowrap rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm"
            type="submit"
          >
            إضافة
          </button>
        </form>
        <div className="grid max-h-[40vh] gap-2 overflow-y-auto">
          {branches.length === 0 ? (
            <p className="text-sm text-slate-500">لم تتم إضافة فروع بعد.</p>
          ) : (
            branches.map((branch) => (
              <div
                className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3"
                key={branch._id}
              >
                <span className="text-lg text-red-600">⌂</span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-semibold text-slate-900">
                    {branch.name}
                  </strong>
                  <small className="text-[10px] text-slate-400">
                    {
                      players.filter((player) => player.branch === branch.name)
                        .length
                    }{" "}
                    لاعب
                  </small>
                </span>
                <button
                  className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  onClick={() => {
                    const playerCount = players.filter(
                      (player) => player.branch === branch.name,
                    ).length;
                    if (playerCount) {
                      onDeleteBlocked?.(branch.name, playerCount);
                      return;
                    }
                    onDelete(branch.name);
                  }}
                  title="حذف الفرع"
                >
                  حذف الفرع
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
