import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireActiveTenant } from "../../../../backend/tenant";

export const dynamic = "force-dynamic";

function appDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function toEnglishDigits(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}

function ageFromDateOfBirth(dateOfBirth) {
  if (!dateOfBirth) return null;
  const clean = toEnglishDigits(String(dateOfBirth).trim())
    .replace(/[\/\.]/g, "-")
    .replace(/T.*$/, "");
  let year, month, day;
  let match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(clean);
  if (match) {
    year = parseInt(match[1], 10);
    month = parseInt(match[2], 10);
    day = parseInt(match[3], 10);
  } else {
    match = /^(\d{1,2})-(\d{1,2})-(\d{4})$/.exec(clean);
    if (match) {
      day = parseInt(match[1], 10);
      month = parseInt(match[2], 10);
      year = parseInt(match[3], 10);
    } else {
      return null;
    }
  }
  if (year <= 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const [currentYear, currentMonth, currentDay] = appDate()
    .split("-")
    .map(Number);
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  if (age < 0) return null;
  return age;
}

function serializePlayer(player) {
  const currentMonth = appDate().slice(0, 7);
  const monthlyPayment = Array.isArray(player.paymentHistory)
    ? player.paymentHistory.find((payment) => payment.month === currentMonth)
    : undefined;

  let latestHistoryAmount = undefined;
  if (Array.isArray(player.paymentHistory) && player.paymentHistory.length > 0) {
    const sorted = [...player.paymentHistory].sort((a, b) =>
      (b.month || "").localeCompare(a.month || "")
    );
    const latestWithAmount = sorted.find(
      (p) => p.totalAmount !== undefined && p.totalAmount !== null && Number(p.totalAmount) > 0
    );
    if (latestWithAmount) latestHistoryAmount = Number(latestWithAmount.totalAmount);
  }

  const configuredDefault =
    player.defaultTotalAmount !== undefined && player.defaultTotalAmount !== null && player.defaultTotalAmount !== ""
      ? Number(player.defaultTotalAmount)
      : (player.totalAmount !== undefined && player.totalAmount !== null && player.totalAmount !== "" && Number(player.totalAmount) > 0
          ? Number(player.totalAmount)
          : latestHistoryAmount);

  const defaultTotalAmount =
    configuredDefault !== undefined && !isNaN(configuredDefault) && configuredDefault > 0
      ? configuredDefault
      : null;

  const totalAmount =
    monthlyPayment?.totalAmount !== undefined && monthlyPayment?.totalAmount !== null && monthlyPayment?.totalAmount !== ""
      ? Number(monthlyPayment.totalAmount)
      : (defaultTotalAmount ?? 0);

  const hasConfiguredAmount = totalAmount > 0;
  const paidAmount = Number(
    monthlyPayment !== undefined
      ? (monthlyPayment.paidAmount ?? (
          monthlyPayment.status === "paid" && hasConfiguredAmount ? totalAmount : 0
        ))
      : 0
  );

  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const paymentStatus =
    monthlyPayment !== undefined
      ? monthlyPayment.status
      : (hasConfiguredAmount ? "unpaid" : "unpaid");

  return {
    ...player,
    age: ageFromDateOfBirth(player.dateOfBirth),
    totalAmount,
    paidAmount,
    remainingAmount,
    paymentStatus,
    paymentStatusHistory: player.paymentStatusHistory || [],
    paymentHistory: player.paymentHistory || [],
    paymentHistoryCustom: player.paymentHistoryCustom || [],
    purchases: player.purchases || [],
    purchasesHistory: player.purchasesHistory || [],
    attendance: player.attendance || [],
    photoUrl: player.photoUrl || null,
    level: player.level || "A",
    lastBirthdayWishedYear: player.lastBirthdayWishedYear || null,
    welcomeCardHandledAt: player.welcomeCardHandledAt || null,
    _id: player._id ? player._id.toString() : "",
  };
}

function serializeEvent(event) {
  const participants = Array.isArray(event.participants) ? event.participants : [];
  const totalRevenue = participants.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const paidRevenue = participants.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const remainingRevenue = Math.max(0, totalRevenue - paidRevenue);

  const paidCount = participants.filter((p) => p.paymentStatus === "paid").length;
  const partialCount = participants.filter((p) => p.paymentStatus === "partially_paid").length;
  const unpaidCount = participants.filter((p) => p.paymentStatus === "unpaid").length;
  const attendedCount = participants.filter((p) => Boolean(p.attended)).length;

  return {
    ...event,
    _id: event._id?.toString(),
    fee: Number(event.fee ?? 100),
    participants: participants.map((p) => ({
      ...p,
      playerId: p.playerId?.toString(),
      totalAmount: Number(p.totalAmount ?? event.fee ?? 100),
      paidAmount: Number(p.paidAmount ?? 0),
      remainingAmount: Number(p.remainingAmount ?? Math.max(0, (p.totalAmount ?? event.fee ?? 100) - (p.paidAmount ?? 0))),
      paymentStatus: p.paymentStatus || "unpaid",
      attended: Boolean(p.attended),
    })),
    stats: {
      totalParticipants: participants.length,
      totalRevenue,
      paidRevenue,
      remainingRevenue,
      paidCount,
      partialCount,
      unpaidCount,
      attendedCount,
    },
  };
}

export async function GET() {
  try {
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;

    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB;
    if (!dbName) {
      throw new Error("MONGODB_DB is not defined");
    }
    const db = client.db(dbName);

    // Parallel fetch all data in 1 roundtrip
    const [rawPlayers, rawBranches, rawEvents, playerBranches] = await Promise.all([
      db.collection("players").find({ ownerId }).sort({ createdAt: -1 }).toArray(),
      db.collection("branches").find({ ownerId }).sort({ createdAt: 1 }).toArray(),
      db.collection("events").find({ ownerId }).sort({ date: -1 }).toArray(),
      db.collection("players").distinct("branch", { ownerId }),
    ]);

    const knownNames = new Set(rawBranches.map((b) => b.name));
    const legacyBranches = playerBranches
      .filter((name) => typeof name === "string" && !knownNames.has(name))
      .map((name) => ({ _id: `legacy-${name}`, name, days: [] }));

    const branches = [
      ...rawBranches.map((b) => ({
        ...b,
        _id: b._id.toString(),
        days: Array.isArray(b.days) ? b.days : [],
      })),
      ...legacyBranches,
    ];

    const players = rawPlayers.map(serializePlayer);
    const events = rawEvents.map(serializeEvent);

    return NextResponse.json({
      success: true,
      players,
      branches,
      events,
    });
  } catch (error) {
    console.error("GET /api/dashboard/bootstrap failed:", error);
    return NextResponse.json(
      { error: "تعذر تحميل بيانات لوحة التحكم", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
