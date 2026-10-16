import { ObjectId } from "mongodb";
import clientPromise from "./mongodb.js";

/**
 * 120-second online status timeout as specified in requirements.
 * A captain is considered "Online" if their last seen heartbeat / server interaction was within 120s.
 */
export const ONLINE_TIMEOUT_MS = 120 * 1000;

/**
 * Memory throttle cache to avoid duplicate DB writes when rapid mutations occur in the same minute
 */
const activityThrottleMap = new Map();
const THROTTLE_WINDOW_MS = 30 * 1000; // 30 seconds

/**
 * Returns YYYY-MM-DD string in Africa/Cairo timezone.
 */
export function getAppDateString(date = new Date()) {
  try {
    const validDate = date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date);
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(validDate);
    const values = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${values.year}-${values.month}-${values.day}`;
  } catch {
    const d = new Date(date);
    return d.toISOString().slice(0, 10);
  }
}

/**
 * Records genuine captain user activity (NOT logins or heartbeats alone).
 * Called strictly on genuine user actions such as:
 * - Adding/updating/deleting players
 * - Marking attendance
 * - Recording/updating payments
 * - Adding/updating branches/halls
 * - Adding/updating events
 *
 * Atomically updates user's activeDays set and activity timestamps.
 */
export async function recordCaptainGenuineActivity(ownerId, date = new Date()) {
  if (!ownerId) return;

  const ownerKey = String(ownerId);
  const now = Date.now();
  const lastRecorded = activityThrottleMap.get(ownerKey);

  // If throttled within 30 seconds, update lastSeen in memory and skip extra DB round-trip
  if (lastRecorded && now - lastRecorded < THROTTLE_WINDOW_MS) {
    return;
  }
  activityThrottleMap.set(ownerKey, now);

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    const todayStr = getAppDateString(date);
    const nowTime = new Date();

    let query = {};
    if (ObjectId.isValid(ownerKey) && ownerKey.length === 24) {
      query = { $or: [{ _id: new ObjectId(ownerKey) }, { _id: ownerKey }] };
    } else {
      query = { _id: ownerKey };
    }

    await users.updateOne(query, {
      $addToSet: { activeDays: todayStr },
      $set: {
        lastActiveAt: nowTime,
        lastSeenAt: nowTime,
      },
    });
  } catch (err) {
    console.error("recordCaptainGenuineActivity non-critical error:", err?.message || err);
  }
}

/**
 * Lightweight heartbeat updater for logged in captains.
 * Updates lastSeenAt on the user record with 0 heavy operations.
 */
export async function updateCaptainHeartbeat(userIdOrEmail) {
  if (!userIdOrEmail) return { success: false, error: "Missing user identifier" };

  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const users = db.collection("users");

    const nowTime = new Date();
    const strId = String(userIdOrEmail);

    let query;
    if (strId.includes("@")) {
      query = { email: strId.toLowerCase().trim() };
    } else if (ObjectId.isValid(strId) && strId.length === 24) {
      query = { $or: [{ _id: new ObjectId(strId) }, { _id: strId }] };
    } else {
      query = { _id: strId };
    }

    await users.updateOne(query, {
      $set: { lastSeenAt: nowTime },
    });

    return { success: true, timestamp: nowTime.toISOString() };
  } catch (err) {
    console.error("updateCaptainHeartbeat error:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Formats relative Arabic time string (e.g., "متصل الآن 🟢", "منذ 15 دقيقة", "منذ يومين")
 */
export function formatRelativeArabicTime(date, now = new Date(), options = {}) {
  if (!date) return "لم ينشط بعد";
  const parsed = date instanceof Date ? date : new Date(date);
  if (isNaN(parsed.getTime())) return "غير محدد";

  const diffMs = now.getTime() - parsed.getTime();
  if (diffMs < 0) {
    return options.allowOnline ? "متصل الآن 🟢" : "منذ ثوانٍ";
  }

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec <= 120) {
    if (options.allowOnline) {
      return "متصل الآن 🟢";
    }
    if (diffSec < 60) return "منذ ثوانٍ";
    return "منذ دقيقة";
  }

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    if (diffMin === 1) return "منذ دقيقة";
    if (diffMin === 2) return "منذ دقيقتين";
    if (diffMin <= 10) return `منذ ${diffMin} دقائق`;
    return `منذ ${diffMin} دقيقة`;
  }

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) {
    if (diffHours === 1) return "منذ ساعة";
    if (diffHours === 2) return "منذ ساعتين";
    if (diffHours <= 10) return `منذ ${diffHours} ساعات`;
    return `منذ ${diffHours} ساعة`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) {
    return "منذ يوم";
  }
  if (diffDays === 2) {
    return "منذ يومين";
  }
  if (diffDays <= 10) {
    return `منذ ${diffDays} أيام`;
  }
  if (diffDays < 30) {
    return `منذ ${diffDays} يوماً`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "منذ شهر";
  if (diffMonths === 2) return "منذ شهرين";
  if (diffMonths <= 10) return `منذ ${diffMonths} أشهر`;
  return `منذ ${diffMonths} شهراً`;
}

/**
 * Formats exact timestamp in Arabic locale
 */
export function formatTimestampArabic(date) {
  if (!date) return "لم يسجل بعد";
  const parsed = date instanceof Date ? date : new Date(date);
  if (isNaN(parsed.getTime())) return "غير محدد";

  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(parsed);
  } catch {
    return parsed.toLocaleString();
  }
}

/**
 * Computes comprehensive activity stats for a captain.
 *
 * @param {Object} user - User document
 * @param {Object} historicalData
 * @param {Array<string|Date>} [historicalData.attendanceDates] - Genuine attendance dates
 * @param {Array<string|Date>} [historicalData.paymentDates] - Genuine payment dates
 * @param {Array<string|Date>} [historicalData.mutationDates] - Player/Branch/Event creation/update dates
 * @param {Date} [now]
 */
export function computeCaptainActivityStats(user, historicalData = {}, now = new Date()) {
  if (!user) {
    return {
      isOnline: false,
      onlineStatus: "offline",
      lastSeenAt: null,
      lastSeenFormatted: "لم ينشط بعد",
      lastLoginAt: null,
      lastLoginFormatted: "لم يسجل بعد",
      lastLoginExact: "لم يسجل بعد",
      activeDays7: 0,
      activeDays30: 0,
      activityClassification: "insufficient_data",
      activityClassificationLabel: "بيانات غير كافية ⚪",
      activityClassificationBadge: "بيانات غير كافية ⚪",
      activityClassificationColor: "slate",
    };
  }

  const nowMs = now.getTime();

  // 1. Resolve Effective Last Login / Last Interaction Timestamp
  // Prefer explicit lastLoginAt, but gracefully fallback to candidate dates:
  // lastSeenAt, lastActiveAt, historical mutation/attendance/payment dates, activeDays, updatedAt, createdAt
  const candidateDates = [];
  const collectDate = (val) => {
    if (!val) return;
    try {
      const d = val instanceof Date ? val : new Date(val);
      if (!isNaN(d.getTime()) && d.getTime() > 0) {
        candidateDates.push(d);
      }
    } catch {}
  };

  collectDate(user.lastLoginAt);
  collectDate(user.lastSeenAt);
  collectDate(user.lastActiveAt);

  if (Array.isArray(historicalData.attendanceDates)) {
    historicalData.attendanceDates.forEach(collectDate);
  }
  if (Array.isArray(historicalData.paymentDates)) {
    historicalData.paymentDates.forEach(collectDate);
  }
  if (Array.isArray(historicalData.mutationDates)) {
    historicalData.mutationDates.forEach(collectDate);
  }
  if (Array.isArray(user.activeDays)) {
    user.activeDays.forEach(collectDate);
  }

  collectDate(user.updatedAt);
  collectDate(user.createdAt);

  const effectiveLastLoginDate = candidateDates.length > 0
    ? new Date(Math.max(...candidateDates.map((d) => d.getTime())))
    : null;

  // 2. Online status with 120-second timeout
  // Online flag checks any valid server timestamp indicating presence in the last 120 seconds
  const presenceCandidates = [];
  const addPresenceTime = (val) => {
    if (!val) return;
    try {
      const d = val instanceof Date ? val : new Date(val);
      if (!isNaN(d.getTime()) && d.getTime() > 0) presenceCandidates.push(d.getTime());
    } catch {}
  };

  addPresenceTime(user.lastSeenAt);
  addPresenceTime(user.lastActiveAt);
  addPresenceTime(user.lastLoginAt);

  const latestPresenceMs = presenceCandidates.length > 0 ? Math.max(...presenceCandidates) : 0;
  const isOnline = Boolean(latestPresenceMs > 0 && nowMs - latestPresenceMs <= ONLINE_TIMEOUT_MS);
  const onlineStatus = isOnline ? "online" : "offline";

  // Last seen reference timestamp:
  // Prefer direct presence (lastSeenAt/lastActiveAt/lastLoginAt), else fallback to effective interaction date
  const lastSeenRefDate = latestPresenceMs > 0 ? new Date(latestPresenceMs) : effectiveLastLoginDate;

  // Last seen formatted:
  // If isOnline is true -> "متصل الآن 🟢"
  // If isOnline is false -> accurate past relative time ("منذ دقيقتين", "منذ ساعة", "منذ يومين", etc.)
  // NEVER says "متصل الآن" if isOnline is false!
  const lastSeenFormatted = isOnline
    ? "متصل الآن 🟢"
    : lastSeenRefDate
    ? formatRelativeArabicTime(lastSeenRefDate, now, { allowOnline: false })
    : "لم ينشط بعد";

  // Last login formatted in relative Arabic ("منذ يوم", "منذ يومين", "منذ 17 يوماً", etc.)
  // NEVER says "متصل الآن 🟢" for a login event!
  const lastLoginFormatted = effectiveLastLoginDate
    ? formatRelativeArabicTime(effectiveLastLoginDate, now, { allowOnline: false })
    : "لم يسجل بعد";

  const lastLoginExact = effectiveLastLoginDate
    ? formatTimestampArabic(effectiveLastLoginDate)
    : "لم يسجل بعد";

  const lastLoginAt = effectiveLastLoginDate
    ? effectiveLastLoginDate.toISOString()
    : null;

  // 2. Aggregate Genuine Active Days (Strictly genuine activity, NOT logins or heartbeats alone)
  const genuineDaysSet = new Set();

  // 2.1 Stored activeDays from genuine mutations
  if (Array.isArray(user.activeDays)) {
    for (const d of user.activeDays) {
      if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
        genuineDaysSet.add(d);
      }
    }
  }

  // 2.2 Historical attendance dates from players
  if (Array.isArray(historicalData.attendanceDates)) {
    for (const item of historicalData.attendanceDates) {
      if (!item) continue;
      const dStr = typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item)
        ? item
        : getAppDateString(item);
      if (dStr) genuineDaysSet.add(dStr);
    }
  }

  // 2.3 Historical payment dates from players
  if (Array.isArray(historicalData.paymentDates)) {
    for (const item of historicalData.paymentDates) {
      if (!item) continue;
      const dStr = typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item)
        ? item
        : getAppDateString(item);
      if (dStr) genuineDaysSet.add(dStr);
    }
  }

  // 2.4 Historical mutation dates (player, branch, event creation / update)
  if (Array.isArray(historicalData.mutationDates)) {
    for (const item of historicalData.mutationDates) {
      if (!item) continue;
      const dStr = typeof item === "string" && /^\d{4}-\d{2}-\d{2}$/.test(item)
        ? item
        : getAppDateString(item);
      if (dStr) genuineDaysSet.add(dStr);
    }
  }

  // 3. Count active days over the last 7 and 30 days
  const todayStr = getAppDateString(now);

  // Calculate 7-day cutoff (inclusive: today - 6 days through today = 7 calendar days)
  const date7DaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const cutoff7Str = getAppDateString(date7DaysAgo);

  // Calculate 30-day cutoff (inclusive: today - 29 days through today = 30 calendar days)
  const date30DaysAgo = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
  const cutoff30Str = getAppDateString(date30DaysAgo);

  let activeDays7 = 0;
  let activeDays30 = 0;

  for (const dayStr of genuineDaysSet) {
    if (dayStr >= cutoff30Str && dayStr <= todayStr) {
      activeDays30++;
    }
    if (dayStr >= cutoff7Str && dayStr <= todayStr) {
      activeDays7++;
    }
  }

  // 4. Classify captains based on actual usage:
  // - Frequent: High engagement in the last 30/7 days (>= 10 active days in 30d, or >= 4 active days in 7d)
  // - Occasional: Moderate engagement (>= 4 active days in 30d, or >= 2 active days in 7d)
  // - Low Activity: Minimal engagement (>= 1 active day in 30d/7d)
  // - Insufficient Data: 0 genuine active days recorded in the timeframe
  let activityClassification = "insufficient_data";
  let activityClassificationLabel = "بيانات غير كافية ⚪";
  let activityClassificationBadge = "بيانات غير كافية ⚪";
  let activityClassificationColor = "slate";

  if (activeDays30 >= 10 || activeDays7 >= 4) {
    activityClassification = "frequent";
    activityClassificationLabel = "استخدام متكرر ⚡";
    activityClassificationBadge = "متكرر ⚡";
    activityClassificationColor = "emerald";
  } else if (activeDays30 >= 4 || activeDays7 >= 2) {
    activityClassification = "occasional";
    activityClassificationLabel = "استخدام دوري 🟢";
    activityClassificationBadge = "دوري 🟢";
    activityClassificationColor = "blue";
  } else if (activeDays30 >= 1 || activeDays7 >= 1) {
    activityClassification = "low_activity";
    activityClassificationLabel = "نشاط منخفض 🟡";
    activityClassificationBadge = "نشاط منخفض 🟡";
    activityClassificationColor = "amber";
  } else {
    activityClassification = "insufficient_data";
    activityClassificationLabel = "بيانات غير كافية ⚪";
    activityClassificationBadge = "بيانات غير كافية ⚪";
    activityClassificationColor = "slate";
  }

  return {
    isOnline,
    onlineStatus,
    lastSeenAt: lastSeenRefDate ? lastSeenRefDate.toISOString() : null,
    lastSeenFormatted,
    lastLoginAt,
    lastLoginFormatted,
    lastLoginExact,
    activeDays7,
    activeDays30,
    totalRecordedActiveDays: genuineDaysSet.size,
    activityClassification,
    activityClassificationLabel,
    activityClassificationBadge,
    activityClassificationColor,
  };
}
