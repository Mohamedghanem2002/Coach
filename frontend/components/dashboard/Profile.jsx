import { useEffect, useState, useMemo, useRef } from "react";
import ConfirmDialog from "./ConfirmDialog";
import { useSession } from "next-auth/react";
import {
  localDate,
  paymentStatusFor,
  getPaymentDetailsFor,
  getBirthdayInfo,
  toEnglishDigits,
  BELTS,
  LEVELS,
  getBeltStyle,
  isBirthdayCongratulated,
} from "../../lib/dashboard-utils";
import QuickPaymentModal from "./QuickPaymentModal";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";
import {
  Send,
  Download,
  MessageCircle,
  Pencil,
  Trash2,
  Phone,
  CreditCard,
  Calendar,
  Check,
  X,
  BookUser,
  Compass,
} from "lucide-react";

export default function Profile({
  player,
  branches,
  paymentMonth,
  onClose,
  onUpdate,
  onDelete,
  events = [],
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

  const playerEvents = useMemo(() => {
    return (events || []).filter((ev) =>
      (ev.participants || []).some((p) => p.playerId?.toString() === player._id?.toString()),
    ).map((ev) => {
      const part = (ev.participants || []).find((p) => p.playerId?.toString() === player._id?.toString());
      return {
        _id: ev._id,
        title: ev.title,
        type: ev.type,
        date: ev.date,
        location: ev.location,
        fee: part?.totalAmount ?? ev.fee ?? 100,
        paid: part?.paidAmount ?? 0,
        remaining: part?.remainingAmount ?? Math.max(0, (part?.totalAmount ?? ev.fee ?? 100) - (part?.paidAmount ?? 0)),
        paymentStatus: part?.paymentStatus || "unpaid",
        attended: part?.attended,
      };
    });
  }, [events, player._id]);

  const [isEditing, setIsEditing] = useState(false);
  const [mobileProfileTab, setMobileProfileTab] = useState("overview"); // "overview" | "attendance" | "payments" | "events"

  // Edit form state
  const [editName, setEditName] = useState(player.name);
  const _dob = (player.dateOfBirth || "").split("-");
  const [editDobYear, setEditDobYear] = useState(_dob[0] || "");
  const [editDobMonth, setEditDobMonth] = useState(_dob[1] || "");
  const [editDobDay, setEditDobDay] = useState(_dob[2] || "");
  const editDateOfBirth =
    editDobYear && editDobMonth && editDobDay
      ? `${editDobYear}-${editDobMonth.padStart(2, "0")}-${editDobDay.padStart(2, "0")}`
      : "";
  const [editGuardianPhone, setEditGuardianPhone] = useState(guardianPhone);
  const [editBranch, setEditBranch] = useState(player.branch);
  const [editBelt, setEditBelt] = useState(player.belt || "أبيض");
  const [editLevel, setEditLevel] = useState(player.level || "A");
  const [editContactNotice, setEditContactNotice] = useState("");
  const [editPhoto, setEditPhoto] = useState(player.photo || "");

  async function handleEditPickContact() {
    if (typeof window !== "undefined" && "contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["tel"];
        const contacts = await navigator.contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0 && contacts[0]?.tel && contacts[0].tel.length > 0) {
          const raw = contacts[0].tel[0];
          setEditGuardianPhone(toEnglishDigits(raw).replace(/[^0-9]/g, ""));
          setEditContactNotice("✓ تم اختيار الرقم بنجاح من جهات الاتصال");
          setTimeout(() => setEditContactNotice(""), 3500);
        }
      } catch (err) {
        console.log("Contact picker cancelled:", err);
      }
    } else {
      setEditContactNotice("💡 خاصية استيراد جهات الاتصال تعمل مباشرة من المتصفح على الهواتف الذكية (مثل Chrome على Android). يمكنك كتابة الرقم يدوياً الآن.");
      setTimeout(() => setEditContactNotice(""), 5000);
    }
  }

  const editMonthInputRef = useRef(null);
  const editYearInputRef = useRef(null);

  function handleEditDayChange(val) {
    const normalized = toEnglishDigits(val);
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setEditDobDay(d.replace(/\D/g, "").slice(0, 2));
      setEditDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setEditDobYear(y.replace(/\D/g, "").slice(0, 4));
      return;
    }
    const cleaned = normalized.replace(/\D/g, "").slice(0, 2);
    setEditDobDay(cleaned);
    if (cleaned.length === 2) {
      editMonthInputRef.current?.focus();
    }
  }

  function handleEditMonthChange(val) {
    const normalized = toEnglishDigits(val);
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setEditDobDay(d.replace(/\D/g, "").slice(0, 2));
      setEditDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setEditDobYear(y.replace(/\D/g, "").slice(0, 4));
      return;
    }
    const cleaned = normalized.replace(/\D/g, "").slice(0, 2);
    setEditDobMonth(cleaned);
    if (cleaned.length === 2) {
      editYearInputRef.current?.focus();
    }
  }

  function handleEditYearChange(val) {
    const normalized = toEnglishDigits(val);
    const parts = normalized.split(/[-/.]/);
    if (parts.length === 3) {
      let d, m, y;
      if (parts[0].length === 4) {
        [y, m, d] = parts;
      } else {
        [d, m, y] = parts;
      }
      setEditDobDay(d.replace(/\D/g, "").slice(0, 2));
      setEditDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setEditDobYear(y.replace(/\D/g, "").slice(0, 4));
      return;
    }
    const cleaned = normalized.replace(/\D/g, "").slice(0, 4);
    setEditDobYear(cleaned);
  }

  function handleEditDatePaste(e) {
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
      setEditDobDay(d.replace(/\D/g, "").slice(0, 2));
      setEditDobMonth(m.replace(/\D/g, "").slice(0, 2));
      setEditDobYear(y.replace(/\D/g, "").slice(0, 4));
    }
  }

  // Custom Attendance & Payment
  const today = localDate();
  const [customAttendanceDate, setCustomAttendanceDate] = useState(today);
  const [customAttendanceStatus, setCustomAttendanceStatus] = useState("present");
  const [customPaymentMonth, setCustomPaymentMonth] = useState(today.slice(0, 7));
  const [customTotalAmount, setCustomTotalAmount] = useState("100");
  const [customPaidAmount, setCustomPaidAmount] = useState("100");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetPaymentMonth, setTargetPaymentMonth] = useState(paymentMonth);
  const [targetPaymentDetails, setTargetPaymentDetails] = useState(null);

  // Status & loading indicators
  const [profileNotice, setProfileNotice] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Card caching and sending
  const [cachedCardBlob, setCachedCardBlob] = useState(null);
  const [isSendingCard, setIsSendingCard] = useState(false);

  // Confirm delete player
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingPlayer, setIsDeletingPlayer] = useState(false);

  // Action loading states (double-click prevention)
  const [isSendingText, setIsSendingText] = useState(false);
  const [isDownloadingCard, setIsDownloadingCard] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isCallingGuardian, setIsCallingGuardian] = useState(false);
  const [isTogglingPayment, setIsTogglingPayment] = useState(false);
  const [isSendingBirthdayCard, setIsSendingBirthdayCard] = useState(false);
  const [birthdayCongratulated, setBirthdayCongratulated] = useState(false);

  useEffect(() => {
    const handleCongratulated = (e) => {
      if (!e.detail?.playerId || e.detail?.playerId === player?._id) {
        setBirthdayCongratulated(true);
      }
    };
    window.addEventListener("birthday_congratulated", handleCongratulated);
    return () =>
      window.removeEventListener("birthday_congratulated", handleCongratulated);
  }, [player?._id]);

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
  const paymentDetails = getPaymentDetailsFor(player, paymentMonth);
  const monthlyStatus = paymentDetails.status;
  const { totalAmount, paidAmount, remainingAmount } = paymentDetails;
  const paymentRate = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
  const birthdayInfo = getBirthdayInfo(player);
  const registrationDate = new Date(player.createdAt).toLocaleDateString("ar-EG");

  useEffect(() => {
    if (!profileNotice) return undefined;
    const timer = setTimeout(() => setProfileNotice(""), 4000);
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
    let cleaned = toEnglishDigits(String(phone)).replace(/[^0-9]/g, "");
    if (cleaned.startsWith("00")) cleaned = cleaned.slice(2);
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
      : text
      ? `whatsapp://send?text=${encodeURIComponent(text)}`
      : `whatsapp://send`;

    if (isMobile) {
      window.location.href = appUrl;
    } else {
      window.location.href = appUrl;
      setTimeout(() => {
        if (document.hasFocus()) {
          const webUrl = cleanPhone
            ? `https://web.whatsapp.com/send?phone=${cleanPhone}${text ? `&text=${encodeURIComponent(text)}` : ""}`
            : text
            ? `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`
            : `https://web.whatsapp.com/`;
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
    setProfileNotice(`✓ جاري فتح محادثة واتساب لولي الأمر (${guardianPhone})`);
    openWhatsAppNative(cleanPhone);
    setTimeout(() => setIsOpeningChat(false), 2000);
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
        .map((item) => {
          const total = item.totalAmount ?? 100;
          const paid = item.paidAmount !== undefined ? item.paidAmount : (item.status === "paid" ? total : 0);
          const rem = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, total - paid);
          if (paid >= total && total > 0) return `• ${item.month}: مدفوع بالكامل (${paid} ج.م) ✓`;
          if (paid > 0) return `• ${item.month}: تم دفع ${paid} ج.م (المتبقي ${rem} ج.م) ⚠️`;
          return `• ${item.month}: لم يدفع (المتبقي ${rem} ج.م) ⚠️`;
        })
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
      `💳 اشتراك شهر ${paymentMonth}: ${
        monthlyStatus === "paid"
          ? `مدفوع بالكامل (${paidAmount} ج.م) ✓`
          : monthlyStatus === "partially_paid"
          ? `تم دفع ${paidAmount} ج.م (المتبقي ${remainingAmount} ج.م) ⚠️`
          : `غير مدفوع (المتبقي ${remainingAmount || totalAmount} ج.م) ⚠️`
      }`,
      "",
      "📋 سجل الحضور والغياب:",
      attendanceText,
      "",
      "💰 سجل الاشتراكات السابقة:",
      paymentText,
    ].join("\n");

    openWhatsAppNative(cleanPhone, message);
    setProfileNotice("✓ جاري فتح تطبيق واتساب وإرسال التقرير النصي");
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
      ? paymentHistory.map((item) => {
          const total = item.totalAmount ?? 100;
          const paid = item.paidAmount !== undefined ? item.paidAmount : (item.status === "paid" ? total : 0);
          const rem = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, total - paid);
          if (paid >= total && total > 0) return `${item.month}     مدفوع بالكامل (${paid} ج.م) ✓`;
          if (paid > 0) return `${item.month}     دفع ${paid} ج.م (باقي ${rem} ج.م) ⚠️`;
          return `${item.month}     لم يدفع (باقي ${rem} ج.م) ⚠️`;
        })
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
    drawCenter("Re_action PRO", 152, 106, "900 22px Cairo, sans-serif", "#ffffff");

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
    drawRight(player.name, 940, 330, "900 44px Cairo, sans-serif", "#0f172a");
    drawRight(`🥋 الحزام: ${player.belt || "أبيض"}  •  المستوى: ${player.level || "A"}`, 940, 380, "800 27px Cairo, sans-serif", "#b91c1c");
    drawRight(`🏢 الصالة: ${player.branch}`, 940, 426, "700 26px Cairo, sans-serif", "#334155");
    drawRight(`🎂 السن: ${player.age} سنة`, 940, 470, "700 26px Cairo, sans-serif", "#334155");
    if (guardianPhone) {
      drawRight(`📞 ولي الأمر: ${guardianPhone}`, 940, 514, "700 25px Cairo, sans-serif", "#047857");
    }
    drawRight(`📅 تاريخ التسجيل: ${registrationDate}`, 940, 555, "600 22px Cairo, sans-serif", "#94a3b8");

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
    drawCenter(
      String((player.attendance || []).length),
      72 + statBoxWidth + 18 + statBoxWidth / 2,
      675,
      "900 52px Cairo, sans-serif",
      "#1e293b",
    );
    drawCenter(
      "حصة مسجلة",
      72 + statBoxWidth + 18 + statBoxWidth / 2,
      725,
      "700 24px Cairo, sans-serif",
      "#475569",
    );

    // Box 3: Monthly Payment
    const isPaid = monthlyStatus === "paid";
    context.fillStyle = isPaid ? "#ecfdf5" : "#fff1f2";
    context.beginPath();
    context.roundRect(72 + (statBoxWidth + 18) * 2, 605, statBoxWidth, 145, 20);
    context.fill();
    context.strokeStyle = isPaid ? "#a7f3d0" : "#fecdd3";
    context.lineWidth = 2;
    context.stroke();
    drawCenter(
      isPaid ? "مدفوع ✓" : "لم يدفع ⚠️",
      72 + (statBoxWidth + 18) * 2 + statBoxWidth / 2,
      675,
      "900 38px Cairo, sans-serif",
      isPaid ? "#047857" : "#be123c",
    );
    drawCenter(
      `شهر ${paymentMonth}`,
      72 + (statBoxWidth + 18) * 2 + statBoxWidth / 2,
      725,
      "700 22px Cairo, sans-serif",
      isPaid ? "#065f46" : "#9f1239",
    );

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
      const isP = line.includes("مدفوع بالكامل");
      const isPartial = line.includes("دفع ");
      context.fillStyle = isP ? "#f0fdf4" : isPartial ? "#fffbeb" : "#fef2f2";
      context.beginPath();
      context.roundRect(72, y - 36, canvas.width - 144, 52, 14);
      context.fill();
      context.strokeStyle = isP ? "#bbf7d0" : isPartial ? "#fde68a" : "#fecaca";
      context.lineWidth = 1.5;
      context.stroke();

      drawRight(
        line,
        930,
        y + 2,
        "700 26px Cairo, sans-serif",
        isP ? "#15803d" : isPartial ? "#b45309" : "#b91c1c",
      );
      y += 68;
    }

    // Footer
    context.fillStyle = "#e2e8f0";
    context.fillRect(72, canvas.height - 120, canvas.width - 144, 2);

    drawRight(
      `تم استخراج البطاقة رسميًا من نظام Re_action PRO  •  ${new Date().toLocaleDateString("ar-EG")}`,
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

  async function handleSendCardDirectly() {
    if (isSendingCard || isDownloadingCard || isSendingText) return;

    setIsSendingCard(true);
    setProfileNotice("⏳ جاري تجهيز ونسخ صورة البطاقة تلقائياً...");

    try {
      let blob = cachedCardBlob;
      if (!blob) {
        const canvas = await generateProfileCanvas();
        if (!canvas) {
          setProfileNotice("❌ تعذر إنشاء صورة البطاقة");
          setIsSendingCard(false);
          return;
        }
        blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );
        if (blob) setCachedCardBlob(blob);
      }

      if (!blob) {
        setProfileNotice("❌ تعذر إنشاء صورة البطاقة");
        setIsSendingCard(false);
        return;
      }

      const cleanPhone = guardianPhone ? formatWhatsAppPhone(guardianPhone) : "";

      const isMobile =
        typeof navigator !== "undefined" &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent,
        );

      // Native Web Share API attaches the image file directly into WhatsApp so the user just taps Send without pasting!
      if (typeof navigator !== "undefined" && navigator.canShare) {
        try {
          const file = new File(
            [blob],
            `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`,
            { type: "image/png" },
          );
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: `بطاقة اللاعب ${player.name}`,
              text: cleanPhone ? `بطاقة اللاعب: ${player.name} (${guardianPhone})` : `بطاقة اللاعب: ${player.name}`,
            });
            setProfileNotice("✓ تم فتح المشاركة وجاهزة للإرسال مباشرة في واتساب!");
            return;
          }
        } catch (shareErr) {
          if (shareErr.name === "AbortError") {
            return;
          }
          console.warn("Share fallback:", shareErr);
        }
      }

      // Copy image directly to clipboard
      let copySuccess = false;
      if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          copySuccess = true;
        } catch (clipErr) {
          console.warn("Clipboard write failed:", clipErr);
        }
      }

      // Open WhatsApp (either guardian chat directly, or contact chooser if no number)
      openWhatsAppNative(cleanPhone);

      if (cleanPhone) {
        setProfileNotice(
          copySuccess
            ? "✓ تم نسخ صورة البطاقة تلقائياً وفتح شات ولي الأمر! الصق الصورة (Ctrl+V أو لصق) ثم اضغط إرسال."
            : "جاري فتح محادثة ولي الأمر على واتساب...",
        );
      } else {
        setProfileNotice(
          copySuccess
            ? "✓ تم نسخ صورة البطاقة تلقائياً وفتح واتساب! اختر محادثة ولي الأمر ثم الصق الصورة واضغط إرسال."
            : "جاري فتح واتساب لاختيار محادثة ولي الأمر...",
        );
      }
    } catch (err) {
      console.error("Failed to send card to guardian:", err);
      setProfileNotice("❌ حدث خطأ أثناء تجهيز أو إرسال البطاقة");
    } finally {
      setTimeout(() => setIsSendingCard(false), 2000);
    }
  }

  async function handleToggleMonthlyPayment() {
    if (isTogglingPayment) return;
    setIsTogglingPayment(true);
    try {
      const isPaid = monthlyStatus === "paid";
      const newPaid = isPaid ? 0 : totalAmount;
      const updated = await onUpdate(player._id, {
        paymentStatus: isPaid ? "unpaid" : "paid",
        paidAmount: newPaid,
        totalAmount,
        paymentMonth,
      });
      setProfileNotice(
        updated
          ? (isPaid
            ? `تم تحويل اشتراك شهر ${paymentMonth} إلى غير مدفوع`
            : `✓ تم تسجيل دفع كامل اشتراك شهر ${paymentMonth} (${totalAmount} ج.م) بنجاح`)
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
      guardianPhone: toEnglishDigits(editGuardianPhone).trim(),
      age: String(player.age),
      branch: editBranch,
      belt: editBelt,
      level: editLevel,
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
    const total = Math.max(0, Number(toEnglishDigits(customTotalAmount)) || 0);
    const paid = Math.max(0, Number(toEnglishDigits(customPaidAmount)) || 0);
    const rem = Math.max(0, total - paid);
    const status = paid >= total && total > 0 ? "paid" : paid > 0 ? "partially_paid" : "unpaid";
    const updatedPlayer = await onUpdate(player._id, {
      paymentStatus: status,
      totalAmount: total,
      paidAmount: paid,
      remainingAmount: rem,
      paymentMonth: customPaymentMonth,
    });
    setPaymentSaving(false);
    setProfileNotice(
      updatedPlayer
        ? `✓ تم تسجيل اشتراك شهر ${customPaymentMonth} (دفع ${paid} ج.م • متبقي ${rem} ج.م)`
        : "تعذر تحديث الاشتراك. حاول مرة أخرى.",
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 animate-fade-in-scale overflow-x-hidden max-w-full"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <aside className="relative max-h-[92vh] sm:max-h-[88vh] w-full max-w-full sm:max-w-2xl overflow-x-hidden overflow-y-auto rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl sm:rounded-3xl animate-bottom-sheet sm:animate-none pb-safe">
        {/* مؤشر سحب لطيف على شاشات الموبايل */}
        <div className="sheet-drag-handle sm:hidden" />

        {/* شريط أحمر جمالي أعلى المودال يتناغم مع لوحة التحكم */}
        <div className="sticky top-0 z-30 h-1 w-full bg-gradient-to-r from-red-600 via-rose-500 to-red-700 mt-1 sm:mt-0" />

        <div className="p-3.5 sm:p-6 pb-6">
          {/* رسالة التنبيه الإشعارية السريعة */}
          {profileNotice && (
            <div
              className={`mb-3 sm:mb-4 flex items-center justify-between gap-2 rounded-xl border p-2.5 sm:p-3 text-xs font-bold shadow-xs animate-slide-up ${
                profileNotice.startsWith("تعذر") || profileNotice.startsWith("❌")
                  ? "border-rose-200 bg-rose-50 text-rose-800"
                  : profileNotice.startsWith("⚠️")
                  ? "border-amber-200 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-800"
              }`}
              role="status"
            >
              <span>{profileNotice}</span>
              <button
                type="button"
                onClick={() => setProfileNotice("")}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-current/10 text-xs font-bold hover:bg-current/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ترويسة ملف اللاعب وزر الإغلاق */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <span className="section-eyebrow">ملف اللاعب</span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
              onClick={onClose}
              title="إغلاق"
            >
              ✕
            </button>
          </div>

          {/* ════════════ وضع تعديل البيانات ════════════ */}
          {isEditing ? (
            <form onSubmit={saveInfo} className="w-full space-y-3.5 sm:space-y-4">
              <div className="mb-3 border-b border-slate-100 pb-2.5">
                <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900">تعديل بيانات اللاعب</h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">قم بتحديث معلومات اللاعب ثم اضغط حفظ التعديلات</p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم اللاعب</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2 sm:px-2 sm:py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                      type="text"
                      inputMode="numeric"
                      placeholder="اليوم"
                      maxLength={2}
                      value={editDobDay}
                      onChange={(e) => handleEditDayChange(e.target.value)}
                      onPaste={handleEditDatePaste}
                      required={!player.dateOfBirth}
                    />
                    <input
                      ref={editMonthInputRef}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2 sm:px-2 sm:py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                      type="text"
                      inputMode="numeric"
                      placeholder="الشهر"
                      maxLength={2}
                      value={editDobMonth}
                      onChange={(e) => handleEditMonthChange(e.target.value)}
                      onPaste={handleEditDatePaste}
                      required={!player.dateOfBirth}
                    />
                    <input
                      ref={editYearInputRef}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2 sm:px-2 sm:py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                      type="text"
                      inputMode="numeric"
                      placeholder="السنة"
                      maxLength={4}
                      value={editDobYear}
                      onChange={(e) => handleEditYearChange(e.target.value)}
                      onPaste={handleEditDatePaste}
                      required={!player.dateOfBirth}
                    />
                  </div>
                  {calculatedEditAge !== null && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2 py-0.5">
                      <span>✓</span>
                      <span>العمر المحسوب: {calculatedEditAge} سنة</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    الفرع / الصالة
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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

              {/* الحزام والمستوى */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    حزام الكاراتيه
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 cursor-pointer"
                    value={editBelt}
                    onChange={(e) => setEditBelt(e.target.value)}
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
                    المستوى (Level)
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setEditLevel(lvl)}
                        className={`rounded-xl py-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                          editLevel === lvl
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

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-extrabold text-slate-700">
                    رقم ولي الأمر
                  </label>
                  <button
                    type="button"
                    onClick={handleEditPickContact}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60 transition active:scale-95 cursor-pointer"
                    title="اختيار رقم ولي الأمر مباشرة من سجل الأسماء بالهاتف"
                  >
                    <BookUser className="h-3.5 w-3.5 text-red-600" />
                    <span>جهات الاتصال 📱</span>
                  </button>
                </div>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 sm:px-3.5 sm:py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  type="tel"
                  inputMode="tel"
                  value={editGuardianPhone}
                  onChange={(e) => setEditGuardianPhone(toEnglishDigits(e.target.value))}
                  placeholder="01xxxxxxxxx"
                />
                {editContactNotice && (
                  <p className="mt-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 animate-slide-up">
                    {editContactNotice}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  صورة اللاعب الشخصية
                </label>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <input
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[11px] sm:text-xs text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-red-100 file:px-2.5 file:py-1 file:text-xs file:font-black file:text-red-700 hover:file:bg-red-200 cursor-pointer"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  {editPhoto && (
                    <div className="flex items-center gap-2">
                      <img
                        src={editPhoto}
                        alt="Preview"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl object-cover ring-1 ring-red-200"
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

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 sm:py-3 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer transition"
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
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 sm:py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition"
                  type="button"
                  onClick={() => setIsEditing(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            /* ════════════ العرض الأساسي البسيط المريح ════════════ */
            <>
              {/* شريط تبويبات الموبايل لتقسيم محتوى الملف الشخصي براحة وبدون تمرير لا نهائي */}
              <div className="sm:hidden flex items-center gap-1 p-1 bg-slate-100/90 rounded-2xl mb-4 border border-slate-200/80 sticky top-0 z-20 backdrop-blur-md shadow-2xs w-full max-w-full overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileProfileTab("overview")}
                  className={`flex-1 min-w-0 py-2 px-1 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation ${
                    mobileProfileTab === "overview"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate block">الرئيسية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMobileProfileTab("attendance")}
                  className={`flex-1 min-w-0 py-2 px-1 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                    mobileProfileTab === "attendance"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate inline-block">الحضور</span>
                  {(player.attendance || []).length > 0 && (
                    <span className="mr-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black rounded-full bg-slate-200 text-slate-700">
                      {(player.attendance || []).length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setMobileProfileTab("payments")}
                  className={`flex-1 min-w-0 py-2 px-1 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                    mobileProfileTab === "payments"
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="truncate inline-block">الاشتراكات</span>
                  {(player.paymentHistory || []).length > 0 && (
                    <span className="mr-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black rounded-full bg-slate-200 text-slate-700">
                      {(player.paymentHistory || []).length}
                    </span>
                  )}
                </button>
                {playerEvents.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMobileProfileTab("events")}
                    className={`flex-1 min-w-0 py-2 px-1 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                      mobileProfileTab === "events"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate inline-block">الفعاليات</span>
                    <span className="mr-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[9px] font-black rounded-full bg-amber-200 text-amber-900">
                      {playerEvents.length}
                    </span>
                  </button>
                )}
              </div>

              {/* قسم 1: النظرة العامة والاشتراك الحالي */}
              <div className={mobileProfileTab === "overview" ? "block" : "hidden sm:block"}>
                {/* بطاقة بيانات وهوية اللاعب الهادئة المتجاوبة */}
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:p-5 mb-3.5 sm:mb-4">
                {/* الصف العلوي: الصورة الشخصية والاسم والفرع والسن */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 font-cairo text-xl sm:text-2xl font-black text-white shadow-xs ring-2 ring-white">
                    {player.photo ? (
                      <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{player.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-cairo text-base sm:text-2xl font-black text-slate-900">
                      {player.name}
                    </h2>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-slate-700">
                        🏢 {player.branch}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-white border border-slate-200/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-slate-700">
                        🎂 {player.age} سنة
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold shadow-xs ${getBeltStyle(player.belt).bg} ${getBeltStyle(player.belt).text} ${getBeltStyle(player.belt).border}`}>
                        <span className={`h-2 w-2 rounded-full ${getBeltStyle(player.belt).dot}`} />
                        🥋 حزام {player.belt || "أبيض"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200/80 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-black text-red-700 shadow-xs">
                        مستوى {player.level || "A"}
                      </span>
                    </div>

                    <span className="mt-1 block text-[10px] sm:text-[11px] font-semibold text-slate-400">
                      تاريخ التسجيل: {registrationDate}
                    </span>
                  </div>
                </div>

                {/* قسم بيانات وتواصل ولي الأمر - بعرض كامل مريح ومثالي للموبايل والكمبيوتر */}
                <div className="mt-3 rounded-xl border border-slate-200/80 bg-white p-2.5 sm:p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-slate-600">
                      <Phone className="h-3.5 w-3.5 text-red-600 shrink-0" />
                      هاتف ولي الأمر:
                    </span>
                    {guardianPhone ? (
                      <span className="font-cairo text-xs sm:text-sm font-black text-slate-900 tracking-wider" dir="ltr">
                        {guardianPhone}
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400">غير مسجل</span>
                    )}
                  </div>

                  {guardianPhone ? (
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`tel:${guardianPhone}`}
                        onClick={handlePhoneCallClick}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-blue-800 transition active:scale-95 text-center"
                        title="إجراء اتصال هاتفي مباشر بولي الأمر"
                      >
                        {isCallingGuardian ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-blue-600 border-t-transparent animate-spin shrink-0" />
                            <span className="truncate">جاري...</span>
                          </>
                        ) : (
                          <>
                            <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">اتصال بولي الأمر</span>
                          </>
                        )}
                      </a>

                      <button
                        type="button"
                        onClick={openGuardianChat}
                        disabled={isOpeningChat}
                        className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-bold text-white transition active:scale-95 disabled:opacity-60 cursor-pointer text-center"
                        title="فتح محادثة واتساب مباشرة مع ولي الأمر"
                      >
                        {isOpeningChat ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                            <span className="truncate">جاري...</span>
                          </>
                        ) : (
                          <>
                            <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">محادثة واتساب</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
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
                      className="w-full text-center text-xs font-bold text-red-600 hover:underline py-1 cursor-pointer"
                    >
                      + اضغط هنا لإضافة رقم هاتف ولي الأمر
                    </button>
                  )}
                </div>

                {/* أزرار الإجراءات الأساسية المريحة والواضحة */}
                <div className="mt-3 border-t border-slate-200/60 pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {/* زر 1: إرسال تقرير نصي على واتساب */}
                    <button
                      type="button"
                      disabled={isSendingText || isDownloadingCard || isSendingCard}
                      onClick={shareOnWhatsApp}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-2 sm:p-2.5 text-[11px] sm:text-xs font-bold text-emerald-800 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                      title="إرسال تقرير نصي بالحضور والاشتراكات لولي الأمر عبر واتساب"
                    >
                      {isSendingText ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-emerald-700 border-t-transparent animate-spin shrink-0" />
                          <span className="truncate">جاري الفتح...</span>
                        </>
                      ) : (
                        <>
                          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">إرسال تقرير نصي</span>
                        </>
                      )}
                    </button>

                    {/* زر 2: حفظ صورة البطاقة */}
                    <button
                      type="button"
                      disabled={isSendingText || isDownloadingCard || isSendingCard}
                      onClick={downloadProfileCard}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 p-2 sm:p-2.5 text-[11px] sm:text-xs font-bold text-slate-800 transition active:scale-95 disabled:opacity-60 cursor-pointer"
                      title="حفظ وتحميل صورة بطاقة اللاعب الرسمية مباشرة على جهازك"
                    >
                      {isDownloadingCard ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-600 border-t-transparent animate-spin shrink-0" />
                          <span className="truncate">جاري التحميل...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 text-slate-600 shrink-0" />
                          <span className="truncate">حفظ صورة البطاقة</span>
                        </>
                      )}
                    </button>

                    {/* زر 3: إرسال البطاقة لولي الأمر (نسخ وفتح محادثة واتساب) */}
                    <button
                      type="button"
                      disabled={isSendingText || isDownloadingCard || isSendingCard}
                      onClick={handleSendCardDirectly}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 p-2 sm:p-2.5 text-[11px] sm:text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-60 cursor-pointer"
                      title="نسخ صورة البطاقة للحافظة وفتح محادثة واتساب مع ولي الأمر فوراً"
                    >
                      {isSendingCard ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                          <span className="truncate">جاري النسخ والفتح...</span>
                        </>
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">إرسال البطاقة</span>
                        </>
                      )}
                    </button>

                    {/* زر 4: تعديل البيانات */}
                    <button
                      type="button"
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
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 p-2 sm:p-2.5 text-[11px] sm:text-xs font-bold text-slate-700 transition active:scale-95 cursor-pointer"
                      title="تعديل بيانات اللاعب"
                    >
                      <Pencil className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">تعديل البيانات</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* بطاقات الإحصائيات البسيطة المتناسقة */}
              <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pb-3.5 sm:pb-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:p-3 text-center">
                  <strong className="block font-cairo text-lg sm:text-2xl font-black text-slate-900">
                    {attendanceRate}%
                  </strong>
                  <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">نسبة الالتزام</span>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:p-3 text-center">
                  <strong className="block font-cairo text-lg sm:text-2xl font-black text-slate-900">
                    {attended} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">/ {totalAttendanceCount}</span>
                  </strong>
                  <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">حصة حضور</span>
                </div>

                <div
                  className={`rounded-xl border p-2 sm:p-3 text-center cursor-pointer transition active:scale-95 ${
                    monthlyStatus === "paid"
                      ? "border-emerald-200 bg-emerald-50/60"
                      : monthlyStatus === "partially_paid"
                      ? "border-amber-300 bg-amber-50/70"
                      : "border-rose-200 bg-rose-50/60"
                  }`}
                  onClick={() => {
                    setTargetPaymentMonth(paymentMonth);
                    setTargetPaymentDetails(paymentDetails);
                    setShowPaymentModal(true);
                  }}
                  title="انقر لتسجيل أو تعديل الاشتراك"
                >
                  <strong
                    className={`block font-cairo text-xs sm:text-base font-black truncate ${
                      monthlyStatus === "paid"
                        ? "text-emerald-700"
                        : monthlyStatus === "partially_paid"
                        ? "text-amber-900"
                        : "text-rose-700"
                    }`}
                  >
                    {monthlyStatus === "paid"
                      ? "✓ مدفوع"
                      : monthlyStatus === "partially_paid"
                      ? `دفع ${paidAmount} • باقي ${remainingAmount}`
                      : `لم يدفع (${remainingAmount})`}
                  </strong>
                  <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-400 truncate">
                    شهر {paymentMonth}
                  </span>
                </div>
              </div>

              {/* صندوق اشتراك الشهر الحالي المطور */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/60 p-3.5 sm:p-4 mb-3.5 sm:mb-4 shadow-2xs">
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs">
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
                <div className="grid grid-cols-3 gap-2 my-2.5 pt-1 border-t border-slate-100">
                  <div className="rounded-xl bg-white border border-slate-200/80 p-2 text-center shadow-2xs">
                    <span className="block text-[10px] font-bold text-slate-500">المطلوب</span>
                    <strong className="font-cairo text-sm sm:text-base font-black text-slate-800">
                      {totalAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                    </strong>
                  </div>
                  <div className="rounded-xl bg-white border border-emerald-200/80 p-2 text-center shadow-2xs">
                    <span className="block text-[10px] font-bold text-emerald-700">المدفوع</span>
                    <strong className="font-cairo text-sm sm:text-base font-black text-emerald-700">
                      {paidAmount} <span className="text-[9px] font-normal text-emerald-500">ج.م</span>
                    </strong>
                  </div>
                  <div className={`rounded-xl bg-white border p-2 text-center shadow-2xs ${
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
                <div className="space-y-1 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>نسبة السداد:</span>
                    <span className="font-black text-slate-800">{paymentRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200/70 overflow-hidden">
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
                    className="flex-1 h-10 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-cairo text-xs font-black shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    <span>تسجيل / تعديل الدفعة</span>
                  </button>

                  {monthlyStatus !== "paid" && (
                    <button
                      type="button"
                      disabled={isTogglingPayment}
                      onClick={() => handleToggleMonthlyPayment()}
                      className="h-10 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-cairo text-xs font-black active:scale-95 transition cursor-pointer shrink-0"
                    >
                      {isTogglingPayment ? "جاري..." : "سداد كامل ✓"}
                    </button>
                  )}
                </div>
              </div>

              {/* تنبيه عيد الميلاد إن وُجد */}
              {birthdayInfo?.isToday &&
                !isBirthdayCongratulated(player._id) &&
                !birthdayCongratulated && (
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-rose-300 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-3.5 text-xs shadow-xs animate-slide-up">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl animate-bounce">🎂</span>
                      <div>
                        <strong className="block font-cairo text-sm font-black text-rose-900">
                          اليوم عيد ميلاد {player.name}! 🎉
                        </strong>
                        <span className="block text-[11px] font-bold text-amber-900">
                          يُتم اليوم {birthdayInfo.turningAge} سنة · كل عام وبطلنا بألف خير! 🥋
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={isSendingBirthdayCard}
                        onClick={async () => {
                          await sendBirthdayCardViaWhatsApp(player, captainName, {
                            onProgress: setIsSendingBirthdayCard,
                            onNotice: setProfileNotice,
                          });
                        }}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 font-black text-white shadow-xs hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
                        title="إرسال كارت التهنئة الرسمي عبر واتساب"
                      >
                        {isSendingBirthdayCard ? (
                          <>
                            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                            <span>جاري إرسال الكارت...</span>
                          </>
                        ) : (
                          <>
                            <span>🎂</span>
                            <span>إرسال كارت التهنئة</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* قسم 2: سجل الاشتراكات السابقة */}
              <div className={mobileProfileTab === "payments" ? "block" : "hidden sm:block"}>
                <div className="border-t border-slate-100 pt-4 pb-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <CreditCard className="h-3.5 w-3.5" />
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
                  <p className="text-xs text-slate-400 py-2">لا توجد اشتراكات مسجلة بعد.</p>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {[...player.paymentHistory].reverse().map((item) => {
                      const itemTotal = item.totalAmount ?? 100;
                      const itemPaid = item.paidAmount !== undefined ? item.paidAmount : (item.status === "paid" ? itemTotal : 0);
                      const itemRem = item.remainingAmount !== undefined ? item.remainingAmount : Math.max(0, itemTotal - itemPaid);
                      const isItemPaid = itemPaid >= itemTotal && itemTotal > 0;
                      const isItemPartial = itemPaid > 0 && !isItemPaid;

                      return (
                        <div
                          className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs gap-2"
                          key={item.month}
                        >
                          <div>
                            <span className="font-bold text-slate-800 block sm:inline">{item.month}</span>
                            <span className="text-[11px] font-semibold text-slate-500 sm:mr-2">
                              (دفع: {itemPaid} ج.م • متبقي: {itemRem} ج.م)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetPaymentMonth(item.month);
                                setTargetPaymentDetails({
                                  totalAmount: itemTotal,
                                  paidAmount: itemPaid,
                                  remainingAmount: itemRem,
                                  status: isItemPaid ? "paid" : isItemPartial ? "partially_paid" : "unpaid",
                                });
                                setShowPaymentModal(true);
                              }}
                              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                                isItemPaid
                                  ? "bg-emerald-600 text-white"
                                  : isItemPartial
                                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                                  : "bg-rose-100 text-rose-700 hover:bg-rose-200"
                              }`}
                              title="انقر لتعديل الدفعة"
                            >
                              {isItemPaid ? "✓ مدفوع" : isItemPartial ? `دفع ${itemPaid} • باقي ${itemRem}` : "لم يدفع"}
                            </button>
                            <button
                              type="button"
                              disabled={Boolean(updatingPaymentMonth || deletingPaymentMonth)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
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
                      );
                    })}
                  </div>
                )}

                {/* إضافة اشتراك شهر مخصص */}
                <form
                  onSubmit={addCustomPayment}
                  className="mt-3 grid gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 sm:grid-cols-4"
                >
                  <span className="text-[11px] font-bold text-slate-700 sm:col-span-full">
                    تسجيل اشتراك لشهر محدد:
                  </span>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">الشهر</label>
                    <input
                      type="month"
                      value={customPaymentMonth}
                      onChange={(e) => setCustomPaymentMonth(e.target.value)}
                      className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المطلوب (ج.م)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customTotalAmount}
                      onChange={(e) => setCustomTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                      placeholder="100"
                      className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">المدفوع (ج.م)</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customPaidAmount}
                      onChange={(e) => setCustomPaidAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                      placeholder="100"
                      className="min-h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      className="min-h-9 w-full rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer"
                      type="submit"
                      disabled={paymentSaving}
                    >
                      {paymentSaving ? "جاري..." : "حفظ"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

              {/* ━━━ قسم 3: سجل الفعاليات والرحلات المشترك بها ━━━ */}
              {playerEvents.length > 0 && (
                <div className={mobileProfileTab === "events" ? "block" : "hidden sm:block"}>
                  <div className="border-t border-slate-100 pt-4 pb-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                        <Compass className="h-3.5 w-3.5" />
                      </div>
                      <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                        الفعاليات والرحلات المشترك بها
                      </h3>
                    </div>
                    <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {playerEvents.length} فعالية
                    </span>
                  </div>

                  <div className="space-y-2">
                    {playerEvents.map((ev) => (
                      <div
                        key={ev._id}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs gap-2"
                      >
                        <div>
                          <strong className="font-bold text-slate-900 block">{ev.title}</strong>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {ev.date} {ev.location ? `• ${ev.location}` : ""}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                              ev.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : ev.paymentStatus === "partially_paid"
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-rose-50 text-rose-800 border-rose-200"
                            }`}
                          >
                            {ev.paymentStatus === "paid"
                              ? `✓ مدفوع (${ev.fee} ج.م)`
                              : ev.paymentStatus === "partially_paid"
                              ? `دفع ${ev.paid} • باقي ${ev.remaining} ج.م`
                              : `لم يدفع (باقي ${ev.fee} ج.م)`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              )}

              {/* قسم 4: سجل الحضور والغياب */}
              <div className={mobileProfileTab === "attendance" ? "block" : "hidden sm:block"}>
                <div className="border-t border-slate-100 pt-4 pb-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                      <Calendar className="h-3.5 w-3.5" />
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
                  <p className="text-xs text-slate-400 py-2">لا توجد حصص حضور مسجلة بعد.</p>
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
                            disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                              item.status === "present"
                                ? "bg-emerald-600 text-white"
                                : "bg-rose-600 text-white"
                            }`}
                            onClick={() => handleTogglePastAttendance(item.date, item.status)}
                            title="انقر للتبديل"
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
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                            onClick={() => handleDeletePastAttendance(item.date)}
                            title="حذف من السجل"
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

                {/* إضافة حصة حضور مخصصة */}
                <form
                  onSubmit={addCustomAttendance}
                  className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 sm:flex-row sm:items-center"
                >
                  <span className="whitespace-nowrap text-[11px] font-bold text-slate-700">
                    تسجيل حصة مخصصة:
                  </span>
                  <input
                    type="date"
                    max={today}
                    value={customAttendanceDate}
                    onChange={(e) => setCustomAttendanceDate(e.target.value)}
                    className="min-h-9 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
                    required
                  />
                  <select
                    value={customAttendanceStatus}
                    onChange={(e) => setCustomAttendanceStatus(e.target.value)}
                    className="min-h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold outline-none focus:border-red-500"
                  >
                    <option value="present">حاضر ✓</option>
                    <option value="absent">غائب ×</option>
                  </select>
                  <button
                    className="min-h-9 rounded-lg bg-slate-900 px-3.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer"
                    type="submit"
                    disabled={isSavingAttendance}
                  >
                    {isSavingAttendance ? (
                      <span className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري...</span>
                      </span>
                    ) : (
                      "إضافة"
                    )}
                  </button>
                </form>
              </div>
            </div>

              {/* زر حذف اللاعب النهائي - يظهر في تبويب النظرة العامة على الموبايل وبشكل دائم على الديسكتوب */}
              <div className={mobileProfileTab === "overview" ? "block" : "hidden sm:block"}>
                <button
                  type="button"
                  className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50/50 px-4 py-3 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300 active:scale-98 cursor-pointer"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>حذف اللاعب نهائيًا من الأكاديمية</span>
                </button>
              </div>
            </>
          )}
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

      {showPaymentModal && (
        <QuickPaymentModal
          player={player}
          paymentMonth={targetPaymentMonth}
          initialDetails={targetPaymentDetails}
          onClose={() => setShowPaymentModal(false)}
          onSave={async (data) => {
            await onUpdate(player._id, data);
            setProfileNotice(`✓ تم تحديث اشتراك شهر ${data.paymentMonth} بنجاح`);
          }}
        />
      )}
    </div>
  );
}
