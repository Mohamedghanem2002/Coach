import { useState, useRef, useMemo } from "react";
import { toEnglishDigits, BELTS, LEVELS } from "../../lib/dashboard-utils";
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
    if (isNaN(y) || isNaN(m) || isNaN(d) || y < 1950 || m < 1 || m > 12 || d < 1 || d > 31) {
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
    return age >= 0 && age <= 100 ? age : null;
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
    if (calculatedAge < 4 || calculatedAge > 80) {
      setError("يجب أن يكون عمر اللاعب بين 4 و 80 سنة.");
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
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in-scale"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <form
        className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:p-8"
        onSubmit={submit}
      >
        {/* رأس النافذة */}
        <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-xs text-lg font-bold">
              🥋
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                تسجيل لاعب جديد
              </p>
              <h2 className="font-cairo text-lg font-black text-slate-900 sm:text-xl">
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

        {branches.length === 0 ? (
          <div className="grid gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-7 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-2xl text-amber-600">
              🏢
            </div>
            <strong className="font-cairo text-base font-extrabold text-slate-800">
              يرجى إضافة صالة أو فرع أولاً
            </strong>
            <p className="text-xs text-slate-500">
              لا يمكن تسجيل أي لاعب دون تحديد الصالة التابع لها.
            </p>
            <button
              type="button"
              className="mx-auto mt-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-red-700 active:scale-95 cursor-pointer"
              onClick={onManageBranches}
            >
              إدارة صالات الأكاديمية
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {/* اسم اللاعب */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                اسم اللاعب الرباعي <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: يوسف أحمد محمد علي"
              />
            </div>

            {/* تاريخ الميلاد والفرع */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  تاريخ الميلاد <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
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
                  <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2 py-0.5 animate-slide-up">
                    <span>✓</span>
                    <span>العمر المحسوب: {calculatedAge} سنة</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  الصالة / الفرع <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
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
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  حزام الكاراتيه <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100 cursor-pointer"
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
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  المستوى (Level) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {LEVELS.map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`rounded-xl py-2 text-xs font-black transition cursor-pointer active:scale-95 ${
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-extrabold text-slate-700">
                  رقم هاتف ولي الأمر <span className="text-slate-400 font-normal">(اختياري لمراسلات الواتساب)</span>
                </label>
                <button
                  type="button"
                  onClick={handlePickContact}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60 transition active:scale-95 cursor-pointer"
                  title="اختيار رقم ولي الأمر مباشرة من سجل الأسماء بالهاتف"
                >
                  <BookUser className="h-3.5 w-3.5 text-red-600" />
                  <span>جهات الاتصال 📱</span>
                </button>
              </div>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                type="tel"
                inputMode="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(toEnglishDigits(e.target.value))}
                placeholder="01xxxxxxxxx"
              />
              {contactNotice && (
                <p className="mt-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 animate-slide-up">
                  {contactNotice}
                </p>
              )}
            </div>

            {/* صورة اللاعب */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
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

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-center text-xs font-bold text-rose-700">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 font-cairo text-sm font-black text-white shadow-md shadow-red-500/25 transition-all hover:brightness-110 active:scale-98 disabled:opacity-60 cursor-pointer"
                type="submit"
                disabled={submitting}
              >
                {submitting ? "جاري تسجيل اللاعب..." : "✓ حفظ بيانات اللاعب"}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}

