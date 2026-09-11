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
    isUpcoming: daysLeft === 1,
    daysLeft,
    turningAge,
    dateFormatted,
    birthDay,
    birthMonth,
    birthYear,
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
  const currentYear = referenceDate.getFullYear();
  const key = `${playerId}_${currentYear}`;
  const list = getCongratulatedBirthdays();
  return list.includes(key);
}

export function markBirthdayCongratulated(playerId, referenceDate = new Date()) {
  if (!playerId || typeof window === "undefined") return;
  const currentYear = referenceDate.getFullYear();
  const key = `${playerId}_${currentYear}`;
  try {
    const list = getCongratulatedBirthdays();
    if (!list.includes(key)) {
      list.push(key);
      localStorage.setItem("reaction_congratulated_birthdays", JSON.stringify(list));
    }
    window.dispatchEvent(new CustomEvent("birthday_congratulated", { detail: { playerId, year: currentYear } }));

    // Also update backend silently
    fetch("/api/players", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: playerId, lastBirthdayWishedYear: currentYear }),
    }).catch(() => {});
  } catch (e) {
    console.warn("Failed to mark birthday congratulated:", e);
  }
}

export function getTodayBirthdays(players, referenceDate = new Date()) {
  if (!Array.isArray(players)) return [];
  const currentYear = referenceDate.getFullYear();
  return players
    .map((player) => {
      const bday = getBirthdayInfo(player, referenceDate);
      if (!bday || !bday.isToday) return null;
      if (player.lastBirthdayWishedYear === currentYear || isBirthdayCongratulated(player._id, referenceDate)) {
        return null;
      }
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
  const currentYear = referenceDate.getFullYear();
  return players
    .map((player) => {
      const bday = getBirthdayInfo(player, referenceDate);
      // ONLY 1 day before (tomorrow)
      if (!bday || bday.daysLeft !== 1) return null;
      if (player.lastBirthdayWishedYear === currentYear || isBirthdayCongratulated(player._id, referenceDate)) {
        return null;
      }
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
