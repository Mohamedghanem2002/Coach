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
    const base = curExp && !isNaN(curExp.getTime()) && curExp.getTime() > now.getTime()
      ? curExp
      : new Date(now);

    if (resolvedMonths) {
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
 *
 * @param {Date|string|number} expiresAt
 * @param {Date} now
 * @returns {number|null}
 */
export function calculateDaysRemaining(expiresAt, now = new Date()) {
  if (!expiresAt) return null;
  const expDate = new Date(expiresAt);
  if (isNaN(expDate.getTime())) return null;

  const diffMs = expDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Checks if a user's subscription has expired.
 * Admin accounts are perpetual and never expire.
 *
 * @param {Object} user
 * @param {Date} now
 * @returns {boolean}
 */
export function isSubscriptionExpired(user, now = new Date()) {
  if (!user || user.role === "admin") return false;
  if (!user.subscriptionExpiresAt) return false;

  const expTime = new Date(user.subscriptionExpiresAt).getTime();
  return !isNaN(expTime) && expTime < now.getTime();
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
