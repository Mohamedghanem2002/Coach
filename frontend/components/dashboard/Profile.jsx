import { useEffect, useState, useMemo, useRef, useCallback } from "react";
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
  calculateAge,
  getPurchasesSummary,
  formatWhatsAppPhone,
  openWhatsAppDirect,
  generateBirthdayWishText,
  markBirthdayCongratulated,
  isNewPlayer,
  isWelcomeCardVisible,
  formatArabicMonth,
  getPlayerMonthAttendance,
  getArabicDayName,
} from "../../lib/dashboard-utils";
import QuickPaymentModal from "./QuickPaymentModal";
import ProfileCardModal from "./ProfileCardModal";
import BirthdayCardModal from "./BirthdayCardModal";
import WelcomeCardModal from "./WelcomeCardModal";
import PurchaseModal from "./PurchaseModal";
import {
  ArrowRight,
  MessageCircle,
  Pencil,
  Trash2,
  Phone,
  CreditCard,
  Calendar,
  Check,
  X,
  BookUser,
  Clipboard,
  Compass,
  Share2,
  ShoppingBag,
  Tag,
  Plus,
  Package,
  Clock,
  PartyPopper,
  Eye,
  Cake,
  Sparkles,
  Maximize2,
  FileText,
  Loader2,
} from "lucide-react";

import {
  generateProfileCardCanvas,
  playerPhotoCache,
} from "../../lib/profile-card-utils";
import ProfileEditForm from "./profile/ProfileEditForm";
import ProfileHeroCard from "./profile/ProfileHeroCard";
import ProfileTabOverview from "./profile/ProfileTabOverview";
import ProfileTabAttendance from "./profile/ProfileTabAttendance";
import ProfileTabPayments from "./profile/ProfileTabPayments";
import ProfileTabPurchases from "./profile/ProfileTabPurchases";
import ProfileTabEvents from "./profile/ProfileTabEvents";
import ProfileZoomPhotoModal from "./profile/ProfileZoomPhotoModal";

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
  const academyName = session?.user?.academyName || "أكاديمية الكاراتيه";
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
  const [mobileProfileTab, setMobileProfileTab] = useState("overview"); // "overview" | "attendance" | "payments" | "purchases" | "events"

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
  const [editFileNumber, setEditFileNumber] = useState(player.fileNumber || "");
  const [editGuardianPhone, setEditGuardianPhone] = useState(guardianPhone);
  const [editBranch, setEditBranch] = useState(player.branch);
  const [editBelt, setEditBelt] = useState(player.belt || "أبيض");
  const [editLevel, setEditLevel] = useState(player.level || "A");
  const [editContactNotice, setEditContactNotice] = useState("");
  const [showEditIOSContactGuide, setShowEditIOSContactGuide] = useState(false);
  const [editPhoto, setEditPhoto] = useState(player.photo || "");
  const editPhoneInputRef = useRef(null);
  const [editDefaultTotalAmount, setEditDefaultTotalAmount] = useState(
    player.defaultTotalAmount !== undefined && player.defaultTotalAmount !== null && player.defaultTotalAmount !== ""
      ? String(player.defaultTotalAmount)
      : (player.totalAmount !== undefined && player.totalAmount !== null && player.totalAmount !== "" && Number(player.totalAmount) > 0
          ? String(player.totalAmount)
          : "")
  );

  function startEditing(phoneOverride = null) {
    setEditName(player.name || "");
    setEditFileNumber(player.fileNumber || "");
    const _d = (player.dateOfBirth || "").split("-");
    setEditDobYear(_d[0] || "");
    setEditDobMonth(_d[1] || "");
    setEditDobDay(_d[2] || "");
    setEditGuardianPhone(phoneOverride !== null ? phoneOverride : (player.guardianPhone || ""));
    setEditBranch(player.branch || "");
    setEditBelt(player.belt || "أبيض");
    setEditLevel(player.level || "A");
    setEditPhoto(player.photo || "");
    setEditDefaultTotalAmount(
      player.defaultTotalAmount !== undefined && player.defaultTotalAmount !== null && player.defaultTotalAmount !== ""
        ? String(player.defaultTotalAmount)
        : (player.totalAmount !== undefined && player.totalAmount !== null && player.totalAmount !== "" && Number(player.totalAmount) > 0
            ? String(player.totalAmount)
            : "")
    );
    setIsEditing(true);
  }

  // Instant clipboard paste for phone number in profile edit
  async function handleEditPastePhone() {
    if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
      try {
        const text = await navigator.clipboard.readText();
        if (text && typeof text === "string") {
          const digits = toEnglishDigits(text).replace(/[^0-9]/g, "");
          if (digits && digits.length >= 8 && digits.length <= 15) {
            setEditGuardianPhone(digits);
            setEditContactNotice("✓ تم لصق الرقم بنجاح من الحافظة 📋");
            setTimeout(() => setEditContactNotice(""), 3500);
            return;
          } else if (text.trim()) {
            setEditGuardianPhone(toEnglishDigits(text).trim());
            setEditContactNotice("✓ تم لصق الرقم من الحافظة 📋");
            setTimeout(() => setEditContactNotice(""), 3500);
            return;
          }
        }
      } catch (_) {}
    }
    editPhoneInputRef.current?.focus();
    setEditContactNotice("💡 يمكنك لصق الرقم مباشرة داخل الحقل أو كتابته.");
    setTimeout(() => setEditContactNotice(""), 3500);
  }

  // Enhanced contact picker for Profile edit mode
  async function handleEditPickContact() {
    // 1. Native Contact Picker API (Works on Android Chrome, and iOS when Feature Flag is enabled)
    if (typeof window !== "undefined" && "contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["tel"];
        const contacts = await navigator.contacts.select(props, { multiple: false });
        if (contacts && contacts.length > 0 && contacts[0]?.tel && contacts[0].tel.length > 0) {
          const raw = contacts[0].tel[0];
          setEditGuardianPhone(toEnglishDigits(raw).replace(/[^0-9]/g, ""));
          setEditContactNotice("✓ تم اختيار الرقم بنجاح من سجل الهاتف");
          setTimeout(() => setEditContactNotice(""), 3500);
          return;
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.log("Contact picker cancelled or unsupported:", err);
      }
    }

    // 2. iOS Fallback: Check clipboard
    if (typeof navigator !== "undefined" && navigator.clipboard?.readText) {
      try {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          const digits = toEnglishDigits(clipText).replace(/[^0-9]/g, "");
          if (digits && digits.length >= 8 && digits.length <= 15) {
            setEditGuardianPhone(digits);
            setEditContactNotice("✓ تم لصق الرقم فوراً من الحافظة 📋");
            setTimeout(() => setEditContactNotice(""), 3500);
            return;
          }
        }
      } catch (_) {}
    }

    // 3. Focus input with autoComplete="tel" so iOS QuickType keyboard displays Contacts button
    editPhoneInputRef.current?.focus();

    // 4. Show iOS guide
    const isIOS =
      typeof navigator !== "undefined" &&
      /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    if (isIOS) {
      setShowEditIOSContactGuide((prev) => !prev);
    } else {
      setEditContactNotice("💡 يمكنك كتابة الرقم يدوياً أو لصقه من الحافظة.");
      setTimeout(() => setEditContactNotice(""), 4000);
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
  const [reportMonth, setReportMonth] = useState(paymentMonth || today.slice(0, 7));
  const [customAttendanceDate, setCustomAttendanceDate] = useState(today);
  const [customAttendanceStatus, setCustomAttendanceStatus] = useState("present");
  const [customPaymentMonth, setCustomPaymentMonth] = useState(today.slice(0, 7));
  const playerInitialFee =
    player?.defaultTotalAmount !== undefined && player?.defaultTotalAmount !== null && player?.defaultTotalAmount !== ""
      ? String(player.defaultTotalAmount)
      : (player?.totalAmount !== undefined && player?.totalAmount !== null && player?.totalAmount !== "" && Number(player.totalAmount) > 0
          ? String(player.totalAmount)
          : "");
  const [customTotalAmount, setCustomTotalAmount] = useState(playerInitialFee);
  const [customPaidAmount, setCustomPaidAmount] = useState(playerInitialFee);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [targetPaymentMonth, setTargetPaymentMonth] = useState(paymentMonth);
  const [targetPaymentDetails, setTargetPaymentDetails] = useState(null);

  // Purchases state
  const purchasesSummary = useMemo(() => getPurchasesSummary(player), [player]);
  const unpaidPurchases = useMemo(() => {
    return (purchasesSummary.purchases || []).filter(
      (p) => (Number(p.remainingAmount) || 0) > 0
    );
  }, [purchasesSummary.purchases]);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseModalMode, setPurchaseModalMode] = useState("add"); // "add" | "edit" | "pay"
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState(null);
  const [isDeletingPurchase, setIsDeletingPurchase] = useState(false);
  // purchaseId -> "received" | "pending"  (optimistic UI before API returns)
  const [optimisticDeliveryMap, setOptimisticDeliveryMap] = useState({});
  // Set of purchaseIds currently being toggled (for spinner)
  const [deliveryLoadingSet, setDeliveryLoadingSet] = useState(new Set());

  // Status & loading indicators
  const [profileNotice, setProfileNotice] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);

  // Card caching and sending
  const [cachedCardBlob, setCachedCardBlob] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cachedBirthdayBlob, setCachedBirthdayBlob] = useState(null);
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [showWelcomeCardModal, setShowWelcomeCardModal] = useState(false);
  const [showZoomPhoto, setShowZoomPhoto] = useState(false);

  // Confirm delete player
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingPlayer, setIsDeletingPlayer] = useState(false);

  // Action loading states (double-click prevention)
  const [isSendingText, setIsSendingText] = useState(false);
  const [isSendingBirthdayText, setIsSendingBirthdayText] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isCallingGuardian, setIsCallingGuardian] = useState(false);
  const [isTogglingPayment, setIsTogglingPayment] = useState(false);
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

  const [welcomeCardHandledTick, setWelcomeCardHandledTick] = useState(0);

  useEffect(() => {
    const handleWelcomeCardHandled = (e) => {
      if (!e.detail?.playerId || e.detail?.playerId === player?._id) {
        setWelcomeCardHandledTick((v) => v + 1);
      }
    };
    window.addEventListener("welcome_card_handled", handleWelcomeCardHandled);
    return () =>
      window.removeEventListener("welcome_card_handled", handleWelcomeCardHandled);
  }, [player?._id]);

  const isNew = useMemo(() => isNewPlayer(player), [player]);
  const showWelcomeCardButton = useMemo(() => {
    if (welcomeCardHandledTick < 0) return false;
    return isWelcomeCardVisible(player);
  }, [player, welcomeCardHandledTick]);

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
    const todayDate = new Date();
    let age = todayDate.getFullYear() - y;
    const currentMonth = todayDate.getMonth() + 1;
    const currentDay = todayDate.getDate();
    if (currentMonth < m || (currentMonth === m && currentDay < d)) {
      age -= 1;
    }
    return age >= 0 && age <= 120 ? age : null;
  }, [editDobYear, editDobMonth, editDobDay]);

  const playerBranch = useMemo(
    () => (branches || []).find((b) => b.name === player.branch),
    [branches, player.branch]
  );

  const activeMonthAttendance = useMemo(
    () => getPlayerMonthAttendance(player, playerBranch, reportMonth),
    [player, playerBranch, reportMonth]
  );
  const attended = activeMonthAttendance.attended;
  const totalAttendanceCount = activeMonthAttendance.total;
  const attendanceRate = activeMonthAttendance.rate;
  const paymentDetails = getPaymentDetailsFor(player, paymentMonth);
  const monthlyStatus = paymentDetails.status;
  const { totalAmount, paidAmount, remainingAmount } = paymentDetails;
  const paymentRate = totalAmount > 0 ? Math.min(100, Math.round((paidAmount / totalAmount) * 100)) : 0;
  const birthdayInfo = getBirthdayInfo(player);
  const hasActiveBirthday = Boolean(birthdayInfo?.isToday || birthdayInfo?.daysLeft === 1);
  const beltStyle = getBeltStyle(player.belt);
  const registrationDate = new Date(player.createdAt).toLocaleDateString("ar-EG");
  const currentAge = calculateAge(player.dateOfBirth) ?? player.age ?? 0;

  useEffect(() => {
    if (!profileNotice) return undefined;
    const timer = setTimeout(() => setProfileNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [profileNotice]);

  async function generateProfileCanvas(customMonth = null) {
    return generateProfileCardCanvas({
      player,
      branches,
      paymentMonth,
      reportMonth,
      captainName,
      academyName,
      customMonth,
    });
  }

  useEffect(() => {
    let isCancelled = false;
    if (!player) return undefined;

    // Fast preload player photo into memory cache
    if (player.photo && !playerPhotoCache.has(player.photo)) {
      const img = new Image();
      if (player.photo.startsWith("http://") || player.photo.startsWith("https://")) {
        img.crossOrigin = "anonymous";
      }
      img.onload = () => playerPhotoCache.set(player.photo, img);
      img.onerror = () => {};
      img.src = player.photo;
    }

    const targetMonth = reportMonth || paymentMonth;
    generateProfileCanvas(targetMonth).then((canvas) => {
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
  }, [player, attended, monthlyStatus, paymentMonth, reportMonth]);



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
    openWhatsAppDirect(cleanPhone);
    setTimeout(() => setIsOpeningChat(false), 1000);
  }

  function shareReportText(targetMonth = null) {
    if (isSendingText) return;
    setIsSendingText(true);
    const activeMonth = targetMonth || reportMonth || paymentMonth || localDate().slice(0, 7);
    const activeMonthLabel = formatArabicMonth(activeMonth);
    const cleanPhone = formatWhatsAppPhone(guardianPhone);

    // Attendance strictly for activeMonth aligned with branch training days:
    const monthAttData = getPlayerMonthAttendance(player, playerBranch, activeMonth);
    const monthAttended = monthAttData.attended;
    const monthTotal = monthAttData.total;
    const monthRate = monthAttData.rate;

    const attendanceText = monthAttData.sessions.length
      ? monthAttData.sessions
          .slice()
          .reverse()
          .map((item) => {
            const dayName = item.dayName || getArabicDayName(item.date);
            const prefix = dayName ? `${dayName} ` : "";
            return `• ${prefix}(${item.date}): ${item.status === "present" ? "حاضر التدريب ✓" : "غائب ×"}`;
          })
          .join("\n")
      : `لا توجد حصص تدريبية مسجلة خلال شهر ${activeMonthLabel}`;

    // Target Month Payment
    const targetPayment = getPaymentDetailsFor(player, activeMonth);
    const mTotal = targetPayment.totalAmount || 0;
    const mPaid = targetPayment.paidAmount || 0;
    const mRem = targetPayment.remainingAmount || 0;
    let paymentStatusText = "لم يدفع ⚠️";
    if (targetPayment.status === "paid") {
      paymentStatusText = mPaid > 0 ? `مدفوع بالكامل (${mPaid} ج.م) ✓` : "مدفوع بالكامل ✓";
    } else if (targetPayment.status === "partially_paid") {
      paymentStatusText = `سدد ${mPaid} من أصل ${mTotal} ج.م (فاضل عليه ${mRem} ج.م) ⚠️`;
    } else if (mTotal > 0 || mRem > 0) {
      paymentStatusText = `غير مدفوع (المبلغ المطلوب: ${mTotal || mRem} ج.م) ⚠️`;
    }

    const purchasesList = Array.isArray(player.purchases) ? player.purchases : [];
    const purchasesText = purchasesList.length
      ? purchasesList
          .map((p) => {
            const tot = Number(p.totalAmount) || 0;
            const pd = Number(p.paidAmount) || 0;
            const rm = Math.max(0, tot - pd);
            const deliveryTxt =
              p.deliveryStatus === "received"
                ? " [تم الاستلام ✓]"
                : " [لم يستلم بعد ⏳]";
            if (pd >= tot && tot > 0) return `• ${p.title}${deliveryTxt}: مدفوع بالكامل (${pd} ج.م) ✓`;
            if (pd > 0) return `• ${p.title}${deliveryTxt}: سدد ${pd} من أصل ${tot} ج.م (فاضل عليه ${rm} ج.م) ⚠️`;
            return `• ${p.title}${deliveryTxt}: لم يسدد أي مبلغ من ${tot} ج.م (فاضل عليه ${rm} ج.م) ⚠️`;
          })
          .join("\n") +
        (purchasesSummary.remainingAmount > 0
          ? `\n💰 إجمالي متبقي المشتريات والأدوات: ${purchasesSummary.remainingAmount} ج.م`
          : "\n✓ تم سداد كافة المشتريات والأدوات بالكامل")
      : "";

    const message = [
      `🥋 تقرير متابعة البطل - شهر ${activeMonthLabel}`,
      `📨 إشراف وتدريب الكابتن: ${captainName}`,
      "",
      `👤 اسم البطل: ${player.name}`,
      `🥋 الحزام: ${player.belt || "أبيض"} (مستوى ${player.level || "A"})`,
      `🏢 الصالة: ${player.branch}`,
      ...(guardianPhone ? [`📞 هاتف ولي الأمر: ${guardianPhone}`] : []),
      "",
      `📊 ملخص شهر ${activeMonthLabel}:`,
      `✅ حضور تدريبات الشهر: ${monthAttended} من إجمالي ${monthTotal} حصة (${monthRate}%)`,
      `💳 اشتراك شهر ${activeMonthLabel}: ${paymentStatusText}`,
      ...(purchasesText ? ["", "🥋 المشتريات والمستلزمات (البدل والأدوات):", purchasesText] : []),
      "",
      `📋 سجل حضور وغياب شهر ${activeMonthLabel}:`,
      attendanceText,
      "",
      "🌟 نشكركم على حسن المتابعة وتشجيع بطلنا على الالتزام المستمر 🏆",
    ].join("\n");

    openWhatsAppDirect(cleanPhone, message);
    setProfileNotice(
      cleanPhone
        ? `✓ تم تجهيز تقرير شهر ${activeMonthLabel} وفتح واتساب لولي الأمر (${cleanPhone})`
        : `✓ تم تجهيز تقرير شهر ${activeMonthLabel} وفتح واتساب لاختيار المحادثة`
    );
    setTimeout(() => setIsSendingText(false), 800);
  }

  function shareBirthdayText() {
    if (isSendingBirthdayText) return;
    setIsSendingBirthdayText(true);
    const cleanPhone = formatWhatsAppPhone(guardianPhone);
    const wishText = generateBirthdayWishText(player, captainName);
    markBirthdayCongratulated(player._id);
    openWhatsAppDirect(cleanPhone, wishText);
    setProfileNotice(
      cleanPhone
        ? `✓ تم فتح تطبيق واتساب لولي الأمر وإرسال التهنئة النصية فوراً 🎉`
        : "✓ تم فتح تطبيق واتساب لاختيار المحادثة وإرسال التهنئة النصية فوراً 🎉"
    );
    setTimeout(() => setIsSendingBirthdayText(false), 800);
  }

  const shareOnWhatsApp = shareReportText;

  async function handleSavePurchase(payload) {
    try {
      const updated = await onUpdate(player._id, payload);
      if (updated) {
        if (payload.purchaseAction === "add") {
          setProfileNotice(`✓ تم إضافة السلعة (${payload.title}) بنجاح`);
        } else if (payload.purchaseAction === "toggle_delivery") {
          setProfileNotice(
            payload.deliveryStatus === "received"
              ? "✓ تم تأكيد استلام اللاعب للسلعة"
              : "⏳ تم تحويل حالة السلعة إلى: لم يستلم بعد"
          );
        } else if (payload.addAmount !== undefined) {
          setProfileNotice(`✓ تم تسجيل سداد مبلغ (${payload.addAmount} ج.م) بنجاح`);
        } else {
          setProfileNotice(`✓ تم تحديث بيانات السلعة بنجاح`);
        }
      } else {
        setProfileNotice("تعذر حفظ بيانات السلعة. حاول مرة أخرى.");
      }
    } catch (err) {
      console.error(err);
      setProfileNotice("تعذر حفظ بيانات السلعة. حاول مرة أخرى.");
    }
  }

  async function handleToggleDelivery(item) {
    if (deliveryLoadingSet.has(item.id)) return; // prevent double-tap
    const isCurrentlyReceived =
      (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received";
    const nextStatus = isCurrentlyReceived ? "pending" : "received";

    // 1. Immediate optimistic flip + spinner
    setOptimisticDeliveryMap((prev) => ({ ...prev, [item.id]: nextStatus }));
    setDeliveryLoadingSet((prev) => new Set([...prev, item.id]));

    // 2. Persist to server
    await handleSavePurchase({
      purchaseAction: "toggle_delivery",
      purchaseId: item.id,
      deliveryStatus: nextStatus,
    });

    // 3. Clear spinner + optimistic override
    setDeliveryLoadingSet((prev) => { const s = new Set(prev); s.delete(item.id); return s; });
    setOptimisticDeliveryMap((prev) => {
      const next = { ...prev };
      delete next[item.id];
      return next;
    });
  }

  async function handleDeletePurchase() {
    if (!purchaseToDelete || isDeletingPurchase) return;
    setIsDeletingPurchase(true);
    try {
      const updated = await onUpdate(player._id, {
        purchaseAction: "delete",
        purchaseId: purchaseToDelete.id,
      });
      if (updated) {
        setProfileNotice(`✓ تم حذف (${purchaseToDelete.title}) من سجل المشتريات`);
      } else {
        setProfileNotice("تعذر حذف السلعة. حاول مرة أخرى.");
      }
    } catch (err) {
      console.error(err);
      setProfileNotice("تعذر حذف السلعة. حاول مرة أخرى.");
    } finally {
      setIsDeletingPurchase(false);
      setPurchaseToDelete(null);
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
    if (editDateOfBirth && (calculatedEditAge === null || calculatedEditAge < 0)) {
      setProfileNotice("يرجى إدخال تاريخ ميلاد صحيح وصالح.");
      return;
    }
    setProfileSaving(true);
    const updatedPlayer = await onUpdate(player._id, {
      updateInfo: "true",
      name: editName.trim(),
      fileNumber: toEnglishDigits(editFileNumber).trim(),
      dateOfBirth: editDateOfBirth,
      guardianPhone: toEnglishDigits(editGuardianPhone).trim(),
      age: String(calculatedEditAge ?? player.age ?? 0),
      branch: editBranch,
      belt: editBelt,
      level: editLevel,
      photo: editPhoto,
      defaultTotalAmount: editDefaultTotalAmount ? Number(editDefaultTotalAmount) : null,
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4 lg:p-6 animate-fade-in-scale overflow-hidden max-w-full"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      dir="rtl"
    >
      <aside className="relative flex flex-col h-full h-dvh sm:h-auto sm:max-h-[90vh] lg:max-h-[88vh] w-full max-w-full sm:max-w-3xl lg:max-w-5xl overflow-hidden rounded-t-[32px] sm:rounded-3xl border-0 sm:border sm:border-slate-200/80 bg-slate-50 shadow-2xl animate-fade-in-scale pb-safe">
        {/* Mobile Pull / Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden bg-white/95">
          <div className="h-1.5 w-11 rounded-full bg-slate-300" />
        </div>

        {/* ════════════ شريط التطبيق العلوي الذكي ════════════ */}
        <header className="sticky top-0 z-40 flex items-center justify-between gap-2 border-b border-slate-200/80 bg-white/95 px-3.5 sm:px-6 py-2.5 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Mobile Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="flex sm:hidden h-9 items-center gap-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 text-xs font-black text-slate-700 transition active-press cursor-pointer touch-manipulation"
              title="الرجوع للقائمة"
            >
              <ArrowRight className="h-4 w-4 text-slate-600 stroke-[2.5]" />
              <span className="text-xs">رجوع</span>
            </button>

            {/* Desktop Header Identity Badge */}
            <div className="hidden sm:flex items-center gap-2.5 min-w-0">
              <div
                onClick={() => player.photo && setShowZoomPhoto(true)}
                className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-red-600 font-cairo text-xs font-black text-white ring-2 ${beltStyle.border} ${player.photo ? "cursor-pointer hover:ring-2 hover:ring-red-400 transition" : ""}`}
                title={player.photo ? "انقر لتكبير صورة اللاعب" : player.name}
              >
                {player.photo ? (
                  <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{player.name.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="truncate font-cairo text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {player.name}
                  </h1>
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.2 text-[10px] font-bold ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                    🥋 {player.belt || "أبيض"}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-slate-100 border border-slate-200 px-1.5 py-0.2 text-[10px] font-bold text-slate-600">
                    🏢 {player.branch}
                  </span>
                </div>
                <span className="block text-[10px] font-medium text-slate-400">
                  مستوى {player.level || "A"} • {currentAge} سنة
                </span>
              </div>
            </div>

            {/* Mobile Player Title */}
            <div className="sm:hidden min-w-0">
              <h1 className="truncate font-cairo text-sm font-black text-slate-900 leading-tight">
                {player.name}
              </h1>
              <span className="block text-[10px] font-medium text-slate-400">
                🥋 حزام {player.belt || "أبيض"} • {player.branch}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => startEditing()}
                  className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 text-xs font-black text-slate-700 transition active-press cursor-pointer touch-manipulation shadow-2xs"
                  title="تعديل بيانات اللاعب"
                >
                  <Pencil className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden xs:inline text-xs">تعديل</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition active-press cursor-pointer touch-manipulation"
                  title="إغلاق الملف"
                >
                  <X className="h-4 w-4 stroke-[2.5]" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-9 items-center gap-1 rounded-xl bg-slate-100 hover:bg-slate-200 px-3 text-xs font-black text-slate-600 transition active-press cursor-pointer touch-manipulation"
              >
                <span>إلغاء التعديل</span>
              </button>
            )}
          </div>
        </header>

        {/* ════════════ حاوية المحتوى القابلة للتمرير بسلاسة ════════════ */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 space-y-3.5">
          {/* رسالة التنبيه الإشعارية السريعة */}
          {profileNotice && (
            <div
              className={`flex items-center justify-between gap-2 rounded-2xl border p-3 text-xs font-bold shadow-xs animate-slide-up ${
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
                className="flex h-6 w-6 items-center justify-center rounded-full bg-current/10 text-xs font-bold hover:bg-current/20 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* ════════════ وضع تعديل البيانات ════════════ */}
          {isEditing ? (
            <ProfileEditForm
              saveInfo={saveInfo}
              profileSaving={profileSaving}
              editName={editName}
              setEditName={setEditName}
              editFileNumber={editFileNumber}
              setEditFileNumber={setEditFileNumber}
              editDobDay={editDobDay}
              editDobMonth={editDobMonth}
              editDobYear={editDobYear}
              handleEditDayChange={handleEditDayChange}
              handleEditMonthChange={handleEditMonthChange}
              handleEditYearChange={handleEditYearChange}
              handleEditDatePaste={handleEditDatePaste}
              editMonthInputRef={editMonthInputRef}
              editYearInputRef={editYearInputRef}
              calculatedEditAge={calculatedEditAge}
              player={player}
              branches={branches}
              editBranch={editBranch}
              setEditBranch={setEditBranch}
              editBelt={editBelt}
              setEditBelt={setEditBelt}
              editLevel={editLevel}
              setEditLevel={setEditLevel}
              editPhoneInputRef={editPhoneInputRef}
              editGuardianPhone={editGuardianPhone}
              setEditGuardianPhone={setEditGuardianPhone}
              handleEditPastePhone={handleEditPastePhone}
              handleEditPickContact={handleEditPickContact}
              editContactNotice={editContactNotice}
              showEditIOSContactGuide={showEditIOSContactGuide}
              setShowEditIOSContactGuide={setShowEditIOSContactGuide}
              handlePhotoChange={handlePhotoChange}
              editPhoto={editPhoto}
              setEditPhoto={setEditPhoto}
              editDefaultTotalAmount={editDefaultTotalAmount}
              setEditDefaultTotalAmount={setEditDefaultTotalAmount}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            /* ════════════ العرض الأساسي - تطبيق موبايل أصيل ════════════ */
            <>
              {/* 1. كارت هوية اللاعب وشبكة الإجراءات السريعة (App Profile Header) */}
              <ProfileHeroCard
                player={player}
                beltStyle={beltStyle}
                currentAge={currentAge}
                isNew={isNew}
                registrationDate={registrationDate}
                hasActiveBirthday={hasActiveBirthday}
                birthdayInfo={birthdayInfo}
                isSendingBirthdayText={isSendingBirthdayText}
                shareBirthdayText={shareBirthdayText}
                setShowBirthdayModal={setShowBirthdayModal}
                showWelcomeCardButton={showWelcomeCardButton}
                setShowWelcomeCardModal={setShowWelcomeCardModal}
                guardianPhone={guardianPhone}
                openGuardianChat={openGuardianChat}
                isOpeningChat={isOpeningChat}
                startEditing={startEditing}
                handlePhoneCallClick={handlePhoneCallClick}
                isSendingText={isSendingText}
                shareReportText={shareReportText}
                reportMonth={reportMonth}
                setReportMonth={setReportMonth}
                setShowCardModal={setShowCardModal}
                setShowZoomPhoto={setShowZoomPhoto}
              />
              {/* 2. شريط تبويبات التنقل بأسلوب التطبيقات (Sticky Segmented Navigation) */}
              <div className="sticky top-0 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-2 bg-slate-50/95 sm:bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-2xs">
                <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-2xl w-full max-w-full overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setMobileProfileTab("overview")}
                    className={`flex-1 min-w-0 py-2 px-1.5 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation ${
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
                    className={`flex-1 min-w-0 py-2 px-1.5 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                      mobileProfileTab === "attendance"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate inline-block">الحضور</span>
                    {(player.attendance || []).length > 0 && (
                      <span className="mr-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black rounded-full bg-slate-200 text-slate-700">
                        {(player.attendance || []).length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileProfileTab("payments")}
                    className={`flex-1 min-w-0 py-2 px-1.5 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                      mobileProfileTab === "payments"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate inline-block">الاشتراكات</span>
                    {(player.paymentHistory || []).length > 0 && (
                      <span className="mr-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black rounded-full bg-slate-200 text-slate-700">
                        {(player.paymentHistory || []).length}
                      </span>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileProfileTab("purchases")}
                    className={`flex-1 min-w-0 py-2 px-1.5 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                      mobileProfileTab === "purchases"
                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span className="truncate inline-block">المشتريات</span>
                    {purchasesSummary.count > 0 && (
                      <span
                        className={`mr-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black rounded-full ${
                          purchasesSummary.remainingAmount > 0
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {purchasesSummary.count}
                      </span>
                    )}
                  </button>
                  {playerEvents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMobileProfileTab("events")}
                      className={`flex-1 min-w-0 py-2 px-1.5 text-center rounded-xl text-xs font-black transition-all active-press cursor-pointer touch-manipulation relative ${
                        mobileProfileTab === "events"
                          ? "bg-white text-slate-900 shadow-xs border border-slate-200/70"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <span className="truncate inline-block">الفعاليات</span>
                      <span className="mr-1 inline-flex items-center justify-center px-1.5 py-0.2 text-[9px] font-black rounded-full bg-amber-200 text-amber-900">
                        {playerEvents.length}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* ════════════ 3. محتويات التبويبات ════════════ */}

              {/* قسم 1: النظرة العامة والاشتراك الحالي */}
              <div className={mobileProfileTab === "overview" ? "block" : "hidden"}>
                <ProfileTabOverview
                  player={player}
                  paymentMonth={paymentMonth}
                  paymentDetails={paymentDetails}
                  monthlyStatus={monthlyStatus}
                  totalAmount={totalAmount}
                  paidAmount={paidAmount}
                  remainingAmount={remainingAmount}
                  paymentRate={paymentRate}
                  setTargetPaymentMonth={setTargetPaymentMonth}
                  setTargetPaymentDetails={setTargetPaymentDetails}
                  setShowPaymentModal={setShowPaymentModal}
                  isTogglingPayment={isTogglingPayment}
                  handleToggleMonthlyPayment={handleToggleMonthlyPayment}
                  attendanceRate={attendanceRate}
                  attended={attended}
                  totalAttendanceCount={totalAttendanceCount}
                  purchasesSummary={purchasesSummary}
                  setMobileProfileTab={setMobileProfileTab}
                  startEditing={startEditing}
                  guardianPhone={guardianPhone}
                  unpaidPurchases={unpaidPurchases}
                  setShowDeleteConfirm={setShowDeleteConfirm}
                />
              </div>

              {/* قسم 2: سجل الحضور والغياب */}
              <div className={mobileProfileTab === "attendance" ? "block" : "hidden"}>
                <ProfileTabAttendance
                  activeMonthAttendance={activeMonthAttendance}
                  reportMonth={reportMonth}
                  updatingAttendanceDate={updatingAttendanceDate}
                  deletingAttendanceDate={deletingAttendanceDate}
                  handleTogglePastAttendance={handleTogglePastAttendance}
                  handleDeletePastAttendance={handleDeletePastAttendance}
                  today={today}
                  customAttendanceDate={customAttendanceDate}
                  setCustomAttendanceDate={setCustomAttendanceDate}
                  customAttendanceStatus={customAttendanceStatus}
                  setCustomAttendanceStatus={setCustomAttendanceStatus}
                  addCustomAttendance={addCustomAttendance}
                  isSavingAttendance={isSavingAttendance}
                />
              </div>

              {/* قسم 3: سجل الاشتراكات السابقة */}
              <div className={mobileProfileTab === "payments" ? "block" : "hidden"}>
                <ProfileTabPayments
                  player={player}
                  onOpenEditPayment={(month, details) => {
                    setTargetPaymentMonth(month);
                    setTargetPaymentDetails(details);
                    setShowPaymentModal(true);
                  }}
                  onDeletePayment={(month) => handleDeletePastPayment(month)}
                  deletingPaymentMonth={deletingPaymentMonth}
                  updatingPaymentMonth={updatingPaymentMonth}
                  customPaymentMonth={customPaymentMonth}
                  setCustomPaymentMonth={setCustomPaymentMonth}
                  customTotalAmount={customTotalAmount}
                  setCustomTotalAmount={setCustomTotalAmount}
                  customPaidAmount={customPaidAmount}
                  setCustomPaidAmount={setCustomPaidAmount}
                  addCustomPayment={addCustomPayment}
                  paymentSaving={paymentSaving}
                />
              </div>

              {/* قسم 4: المشتريات والمستلزمات (البدل والأدوات) */}
              <div className={mobileProfileTab === "purchases" ? "space-y-3.5 block" : "hidden"}>
                <ProfileTabPurchases
                  purchasesSummary={purchasesSummary}
                  onOpenAddPurchase={() => {
                    setPurchaseModalMode("add");
                    setSelectedPurchase(null);
                    setShowPurchaseModal(true);
                  }}
                  handleToggleDelivery={handleToggleDelivery}
                  deliveryLoadingSet={deliveryLoadingSet}
                  optimisticDeliveryMap={optimisticDeliveryMap}
                  onOpenPayPurchase={(item) => {
                    setSelectedPurchase(item);
                    setPurchaseModalMode("pay");
                    setShowPurchaseModal(true);
                  }}
                  onOpenEditPurchase={(item) => {
                    setSelectedPurchase(item);
                    setPurchaseModalMode("edit");
                    setShowPurchaseModal(true);
                  }}
                  onDeletePurchase={(item) => setPurchaseToDelete(item)}
                />
              </div>

              {/* قسم 5: سجل الفعاليات والرحلات */}
              {playerEvents.length > 0 && (
                <div className={mobileProfileTab === "events" ? "space-y-3.5 block" : "hidden"}>
                  <ProfileTabEvents playerEvents={playerEvents} />
                </div>
              )}
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
          onSavePurchase={handleSavePurchase}
        />
      )}

      {showCardModal && (
        <ProfileCardModal
          player={player}
          captainName={captainName}
          canvasGenerator={generateProfileCanvas}
          cachedBlob={cachedCardBlob}
          isOpen={showCardModal}
          onClose={() => setShowCardModal(false)}
          paymentMonth={reportMonth || paymentMonth}
          onSendWhatsApp={(month) => shareReportText(month)}
        />
      )}

      {showBirthdayModal && (
        <BirthdayCardModal
          player={player}
          captainName={captainName}
          academyName={academyName}
          cachedBlob={cachedBirthdayBlob}
          isOpen={showBirthdayModal}
          onClose={() => setShowBirthdayModal(false)}
        />
      )}

      {showWelcomeCardModal && (
        <WelcomeCardModal
          player={player}
          captainName={captainName}
          academyName={academyName}
          isOpen={showWelcomeCardModal}
          onClose={() => setShowWelcomeCardModal(false)}
        />
      )}

      {showPurchaseModal && (
        <PurchaseModal
          key={selectedPurchase?.id || purchaseModalMode}
          isOpen={showPurchaseModal}
          mode={purchaseModalMode}
          player={player}
          initialData={selectedPurchase}
          onClose={() => {
            setShowPurchaseModal(false);
            setSelectedPurchase(null);
          }}
          onSave={handleSavePurchase}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(purchaseToDelete)}
        title="حذف السلعة"
        message={`هل أنت متأكد من حذف "${purchaseToDelete?.title}" من سجل مشتريات اللاعب؟`}
        confirmText="نعم، احذف"
        cancelText="تراجع"
        confirmVariant="danger"
        isBusy={isDeletingPurchase}
        onConfirm={handleDeletePurchase}
        onCancel={() => setPurchaseToDelete(null)}
      />

      {/* ════════════ نافذة تكبير صورة اللاعب (Photo Zoom Lightbox) ════════════ */}
      <ProfileZoomPhotoModal
        showZoomPhoto={showZoomPhoto}
        setShowZoomPhoto={setShowZoomPhoto}
        player={player}
      />
    </div>
  );
}
