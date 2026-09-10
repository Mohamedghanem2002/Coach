import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  localDate,
  paymentStatusFor,
  getBirthdayInfo,
  generateBirthdayWishUrl,
} from "../../lib/dashboard-utils";
import {
  Send,
  Download,
  MessageCircle,
  Pencil,
  Trash2,
  Phone,
  Cake,
  CreditCard,
  Calendar,
  Check,
  X,
  ClipboardCopy,
  UserRound,
  Info,
  Share2,
  Eye,
} from "lucide-react";
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
  const guardianPhone =
    player.guardianPhone ||
    player.parentPhone ||
    player.guardianMobile ||
    player.mobile ||
    player.phone ||
    "";
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(player.name);
  // Split DOB into day/month/year for easy numeric entry on mobile
  const _dob = (player.dateOfBirth || "").split("-");
  const [editDobYear, setEditDobYear] = useState(_dob[0] || "");
  const [editDobMonth, setEditDobMonth] = useState(_dob[1] || "");
  const [editDobDay, setEditDobDay] = useState(_dob[2] || "");
  const editDateOfBirth = editDobYear && editDobMonth && editDobDay
    ? `${editDobYear}-${editDobMonth.padStart(2, "0")}-${editDobDay.padStart(2, "0")}`
    : "";
  const [editGuardianPhone, setEditGuardianPhone] = useState(guardianPhone);
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
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageDataUrl, setModalImageDataUrl] = useState("");
  const [modalImageBlob, setModalImageBlob] = useState(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [cachedCardBlob, setCachedCardBlob] = useState(null);
  const attended = (
    Array.isArray(player.attendance) ? player.attendance : []
  ).filter((item) => item.status === "present").length;
  const monthlyStatus = paymentStatusFor(player, paymentMonth);
  const birthdayInfo = getBirthdayInfo(player);
  const registrationDate = new Date(player.createdAt).toLocaleDateString(
    "ar-EG",
  );
  useEffect(() => {
    if (!profileNotice) return undefined;
    const duration = profileNotice.includes("Ctrl + V") ? 12000 : 4000;
    const timer = setTimeout(() => setProfileNotice(""), duration);
    return () => clearTimeout(timer);
  }, [profileNotice]);

  useEffect(() => {
    let isCancelled = false;
    generateProfileCanvas().then((canvas) => {
      if (!canvas || isCancelled) return;
      canvas.toBlob((blob) => {
        if (!isCancelled && blob) {
          setCachedCardBlob(blob);
        }
      }, "image/png");
    });
    return () => {
      isCancelled = true;
    };
  }, [player, attended, monthlyStatus, paymentMonth]);
  function formatWhatsAppPhone(phone) {
    if (!phone) return "";
    let cleaned = String(phone).replace(/[^0-9]/g, "");
    if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);
    // Egyptian mobile numbers (010, 011, 012, 015)
    if (cleaned.startsWith("01") && cleaned.length === 11) {
      cleaned = "2" + cleaned;
    } else if (cleaned.startsWith("1") && cleaned.length === 10) {
      cleaned = "20" + cleaned;
    }
    return cleaned;
  }

  function openGuardianChat() {
    if (!guardianPhone) {
      setProfileNotice("⚠️ يرجى تسجيل رقم هاتف ولي الأمر أولاً ليتم فتح المحادثة معه.");
      return;
    }
    const cleanPhone = formatWhatsAppPhone(guardianPhone);
    if (!cleanPhone) {
      setProfileNotice("⚠️ رقم هاتف ولي الأمر المسجل غير صالح.");
      return;
    }
    window.open(`https://wa.me/${cleanPhone}`, "_blank", "noopener,noreferrer");
    setProfileNotice(`✓ تم فتح شات واتساب لولي الأمر (${guardianPhone})`);
  }

  function shareOnWhatsApp() {
    const cleanPhone = formatWhatsAppPhone(guardianPhone);
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
            `${item.date}: ${item.status === "present" ? "حاضر ✓" : "غائب ×"}`,
        )
        .join("\n")
      : "لا يوجد سجل حضور مسجل بعد";
    const paymentText = paymentHistory.length
      ? paymentHistory
        .map(
          (item) =>
            `${item.month}: ${item.status === "paid" ? "مدفوع ✓" : "لم يدفع ⚠️"}`,
        )
        .join("\n")
      : "لا توجد مدفوعات مسجلة بعد";
    const message = [
      "🥋 بيانات لاعب أكاديمية الكاراتيه",
      `📨 إشراف الكابتن: ${captainName}`,
      "",
      `👤 الاسم: ${player.name}`,
      `🎂 السن: ${player.age} سنة`,
      ...(guardianPhone ? [`📞 ولي الأمر: ${guardianPhone}`] : []),
      `🏢 الصالة: ${player.branch}`,
      `📅 تاريخ التسجيل: ${registrationDate}`,
      "",
      "📊 ملخص الحضور والاشتراك:",
      `✅ مرات الحضور: ${attended} حصة`,
      `📝 إجمالي الحصص المسجلة: ${(player.attendance || []).length}`,
      `💳 اشتراك شهر ${paymentMonth}: ${monthlyStatus === "paid" ? "مدفوع ✓" : "غير مدفوع ⚠️"}`,
      "",
      "📋 سجل الحضور والغياب:",
      attendanceText,
      "",
      "💰 سجل الاشتراكات السابقة:",
      paymentText,
    ].join("\n");

    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  async function generateProfileCanvas() {
    const attendanceHistory = Array.isArray(player.attendance)
      ? [...player.attendance].reverse().slice(0, 10)
      : [];
    const paymentHistory = Array.isArray(player.paymentHistory)
      ? [...player.paymentHistory].reverse().slice(0, 5)
      : [];

    const attendanceLines = attendanceHistory.length
      ? attendanceHistory.map(
        (item) =>
          `${item.date}     ${item.status === "present" ? "حاضر ✓" : "غائب ×"}`,
      )
      : ["لا يوجد سجل حضور مسجل بعد"];
    const paymentLines = paymentHistory.length
      ? paymentHistory.map(
        (item) =>
          `${item.month}     ${item.status === "paid" ? "مدفوع ✓" : "لم يدفع ⚠️"}`,
      )
      : ["لا توجد اشتراكات مسجلة بعد"];

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const drawRight = (text, x, y, font, color) => {
      context.font = font;
      context.fillStyle = color;
      context.textAlign = "right";
      context.direction = "rtl";
      context.fillText(text, x, y);
    };

    const drawCenter = (text, x, y, font, color) => {
      context.font = font;
      context.fillStyle = color;
      context.textAlign = "center";
      context.direction = "rtl";
      context.fillText(text, x, y);
    };

    // Outer luxury frame
    context.fillStyle = "#090d16";
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Main Card Surface
    context.fillStyle = "#ffffff";
    context.beginPath();
    context.roundRect(36, 36, canvas.width - 72, canvas.height - 72, 40);
    context.fill();

    // Top Header Banner
    const gradHeader = context.createLinearGradient(0, 36, canvas.width, 220);
    gradHeader.addColorStop(0, "#dc2626");
    gradHeader.addColorStop(0.5, "#b91c1c");
    gradHeader.addColorStop(1, "#881337");
    context.fillStyle = gradHeader;
    context.beginPath();
    context.roundRect(36, 36, canvas.width - 72, 190, [40, 40, 0, 0]);
    context.fill();

    // Embellishment badge
    context.fillStyle = "rgba(255, 255, 255, 0.15)";
    context.beginPath();
    context.roundRect(72, 70, 160, 52, 16);
    context.fill();
    drawCenter("COACH PRO", 152, 106, "900 24px Cairo, sans-serif", "#ffffff");

    drawRight(
      "بطاقة لاعب الكاراتيه الرسمية 🥋",
      canvas.width - 80,
      115,
      "900 44px Cairo, sans-serif",
      "#ffffff",
    );
    drawRight(
      `إشراف وتدريب الكابتن: ${captainName}`,
      canvas.width - 80,
      172,
      "700 28px Cairo, sans-serif",
      "#fecaca",
    );

    // Athlete Banner Box
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.roundRect(72, 255, canvas.width - 144, 320, 28);
    context.fill();
    context.strokeStyle = "#e2e8f0";
    context.lineWidth = 2.5;
    context.stroke();

    // Photo / Monogram Avatar
    let photoDrawn = false;
    if (player.photo) {
      const photo = await new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        image.src = player.photo;
      });
      if (photo) {
        context.save();
        context.beginPath();
        context.arc(225, 415, 105, 0, Math.PI * 2);
        context.clip();
        context.drawImage(photo, 120, 310, 210, 210);
        context.restore();

        context.beginPath();
        context.arc(225, 415, 105, 0, Math.PI * 2);
        context.strokeStyle = "#dc2626";
        context.lineWidth = 6;
        context.stroke();
        photoDrawn = true;
      }
    }

    if (!photoDrawn) {
      const avatarGrad = context.createLinearGradient(120, 310, 330, 520);
      avatarGrad.addColorStop(0, "#dc2626");
      avatarGrad.addColorStop(1, "#991b1b");
      context.fillStyle = avatarGrad;
      context.beginPath();
      context.arc(225, 415, 105, 0, Math.PI * 2);
      context.fill();

      drawCenter(
        player.name ? player.name.charAt(0) : "ك",
        225,
        445,
        "900 86px Cairo, sans-serif",
        "#ffffff",
      );
    }

    // Athlete Details
    drawRight(player.name, 940, 340, "900 46px Cairo, sans-serif", "#0f172a");
    drawRight(`🏢 الصالة: ${player.branch}`, 940, 400, "700 28px Cairo, sans-serif", "#334155");
    drawRight(`🎂 السن: ${player.age} سنة`, 940, 452, "700 28px Cairo, sans-serif", "#334155");
    if (guardianPhone) {
      drawRight(`📞 ولي الأمر: ${guardianPhone}`, 940, 504, "700 26px Cairo, sans-serif", "#047857");
    }
    drawRight(`📅 تاريخ التسجيل: ${registrationDate}`, 940, 550, "600 23px Cairo, sans-serif", "#94a3b8");

    // KPI Summary Section (3 Stats Boxes)
    const statBoxWidth = (canvas.width - 144 - 36) / 3;

    // Box 1: Attended
    context.fillStyle = "#ecfdf5";
    context.beginPath();
    context.roundRect(72, 605, statBoxWidth, 145, 20);
    context.fill();
    context.strokeStyle = "#a7f3d0";
    context.lineWidth = 2;
    context.stroke();
    drawCenter(String(attended), 72 + statBoxWidth / 2, 675, "900 52px Cairo, sans-serif", "#047857");
    drawCenter("حصة حضور", 72 + statBoxWidth / 2, 725, "700 24px Cairo, sans-serif", "#065f46");

    // Box 2: Total Sessions
    context.fillStyle = "#f1f5f9";
    context.beginPath();
    context.roundRect(72 + statBoxWidth + 18, 605, statBoxWidth, 145, 20);
    context.fill();
    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 2;
    context.stroke();
    drawCenter(String((player.attendance || []).length), 72 + statBoxWidth + 18 + statBoxWidth / 2, 675, "900 52px Cairo, sans-serif", "#1e293b");
    drawCenter("حصة مسجلة", 72 + statBoxWidth + 18 + statBoxWidth / 2, 725, "700 24px Cairo, sans-serif", "#475569");

    // Box 3: Monthly Payment
    const isPaid = monthlyStatus === "paid";
    context.fillStyle = isPaid ? "#ecfdf5" : "#fff1f2";
    context.beginPath();
    context.roundRect(72 + (statBoxWidth + 18) * 2, 605, statBoxWidth, 145, 20);
    context.fill();
    context.strokeStyle = isPaid ? "#a7f3d0" : "#fecdd3";
    context.lineWidth = 2;
    context.stroke();
    drawCenter(isPaid ? "مدفوع ✓" : "لم يدفع ⚠️", 72 + (statBoxWidth + 18) * 2 + statBoxWidth / 2, 675, "900 38px Cairo, sans-serif", isPaid ? "#047857" : "#be123c");
    drawCenter(`شهر ${paymentMonth}`, 72 + (statBoxWidth + 18) * 2 + statBoxWidth / 2, 725, "700 22px Cairo, sans-serif", isPaid ? "#065f46" : "#9f1239");

    // Attendance History Table
    drawRight("🥋 آخر سجلات الحضور والغياب", 940, 815, "900 34px Cairo, sans-serif", "#0f172a");
    let y = 875;
    for (const line of attendanceLines) {
      const isPres = line.includes("حاضر");
      context.fillStyle = isPres ? "#f0fdf4" : "#fef2f2";
      context.beginPath();
      context.roundRect(72, y - 36, canvas.width - 144, 52, 14);
      context.fill();
      context.strokeStyle = isPres ? "#bbf7d0" : "#fecaca";
      context.lineWidth = 1.5;
      context.stroke();

      drawRight(line, 930, y + 2, "700 26px Cairo, sans-serif", isPres ? "#15803d" : "#b91c1c");
      y += 68;
    }

    // Payment History Table
    y = Math.max(y + 25, 1410);
    drawRight("💳 سجل الاشتراكات السابقة", 940, y, "900 34px Cairo, sans-serif", "#0f172a");
    y += 60;
    for (const line of paymentLines) {
      const isP = line.includes("مدفوع");
      context.fillStyle = isP ? "#f0fdf4" : "#fef2f2";
      context.beginPath();
      context.roundRect(72, y - 36, canvas.width - 144, 52, 14);
      context.fill();
      context.strokeStyle = isP ? "#bbf7d0" : "#fecaca";
      context.lineWidth = 1.5;
      context.stroke();

      drawRight(line, 930, y + 2, "700 26px Cairo, sans-serif", isP ? "#15803d" : "#b91c1c");
      y += 68;
    }

    // Footer
    context.fillStyle = "#e2e8f0";
    context.fillRect(72, canvas.height - 120, canvas.width - 144, 2);

    drawRight(
      `تم استخراج البطاقة رسميًا من نظام COACH PRO  •  ${new Date().toLocaleDateString("ar-EG")}`,
      canvas.width - 80,
      canvas.height - 70,
      "600 22px Cairo, sans-serif",
      "#94a3b8",
    );

    return canvas;
  }

  async function shareProfileImage() {
    setProfileNotice("⏳ جاري توليد وتحميل صورة البطاقة...");
    const canvas = await generateProfileCanvas();
    if (!canvas) return;
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return;
    const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
    const downloadLink = document.createElement("a");
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = fileName;
    downloadLink.click();
    setTimeout(() => URL.revokeObjectURL(downloadLink.href), 2000);
    setProfileNotice("✓ تم تحميل صورة بطاقة اللاعب بنجاح");
  }

  async function openImageModal() {
    try {
      setProfileNotice("⏳ جاري إنشاء صورة بطاقة اللاعب...");

      const canvas = await generateProfileCanvas();
      if (!canvas) return;

      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );

      if (!blob) {
        setProfileNotice("❌ تعذر إنشاء صورة البطاقة");
        return;
      }

      const dataUrl = canvas.toDataURL("image/png");
      setModalImageDataUrl(dataUrl);
      setModalImageBlob(blob);
      setImageCopied(false);
      setImageModalOpen(true);
      setProfileNotice("");
    } catch (error) {
      console.error("Failed to open image modal:", error);
      setProfileNotice("❌ حدث خطأ أثناء إنشاء صورة البطاقة");
    }
  }

  async function shareProfileImageToWhatsApp() {
    if (!guardianPhone) {
      setProfileNotice("⚠️ يرجى تسجيل رقم هاتف ولي الأمر أولاً ليتم مشاركة البطاقة معه عبر واتساب.");
      return;
    }

    const cleanPhone = formatWhatsAppPhone(guardianPhone);
    if (!cleanPhone) {
      setProfileNotice("⚠️ رقم هاتف ولي الأمر المسجل غير صالح.");
      return;
    }

    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    // 1. Mobile flow: Native share with image file directly
    if (isMobile && navigator.share) {
      let blob = cachedCardBlob;
      if (!blob) {
        setProfileNotice("⏳ جاري تجهيز صورة بطاقة اللاعب...");
        const canvas = await generateProfileCanvas();
        if (canvas) {
          blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        }
      }
      if (blob) {
        const fileName = `بطاقة_${player.name.replace(/\s+/g, "_")}.png`;
        const file = new File([blob], fileName, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `بطاقة اللاعب ${player.name}`,
              text: `بطاقة بيانات اللاعب ${player.name} - أكاديمية الكاراتيه`,
            });
            setProfileNotice("✓ تم فتح المشاركة بنجاح");
            return;
          } catch (err) {
            if (err.name === "AbortError") return;
            console.warn("Mobile share aborted or failed:", err);
          }
        }
      }
    }

    // 2. Desktop flow:
    // Open WhatsApp chat IMMEDIATELY in a new tab synchronously (exact same as openGuardianChat)
    const waUrl = `https://wa.me/${cleanPhone}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");

    // 3. Prepare card image blob
    let blob = cachedCardBlob;
    if (!blob) {
      setProfileNotice("⏳ فُتح شات ولي الأمر وجاري نسخ صورة البطاقة...");
      const canvas = await generateProfileCanvas();
      if (canvas) {
        blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (blob) setCachedCardBlob(blob);
      }
    }

    if (!blob) {
      setProfileNotice(`✓ تم فتح شات واتساب لولي الأمر (${guardianPhone})`);
      return;
    }

    // 4. Automatically copy the image to the clipboard so the coach can just press Ctrl + V
    let copied = false;
    try {
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        copied = true;
        setImageCopied(true);
      }
    } catch (clipErr) {
      console.warn("Clipboard copy failed:", clipErr);
    }

    // 5. Automatically download the card image file so it is ready on the computer
    try {
      const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
      const downloadLink = document.createElement("a");
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      downloadLink.click();
      setTimeout(() => URL.revokeObjectURL(downloadLink.href), 3000);
    } catch (dlErr) {
      console.warn("Download error:", dlErr);
    }

    // 6. Give the coach clear and prominent instruction
    setProfileNotice(
      copied
        ? "✓ تم فتح شات ولي الأمر ونُسخت صورة البطاقة للحافظة! اضغط (Ctrl + V) في واتساب للإرسال فوراً 🚀 (تم حفظ نسخة بجهازك)"
        : "✓ تم فتح شات ولي الأمر وتم تنزيل صورة البطاقة لجهازك! اسحب الصورة إلى الشات أو أرفقها من 📎 للإرسال.",
    );
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
      dateOfBirth: editDateOfBirth,
      guardianPhone: editGuardianPhone.trim(),
      age: String(player.age),
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-fade-in-scale"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <aside className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl sm:rounded-3xl">
        {/* Gradient top accent */}
        <div className="sticky top-0 z-30 h-[3px] w-full rounded-t-3xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        <div className="p-5 sm:p-7">
          {profileNotice && (
            <div
              className={`mb-4 flex items-center justify-between gap-2 rounded-2xl border p-3 text-xs font-bold shadow-sm animate-slide-up ${
                profileNotice.startsWith("تعذر") || profileNotice.startsWith("❌")
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : profileNotice.startsWith("⚠️")
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
              role="status"
            >
              <span>{profileNotice}</span>
              <button type="button" onClick={() => setProfileNotice("")} className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-sm font-bold hover:bg-current/20">
                ✕
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="section-eyebrow">ملف اللاعب</p>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-all cursor-pointer"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

        {isEditing ? (
            <form onSubmit={saveInfo} className="w-full space-y-4">
            <div className="mb-4 border-b border-slate-100 pb-3">
              <h2 className="font-cairo text-lg font-black text-slate-900">تعديل بيانات اللاعب</h2>
              <p className="text-xs text-slate-400 mt-0.5">قم بتحديث معلومات اللاعب ثم اضغط حفظ</p>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-600 mb-1.5">اسم اللاعب</label>
              <input
                className="w-full rounded-xl border border-slate-200/80 bg-slate-50/60 px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                placeholder="مثال: أحمد محمد"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  تاريخ الميلاد
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="اليوم"
                    maxLength={2}
                    value={editDobDay}
                    onChange={(e) => setEditDobDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    required={!player.dateOfBirth}
                  />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="الشهر"
                    maxLength={2}
                    value={editDobMonth}
                    onChange={(e) => setEditDobMonth(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    required={!player.dateOfBirth}
                  />
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="السنة"
                    maxLength={4}
                    value={editDobYear}
                    onChange={(e) => setEditDobYear(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    required={!player.dateOfBirth}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  الفرع / الصالة
                </label>
                <select
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  value={editBranch}
                  onChange={(e) => setEditBranch(e.target.value)}
                >
                  {branches.map((item) => (
                    <option key={item._id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                رقم ولي الأمر
              </label>
              <input
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                type="tel"
                inputMode="tel"
                value={editGuardianPhone}
                onChange={(e) => setEditGuardianPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                صورة اللاعب
              </label>
              <div className="flex items-center gap-3">
                <input
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-red-100 file:px-3 file:py-1.5 file:text-xs file:font-black file:text-red-700 hover:file:bg-red-200 cursor-pointer"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
                {editPhoto && (
                  <div className="flex items-center gap-2">
                    <img
                      src={editPhoto}
                      alt="Preview"
                      className="h-10 w-10 rounded-xl object-cover ring-1 ring-red-200"
                    />
                    <button
                      type="button"
                      onClick={() => setEditPhoto("")}
                      className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600"
                    >
                      إزالة
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              <button
                className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-xs font-black text-white shadow-sm shadow-red-500/20 hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer transition-all"
                type="submit"
                disabled={profileSaving}
              >
                {profileSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                    جاري الحفظ...
                  </span>
                ) : "✓ حفظ التعديلات"}
              </button>
              <button
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                type="button"
                onClick={() => setIsEditing(false)}
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <>
            {/* بطاقة البطل الأساسية (Athlete Hero Card) */}
            <div className="rounded-3xl border border-slate-200/80 bg-gradient-to-l from-slate-50 via-white to-red-50/30 p-4 sm:p-5 shadow-2xs mb-5">
              <div className="flex items-start gap-4">
                <div className="relative flex h-18 w-18 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 font-cairo text-2xl font-black text-white shadow-md ring-4 ring-white">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{player.name.charAt(0)}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-cairo text-xl font-black text-slate-900 sm:text-2xl">
                    {player.name}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                      🏢 {player.branch}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200/80 px-2 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                      🎂 {player.age} سنة
                    </span>
                  </div>

                  {guardianPhone ? (
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <a
                        href={`tel:${guardianPhone}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition"
                        title="اتصال هاتفي بولي الأمر"
                      >
                        <Phone className="h-3 w-3 text-slate-500" />
                        <span>{guardianPhone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={openGuardianChat}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-300 px-3 py-1 text-[11px] font-black text-emerald-700 hover:bg-emerald-100 active:scale-95 cursor-pointer transition shadow-2xs"
                        title="فتح شات واتساب مع ولي الأمر مباشرة"
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>إرسال لولي الأمر (فتح الشات)</span>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-400">
                        📞 هاتف ولي الأمر: غير مسجل
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setEditName(player.name);
                          const _d = (player.dateOfBirth || "").split("-");
                          setEditDobYear(_d[0] || "");
                          setEditDobMonth(_d[1] || "");
                          setEditDobDay(_d[2] || "");
                          setEditGuardianPhone("");
                          setEditBranch(player.branch);
                          setEditPhoto(player.photo || "");
                          setIsEditing(true);
                        }}
                        className="text-[11px] font-extrabold text-red-600 hover:underline cursor-pointer"
                      >
                        + إضافة رقم الآن
                      </button>
                    </div>
                  )}
                  <span className="mt-1.5 block text-[10px] font-semibold text-slate-400">
                    تاريخ التسجيل: {registrationDate}
                  </span>

                  {birthdayInfo?.isToday && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-3 shadow-2xs">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl animate-bounce">🎂</span>
                        <div>
                          <strong className="block font-cairo text-xs font-black text-rose-800">
                            اليوم عيد ميلاد {player.name}! 🎉
                          </strong>
                          <span className="block text-[11px] font-bold text-slate-600">
                            أتم اليوم {birthdayInfo.turningAge} سنة بارك الله فيه! 🥋
                          </span>
                        </div>
                      </div>
                      <a
                        href={generateBirthdayWishUrl(player, captainName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 transition-all text-center"
                        title="إرسال تهنئة عبر واتساب لولي الأمر"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>تهنئة عيد الميلاد واتساب</span>
                      </a>
                    </div>
                  )}

                  {!birthdayInfo?.isToday && birthdayInfo?.isUpcoming && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/70 p-2.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">🎂</span>
                        <span className="font-bold text-amber-900">
                          عيد ميلاده القادم {birthdayInfo.daysLeft === 1 ? "غداً" : `بعد ${birthdayInfo.daysLeft} أيام`} (يوافق {birthdayInfo.dateFormatted}) — سيُتم {birthdayInfo.turningAge} سنة!
                        </span>
                      </div>
                      <a
                        href={generateBirthdayWishUrl(player, captainName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-extrabold text-emerald-700 hover:underline"
                      >
                        تجهيز تهنئة واتساب 📲
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* أزرار الإجراءات والمشاركة */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2 border-t border-slate-200/60 pt-3">
                <button
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500 bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 py-2.5 text-xs font-black text-white shadow-xs transition hover:brightness-110 active:scale-95 cursor-pointer col-span-2 sm:col-span-1"
                  type="button"
                  onClick={shareProfileImageToWhatsApp}
                  title="مشاركة صورة بطاقة اللاعب مباشرة لرقم ولي الأمر المسجل على واتساب"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>مشاركة البطاقة</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-2 py-2.5 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 active:scale-95 cursor-pointer"
                  type="button"
                  onClick={openGuardianChat}
                  title="فتح محادثة واتساب لولي الأمر مباشرة"
                >
                  <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                  <span>إرسال لولي الأمر</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/80 px-2 py-2.5 text-xs font-black text-teal-800 transition hover:bg-teal-100 active:scale-95 cursor-pointer"
                  type="button"
                  onClick={openImageModal}
                  title="معاينة وتحميل صورة بطاقة اللاعب"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>معاينة البطاقة</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2.5 text-xs font-black text-slate-700 transition hover:bg-slate-100 active:scale-95 cursor-pointer"
                  type="button"
                  onClick={shareOnWhatsApp}
                  title="إرسال تقرير نصي مفصل عبر واتساب"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>تقرير نصي</span>
                </button>
                <button
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 cursor-pointer"
                  onClick={() => {
                    setEditName(player.name);
                    const _d = (player.dateOfBirth || "").split("-");
                    setEditDobYear(_d[0] || "");
                    setEditDobMonth(_d[1] || "");
                    setEditDobDay(_d[2] || "");
                    setEditGuardianPhone(guardianPhone);
                    setEditBranch(player.branch);
                    setEditPhoto(player.photo || "");
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>تعديل</span>
                </button>
              </div>
            </div>

            {/* Mini KPI cards */}
            <div className="grid grid-cols-3 gap-2.5 pb-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3.5 text-center shadow-xs">
                <strong className="block font-cairo text-2xl font-black text-emerald-700">
                  {attended}
                </strong>
                <span className="mt-0.5 block text-[11px] font-semibold text-emerald-800">حصة حضور</span>
              </div>
              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/70 p-3.5 text-center shadow-xs">
                <strong className="block font-cairo text-2xl font-black text-slate-800">
                  {(player.attendance || []).length}
                </strong>
                <span className="mt-0.5 block text-[11px] font-semibold text-slate-500">حصة مسجلة</span>
              </div>
              <div className={`rounded-2xl border p-3.5 text-center shadow-xs ${
                monthlyStatus === "paid"
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-rose-200 bg-rose-50/60"
              }`}>
                <strong className={`block font-cairo text-lg font-black ${
                  monthlyStatus === "paid" ? "text-emerald-700" : "text-rose-700"
                }`}>
                  {monthlyStatus === "paid" ? "✓ مدفوع" : "لم يدفع"}
                </strong>
                <span className="mt-0.5 block text-[11px] font-semibold text-slate-400">
                  شهر {paymentMonth}
                </span>
              </div>
            </div>

            {/* Current month payment toggle */}
            <div className="rounded-2xl border border-slate-200/60 bg-white p-4 shadow-md mb-5 flex items-center justify-between gap-3">
              <div>
                <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                  اشتراك شهر {paymentMonth}
                </h3>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">حالة اشتراك هذا الشهر</p>
              </div>
              <button
                className={`rounded-xl px-4 py-2.5 text-xs font-black transition-all active:scale-95 cursor-pointer shadow-sm ${
                  monthlyStatus === "paid"
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/20"
                    : "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-rose-500/20"
                }`}
                onClick={() =>
                  onUpdate(player._id, {
                    paymentStatus: monthlyStatus === "paid" ? "unpaid" : "paid",
                    paymentMonth,
                  })
                }
              >
                {monthlyStatus === "paid" ? "✓ مدفوع (تبديل)" : "تسجيل دفع الاشتراك"}
              </button>
            </div>
          </>
        )}

        {/* سجل الاشتراكات التاريخي */}
        <div className="border-t border-slate-100 pt-4 pb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-50 border border-sky-100">
                <CreditCard className="h-3.5 w-3.5 text-sky-600" />
              </div>
              <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                سجل الاشتراكات السابقة
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {(player.paymentHistory || []).length} شهر مسجل
            </span>
          </div>

          {!player.paymentHistory || player.paymentHistory.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">لا توجد مدفوعات مسجلة بعد.</p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {[...player.paymentHistory].reverse().map((item) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                  key={item.month}
                >
                  <span className="font-bold text-slate-800">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${item.status === "paid"
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-100 text-rose-700"
                        }`}
                      onClick={() =>
                        onUpdate(player._id, {
                          paymentStatus: item.status === "paid" ? "unpaid" : "paid",
                          paymentMonth: item.month,
                        })
                      }
                    >
                      {item.status === "paid" ? (
                        <><Check className="h-3 w-3" strokeWidth={2.5} /> مدفوع</>
                      ) : (
                        <><X className="h-3 w-3" strokeWidth={2.5} /> لم يدفع</>
                      )}
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
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
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* إضافة شهر اشتراك مخصص */}
          <form
            onSubmit={addCustomPayment}
            className="mt-3 grid gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:grid-cols-[1fr_1fr_auto]"
          >
            <span className="text-[11px] font-extrabold text-slate-700 sm:col-span-full">
              تسجيل اشتراك لشهر محدد:
            </span>
            <input
              type="month"
              value={customPaymentMonth}
              onChange={(e) => setCustomPaymentMonth(e.target.value)}
              className="min-h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
              required
            />
            <select
              className="min-h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
              value={customPaymentStatus}
              onChange={(e) => setCustomPaymentStatus(e.target.value)}
            >
              <option value="paid">مدفوع</option>
              <option value="unpaid">لم يدفع</option>
            </select>
            <button
              className="min-h-9 rounded-xl bg-slate-900 px-3.5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer"
              type="submit"
              disabled={paymentSaving}
            >
              {paymentSaving ? "جاري..." : "حفظ"}
            </button>
          </form>
          {paymentNotice && (
            <p className="mt-2 text-xs font-bold text-emerald-600">
              {paymentNotice}
            </p>
          )}
        </div>

        {/* سجل الحضور التاريخي */}
        <div className="border-t border-slate-100 pt-4 pb-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-100">
                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                سجل الحضور والغياب
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {(player.attendance || []).length} حصة مسجلة
            </span>
          </div>

          {!player.attendance || player.attendance.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">
              لا توجد حصص حضور مسجلة بعد.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {[...player.attendance].reverse().map((item) => (
                <div
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 text-xs"
                  key={item.date}
                >
                  <span className="font-bold text-slate-800">{item.date}</span>
                  <div className="flex items-center gap-2">
                    <button
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors cursor-pointer ${item.status === "present"
                        ? "bg-emerald-600 text-white"
                        : "bg-rose-600 text-white"
                        }`}
                      onClick={() =>
                        onUpdate(player._id, {
                          attendanceStatus: item.status === "present" ? "absent" : "present",
                          date: item.date,
                        })
                      }
                    >
                      {item.status === "present" ? (
                        <><Check className="h-3 w-3" strokeWidth={2.5} /> حاضر</>
                      ) : (
                        <><X className="h-3 w-3" strokeWidth={2.5} /> غائب</>
                      )}
                    </button>
                    <button
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
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
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* إضافة حصة حضور مخصصة */}
          <form
            onSubmit={addCustomAttendance}
            className="mt-3 flex flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3 sm:flex-row sm:items-center"
          >
            <span className="whitespace-nowrap text-[11px] font-extrabold text-slate-700">
              تسجيل حصة مخصصة:
            </span>
            <input
              type="date"
              max={today}
              value={customAttendanceDate}
              onChange={(e) => setCustomAttendanceDate(e.target.value)}
              className="min-h-9 flex-1 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
              required
            />
            <select
              value={customAttendanceStatus}
              onChange={(e) => setCustomAttendanceStatus(e.target.value)}
              className="min-h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
            >
              <option value="present">حاضر</option>
              <option value="absent">غائب</option>
            </select>
            <button
              className="min-h-9 rounded-xl bg-slate-900 px-3.5 text-xs font-black text-white hover:bg-slate-800 active:scale-95 cursor-pointer"
              type="submit"
            >
              إضافة
            </button>
          </form>
        </div>

        {/* زر حذف اللاعب النهائي */}
          {/* Delete player */}
          <button
            type="button"
            className="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/60 px-4 py-3 text-xs font-extrabold text-rose-700 transition-all hover:bg-rose-100 hover:border-rose-300 active:scale-98 cursor-pointer"
            onClick={() => {
              if (window.confirm("هل أنت متأكد من رغبتك في حذف هذا اللاعب نهائيًا من الأكاديمية؟"))
                onDelete(player._id);
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>حذف اللاعب نهائيًا من الأكاديمية</span>
          </button>
        </div>
      </aside>

      {/* نافذة إرسال صورة البطاقة لولي الأمر */}
      {imageModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md animate-fade-in-scale"
          dir="rtl"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setImageModalOpen(false);
            }
          }}
        >
          <div className="relative max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-5 shadow-2xl sm:p-6">
            {/* Gradient top accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xs">
                  <Send className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-cairo text-base font-black text-slate-900">
                  بطاقة اللاعب: {player.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(false);
                  setModalImageDataUrl("");
                  setModalImageBlob(null);
                  setImageCopied(false);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* عرض الصورة الناتجة */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner flex justify-center p-2">
              <img
                src={modalImageDataUrl}
                alt={`بطاقة ${player.name}`}
                className="max-h-72 sm:max-h-80 w-auto rounded-xl shadow-md object-contain"
              />
            </div>

            {/* أزرار الإجراءات السريعة */}
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={shareProfileImageToWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition sm:col-span-2 text-center cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>مشاركة البطاقة عبر واتساب لولي الأمر</span>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (modalImageBlob && navigator.clipboard?.write) {
                    try {
                      await navigator.clipboard.write([
                        new ClipboardItem({ "image/png": modalImageBlob }),
                      ]);
                      setImageCopied(true);
                      setTimeout(() => setImageCopied(false), 3000);
                    } catch (e) {
                      console.warn(e);
                    }
                  }
                }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 active:scale-95 cursor-pointer"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                <span>{imageCopied ? "✓ تم نسخ الصورة!" : "نسخ للحافظة"}</span>
              </button>

              <button
                type="button"
                onClick={shareProfileImage}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-black text-amber-800 hover:bg-amber-100 active:scale-95 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>تحميل للجهاز</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
