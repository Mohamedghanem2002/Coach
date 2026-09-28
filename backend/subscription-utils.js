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
    d.setMonth(d.getMonth() + count);
  } else if (unit === "years") {
    d.setFullYear(d.getFullYear() + count);
  } else {
    d.setDate(d.getDate() + count);
  }

  return d;
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
    const expiredActiveUsers = await usersCollection
      .find({
        role: { $ne: "admin" },
        status: "active",
        subscriptionExpiresAt: { $lt: now },
      })
      .toArray();

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
