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
} from "lucide-react";

// Fast in-memory cache for player photo elements to prevent re-fetching and decoding delay
const playerPhotoCache = new Map();

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
      `👤 اسم البطل: ${player.name}${player.fileNumber ? ` (ملف: #${player.fileNumber})` : ""}`,
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
    const isCurrentlyReceived =
      (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received";
    const nextStatus = isCurrentlyReceived ? "pending" : "received";

    // 1. Immediate optimistic flip so the button reacts instantly
    setOptimisticDeliveryMap((prev) => ({ ...prev, [item.id]: nextStatus }));

    // 2. Persist to server
    await handleSavePurchase({
      purchaseAction: "toggle_delivery",
      purchaseId: item.id,
      deliveryStatus: nextStatus,
    });

    // 3. Clear optimistic override – real data from server is now in `player.purchases`
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

  async function generateProfileCanvas(customMonth = null) {
    const activeMonth = customMonth || reportMonth || paymentMonth || localDate().slice(0, 7);
    const monthLabel = formatArabicMonth(activeMonth);

    // Attendance strictly for activeMonth aligned with branch training days:
    const targetPlayerBranch = (branches || []).find((b) => b.name === player.branch);
    const monthAttData = getPlayerMonthAttendance(player, targetPlayerBranch, activeMonth);
    const attendanceHistory = [...monthAttData.sessions].reverse().slice(0, 5);
    const totalSessions = monthAttData.total;
    const attendedSessions = monthAttData.attended;
    const attRate = monthAttData.rate;

    const purchasesList = Array.isArray(player.purchases)
      ? [...player.purchases].reverse().slice(0, 4)
      : [];
    const pSummary = getPurchasesSummary(player);
    const unpdPurchases = (pSummary.purchases || []).filter(
      (p) => (Number(p.remainingAmount) || 0) > 0,
    );

    const targetPayment = getPaymentDetailsFor(player, activeMonth);
    const mStatus = targetPayment.status;
    const mHasConfigured = Boolean(
      targetPayment.hasConfiguredAmount ||
      (targetPayment.totalAmount !== undefined && targetPayment.totalAmount !== null && Number(targetPayment.totalAmount) > 0)
    );
    const mTotal = mHasConfigured ? Number(targetPayment.totalAmount) : 0;
    const mPaid = targetPayment.paidAmount ?? 0;
    const mRemaining = mHasConfigured ? (targetPayment.remainingAmount ?? 0) : 0;

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

    const drawLeft = (text, x, y, font, color) => {
      context.font = font;
      context.fillStyle = color;
      context.textAlign = "left";
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
    context.roundRect(36, 36, canvas.width - 72, 184, [40, 40, 0, 0]);
    context.fill();

    // Embellishment badge (Dynamic Academy Brand)
    const badgeText = academyName || "CoachMaster";
    context.font = "900 20px Cairo, sans-serif";
    const badgeTextWidth = context.measureText(badgeText).width;
    const badgeWidth = Math.max(160, Math.min(320, badgeTextWidth + 36));
    context.fillStyle = "rgba(255, 255, 255, 0.18)";
    context.beginPath();
    context.roundRect(72, 65, badgeWidth, 52, 16);
    context.fill();
    drawCenter(badgeText, 72 + badgeWidth / 2, 99, "900 20px Cairo, sans-serif", "#ffffff");

    drawRight(
      "بطاقة لاعب الكاراتيه الرسمية 🥋",
      canvas.width - 80,
      105,
      "900 42px Cairo, sans-serif",
      "#ffffff",
    );
    drawRight(
      `إشراف وتدريب الكابتن: ${captainName}`,
      canvas.width - 80,
      160,
      "700 26px Cairo, sans-serif",
      "#fecaca",
    );

    // Athlete Banner Box (Enlarged to 380px for a prominent hero photo)
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.roundRect(72, 236, canvas.width - 144, 380, 24);
    context.fill();
    context.strokeStyle = "#e2e8f0";
    context.lineWidth = 2;
    context.stroke();

    // Photo / Monogram Avatar (Substantially enlarged: Center 255, 426, Radius 160, Diameter 320px)
    const avatarRadius = 160;
    const avatarCenterX = 255;
    const avatarCenterY = 426;

    let photoDrawn = false;
    if (player.photo) {
      let photo = playerPhotoCache.get(player.photo);
      if (!photo || !(photo.naturalWidth || photo.width)) {
        photo = await new Promise((resolve) => {
          const image = new Image();
          if (player.photo.startsWith("http://") || player.photo.startsWith("https://")) {
            image.crossOrigin = "anonymous";
          }
          image.onload = () => {
            playerPhotoCache.set(player.photo, image);
            resolve(image);
          };
          image.onerror = () => resolve(null);
          setTimeout(() => resolve(null), 1000);
          image.src = player.photo;
        });
      }
      if (photo && (photo.naturalWidth || photo.width) && (photo.naturalHeight || photo.height)) {
        const pw = photo.naturalWidth || photo.width;
        const ph = photo.naturalHeight || photo.height;

        // Outer soft ambient glow ring
        context.beginPath();
        context.arc(avatarCenterX, avatarCenterY, avatarRadius + 10, 0, Math.PI * 2);
        context.strokeStyle = "rgba(220, 38, 38, 0.15)";
        context.lineWidth = 10;
        context.stroke();

        // Gold decorative champion ring
        context.beginPath();
        context.arc(avatarCenterX, avatarCenterY, avatarRadius + 4, 0, Math.PI * 2);
        context.strokeStyle = "#f59e0b";
        context.lineWidth = 4;
        context.stroke();

        // Center-crop (object-fit: cover) to preserve aspect ratio without stretching
        const minDim = Math.min(pw, ph);
        const sx = (pw - minDim) / 2;
        const sy = (ph - minDim) / 2;

        context.save();
        context.beginPath();
        context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        context.clip();
        context.drawImage(
          photo,
          sx,
          sy,
          minDim,
          minDim,
          avatarCenterX - avatarRadius,
          avatarCenterY - avatarRadius,
          avatarRadius * 2,
          avatarRadius * 2
        );
        context.restore();

        // Bold Crimson border ring
        context.beginPath();
        context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
        context.strokeStyle = "#dc2626";
        context.lineWidth = 6;
        context.stroke();
        photoDrawn = true;
      }
    }

    if (!photoDrawn) {
      // Soft outer ambient glow ring
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius + 10, 0, Math.PI * 2);
      context.strokeStyle = "rgba(220, 38, 38, 0.15)";
      context.lineWidth = 10;
      context.stroke();

      const avatarGrad = context.createRadialGradient(
        avatarCenterX - 40,
        avatarCenterY - 40,
        20,
        avatarCenterX,
        avatarCenterY,
        avatarRadius
      );
      avatarGrad.addColorStop(0, "#ef4444");
      avatarGrad.addColorStop(0.5, "#dc2626");
      avatarGrad.addColorStop(1, "#881337");
      context.fillStyle = avatarGrad;
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      context.fill();

      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      context.strokeStyle = "#ffffff";
      context.lineWidth = 6;
      context.stroke();

      drawCenter(
        player.name ? player.name.charAt(0) : "ك",
        avatarCenterX,
        avatarCenterY + 48,
        "900 135px Cairo, sans-serif",
        "#ffffff"
      );
    }

    // Athlete Details (Evenly spaced in the right area)
    const displayNameWithFile = player.fileNumber
      ? `${player.name}  (#${player.fileNumber})`
      : player.name;
    drawRight(displayNameWithFile, 965, 310, "900 44px Cairo, sans-serif", "#0f172a");
    drawRight(`🥋 الحزام: ${player.belt || "أبيض"}  •  المستوى: ${player.level || "A"}`, 965, 360, "800 27px Cairo, sans-serif", "#b91c1c");
    drawRight(`🏢 الصالة: ${player.branch}`, 965, 410, "700 25px Cairo, sans-serif", "#334155");
    drawRight(`🎂 السن: ${currentAge} سنة`, 965, 458, "700 25px Cairo, sans-serif", "#334155");
    if (guardianPhone) {
      drawRight(`📞 ولي الأمر: ${guardianPhone}`, 965, 506, "700 25px Cairo, sans-serif", "#047857");
    }
    drawRight(`📅 تاريخ التسجيل: ${registrationDate}`, 965, 552, "600 22px Cairo, sans-serif", "#94a3b8");

    // ─── Financial Status Section: 2 Side-by-Side Cards (Width: 456px each) ───
    // Card 1 (Right): اشتراك الشهر
    const mIsPaid = mStatus === "paid";
    const mIsPartial = mStatus === "partially_paid";
    context.fillStyle = mIsPaid ? "#f0fdf4" : mIsPartial ? "#fffbeb" : "#fef2f2";
    context.beginPath();
    context.roundRect(552, 636, 456, 155, 20);
    context.fill();
    context.strokeStyle = mIsPaid ? "#86efac" : mIsPartial ? "#fde68a" : "#fca5a5";
    context.lineWidth = 2.5;
    context.stroke();

    drawRight(`💳 اشتراك شهر ${paymentMonth}`, 552 + 456 - 22, 676, "800 23px Cairo, sans-serif", mIsPaid ? "#065f46" : mIsPartial ? "#92400e" : "#991b1b");
    const mStatusText = mIsPaid
      ? "مدفوع بالكامل ✓"
      : mIsPartial
      ? `سداد جزئي (${mPaid} ج.م)`
      : (mHasConfigured ? "غير مسدد ⚠️" : "لم يدفع ⚠️");
    drawCenter(mStatusText, 552 + 228, 725, "900 34px Cairo, sans-serif", mIsPaid ? "#047857" : mIsPartial ? "#b45309" : "#b91c1c");
    const mSubText = mIsPaid
      ? (mHasConfigured ? `سدد ${mPaid} ج.م من أصل ${mTotal} ج.م` : "تم سداد الاشتراك بالكامل ✓")
      : mIsPartial
      ? (mHasConfigured ? `فاضل عليه: ${mRemaining} ج.م (من ${mTotal})` : `سدد ${mPaid} ج.م`)
      : (mHasConfigured ? `المبلغ المطلوب: ${mTotal || mRemaining} ج.م` : "لم يدفع");
    drawCenter(mSubText, 552 + 228, 766, "700 21px Cairo, sans-serif", mIsPaid ? "#065f46" : mIsPartial ? "#b45309" : "#9f1239");

    // Card 2 (Left): المشتريات والبدل والأدوات
    const hasGearDebt = pSummary.remainingAmount > 0;
    const hasPurchases = pSummary.count > 0;
    context.fillStyle = hasGearDebt ? "#fffbeb" : hasPurchases ? "#f0fdf4" : "#f8fafc";
    context.beginPath();
    context.roundRect(72, 636, 456, 155, 20);
    context.fill();
    context.strokeStyle = hasGearDebt ? "#fde68a" : hasPurchases ? "#86efac" : "#e2e8f0";
    context.lineWidth = 2.5;
    context.stroke();

    drawRight("🥋 المشتريات والبدل والأدوات", 72 + 456 - 22, 676, "800 23px Cairo, sans-serif", hasGearDebt ? "#92400e" : hasPurchases ? "#065f46" : "#475569");
    let gearStatusText = "الحساب خالص ✓";
    let gearSubText = "لا توجد مديونية أدوات مسجلة";
    if (hasGearDebt) {
      gearStatusText = `باقي عليه: ${pSummary.remainingAmount} ج.م ⚠️`;
      if (unpdPurchases.length === 1) {
        const item = unpdPurchases[0];
        gearSubText = `${item.title}: دفع ${item.paidAmount} من ${item.totalAmount} ج.م`;
      } else {
        gearSubText = `دفع ${pSummary.paidAmount} من إجمالي ${pSummary.totalAmount} ج.م`;
      }
    } else if (hasPurchases) {
      gearStatusText = `مسددة بالكامل (${pSummary.totalAmount} ج.م) ✓`;
      gearSubText = "تم سداد كافة المستلزمات والبدل";
    }
    drawCenter(gearStatusText, 72 + 228, 725, "900 32px Cairo, sans-serif", hasGearDebt ? "#b45309" : hasPurchases ? "#047857" : "#334155");
    drawCenter(gearSubText, 72 + 228, 766, "700 21px Cairo, sans-serif", hasGearDebt ? "#92400e" : hasPurchases ? "#065f46" : "#64748b");

    // ─── Attendance Summary Chips (Side-by-Side) ───
    context.fillStyle = "#ecfdf5";
    context.beginPath();
    context.roundRect(552, 808, 456, 62, 16);
    context.fill();
    context.strokeStyle = "#a7f3d0";
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter(`✅ حضور التدريبات: ${attendedSessions} من ${totalSessions} حصة مسجلة`, 552 + 228, 847, "800 22px Cairo, sans-serif", "#047857");

    context.fillStyle = "#f1f5f9";
    context.beginPath();
    context.roundRect(72, 808, 456, 62, 16);
    context.fill();
    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 1.5;
    context.stroke();
    const rateNote = attRate >= 75 ? "ممتاز 🌟" : attRate >= 50 ? "جيد 👍" : "يحتاج متابعة ⚠️";
    drawCenter(`📋 نسبة الالتزام: ${attRate}% (${rateNote})`, 72 + 228, 847, "800 22px Cairo, sans-serif", "#1e293b");

    // ─── Section 1: Attendance History ───
    drawRight("🥋 آخر سجلات الحضور والغياب (التدريبات)", 1008, 905, "900 28px Cairo, sans-serif", "#0f172a");
    let y = 926;
    const attList = attendanceHistory.slice(0, 4);
    if (attList.length === 0) {
      context.fillStyle = "#f8fafc";
      context.beginPath();
      context.roundRect(72, y, 936, 44, 12);
      context.fill();
      context.strokeStyle = "#e2e8f0";
      context.lineWidth = 1.5;
      context.stroke();
      drawCenter("لا يوجد سجل حضور مسجل بعد", 72 + 468, y + 30, "700 20px Cairo, sans-serif", "#64748b");
      y += 54;
    } else {
      for (const item of attList) {
        const isPres = item.status === "present";
        context.fillStyle = isPres ? "#f0fdf4" : "#fef2f2";
        context.beginPath();
        context.roundRect(72, y, 936, 42, 12);
        context.fill();
        context.strokeStyle = isPres ? "#bbf7d0" : "#fecaca";
        context.lineWidth = 1.5;
        context.stroke();

        const dayName = item.dayName || getArabicDayName(item.date);
        const dayLabel = dayName ? `${dayName} (${item.date})` : item.date;
        drawRight(`📅 ${dayLabel}`, 1008 - 20, y + 29, "700 22px Cairo, sans-serif", isPres ? "#166534" : "#991b1b");
        drawLeft(isPres ? "حاضر التدريب اليوم ✓" : "غائب عن الحصة ×", 72 + 20, y + 29, "800 22px Cairo, sans-serif", isPres ? "#15803d" : "#b91c1c");
        y += 50;
      }
    }

    // ─── Section 2: Active Month Financial Status ───
    y = Math.max(y + 15, 1140);
    drawRight(`💳 تفاصيل اشتراك شهر ${monthLabel}`, 1008, y, "900 28px Cairo, sans-serif", "#0f172a");
    y += 24;

    context.fillStyle = mIsPaid ? "#f0fdf4" : mIsPartial ? "#fffbeb" : "#fef2f2";
    context.beginPath();
    context.roundRect(72, y, 936, 68, 16);
    context.fill();
    context.strokeStyle = mIsPaid ? "#86efac" : mIsPartial ? "#fde68a" : "#fca5a5";
    context.lineWidth = 2;
    context.stroke();

    drawRight(
      mIsPaid
        ? `✓ تم سداد اشتراك شهر ${monthLabel} بالكامل (${mPaid} ج.م)`
        : mIsPartial
        ? `⚠️ سداد جزئي: سدد ${mPaid} ج.م  •  فاضل عليه: ${mRemaining} ج.م`
        : mHasConfigured
        ? `⚠️ لم يسدد اشتراك شهر ${monthLabel} (المبلغ المطلوب: ${mTotal || mRemaining} ج.م)`
        : `⚠️ لم يتم سداد اشتراك شهر ${monthLabel}`,
      1008 - 24,
      y + 42,
      "800 26px Cairo, sans-serif",
      mIsPaid ? "#166534" : mIsPartial ? "#92400e" : "#991b1b"
    );

    drawLeft(
      mIsPaid ? "خالص ✓" : mIsPartial ? "سداد جزئي" : "غير مدفوع",
      72 + 24,
      y + 42,
      "900 24px Cairo, sans-serif",
      mIsPaid ? "#15803d" : mIsPartial ? "#b45309" : "#b91c1c"
    );
    y += 82;

    // ─── Section 3: Gear & Purchases Details ───
    y = Math.max(y + 15, 1325);
    drawRight("🛍️ بيان المشتريات والبدل والأدوات المسجلة", 1008, y, "900 28px Cairo, sans-serif", "#0f172a");
    y += 22;
    const purchasesToShow = purchasesList.slice(0, 4);
    if (purchasesToShow.length === 0) {
      context.fillStyle = "#f0fdf4";
      context.beginPath();
      context.roundRect(72, y, 936, 50, 14);
      context.fill();
      context.strokeStyle = "#86efac";
      context.lineWidth = 1.5;
      context.stroke();
      drawCenter("لا توجد أي مستلزمات أو بدل مسجلة بحساب اللاعب (الحساب خالص بالكامل ✓)", 72 + 468, y + 33, "800 22px Cairo, sans-serif", "#047857");
      y += 62;
    } else {
      for (const p of purchasesToShow) {
        const pTot = Number(p.totalAmount) || 0;
        const pPaid = Number(p.paidAmount) || 0;
        const pRem = Math.max(0, pTot - pPaid);
        const pIsPaid = pRem === 0 && pTot > 0;

        context.fillStyle = pIsPaid ? "#f0fdf4" : "#fffbeb";
        context.beginPath();
        context.roundRect(72, y, 936, 50, 14);
        context.fill();
        context.strokeStyle = pIsPaid ? "#86efac" : "#fcd34d";
        context.lineWidth = 1.8;
        context.stroke();

        // Right side: Item name & price & delivery status
        const isDelivered = p.deliveryStatus === "received";
        const delTag = isDelivered ? "استلم ✓" : "لم يستلم ⏳";
        const titleStr = `🥋 ${p.title} (${delTag})  •  سعرها: ${pTot} ج.م`;
        drawRight(titleStr, 1008 - 20, y + 33, "800 23px Cairo, sans-serif", pIsPaid ? "#065f46" : "#78350f");

        // Left side: Paid & Remaining details
        const payStr = pIsPaid
          ? `مسددة بالكامل (${pPaid} ج.م) ✓`
          : `سدد: ${pPaid} ج.م  •  فاضل عليه: ${pRem} ج.م ⚠️`;
        drawLeft(payStr, 72 + 20, y + 33, "900 23px Cairo, sans-serif", pIsPaid ? "#047857" : "#b45309");

        y += 58;
      }

      // Summary Pill for purchases
      context.fillStyle = "#f8fafc";
      context.beginPath();
      context.roundRect(72, y, 936, 46, 12);
      context.fill();
      context.strokeStyle = "#cbd5e1";
      context.lineWidth = 1.5;
      context.stroke();

      const summaryStr = `إجمالي المشتريات: ${pSummary.totalAmount} ج.م   •   المسدد: ${pSummary.paidAmount} ج.م   •   المتبقي الإجمالي: ${pSummary.remainingAmount} ج.م`;
      drawCenter(summaryStr, 72 + 468, y + 30, "800 21px Cairo, sans-serif", pSummary.remainingAmount > 0 ? "#b45309" : "#047857");
      y += 56;
    }

    // ─── Footer ───
    context.fillStyle = "#e2e8f0";
    context.fillRect(72, canvas.height - 100, canvas.width - 144, 2);

    drawRight(
      `تم استخراج البطاقة رسميًا من ${academyName || "الأكاديمية"}  •  ${new Date().toLocaleDateString("ar-EG")}`,
      canvas.width - 80,
      canvas.height - 58,
      "600 22px Cairo, sans-serif",
      "#94a3b8",
    );

    return canvas;
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
            <form onSubmit={saveInfo} className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900">تعديل بيانات اللاعب</h2>
                <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">قم بتحديث معلومات اللاعب ثم اضغط حفظ التعديلات</p>
              </div>

              {/* اسم اللاعب ورقم الملف */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم اللاعب</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    placeholder="مثال: أحمد محمد"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                    <span>رقم الملف</span>
                    <span className="text-[10px] font-normal text-slate-400">اختياري</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                    value={editFileNumber}
                    onChange={(e) => setEditFileNumber(toEnglishDigits(e.target.value))}
                    placeholder="مثال: 104"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    تاريخ الميلاد (يوم / شهر / سنة)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                      <span>العمر المحسوب: {calculatedEditAge === 0 ? "أقل من سنة" : `${calculatedEditAge} سنة`}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    الفرع / الصالة
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 cursor-pointer"
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
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
                  <label htmlFor="edit-guardian-phone-input" className="text-xs font-extrabold text-slate-700">
                    رقم ولي الأمر <span className="text-slate-400 font-normal text-[11px]">(للواتساب)</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {/* زر لصق سريع */}
                    <button
                      type="button"
                      onClick={handleEditPastePhone}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 transition active:scale-95 cursor-pointer"
                      title="لصق الرقم المنسوخ من الحافظة بنقرة واحدة"
                    >
                      <Clipboard className="h-3 w-3 text-slate-500" />
                      <span>لصق 📋</span>
                    </button>

                    {/* زر سجل الهاتف */}
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
                </div>
                <input
                  ref={editPhoneInputRef}
                  id="edit-guardian-phone-input"
                  name="tel"
                  autoComplete="tel"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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

                {/* دليل مستخدمي الآيفون لاستيراد جهات الاتصال */}
                {showEditIOSContactGuide && (
                  <div className="mt-2 p-3 rounded-2xl bg-amber-50/95 border border-amber-200/90 text-xs text-amber-950 space-y-2 animate-slide-up shadow-2xs">
                    <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                        <span>🍎</span>
                        <span>طرق استيراد الرقم على الآيفون:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEditIOSContactGuide(false)}
                        className="text-amber-600 hover:text-amber-900 font-black text-xs p-1 cursor-pointer"
                        aria-label="إغلاق التنبيه"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-1.5 text-[11px] font-semibold text-amber-900/90 leading-relaxed">
                      <p>
                        <strong>1. التعبئة التلقائية:</strong> اضغط على حقل الرقم وسيظهر لك زر <strong>&quot;تعبئة جهة اتصال&quot;</strong> أعلى لوحة المفاتيح لاختيار الرقم فوراً من سجل هاتفك.
                      </p>
                      <p>
                        <strong>2. اللصق الفوري:</strong> انسخ رقم ولي الأمر من واتساب واضغط زر <strong>&quot;لصق 📋&quot;</strong> لإضافته بنقرة واحدة.
                      </p>
                      <p className="text-[10px] text-amber-800/80 pt-1 border-t border-amber-200/50">
                        💡 لتفعيل نافذة جهات الاتصال المباشرة كما في أندرويد: افتح <strong>إعدادات الآيفون &gt; Safari &gt; خيارات متقدمة &gt; Feature Flags</strong> وفعّل <strong>Contact Picker API</strong>.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  صورة اللاعب الشخصية
                </label>
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <input
                    className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-[11px] sm:text-xs text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-red-100 file:px-2.5 file:py-1 file:text-xs file:font-black file:text-red-700 hover:file:bg-red-200 cursor-pointer"
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
                        className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  قيمة اشتراك الشهر الثابت للاعب (ج.م) - اختياري
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                  type="text"
                  inputMode="numeric"
                  value={editDefaultTotalAmount}
                  onChange={(e) =>
                    setEditDefaultTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
                  }
                  placeholder="اتركه فارغاً إذا لم تحدد اشتراكاً ثابتاً لهذا اللاعب"
                />
                <p className="mt-1 text-[11px] text-slate-400">
                  إذا تم تحديد قيمة هنا، سيتم اعتمادها تلقائياً لكل الشهور القادمة ويمكنك تعديلها في أي وقت.
                </p>
              </div>

              <div className="pt-2 grid gap-2 sm:grid-cols-2">
                <button
                  className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer transition touch-manipulation"
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
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition touch-manipulation"
                  type="button"
                  onClick={() => setIsEditing(false)}
                >
                  إلغاء
                </button>
              </div>
            </form>
          ) : (
            /* ════════════ العرض الأساسي - تطبيق موبايل أصيل ════════════ */
            <>
              {/* 1. كارت هوية اللاعب وشبكة الإجراءات السريعة (App Profile Header) */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  {/* صورة / أفاتار اللاعب بحزام الكاراتيه مع إشارة التكبير */}
                  <div
                    onClick={() => {
                      if (player.photo) setShowZoomPhoto(true);
                    }}
                    className={`relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 font-cairo text-2xl sm:text-3xl font-black text-white shadow-xs ring-4 ring-offset-2 ring-offset-white ${beltStyle.border} ${
                      player.photo ? "cursor-pointer hover:scale-105 transition-transform group" : ""
                    }`}
                    title={player.photo ? "انقر لتكبير صورة اللاعب 🔍" : player.name}
                  >
                    {player.photo ? (
                      <>
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <Maximize2 className="h-5 w-5 text-white drop-shadow" />
                        </div>
                      </>
                    ) : (
                      <span>{player.name.charAt(0)}</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="truncate font-cairo text-base sm:text-xl font-black text-slate-900 leading-tight">
                        {player.name}
                      </h2>
                      {player.fileNumber && (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                          <span className="text-amber-400 font-bold">ملف:</span>
                          <span>#{player.fileNumber}</span>
                        </span>
                      )}
                      {isNew && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                          <Sparkles className="h-3 w-3 text-amber-200" />
                          <span>بطل جديد</span>
                        </span>
                      )}
                    </div>

                    {/* شارات الهوية المنظمة */}
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold shadow-2xs ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                        <span className={`h-2 w-2 rounded-full ${beltStyle.dot}`} />
                        🥋 حزام {player.belt || "أبيض"}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        🏢 {player.branch}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
                        🎂 {currentAge} سنة
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-black text-red-700">
                        مستوى {player.level || "A"}
                      </span>
                    </div>

                    <span className="mt-1.5 block text-[10px] sm:text-[11px] font-medium text-slate-400">
                      عضو منذ: {registrationDate}
                    </span>
                  </div>
                </div>

                {/* بنر سياقي ذكي (يظهر فقط إذا كان هناك مناسبة خاصة أو كارت ترحيب متاح - بدون تكرار) */}
                {hasActiveBirthday ? (
                  <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-3 shadow-2xs flex items-center justify-between gap-3 animate-slide-up">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-2xl shrink-0 animate-bounce">🎂</span>
                      <div className="min-w-0">
                        <strong className="block font-cairo text-xs sm:text-sm font-black text-rose-950 truncate">
                          {birthdayInfo.isToday ? `اليوم عيد ميلاد ${player.name}!` : `غداً عيد ميلاد ${player.name}!`}
                        </strong>
                        <span className="block text-[11px] font-bold text-amber-900 truncate">
                          يُتم {birthdayInfo.turningAge} عاماً · كل عام وبطلنا بألف خير! 🎉
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isSendingBirthdayText}
                        onClick={shareBirthdayText}
                        className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-60"
                        title="إرسال تهنئة عبر واتساب"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="hidden xs:inline">تهنئة واتساب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBirthdayModal(true)}
                        className="flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-black text-amber-900 shadow-2xs hover:bg-amber-50 active:scale-95 transition cursor-pointer"
                        title="معاينة كارت عيد الميلاد"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-700" />
                        <span>الكارت</span>
                      </button>
                    </div>
                  </div>
                ) : showWelcomeCardButton ? (
                  <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 p-3 shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs text-sm">
                        🥋
                      </div>
                      <div className="min-w-0">
                        <strong className="block font-cairo text-xs sm:text-sm font-black text-emerald-950 truncate">
                          مرحباً ببطلنا الجديد في الأكاديمية!
                        </strong>
                        <span className="block text-[11px] font-medium text-emerald-800 truncate">
                          كارت الترحيب جاهز للمشاركة على السوشيال ميديا ✨
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowWelcomeCardModal(true)}
                      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer ring-2 ring-emerald-300/60"
                      title="معاينة كارت الترحيب بالبطل"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                      <span>كارت الترحيب</span>
                    </button>
                  </div>
                ) : null}

                {/* شبكة الإجراءات السريعة الأربعة - تطبيق أصيل (4 Quick Action Buttons) */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-2">
                  {/* 1. واتساب ولي الأمر */}
                  {guardianPhone ? (
                    <button
                      type="button"
                      onClick={openGuardianChat}
                      disabled={isOpeningChat}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 py-2.5 px-1 text-emerald-900 transition active-press cursor-pointer touch-manipulation disabled:opacity-60 shadow-2xs"
                      title="فتح محادثة واتساب مع ولي الأمر"
                    >
                      <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-black truncate max-w-full">واتساب</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEditing("")}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 py-2.5 px-1 text-slate-500 transition active-press cursor-pointer touch-manipulation"
                      title="إضافة رقم ولي الأمر"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold truncate max-w-full">+ هاتف</span>
                    </button>
                  )}

                  {/* 2. اتصال هاتفي مباشر */}
                  {guardianPhone ? (
                    <a
                      href={`tel:${guardianPhone}`}
                      onClick={handlePhoneCallClick}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 py-2.5 px-1 text-blue-900 transition active-press touch-manipulation shadow-2xs text-center"
                      title="اتصال هاتفي مباشر"
                    >
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-black truncate max-w-full">اتصال</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 border border-slate-200 py-2.5 px-1 text-slate-300 opacity-60 cursor-not-allowed text-center"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <span className="text-[11px] font-bold truncate max-w-full">اتصال</span>
                    </button>
                  )}

                  {/* 3. تقرير نصي فوري */}
                  <button
                    type="button"
                    disabled={isSendingText}
                    onClick={() => shareReportText(reportMonth)}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 py-2.5 px-1 text-slate-800 transition active-press cursor-pointer touch-manipulation disabled:opacity-60 shadow-2xs"
                    title={`إرسال تقرير شهر ${formatArabicMonth(reportMonth)} لولي الأمر عبر واتساب`}
                  >
                    <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xs">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-black truncate max-w-full">تقرير فوري</span>
                  </button>

                  {/* 4. كارت ID اللاعب */}
                  <button
                    type="button"
                    onClick={() => setShowCardModal(true)}
                    className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200/80 py-2.5 px-1 text-red-900 transition active-press cursor-pointer touch-manipulation shadow-2xs"
                    title={`معاينة ومشاركة كارت شهر ${formatArabicMonth(reportMonth)}`}
                  >
                    <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
                      <Eye className="h-4 w-4" />
                    </div>
                    <span className="text-[11px] font-black truncate max-w-full">كارت اللاعب</span>
                  </button>
                </div>

                {/* شريط تبديل شهر التقرير والكارت في البروفايل */}
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-100 border border-slate-200/80 px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 min-w-0">
                    <Calendar className="h-3.5 w-3.5 text-red-600 shrink-0" />
                    <span className="truncate">شهر التقرير والكارت:</span>
                    <span className="text-red-700 font-extrabold truncate">{formatArabicMonth(reportMonth)}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = reportMonth.split("-").map(Number);
                        const d = new Date(y, m - 2, 1);
                        setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] active:scale-95 cursor-pointer"
                      title="الشهر السابق"
                    >
                      ◀ السابق
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const [y, m] = reportMonth.split("-").map(Number);
                        const d = new Date(y, m, 1);
                        setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] active:scale-95 cursor-pointer"
                      title="الشهر التالي"
                    >
                      التالي ▶
                    </button>
                  </div>
                </div>
              </div>

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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
                  {/* العمود الرئيسي (المعاملات المالية ونسب الالتزام) */}
                  <div className="lg:col-span-7 space-y-3.5 sm:space-y-4">
                    {/* كارت اشتراك الشهر الحالي المطور */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/70 shadow-xs">
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
                      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
                        <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center shadow-2xs">
                          <span className="block text-[10px] font-bold text-slate-500">المطلوب</span>
                          {totalAmount > 0 ? (
                            <strong className="font-cairo text-sm sm:text-base font-black text-slate-800">
                              {totalAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                            </strong>
                          ) : (
                            <strong className="font-cairo text-xs font-bold text-slate-500">
                              غير محدد
                            </strong>
                          )}
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-emerald-200/80 p-2.5 text-center shadow-2xs">
                          <span className="block text-[10px] font-bold text-emerald-700">المدفوع</span>
                          <strong className="font-cairo text-sm sm:text-base font-black text-emerald-700">
                            {paidAmount} <span className="text-[9px] font-normal text-emerald-500">ج.م</span>
                          </strong>
                        </div>
                        <div className={`rounded-xl bg-slate-50 border p-2.5 text-center shadow-2xs ${
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
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                          <span>نسبة السداد:</span>
                          <span className="font-black text-slate-800">{paymentRate}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
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
                          className="flex-1 h-10 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white font-cairo text-xs font-black shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 touch-manipulation"
                        >
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>تسجيل / تعديل الدفعة</span>
                        </button>

                        {monthlyStatus !== "paid" && (
                          <button
                            type="button"
                            disabled={isTogglingPayment}
                            onClick={() => handleToggleMonthlyPayment()}
                            className="h-10 px-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-cairo text-xs font-black active:scale-95 transition cursor-pointer shrink-0 touch-manipulation"
                          >
                            {isTogglingPayment ? "جاري..." : "سداد كامل ✓"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* كارت الإحصائيات الحيوية الثلاثية (بدون تكرار لاشتراك الشهر) */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
                      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 text-center shadow-2xs">
                        <strong className="block font-cairo text-lg sm:text-2xl font-black text-slate-900">
                          {attendanceRate}%
                        </strong>
                        <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                          نسبة الالتزام
                        </span>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-4 text-center shadow-2xs">
                        <strong className="block font-cairo text-lg sm:text-2xl font-black text-slate-900">
                          {attended} <span className="text-[10px] sm:text-xs text-slate-400 font-normal">/ {totalAttendanceCount}</span>
                        </strong>
                        <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                          حصة حضور
                        </span>
                      </div>

                      {/* كارت متبقي المشتريات / المستلزمات (معلومة حيوية بدلاً من تكرار الاشتراك) */}
                      <div
                        className={`rounded-2xl border p-3 sm:p-4 text-center cursor-pointer transition active:scale-95 shadow-2xs ${
                          purchasesSummary.remainingAmount > 0
                            ? "border-amber-300 bg-amber-50/70"
                            : "border-slate-200/80 bg-white"
                        }`}
                        onClick={() => setMobileProfileTab("purchases")}
                        title="انقر لعرض تفاصيل مشتريات ومستلزمات اللاعب"
                      >
                        <strong
                          className={`block font-cairo text-base sm:text-xl font-black truncate ${
                            purchasesSummary.remainingAmount > 0 ? "text-amber-950" : "text-emerald-700"
                          }`}
                        >
                          {purchasesSummary.remainingAmount > 0
                            ? `${purchasesSummary.remainingAmount} ج.م`
                            : purchasesSummary.count > 0
                              ? "خالص ✓"
                              : "لا يوجد"}
                        </strong>
                        <span className="mt-0.5 block text-[10px] sm:text-[11px] font-semibold text-slate-500 truncate">
                          {purchasesSummary.remainingAmount > 0 ? "متبقي مشتريات" : "رصيد المستلزمات"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* العمود الجانبي (بيانات العضوية والتواصل) */}
                  <div className="lg:col-span-5 space-y-3.5 sm:space-y-4">
                    {/* بطاقة معلومات ولي الأمر والعضوية */}
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                            <Phone className="h-3.5 w-3.5 text-slate-600" />
                          </div>
                          <span className="text-xs font-black text-slate-900 font-cairo">بيانات العضوية والتواصل</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditing()}
                          className="text-[11px] font-bold text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer transition active:scale-95"
                          title="تعديل البيانات"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>تعديل</span>
                        </button>
                      </div>

                      <div className="space-y-2 text-xs">
                        {player.fileNumber && (
                          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="font-bold text-slate-500 text-[11px]">رقم ملف اللاعب</span>
                            <span className="font-cairo font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-md border border-slate-200">
                              #{player.fileNumber}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="font-bold text-slate-500 text-[11px]">هاتف ولي الأمر</span>
                          {guardianPhone ? (
                            <span className="font-cairo font-black text-slate-900 tracking-wider" dir="ltr">
                              {guardianPhone}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditing("")}
                              className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                            >
                              + إضافة رقم
                            </button>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="font-bold text-slate-500 text-[11px]">الفرع والتدريب</span>
                          <span className="font-bold text-slate-800 text-[11px]">{player.branch} • حزام {player.belt || "أبيض"}</span>
                        </div>

                        {player.notes && (
                          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/60 text-[11px] text-amber-950 font-medium">
                            <span className="font-bold text-amber-900 block mb-0.5">ملاحظات الكابتن:</span>
                            <p className="line-clamp-2 leading-relaxed">{player.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* كارت ملخص المشتريات إن وُجدت */}
                    {purchasesSummary.count > 0 && (
                      <div
                        onClick={() => setMobileProfileTab("purchases")}
                        className={`flex items-center justify-between rounded-2xl border p-3.5 cursor-pointer transition active:scale-98 shadow-2xs ${
                          purchasesSummary.remainingAmount > 0
                            ? "border-amber-300 bg-amber-50/70 text-amber-950 hover:bg-amber-100/80"
                            : "border-emerald-200 bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/80"
                        }`}
                        title="انقر لعرض تفاصيل المشتريات"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-xl shrink-0 ${
                              purchasesSummary.remainingAmount > 0
                                ? "bg-amber-100 text-amber-700 border border-amber-300"
                                : "bg-emerald-100 text-emerald-700 border border-emerald-300"
                            }`}
                          >
                            <ShoppingBag className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <strong className="text-xs font-black block font-cairo truncate">
                              مشتريات ومستلزمات ({purchasesSummary.count} مسجلة)
                            </strong>
                            <span className="text-[10px] font-bold opacity-80 truncate block">
                              {purchasesSummary.remainingAmount > 0
                                ? (unpaidPurchases.length === 1
                                    ? `${unpaidPurchases[0].title || "السلعة"}: باقي ${unpaidPurchases[0].remainingAmount} ج.م`
                                    : `سدد ${purchasesSummary.paidAmount} • باقي ${purchasesSummary.remainingAmount} ج.م`)
                                : `مسددة بالكامل (${purchasesSummary.totalAmount} ج.م) ✓`}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                            purchasesSummary.remainingAmount > 0
                              ? "bg-amber-200 text-amber-900"
                              : "bg-emerald-200 text-emerald-900"
                          }`}
                        >
                          {purchasesSummary.remainingAmount > 0 ? "يوجد متبقي" : "خالص ✓"}
                        </span>
                      </div>
                    )}

                    {/* زر حذف اللاعب النهائي */}
                    <button
                      type="button"
                      className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-white hover:bg-rose-50/50 p-3 text-xs font-bold text-rose-700 transition hover:border-rose-300 active:scale-98 cursor-pointer shadow-2xs touch-manipulation"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 text-rose-500" />
                      <span>حذف اللاعب نهائيًا من الأكاديمية</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* قسم 2: سجل الحضور والغياب */}
              <div className={mobileProfileTab === "attendance" ? "block" : "hidden"}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
                  {/* سجل الحضور */}
                  <div className="lg:col-span-7">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                            سجل الحضور والغياب
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {activeMonthAttendance.sessions.length} حصة ({formatArabicMonth(reportMonth)})
                        </span>
                      </div>

                      {!activeMonthAttendance.sessions || activeMonthAttendance.sessions.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold">لا توجد حصص تدريبية مسجلة خلال هذا الشهر.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 sm:max-h-80 lg:max-h-[380px] overflow-y-auto pr-1">
                          {[...activeMonthAttendance.sessions].reverse().map((item) => (
                            <div
                              className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs gap-2"
                              key={item.date}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="font-extrabold text-slate-900 truncate">
                                  {item.dayName || getArabicDayName(item.date)}
                                </span>
                                <span className="text-slate-500 text-[11px] font-medium font-mono shrink-0">
                                  ({item.date})
                                </span>
                                {item.isAutoAbsent && (
                                  <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-1.5 py-0.2 rounded-md shrink-0">
                                    غياب تلقائي
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                                  className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer touch-manipulation ${
                                    item.status === "present"
                                      ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                      : "bg-rose-600 text-white hover:bg-rose-700"
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
                                {!item.isAutoAbsent && (
                                  <button
                                    disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer touch-manipulation"
                                    onClick={() => handleDeletePastAttendance(item.date)}
                                    title="حذف من السجل"
                                  >
                                    {deletingAttendanceDate === item.date ? (
                                      <span className="h-3 w-3 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* إضافة حصة حضور مخصصة */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                          <Plus className="h-4 w-4 stroke-[3]" />
                        </div>
                        <div>
                          <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                            تسجيل حصة مخصصة
                          </h3>
                          <p className="text-[10px] text-slate-400">سجل حضور أو غياب بتاريخ محدد</p>
                        </div>
                      </div>

                      <form onSubmit={addCustomAttendance} className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            تاريخ الحصة
                          </label>
                          <input
                            type="date"
                            max={today}
                            value={customAttendanceDate}
                            onChange={(e) => setCustomAttendanceDate(e.target.value)}
                            className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">
                            حالة الحضور
                          </label>
                          <select
                            value={customAttendanceStatus}
                            onChange={(e) => setCustomAttendanceStatus(e.target.value)}
                            className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white cursor-pointer"
                          >
                            <option value="present">حاضر ✓</option>
                            <option value="absent">غائب ×</option>
                          </select>
                        </div>

                        <button
                          className="min-h-10 w-full rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                          type="submit"
                          disabled={isSavingAttendance}
                        >
                          {isSavingAttendance ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                              <span>جاري التسجيل...</span>
                            </span>
                          ) : (
                            "+ إضافة الحصة للسجل"
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم 3: سجل الاشتراكات السابقة */}
              <div className={mobileProfileTab === "payments" ? "block" : "hidden"}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
                  {/* سجل الاشتراكات */}
                  <div className="lg:col-span-7">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                            سجل الاشتراكات السابقة
                          </h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {(player.paymentHistory || []).length} شهر مسجل
                        </span>
                      </div>

                      {!player.paymentHistory || player.paymentHistory.length === 0 ? (
                        <div className="py-12 text-center text-slate-400">
                          <CreditCard className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-bold">لا توجد اشتراكات مسجلة بعد.</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 sm:max-h-80 lg:max-h-[380px] overflow-y-auto pr-1">
                          {[...player.paymentHistory].reverse().map((item) => {
                            const itemHasFee =
                              item.totalAmount !== undefined && item.totalAmount !== null && Number(item.totalAmount) > 0;
                            const itemTotal = itemHasFee
                              ? Number(item.totalAmount)
                              : (player?.defaultTotalAmount
                                  ? Number(player.defaultTotalAmount)
                                  : (player?.totalAmount && Number(player.totalAmount) > 0 ? Number(player.totalAmount) : 0));
                            const hasFee = itemTotal > 0;
                            const itemPaid = item.paidAmount !== undefined ? Number(item.paidAmount) : (item.status === "paid" && hasFee ? itemTotal : 0);
                            const itemRem = hasFee ? Math.max(0, itemTotal - itemPaid) : 0;
                            const isItemPaid = hasFee ? (itemPaid >= itemTotal && itemTotal > 0) : item.status === "paid";
                            const isItemPartial = itemPaid > 0 && !isItemPaid;

                            return (
                              <div
                                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs gap-2"
                                key={item.month}
                              >
                                <div>
                                  <span className="font-bold text-slate-800 block sm:inline">{item.month}</span>
                                  <span className="text-[11px] font-semibold text-slate-500 sm:mr-2">
                                    {hasFee
                                      ? `(دفع: ${itemPaid} ج.م • متبقي: ${itemRem} ج.م)`
                                      : (itemPaid > 0 ? `(دفع: ${itemPaid} ج.م)` : "(غير مسدد)")}
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
                                        hasConfiguredAmount: hasFee,
                                        status: isItemPaid ? "paid" : isItemPartial ? "partially_paid" : "unpaid",
                                      });
                                      setShowPaymentModal(true);
                                    }}
                                    className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer touch-manipulation ${
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
                                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer touch-manipulation"
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
                    </div>
                  </div>

                  {/* إضافة اشتراك شهر مخصص */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                          <Plus className="h-4 w-4 stroke-[3]" />
                        </div>
                        <div>
                          <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                            تسجيل اشتراك شهر محدد
                          </h3>
                          <p className="text-[10px] text-slate-400">سجل أو حدد اشتراك لأي شهر</p>
                        </div>
                      </div>

                      <form onSubmit={addCustomPayment} className="space-y-3 pt-1">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">الشهر</label>
                          <input
                            type="month"
                            value={customPaymentMonth}
                            onChange={(e) => setCustomPaymentMonth(e.target.value)}
                            className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white cursor-pointer"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">المطلوب (ج.م)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={customTotalAmount}
                              onChange={(e) => setCustomTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                              placeholder="حدد المطلوب (مثال: 150)"
                              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white text-center"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 mb-1">المدفوع (ج.م)</label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={customPaidAmount}
                              onChange={(e) => setCustomPaidAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))}
                              placeholder="0"
                              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white text-center"
                              required
                            />
                          </div>
                        </div>

                        <button
                          className="min-h-10 w-full rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                          type="submit"
                          disabled={paymentSaving}
                        >
                          {paymentSaving ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                              <span>جاري الحفظ...</span>
                            </span>
                          ) : (
                            "+ حفظ الاشتراك للسجل"
                          )}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              {/* قسم 4: المشتريات والمستلزمات (البدل والأدوات) */}
              <div className={mobileProfileTab === "purchases" ? "space-y-3.5 block" : "hidden"}>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                        <ShoppingBag className="h-4 w-4" />
                      </div>
                      <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                        المشتريات والمستلزمات
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseModalMode("add");
                        setSelectedPurchase(null);
                        setShowPurchaseModal(true);
                      }}
                      className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-2xs hover:brightness-110 active:scale-95 transition cursor-pointer touch-manipulation"
                    >
                      <Plus className="h-3.5 w-3.5 stroke-[3]" />
                      <span>إضافة سلعة / بدلة</span>
                    </button>
                  </div>

                  {/* شريط الإحصائيات عند وجود مشتريات */}
                  {purchasesSummary.count > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2 text-center shadow-2xs">
                        <span className="block text-[10px] font-bold text-slate-500">إجمالي المشتريات</span>
                        <strong className="font-cairo text-xs sm:text-sm font-black text-slate-800">
                          {purchasesSummary.totalAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                        </strong>
                      </div>
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-2 text-center shadow-2xs">
                        <span className="block text-[10px] font-bold text-emerald-700">المسدد</span>
                        <strong className="font-cairo text-xs sm:text-sm font-black text-emerald-700">
                          {purchasesSummary.paidAmount} <span className="text-[9px] font-normal text-emerald-500">ج.م</span>
                        </strong>
                      </div>
                      <div className={`rounded-xl border p-2 text-center shadow-2xs ${
                        purchasesSummary.remainingAmount > 0
                          ? "border-rose-300 bg-rose-50/70"
                          : "border-slate-200/80 bg-slate-50/80"
                      }`}>
                        <span className={`block text-[10px] font-bold ${
                          purchasesSummary.remainingAmount > 0 ? "text-rose-700" : "text-slate-500"
                        }`}>
                          المتبقي
                        </span>
                        <strong className={`font-cairo text-xs sm:text-sm font-black ${
                          purchasesSummary.remainingAmount > 0 ? "text-rose-700" : "text-slate-800"
                        }`}>
                          {purchasesSummary.remainingAmount} <span className="text-[9px] font-normal text-slate-400">ج.م</span>
                        </strong>
                      </div>
                      <div className={`rounded-xl border p-2 text-center shadow-2xs ${
                        purchasesSummary.undeliveredCount > 0
                          ? "border-amber-300 bg-amber-50/80"
                          : "border-emerald-200/80 bg-emerald-50/50"
                      }`}>
                        <span className={`block text-[10px] font-bold ${
                          purchasesSummary.undeliveredCount > 0 ? "text-amber-800" : "text-emerald-700"
                        }`}>
                          حالة الاستلام
                        </span>
                        <strong className={`font-cairo text-xs sm:text-sm font-black ${
                          purchasesSummary.undeliveredCount > 0 ? "text-amber-900" : "text-emerald-700"
                        }`}>
                          {purchasesSummary.undeliveredCount > 0
                            ? `باقي ${purchasesSummary.undeliveredCount} لم يستلم ⏳`
                            : "استلم الكل ✓"}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* قائمة السلع */}
                  {purchasesSummary.count === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500">
                        <ShoppingBag className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-extrabold text-slate-700 mb-1">
                        لا توجد مشتريات أو أدوات مسجلة لهذا اللاعب
                      </p>
                      <p className="text-[11px] text-slate-400 mb-3 max-w-sm mx-auto">
                        يمكنك تسجيل شراء بدلة، حزام، قفازات أو أي أدوات ومتابعة المبالغ المدفوعة والمتبقية بسهولة.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPurchaseModalMode("add");
                          setSelectedPurchase(null);
                          setShowPurchaseModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-black text-red-700 hover:bg-red-100 transition cursor-pointer touch-manipulation"
                      >
                        <Plus className="h-3.5 w-3.5 stroke-[3]" />
                        <span>تسجيل أول سلعة أو بدلة</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 sm:max-h-80 lg:max-h-[420px] overflow-y-auto pr-1">
                      {[...purchasesSummary.purchases].reverse().map((item) => {
                        const tot = Number(item.totalAmount) || 0;
                        const pd = Number(item.paidAmount) || 0;
                        const rem = Math.max(0, tot - pd);
                        const isPaid = pd >= tot && tot > 0;
                        const isPartial = pd > 0 && !isPaid;

                        return (
                          <div
                            key={item.id}
                            className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs space-y-2 flex flex-col justify-between"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <div className="flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-700 font-bold shrink-0">
                                  🥋
                                </span>
                                <div>
                                  <strong className="font-bold text-slate-900 block sm:inline text-xs sm:text-sm">
                                    {item.title}
                                  </strong>
                                  {item.date && (
                                    <span className="text-[10px] font-semibold text-slate-400 sm:mr-2">
                                      ({item.date})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-start sm:self-auto">
                                {/* زر وتأكيد استلام السلعة */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleDelivery(item)}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all cursor-pointer active:scale-95 touch-manipulation border ${
                                    (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received"
                                      ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs"
                                      : "bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100 shadow-2xs"
                                  }`}
                                  title={
                                    (optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received"
                                      ? "استلم اللاعب السلعة ✓ (انقر للتغيير إلى: لم يستلم)"
                                      : "اللاعب لم يستلم السلعة بعد ⏳ (انقر لتسجيل أنه استلم)"
                                  }
                                >
                                  {(optimisticDeliveryMap[item.id] ?? item.deliveryStatus) === "received" ? (
                                    <>
                                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                                      <span>استلم ✓</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="h-3 w-3 text-amber-600" />
                                      <span>لم يستلم ⏳</span>
                                    </>
                                  )}
                                </button>

                                {/* شارة حالة السداد */}
                                <span
                                  className={`px-2 py-1 rounded-lg text-[10px] font-black shrink-0 ${
                                    isPaid
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : isPartial
                                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                                      : "bg-rose-100 text-rose-800 border border-rose-200"
                                  }`}
                                >
                                  {isPaid
                                    ? "✓ مدفوع بالكامل"
                                    : isPartial
                                    ? `دفع ${pd} • باقي ${rem} ج.م`
                                    : `غير مدفوع (باقي ${rem} ج.م)`}
                                </span>
                              </div>
                            </div>

                            {/* Details & notes */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                              <div className="flex flex-wrap items-center gap-2">
                                <span>المطلوب: <strong className="text-slate-800 font-bold">{tot} ج.م</strong></span>
                                <span>•</span>
                                <span>المدفوع: <strong className="text-emerald-700 font-bold">{pd} ج.م</strong></span>
                                {rem > 0 && (
                                  <>
                                    <span>•</span>
                                    <span>المتبقي: <strong className="text-rose-700 font-bold">{rem} ج.م</strong></span>
                                  </>
                                )}
                                {item.notes && (
                                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200/60 text-[10px] text-slate-600 max-w-[200px] truncate">
                                    📝 {item.notes}
                                  </span>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                {rem > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedPurchase(item);
                                      setPurchaseModalMode("pay");
                                      setShowPurchaseModal(true);
                                    }}
                                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white hover:bg-emerald-700 active:scale-95 transition cursor-pointer touch-manipulation shadow-2xs"
                                    title="تسجيل سداد دفعة على هذه السلعة"
                                  >
                                    <CreditCard className="h-3 w-3" />
                                    <span>تسجيل دفعة</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPurchase(item);
                                    setPurchaseModalMode("edit");
                                    setShowPurchaseModal(true);
                                  }}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
                                  title="تعديل السلعة"
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPurchaseToDelete(item)}
                                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                                  title="حذف من السجل"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* قسم 5: سجل الفعاليات والرحلات */}
              {playerEvents.length > 0 && (
                <div className={mobileProfileTab === "events" ? "space-y-3.5 block" : "hidden"}>
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                          <Compass className="h-4 w-4" />
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
      {showZoomPhoto && player.photo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-md animate-fade-in-scale"
          dir="rtl"
          onMouseDown={(e) => e.target === e.currentTarget && setShowZoomPhoto(false)}
        >
          <div className="relative max-h-[94vh] max-w-md sm:max-w-lg w-full overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 sm:p-5 text-white shadow-2xl flex flex-col items-center">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🥋</span>
                <div>
                  <h3 className="font-cairo text-xs sm:text-sm font-black text-red-400">
                    صورة البطل / {player.name}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    حزام {player.belt || "أبيض"} • فرع {player.branch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowZoomPhoto(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition"
                title="إغلاق"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Enlarged Photo Display */}
            <div className="relative flex items-center justify-center max-h-[68vh] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={player.photo}
                alt={player.name}
                className="max-h-[64vh] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
              />
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-400 px-1 pt-1 shrink-0">
              <span className="text-[10px] text-slate-400">انقر في أي مكان خارج الصورة للإغلاق</span>
              <button
                type="button"
                onClick={() => setShowZoomPhoto(false)}
                className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
