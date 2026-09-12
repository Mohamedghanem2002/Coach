"use client";
import { useState, useMemo } from "react";
import {
  CreditCard,
  Check,
  X,
  AlertCircle,
  ShoppingBag,
  Plus,
  Calendar,
  Sparkles,
  ChevronDown,
  DollarSign,
  Tag,
} from "lucide-react";
import { toEnglishDigits, localDate, getPurchasesSummary } from "../../lib/dashboard-utils";

const COMMON_PRESETS = [
  { label: "بدلة كاراتيه 🥋", title: "بدلة كاراتيه" },
  { label: "حزام كاراتيه 🎗️", title: "حزام كاراتيه" },
  { label: "قفازات وواقيات 🥊", title: "قفازات وواقيات كوميتيه" },
  { label: "واقي أسنان 🦷", title: "واقي أسنان" },
  { label: "واقي ساق 🦵", title: "واقي ساق ومشط قدم" },
  { label: "شنطة تدريب 🎒", title: "شنطة تدريب" },
  { label: "تيشرت الأكاديمية 👕", title: "تيشرت الأكاديمية" },
  { label: "اختبار حزام وشهادة 📜", title: "رسوم اختبار حزام وشهادة" },
];

export default function QuickPaymentModal({
  player,
  paymentMonth,
  initialDetails,
  initialTab = "subscription", // "subscription" | "purchases"
  onClose,
  onSave,
  onSavePurchase,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // ─── اشتراك الشهر State ───────────────────────────────────────────────────
  const [totalAmount, setTotalAmount] = useState(
    initialDetails?.totalAmount !== undefined ? String(initialDetails.totalAmount) : "100"
  );
  const [paidAmount, setPaidAmount] = useState(
    initialDetails?.paidAmount !== undefined ? String(initialDetails.paidAmount) : "0"
  );
  const [isSubmittingSub, setIsSubmittingSub] = useState(false);
  const [subError, setSubError] = useState("");

  const numTotal = Math.max(0, Number(toEnglishDigits(totalAmount)) || 0);
  const numPaid = Math.max(0, Number(toEnglishDigits(paidAmount)) || 0);
  const numRemaining = Math.max(0, numTotal - numPaid);

  function handleSetFull() {
    setPaidAmount(String(numTotal));
  }
  function handleSetHalf() {
    setPaidAmount(String(Math.round(numTotal / 2)));
  }
  function handleSetZero() {
    setPaidAmount("0");
  }

  async function handleSubscriptionSubmit(e) {
    e?.preventDefault();
    if (numTotal < 0 || numPaid < 0) {
      setSubError("يرجى إدخال مبالغ صحيحة.");
      return;
    }

    setIsSubmittingSub(true);
    setSubError("");

    try {
      const status =
        numPaid >= numTotal && numTotal > 0
          ? "paid"
          : numPaid > 0
          ? "partially_paid"
          : "unpaid";

      await onSave({
        totalAmount: numTotal,
        paidAmount: numPaid,
        remainingAmount: numRemaining,
        paymentStatus: status,
        paymentMonth,
      });
      onClose();
    } catch (err) {
      setSubError("تعذر حفظ بيانات اشتراك الشهر. حاول مرة أخرى.");
    } finally {
      setIsSubmittingSub(false);
    }
  }

  // ─── المشتريات والأدوات State ──────────────────────────────────────────────
  const purchasesSummary = useMemo(() => getPurchasesSummary(player), [player]);
  const [payingPurchaseId, setPayingPurchaseId] = useState(null);
  const [payAmountInput, setPayAmountInput] = useState("");
  const [isSubmittingPurchasePay, setIsSubmittingPurchasePay] = useState(false);
  const [purchasePayError, setPurchasePayError] = useState("");

  // نموذج إضافة سلعة جديدة سريعة
  const [showAddPurchaseForm, setShowAddPurchaseForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTotal, setNewTotal] = useState("");
  const [newPaid, setNewPaid] = useState("");
  const [newDate, setNewDate] = useState(localDate());
  const [isAddingPurchase, setIsAddingPurchase] = useState(false);
  const [addPurchaseError, setAddPurchaseError] = useState("");

  const savePurchaseFn = onSavePurchase || onSave;

  async function handlePayItem(purchase) {
    const addAmt = Number(toEnglishDigits(payAmountInput)) || 0;
    if (addAmt <= 0) {
      setPurchasePayError("يرجى إدخال مبلغ الدفعة المسددة.");
      return;
    }
    const rem = Math.max(0, (Number(purchase.totalAmount) || 0) - (Number(purchase.paidAmount) || 0));
    if (addAmt > rem) {
      setPurchasePayError(`المبلغ المدخل (${addAmt}) أكبر من المتبقي (${rem}).`);
      return;
    }

    setIsSubmittingPurchasePay(true);
    setPurchasePayError("");
    try {
      await savePurchaseFn({
        purchaseAction: "update",
        purchaseId: purchase.id,
        addAmount: addAmt,
      });
      setPayingPurchaseId(null);
      setPayAmountInput("");
    } catch (err) {
      setPurchasePayError("حدث خطأ أثناء تسجيل الدفعة.");
    } finally {
      setIsSubmittingPurchasePay(false);
    }
  }

  async function handlePayFullItem(purchase) {
    const rem = Math.max(0, (Number(purchase.totalAmount) || 0) - (Number(purchase.paidAmount) || 0));
    if (rem <= 0) return;
    setIsSubmittingPurchasePay(true);
    setPurchasePayError("");
    try {
      await savePurchaseFn({
        purchaseAction: "update",
        purchaseId: purchase.id,
        addAmount: rem,
      });
      setPayingPurchaseId(null);
      setPayAmountInput("");
    } catch (err) {
      setPurchasePayError("حدث خطأ أثناء سداد المبلغ.");
    } finally {
      setIsSubmittingPurchasePay(false);
    }
  }

  async function handleCreateNewPurchase(e) {
    e?.preventDefault();
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) {
      setAddPurchaseError("يرجى تحديد أو كتابة اسم السلعة.");
      return;
    }
    const tot = Math.max(0, Number(toEnglishDigits(newTotal)) || 0);
    if (tot <= 0) {
      setAddPurchaseError("يرجى إدخال سعر السلعة.");
      return;
    }
    const pd = Math.min(tot, Math.max(0, Number(toEnglishDigits(newPaid)) || 0));

    setIsAddingPurchase(true);
    setAddPurchaseError("");
    try {
      await savePurchaseFn({
        purchaseAction: "add",
        title: cleanTitle,
        totalAmount: tot,
        paidAmount: pd,
        date: newDate || localDate(),
        notes: "",
      });
      setNewTitle("");
      setNewTotal("");
      setNewPaid("");
      setShowAddPurchaseForm(false);
    } catch (err) {
      setAddPurchaseError("تعذر تسجيل السلعة الجديدة.");
    } finally {
      setIsAddingPurchase(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-sm animate-fade-in-scale overflow-x-hidden max-w-full"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      dir="rtl"
    >
      <div className="relative w-full max-w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-bottom-sheet sm:animate-fade-in-scale">
        {/* مقبض سحب الموبايل */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" />

        {/* ترويسة النافذة */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-xs transition-colors ${
                activeTab === "subscription"
                  ? "bg-gradient-to-br from-emerald-600 to-teal-600"
                  : "bg-gradient-to-br from-amber-600 to-rose-600"
              }`}
            >
              {activeTab === "subscription" ? (
                <CreditCard className="h-5 w-5" />
              ) : (
                <ShoppingBag className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                تسجيل وتحصيل المدفوعات
              </p>
              <h2 className="font-cairo text-sm sm:text-base font-black text-slate-900 truncate max-w-[220px]">
                {player?.name}
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

        {/* أزرار التبديل المستقلة بين الاشتراك والمشتريات */}
        <div className="px-5 pt-3 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/70">
            {/* تبويب 1: اشتراك الشهر */}
            <button
              type="button"
              onClick={() => setActiveTab("subscription")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                activeTab === "subscription"
                  ? "bg-white text-emerald-800 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
              <span>اشتراك الشهر</span>
            </button>

            {/* تبويب 2: مشتريات وأدوات */}
            <button
              type="button"
              onClick={() => setActiveTab("purchases")}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                activeTab === "purchases"
                  ? "bg-white text-amber-900 shadow-sm border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
              <span>المشتريات والأدوات</span>
              {purchasesSummary.remainingAmount > 0 && (
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* ══════════════════ محتوى تبويب: اشتراك الشهر ══════════════════ */}
        {activeTab === "subscription" && (
          <form onSubmit={handleSubscriptionSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* لافتة التوضيح المنفصل */}
            <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200/80 rounded-xl px-3.5 py-2">
              <span className="text-xs font-bold text-emerald-800">شهر الاشتراك المستهدف:</span>
              <span className="text-xs font-black text-emerald-950 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                {paymentMonth}
              </span>
            </div>

            {/* قيمة الاشتراك الإجمالية */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                قيمة اشتراك الشهر المطلوب (ج.م)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={totalAmount}
                onChange={(e) =>
                  setTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                }
                placeholder="100"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-100"
                required
              />
            </div>

            {/* المبلغ المدفوع مع الأزرار السريعة */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-extrabold text-slate-700">
                  المبلغ المسدد للاشتراك (ج.م)
                </label>
                <span className="text-[11px] font-bold text-slate-400">خيارات سريعة:</span>
              </div>

              <input
                type="text"
                inputMode="numeric"
                value={paidAmount}
                onChange={(e) =>
                  setPaidAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                }
                placeholder="0"
                className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 text-base sm:text-sm font-bold text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-3 focus:ring-emerald-100"
              />

              {/* أزرار النسب السريعة */}
              <div className="grid grid-cols-3 gap-1.5 mt-2">
                <button
                  type="button"
                  onClick={handleSetFull}
                  className="h-10 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-800 text-xs font-black hover:bg-emerald-100 active-press transition cursor-pointer touch-manipulation"
                >
                  كامل ({numTotal})
                </button>
                <button
                  type="button"
                  onClick={handleSetHalf}
                  className="h-10 rounded-xl border border-amber-200 bg-amber-50/80 text-amber-800 text-xs font-black hover:bg-amber-100 active-press transition cursor-pointer touch-manipulation"
                >
                  النصف ({Math.round(numTotal / 2)})
                </button>
                <button
                  type="button"
                  onClick={handleSetZero}
                  className="h-10 rounded-xl border border-rose-200 bg-rose-50/80 text-rose-800 text-xs font-black hover:bg-rose-100 active-press transition cursor-pointer touch-manipulation"
                >
                  لم يدفع (0)
                </button>
              </div>
            </div>

            {/* بطاقة الحساب الحي للمتبقي */}
            <div
              className={`rounded-2xl border p-3.5 transition-all duration-200 ${
                numPaid >= numTotal && numTotal > 0
                  ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                  : numPaid > 0
                  ? "border-amber-200 bg-amber-50/80 text-amber-900"
                  : "border-rose-200 bg-rose-50/80 text-rose-900"
              }`}
            >
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>المبلغ المسدد للاشتراك:</span>
                <span className="font-black text-sm">{numPaid} ج.م</span>
              </div>
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span>المتبقي من اشتراك الشهر:</span>
                <span
                  className={`font-black text-sm ${
                    numRemaining > 0 ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {numRemaining} ج.م
                </span>
              </div>

              {/* شارة الحالة النهائية */}
              <div className="pt-2 border-t border-current/10 flex items-center justify-between">
                <span className="text-[11px] font-bold opacity-80">حالة اشتراك الشهر:</span>
                <span className="text-xs font-black">
                  {numPaid >= numTotal && numTotal > 0 ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} /> مدفوع بالكامل
                    </span>
                  ) : numPaid > 0 ? (
                    <span className="text-amber-800 font-black">
                      دفع {numPaid} • باقي {numRemaining}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-700">
                      <X className="h-3.5 w-3.5" strokeWidth={3} /> لم يدفع (باقي {numTotal})
                    </span>
                  )}
                </span>
              </div>
            </div>

            {subError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{subError}</span>
              </div>
            )}

            {/* زر الحفظ */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingSub}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-cairo text-sm font-black text-white shadow-md shadow-emerald-500/20 hover:brightness-110 active:scale-98 transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmittingSub ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>جاري حفظ اشتراك الشهر...</span>
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    <span>حفظ اشتراك شهر {paymentMonth}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════ محتوى تبويب: المشتريات والأدوات ══════════════════ */}
        {activeTab === "purchases" && (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* ملخص مالي منفصل للمشتريات */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-center shadow-2xs">
                <span className="block text-[10px] font-bold text-slate-400">إجمالي السلع</span>
                <strong className="font-cairo text-xs sm:text-sm font-black text-slate-800">
                  {purchasesSummary.totalAmount}{" "}
                  <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                </strong>
              </div>
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2 text-center shadow-2xs">
                <span className="block text-[10px] font-bold text-emerald-700">مسدد للأدوات</span>
                <strong className="font-cairo text-xs sm:text-sm font-black text-emerald-700">
                  {purchasesSummary.paidAmount}{" "}
                  <span className="text-[9px] font-normal text-emerald-500">ج.م</span>
                </strong>
              </div>
              <div
                className={`rounded-xl border p-2 text-center shadow-2xs ${
                  purchasesSummary.remainingAmount > 0
                    ? "border-rose-300 bg-rose-50 text-rose-800"
                    : "border-slate-200 bg-white text-slate-800"
                }`}
              >
                <span
                  className={`block text-[10px] font-bold ${
                    purchasesSummary.remainingAmount > 0 ? "text-rose-700" : "text-slate-400"
                  }`}
                >
                  باقي الأدوات
                </span>
                <strong
                  className={`font-cairo text-xs sm:text-sm font-black ${
                    purchasesSummary.remainingAmount > 0 ? "text-rose-700" : "text-slate-800"
                  }`}
                >
                  {purchasesSummary.remainingAmount}{" "}
                  <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                </strong>
              </div>
            </div>

            {purchasePayError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{purchasePayError}</span>
              </div>
            )}

            {/* قائمة السلع المسجلة للاعب */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-amber-600" />
                  <span>سلع ومستلزمات مسجلة ({purchasesSummary.count})</span>
                </span>

                <button
                  type="button"
                  onClick={() => setShowAddPurchaseForm(!showAddPurchaseForm)}
                  className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition cursor-pointer"
                >
                  <Plus className="h-3 w-3 stroke-[3]" />
                  <span>{showAddPurchaseForm ? "إلغاء الإضافة" : "إضافة سلعة جديدة"}</span>
                </button>
              </div>

              {/* فورم إضافة سلعة سريعة */}
              {showAddPurchaseForm && (
                <form
                  onSubmit={handleCreateNewPurchase}
                  className="rounded-2xl border border-amber-200 bg-amber-50/40 p-3 space-y-2.5 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-900">
                      تسجيل سلعة / بدلة جديدة:
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">حساب مستقل</span>
                  </div>

                  {/* أصناف شائعة */}
                  <div className="flex flex-wrap gap-1">
                    {COMMON_PRESETS.slice(0, 4).map((p) => (
                      <button
                        key={p.title}
                        type="button"
                        onClick={() => setNewTitle(p.title)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                          newTitle === p.title
                            ? "bg-amber-600 text-white border-amber-600"
                            : "bg-white text-slate-700 border-slate-200 hover:border-amber-300"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="اسم السلعة (مثال: بدلة كاراتيه مقاس 2)"
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                    required
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        السعر المطلوب (ج.م)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newTotal}
                        onChange={(e) =>
                          setNewTotal(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                        }
                        placeholder="مثال: 450"
                        className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                        المدفوع حالياً (ج.م)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={newPaid}
                        onChange={(e) =>
                          setNewPaid(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                        }
                        placeholder="0"
                        className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {addPurchaseError && (
                    <p className="text-[11px] font-bold text-rose-600">{addPurchaseError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={isAddingPurchase}
                    className="w-full h-9 rounded-xl bg-amber-700 text-white font-black text-xs hover:bg-amber-800 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isAddingPurchase ? (
                      <span>جاري الحفظ...</span>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>حفظ وإضافة السلعة</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {purchasesSummary.count === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
                  <ShoppingBag className="h-7 w-7 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-600 mb-0.5">
                    لا توجد مشتريات مسجلة لهذا اللاعب
                  </p>
                  <p className="text-[10px] text-slate-400 mb-2.5">
                    سجل شراء بدلة أو أدوات لتبقى حساباتها مفصولة تماماً عن اشتراك الشهر.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAddPurchaseForm(true)}
                    className="inline-flex items-center gap-1 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-700 transition cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>تسجيل أول سلعة الآن</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                  {[...purchasesSummary.purchases].reverse().map((item) => {
                    const tot = Number(item.totalAmount) || 0;
                    const pd = Number(item.paidAmount) || 0;
                    const rem = Math.max(0, tot - pd);
                    const isPaid = pd >= tot && tot > 0;
                    const isPartial = pd > 0 && !isPaid;
                    const isPayingThis = payingPurchaseId === item.id;

                    return (
                      <div
                        key={item.id}
                        className={`rounded-2xl border p-3 transition-all ${
                          isPaid
                            ? "border-emerald-200/80 bg-emerald-50/30"
                            : isPartial
                            ? "border-amber-200 bg-amber-50/40"
                            : "border-slate-200 bg-slate-50/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <h4 className="font-cairo text-xs font-black text-slate-900">
                              {item.title}
                            </h4>
                            <span className="text-[10px] font-bold text-slate-400">
                              {item.date || "تاريخ غير محدد"}
                            </span>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-black shrink-0 ${
                              isPaid
                                ? "bg-emerald-100 text-emerald-800"
                                : isPartial
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isPaid ? "خالص ✓" : isPartial ? `باقي ${rem}` : `غير مسدد (${rem})`}
                          </span>
                        </div>

                        {/* تفاصيل السعر */}
                        <div className="flex items-center justify-between text-[11px] font-bold pt-1.5 border-t border-slate-100 mb-2">
                          <span className="text-slate-500">المطلوب: {tot} ج.م</span>
                          <span className="text-emerald-700">المسدد: {pd} ج.م</span>
                          <span className={rem > 0 ? "text-rose-700 font-black" : "text-slate-400"}>
                            المتبقي: {rem} ج.م
                          </span>
                        </div>

                        {/* إمكانية سداد دفعة على هذه السلعة مباشرة */}
                        {rem > 0 && (
                          <div>
                            {isPayingThis ? (
                              <div className="pt-2 border-t border-slate-200/80 space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-[11px] font-bold text-slate-700">
                                    مبلغ الدفعة المسددة للأداة (ج.م):
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handlePayFullItem(item)}
                                    className="text-[10px] font-black text-emerald-700 hover:underline cursor-pointer"
                                  >
                                    سداد كامل ({rem} ج.م)
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    value={payAmountInput}
                                    onChange={(e) =>
                                      setPayAmountInput(
                                        toEnglishDigits(e.target.value).replace(/[^0-9]/g, "")
                                      )
                                    }
                                    placeholder={`المتبقي: ${rem}`}
                                    className="flex-1 h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-amber-500"
                                  />
                                  <button
                                    type="button"
                                    disabled={isSubmittingPurchasePay}
                                    onClick={() => handlePayItem(item)}
                                    className="h-9 px-3.5 rounded-xl bg-amber-600 text-white font-black text-xs hover:bg-amber-700 active:scale-95 transition cursor-pointer"
                                  >
                                    {isSubmittingPurchasePay ? "..." : "تأكيد"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPayingPurchaseId(null);
                                      setPayAmountInput("");
                                    }}
                                    className="h-9 px-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                                  >
                                    إلغاء
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPayingPurchaseId(item.id);
                                    setPayAmountInput(String(rem));
                                  }}
                                  className="flex-1 h-8 rounded-xl bg-amber-600/90 hover:bg-amber-600 text-white text-[11px] font-black flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                                >
                                  <CreditCard className="h-3 w-3" />
                                  <span>تحصيل دفعة ({rem} ج.م)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handlePayFullItem(item)}
                                  className="h-8 px-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-[11px] font-black hover:bg-emerald-100 transition active:scale-95 cursor-pointer"
                                  title="سداد كامل المبلغ المتبقي فورا"
                                >
                                  سداد كامل ✓
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-cairo text-xs font-black transition cursor-pointer flex items-center justify-center"
              >
                إغلاق
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
