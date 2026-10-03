import { memo, useState, useMemo, useEffect } from "react";
import {
  Check, X, CreditCard, Clock, ChevronRight, ChevronLeft,
  UserRound, Cake, Phone, MessageCircle, MoreHorizontal,
  AlertCircle, ShoppingBag, Sparkles, Building2, Lock,
} from "lucide-react";
import {
  paymentStatusFor,
  getPaymentDetailsFor,
  getBirthdayInfo,
  getBeltStyle,
  formatWhatsAppPhone,
  calculateAge,
  getPurchasesSummary,
  isNewPlayer,
  isBranchWorkingDate,
  formatBranchDays,
  getPlayerMonthAttendance,
  getBranchDayEntry,
  getDayKeyFromDate,
  localDate,
} from "../../lib/dashboard-utils";
import QuickPaymentModal from "./QuickPaymentModal";

/* ── Shared: player avatar with badges ──────────────────────────────────── */
function PlayerAvatar({ player, birthdayInfo, isNew, size = "md" }) {
  const sizeClass = size === "sm"
    ? "h-9 w-9 text-xs"
    : size === "lg"
      ? "h-12 w-12 text-base"
      : "h-11 w-11 text-sm";

  const ringClass = birthdayInfo?.isToday
    ? "ring-rose-400 ring-offset-1"
    : birthdayInfo?.daysLeft === 1
      ? "ring-amber-400 ring-offset-1"
      : isNew
        ? "ring-emerald-400 ring-offset-1"
        : "ring-white";

  return (
    <div
      className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-red-600 font-black text-white shadow-xs ring-2 transition-all duration-200 ${ringClass}`}
    >
      {player.photo ? (
        <img src={player.photo} alt={player.name} className="h-full w-full object-cover" />
      ) : (
        <span>{player.name.charAt(0)}</span>
      )}
      {birthdayInfo?.isToday && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 ring-1 ring-white animate-bounce shadow-xs">
          <Cake className="h-2.5 w-2.5 text-white" />
        </span>
      )}
      {!birthdayInfo?.isToday && birthdayInfo?.daysLeft === 1 && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-1 ring-white animate-pulse shadow-xs">
          <Cake className="h-2.5 w-2.5 text-white" />
        </span>
      )}
      {!birthdayInfo?.isToday && birthdayInfo?.daysLeft !== 1 && isNew && (
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-1 ring-white animate-pulse shadow-xs">
          <Sparkles className="h-2.5 w-2.5 text-amber-200" />
        </span>
      )}
    </div>
  );
}

/* ── Shared: special badge (birthday/new) ───────────────────────────────── */
function SpecialBadge({ birthdayInfo, isNew }) {
  if (birthdayInfo?.isToday)
    return (
      <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 px-2 py-0.5 text-[9.5px] font-black text-white shadow-xs ring-1 ring-rose-300/60 animate-pulse">
        🎂 اليوم
      </span>
    );
  if (birthdayInfo?.daysLeft === 1)
    return (
      <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[9.5px] font-black text-white shadow-xs ring-1 ring-amber-300/60 animate-pulse">
        🎂 غداً
      </span>
    );
  if (isNew)
    return (
      <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-2 py-0.5 text-[9.5px] font-black text-white shadow-xs ring-1 ring-emerald-300/60">
        <Sparkles className="h-2.5 w-2.5 text-amber-200 shrink-0" />
        <span>جديد</span>
      </span>
    );
  return null;
}

/* ── Attendance button ──────────────────────────────────────────────────── */
function AttendBtn({ active, color, busy, disabled, onClick, children }) {
  const colors = {
    green: {
      active: "bg-emerald-600 text-white ring-2 ring-emerald-200 shadow-xs",
      inactive: "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200",
    },
    red: {
      active: "bg-rose-600 text-white ring-2 ring-rose-200 shadow-xs",
      inactive: "bg-slate-50 text-slate-600 border border-slate-200/70 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200",
    },
  };
  return (
    <button
      type="button"
      disabled={Boolean(busy) || Boolean(disabled)}
      onClick={disabled ? undefined : onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl min-h-[44px] px-3 py-2 transition-all duration-150 touch-manipulation font-black text-xs ${
        disabled
          ? "opacity-35 grayscale pointer-events-none cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200/80 shadow-none ring-0 select-none"
          : `${active ? colors[color].active : colors[color].inactive} active:scale-95 cursor-pointer`
      }`}
    >
      {busy ? <span className="h-3.5 w-3.5 rounded-full border-2 border-current/30 border-t-current animate-spin" /> : children}
    </button>
  );
}

/* ── Main PlayerRow ─────────────────────────────────────────────────────── */
function PlayerRow({
  player,
  branches = [],
  sessionDate,
  paymentMonth,
  onOpen,
  onUpdate,
  isSelected,
  onToggleSelection,
}) {
  const [attendanceBusy, setAttendanceBusy] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentModalTab, setPaymentModalTab] = useState("subscription");

  // Check branch working days
  const playerBranch = useMemo(
    () =>
      (branches || []).find(
        (b) => (b.name || "").trim() === (player.branch || "").trim()
      ),
    [branches, player.branch]
  );
  // Re-evaluate working day/time every 30 seconds so the lock lifts automatically
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const isWorkingDay = useMemo(
    () => isBranchWorkingDate(playerBranch, sessionDate, new Date(nowTick)),
    [playerBranch, sessionDate, nowTick]
  );

  // Check if today is the right day but the start time hasn't arrived yet
  const branchDaySchedule = useMemo(() => {
    if (!playerBranch || !sessionDate) return null;
    const dayKey = getDayKeyFromDate(sessionDate);
    return getBranchDayEntry(playerBranch, dayKey);
  }, [playerBranch, sessionDate]);

  const isTooEarly = useMemo(() => {
    if (isWorkingDay) return false; // already open
    if (!branchDaySchedule?.from) return false; // no time set, not today's issue
    const today = localDate();
    if (!sessionDate || sessionDate.slice(0, 10) !== today) return false; // past/future date
    const [fh, fm] = branchDaySchedule.from.split(":").map(Number);
    if (isNaN(fh) || isNaN(fm)) return false;
    const now = new Date(nowTick);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    return nowMinutes < fh * 60 + fm;
  }, [isWorkingDay, branchDaySchedule, sessionDate, nowTick]);

  const formattedBranchDays = useMemo(
    () => formatBranchDays(playerBranch),
    [playerBranch]
  );

  const record = (player.attendance || []).find((item) => item.date === sessionDate);
  const present = record?.status === "present";
  // On working days, student is default absent unless marked present
  const absent = !present;
  const paymentDetails = getPaymentDetailsFor(player, paymentMonth);
  const paymentStatus = paymentDetails.status;
  const { totalAmount, paidAmount, remainingAmount } = paymentDetails;
  const birthdayInfo = getBirthdayInfo(player);
  const beltStyle = getBeltStyle(player.belt);
  const currentAge = player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age;
  const purchasesSummary = getPurchasesSummary(player);
  const isNew = useMemo(() => isNewPlayer(player), [player]);

  const unpaidPurchases = useMemo(() =>
    (purchasesSummary.purchases || []).filter((p) => (Number(p.remainingAmount) || 0) > 0),
    [purchasesSummary.purchases]
  );

  const purchaseDebtLabel = useMemo(() => {
    if (purchasesSummary.count === 0) return null;
    if (purchasesSummary.remainingAmount <= 0) {
      if (purchasesSummary.undeliveredCount > 0) {
        return `الأدوات مسددة بالكامل (${purchasesSummary.totalAmount} ج.م) - لم يستلم بعد ⏳`;
      }
      return `الأدوات والمستلزمات: مسددة بالكامل (${purchasesSummary.totalAmount} ج.م) ✓`;
    }
    if (unpaidPurchases.length === 1) {
      const p = unpaidPurchases[0];
      const name = p.title || "السلعة";
      const delivTag = p.deliveryStatus !== "received" ? " (لم يستلم ⏳)" : "";
      if ((Number(p.paidAmount) || 0) > 0)
        return `${name}: سدد ${p.paidAmount} من ${p.totalAmount} ج.م (فاضل عليه ${p.remainingAmount} ج.م)${delivTag}`;
      return `${name}: لم يسدد (فاضل عليه ${p.remainingAmount} ج.م)${delivTag}`;
    }
    const delivCount = purchasesSummary.undeliveredCount > 0 ? ` (${purchasesSummary.undeliveredCount} لم يستلم)` : "";
    return `المشتريات: سدد ${purchasesSummary.paidAmount} من ${purchasesSummary.totalAmount} ج.م (فاضل عليه ${purchasesSummary.remainingAmount} ج.م)${delivCount}`;
  }, [purchasesSummary, unpaidPurchases]);

  const purchaseDebtLabelDesktop = useMemo(() => {
    if (purchasesSummary.count === 0) return null;
    if (purchasesSummary.remainingAmount <= 0) {
      if (purchasesSummary.undeliveredCount > 0) {
        return `الأدوات مسددة (لم يستلم ⏳)`;
      }
      return `الأدوات مسددة (${purchasesSummary.totalAmount} ج.م) ✓`;
    }
    if (unpaidPurchases.length === 1) {
      const p = unpaidPurchases[0];
      const delivTag = p.deliveryStatus !== "received" ? " ⏳" : "";
      return `${p.title || "السلعة"}: باقي ${p.remainingAmount} ج.م${delivTag}`;
    }
    return `باقي أدوات: ${purchasesSummary.remainingAmount} ج.م`;
  }, [purchasesSummary, unpaidPurchases]);

  const monthAttendance = useMemo(
    () => getPlayerMonthAttendance(player, playerBranch, paymentMonth),
    [player, playerBranch, paymentMonth]
  );
  const totalSessions = monthAttendance.total;
  const attendedSessions = monthAttendance.attended;
  const attendanceRate = monthAttendance.rate;

  async function updateAttendance(status) {
    if (attendanceBusy || !isWorkingDay) return;
    setAttendanceBusy(status);
    try { await onUpdate(player._id, { attendanceStatus: status, date: sessionDate }); }
    finally { setAttendanceBusy(""); }
  }

  const phone = player.guardianPhone || player.parentPhone || player.guardianMobile || player.mobile || player.phone || "";
  const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";

  // ─── Card background per state ───────────────────────────────────────────
  const cardBg = isSelected
    ? "border-red-300 bg-red-50/60 shadow-xs"
    : birthdayInfo?.isToday
      ? "border-rose-300/90 bg-gradient-to-br from-rose-50/70 to-pink-50/50 shadow-xs"
      : birthdayInfo?.daysLeft === 1
        ? "border-amber-300/80 bg-amber-50/30 shadow-xs"
        : isNew
          ? "border-emerald-300/70 bg-emerald-50/20 shadow-xs"
          : "border-slate-200/80 bg-white shadow-xs hover:border-slate-300 hover:shadow-sm";

  // ─── Payment styling helpers ───────────────────────────────────────────
  const paymentBtnClass = paymentStatus === "paid"
    ? "border-emerald-200 bg-emerald-50/90 text-emerald-950"
    : paymentStatus === "partially_paid"
      ? "border-amber-300 bg-amber-50/90 text-amber-950 shadow-2xs"
      : "border-rose-200 bg-rose-50/80 text-rose-950";

  const paymentBadgeClass = paymentStatus === "paid"
    ? "bg-white text-emerald-700 border border-emerald-200"
    : paymentStatus === "partially_paid"
      ? "bg-amber-500 text-white"
      : "bg-rose-600 text-white";

  const hasPurchasePending =
    purchasesSummary.remainingAmount > 0 || purchasesSummary.undeliveredCount > 0;

  const purchaseBtnClass = purchasesSummary.count === 0
    ? "border-dashed border-slate-200 bg-slate-50/70 text-slate-600 hover:border-amber-300 hover:bg-amber-50/50"
    : hasPurchasePending
      ? "border-amber-300/90 bg-amber-50/90 text-amber-950 shadow-2xs"
      : "border-emerald-200 bg-emerald-50/80 text-emerald-950";

  const purchaseBadgeClass = purchasesSummary.count === 0
    ? "bg-white text-slate-600 border border-slate-200"
    : purchasesSummary.remainingAmount > 0
      ? "bg-amber-600 text-white"
      : purchasesSummary.undeliveredCount > 0
        ? "bg-amber-500 text-white font-black"
        : "bg-white text-emerald-700 border border-emerald-200";

  return (
    <>
      {/* ════════════════════ MOBILE CARD (< md) ════════════════════ */}
      <div className={`md:hidden relative mb-2.5 rounded-2xl border p-3 sm:p-3.5 transition-all duration-200 w-full max-w-full min-w-0 overflow-hidden ${cardBg}`}>

        {/* Left accent strip for selected */}
        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-red-500" />}

        {/* ── Row 1: Checkbox + Avatar + Name + Open ── */}
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <input
              type="checkbox"
              aria-label={`اختيار ${player.name}`}
              checked={isSelected}
              onChange={() => onToggleSelection(player._id)}
              className="h-5 w-5 shrink-0 rounded-md border-slate-300 accent-red-600 cursor-pointer touch-manipulation"
            />
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center gap-2.5 text-right cursor-pointer touch-manipulation"
              onClick={onOpen}
            >
              <PlayerAvatar player={player} birthdayInfo={birthdayInfo} isNew={isNew} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className="truncate text-sm font-black text-slate-900">{player.name}</strong>
                  <SpecialBadge birthdayInfo={birthdayInfo} isNew={isNew} />
                </div>
                {/* Belt + Level */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-extrabold ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${beltStyle.dot}`} />
                    حزام {player.belt || "أبيض"}
                  </span>
                  <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200/80 px-1.5 py-0.5 font-black text-red-700">
                    مستوى {player.level || "A"}
                  </span>
                  {player.fileNumber && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 font-bold text-slate-700">
                      <span className="text-slate-400">ملف:</span>
                      <span>#{player.fileNumber}</span>
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>

          {/* Open profile chevron */}
          <button
            type="button"
            onClick={onOpen}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-200/70 text-slate-400 hover:text-slate-700 active:scale-90 transition-all touch-manipulation cursor-pointer"
            title="عرض ملف اللاعب"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* ── Row 2: Meta info + Quick contact ── */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] font-bold text-slate-500">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 max-w-[130px] truncate">
              <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
              <span className="truncate">{player.branch}</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-slate-700 shrink-0">
              <Cake className="h-3 w-3 text-slate-400 shrink-0" />
              <span>{currentAge} سنة</span>
            </span>
            {totalSessions > 0 && (
              <span className={`rounded-md px-1.5 py-0.5 font-extrabold shrink-0 ${attendanceRate >= 75 ? "bg-emerald-50 text-emerald-700"
                  : attendanceRate >= 50 ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
                }`}>
                التزام {attendanceRate}%
              </span>
            )}
          </div>
          {phone && (
            <div className="flex items-center gap-1.5 shrink-0">
              <a href={`tel:${phone}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-200/80 text-blue-700 hover:bg-blue-100 active-press transition-all touch-manipulation" title={`اتصال (${phone})`}>
                <Phone className="h-3.5 w-3.5" />
              </a>
              <a
                href={cleanPhone ? `https://wa.me/${cleanPhone}` : "https://wa.me"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 hover:bg-emerald-100 active-press transition-all touch-manipulation"
                title={`واتساب (${phone})`}
              >
                <MessageCircle className="h-3.5 w-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* ── Row 3: Attendance Buttons ── */}
        <div className="mt-2.5">
          <div className="grid grid-cols-2 gap-2">
            <AttendBtn
              active={isWorkingDay && present}
              color="green"
              busy={attendanceBusy === "present"}
              disabled={!isWorkingDay}
              onClick={() => updateAttendance(present ? "absent" : "present")}
            >
              <Check className="h-4 w-4 stroke-[3]" />
              <span>{present ? "حاضر التدريب ✓" : "تسجيل حضور"}</span>
            </AttendBtn>
            <AttendBtn
              active={isWorkingDay && absent}
              color="red"
              busy={attendanceBusy === "absent"}
              disabled={!isWorkingDay}
              onClick={() => {
                if (present) updateAttendance("absent");
              }}
            >
              <X className="h-4 w-4 stroke-[3]" />
              <span>{absent ? "غائب (تلقائي) ×" : "غائب اليوم"}</span>
            </AttendBtn>
          </div>
          {!isWorkingDay && (
            <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10.5px] font-bold text-slate-400 select-none">
              <Lock className="h-3 w-3 text-slate-400 shrink-0" />
              {isTooEarly
                ? <span>التسجيل يبدأ الساعة <strong className="text-red-500">{branchDaySchedule.from}</strong> (لسه مجاش الوقت)</span>
                : <span>غير متاح اليوم (أيام عمل الصالة: {formattedBranchDays})</span>
              }
            </div>
          )}
        </div>

        {/* ── Row 4: Financial Buttons ── */}
        <div className="mt-2 grid grid-cols-2 gap-2">
          {/* Subscription */}
          <button type="button" onClick={() => { setPaymentModalTab("subscription"); setShowPaymentModal(true); }}
            className={`w-full min-h-[46px] rounded-xl p-2 text-xs transition-all duration-150 flex items-center justify-between gap-1.5 active-press touch-manipulation cursor-pointer border ${paymentBtnClass}`}
            title={`تسجيل اشتراك شهر ${paymentMonth}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <CreditCard className={`h-3.5 w-3.5 shrink-0 ${paymentStatus === "paid" ? "text-emerald-600" : paymentStatus === "partially_paid" ? "text-amber-600" : "text-rose-500"}`} />
              <div className="text-right min-w-0">
                <div className="text-[10px] text-slate-500 font-bold leading-tight">اشتراك الشهر</div>
                <div className="font-black text-[11px] truncate">
                  {paymentStatus === "paid"
                    ? <span className="text-emerald-700">{paidAmount > 0 ? `${paidAmount} ج.م ✓` : "مسدد ✓"}</span>
                    : paymentStatus === "partially_paid"
                      ? <span className="text-amber-800">باقي {remainingAmount} ج.م</span>
                      : totalAmount > 0
                        ? <span className="text-rose-700">مطلوب {totalAmount || remainingAmount}</span>
                        : <span className="text-rose-700">غير مسدد</span>}
                </div>
              </div>
            </div>
            <span className={`text-[9px] font-black rounded-md px-1.5 py-0.5 shrink-0 ${paymentBadgeClass}`}>تحصيل 💳</span>
          </button>

          {/* Purchases */}
          <button type="button" onClick={() => { setPaymentModalTab("purchases"); setShowPaymentModal(true); }}
            className={`w-full min-h-[46px] rounded-xl p-2 text-xs transition-all duration-150 flex items-center justify-between gap-1.5 active-press touch-manipulation cursor-pointer border ${purchaseBtnClass}`}
            title="حساب مشتريات وأدوات اللاعب"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <ShoppingBag className={`h-3.5 w-3.5 shrink-0 ${purchasesSummary.count === 0 ? "text-slate-400" : hasPurchasePending ? "text-amber-600" : "text-emerald-600"}`} />
              <div className="text-right min-w-0">
                <div className="text-[10px] text-slate-500 font-bold leading-tight">أدوات وبدل</div>
                <div className="font-black text-[11px] truncate">
                  {purchasesSummary.count === 0 ? (
                    <span className="text-slate-500">+ تسجيل أدوات</span>
                  ) : purchasesSummary.remainingAmount > 0 ? (
                    <span className="text-amber-800">
                      باقي {purchasesSummary.remainingAmount} ج.م
                      {purchasesSummary.undeliveredCount > 0 ? " (لم يستلم ⏳)" : ""}
                    </span>
                  ) : purchasesSummary.undeliveredCount > 0 ? (
                    <span className="text-amber-700">مسدد (لم يستلم بعد ⏳)</span>
                  ) : (
                    <span className="text-emerald-700">خالصة ومستلمة ✓</span>
                  )}
                </div>
              </div>
            </div>
            <span className={`text-[9px] font-black rounded-md px-1.5 py-0.5 shrink-0 ${purchaseBadgeClass}`}>
              {purchasesSummary.count === 0
                ? "＋"
                : purchasesSummary.remainingAmount > 0
                  ? "سداد 🥋"
                  : purchasesSummary.undeliveredCount > 0
                    ? "تسليم ⏳"
                    : "عرض"}
            </span>
          </button>
        </div>
      </div>

      {/* ════════════════════ DESKTOP TABLE ROW (>= md) ════════════════════ */}
      <div className={`group relative hidden min-w-0 md:grid md:grid-cols-[minmax(240px,2.2fr)_75px_110px_160px_minmax(240px,2.2fr)_48px] xl:grid-cols-[minmax(280px,2.5fr)_85px_130px_180px_minmax(280px,2.5fr)_52px] md:items-center md:gap-4 md:border-b md:border-slate-100/90 md:px-6 md:py-3.5 md:hover:bg-slate-50/60 transition-all duration-200 ${isSelected ? "md:bg-red-50/30"
          : birthdayInfo?.isToday ? "bg-rose-50/20"
            : birthdayInfo?.daysLeft === 1 ? "bg-amber-50/15"
              : isNew ? "bg-emerald-50/10"
                : "bg-white"
        }`}>

        {/* Accent right border on hover / selected */}
        <div className={`absolute right-0 top-0 bottom-0 hidden w-[3px] rounded-l-full md:block transition-all duration-200 ${isSelected ? "bg-red-500 opacity-100" : "bg-red-400 opacity-0 group-hover:opacity-100"}`} />

        {/* ── Col 1: Player info ── */}
        <div className="flex min-w-0 items-center gap-3">
          <input type="checkbox" aria-label={`اختيار ${player.name}`} checked={isSelected} onChange={() => onToggleSelection(player._id)} className="h-4 w-4 shrink-0 rounded-md border-slate-300 accent-red-600 cursor-pointer" />
          <button type="button" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-right cursor-pointer" onClick={onOpen}>
            <PlayerAvatar player={player} birthdayInfo={birthdayInfo} isNew={isNew} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <strong className="truncate text-sm font-extrabold text-slate-900 transition-colors group-hover:text-red-600">{player.name}</strong>
                <SpecialBadge birthdayInfo={birthdayInfo} isNew={isNew} />
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-bold ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border} shrink-0`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${beltStyle.dot}`} />
                  حزام {player.belt || "أبيض"}
                </span>
                <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200/70 px-1.5 py-0.5 font-black text-red-700 shrink-0">
                  مستوى {player.level || "A"}
                </span>
                {player.fileNumber && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 border border-slate-200/90 px-1.5 py-0.5 font-bold text-slate-700 shrink-0" title={`رقم الملف: ${player.fileNumber}`}>
                    <span className="text-slate-400">ملف:</span>
                    <span>#{player.fileNumber}</span>
                  </span>
                )}
                {totalSessions > 0 && (
                  <span className={`font-bold shrink-0 ${attendanceRate >= 75 ? "text-emerald-600" : attendanceRate >= 50 ? "text-amber-600" : "text-rose-600"}`}>
                    • التزام {attendanceRate}%
                  </span>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* ── Col 2: Age ── */}
        <div>
          <span className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 font-bold text-[11px] ${birthdayInfo?.isToday ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300 animate-pulse"
              : birthdayInfo?.daysLeft === 1 ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300 animate-pulse"
                : "bg-slate-100/80 text-slate-700"
            }`}>
            <UserRound className="h-3 w-3" />
            {currentAge} سنة
            {birthdayInfo?.isToday && <Cake className="h-3 w-3 text-rose-500 animate-bounce" />}
            {birthdayInfo?.daysLeft === 1 && <Cake className="h-3 w-3 text-amber-600 animate-pulse" />}
          </span>
        </div>

        {/* ── Col 3: Branch ── */}
        <div className="truncate">
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-50 border border-slate-200/60 px-2 py-1 text-[11px] font-semibold text-slate-600">
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {player.branch}
          </span>
        </div>

        {/* ── Col 4: Attendance ── */}
        <div className="flex flex-col gap-1 min-h-10 justify-center">
          <div className="flex items-center gap-1.5">
            <AttendBtn
              active={isWorkingDay && present}
              color="green"
              busy={attendanceBusy === "present"}
              disabled={!isWorkingDay}
              onClick={() => updateAttendance(present ? "absent" : "present")}
            >
              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>{present ? "حاضر ✓" : "حضور"}</span>
            </AttendBtn>
            <AttendBtn
              active={isWorkingDay && absent}
              color="red"
              busy={attendanceBusy === "absent"}
              disabled={!isWorkingDay}
              onClick={() => {
                if (present) updateAttendance("absent");
              }}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              <span>غائب</span>
            </AttendBtn>
          </div>
          {!isWorkingDay && (
            <span
              className="text-[9.5px] text-center font-bold text-slate-400 flex items-center justify-center gap-1 select-none"
              title={`أيام عمل الصالة: ${formattedBranchDays}`}
            >
              <Lock className="h-2.5 w-2.5 shrink-0" />
              <span>غير متاح اليوم ({formattedBranchDays})</span>
            </span>
          )}
        </div>

        {/* ── Col 5: Financial ── */}
        <div className="flex flex-col gap-1 min-w-0">
          {/* Subscription */}
          <button type="button"
            className={`min-h-9 rounded-xl px-2.5 text-xs font-extrabold transition-all duration-200 flex items-center justify-between gap-1.5 cursor-pointer active:scale-95 border ${paymentStatus === "paid" ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                : paymentStatus === "partially_paid" ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 font-black"
                  : "border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
              }`}
            onClick={() => { setPaymentModalTab("subscription"); setShowPaymentModal(true); }}
            title={`تحصيل اشتراك شهر ${paymentMonth}`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {paymentStatus === "paid"
                ? <><CreditCard className="h-3.5 w-3.5 shrink-0 text-emerald-600" /><span className="truncate font-black text-xs">اشتراك مدفوع ({paidAmount} ج.م) ✓</span></>
                : paymentStatus === "partially_paid"
                  ? <><span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" /><span className="truncate font-black text-xs">دفع {paidAmount} • باقي {remainingAmount} ج.م</span></>
                  : <><Clock className="h-3.5 w-3.5 shrink-0 text-rose-600" /><span className="truncate font-black text-xs">{totalAmount > 0 ? `غير مسدد (${totalAmount || remainingAmount} ج.م)` : "غير مسدد"}</span></>}
            </div>
            <span className="text-[10px] font-black text-slate-400 shrink-0">💳</span>
          </button>

          {/* Purchases */}
          {purchasesSummary.count > 0 ? (
            <button type="button"
              onClick={() => { setPaymentModalTab("purchases"); setShowPaymentModal(true); }}
              className={`min-h-7 text-[10px] font-black rounded-lg px-2 py-0.5 text-center transition cursor-pointer flex items-center justify-between gap-1 border ${
                hasPurchasePending
                  ? "text-amber-950 bg-amber-50/95 border-amber-300 hover:bg-amber-100 shadow-2xs"
                  : "text-emerald-800 bg-emerald-50/60 border-emerald-200/80 hover:bg-emerald-100"
              }`}
            >
              <div className="flex items-center gap-1 min-w-0 truncate">
                <ShoppingBag className={`h-3 w-3 shrink-0 ${hasPurchasePending ? "text-amber-600" : "text-emerald-600"}`} />
                <span className="truncate">{purchaseDebtLabelDesktop}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded shrink-0 ${
                purchasesSummary.remainingAmount > 0
                  ? "bg-amber-600 text-white font-black"
                  : purchasesSummary.undeliveredCount > 0
                    ? "bg-amber-500 text-white font-black"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {purchasesSummary.remainingAmount > 0
                  ? "تحصيل 🥋"
                  : purchasesSummary.undeliveredCount > 0
                    ? "تسليم ⏳"
                    : "عرض"}
              </span>
            </button>
          ) : (
            <button type="button"
              onClick={() => { setPaymentModalTab("purchases"); setShowPaymentModal(true); }}
              className="min-h-6 text-[9px] font-bold text-slate-400 hover:text-amber-800 hover:bg-amber-50/70 rounded-lg py-0.5 px-1.5 transition cursor-pointer border border-dashed border-slate-200 hover:border-amber-300 flex items-center justify-center gap-1"
            >
              <ShoppingBag className="h-2.5 w-2.5" />
              <span>+ تسجيل بدلة / أدوات</span>
            </button>
          )}
        </div>

        {/* ── Col 6: Open profile ── */}
        <button type="button"
          className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-90 cursor-pointer"
          onClick={onOpen}
          title="عرض وتعديل ملف اللاعب"
        >
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <QuickPaymentModal
          player={player}
          paymentMonth={paymentMonth}
          initialDetails={paymentDetails}
          initialTab={paymentModalTab}
          onClose={() => setShowPaymentModal(false)}
          onSave={async (data) => { await onUpdate(player._id, data); }}
          onSavePurchase={async (data) => { await onUpdate(player._id, data); }}
        />
      )}
    </>
  );
}

export default memo(PlayerRow);
