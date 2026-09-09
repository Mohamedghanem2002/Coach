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
      setError("اكتب اسم اللاعب وتاريخ الميلاد واختر الصالة.");
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
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
        onSubmit={submit}
      >
        <div className="mb-6 flex items-start justify-between border-b border-slate-100 pb-5">
          <div>
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-red-600">
              ملف جديد
            </p>
            <h2 className="text-xl font-extrabold text-slate-900">
              إضافة لاعب
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

        {branches.length === 0 ? (
          <div className="grid gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <strong className="text-sm text-slate-800">أضف فرعًا أولًا</strong>
            <span className="text-xs text-slate-500">
              لا يمكن تسجيل لاعب بدون فرع.
            </span>
            <button
              type="button"
              className="mx-auto mt-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white"
              onClick={onManageBranches}
            >
              إدارة الفروع
            </button>
          </div>
        ) : (
          <>
            <label className="mb-4 block text-xs font-bold text-slate-600">
              اسم اللاعب
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: أحمد محمد"
              />
            </label>
            <div className="grid gap-0 sm:grid-cols-2 sm:gap-3">
              <label className="mb-4 block text-xs font-bold text-slate-600">
                تاريخ الميلاد
                <input
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  type="date"
                  max={new Date().toISOString().slice(0, 10)}
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  required
                />
              </label>
              <label className="mb-4 block text-xs font-bold text-slate-600">
                الفرع / الصالة
                <select
                  className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    اختر الصالة
                  </option>
                  {branches.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="mb-4 block text-xs font-bold text-slate-600">
              رقم ولي الأمر{" "}
              <span className="font-normal text-slate-400">(اختياري)</span>
              <input
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                type="tel"
                inputMode="tel"
                value={guardianPhone}
                onChange={(e) => setGuardianPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
              />
            </label>
            <label className="mb-4 block text-xs font-bold text-slate-600">
              صورة اللاعب
              <input
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 file:mr-3 file:rounded-lg file:border-0 file:bg-red-50 file:px-3 file:py-2 file:text-xs file:font-bold file:text-red-600"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {photo && (
                <div className="mt-2.5">
                  <img
                    src={photo}
                    alt="Preview"
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                </div>
              )}
            </label>
            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
                {error}
              </p>
            )}
            <button
              className="mt-2 w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 disabled:opacity-60"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "جاري الحفظ..." : "حفظ اللاعب"}
            </button>
          </>
        )}
      </form>
    </div>
  );
}
