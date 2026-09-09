import { useState } from "react";

export default function AddPlayerModal({
  branches,
  initialBranch = "",
  onClose,
  onAdd,
  onManageBranches,
}) {
  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [branch, setBranch] = useState(initialBranch || "");
  const [photo, setPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    if (!name.trim() || !dateOfBirth || !branch) {
      setError("يرجى ملء اسم اللاعب، تاريخ الميلاد، وتحديد الصالة.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        dateOfBirth,
        guardianPhone: guardianPhone.trim(),
        branch,
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
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
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

            {/* رقم ولي الأمر */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                رقم هاتف ولي الأمر <span className="text-slate-400 font-normal">(اختياري لمراسلات الواتساب)</span>
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                type="tel"
                inputMode="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
              />
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

