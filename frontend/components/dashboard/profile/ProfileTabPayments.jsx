import { CreditCard, Plus, Trash2 } from "lucide-react";
import { toEnglishDigits } from "../../../lib/dashboard-utils";

export default function ProfileTabPayments({
  player,
  onOpenEditPayment,
  onDeletePayment,
  deletingPaymentMonth,
  updatingPaymentMonth,
  customPaymentMonth,
  setCustomPaymentMonth,
  customTotalAmount,
  setCustomTotalAmount,
  customPaidAmount,
  setCustomPaidAmount,
  addCustomPayment,
  paymentSaving,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* سجل الاشتراكات */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <CreditCard className="h-4 w-4" />
                </div>
                <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                  سجل الاشتراكات السابقة
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {(player.paymentHistory || []).length} شهر مسجل
              </span>
            </div>

            {!player.paymentHistory || player.paymentHistory.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <CreditCard className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">لا توجد اشتراكات مسجلة بعد.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 sm:max-h-80 lg:max-h-[380px] overflow-y-auto pr-1">
                {[...player.paymentHistory].reverse().map((item) => {
                  const itemHasFee =
                    item.totalAmount !== undefined && item.totalAmount !== null && Number(item.totalAmount) > 0;
                  const itemTotal = itemHasFee
                    ? Number(item.totalAmount)
                    : (player?.defaultTotalAmount
                        ? Number(player.defaultTotalAmount)
                        : (player?.totalAmount && Number(player.totalAmount) > 0 ? Number(player.totalAmount) : 0));
                  const hasFee = itemTotal > 0;
                  const itemPaid = item.paidAmount !== undefined ? Number(item.paidAmount) : (item.status === "paid" && hasFee ? itemTotal : 0);
                  const itemRem = hasFee ? Math.max(0, itemTotal - itemPaid) : 0;
                  const isItemPaid = hasFee ? (itemPaid >= itemTotal && itemTotal > 0) : item.status === "paid";
                  const isItemPartial = itemPaid > 0 && !isItemPaid;

                  return (
                    <div
                      className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs gap-2"
                      key={item.month}
                    >
                      <div>
                        <span className="font-bold text-slate-800 block sm:inline">{item.month}</span>
                        <span className="text-[11px] font-semibold text-slate-500 sm:mr-2">
                          {hasFee
                            ? `(دفع: ${itemPaid} ج.م • متبقي: ${itemRem} ج.م)`
                            : (itemPaid > 0 ? `(دفع: ${itemPaid} ج.م)` : "(غير مسدد)")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            onOpenEditPayment(item.month, {
                              totalAmount: itemTotal,
                              paidAmount: itemPaid,
                              remainingAmount: itemRem,
                              hasConfiguredAmount: hasFee,
                              status: isItemPaid ? "paid" : isItemPartial ? "partially_paid" : "unpaid",
                            });
                          }}
                          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer touch-manipulation ${
                            isItemPaid
                              ? "bg-emerald-600 text-white"
                              : isItemPartial
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                          }`}
                          title="انقر لتعديل الدفعة"
                        >
                          {isItemPaid ? "✓ مدفوع" : isItemPartial ? `دفع ${itemPaid} • باقي ${itemRem}` : "لم يدفع"}
                        </button>
                        <button
                          type="button"
                          disabled={Boolean(updatingPaymentMonth || deletingPaymentMonth)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer touch-manipulation"
                          onClick={() => onDeletePayment(item.month)}
                          title="حذف من السجل"
                        >
                          {deletingPaymentMonth === item.month ? (
                            <span className="h-3 w-3 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* إضافة اشتراك شهر مخصص */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Plus className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                  تسجيل اشتراك شهر محدد
                </h3>
                <p className="text-[10px] text-slate-400">سجل أو حدد اشتراك لأي شهر</p>
              </div>
            </div>

            <form onSubmit={addCustomPayment} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">الشهر</label>
                <input
                  type="month"
                  value={customPaymentMonth}
                  onChange={(e) => setCustomPaymentMonth(e.target.value)}
                  className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white cursor-pointer"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">المطلوب (ج.م)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customTotalAmount}
                    onChange={(e) => setCustomTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                    placeholder="حدد المطلوب (مثال: 150)"
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white text-center"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">المدفوع (ج.م)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customPaidAmount}
                    onChange={(e) => setCustomPaidAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                    placeholder="0"
                    className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white text-center"
                    required
                  />
                </div>
              </div>

              <button
                className="min-h-10 w-full rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                type="submit"
                disabled={paymentSaving}
              >
                {paymentSaving ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>جاري الحفظ...</span>
                  </span>
                ) : (
                  "+ حفظ الاشتراك للسجل"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
}
