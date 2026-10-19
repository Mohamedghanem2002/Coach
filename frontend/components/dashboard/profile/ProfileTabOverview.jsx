import { CreditCard, Phone, Pencil, ShoppingBag, Trash2 } from "lucide-react";

export default function ProfileTabOverview({
  player,
  paymentMonth,
  paymentDetails,
  monthlyStatus,
  totalAmount,
  paidAmount,
  remainingAmount,
  paymentRate,
  setTargetPaymentMonth,
  setTargetPaymentDetails,
  setShowPaymentModal,
  isTogglingPayment,
  handleToggleMonthlyPayment,
  attendanceRate,
  attended,
  totalAttendanceCount,
  purchasesSummary,
  setMobileProfileTab,
  startEditing,
  guardianPhone,
  unpaidPurchases = [],
  setShowDeleteConfirm,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
      {/* العمود الرئيسي (المعاملات المالية ونسب الالتزام) */}
      <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
        {/* كارت اشتراك الشهر الحالي المطور */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs">
                <CreditCard className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-cairo text-xs sm:text-sm font-black text-slate-900">
                  اشتراك شهر {paymentMonth}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                  تفاصيل سداد اشتراك الشهر المحدد
                </p>
              </div>
            </div>

            {/* شارة الحالة */}
            <span
              className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                monthlyStatus === "paid"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : monthlyStatus === "partially_paid"
                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                    : "bg-rose-100 text-rose-800 border border-rose-200"
              }`}
            >
              {monthlyStatus === "paid"
                ? "✓ مدفوع بالكامل"
                : monthlyStatus === "partially_paid"
                  ? "دفع جزئي"
                  : "لم يدفع بعد"}
            </span>
          </div>

          {/* 3 أرقام بيانية للمطلوب والمدفوع والمتبقي */}
          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-slate-500">المطلوب</span>
              {totalAmount > 0 ? (
                <strong className="font-cairo text-sm sm:text-base font-black text-slate-800">
                  {totalAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                </strong>
              ) : (
                <strong className="font-cairo text-xs font-bold text-slate-500">
                  غير محدد
                </strong>
              )}
            </div>
            <div className="rounded-xl bg-slate-50 border border-emerald-200/80 p-2.5 text-center shadow-2xs">
              <span className="block text-[10px] font-bold text-emerald-700">المدفوع</span>
              <strong className="font-cairo text-sm sm:text-base font-black text-emerald-700">
                {paidAmount} <span className="text-[9px] font-normal text-emerald-500">ج.م</span>
              </strong>
            </div>
            <div className={`rounded-xl bg-slate-50 border p-2.5 text-center shadow-2xs ${
              remainingAmount > 0 ? "border-rose-200" : "border-slate-200/80"
            }`}>
              <span className={`block text-[10px] font-bold ${
                remainingAmount > 0 ? "text-rose-600" : "text-slate-500"
              }`}>المتبقي</span>
              <strong className={`font-cairo text-sm sm:text-base font-black ${
                remainingAmount > 0 ? "text-rose-600" : "text-slate-800"
              }`}>
                {remainingAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
              </strong>
            </div>
          </div>

          {/* شريط نسبة السداد */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>نسبة السداد:</span>
              <span className="font-black text-slate-800">{paymentRate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  paymentRate === 100
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                    : paymentRate > 0
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-slate-300"
                }`}
                style={{ width: `${paymentRate}%` }}
              />
            </div>
          </div>

          {/* أزرار الإجراءات السريعة */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setTargetPaymentMonth(paymentMonth);
                setTargetPaymentDetails(paymentDetails);
                setShowPaymentModal(true);
              }}
              className="flex-1 h-10 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-cairo text-xs font-black shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <CreditCard className="h-3.5 w-3.5" />
              <span>تسجيل / تعديل الدفعة</span>
            </button>

            {monthlyStatus !== "paid" && (
              <button
                type="button"
                disabled={isTogglingPayment}
                onClick={() => handleToggleMonthlyPayment()}
                className="h-10 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-cairo text-xs font-black active:scale-95 transition cursor-pointer shrink-0 touch-manipulation"
              >
                {isTogglingPayment ? "جاري..." : "سداد كامل ✓"}
              </button>
            )}
          </div>
        </div>

        {/* كارت الإحصائيات الحيوية الثلاثية (بدون تكرار لاشتراك الشهر) */}
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 text-center shadow-2xs">
            <strong className="block font-cairo text-lg sm:text-2xl font-black text-slate-900">
              {attendanceRate}%
            </strong>
            <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
              نسبة الالتزام
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 text-center shadow-2xs">
            <strong className="block font-cairo text-lg sm:text-2xl font-black text-slate-900">
              {attended} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">/ {totalAttendanceCount}</span>
            </strong>
            <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
              حصة حضور
            </span>
          </div>

          {/* كارت متبقي المشتريات / المستلزمات (معلومة حيوية بدلاً من تكرار الاشتراك) */}
          <div
            className={`rounded-2xl border p-3 sm:p-4 text-center cursor-pointer transition active:scale-95 shadow-2xs ${
              purchasesSummary.remainingAmount > 0
                ? "border-amber-300 bg-amber-50/70"
                : "border-slate-200/80 bg-white"
            }`}
            onClick={() => setMobileProfileTab("purchases")}
            title="انقر لعرض تفاصيل مشتريات ومستلزمات اللاعب"
          >
            <strong
              className={`block font-cairo text-base sm:text-xl font-black truncate ${
                purchasesSummary.remainingAmount > 0 ? "text-amber-950" : "text-emerald-700"
              }`}
            >
              {purchasesSummary.remainingAmount > 0
                ? `${purchasesSummary.remainingAmount} ج.م`
                : purchasesSummary.count > 0
                  ? "خالص ✓"
                  : "لا يوجد"}
            </strong>
            <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
              {purchasesSummary.remainingAmount > 0 ? "متبقي مشتريات" : "رصيد المستلزمات"}
            </span>
          </div>
        </div>
      </div>

      {/* العمود الجانبي (بيانات العضوية والتواصل) */}
      <div className="lg:col-span-5 space-y-3.5 sm:space-y-4">
        {/* بطاقة معلومات ولي الأمر والعضوية */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Phone className="h-3.5 w-3.5 text-slate-600" />
              </div>
              <span className="text-xs font-black text-slate-900 font-cairo">بيانات العضوية والتواصل</span>
            </div>
            <button
              type="button"
              onClick={() => startEditing()}
              className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition active:scale-95"
              title="تعديل البيانات"
            >
              <Pencil className="h-3 w-3" />
              <span>تعديل</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            {player.fileNumber && (
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="font-bold text-slate-500 text-[11px]">رقم ملف اللاعب</span>
                <span className="font-cairo font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                  #{player.fileNumber}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-500 text-[11px]">هاتف ولي الأمر</span>
              {guardianPhone ? (
                <span className="font-cairo font-black text-slate-900 tracking-wider" dir="ltr">
                  {guardianPhone}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => startEditing("")}
                  className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                >
                  + إضافة رقم
                </button>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-500 text-[11px]">الفرع والتدريب</span>
              <span className="font-bold text-slate-800 text-[11px]">{player.branch} • حزام {player.belt || "أبيض"}</span>
            </div>

            {player.notes && (
              <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-950 font-medium">
                <span className="font-bold text-amber-900 block mb-0.5">ملاحظات الكابتن:</span>
                <p className="line-clamp-2 leading-relaxed">{player.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* كارت ملخص المشتريات إن وُجدت */}
        {purchasesSummary.count > 0 && (
          <div
            onClick={() => setMobileProfileTab("purchases")}
            className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition active:scale-98 shadow-2xs ${
              purchasesSummary.remainingAmount > 0
                ? "border-amber-300 bg-amber-50/70 text-amber-950 hover:bg-amber-100/80"
                : "border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/80"
            }`}
            title="انقر لعرض تفاصيل المشتريات"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                  purchasesSummary.remainingAmount > 0
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <strong className="text-xs font-black block font-cairo truncate">
                  مشتريات ومستلزمات ({purchasesSummary.count} مسجلة)
                </strong>
                <span className="text-[10px] font-bold opacity-80 truncate block">
                  {purchasesSummary.remainingAmount > 0
                    ? (unpaidPurchases.length === 1
                        ? `${unpaidPurchases[0].title || "السلعة"}: باقي ${unpaidPurchases[0].remainingAmount} ج.م`
                        : `سدد ${purchasesSummary.paidAmount} • باقي ${purchasesSummary.remainingAmount} ج.م`)
                    : `مسددة بالكامل (${purchasesSummary.totalAmount} ج.م) ✓`}
                </span>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                purchasesSummary.remainingAmount > 0
                  ? "bg-amber-200 text-amber-900"
                  : "bg-emerald-200 text-emerald-900"
              }`}
            >
              {purchasesSummary.remainingAmount > 0 ? "يوجد متبقي" : "خالص ✓"}
            </span>
          </div>
        )}

        {/* زر حذف اللاعب النهائي */}
        <button
          type="button"
          className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50/50 p-3 text-xs font-bold text-rose-700 transition hover:border-rose-300 active:scale-98 cursor-pointer shadow-2xs touch-manipulation"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="h-4 w-4 text-rose-500" />
          <span>حذف اللاعب نهائيًا من الأكاديمية</span>
        </button>
      </div>
    </div>
  );
}
