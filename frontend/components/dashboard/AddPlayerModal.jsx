import { useState, useRef, useMemo } from "react";
import { toEnglishDigits, BELTS, LEVELS, getBeltStyle } from "../../lib/dashboard-utils";
import { BookUser } from "lucide-react";

export default function AddPlayerModal({
  branches,
  initialBranch = "",
  onClose,
  onAdd,
  onManageBranches,
}) {
  const [name, setName] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  const monthInputRef = useRef(null);
  const yearInputRef = useRef(null);

  const dateOfBirth =
    dobYear && dobMonth && dobDay
      ? `${dobYear}-${dobMonth.padStart(2, "0")}-${dobDay.padStart(2, "0")}`
      : "";

  const [guardianPhone, setGuardianPhone] = useState("");
  const [branch, setBranch] = useState(initialBranch || "");
  const [belt, setBelt] = useState("أبيض");
  const [level, setLevel] = useState("A");
  const [contactNotice, setContactNotice] = useState("");
  const [photo, setPhoto] = useState("");
  const [defaultTotalAmount, setDefaultTotalAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handlePickContact() {
    if (typeof window !== "undefined" && "contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["tel"];
        const contacts = await navigator.contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0 && contacts[0]?.tel && contacts[0].tel.length > 0) {
          const raw = contacts[0].tel[0];
          setGuardianPhone(toEnglishDigits(raw).replace(/[^0-9]/g, ""));
          setContactNotice("✓ تم اختيار الرقم بنجاح من جهات الاتصال");
          setTimeout(() => setContactNotice(""), 3500);
        }
      } catch (err) {
        console.log("Contact picker cancelled:", err);
      }
    } else {
      setContactNotice("💡 خاصية استيراد جهات الاتصال تعمل مباشرة من المتصفح على الهواتف الذكية (مثل Chrome على Android). يمكنك كتابة الرقم يدوياً الآن.");
      setTimeout(() => setContactNotice(""), 5000);
    }
  }

  const calculatedAge = useMemo(() => {
    if (!dobYear || !dobMonth || !dobDay) return null;
    const y = parseInt(dobYear, 10);
    const m = parseInt(dobMonth, 10);
    const d = parseInt(dobDay, 10);
    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) {
      return null;
    }
    const birthDate = new Date(y, m - 1, d);
    if (
      birthDate.getFullYear() !== y ||
      birthDate.getMonth() !== m - 1 ||
      birthDate.getDate() !== d
    ) {
      return null;
    }
    const today = new Date();
    let age = today.getFullYear() - y;
    const currentMonth = today.getMonth() + 1;
    const currentDay = today.getDate();
    if (currentMonth < m || (currentMonth === m && currentDay < d)) {
      age -= 1;
    }
    return age >= 0 && age <= 120 ? age : null;
  }, [dobYear, dobMonth, dobDay]);

  function handleDayChange(val) {
    const normalized = toEnglishDigits(val);
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setDobDay(d.replace(/\D/g, "").slice(0, 2));
      setDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setDobYear(y.replace(/\D/g, "").slice(0, 4));
      return;
    }
    const cleaned = normalized.replace(/\D/g, "").slice(0, 2);
    setDobDay(cleaned);
    if (cleaned.length === 2) {
      monthInputRef.current?.focus();
    }
  }

  function handleMonthChange(val) {
    const normalized = toEnglishDigits(val);
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setDobDay(d.replace(/\D/g, "").slice(0, 2));
      setDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setDobYear(y.replace(/\D/g, "").slice(0, 4));
      return;
    }
    const cleaned = normalized.replace(/\D/g, "").slice(0, 2);
    setDobMonth(cleaned);
    if (cleaned.length === 2) {
      yearInputRef.current?.focus();
    }
  }

  function handleYearChange(val) {
    const normalized = toEnglishDigits(val);
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setDobDay(d.replace(/\D/g, "").slice(0, 2));
      setDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setDobYear(y.replace(/\D/g, "").slice(0, 4));
      return;
    }
    const cleaned = normalized.replace(/\D/g, "").slice(0, 4);
    setDobYear(cleaned);
  }

  function handleDatePaste(e) {
    const text = e.clipboardData?.getData("text") || "";
    const normalized = toEnglishDigits(text).trim();
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      e.preventDefault();
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setDobDay(d.replace(/\D/g, "").slice(0, 2));
      setDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setDobYear(y.replace(/\D/g, "").slice(0, 4));
    }
  }

  function handlePhotoChange(event) {
    var _a;
    const file =
      (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file) return;
    const image = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      image.onload = () => {
        const scale = Math.min(1, 480 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas
          .getContext("2d")
          ?.drawImage(image, 0, 0, canvas.width, canvas.height);
        setPhoto(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function submit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setError("يرجى إدخال اسم ثلاثي أو رباعي للاعب (3 أحرف على الأقل).");
      return;
    }
    if (!dateOfBirth || calculatedAge === null) {
      setError("يرجى إدخال تاريخ ميلاد صحيح وصالح.");
      return;
    }
    if (!branch) {
      setError("يرجى اختيار صالة أو فرع التدريب.");
      return;
    }

    const cleanPhone = toEnglishDigits(guardianPhone).trim().replace(/[^0-9]/g, "");
    if (cleanPhone && cleanPhone.length > 0) {
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        setError("يرجى التأكد من كتابة رقم هاتف ولي الأمر بشكل صحيح.");
        return;
      }
    }

    setError("");
    setSubmitting(true);
    try {
      await onAdd({
        name: trimmedName,
        dateOfBirth,
        guardianPhone: toEnglishDigits(guardianPhone).trim(),
        branch,
        belt,
        level,
        photo,
        defaultTotalAmount: defaultTotalAmount ? Number(defaultTotalAmount) : null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (branches.length === 0) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in-scale"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        dir="rtl"
      >
        <div
          className="relative w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl animate-fade-in-scale space-y-4"
          role="dialog"
          aria-modal="true"
        >
          {/* رأس النافذة */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200 text-xl font-bold">
                🏢
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                  تنبيه مطلوب
                </p>
                <h3 className="font-cairo text-base font-black text-slate-900">
                  يرجى إضافة صالة أولاً
                </h3>
              </div>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              onClick={onClose}
              title="إغلاق"
            >
              ✕
            </button>
          </div>

          {/* محتوى التنبيه */}
          <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/50 p-4 text-center space-y-2">
            <p className="text-xs font-bold text-slate-700 leading-relaxed">
              لا يمكن تسجيل أي لاعب جديد دون تحديد صالة التدريب التابع لها.
            </p>
            <p className="text-[11px] text-slate-500 leading-normal">
              أضف صالتك الأولى (مثل: صالة النادي الرئيسي) ثم عُد لتسجيل أبطالك بكل سهولة.
            </p>
          </div>

          {/* الأزرار */}
          <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
            <button
              type="button"
              className="w-full flex-1 h-11 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-cairo text-xs font-black shadow-sm shadow-red-600/20 active-press transition cursor-pointer"
              onClick={onManageBranches}
            >
              <span>+ إضافة وإدارة الصالات الآن</span>
            </button>
            <button
              type="button"
              className="w-full sm:w-auto h-11 px-5 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-cairo text-xs font-bold active-press transition cursor-pointer"
              onClick={onClose}
            >
              <span>إلغاء</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-md animate-fade-in-scale"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <form
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white max-h-[92vh] flex flex-col shadow-2xl animate-bottom-sheet sm:animate-fade-in-scale"
        onSubmit={submit}
      >
        {/* مؤشر السحب على الموبايل */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-slate-300 sm:hidden" />

        {/* رأس النافذة */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 sm:px-7 sm:py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600 text-white shadow-2xs text-lg font-bold">
              🥋
            </div>
            <div>
              <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                تسجيل لاعب جديد
              </p>
              <h2 className="font-cairo text-base sm:text-xl font-black text-slate-900">
                إضافة بطل للأكاديمية
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

        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-7 sm:py-5 space-y-4 touch-scroll">
              {/* اسم اللاعب */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  اسم اللاعب الرباعي <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 sm:py-2.5 text-base sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="مثال: يوسف أحمد محمد علي"
                />
              </div>

              {/* تاريخ الميلاد والفرع */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    تاريخ الميلاد <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-3 sm:py-2.5 text-center text-base sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                      type="text"
                      inputMode="numeric"
                      placeholder="اليوم"
                      maxLength={2}
                      value={dobDay}
                      onChange={(e) => handleDayChange(e.target.value)}
                      onPaste={handleDatePaste}
                      required
                    />
                    <input
                      ref={monthInputRef}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-3 sm:py-2.5 text-center text-base sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                      type="text"
                      inputMode="numeric"
                      placeholder="الشهر"
                      maxLength={2}
                      value={dobMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      onPaste={handleDatePaste}
                      required
                    />
                    <input
                      ref={yearInputRef}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-3 sm:py-2.5 text-center text-base sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                      type="text"
                      inputMode="numeric"
                      placeholder="السنة"
                      maxLength={4}
                      value={dobYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      onPaste={handleDatePaste}
                      required
                    />
                  </div>
                  {calculatedAge !== null && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2.5 py-1 animate-slide-up">
                      <span>✓</span>
                      <span>العمر المحسوب: {calculatedAge === 0 ? "أقل من سنة" : `${calculatedAge} سنة`}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    الصالة / الفرع <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 sm:py-2.5 text-base sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100 cursor-pointer min-h-[44px]"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    required
                  >
                    <option value="" disabled>
                      اختر صالة التدريب
                    </option>
                    {branches.map((item) => (
                      <option key={item._id} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* الحزام والمستوى */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    حزام الكاراتيه <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 sm:py-2.5 text-base sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100 cursor-pointer min-h-[44px]"
                    value={belt}
                    onChange={(e) => setBelt(e.target.value)}
                    required
                  >
                    {BELTS.map((b) => (
                      <option key={b.name} value={b.name}>
                        🥋 حزام {b.name}
                      </option>
                    ))}
                  </select>
                  <div className={`mt-1.5 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold shadow-2xs ${getBeltStyle(belt).bg} ${getBeltStyle(belt).text} ${getBeltStyle(belt).border}`}>
                    <span className={`h-2.5 w-2.5 rounded-full ${getBeltStyle(belt).dot}`} />
                    <span>حزام {belt}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                    المستوى (Level) <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setLevel(lvl)}
                        className={`h-11 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 flex items-center justify-center ${
                          level === lvl
                            ? "bg-red-600 text-white shadow-xs shadow-red-500/30 ring-2 ring-red-200"
                            : "border border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* رقم ولي الأمر مع خيار استيراد جهات الاتصال */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700">
                    رقم هاتف ولي الأمر <span className="text-slate-400 font-normal text-[11px]">(للواتساب)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePickContact}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700 border border-red-200/60 transition active:scale-95 cursor-pointer min-h-[32px]"
                    title="اختيار رقم ولي الأمر مباشرة من سجل الأسماء بالهاتف"
                  >
                    <BookUser className="h-4 w-4 text-red-600" />
                    <span>سجل الهاتف 📱</span>
                  </button>
                </div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3 sm:py-2.5 text-base sm:text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  type="tel"
                  inputMode="tel"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(toEnglishDigits(e.target.value))}
                  placeholder="01xxxxxxxxx"
                />
                {contactNotice && (
                  <p className="mt-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 animate-slide-up">
                    {contactNotice}
                  </p>
                )}
              </div>

              {/* صورة اللاعب */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  صورة اللاعب الشخصية
                </label>
                <div className="flex items-center gap-3">
                  <input
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-red-100 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-red-700 hover:file:bg-red-200 cursor-pointer"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  {photo && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 ring-2 ring-red-100 shadow-xs">
                      <img
                        src={photo}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* قيمة الاشتراك الشهري الثابت - اختياري */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  قيمة الاشتراك الشهري الثابت (ج.م) - اختياري
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  type="text"
                  inputMode="numeric"
                  value={defaultTotalAmount}
                  onChange={(e) =>
                    setDefaultTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                  }
                  placeholder="اتركه فارغاً إذا لم تحدد اشتراكاً ثابتاً لهذا اللاعب"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  إذا تم تحديد قيمة هنا، سيتم اعتمادها تلقائياً لكل الشهور القادمة ويمكنك تعديلها في أي وقت.
                </p>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700">
                  {error}
                </div>
              )}
            </div>

            {/* زر الحفظ الثابت بالأسفل لتجربة استخدام سهلة بيد واحدة */}
            <div className="border-t border-slate-100 bg-white/95 backdrop-blur px-5 py-3 sm:px-7 sm:py-4 shrink-0 pb-safe">
              <button
                className="w-full h-12 rounded-xl bg-red-600 hover:bg-red-700 px-4 font-cairo text-sm font-black text-white shadow-sm shadow-red-600/20 transition-all active:scale-98 disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <span>جاري تسجيل اللاعب...</span>
                ) : (
                  <>
                    <span>✓ حفظ بيانات اللاعب</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      );
    }

