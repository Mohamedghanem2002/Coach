export default function EventBulkActionsDock({
  selectedCount,
  onBulkPayment,
  onBulkRemove,
  onCancel,
}) {
  if (!selectedCount) return null;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg animate-slide-up">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 font-cairo text-xs font-black text-white shadow-xs">
          {selectedCount}
        </span>
        <span className="text-xs font-bold">لاعب محدد لإجراء جماعي</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onBulkPayment}
          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white active-press transition cursor-pointer"
        >
          تسجيل سداد كامل
        </button>

        <button
          type="button"
          onClick={onBulkRemove}
          className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white active-press transition cursor-pointer"
        >
          إزالة من الفعالية
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
