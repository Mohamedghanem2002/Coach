export function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function paymentStatusFor(player, month) {
  var _a, _b;
  const currentMonth = localDate().slice(0, 7);
  return (
    ((_b =
      (_a = (
        Array.isArray(player.paymentHistory) ? player.paymentHistory : []
      ).find((payment) => payment.month === month)) === null || _a === void 0
        ? void 0
        : _a.status) !== null && _b !== void 0
      ? _b
      : month === currentMonth
        ? player.paymentStatus
        : "unpaid")
  );
}

export function normalizePlayer(player) {
  return Object.assign(Object.assign({}, player), {
    attendance: Array.isArray(player.attendance) ? player.attendance : [],
    paymentHistory: Array.isArray(player.paymentHistory)
      ? player.paymentHistory
      : [],
  });
}

/**
 * Calculates birthday status for a player
 */
export function getBirthdayInfo(player, referenceDate = new Date()) {
  if (!player || !player.dateOfBirth) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(player.dateOfBirth.trim());
  if (!match) return null;

  const birthYear = parseInt(match[1], 10);
  const birthMonth = parseInt(match[2], 10); // 1-12
  const birthDay = parseInt(match[3], 10);

  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1; // 1-12
  const refDay = referenceDate.getDate();

  const isToday = birthMonth === refMonth && birthDay === refDay;

  // Next birthday calculation
  let nextBdayYear = refYear;
  if (birthMonth < refMonth || (birthMonth === refMonth && birthDay < refDay)) {
    nextBdayYear = refYear + 1;
  }

  const currentRef = new Date(refYear, refMonth - 1, refDay);
  const nextBday = new Date(nextBdayYear, birthMonth - 1, birthDay);
  const diffTime = nextBday.getTime() - currentRef.getTime();
  const daysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const turningAge = nextBdayYear - birthYear;

  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];
  const dateFormatted = `${birthDay} ${monthNames[birthMonth - 1]}`;

  return {
    isToday,
    isTomorrow: daysLeft === 1,
    isUpcoming: daysLeft > 0 && daysLeft <= 7,
    daysLeft,
    turningAge,
    dateFormatted,
    birthDay,
    birthMonth,
    birthYear,
  };
}

export function getTodayBirthdays(players, referenceDate = new Date()) {
  if (!Array.isArray(players)) return [];
  return players
    .map((player) => {
      const bday = getBirthdayInfo(player, referenceDate);
      return bday && bday.isToday ? { ...player, birthdayInfo: bday } : null;
    })
    .filter(Boolean);
}

export function getUpcomingBirthdays(
  players,
  daysAhead = 7,
  referenceDate = new Date()
) {
  if (!Array.isArray(players)) return [];
  return players
    .map((player) => {
      const bday = getBirthdayInfo(player, referenceDate);
      return bday && bday.daysLeft > 0 && bday.daysLeft <= daysAhead
        ? { ...player, birthdayInfo: bday }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.birthdayInfo.daysLeft - b.birthdayInfo.daysLeft);
}

export function toEnglishDigits(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

export function formatWhatsAppPhone(phone) {
  if (!phone) return "";
  let clean = toEnglishDigits(phone).replace(/[^0-9]/g, "");
  if (clean.startsWith("01") && clean.length === 11) {
    clean = "2" + clean;
  }
  return clean;
}

export function generateBirthdayWishText(
  player,
  captainName = "كابتن الأكاديمية"
) {
  const bday = getBirthdayInfo(player);
  const ageText = bday?.turningAge ? ` وإتمامه ${bday.turningAge} سنوات` : "";
  const name = player?.name || "البطل";

  return `🎉🥋 كل عام وبطلنا الغالي *${name}* بألف خير وسعادة! بمناسبة عيد ميلاده المبارك${ageText}، تتمنى له أسرة الأكاديمية والكابتن *${captainName}* دوام التوفيق والتميز والتألق الدائم في الكاراتيه والحياة! 🎂🏆🎈`;
}

export function generateBirthdayWishUrl(
  player,
  captainName = "كابتن الأكاديمية"
) {
  const phone =
    player.guardianPhone ||
    player.parentPhone ||
    player.guardianMobile ||
    player.mobile ||
    player.phone ||
    "";
  const cleanPhone = formatWhatsAppPhone(phone);
  const text = encodeURIComponent(
    generateBirthdayWishText(player, captainName)
  );
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  if (isMobile) {
    return cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${text}`
      : `whatsapp://send?text=${text}`;
  }

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }
  return `https://wa.me/?text=${text}`;
}

export const BELTS = [
  { name: "أبيض", hex: "#f8fafc", bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-300", dot: "bg-slate-300" },
  { name: "أصفر 10", hex: "#fef08a", bg: "bg-yellow-100", text: "text-yellow-900", border: "border-yellow-400", dot: "bg-yellow-400" },
  { name: "أصفر 9", hex: "#fef08a", bg: "bg-yellow-100", text: "text-yellow-900", border: "border-yellow-400", dot: "bg-yellow-400" },
  { name: "برتقالي 8", hex: "#ffedd5", bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-400", dot: "bg-orange-500" },
  { name: "برتقالي 7", hex: "#ffedd5", bg: "bg-orange-100", text: "text-orange-900", border: "border-orange-400", dot: "bg-orange-500" },
  { name: "أخضر 6", hex: "#dcfce7", bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-400", dot: "bg-emerald-500" },
  { name: "أخضر 5", hex: "#dcfce7", bg: "bg-emerald-100", text: "text-emerald-900", border: "border-emerald-400", dot: "bg-emerald-500" },
  { name: "أزرق 4", hex: "#dbeafe", bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-400", dot: "bg-blue-500" },
  { name: "أزرق 3", hex: "#dbeafe", bg: "bg-blue-100", text: "text-blue-900", border: "border-blue-400", dot: "bg-blue-500" },
  { name: "بني 2", hex: "#e7d7cd", bg: "bg-amber-900/10", text: "text-amber-950", border: "border-amber-800/30", dot: "bg-amber-800" },
  { name: "بني 1", hex: "#e7d7cd", bg: "bg-amber-900/10", text: "text-amber-950", border: "border-amber-800/30", dot: "bg-amber-800" },
  { name: "أسود 1", hex: "#0f172a", bg: "bg-slate-900", text: "text-white", border: "border-slate-800", dot: "bg-amber-400" },
  { name: "أسود 2", hex: "#0f172a", bg: "bg-slate-900", text: "text-white", border: "border-slate-800", dot: "bg-amber-400" },
  { name: "أسود 3", hex: "#0f172a", bg: "bg-slate-900", text: "text-white", border: "border-slate-800", dot: "bg-amber-400" },
];

export const LEVELS = ["A", "B", "C", "D"];

export function getBeltStyle(beltName = "أبيض") {
  const found = BELTS.find((b) => b.name === beltName);
  return (
    found || {
      name: beltName || "أبيض",
      hex: "#f8fafc",
      bg: "bg-slate-100",
      text: "text-slate-800",
      border: "border-slate-300",
      dot: "bg-slate-300",
    }
  );
}
