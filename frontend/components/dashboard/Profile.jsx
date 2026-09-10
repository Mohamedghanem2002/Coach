import { useEffect, useState, useMemo } from "react";
import ConfirmDialog from "./ConfirmDialog";
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
  FileText,
  Award,
  TrendingUp,
  Sparkles,
} from "lucide-react";

export default function Profile({
  player,
  branches,
  paymentMonth,
  onClose,
  onUpdate,
  onDelete,
}) {
  const { data: session } = useSession();
  const captainName = session?.user?.name || "كابتن الأكاديمية";
  const guardianPhone =
    player.guardianPhone ||
    player.parentPhone ||
    player.guardianMobile ||
    player.mobile ||
    player.phone ||
    "";

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "attendance" | "payments" | "edit"
  const [phoneCopied, setPhoneCopied] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState(player.name);
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

  // Attendance & payment custom entry
  const today = localDate();
  const [customAttendanceDate, setCustomAttendanceDate] = useState(today);
  const [customAttendanceStatus, setCustomAttendanceStatus] = useState("present");
  const [customPaymentMonth, setCustomPaymentMonth] = useState(today.slice(0, 7));
  const [customPaymentStatus, setCustomPaymentStatus] = useState("paid");

  // Notifications and async loading states
  const [profileNotice, setProfileNotice] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Modal and card state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageDataUrl, setModalImageDataUrl] = useState("");
  const [modalImageBlob, setModalImageBlob] = useState(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [cachedCardBlob, setCachedCardBlob] = useState(null);

  // Delete modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingPlayer, setIsDeletingPlayer] = useState(false);

  // Individual button action states (Double click prevention)
  const [isSharingImage, setIsSharingImage] = useState(false);
  const [isSendingText, setIsSendingText] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isCallingGuardian, setIsCallingGuardian] = useState(false);
  const [isPreviewingCard, setIsPreviewingCard] = useState(false);
  const [isTogglingPayment, setIsTogglingPayment] = useState(false);
  const [updatingPaymentMonth, setUpdatingPaymentMonth] = useState(null);
  const [deletingPaymentMonth, setDeletingPaymentMonth] = useState(null);
  const [updatingAttendanceDate, setUpdatingAttendanceDate] = useState(null);
  const [deletingAttendanceDate, setDeletingAttendanceDate] = useState(null);

  // Calculated Age
  const calculatedEditAge = useMemo(() => {
    if (!editDobYear || !editDobMonth || !editDobDay) return null;
    const y = parseInt(editDobYear, 10);
    const m = parseInt(editDobMonth, 10);
    const d = parseInt(editDobDay, 10);
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
    const todayDate = new Date();
    let age = todayDate.getFullYear() - y;
    const currentMonth = todayDate.getMonth() + 1;
    const currentDay = todayDate.getDate();
    if (currentMonth < m || (currentMonth === m && currentDay < d)) {
      age -= 1;
    }
    return age >= 0 && age <= 100 ? age : null;
  }, [editDobYear, editDobMonth, editDobDay]);

  const attended = (
    Array.isArray(player.attendance) ? player.attendance : []
  ).filter((item) => item.status === "present").length;
  const totalAttendanceCount = (player.attendance || []).length;
  const attendanceRate = totalAttendanceCount
    ? Math.round((attended / totalAttendanceCount) * 100)
    : 0;
  const monthlyStatus = paymentStatusFor(player, paymentMonth);
  const birthdayInfo = getBirthdayInfo(player);
  const registrationDate = new Date(player.createdAt).toLocaleDateString("ar-EG");

  useEffect(() => {
    if (!profileNotice) return undefined;
    const duration = profileNotice.includes("Ctrl + V") ? 10000 : 4000;
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

  function openWhatsAppNative(cleanPhone, text = "") {
    const isMobile =
      typeof navigator !== "undefined" &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      );

    const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
    const appUrl = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}${encodedText}`
      : `whatsapp://send?text=${encodedText.replace(/^&/, "")}`;

    if (isMobile) {
      window.location.href = appUrl;
    } else {
      window.location.href = appUrl;
      setTimeout(() => {
        if (document.hasFocus()) {
          const webUrl = cleanPhone
            ? `https://web.whatsapp.com/send?phone=${cleanPhone}${text ? `&text=${encodeURIComponent(text)}` : ""}`
            : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;
          window.open(webUrl, "_blank", "noopener,noreferrer");
        }
      }, 1200);
    }
  }

  function openGuardianChat() {
    if (isOpeningChat) return;
    if (!guardianPhone) {
      setProfileNotice("⚠️ يرجى تسجيل رقم هاتف ولي الأمر أولاً ليتم فتح المحادثة معه.");
      return;
    }
    const cleanPhone = formatWhatsAppPhone(guardianPhone);
    if (!cleanPhone) {
      setProfileNotice("⚠️ رقم هاتف ولي الأمر المسجل غير صالح.");
      return;
    }
    setIsOpeningChat(true);
    setProfileNotice(`✓ جاري فتح تطبيق واتساب لولي الأمر (${guardianPhone})`);
    openWhatsAppNative(cleanPhone);
    setTimeout(() => setIsOpeningChat(false), 2000);
  }

  function copyGuardianPhone() {
    if (!guardianPhone) return;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(guardianPhone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2500);
    }
  }

  function shareOnWhatsApp() {
    if (isSendingText) return;
    setIsSendingText(true);
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

    openWhatsAppNative(cleanPhone, message);
    setProfileNotice("✓ جاري فتح تطبيق واتساب وإرسال التقرير");
    setTimeout(() => setIsSendingText(false), 2500);
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

  async function downloadProfileCard() {
    if (isDownloadingCard) return;
    setIsDownloadingCard(true);
    setProfileNotice("⏳ جاري إنشاء وتحميل صورة بطاقة اللاعب...");
    try {
      let blob = cachedCardBlob;
      if (!blob) {
        const canvas = await generateProfileCanvas();
        if (!canvas) {
          setProfileNotice("❌ تعذر إنشاء صورة البطاقة");
          return;
        }
        blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (blob) setCachedCardBlob(blob);
      }
      if (!blob) {
        setProfileNotice("❌ تعذر إنشاء صورة البطاقة");
        return;
      }
      const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
      const downloadLink = document.createElement("a");
      const url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      setProfileNotice("✓ تم تحميل وحفظ صورة بطاقة اللاعب بجهازك بنجاح!");
    } catch (error) {
      console.error("Failed to download profile card:", error);
      setProfileNotice("❌ حدث خطأ أثناء تحميل صورة البطاقة");
    } finally {
      setTimeout(() => setIsDownloadingCard(false), 2000);
    }
  }

  async function openImageModal() {
    if (isPreviewingCard) return;
    setIsPreviewingCard(true);
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
    } finally {
      setIsPreviewingCard(false);
    }
  }

  async function shareProfileImageToWhatsApp() {
    if (isSharingImage) return;
    if (!guardianPhone) {
      setProfileNotice("⚠️ يرجى تسجيل رقم هاتف ولي الأمر أولاً ليتم مشاركة البطاقة معه عبر واتساب.");
      return;
    }

    const cleanPhone = formatWhatsAppPhone(guardianPhone);
    if (!cleanPhone) {
      setProfileNotice("⚠️ رقم هاتف ولي الأمر المسجل غير صالح.");
      return;
    }

    setIsSharingImage(true);
    setProfileNotice("⏳ جاري تجهيز صورة بطاقة اللاعب المعتمدة...");

    try {
      // Prepare high-res PNG blob
      let blob = cachedCardBlob;
      if (!blob) {
        const canvas = await generateProfileCanvas();
        if (canvas) {
          blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
          if (blob) setCachedCardBlob(blob);
        }
      }

      if (!blob) {
        setProfileNotice("❌ تعذر إنشاء صورة البطاقة");
        return;
      }

      const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Check if Web Share API with files is supported (Mobile Android / iOS)
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            title: `بطاقة اللاعب ${player.name}`,
            text: `🥋 بطاقة بيانات وإحصائيات اللاعب: ${player.name} - أكاديمية الكاراتيه\nإشراف وتدريب الكابتن: ${captainName}`,
          });
          setProfileNotice("✓ تم إرسال ومشاركة صورة البطاقة بنجاح عبر واتساب!");
          return;
        } catch (shareErr) {
          if (shareErr.name === "AbortError") return;
          console.warn("Native share cancelled or failed, falling back to direct chat:", shareErr);
        }
      }

      // Desktop & Fallback flow:
      // 1. Copy image directly to clipboard
      let copied = false;
      if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          copied = true;
          setImageCopied(true);
        } catch (clipErr) {
          console.warn("Clipboard copy failed:", clipErr);
        }
      }

      // 2. Download image file as backup
      try {
        const downloadLink = document.createElement("a");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = fileName;
        downloadLink.click();
        setTimeout(() => URL.revokeObjectURL(downloadLink.href), 3000);
      } catch (dlErr) {
        console.warn("Download error:", dlErr);
      }

      // 3. Open WhatsApp chat directly with guardian
      openWhatsAppNative(cleanPhone);

      setProfileNotice(
        copied
          ? "✓ تم فتح شات ولي الأمر ونُسخت الصورة للحافظة! اضغط (Ctrl + V) في الشات لإرسال الصورة فوراً 🚀 (تم حفظ نسخة بجهازك)"
          : "✓ تم فتح شات ولي الأمر وتم تنزيل صورة البطاقة لجهازك! اسحب الصورة إلى الشات أو أرفقها من 📎 للإرسال.",
      );
    } catch (err) {
      console.error("Failed to share profile image:", err);
      setProfileNotice("❌ تعذر مشاركة صورة البطاقة. حاول مرة أخرى.");
    } finally {
      setTimeout(() => setIsSharingImage(false), 2500);
    }
  }

  async function handleToggleMonthlyPayment() {
    if (isTogglingPayment) return;
    setIsTogglingPayment(true);
    try {
      const updated = await onUpdate(player._id, {
        paymentStatus: monthlyStatus === "paid" ? "unpaid" : "paid",
        paymentMonth,
      });
      setProfileNotice(
        updated
          ? (monthlyStatus === "paid"
            ? `تم تحويل اشتراك شهر ${paymentMonth} إلى غير مدفوع`
            : `✓ تم تسجيل دفع اشتراك شهر ${paymentMonth} بنجاح`)
          : "تعذر تحديث الاشتراك. حاول مرة أخرى."
      );
    } catch (err) {
      console.error(err);
      setProfileNotice("تعذر تحديث الاشتراك. حاول مرة أخرى.");
    } finally {
      setIsTogglingPayment(false);
    }
  }

  async function handleTogglePastPayment(month, currentStatus) {
    if (updatingPaymentMonth) return;
    setUpdatingPaymentMonth(month);
    try {
      await onUpdate(player._id, {
        paymentStatus: currentStatus === "paid" ? "unpaid" : "paid",
        paymentMonth: month,
      });
    } finally {
      setUpdatingPaymentMonth(null);
    }
  }

  async function handleDeletePastPayment(month) {
    if (deletingPaymentMonth) return;
    setDeletingPaymentMonth(month);
    try {
      await onUpdate(player._id, {
        paymentStatus: "clear",
        paymentMonth: month,
      });
      setProfileNotice(`تم حذف سجل اشتراك شهر ${month}`);
    } finally {
      setDeletingPaymentMonth(null);
    }
  }

  async function handleTogglePastAttendance(date, currentStatus) {
    if (updatingAttendanceDate) return;
    setUpdatingAttendanceDate(date);
    try {
      await onUpdate(player._id, {
        attendanceStatus: currentStatus === "present" ? "absent" : "present",
        date,
      });
    } finally {
      setUpdatingAttendanceDate(null);
    }
  }

  async function handleDeletePastAttendance(date) {
    if (deletingAttendanceDate) return;
    setDeletingAttendanceDate(date);
    try {
      await onUpdate(player._id, {
        attendanceStatus: "clear",
        date,
      });
      setProfileNotice(`تم حذف سجل حضور تاريخ ${date}`);
    } finally {
      setDeletingAttendanceDate(null);
    }
  }

  function handlePhoneCallClick() {
    setIsCallingGuardian(true);
    setTimeout(() => setIsCallingGuardian(false), 2000);
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
    if (updatedPlayer) setActiveTab("overview");
    setProfileSaving(false);
  }

  async function addCustomAttendance(e) {
    e.preventDefault();
    if (isSavingAttendance) return;
    if (customAttendanceDate > today) return;
    setIsSavingAttendance(true);
    try {
      await onUpdate(player._id, {
        attendanceStatus: customAttendanceStatus,
        date: customAttendanceDate,
      });
      setProfileNotice(`✓ تم تسجيل حضور تاريخ ${customAttendanceDate}`);
    } finally {
      setIsSavingAttendance(false);
    }
  }

  async function addCustomPayment(e) {
    e.preventDefault();
    setPaymentSaving(true);
    const updatedPlayer = await onUpdate(player._id, {
      paymentStatus: customPaymentStatus,
      paymentMonth: customPaymentMonth,
    });
    setPaymentSaving(false);
    setProfileNotice(
      updatedPlayer
        ? `تم تحديث اشتراك شهر ${customPaymentMonth}`
        : "تعذر تحديث الاشتراك. حاول مرة أخرى.",
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-md sm:items-center sm:p-4 animate-fade-in-scale"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <aside className="relative flex flex-col max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-t-3xl border border-slate-700/60 bg-white shadow-2xl sm:rounded-3xl">
        {/* Glowing top line */}
        <div className="h-[3px] w-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

        {/* ─── Hero Athlete Header (Executive Dark Theme) ───────────────── */}
        <div className="relative bg-gradient-to-l from-slate-950 via-slate-900 to-slate-950 text-white p-5 sm:p-7 border-b border-slate-800">
          {/* Ambient Glow */}
          <div className="pointer-events-none absolute -top-16 right-10 h-44 w-44 rounded-full bg-red-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 left-10 h-36 w-36 rounded-full bg-amber-500/10 blur-2xl" />

          {/* Close button */}
          <button
            type="button"
            className="absolute top-4 left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/70 hover:bg-white/20 hover:text-white backdrop-blur-md transition-all cursor-pointer"
            onClick={onClose}
            title="إغلاق ملف اللاعب"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
            {/* Athlete Photo & Identity */}
            <div className="flex items-center gap-4 sm:gap-5 min-w-0">
              <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 font-cairo text-3xl font-black text-white shadow-xl ring-4 ring-white/20">
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{player.name.charAt(0)}</span>
                )}
                <span className="absolute bottom-1 right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" title="لاعب نشط" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="truncate font-cairo text-2xl sm:text-3xl font-black text-white tracking-wide">
                    {player.name}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 border border-red-500/30 px-2.5 py-0.5 text-[11px] font-black text-red-300">
                    🥋 بطل الأكاديمية
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 font-bold text-slate-200">
                    🏢 {player.branch}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/10 border border-white/10 px-2.5 py-1 font-bold text-slate-200">
                    🎂 {player.age} سنة
                  </span>
                  <span className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 font-black ${
                    attendanceRate >= 75
                      ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : "bg-amber-500/20 border-amber-500/30 text-amber-300"
                  }`}>
                    🔥 التزام {attendanceRate}%
                  </span>
                </div>
              </div>
            </div>

            {/* Guardian Contact Hub in Header */}
            <div className="w-full sm:w-auto bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 p-3 sm:min-w-[260px]">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Phone className="h-3 w-3 text-red-400" />
                  رقم ولي الأمر:
                </span>
                {guardianPhone ? (
                  <div className="flex items-center gap-1.5">
                    <span className="font-cairo text-xs font-black text-white tracking-wider" dir="ltr">
                      {guardianPhone}
                    </span>
                    <button
                      type="button"
                      onClick={copyGuardianPhone}
                      className="text-[10px] text-slate-400 hover:text-white transition cursor-pointer"
                      title="نسخ الرقم"
                    >
                      {phoneCopied ? "✓ تم" : <ClipboardCopy className="h-3 w-3" />}
                    </button>
                  </div>
                ) : (
                  <span className="text-[11px] text-slate-400 font-semibold">غير مسجل</span>
                )}
              </div>

              {guardianPhone ? (
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`tel:${guardianPhone}`}
                    onClick={handlePhoneCallClick}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 text-center"
                    title="إجراء اتصال هاتفي مباشر بولي الأمر"
                  >
                    {isCallingGuardian ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري...</span>
                      </>
                    ) : (
                      <>
                        <Phone className="h-3.5 w-3.5" />
                        <span>اتصال مباشر</span>
                      </>
                    )}
                  </a>
                  <button
                    type="button"
                    onClick={openGuardianChat}
                    disabled={isOpeningChat}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white shadow-sm transition active:scale-95 disabled:opacity-60 cursor-pointer text-center"
                    title="فتح شات واتساب مباشرة مع ولي الأمر"
                  >
                    {isOpeningChat ? (
                      <>
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>شات واتساب</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab("edit")}
                  className="w-full text-center text-xs font-extrabold text-amber-300 hover:underline py-1 cursor-pointer"
                >
                  + إضافة رقم هاتف ولي الأمر
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ─── Segmented Navigation Tabs ─────────────────────────────────── */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-4 sm:px-6 py-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "overview"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span>📊 نظرة عامة والبطاقة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "attendance"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span>🥋 الحضور والغياب</span>
              <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.5 text-[10px] font-black">
                {(player.attendance || []).length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("payments")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "payments"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <span>💳 الاشتراكات والمالية</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-black ${
                monthlyStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
              }`}>
                {monthlyStatus === "paid" ? "مدفوع ✓" : "غير مدفوع"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("edit")}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                activeTab === "edit"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Pencil className="h-3 w-3" />
              <span>تعديل البيانات</span>
            </button>
          </div>
        </div>

        {/* ─── Scrollable Body Content ─────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {/* Global Notice Toast */}
          {profileNotice && (
            <div
              className={`mb-5 flex items-center justify-between gap-2 rounded-2xl border p-3.5 text-xs font-bold shadow-sm animate-slide-up ${
                profileNotice.startsWith("تعذر") || profileNotice.startsWith("❌")
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : profileNotice.startsWith("⚠️")
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
              role="status"
            >
              <span className="leading-relaxed">{profileNotice}</span>
              <button
                type="button"
                onClick={() => setProfileNotice("")}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-sm font-bold hover:bg-current/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ═══════════ TAB 1: OVERVIEW & CARD HUB ═══════════ */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Card & Reports Showcase */}
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-red-50/20 p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-cairo text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                      <Award className="h-5 w-5 text-red-600" />
                      بطاقة وتقارير اللاعب الرسمية (COACH PRO)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      شارك بطاقة بيانات وإحصائيات البطل مع ولي الأمر بصيغة صورة عالية الدقة أو تقرير نصي
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg w-fit">
                    أبعاد 1080×1920 HD
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* زر 1: مشاركة كصورة (واتساب) */}
                  <button
                    type="button"
                    disabled={isSharingImage || isSendingText || isDownloadingCard}
                    onClick={shareProfileImageToWhatsApp}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white shadow-md shadow-emerald-600/20 hover:brightness-110 active:scale-95 disabled:opacity-60 transition cursor-pointer text-center"
                    title="مشاركة صورة بطاقة اللاعب المعتمدة لولي الأمر عبر واتساب"
                  >
                    {isSharingImage ? (
                      <>
                        <span className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white animate-spin my-2" />
                        <span className="font-cairo text-xs font-black">جاري تجهيز الصورة...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mb-1">
                          <Share2 className="h-5 w-5" />
                        </div>
                        <strong className="font-cairo text-xs font-black">مشاركة كصورة (واتساب)</strong>
                        <span className="text-[10px] text-emerald-100">إرسال البطاقة الرسمية</span>
                      </>
                    )}
                  </button>

                  {/* زر 2: إرسال تقرير نصي */}
                  <button
                    type="button"
                    disabled={isSharingImage || isSendingText || isDownloadingCard}
                    onClick={shareOnWhatsApp}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-sky-600 to-blue-700 p-4 text-white shadow-md shadow-sky-600/20 hover:brightness-110 active:scale-95 disabled:opacity-60 transition cursor-pointer text-center"
                    title="إرسال تقرير نصي مفصل بالحضور والاشتراكات لولي الأمر"
                  >
                    {isSendingText ? (
                      <>
                        <span className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white animate-spin my-2" />
                        <span className="font-cairo text-xs font-black">جاري فتح واتساب...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mb-1">
                          <Send className="h-5 w-5" />
                        </div>
                        <strong className="font-cairo text-xs font-black">إرسال تقرير نصي</strong>
                        <span className="text-[10px] text-sky-100">ملخص الحضور والاشتراكات</span>
                      </>
                    )}
                  </button>

                  {/* زر 3: حفظ كصورة بجهازك */}
                  <button
                    type="button"
                    disabled={isSharingImage || isSendingText || isDownloadingCard}
                    onClick={downloadProfileCard}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-4 text-white shadow-md shadow-indigo-600/20 hover:brightness-110 active:scale-95 disabled:opacity-60 transition cursor-pointer text-center"
                    title="تحميل بطاقة اللاعب كصورة PNG مباشرة على جهازك"
                  >
                    {isDownloadingCard ? (
                      <>
                        <span className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white animate-spin my-2" />
                        <span className="font-cairo text-xs font-black">جاري التحميل...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 mb-1">
                          <Download className="h-5 w-5" />
                        </div>
                        <strong className="font-cairo text-xs font-black">حفظ كصورة بجهازك</strong>
                        <span className="text-[10px] text-indigo-100">تنزيل ملف PNG فوري</span>
                      </>
                    )}
                  </button>

                  {/* زر 4: معاينة البطاقة الرسمية */}
                  <button
                    type="button"
                    disabled={isPreviewingCard}
                    onClick={openImageModal}
                    className="flex flex-col items-center justify-center gap-1.5 rounded-2xl bg-slate-900 hover:bg-slate-800 p-4 text-white shadow-md shadow-slate-900/10 active:scale-95 disabled:opacity-60 transition cursor-pointer text-center"
                    title="معاينة شكل البطاقة بالحجم الكامل قبل الإرسال"
                  >
                    {isPreviewingCard ? (
                      <>
                        <span className="h-6 w-6 rounded-full border-2 border-white/40 border-t-white animate-spin my-2" />
                        <span className="font-cairo text-xs font-black">جاري التجهيز...</span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 mb-1">
                          <Eye className="h-5 w-5 text-slate-300" />
                        </div>
                        <strong className="font-cairo text-xs font-black">معاينة البطاقة</strong>
                        <span className="text-[10px] text-slate-400">عرض الحجم الكامل</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* 3 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* KPI 1: نسبة الالتزام */}
                <div className="rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800">نسبة الالتزام بالحضور</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                      <TrendingUp className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <strong className="block font-cairo text-3xl font-black text-emerald-700">
                    {attendanceRate}%
                  </strong>
                  <div className="mt-3 w-full bg-emerald-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(attendanceRate, 100)}%` }}
                    />
                  </div>
                  <span className="mt-2 block text-[11px] font-semibold text-emerald-800/80">
                    حضر {attended} من أصل {totalAttendanceCount} حصة مسجلة
                  </span>
                </div>

                {/* KPI 2: اشتراك الشهر الحالي */}
                <div
                  className={`rounded-3xl border p-5 shadow-xs ${
                    monthlyStatus === "paid"
                      ? "border-emerald-200/70 bg-gradient-to-br from-emerald-50/60 to-white"
                      : "border-rose-200/70 bg-gradient-to-br from-rose-50/60 to-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">اشتراك شهر {paymentMonth}</span>
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-xl ${
                        monthlyStatus === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <strong
                    className={`block font-cairo text-2xl font-black ${
                      monthlyStatus === "paid" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {monthlyStatus === "paid" ? "✓ تم السداد" : "لم يُسدد بعد"}
                  </strong>
                  <button
                    type="button"
                    disabled={isTogglingPayment}
                    onClick={handleToggleMonthlyPayment}
                    className={`mt-3 w-full rounded-xl px-3 py-2 text-xs font-black transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-xs ${
                      monthlyStatus === "paid"
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "bg-rose-600 hover:bg-rose-700 text-white"
                    }`}
                  >
                    {isTogglingPayment ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري التحديث...</span>
                      </span>
                    ) : monthlyStatus === "paid" ? (
                      "تبديل إلى غير مدفوع"
                    ) : (
                      "تسجيل دفع الاشتراك الآن"
                    )}
                  </button>
                </div>

                {/* KPI 3: بيانات الفرع والتسجيل */}
                <div className="rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-50 to-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">بيانات القيد</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Calendar className="h-3.5 w-3.5" />
                    </span>
                  </div>
                  <strong className="block font-cairo text-xl font-black text-slate-900 truncate">
                    {player.branch}
                  </strong>
                  <p className="text-xs font-bold text-slate-500 mt-1">
                    السن الحالي: <span className="text-slate-900">{player.age} سنة</span>
                  </p>
                  <span className="mt-3 block text-[11px] font-semibold text-slate-400">
                    تاريخ التسجيل: {registrationDate}
                  </span>
                </div>
              </div>

              {/* Birthday Celebration Alert */}
              {birthdayInfo?.isToday && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-rose-300 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-4 sm:p-5 shadow-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl animate-bounce">🎂</span>
                    <div>
                      <strong className="block font-cairo text-sm sm:text-base font-black text-rose-900">
                        اليوم عيد ميلاد {player.name}! 🎉
                      </strong>
                      <span className="block text-xs font-bold text-slate-600 mt-0.5">
                        أتم اليوم {birthdayInfo.turningAge} سنة بارك الله فيه! 🥋
                      </span>
                    </div>
                  </div>
                  <a
                    href={generateBirthdayWishUrl(player, captainName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 transition-all text-center"
                    title="إرسال تهنئة عبر واتساب لولي الأمر"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>إرسال تهنئة واتساب 📲</span>
                  </a>
                </div>
              )}

              {!birthdayInfo?.isToday && birthdayInfo?.isUpcoming && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🎂</span>
                    <span className="font-bold text-amber-900">
                      عيد ميلاده القادم {birthdayInfo.daysLeft === 1 ? "غداً" : `بعد ${birthdayInfo.daysLeft} أيام`} (يوافق {birthdayInfo.dateFormatted}) — سيُتم {birthdayInfo.turningAge} سنة!
                    </span>
                  </div>
                  <a
                    href={generateBirthdayWishUrl(player, captainName)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 font-black text-white hover:bg-emerald-700"
                  >
                    تهنئة واتساب 📲
                  </a>
                </div>
              )}
            </div>
          )}

          {/* ═══════════ TAB 2: ATTENDANCE TRACKING ═══════════ */}
          {activeTab === "attendance" && (
            <div className="space-y-5">
              {/* Attendance Quick Add Box */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <h3 className="font-cairo text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-emerald-600" />
                  تسجيل حصة حضور جديدة
                </h3>
                <form
                  onSubmit={addCustomAttendance}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    type="date"
                    max={today}
                    value={customAttendanceDate}
                    onChange={(e) => setCustomAttendanceDate(e.target.value)}
                    className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-red-500"
                    required
                  />
                  <select
                    value={customAttendanceStatus}
                    onChange={(e) => setCustomAttendanceStatus(e.target.value)}
                    className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-red-500"
                  >
                    <option value="present">حاضر ✓</option>
                    <option value="absent">غائب ×</option>
                  </select>
                  <button
                    className="min-h-10 rounded-xl bg-slate-900 px-5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 transition cursor-pointer"
                    type="submit"
                    disabled={isSavingAttendance}
                  >
                    {isSavingAttendance ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري الإضافة...</span>
                      </span>
                    ) : (
                      "إضافة الحصة"
                    )}
                  </button>
                </form>
              </div>

              {/* Attendance Records List */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <span className="font-cairo text-sm font-black text-slate-900">
                    سجل الحصص السابقة ({(player.attendance || []).length} حصة)
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    حضور: {attended} حصة
                  </span>
                </div>

                {!player.attendance || player.attendance.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا توجد حصص حضور مسجلة بعد.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...player.attendance].reverse().map((item) => (
                      <div
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                        key={item.date}
                      >
                        <div className="flex items-center gap-2.5">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-slate-800">{item.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer ${
                              item.status === "present"
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-rose-600 text-white hover:bg-rose-700"
                            }`}
                            onClick={() => handleTogglePastAttendance(item.date, item.status)}
                            title="انقر لتبديل الحالة"
                          >
                            {updatingAttendanceDate === item.date ? (
                              <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            ) : item.status === "present" ? (
                              <><Check className="h-3 w-3" strokeWidth={2.5} /> حاضر</>
                            ) : (
                              <><X className="h-3 w-3" strokeWidth={2.5} /> غائب</>
                            )}
                          </button>
                          <button
                            disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-60 cursor-pointer"
                            onClick={() => handleDeletePastAttendance(item.date)}
                            title="حذف الحصة من السجل"
                          >
                            {deletingAttendanceDate === item.date ? (
                              <span className="h-3 w-3 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 3: PAYMENTS LEDGER ═══════════ */}
          {activeTab === "payments" && (
            <div className="space-y-5">
              {/* Payment Quick Add Box */}
              <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <h3 className="font-cairo text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-sky-600" />
                  تسجيل اشتراك لشهر محدد
                </h3>
                <form
                  onSubmit={addCustomPayment}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    type="month"
                    value={customPaymentMonth}
                    onChange={(e) => setCustomPaymentMonth(e.target.value)}
                    className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-red-500"
                    required
                  />
                  <select
                    value={customPaymentStatus}
                    onChange={(e) => setCustomPaymentStatus(e.target.value)}
                    className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-red-500"
                  >
                    <option value="paid">مدفوع ✓</option>
                    <option value="unpaid">لم يدفع ⚠️</option>
                  </select>
                  <button
                    className="min-h-10 rounded-xl bg-slate-900 px-5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 transition cursor-pointer"
                    type="submit"
                    disabled={paymentSaving}
                  >
                    {paymentSaving ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري الحفظ...</span>
                      </span>
                    ) : (
                      "تسجيل الاشتراك"
                    )}
                  </button>
                </form>
              </div>

              {/* Payments History List */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                  <span className="font-cairo text-sm font-black text-slate-900">
                    كشف حساب الشهور السابقة ({(player.paymentHistory || []).length} شهر)
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    شهر {paymentMonth}: {monthlyStatus === "paid" ? "مدفوع ✓" : "لم يدفع ⚠️"}
                  </span>
                </div>

                {!player.paymentHistory || player.paymentHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">لا توجد اشتراكات مسجلة بعد.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {[...player.paymentHistory].reverse().map((item) => (
                      <div
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs"
                        key={item.month}
                      >
                        <div className="flex items-center gap-2.5">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span className="font-bold text-slate-800">شهر {item.month}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={Boolean(updatingPaymentMonth || deletingPaymentMonth)}
                            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-60 cursor-pointer ${
                              item.status === "paid"
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                            }`}
                            onClick={() => handleTogglePastPayment(item.month, item.status)}
                            title="انقر لتبديل الحالة"
                          >
                            {updatingPaymentMonth === item.month ? (
                              <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                            ) : item.status === "paid" ? (
                              <><Check className="h-3 w-3" strokeWidth={2.5} /> مدفوع</>
                            ) : (
                              <><X className="h-3 w-3" strokeWidth={2.5} /> لم يدفع</>
                            )}
                          </button>
                          <button
                            disabled={Boolean(updatingPaymentMonth || deletingPaymentMonth)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors disabled:opacity-60 cursor-pointer"
                            onClick={() => handleDeletePastPayment(item.month)}
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
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════════ TAB 4: EDIT ATHLETE PROFILE ═══════════ */}
          {activeTab === "edit" && (
            <form onSubmit={saveInfo} className="w-full space-y-4 max-w-2xl mx-auto">
              <div className="mb-4 border-b border-slate-100 pb-3">
                <h3 className="font-cairo text-base font-black text-slate-900">تعديل بيانات اللاعب</h3>
                <p className="text-xs text-slate-400 mt-0.5">قم بتحديث معلومات اللاعب ثم اضغط حفظ التعديلات</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">اسم اللاعب</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    تاريخ الميلاد (يوم / شهر / سنة)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-center text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                  {calculatedEditAge !== null && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2 py-0.5 animate-slide-up">
                      <span>✓</span>
                      <span>العمر المحسوب تلقائيًا: {calculatedEditAge} سنة</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    الفرع / الصالة
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                  رقم هاتف ولي الأمر
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  type="tel"
                  inputMode="tel"
                  value={editGuardianPhone}
                  onChange={(e) => setEditGuardianPhone(e.target.value)}
                  placeholder="01xxxxxxxxx"
                />
              </div>

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
                  {editPhoto && (
                    <div className="flex items-center gap-2">
                      <img
                        src={editPhoto}
                        alt="Preview"
                        className="h-10 w-10 rounded-xl object-cover ring-2 ring-red-300"
                      />
                      <button
                        type="button"
                        onClick={() => setEditPhoto("")}
                        className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-6 grid gap-2.5 sm:grid-cols-2 pt-2">
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
                  ) : (
                    "✓ حفظ التعديلات"
                  )}
                </button>
                <button
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                  type="button"
                  onClick={() => setActiveTab("overview")}
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {/* Permanent Delete Action Zone */}
          <div className="mt-8 pt-4 border-t border-slate-100">
            <button
              type="button"
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200/80 bg-rose-50/50 px-4 py-3 text-xs font-extrabold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300 active:scale-98 cursor-pointer"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 text-rose-600" />
              <span>حذف اللاعب نهائيًا من الأكاديمية</span>
            </button>
          </div>
        </div>
      </aside>

      {/* مودال تأكيد حذف اللاعب */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="حذف اللاعب نهائيًا"
        message={`هل أنت متأكد من رغبتك في حذف اللاعب "${player.name}" نهائيًا من الأكاديمية؟ سيتم مسح كافة سجلات الحضور والاشتراكات المتعلقة به.`}
        confirmText="نعم، احذف اللاعب"
        cancelText="تراجع"
        confirmVariant="danger"
        isBusy={isDeletingPlayer}
        onConfirm={async () => {
          setIsDeletingPlayer(true);
          try {
            await onDelete(player._id);
          } finally {
            setIsDeletingPlayer(false);
            setShowDeleteConfirm(false);
          }
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* نافذة معاينة وإرسال صورة البطاقة الرسمية */}
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
            <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xs">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-cairo text-base font-black text-slate-900">
                  بطاقة اللاعب الرسمية: {player.name}
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

            {/* Preview Image */}
            <div className="mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-inner flex justify-center p-2">
              <img
                src={modalImageDataUrl}
                alt={`بطاقة ${player.name}`}
                className="max-h-72 sm:max-h-80 w-auto rounded-xl shadow-md object-contain"
              />
            </div>

            {/* Quick action buttons in modal */}
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={isSharingImage}
                onClick={shareProfileImageToWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white shadow-xs hover:bg-emerald-700 active:scale-95 transition disabled:opacity-60 disabled:cursor-not-allowed sm:col-span-2 text-center cursor-pointer"
              >
                {isSharingImage ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
                    <span>جاري فتح الشات في واتساب...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" />
                    <span>مشاركة البطاقة عبر واتساب لولي الأمر</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={imageCopied}
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
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-80 active:scale-95 cursor-pointer"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
                <span>{imageCopied ? "✓ تم نسخ الصورة!" : "نسخ للحافظة"}</span>
              </button>

              <button
                type="button"
                disabled={isDownloadingCard}
                onClick={downloadProfileCard}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-black text-indigo-800 hover:bg-indigo-100 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95 cursor-pointer"
              >
                {isDownloadingCard ? (
                  <>
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-indigo-600/40 border-t-indigo-600 animate-spin inline-block" />
                    <span>جاري التحميل...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-3.5 w-3.5" />
                    <span>تحميل للجهاز</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
