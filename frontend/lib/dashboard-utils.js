export function localDate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function getPaymentDetailsFor(player, month) {
  const currentMonth = localDate().slice(0, 7);
  const record = (
    Array.isArray(player?.paymentHistory) ? player.paymentHistory : []
  ).find((payment) => payment.month === month);

  if (record) {
    const totalAmount = Number(
      record.totalAmount ?? record.amount ?? player?.totalAmount ?? 100,
    );
    const paidAmount = Number(
      record.paidAmount ?? (record.status === "paid" ? totalAmount : 0),
    );
    const remainingAmount = Math.max(0, totalAmount - paidAmount);

    let status = record.status;
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0 && paidAmount < totalAmount) {
      status = "partially_paid";
    } else if (paidAmount === 0) {
      status = "unpaid";
    }

    return {
      status,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }

  if (month === currentMonth) {
    const totalAmount = Number(player?.totalAmount ?? 100);
    const paidAmount = Number(
      player?.paidAmount ??
        (player?.paymentStatus === "paid" ? totalAmount : 0),
    );
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    let status = player?.paymentStatus || "unpaid";
    if (paidAmount >= totalAmount && totalAmount > 0) {
      status = "paid";
    } else if (paidAmount > 0 && paidAmount < totalAmount) {
      status = "partially_paid";
    } else if (paidAmount === 0) {
      status = "unpaid";
    }

    return {
      status,
      totalAmount,
      paidAmount,
      remainingAmount,
    };
  }

  return {
    status: "unpaid",
    totalAmount: 100,
    paidAmount: 0,
    remainingAmount: 100,
  };
}

export function paymentStatusFor(player, month) {
  return getPaymentDetailsFor(player, month).status;
}

export function parseDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return null;
  const clean = toEnglishDigits(String(dateOfBirth).trim())
    .replace(/[\/\.]/g, "-")
    .replace(/T.*$/, "");
  // Match YYYY-M-D or YYYY-MM-DD
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean);
  if (match) {
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const day = parseInt(match[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  // Match D-M-YYYY or DD-MM-YYYY
  match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(clean);
  if (match) {
    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);
    if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day };
    }
  }
  return null;
}

export function calculateAge(dateOfBirth, referenceDate) {
  const parsed = parseDateOfBirth(dateOfBirth);
  if (!parsed) return null;

  const ref =
    referenceDate instanceof Date && !isNaN(referenceDate.getTime())
      ? referenceDate
      : new Date();

  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth() + 1;
  const refDay = ref.getDate();

  let age = refYear - parsed.year;
  if (refMonth < parsed.month || (refMonth === parsed.month && refDay < parsed.day)) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function normalizePlayer(player) {
  if (!player) return player;
  const dynamicAge = player.dateOfBirth
    ? calculateAge(player.dateOfBirth)
    : null;

  return Object.assign(Object.assign({}, player), {
    age: dynamicAge !== null ? dynamicAge : (player.age ?? 0),
    attendance: Array.isArray(player.attendance) ? player.attendance : [],
    paymentHistory: Array.isArray(player.paymentHistory)
      ? player.paymentHistory
      : [],
    purchases: Array.isArray(player.purchases) ? player.purchases : [],
  });
}

/**
 * Calculates purchases summary and remaining amounts for a player
 */
export function getPurchasesSummary(player) {
  const purchases = Array.isArray(player?.purchases) ? player.purchases : [];
  const totalAmount = purchases.reduce(
    (sum, p) => sum + (Number(p.totalAmount) || 0),
    0
  );
  const paidAmount = purchases.reduce(
    (sum, p) => sum + (Number(p.paidAmount) || 0),
    0
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const unpaidCount = purchases.filter(
    (p) => (Number(p.remainingAmount) || 0) > 0
  ).length;

  return {
    purchases,
    totalAmount,
    paidAmount,
    remainingAmount,
    hasDebt: remainingAmount > 0,
    unpaidCount,
    count: purchases.length,
  };
}


/**
 * Calculates birthday status for a player
 */
export function getBirthdayInfo(player, referenceDate) {
  if (!player || !player.dateOfBirth) return null;
  const parsed = parseDateOfBirth(player.dateOfBirth);
  if (!parsed) return null;

  const ref =
    referenceDate instanceof Date && !isNaN(referenceDate.getTime())
      ? referenceDate
      : new Date();

  const refYear = ref.getFullYear();
  const refMonth = ref.getMonth() + 1; // 1-12
  const refDay = ref.getDate();

  const isToday = parsed.month === refMonth && parsed.day === refDay;

  // Next birthday calculation
  let nextBdayYear = refYear;
  if (parsed.month < refMonth || (parsed.month === refMonth && parsed.day < refDay)) {
    nextBdayYear = refYear + 1;
  }

  const currentRef = new Date(refYear, refMonth - 1, refDay);
  const nextBday = new Date(nextBdayYear, parsed.month - 1, parsed.day);
  const diffTime = nextBday.getTime() - currentRef.getTime();
  const daysLeft = Math.max(0, Math.round(diffTime / (1000 * 60 * 60 * 24)));

  const turningAge = nextBdayYear - parsed.year;

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
  const dateFormatted = `${parsed.day} ${monthNames[parsed.month - 1]}`;

  return {
    isToday,
    isTomorrow: daysLeft === 1,
    isUpcoming: daysLeft === 1,
    isInBirthdayWindow: isToday || daysLeft === 1,
    status: isToday ? "today" : daysLeft === 1 ? "tomorrow" : "normal",
    daysLeft,
    turningAge,
    dateFormatted,
    birthDay: parsed.day,
    birthMonth: parsed.month,
    birthYear: parsed.year,
  };
}

export function getCongratulatedBirthdays() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("reaction_congratulated_birthdays");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isBirthdayCongratulated(playerId, referenceDate = new Date()) {
  if (!playerId) return false;
  try {
    const currentYear = referenceDate.getFullYear();
    const list = getCongratulatedBirthdays();
    return list.some(
      (item) =>
        item.playerId === playerId &&
        (item.year === currentYear || item.date === referenceDate.toISOString().slice(0, 10))
    );
  } catch {
    return false;
  }
}

export function markBirthdayCongratulated(playerId, referenceDate = new Date()) {
  if (!playerId || typeof window === "undefined") return;
  try {
    const currentYear = referenceDate.getFullYear();
    const dateStr = referenceDate.toISOString().slice(0, 10);
    const list = getCongratulatedBirthdays().filter(
      (item) => !(item.playerId === playerId && item.year === currentYear)
    );
    list.push({ playerId, year: currentYear, date: dateStr, timestamp: Date.now() });
    localStorage.setItem("reaction_congratulated_birthdays", JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("birthday_congratulated", { detail: { playerId } }));
  } catch (e) {
    console.warn("Failed to mark birthday congratulated:", e);
  }
}

export function getTodayBirthdays(players, referenceDate = new Date()) {
  if (!Array.isArray(players)) return [];
  return players
    .map((player) => {
      const bday = getBirthdayInfo(player, referenceDate);
      if (!bday || !bday.isToday) return null;
      return { ...player, birthdayInfo: bday };
    })
    .filter(Boolean);
}

export function getUpcomingBirthdays(
  players,
  daysAhead = 1,
  referenceDate = new Date()
) {
  if (!Array.isArray(players)) return [];
  const maxDays = Number(daysAhead) > 0 ? Number(daysAhead) : 1;
  return players
    .map((player) => {
      const bday = getBirthdayInfo(player, referenceDate);
      if (!bday || bday.isToday) return null;
      if (bday.daysLeft < 1 || bday.daysLeft > maxDays) return null;
      return { ...player, birthdayInfo: bday };
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
  let clean = toEnglishDigits(String(phone)).trim();
  if (clean.startsWith("+")) clean = clean.slice(1);
  clean = clean.replace(/[^0-9]/g, "");
  if (!clean) return "";

  if (clean.startsWith("00")) clean = clean.slice(2);

  // Egypt mobile normalization:
  // 010, 011, 012, 015 with 11 digits -> 201... (12 digits)
  if (/^01[0125]\d{8}$/.test(clean)) {
    clean = "2" + clean;
  } else if (/^1[0125]\d{8}$/.test(clean)) {
    clean = "20" + clean;
  } else if (/^201[0125]\d{8}$/.test(clean)) {
    // Already normalized with Egypt country code
  }
  return clean;
}

export function generateBirthdayWishText(
  player,
  captainName = "كابتن الأكاديمية"
) {
  const bday = getBirthdayInfo(player);
  const currentAge = calculateAge(player?.dateOfBirth) ?? player?.age ?? 0;
  const age = bday?.isToday ? currentAge : (bday?.turningAge ?? currentAge ?? "");
  const name = player?.name || "البطل";

  return `🎉 النهارده يوم مميز لبطلنا! 🥋❤️
كل سنة وإنت طيب وبألف خير يا *${name}*! 🎂
كبرت سنة وبقيت *${age}* سنين مليانة شجاعة وبطولة! 🥳🎈

فخورين بيك وبأدائك في الأكاديمية ونتمنالك سنة جديدة مليانة نجاح، ميداليات دهب، وأهداف كتير! 🏆🥇🔥

مع تحيات أسرة أكاديمية Re_action والكابتن *${captainName}* ❤️`;
}


export function openWhatsAppDirect(phone, text = "") {
  if (typeof window === "undefined") return;

  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = text ? encodeURIComponent(text) : "";

  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

  if (isMobile) {
    let appUrl = "";
    if (cleanPhone) {
      appUrl = encodedText
        ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}`
        : `whatsapp://send?phone=${cleanPhone}`;
    } else {
      appUrl = encodedText
        ? `whatsapp://send?text=${encodedText}`
        : `whatsapp://send`;
    }

    try {
      const a = document.createElement("a");
      a.href = appUrl;
      a.target = "_top";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) document.body.removeChild(a);
      }, 300);
    } catch (_) {
      window.location.href = appUrl;
    }
  } else {
    // Desktop: WhatsApp Web
    let webUrl = "";
    if (cleanPhone) {
      webUrl = encodedText
        ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
        : `https://web.whatsapp.com/send?phone=${cleanPhone}`;
    } else {
      webUrl = encodedText
        ? `https://web.whatsapp.com/send?text=${encodedText}`
        : `https://web.whatsapp.com`;
    }
    window.open(webUrl, "_blank", "noopener,noreferrer");
  }
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

  return cleanPhone
    ? `whatsapp://send?phone=${cleanPhone}&text=${text}`
    : `whatsapp://send?text=${text}`;
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

export const BELT_HEX = {
  "أبيض": "#f8fafc",
  "أصفر 10": "#facc15",
  "أصفر ١٠": "#facc15",
  "أصفر 9": "#facc15",
  "أصفر ٩": "#facc15",
  "برتقالي 8": "#fb923c",
  "برتقالي ٨": "#fb923c",
  "برتقالي 7": "#fb923c",
  "برتقالي ٧": "#fb923c",
  "أخضر 6": "#22c55e",
  "أخضر ٦": "#22c55e",
  "أخضر 5": "#22c55e",
  "أخضر ٥": "#22c55e",
  "أزرق 4": "#3b82f6",
  "أزرق ٤": "#3b82f6",
  "أزرق 3": "#3b82f6",
  "أزرق ٣": "#3b82f6",
  "بني 2": "#854d0e",
  "بني ٢": "#854d0e",
  "بني 1": "#854d0e",
  "بني ١": "#854d0e",
  "أسود 1": "#0f172a",
  "أسود ١": "#0f172a",
  "أسود 2": "#0f172a",
  "أسود ٢": "#0f172a",
  "أسود 3": "#0f172a",
  "أسود ٣": "#0f172a",
};

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
