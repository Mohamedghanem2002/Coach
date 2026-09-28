import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireAdmin } from "../../../../backend/admin-auth";
import {
  autoSyncExpiredAccounts,
  calculateDaysRemaining,
  isSubscriptionExpired,
} from "../../../../backend/subscription-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").trim().toLowerCase();

    // Auto-sync and suspend expired accounts in DB
    await autoSyncExpiredAccounts(db.collection("users"), now);
    const isSystemAdmin = (u) => {
      if (!u) return false;
      if (u.role === "admin") return true;
      if (u.email && u.email.trim().toLowerCase() === adminEmail) return true;
      return false;
    };

    // 1. Query users from database (strictly separating admins from registered captains)
    const allUsers = await db.collection("users").find({}).toArray();
    const captainUsers = allUsers.filter((u) => !isSystemAdmin(u));

    // 2. Query all players, branches, events, and audit logs
    const [allPlayers, allBranches, allEvents, recentAuditLogs] = await Promise.all([
      db.collection("players").find({}).toArray(),
      db.collection("branches").find({}).toArray(),
      db.collection("events").find({}).toArray(),
      db.collection("audit_logs").find({}).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);

    // Build lookup maps by ownerId
    const playersByOwner = new Map();
    for (const p of allPlayers) {
      const oId = p.ownerId ? p.ownerId.toString() : "";
      if (!playersByOwner.has(oId)) playersByOwner.set(oId, []);
      playersByOwner.get(oId).push(p);
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

    // Events belonging to valid registered captains
    const captainEvents = allEvents.filter((e) => {
      const oId = e.ownerId ? e.ownerId.toString() : "";
      return eventsByOwner.has(oId);
    });

    // Event calculations (Upcoming vs Completed) for valid captain events
    let upcomingEvents = 0;
    let completedEvents = 0;
    for (const e of captainEvents) {
      let isUpcoming = false;
      if (e.date) {
        const eDate = new Date(e.date);
        if (!isNaN(eDate.getTime()) && eDate >= startOfToday) {
          isUpcoming = true;
        }
      }
      if (isUpcoming) upcomingEvents++;
      else completedEvents++;
    }

    // Captain Account status & distribution calculations (Strictly for real captains)
    let activeAccounts = 0;
    let suspendedAccounts = 0;
    let expiredAccounts = 0;
    let pendingPaymentAccounts = 0;
    let newAccounts7d = 0;
    let newAccounts30d = 0;
    let accountsWithPlayers = 0;
    let accountsWithHalls = 0;
    let accountsWithEvents = 0;
    let totalCaptainsPlayers = 0;
    let totalCaptainsHalls = 0;
    let totalCaptainsEvents = 0;

    for (const u of captainUsers) {
      const uId = u._id.toString();
      const pCount = (playersByOwner.get(uId) || []).length;
      const bCount = (branchesByOwner.get(uId) || []).length;
      const eCount = (eventsByOwner.get(uId) || []).length;

      totalCaptainsPlayers += pCount;
      totalCaptainsHalls += bCount;
      totalCaptainsEvents += eCount;

      if (pCount > 0) accountsWithPlayers++;
      if (bCount > 0) accountsWithHalls++;
      if (eCount > 0) accountsWithEvents++;

      const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended";
      const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < now.getTime();

      if (isSuspended) {
        suspendedAccounts++;
      } else if (isExpired) {
        expiredAccounts++;
      } else {
        activeAccounts++;
      }

      if (u.subscriptionPaid === false) {
        pendingPaymentAccounts++;
      }

      if (u.createdAt) {
        const cDate = new Date(u.createdAt);
        if (cDate >= sevenDaysAgo) newAccounts7d++;
        if (cDate >= thirtyDaysAgo) newAccounts30d++;
      }
    }

    // Recent captain accounts with exact counts (Strictly captains, no admins)
    const sortedUsers = [...captainUsers].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const recentAccounts = sortedUsers.slice(0, 6).map((u) => {
      const uId = u._id.toString();
      const playersCount = (playersByOwner.get(uId) || []).length;
      const branchesCount = (branchesByOwner.get(uId) || []).length;
      const eventsCount = (eventsByOwner.get(uId) || []).length;

      const isExpired = isSubscriptionExpired(u, now);
      const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended" || isExpired;
      let computedStatus = "active";
      if (isSuspended) computedStatus = isExpired ? "expired" : "suspended";
      const daysRemaining = calculateDaysRemaining(u.subscriptionExpiresAt, now);

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
        subscriptionExpiresAt: u.subscriptionExpiresAt || null,
        subscriptionPaid: u.subscriptionPaid !== false,
        daysRemaining,
        playersCount,
        branchesCount,
        hallsCount: branchesCount,
        eventsCount,
        createdAt: u.createdAt,
      };
    });

    // Real Analytics Data based strictly on DB timestamps
    const usersGrowth = {
      last7Days: newAccounts7d,
      last30Days: newAccounts30d,
      last90Days: captainUsers.filter((u) => u.createdAt && new Date(u.createdAt) >= ninetyDaysAgo).length,
      total: captainUsers.length,
    };

    const captainPlayers = allPlayers.filter((p) => {
      const oId = p.ownerId ? p.ownerId.toString() : "";
      return playersByOwner.has(oId);
    });

    const playersGrowth = {
      last7Days: captainPlayers.filter((p) => p.createdAt && new Date(p.createdAt) >= sevenDaysAgo).length,
      last30Days: captainPlayers.filter((p) => p.createdAt && new Date(p.createdAt) >= thirtyDaysAgo).length,
      total: totalCaptainsPlayers,
    };

    const eventsGrowth = {
      upcoming: upcomingEvents,
      completed: completedEvents,
      total: captainEvents.length,
    };

    const distribution = {
      accountsWithPlayers,
      accountsWithHalls,
      accountsWithEvents,
      totalAccounts: captainUsers.length,
    };

    return NextResponse.json({
      success: true,
      stats: {
        totalAccounts: captainUsers.length,
        totalAcademies: captainUsers.length, // backward-compatibility
        totalCaptains: captainUsers.length,
        activeAccounts,
        activeAcademies: activeAccounts,
        suspendedAccounts,
        suspendedAcademies: suspendedAccounts,
        expiredAccounts,
        expiredAcademies: expiredAccounts,
        pendingPaymentAccounts,
        pendingPaymentAcademies: pendingPaymentAccounts,
        newAccounts7d,
        newAccounts30d,
        totalPlayers: totalCaptainsPlayers,
        totalBranches: totalCaptainsHalls,
        totalHalls: totalCaptainsHalls,
        totalEvents: totalCaptainsEvents,
        upcomingEvents,
        completedEvents,
        accountsWithPlayers,
        accountsWithHalls,
        accountsWithEvents,
      },
      analytics: {
        usersGrowth,
        playersGrowth,
        eventsGrowth,
        distribution,
      },
      recentAccounts,
      recentAcademies: recentAccounts, // backward-compatibility
      recentAuditLogs: recentAuditLogs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
      })),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("GET /api/admin/overview failed:", error);
    return NextResponse.json(
      { error: "تعذر جلب إحصائيات لوحة الإدارة", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
