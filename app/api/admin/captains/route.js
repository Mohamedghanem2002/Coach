import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireAdmin } from "../../../../backend/admin-auth";
import {
  autoSyncExpiredAccounts,
  calculateDaysRemaining,
  isSubscriptionExpired,
  computeCaptainActivity,
  getSubscriptionAlertInfo,
} from "../../../../backend/subscription-utils";
import { computeCaptainActivityStats } from "../../../../backend/activity-tracking";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "all").trim().toLowerCase();
    const dateFilter = (searchParams.get("dateFilter") || "all").trim().toLowerCase();
    const sortBy = (searchParams.get("sortBy") || "newest").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date();
    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").trim().toLowerCase();

    // Auto-sync and suspend expired accounts in the database
    await autoSyncExpiredAccounts(db.collection("users"), now);

    const isSystemAdmin = (u) => {
      if (!u) return false;
      if (u.role === "admin") return true;
      if (u.email && u.email.trim().toLowerCase() === adminEmail) return true;
      return false;
    };

    // 1. Query accounts from actual database (strictly excluding system admins)
    const allUsers = await db.collection("users").find({}).toArray();
    const captainUsers = allUsers.filter((u) => !isSystemAdmin(u));

    // 2. Fetch aggregation counts and infrastructure data
    let branchPlayerCounts = [];
    try {
      if (typeof db.collection("players").aggregate === "function") {
        branchPlayerCounts = await db.collection("players").aggregate([
          {
            $group: {
              _id: {
                ownerId: { $toString: "$ownerId" },
                branch: { $trim: { input: { $ifNull: ["$branch", ""] } } },
              },
              count: { $sum: 1 },
            },
          },
        ]).toArray();
      } else {
        throw new Error("aggregate not supported");
      }
    } catch {
      const allPlayers = await db.collection("players").find({}).toArray();
      const countMap = new Map();
      for (const p of allPlayers) {
        const oId = p.ownerId ? p.ownerId.toString() : "";
        const bName = (p.branch || "").trim();
        const key = `${oId}:::${bName}`;
        countMap.set(key, (countMap.get(key) || 0) + 1);
      }
      branchPlayerCounts = Array.from(countMap.entries()).map(([key, count]) => {
        const [ownerId, branch] = key.split(":::");
        return {
          _id: { ownerId, branch },
          count,
        };
      });
    }

    // 2.1 Fetch latest player activity (last update & attendance count) per captain
    const latestPlayerActivityMap = new Map();
    try {
      if (typeof db.collection("players").aggregate === "function") {
        const activities = await db.collection("players").aggregate([
          {
            $group: {
              _id: { $toString: "$ownerId" },
              latestUpdate: { $max: "$updatedAt" },
              totalAttendance: { $sum: { $size: { $ifNull: ["$attendance", []] } } },
            },
          },
        ]).toArray();
        for (const item of activities) {
          latestPlayerActivityMap.set(item._id, {
            latestUpdate: item.latestUpdate,
            attendanceCount: item.totalAttendance || 0,
          });
        }
      }
    } catch {
      // Graceful fallback
    }

    const [allBranches, allEvents] = await Promise.all([
      db.collection("branches").find({}).toArray(),
      db.collection("events").find({}).toArray(),
    ]);

    // 2.2 Collect genuine historical activity dates per captain
    const captainActivityDatesMap = new Map();
    try {
      const allPlayersForActivity = await db.collection("players").find(
        {},
        { projection: { ownerId: 1, createdAt: 1, updatedAt: 1, attendance: 1, paymentHistory: 1 } }
      ).toArray();

      for (const p of allPlayersForActivity) {
        const oId = p.ownerId ? p.ownerId.toString() : "";
        if (!oId) continue;
        if (!captainActivityDatesMap.has(oId)) {
          captainActivityDatesMap.set(oId, { attendanceDates: [], paymentDates: [], mutationDates: [] });
        }
        const bucket = captainActivityDatesMap.get(oId);
        if (p.createdAt) bucket.mutationDates.push(p.createdAt);
        if (p.updatedAt) bucket.mutationDates.push(p.updatedAt);
        if (Array.isArray(p.attendance)) {
          for (const att of p.attendance) {
            if (att?.date) bucket.attendanceDates.push(att.date);
            else if (typeof att === "string") bucket.attendanceDates.push(att);
          }
        }
        if (Array.isArray(p.paymentHistory)) {
          for (const pay of p.paymentHistory) {
            if (pay?.date) bucket.paymentDates.push(pay.date);
            else if (pay?.createdAt) bucket.paymentDates.push(pay.createdAt);
          }
        }
      }
    } catch {
      // Graceful fallback
    }

    for (const b of allBranches) {
      const oId = b.ownerId ? b.ownerId.toString() : "";
      if (oId) {
        if (!captainActivityDatesMap.has(oId)) {
          captainActivityDatesMap.set(oId, { attendanceDates: [], paymentDates: [], mutationDates: [] });
        }
        const bucket = captainActivityDatesMap.get(oId);
        if (b.createdAt) bucket.mutationDates.push(b.createdAt);
        if (b.updatedAt) bucket.mutationDates.push(b.updatedAt);
      }
    }

    for (const e of allEvents) {
      const oId = e.ownerId ? e.ownerId.toString() : "";
      if (oId) {
        if (!captainActivityDatesMap.has(oId)) {
          captainActivityDatesMap.set(oId, { attendanceDates: [], paymentDates: [], mutationDates: [] });
        }
        const bucket = captainActivityDatesMap.get(oId);
        if (e.createdAt) bucket.mutationDates.push(e.createdAt);
        if (e.updatedAt) bucket.mutationDates.push(e.updatedAt);
        if (e.date) bucket.mutationDates.push(e.date);
      }
    }

    // Build lookup maps for counts: key = `${ownerId}:::${branchName}` and totalCountByOwner
    const branchCountMap = new Map();
    const totalCountByOwner = new Map();

    for (const item of branchPlayerCounts) {
      const oId = item._id.ownerId;
      const bName = (item._id.branch || "").toLowerCase();
      const count = item.count || 0;

      branchCountMap.set(`${oId}:::${bName}`, count);
      totalCountByOwner.set(oId, (totalCountByOwner.get(oId) || 0) + count);
    }

    const branchesByOwner = new Map();
    for (const b of allBranches) {
      const oId = b.ownerId ? b.ownerId.toString() : "";
      if (!branchesByOwner.has(oId)) branchesByOwner.set(oId, []);
      branchesByOwner.get(oId).push(b);
    }

    const eventsByOwner = new Map();
    for (const e of allEvents) {
      const oId = e.ownerId ? e.ownerId.toString() : "";
      if (!eventsByOwner.has(oId)) eventsByOwner.set(oId, []);
      eventsByOwner.get(oId).push(e);
    }

    // 3. Process every captain account with actual database relationships (Admins are strictly excluded)
    const processedCaptains = captainUsers.map((u) => {
      const uId = u._id.toString();
      const captainPlayersCount = totalCountByOwner.get(uId) || 0;
      const uBranches = branchesByOwner.get(uId) || [];
      const uEvents = eventsByOwner.get(uId) || [];

      // Calculate players count per branch/hall
      const branchesDetails = uBranches.map((b) => {
        const bName = (b.name || "").trim().toLowerCase();
        const pInBranch = branchCountMap.get(`${uId}:::${bName}`) || 0;
        return {
          id: b._id.toString(),
          name: b.name,
          days: b.days || [],
          playersCount: pInBranch,
          createdAt: b.createdAt,
        };
      });

      const isExpired = isSubscriptionExpired(u, now);
      const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended" || isExpired;

      let computedStatus = "active";
      if (isSuspended) computedStatus = isExpired ? "expired" : "suspended";

      const daysRemaining = calculateDaysRemaining(u.subscriptionExpiresAt, now);

      const subTotal = Number(u.subscriptionTotalAmount || 0);
      const subPaid = Number(u.subscriptionPaidAmount || 0);
      const subRemaining = Math.max(0, subTotal - subPaid);
      let subPaymentStatus = "unpaid";
      if (subTotal > 0) {
        if (subPaid >= subTotal) {
          subPaymentStatus = "paid";
        } else if (subPaid > 0) {
          subPaymentStatus = "partial";
        } else {
          subPaymentStatus = "unpaid";
        }
      } else if (u.subscriptionPaid !== false) {
        subPaymentStatus = "paid";
      }

      // Compute activity metrics (differentiating daily active coaches from dormant ones)
      const playerActivity = latestPlayerActivityMap.get(uId) || {};
      const activity = computeCaptainActivity(
        u,
        {
          playersCount: captainPlayersCount,
          hallsCount: uBranches.length,
          eventsCount: uEvents.length,
          latestPlayerUpdate: playerActivity.latestUpdate,
          recentAttendanceCount: playerActivity.attendanceCount || 0,
        },
        now
      );

      // Compute comprehensive activity tracking stats (genuine usage, heartbeat, server timestamps)
      const historicalData = captainActivityDatesMap.get(uId) || {};
      const activityTracking = computeCaptainActivityStats(u, historicalData, now);

      // Check for 3-day subscription expiration warning
      const expiryAlert = getSubscriptionAlertInfo(u, now);

      return {
        id: uId,
        _id: uId,
        name: u.name || "كابتن",
        academyName: u.academyName || "أكاديمية جديدة",
        email: u.email,
        phone: u.phone || "",
        role: u.role || "user",
        isAdmin: false,
        status: u.status || "active",
        subscriptionStatus: computedStatus,
        subscriptionPlan: u.subscriptionPlan || "Standard",
        subscriptionStartedAt: u.subscriptionStartedAt || u.createdAt,
        subscriptionExpiresAt: u.subscriptionExpiresAt || null,
        subscriptionPaid: u.subscriptionPaid !== false,
        subscriptionTotalAmount: subTotal,
        subscriptionPaidAmount: subPaid,
        subscriptionRemainingAmount: subRemaining,
        subscriptionPaymentStatus: subPaymentStatus,
        suspensionReason: u.suspensionReason || null,
        daysRemaining,
        // Activity classification
        activityStatus: activity.activityStatus,
        activityLabel: activity.activityLabel,
        activityBadge: activity.activityBadge,
        activityScore: activity.activityScore,
        lastActiveAt: activity.lastActiveAt,
        lastActiveFormatted: activity.lastActiveFormatted,
        isDailyActive: activity.isDailyActive,
        isWeeklyActive: activity.isWeeklyActive,
        isDormant: activity.isDormant,
        hasEverStarted: activity.hasEverStarted,
        // Activity Tracking & Genuine Usage
        isOnline: activityTracking.isOnline,
        onlineStatus: activityTracking.onlineStatus,
        lastSeenAt: activityTracking.lastSeenAt,
        lastSeenFormatted: activityTracking.lastSeenFormatted,
        lastLoginAt: activityTracking.lastLoginAt,
        lastLoginFormatted: activityTracking.lastLoginFormatted,
        activeDays7: activityTracking.activeDays7,
        activeDays30: activityTracking.activeDays30,
        totalRecordedActiveDays: activityTracking.totalRecordedActiveDays,
        activityClassification: activityTracking.activityClassification,
        activityClassificationLabel: activityTracking.activityClassificationLabel,
        activityClassificationBadge: activityTracking.activityClassificationBadge,
        activityClassificationColor: activityTracking.activityClassificationColor,
        // Expiration notification alert
        isExpiringSoon: expiryAlert.isExpiringSoon,
        expiryAlert,
        // Exact real relationship counters
        stats: {
          players: captainPlayersCount,
          halls: uBranches.length,
          events: uEvents.length,
        },
        playersCount: captainPlayersCount,
        branchesCount: uBranches.length,
        hallsCount: uBranches.length,
        eventsCount: uEvents.length,
        branchesDetails,
        createdAt: u.createdAt,
      };
    });

    // 4. Platform-wide summary statistics (Strictly matches the exact sum of all captains)
    const totalCaptainsPlayers = processedCaptains.reduce(
      (sum, c) => sum + (c.stats?.players || 0),
      0
    );
    const totalCaptainsHalls = processedCaptains.reduce(
      (sum, c) => sum + (c.stats?.halls || 0),
      0
    );
    const totalCaptainsEvents = processedCaptains.reduce(
      (sum, c) => sum + (c.stats?.events || 0),
      0
    );

    const dailyActiveCaptains = processedCaptains.filter((c) => c.activityStatus === "daily").length;
    const weeklyActiveCaptains = processedCaptains.filter((c) => c.activityStatus === "weekly").length;
    const dormantCaptains = processedCaptains.filter((c) => c.activityStatus === "dormant").length;
    const expiringSoonCaptains = processedCaptains.filter((c) => c.isExpiringSoon).length;

    const onlineCaptains = processedCaptains.filter((c) => c.isOnline).length;
    const frequentCaptains = processedCaptains.filter((c) => c.activityClassification === "frequent").length;
    const occasionalCaptains = processedCaptains.filter((c) => c.activityClassification === "occasional").length;
    const lowActivityCaptains = processedCaptains.filter((c) => c.activityClassification === "low_activity").length;
    const insufficientDataCaptains = processedCaptains.filter((c) => c.activityClassification === "insufficient_data").length;

    const summary = {
      totalCaptains: processedCaptains.length,
      totalAccounts: processedCaptains.length,
      totalPlayers: totalCaptainsPlayers,
      totalHalls: totalCaptainsHalls,
      totalEvents: totalCaptainsEvents,
      dailyActiveCaptains,
      weeklyActiveCaptains,
      dormantCaptains,
      expiringSoonCaptains,
      onlineCaptains,
      frequentCaptains,
      occasionalCaptains,
      lowActivityCaptains,
      insufficientDataCaptains,
    };

    // 5. Apply Search & Filters
    let filtered = processedCaptains.filter((c) => {
      // 5.1 Search query (Name, Academy, Email, Phone, ID)
      if (search) {
        const matchesName = (c.name || "").toLowerCase().includes(search);
        const matchesAcademy = (c.academyName || "").toLowerCase().includes(search);
        const matchesEmail = (c.email || "").toLowerCase().includes(search);
        const matchesPhone = (c.phone || "").toLowerCase().includes(search);
        const matchesId = (c.id || "").toLowerCase().includes(search);
        if (!matchesName && !matchesAcademy && !matchesEmail && !matchesPhone && !matchesId) {
          return false;
        }
      }

      // 5.2 Status and Resource filters
      if (statusFilter === "active" && c.subscriptionStatus !== "active") return false;
      if (statusFilter === "suspended" && c.subscriptionStatus !== "suspended") return false;
      if (statusFilter === "expired" && c.subscriptionStatus !== "expired") return false;
      if (statusFilter === "pending" && c.subscriptionPaid !== false) return false;
      if (statusFilter === "has_players" && c.stats.players === 0) return false;
      if (statusFilter === "has_halls" && c.stats.halls === 0) return false;
      if (statusFilter === "has_events" && c.stats.events === 0) return false;

      // 5.3 Activity & Genuine Engagement filters
      if (statusFilter === "online" && !c.isOnline) return false;
      if (statusFilter === "frequent" && c.activityClassification !== "frequent") return false;
      if (statusFilter === "occasional" && c.activityClassification !== "occasional") return false;
      if (statusFilter === "low_activity" && c.activityClassification !== "low_activity") return false;
      if (statusFilter === "insufficient_data" && c.activityClassification !== "insufficient_data") return false;
      if (statusFilter === "daily_active" && c.activityStatus !== "daily") return false;
      if (statusFilter === "weekly_active" && c.activityStatus !== "weekly") return false;
      if (statusFilter === "dormant" && c.activityStatus !== "dormant") return false;

      // 5.4 Expiring Soon filter (Requirement 2)
      if (statusFilter === "expiring_soon" && !c.isExpiringSoon) return false;

      // 5.5 Registration Date Filter
      if (dateFilter && dateFilter !== "all" && c.createdAt) {
        const createdDate = new Date(c.createdAt);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (dateFilter === "today") {
          if (createdDate < today) return false;
        } else if (dateFilter === "week") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (createdDate < sevenDaysAgo) return false;
        } else if (dateFilter === "month") {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (createdDate < thirtyDaysAgo) return false;
        } else if (dateFilter === "year") {
          const yearStart = new Date(now.getFullYear(), 0, 1);
          if (createdDate < yearStart) return false;
        }
      }

      return true;
    });

    // 6. Sorting
    filtered.sort((a, b) => {
      if (sortBy === "online_first") {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return (b.activeDays30 || 0) - (a.activeDays30 || 0);
      }
      if (sortBy === "active_days_desc") {
        return (b.activeDays30 || 0) - (a.activeDays30 || 0);
      }
      if (sortBy === "active_days_asc") {
        return (a.activeDays30 || 0) - (b.activeDays30 || 0);
      }
      if (sortBy === "last_seen_desc") {
        return new Date(b.lastSeenAt || 0) - new Date(a.lastSeenAt || 0);
      }
      if (sortBy === "last_login_desc") {
        return new Date(b.lastLoginAt || 0) - new Date(a.lastLoginAt || 0);
      }
      if (sortBy === "activity_desc") {
        return (b.activityScore || 0) - (a.activityScore || 0);
      }
      if (sortBy === "activity_asc") {
        return (a.activityScore || 0) - (b.activityScore || 0);
      }
      if (sortBy === "expiring_soon") {
        const da = a.daysRemaining !== null ? a.daysRemaining : 9999;
        const db = b.daysRemaining !== null ? b.daysRemaining : 9999;
        return da - db;
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "players_desc") {
        return b.stats.players - a.stats.players;
      }
      if (sortBy === "players_asc") {
        return a.stats.players - b.stats.players;
      }
      if (sortBy === "halls_desc") {
        return b.stats.halls - a.stats.halls;
      }
      if (sortBy === "halls_asc") {
        return a.stats.halls - b.stats.halls;
      }
      if (sortBy === "events_desc") {
        return b.stats.events - a.stats.events;
      }
      if (sortBy === "events_asc") {
        return a.stats.events - b.stats.events;
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "", "ar");
      }
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "", "ar");
      }
      // Default: newest joined
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    // 7. Pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pageCaptains = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      summary,
      captains: pageCaptains,
      academies: pageCaptains, // compatibility alias
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/captains error:", error);
    return NextResponse.json(
      { error: "تعذر تحميل قائمة الكباتن", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
