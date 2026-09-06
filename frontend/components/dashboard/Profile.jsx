import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { localDate, paymentStatusFor } from "../../lib/dashboard-utils";
export default function Profile({
  player,
  branches,
  paymentMonth,
  onClose,
  onUpdate,
  onDelete,
}) {
  var _a;
  const { data: session } = useSession();
  const captainName = session?.user?.name || "كابتن الأكاديمية";
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editAge, setEditAge] = useState(player.age);
  const [editBranch, setEditBranch] = useState(player.branch);
  const [editPhoto, setEditPhoto] = useState(player.photo || "");
  const today = localDate();
  const [customAttendanceDate, setCustomAttendanceDate] = useState(today);
  const [customAttendanceStatus, setCustomAttendanceStatus] =
    useState("present");
  const [customPaymentMonth, setCustomPaymentMonth] = useState(
    today.slice(0, 7),
  );
  const [customPaymentStatus, setCustomPaymentStatus] = useState("paid");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const attended = (
    Array.isArray(player.attendance) ? player.attendance : []
  ).filter((item) => item.status === "present").length;
  const monthlyStatus = paymentStatusFor(player, paymentMonth);
  const registrationDate = new Date(player.createdAt).toLocaleDateString(
    "ar-EG",
  );
  useEffect(() => {
    if (!profileNotice) return undefined;
    const timer = setTimeout(() => setProfileNotice(""), 3500);
    return () => clearTimeout(timer);
  }, [profileNotice]);
  function shareOnWhatsApp() {
    const attendanceHistory = Array.isArray(player.attendance)
      ? [...player.attendance].reverse()
      : [];
    const paymentHistory = Array.isArray(player.paymentHistory)
      ? [...player.paymentHistory].reverse()
      : [];
    const attendanceText = attendanceHistory.length
      ? attendanceHistory
          .map(
            (item) =>
              `${item.date}: ${item.status === "present" ? "حاضر" : "غائب"}`,
          )
          .join("\n")
      : "لا يوجد سجل حضور بعد";
    const paymentText = paymentHistory.length
      ? paymentHistory
          .map(
            (item) =>
              `${item.month}: ${item.status === "paid" ? "مدفوع" : "لم يدفع"}`,
          )
          .join("\n")
      : "لا توجد مدفوعات مسجلة بعد";
    const message = [
      "🥋 بيانات لاعب أكاديمية coach",
      `📨 مرسلة من الكابتن: ${captainName}`,
      "",
      `👤 الاسم: ${player.name}`,
      `🎂 السن: ${player.age} سنة`,
      `🏢 الصالة: ${player.branch}`,
      `📅 تاريخ التسجيل: ${registrationDate}`,
      "",
      "📊 ملخص الحضور",
      `✅ مرات الحضور: ${attended}`,
      `📝 إجمالي الحصص المسجلة: ${(player.attendance || []).length}`,
      "",
      `💳 اشتراك ${paymentMonth}: ${monthlyStatus === "paid" ? "مدفوع" : "غير مدفوع"}`,
      "",
      "📋 سجل الحضور والغياب:",
      attendanceText,
      "",
      "💰 سجل الاشتراكات:",
      paymentText,
    ].join("\n");
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }
  async function shareProfileImage() {
    const attendanceHistory = Array.isArray(player.attendance)
      ? [...player.attendance].reverse().slice(0, 12)
      : [];
    const paymentHistory = Array.isArray(player.paymentHistory)
      ? [...player.paymentHistory].reverse().slice(0, 6)
      : [];
    const attendanceLines = attendanceHistory.length
      ? attendanceHistory.map(
          (item) =>
            `${item.date}   ${item.status === "present" ? "حاضر" : "غائب"}`,
        )
      : ["لا يوجد سجل حضور"];
    const paymentLines = paymentHistory.length
      ? paymentHistory.map(
          (item) =>
            `${item.month}   ${item.status === "paid" ? "مدفوع" : "لم يدفع"}`,
        )
      : ["لا توجد مدفوعات مسجلة"];
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1880;
    const context = canvas.getContext("2d");
    if (!context) return;
    const drawRight = (text, x, y, font, color) => {
      context.font = font;
      context.fillStyle = color;
      context.textAlign = "right";
      context.direction = "rtl";
      context.fillText(text, x, y);
    };
    context.fillStyle = "#edf3f2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#d94841";
    context.fillRect(0, 0, canvas.width, 24);
    context.fillStyle = "#ffffff";
    context.fillRect(42, 42, canvas.width - 84, canvas.height - 84);

    context.fillStyle = "#fff4f2";
    context.fillRect(72, 72, canvas.width - 144, 160);
    drawRight(
      "coach  |  ملف اللاعب",
      canvas.width - 112,
      126,
      "700 46px Cairo, sans-serif",
      "#d94841",
    );
    drawRight(
      `مرسل من الكابتن: ${captainName}`,
      canvas.width - 112,
      184,
      "600 29px Cairo, sans-serif",
      "#17212b",
    );

    context.fillStyle = "#f8fafb";
    context.fillRect(72, 264, canvas.width - 144, 300);
    context.strokeStyle = "#e5eaee";
    context.lineWidth = 2;
    context.strokeRect(72, 264, canvas.width - 144, 300);
    if (player.photo) {
      const photo = await new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = player.photo;
      });
      if (photo) {
        context.save();
        context.beginPath();
        context.arc(220, 414, 104, 0, Math.PI * 2);
        context.clip();
        context.drawImage(photo, 116, 310, 208, 208);
        context.restore();
      }
    }
    drawRight(player.name, 930, 354, "700 42px Cairo, sans-serif", "#17212b");
    drawRight(
      `السن: ${player.age} سنة`,
      930,
      414,
      "500 29px Cairo, sans-serif",
      "#4a5568",
    );
    drawRight(
      `الصالة: ${player.branch}`,
      930,
      462,
      "500 29px Cairo, sans-serif",
      "#4a5568",
    );
    drawRight(
      `تاريخ التسجيل: ${registrationDate}`,
      930,
      510,
      "500 25px Cairo, sans-serif",
      "#8b9aaa",
    );

    drawRight(
      "ملخص الحضور والاشتراك",
      930,
      642,
      "700 34px Cairo, sans-serif",
      "#218c4b",
    );
    drawRight(
      `مرات الحضور: ${attended}`,
      930,
      700,
      "500 29px Cairo, sans-serif",
      "#17212b",
    );
    drawRight(
      `الحصص المسجلة: ${(player.attendance || []).length}`,
      930,
      746,
      "500 29px Cairo, sans-serif",
      "#17212b",
    );
    drawRight(
      `اشتراك ${paymentMonth}: ${monthlyStatus === "paid" ? "مدفوع" : "غير مدفوع"}`,
      930,
      792,
      "700 29px Cairo, sans-serif",
      monthlyStatus === "paid" ? "#218c4b" : "#c53030",
    );

    drawRight(
      "آخر سجلات الحضور",
      930,
      892,
      "700 32px Cairo, sans-serif",
      "#218c4b",
    );
    let y = 944;
    for (const line of attendanceLines) {
      drawRight(line, 930, y, "500 25px Cairo, sans-serif", "#17212b");
      y += 38;
    }
    drawRight(
      "سجل الاشتراكات",
      930,
      y + 34,
      "700 32px Cairo, sans-serif",
      "#218c4b",
    );
    y += 88;
    for (const line of paymentLines) {
      drawRight(line, 930, y, "500 25px Cairo, sans-serif", "#17212b");
      y += 38;
    }
    context.fillStyle = monthlyStatus === "paid" ? "#218c4b" : "#c53030";
    context.fillRect(72, canvas.height - 150, canvas.width - 144, 2);
    drawRight(
      "تم إنشاء الملف من تطبيق coach",
      canvas.width - 112,
      canvas.height - 96,
      "500 22px Cairo, sans-serif",
      "#8b9aaa",
    );
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;
    const file = new File([blob], `coach-${player.name}.png`, {
      type: "image/png",
    });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: `ملف ${player.name}` });
      return;
    }
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = file.name;
    downloadLink.click();
    URL.revokeObjectURL(downloadLink.href);
    shareOnWhatsApp();
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
        setEditPhoto(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
  async function saveInfo(e) {
    e.preventDefault();
    if (profileSaving) return;
    setProfileSaving(true);
    const updatedPlayer = await onUpdate(player._id, {
      updateInfo: "true",
      name: editName.trim(),
      age: String(editAge),
      branch: editBranch,
      photo: editPhoto,
    });
    setProfileNotice(
      updatedPlayer
        ? "تم تعديل بيانات اللاعب بنجاح"
        : "تعذر تعديل بيانات اللاعب. حاول مرة أخرى.",
    );
    if (updatedPlayer) setIsEditing(false);
    setProfileSaving(false);
  }
  function addCustomAttendance(e) {
    e.preventDefault();
    if (customAttendanceDate > today) return;
    onUpdate(player._id, {
      attendanceStatus: customAttendanceStatus,
      date: customAttendanceDate,
    });
  }
  async function addCustomPayment(e) {
    e.preventDefault();
    setPaymentSaving(true);
    setPaymentNotice("");
    const updatedPlayer = await onUpdate(player._id, {
      paymentStatus: customPaymentStatus,
      paymentMonth: customPaymentMonth,
    });
    setPaymentSaving(false);
    setPaymentNotice(
      updatedPlayer
        ? `تم تحديث اشتراك شهر ${customPaymentMonth}`
        : "تعذر تحديث الاشتراك. حاول مرة أخرى.",
    );
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <aside
        className="profile-panel"
        style={{
          width: "min(100%, 550px)",
          maxHeight: "92vh",
          overflowY: "auto",
        }}
      >
        {profileNotice && (
          <div
            className={`profile-toast ${profileNotice.startsWith("تعذر") ? "error" : ""}`}
            role="status"
          >
            <span>{profileNotice}</span>
            <button type="button" onClick={() => setProfileNotice("")}>
              ×
            </button>
          </div>
        )}
        <button className="close" onClick={onClose}>
          ×
        </button>

        {isEditing ? (
          <form
            onSubmit={saveInfo}
            className="modal"
            style={{ padding: 0, width: "100%", boxShadow: "none" }}
          >
            <div className="modal-title">
              <div>
                <p className="eyebrow">تعديل ملف لاعب</p>
                <h2>تعديل البيانات</h2>
              </div>
            </div>
            <label>
              اسم اللاعب
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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
                  value={editAge}
                  onChange={(e) => setEditAge(Number(e.target.value))}
                  required
                  placeholder="12"
                />
              </label>
              <label>
                الفرع
                <select
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                >
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
              {editPhoto && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  <img
                    src={editPhoto}
                    alt="Preview"
                    style={{
                      width: "50px",
                      height: "50px",
                      borderRadius: "8px",
                      objectFit: "cover",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setEditPhoto("")}
                    className="delete-branch"
                    style={{ padding: "4px 8px" }}
                  >
                    إزالة الصورة
                  </button>
                </div>
              )}
            </label>
            <div className="form-row" style={{ marginTop: "20px" }}>
              <button
                className="primary-button"
                type="submit"
                disabled={profileSaving}
              >
                {profileSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
              <button
                className="outline-button"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-head">
              <div className="profile-identity">
                <span className="profile-photo">
                  {player.photo ? (
                    <img src={player.photo} alt="" />
                  ) : (
                    player.name.charAt(0)
                  )}
                </span>
                <div className="profile-details">
                  <p className="eyebrow">ملف لاعب</p>
                  <h2>{player.name}</h2>
                  <div className="profile-meta">
                    <span>🏢 {player.branch}</span>
                    <span>🎂 {player.age} سنة</span>
                  </div>
                  <small className="profile-date">
                    تاريخ التسجيل: {registrationDate}
                  </small>
                </div>
              </div>
              <div className="profile-actions">
                <button
                  className="image-share-button"
                  type="button"
                  onClick={shareProfileImage}
                >
                  <span aria-hidden="true">▣</span> مشاركة كصورة
                </button>
                <button
                  className="whatsapp-share-button"
                  type="button"
                  onClick={shareOnWhatsApp}
                >
                  <span aria-hidden="true">◉</span> مشاركة واتساب
                </button>
                <button
                  className="outline-button"
                  style={{ padding: "6px 12px", fontSize: "11px" }}
                  onClick={() => {
                    setEditName(player.name);
                    setEditAge(player.age);
                    setEditBranch(player.branch);
                    setEditPhoto(player.photo || "");
                    setIsEditing(true);
                  }}
                >
                  تعديل البيانات
                </button>
              </div>
            </div>

            <div className="profile-stats">
              <div>
                <strong>{attended}</strong>
                <span>حصة حضور</span>
              </div>
              <div>
                <strong>
                  {
                    ((_a = player.attendance) !== null && _a !== void 0
                      ? _a
                      : []
                    ).length
                  }
                </strong>
                <span>حصة مسجلة</span>
              </div>
              <div>
                <strong
                  className={
                    monthlyStatus === "paid" ? "green-text" : "red-text"
                  }
                >
                  {monthlyStatus === "paid" ? "مدفوع" : "غير مدفوع"}
                </strong>
                <span>{paymentMonth}</span>
              </div>
            </div>

            <div className="profile-section payment-section">
              <div className="section-title">
                <h3>اشتراك {paymentMonth}</h3>
                <button
                  className={
                    monthlyStatus === "paid" ? "payment paid" : "payment unpaid"
                  }
                  onClick={() =>
                    onUpdate(player._id, {
                      paymentStatus:
                        monthlyStatus === "paid" ? "unpaid" : "paid",
                      paymentMonth,
                    })
                  }
                >
                  {monthlyStatus === "paid" ? "تم الدفع ✓" : "تسجيل الدفع"}
                </button>
              </div>
              <p className="muted">حالة هذا الشهر مستقلة عن الشهور السابقة.</p>
            </div>
          </>
        )}

        {/* سجل المدفوعات التاريخي */}
        <div className="profile-section">
          <div className="section-title">
            <div>
              <p className="eyebrow">الاشتراكات</p>
              <h3>سجل المدفوعات</h3>
            </div>
            <span className="profile-section-hint">اختر أي شهر</span>
          </div>
          {!player.paymentHistory || player.paymentHistory.length === 0 ? (
            <p className="muted">لا توجد مدفوعات مسجلة بعد.</p>
          ) : (
            [...player.paymentHistory].reverse().map((item) => (
              <div
                className="history-row"
                key={item.month}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                }}
              >
                <span>{item.month}</span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <button
                    style={{
                      background:
                        item.status === "paid"
                          ? "var(--green)"
                          : "var(--red-light)",
                      color: item.status === "paid" ? "white" : "var(--red)",
                      border: "0",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    onClick={() =>
                      onUpdate(player._id, {
                        paymentStatus:
                          item.status === "paid" ? "unpaid" : "paid",
                        paymentMonth: item.month,
                      })
                    }
                  >
                    {item.status === "paid" ? "مدفوع ✓" : "لم يدفع"}
                  </button>
                  <button
                    style={{
                      background: "#fff0ec",
                      color: "var(--red)",
                      border: "0",
                      borderRadius: "4px",
                      padding: "4px 6px",
                      fontSize: "10px",
                    }}
                    onClick={() => {
                      if (confirm(`هل تريد حذف اشتراك شهر ${item.month}؟`)) {
                        onUpdate(player._id, {
                          paymentStatus: "clear",
                          paymentMonth: item.month,
                        });
                      }
                    }}
                    title="حذف من السجل"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}

          {/* إضافة شهر اشتراك مخصص */}
          <form onSubmit={addCustomPayment} className="custom-history-add">
            <span className="custom-history-label">تسجيل اشتراك لشهر محدد</span>
            <input
              type="month"
              value={customPaymentMonth}
              onChange={(e) => setCustomPaymentMonth(e.target.value)}
              required
            />
            <select
              value={customPaymentStatus}
              onChange={(e) => setCustomPaymentStatus(e.target.value)}
            >
              <option value="paid">مدفوع</option>
              <option value="unpaid">لم يدفع</option>
            </select>
            <button
              className="primary-button"
              type="submit"
              disabled={paymentSaving}
            >
              {paymentSaving ? "جاري الحفظ..." : "حفظ الحالة"}
            </button>
          </form>
          {paymentNotice && <p className="payment-notice">{paymentNotice}</p>}
        </div>

        {/* سجل الحضور التاريخي */}
        <div className="profile-section">
          <h3>سجل الحضور والغياب</h3>
          {!player.attendance || player.attendance.length === 0 ? (
            <p className="muted">لا توجد حصص حضور مسجلة بعد.</p>
          ) : (
            [...player.attendance].reverse().map((item) => (
              <div
                className="history-row"
                key={item.date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                }}
              >
                <span>{item.date}</span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <button
                    style={{
                      background:
                        item.status === "present" ? "var(--green)" : "#eaf7f0",
                      color:
                        item.status === "present" ? "white" : "var(--green)",
                      border: "0",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    onClick={() =>
                      onUpdate(player._id, {
                        attendanceStatus: "present",
                        date: item.date,
                      })
                    }
                  >
                    حاضر
                  </button>
                  <button
                    style={{
                      background:
                        item.status === "absent" ? "var(--red)" : "#fff0ec",
                      color: item.status === "absent" ? "white" : "var(--red)",
                      border: "0",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      fontSize: "10px",
                      fontWeight: "bold",
                    }}
                    onClick={() =>
                      onUpdate(player._id, {
                        attendanceStatus: "absent",
                        date: item.date,
                      })
                    }
                  >
                    غائب
                  </button>
                  <button
                    style={{
                      background: "#fff0ec",
                      color: "var(--red)",
                      border: "0",
                      borderRadius: "4px",
                      padding: "4px 6px",
                      fontSize: "10px",
                    }}
                    onClick={() => {
                      if (confirm(`هل تريد حذف حضور تاريخ ${item.date}؟`)) {
                        onUpdate(player._id, {
                          attendanceStatus: "clear",
                          date: item.date,
                        });
                      }
                    }}
                    title="حذف من السجل"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}

          {/* إضافة حصة حضور مخصصة */}
          <form
            onSubmit={addCustomAttendance}
            className="custom-history-add"
            style={{
              display: "flex",
              gap: "8px",
              marginTop: "16px",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: "11px",
                color: "var(--muted)",
                whiteSpace: "nowrap",
              }}
            >
              تسجيل حصة مخصصة:
            </span>
            <input
              type="date"
              max={today}
              value={customAttendanceDate}
              onChange={(e) => setCustomAttendanceDate(e.target.value)}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "6px",
                padding: "6px",
                fontSize: "11px",
                flex: 1,
                background: "#fbfcfb",
              }}
              required
            />
            <select
              value={customAttendanceStatus}
              onChange={(e) => setCustomAttendanceStatus(e.target.value)}
              style={{
                border: "1px solid var(--line)",
                borderRadius: "6px",
                padding: "6px",
                fontSize: "11px",
                background: "#fbfcfb",
              }}
            >
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
            </select>
            <button
              className="primary-button"
              style={{
                padding: "6px 12px",
                minHeight: "auto",
                fontSize: "11px",
                boxShadow: "none",
              }}
              type="submit"
            >
              إضافة
            </button>
          </form>
        </div>

        <button
          className="delete-player"
          onClick={() => {
            if (window.confirm("هل تريد حذف هذا اللاعب نهائيًا؟"))
              onDelete(player._id);
          }}
        >
          حذف اللاعب نهائيًا من الأكاديمية
        </button>
      </aside>
    </div>
  );
}
