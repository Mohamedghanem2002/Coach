import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireAdmin } from "../../../../backend/admin-auth";
import {
  autoSyncExpiredAccounts,
  calculateDaysRemaining,
  isSubscriptionExpired,
} from "../../../../backend/subscription-utils";

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
    const [branchPlayerCounts, allBranches, allEvents] = await Promise.all([
      db.collection("players").aggregate([
        {
          $group: {
            _id: {
              ownerId: { $toString: "$ownerId" },
              branch: { $trim: { input: { $ifNull: ["$branch", ""] } } },
            },
            count: { $sum: 1 },
          },
        },
      ]).toArray(),
      db.collection("branches").find({}).toArray(),
      db.collection("events").find({}).toArray(),
    ]);

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

    const summary = {
      totalCaptains: processedCaptains.length,
      totalAccounts: processedCaptains.length,
      totalPlayers: totalCaptainsPlayers,
      totalHalls: totalCaptainsHalls,
      totalEvents: totalCaptainsEvents,
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

      // 5.3 Registration Date Filter
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
