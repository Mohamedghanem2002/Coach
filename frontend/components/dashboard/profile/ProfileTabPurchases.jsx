import {
  ShoppingBag,
  Plus,
  Check,
  Clock,
  CreditCard,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

export default function ProfileTabPurchases({
  purchasesSummary,
  onOpenAddPurchase,
  handleToggleDelivery,
  deliveryLoadingSet = new Set(),
  optimisticDeliveryMap = {},
  onOpenPayPurchase,
  onOpenEditPurchase,
  onDeletePurchase,
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShoppingBag className="h-4 w-4" />
            </div>
            <h3 className="font-cairo text-sm font-extrabold text-slate-900">
              المشتريات والمستلزمات
            </h3>
          </div>

          <button
            type="button"
            onClick={onOpenAddPurchase}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-2xs hover:brightness-110 active:scale-95 transition cursor-pointer touch-manipulation"
          >
            <Plus className="h-3.5 w-3.5 stroke-[3]" />
            <span>إضافة سلعة / بدلة</span>
          </button>
        </div>

        {/* شريط الإحصائيات عند وجود مشتريات */}
        {purchasesSummary.count > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-500">إجمالي المشتريات</span>
              <strong className="font-cairo text-xs sm:text-sm font-black text-slate-800">
                {purchasesSummary.totalAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
              </strong>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-emerald-700">المسدد</span>
              <strong className="font-cairo text-xs sm:text-sm font-black text-emerald-700">
                {purchasesSummary.paidAmount} <span className="text-[9px] font-normal text-emerald-500">ج.م</span>
              </strong>
            </div>
            <div className={`rounded-xl border p-2 text-center shadow-2xs ${
              purchasesSummary.remainingAmount > 0
                ? "border-rose-300 bg-rose-50/70"
                : "border-slate-200/80 bg-slate-50/80"
            }`}>
              <span className={`block text-[10px] font-bold ${
                purchasesSummary.remainingAmount > 0 ? "text-rose-700" : "text-slate-500"
              }`}>
                المتبقي
              </span>
              <strong className={`font-cairo text-xs sm:text-sm font-black ${
                purchasesSummary.remainingAmount > 0 ? "text-rose-700" : "text-slate-800"
              }`}>
                {purchasesSummary.remainingAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
              </strong>
            </div>
            <div className={`rounded-xl border p-2 text-center shadow-2xs ${
              purchasesSummary.undeliveredCount > 0
                ? "border-amber-300 bg-amber-50/80"
                : "border-emerald-200/80 bg-emerald-50/50"
            }`}>
              <span className={`block text-[10px] font-bold ${
                purchasesSummary.undeliveredCount > 0 ? "text-amber-800" : "text-emerald-700"
              }`}>
                حالة الاستلام
              </span>
              <strong className={`font-cairo text-xs sm:text-sm font-black ${
                purchasesSummary.undeliveredCount > 0 ? "text-amber-900" : "text-emerald-700"
              }`}>
                {purchasesSummary.undeliveredCount > 0
                  ? `باقي ${purchasesSummary.undeliveredCount} لم يستلم ⏳`
                  : "استلم الكل ✓"}
              </strong>
            </div>
          </div>
        )}

        {/* قائمة السلع */}
        {purchasesSummary.count === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <p className="text-xs font-extrabold text-slate-700 mb-1">
              لا توجد مشتريات أو أدوات مسجلة لهذا اللاعب
            </p>
            <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
              يمكنك تسجيل شراء بدلة، حزام، قفازات أو أي أدوات ومتابعة المبالغ المدفوعة والمتبقية بسهولة.
            </p>
            <button
              type="button"
              onClick={onOpenAddPurchase}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-black text-red-700 hover:bg-red-100 transition cursor-pointer touch-manipulation"
            >
              <Plus className="h-3.5 w-3.5 stroke-[3]" />
              <span>تسجيل أول سلعة أو بدلة</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 sm:max-h-80 lg:max-h-[420px] overflow-y-auto pr-1">
            {[...purchasesSummary.purchases].reverse().map((item) => {
              const tot = Number(item.totalAmount) || 0;
              const pd = Number(item.paidAmount) || 0;
              const rem = Math.max(0, tot - pd);
              const isPaid = pd >= tot && tot > 0;
              const isPartial = pd > 0 && !isPaid;

              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs space-y-2 flex flex-col justify-between"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 font-bold shrink-0">
                        🥋
                      </span>
                      <div>
                        <strong className="font-bold text-slate-900 block sm:inline text-xs sm:text-sm">
                          {item.title}
                        </strong>
                        {item.date && (
                          <span className="text-[10px] font-semibold text-slate-400 sm:mr-2">
                            ({item.date})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
                      {/* زر وتأكيد استلام السلعة */}
                      <button
                        type="button"
                        onClick={() => handleToggleDelivery(item)}
                        disabled={deliveryLoadingSet.has(item.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer active:scale-95 touch-manipulation border disabled:opacity-75 disabled:cursor-wait ${
                          (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received"
                            ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                            : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs"
                        }`}
                        title={
                          (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received"
                            ? "استلم اللاعب السلعة ✓ (انقر للتغيير إلى: لم يستلم)"
                            : "اللاعب لم يستلم السلعة بعد ⏳ (انقر لتسجيل أنه استلم)"
                        }
                      >
                        {deliveryLoadingSet.has(item.id) ? (
                          <>
                            <Loader2 className="h-3 w-3 animate-spin text-current shrink-0" />
                            <span>جاري الحفظ...</span>
                          </>
                        ) : (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received" ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600 stroke-[3] shrink-0" />
                            <span>استلم ✓</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>لم يستلم ⏳</span>
                          </>
                        )}
                      </button>

                      {/* شارة حالة السداد */}
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : isPartial
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {isPaid
                          ? "✓ مدفوع بالكامل"
                          : isPartial
                          ? `دفع ${pd} • باقي ${rem} ج.م`
                          : `غير مدفوع (باقي ${rem} ج.م)`}
                      </span>
                    </div>
                  </div>

                  {/* Details & notes */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                    <div className="flex flex-wrap items-center gap-2">
                      <span>المطلوب: <strong className="text-slate-800 font-bold">{tot} ج.م</strong></span>
                      <span>•</span>
                      <span>المدفوع: <strong className="text-emerald-700 font-bold">{pd} ج.م</strong></span>
                      {rem > 0 && (
                        <>
                          <span>•</span>
                          <span>المتبقي: <strong className="text-rose-700 font-bold">{rem} ج.م</strong></span>
                        </>
                      )}
                      {item.notes && (
                        <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200/60 text-[10px] text-slate-600 max-w-[200px] truncate">
                          📝 {item.notes}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                      {rem > 0 && (
                        <button
                          type="button"
                          onClick={() => onOpenPayPurchase(item)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-700 active:scale-95 transition cursor-pointer touch-manipulation shadow-2xs"
                          title="تسجيل سداد دفعة على هذه السلعة"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>تسجيل دفعة</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onOpenEditPurchase(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                        title="تعديل السلعة"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePurchase(item)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        title="حذف من السجل"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}
