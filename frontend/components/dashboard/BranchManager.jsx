import { useState } from "react";

export default function BranchManager({
  branches,
  players = [],
  onAdd,
  onDelete,
  onDeleteBlocked,
  notice = "",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in-scale"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:p-8">
        {/* رأس النافذة */}
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-xs text-lg font-bold">
              🏢
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                إعداد الصالات
              </p>
              <h2 className="font-cairo text-lg font-black text-slate-900 sm:text-xl">
                إدارة فروع الأكاديمية
              </h2>
            </div>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-xs font-medium leading-6 text-slate-500">
          أضف الصالات الرياضية وأماكن التدريب التابعة للأكاديمية لترتيب حضور واشتراكات الأبطال.
        </p>

        {notice && (
          <div
            className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold leading-6 ${
              notice.startsWith("تم")
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-rose-200 bg-rose-50 text-rose-800"
            }`}
            role="status"
          >
            <span>{notice.startsWith("تم") ? "✓" : "⚠️"}</span>
            <span>{notice}</span>
          </div>
        )}

        <form className="mb-5 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
          <input
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-right text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="اسم الفرع، مثال: صالة النادي الرئيسي"
            required
          />
          <button
            className="min-h-11 whitespace-nowrap rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 cursor-pointer"
            type="submit"
          >
            ＋ إضافة فرع
          </button>
        </form>

        <div className="grid max-h-[42vh] gap-2.5 overflow-y-auto pr-0.5">
          {branches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
              <span className="text-3xl block mb-2">🏢</span>
              <p className="text-xs font-bold">لم تتم إضافة فروع بعد.</p>
            </div>
          ) : (
            branches.map((branch) => {
              const playerCount = players.filter(
                (player) => player.branch === branch.name,
              ).length;

              return (
                <div
                  key={branch._id}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-slate-300 hover:bg-white"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-2xs border border-slate-200/60">
                      🥋
                    </div>
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate font-cairo text-sm font-extrabold text-slate-900">
                        {branch.name}
                      </strong>
                      <span className="text-[11px] font-bold text-slate-400">
                        {playerCount} لاعب مسجل
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="rounded-xl bg-rose-50 border border-rose-200/60 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 cursor-pointer"
                    onClick={() => {
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
