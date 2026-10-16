/**
 * Utility functions for calendar-aware subscription calculations and auto-expiration sync.
 */

/**
 * Adds calendar-accurate periods (months, years, days) to a date.
 * E.g. starting on September 3 and adding 1 month results in October 3.
 *
 * @param {Date|string|number} startDate
 * @param {number} count Number of units
 * @param {"months"|"years"|"days"} unit Unit type
 * @returns {Date}
 */
export function addCalendarPeriod(startDate, count = 1, unit = "months") {
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return new Date();

  if (unit === "months") {
    const targetDay = d.getDate();
    d.setMonth(d.getMonth() + count);
    if (d.getDate() !== targetDay) {
      d.setDate(0); // clamp to last day of previous month
    }
  } else if (unit === "years") {
    const targetDay = d.getDate();
    d.setFullYear(d.getFullYear() + count);
    if (d.getDate() !== targetDay) {
      d.setDate(0);
    }
  } else {
    d.setDate(d.getDate() + count);
  }

  return d;
}

/**
 * Computes exact subscription expiration date based on mode (from_entry, additive, or custom).
 *
 * @param {Object} options
 * @param {Date|string} options.entryDate
 * @param {Date|string} options.currentExpiry
 * @param {string} options.mode "from_entry" | "additive" | "custom_date"
 * @param {number} [options.months]
 * @param {number} [options.days]
 * @param {string|Date} [options.customDate]
 * @param {Date} [options.now]
 * @returns {Date}
 */
export function computeSubscriptionExpiry({
  entryDate,
  currentExpiry,
  mode = "from_entry",
  months,
  days,
  customDate,
  now = new Date(),
}) {
  if (mode === "lifetime" || months >= 1200) {
    const base = entryDate ? new Date(entryDate) : new Date(now);
    const validBase = isNaN(base.getTime()) ? new Date(now) : base;
    return addCalendarPeriod(validBase, 100, "years");
  }

  if (mode === "custom_date" || customDate) {
    const parsed = new Date(customDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  let resolvedMonths = months;
  if (!resolvedMonths && days) {
    if (days === 30) resolvedMonths = 1;
    else if (days === 90) resolvedMonths = 3;
    else if (days === 180) resolvedMonths = 6;
    else if (days === 365) resolvedMonths = 12;
  }

  if (mode === "from_entry" || !mode) {
    const base = entryDate ? new Date(entryDate) : new Date(now);
    const validBase = isNaN(base.getTime()) ? new Date(now) : base;

    if (resolvedMonths) {
      if (resolvedMonths >= 1200) {
        return addCalendarPeriod(validBase, 100, "years");
      }
      if (resolvedMonths === 12) {
        return addCalendarPeriod(validBase, 1, "years");
      }
      return addCalendarPeriod(validBase, resolvedMonths, "months");
    }
    if (days) {
      return addCalendarPeriod(validBase, days, "days");
    }
    return addCalendarPeriod(validBase, 1, "months");
  }

  if (mode === "additive") {
    const curExp = currentExpiry ? new Date(currentExpiry) : null;
    const isCurLifetime =
      curExp &&
      !isNaN(curExp.getTime()) &&
      curExp.getTime() - now.getTime() > 5 * 365 * 24 * 60 * 60 * 1000;

    const base =
      curExp && !isNaN(curExp.getTime()) && curExp.getTime() > now.getTime() && !isCurLifetime
        ? curExp
        : new Date(now);

    if (resolvedMonths) {
      if (resolvedMonths >= 1200) {
        return addCalendarPeriod(base, 100, "years");
      }
      if (resolvedMonths === 12) {
        return addCalendarPeriod(base, 1, "years");
      }
      return addCalendarPeriod(base, resolvedMonths, "months");
    }
    if (days) {
      return addCalendarPeriod(base, days, "days");
    }
    return addCalendarPeriod(base, 1, "months");
  }

  return addCalendarPeriod(now, 1, "months");
}

/**
 * Calculates remaining days from now until expiration date.
 * Dynamically decreases by 1 every 24 hours.
 * Returns null for lifetime subscriptions and admin accounts.
 *
 * @param {Date|string|number} expiresAt
 * @param {Date} now
 * @param {Object} [user]
 * @returns {number|null}
 */
export function calculateDaysRemaining(expiresAt, now = new Date(), user = null) {
  if (user && (user.subscriptionPlan === "lifetime" || user.isLifetime || user.role === "admin")) {
    return null;
  }
  if (!expiresAt) return null;
  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) return null;

  const diffMs = expDate.getTime() - now.getTime();
  // If expiry is more than 30 years in future, treat as lifetime
  if (diffMs > 30 * 365 * 24 * 60 * 60 * 1000) {
    return null;
  }
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Checks if a user's subscription has expired.
 * Admin and Lifetime accounts are perpetual and never expire.
 *
 * @param {Object} user
 * @param {Date} now
 * @returns {boolean}
 */
export function isSubscriptionExpired(user, now = new Date()) {
  if (!user || user.role === "admin") return false;
  if (user.subscriptionPlan === "lifetime" || user.isLifetime) return false;
  if (!user.subscriptionExpiresAt) return false;

  const expTime = new Date(user.subscriptionExpiresAt).getTime();
  if (isNaN(expTime)) return false;

  // If expiry is > 30 years in future, never expired
  if (expTime - now.getTime() > 30 * 365 * 24 * 60 * 60 * 1000) return false;

  return expTime < now.getTime();
}

/**
 * Automatically synchronizes and suspends expired accounts in the database.
 * Runs atomically when captains or overview data is fetched.
 *
 * @param {Object} usersCollection
 * @param {Date} now
 * @returns {Promise<number>} Number of accounts suspended
 */
export async function autoSyncExpiredAccounts(usersCollection, now = new Date()) {
  if (!usersCollection) return 0;

  try {
    const allUsers = await usersCollection.find({}).toArray();
    const expiredActiveUsers = allUsers.filter((u) => {
      if (!u || u.role === "admin") return false;
      // Only accounts that are currently marked active but have expired
      return u.status === "active" && isSubscriptionExpired(u, now);
    });

    if (expiredActiveUsers.length === 0) return 0;

    for (const u of expiredActiveUsers) {
      await usersCollection.updateOne(
        { _id: u._id },
        {
          $set: {
            status: "suspended",
            subscriptionStatus: "expired",
            suspensionReason: "انتهت فترة اشتراك الحساب تلقائياً. يرجى تجديد أو سداد الاشتراك لاستئناف الخدمة.",
            updatedAt: now,
          },
        }
      );
    }

    return expiredActiveUsers.length;
  } catch (err) {
    console.error("autoSyncExpiredAccounts error:", err?.message || err);
    return 0;
  }
}

/**
 * Computes captain activity status, engagement score, and formatted activity string.
 * Accurately differentiates captains who use the platform daily from those who registered and never started.
 *
 * @param {Object} user
 * @param {Object} context
 * @param {number} [context.playersCount]
 * @param {number} [context.hallsCount]
 * @param {number} [context.eventsCount]
 * @param {Date|string} [context.latestPlayerUpdate]
 * @param {number} [context.recentAttendanceCount]
 * @param {Date} [now]
 * @returns {Object}
 */
export function computeCaptainActivity(
  user,
  {
    playersCount = 0,
    hallsCount = 0,
    eventsCount = 0,
    latestPlayerUpdate = null,
    recentAttendanceCount = 0,
  } = {},
  now = new Date()
) {
  if (!user) {
    return {
      activityStatus: "dormant",
      activityLabel: "غير محدد",
      activityScore: 0,
      lastActiveAt: null,
      lastActiveFormatted: "لم ينشط بعد",
      isDailyActive: false,
      isWeeklyActive: false,
      isDormant: true,
      hasEverStarted: false,
    };
  }

  // 1. Determine effective lastActive timestamp
  const userLastActive = user.lastActiveAt ? new Date(user.lastActiveAt) : null;
  const userLastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
  const playerUpdate = latestPlayerUpdate ? new Date(latestPlayerUpdate) : null;
  const userCreated = user.createdAt ? new Date(user.createdAt) : null;

  let effectiveDate = userLastActive;
  if (userLastLogin && (!effectiveDate || userLastLogin > effectiveDate)) {
    effectiveDate = userLastLogin;
  }
  if (playerUpdate && (!effectiveDate || playerUpdate > effectiveDate)) {
    effectiveDate = playerUpdate;
  }
  if (!effectiveDate) {
    effectiveDate = userCreated;
  }

  const msSinceActive = effectiveDate ? Math.max(0, now.getTime() - effectiveDate.getTime()) : null;
  const hoursSinceActive = msSinceActive !== null ? msSinceActive / (1000 * 60 * 60) : null;
  const daysSinceActive = hoursSinceActive !== null ? hoursSinceActive / 24 : null;

  // Format relative Arabic time
  let lastActiveFormatted = "لم ينشط بعد";
  if (effectiveDate) {
    if (hoursSinceActive < 1) {
      lastActiveFormatted = "نشط الآن 🟢";
    } else if (hoursSinceActive < 24) {
      const h = Math.floor(hoursSinceActive);
      lastActiveFormatted = h === 1 ? "منذ ساعة" : h === 2 ? "منذ ساعتين" : `منذ ${h} ساعات`;
    } else if (daysSinceActive < 2) {
      lastActiveFormatted = "أمس";
    } else if (daysSinceActive < 7) {
      const d = Math.floor(daysSinceActive);
      lastActiveFormatted = d === 2 ? "منذ يومين" : `منذ ${d} أيام`;
    } else if (daysSinceActive < 30) {
      const w = Math.floor(daysSinceActive / 7);
      lastActiveFormatted = w === 1 ? "منذ أسبوع" : w === 2 ? "منذ أسبوعين" : `منذ ${w} أسابيع`;
    } else {
      const m = Math.floor(daysSinceActive / 30);
      lastActiveFormatted = m === 1 ? "منذ شهر" : m === 2 ? "منذ شهرين" : `منذ ${m} أشهر`;
    }
  }

  // 2. Activity Classification
  const hasEverStarted = playersCount > 0 || hallsCount > 0 || eventsCount > 0;

  let activityStatus = "dormant";
  let activityLabel = "خامل 💤";
  let activityBadge = "خامل / لم يبدأ 💤";
  let activityScore = 10;

  if (!hasEverStarted) {
    activityStatus = "dormant";
    activityLabel = "سجّل ولم يبدأ 💤";
    activityBadge = "سجّل ولم يبدأ (0 لاعبين)";
    activityScore = 5;
  } else if (hoursSinceActive !== null && hoursSinceActive <= 48 && (playersCount > 0 || recentAttendanceCount > 0)) {
    // Active in the last 48 hours or marked attendance recently
    activityStatus = "daily";
    activityLabel = "نشط شبه يومي ⚡";
    activityBadge = "نشط شبه يومي ⚡";
    activityScore = 95 - Math.min(20, Math.floor(hoursSinceActive / 2));
  } else if (daysSinceActive !== null && daysSinceActive <= 7) {
    activityStatus = "weekly";
    activityLabel = "نشط أسبوعياً 🟢";
    activityBadge = "نشط أسبوعياً 🟢";
    activityScore = 70 - Math.min(20, Math.floor(daysSinceActive * 2));
  } else if (daysSinceActive !== null && daysSinceActive <= 30) {
    activityStatus = "low";
    activityLabel = "قليل التفاعل 🟡";
    activityBadge = "قليل التفاعل 🟡";
    activityScore = 40 - Math.min(20, Math.floor((daysSinceActive - 7) / 2));
  } else {
    activityStatus = "dormant";
    activityLabel = "خامل (شهر+) 💤";
    activityBadge = "خامل منذ أكثر من شهر";
    activityScore = 15;
  }

  return {
    activityStatus,
    activityLabel,
    activityBadge,
    activityScore,
    lastActiveAt: effectiveDate,
    lastActiveFormatted,
    daysSinceActive: daysSinceActive !== null ? Math.round(daysSinceActive) : null,
    isDailyActive: activityStatus === "daily",
    isWeeklyActive: activityStatus === "weekly",
    isDormant: activityStatus === "dormant",
    hasEverStarted,
  };
}

/**
 * Checks if a captain's subscription is expiring in 3 days or less and builds the warning alert payload.
 *
 * @param {Object} user
 * @param {Date} [now]
 * @returns {Object}
 */
export function getSubscriptionAlertInfo(user, now = new Date()) {
  if (!user || user.role === "admin" || user.subscriptionPlan === "lifetime" || user.isLifetime) {
    return { isExpiringSoon: false, daysRemaining: null };
  }

  const daysRemaining = calculateDaysRemaining(user.subscriptionExpiresAt, now, user);
  if (daysRemaining === null || daysRemaining < 0 || daysRemaining > 3) {
    return { isExpiringSoon: false, daysRemaining };
  }

  const urgent = daysRemaining <= 1;
  const academyName = user.academyName || "الأكاديمية";

  let title = `⚠️ متبقي ${daysRemaining} أيام على انتهاء اشتراك الأكاديمية`;
  let message = `متبقي ${daysRemaining} أيام على انتهاء اشتراك أكاديمية (${academyName}). يُرجى تجديد الاشتراك لاستمرار الخدمة دون أي انقطاع.`;

  if (daysRemaining === 0) {
    title = "⚠️ تنبيه عاجل: اليوم هو آخر موعد في اشتراك الأكاديمية!";
    message = `ينتهي اشتراك أكاديمية (${academyName}) اليوم بنهاية اليوم! يُرجى سرعة التجديد الآن لتجنب تعليق الخدمة التلقائي.`;
  } else if (daysRemaining === 1) {
    title = "⚠️ متبقي يوم واحد فقط على انتهاء اشتراك الأكاديمية!";
    message = `متبقي 24 ساعة تقريباً على انتهاء اشتراك أكاديمية (${academyName})! يُرجى سرعة التجديد الآن لضمان استمرار النظام وفروعه.`;
  } else if (daysRemaining === 2) {
    title = "⚠️ متبقي يومان على انتهاء اشتراك الأكاديمية!";
    message = `متبقي يومان على انتهاء اشتراك أكاديمية (${academyName}). يُرجى التجديد لضمان استمرار الخدمة دون أي انقطاع.`;
  }

  return {
    isExpiringSoon: true,
    daysRemaining,
    urgent,
    title,
    message,
    academyName,
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    whatsAppNumber: "201552488179",
    contactPhones: ["0155 248 8179", "0102 813 8408"],
    renewalWhatsAppUrl: `https://wa.me/201552488179?text=${encodeURIComponent(
      `السلام عليكم إدارة CoachMaster، أنا كابتن ${user.name || ""} من أكاديمية (${academyName})، متبقي على اشتراكي ${daysRemaining} يوم وأرغب في تجديد الاشتراك.`
    )}`,
  };
}

