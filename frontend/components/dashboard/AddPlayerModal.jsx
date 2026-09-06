import { useState } from "react";
export default function AddPlayerModal({
  branches,
  initialBranch = "",
  onClose,
  onAdd,
  onManageBranches,
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [branch, setBranch] = useState(initialBranch || "");
  const [photo, setPhoto] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  function handlePhotoChange(event) {
    var _a;
    const file =
      (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(String(reader.result));
    };
    reader.readAsDataURL(file);
  }
  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || !age || !branch) {
      setError("اكتب اسم اللاعب والسن واختر الصالة.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onAdd({
        name: name.trim(),
        age: Number(age),
        branch,
        photo,
      });
    } finally {
      setSubmitting(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <form className="modal" onSubmit={submit}>
        <div className="modal-title">
          <div>
            <p className="eyebrow">ملف جديد</p>
            <h2>إضافة لاعب</h2>
          </div>
          <button type="button" className="close" onClick={onClose}>
            ×
          </button>
        </div>

        {branches.length === 0 ? (
          <div className="empty">
            <strong>أضف فرعًا أولًا</strong>
            <span>لا يمكن تسجيل لاعب بدون فرع.</span>
            <button
              type="button"
              className="primary-button"
              onClick={onManageBranches}
            >
              إدارة الفروع
            </button>
          </div>
        ) : (
          <>
            <label>
              اسم اللاعب
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="مثال: أحمد محمد"
              />
            </label>
            <div className="form-row">
              <label>
                السن
                <input
                  type="number"
                  min="4"
                  max="80"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  placeholder="12"
                />
              </label>
              <label>
                الفرع / الصالة
                <select
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
            <label>
              صورة اللاعب
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              {photo && (
                <div style={{ marginTop: "10px" }}>
                  <img
                    src={photo}
                    alt="Preview"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                </div>
              )}
            </label>
            {error && <p className="signin-error">{error}</p>}
            <button
              className="primary-button full"
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
