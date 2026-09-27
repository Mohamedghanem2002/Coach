import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireAdmin } from "../../../../backend/admin-auth";

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

    // 1. Query ALL accounts from actual database (including admin and test accounts)
    const allUsers = await db.collection("users").find({}).toArray();

    // 2. Fetch all real data to calculate exact counts and platform totals
    const [allPlayers, allBranches, allEvents] = await Promise.all([
      db.collection("players").find({}).toArray(),
      db.collection("branches").find({}).toArray(),
      db.collection("events").find({}).toArray(),
    ]);

    // Build lookup maps by ownerId (string) to prevent N+1 query overhead
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

    // 3. Process every account with actual database relationships
    const processedCaptains = allUsers.map((u) => {
      const uId = u._id.toString();
      const uPlayers = playersByOwner.get(uId) || [];
      const uBranches = branchesByOwner.get(uId) || [];
      const uEvents = eventsByOwner.get(uId) || [];

      // Calculate players per branch/hall
      const branchesDetails = uBranches.map((b) => {
        const bName = (b.name || "").trim().toLowerCase();
        const pInBranch = uPlayers.filter(
          (p) => (p.branch || "").trim().toLowerCase() === bName
        ).length;
        return {
          id: b._id.toString(),
          name: b.name,
          days: b.days || [],
          playersCount: pInBranch,
          createdAt: b.createdAt,
        };
      });

      const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended";
      const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < now.getTime();

      let computedStatus = "active";
      if (isSuspended) computedStatus = "suspended";
      else if (isExpired) computedStatus = "expired";

      let daysRemaining = null;
      if (u.subscriptionExpiresAt) {
        const diffMs = new Date(u.subscriptionExpiresAt).getTime() - now.getTime();
        daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        id: uId,
        _id: uId,
        name: u.name || "مستخدم غير محدد",
        academyName: u.academyName || "أكاديمية جديدة",
        email: u.email,
        phone: u.phone || "",
        role: u.role || "user",
        isAdmin: u.role === "admin",
        status: u.status || "active",
        subscriptionStatus: computedStatus,
        subscriptionPlan: u.subscriptionPlan || "Standard",
        subscriptionStartedAt: u.subscriptionStartedAt || u.createdAt,
        subscriptionExpiresAt: u.subscriptionExpiresAt || null,
        subscriptionPaid: u.subscriptionPaid !== false,
        suspensionReason: u.suspensionReason || null,
        daysRemaining,
        // Exact real relationship counters
        stats: {
          players: uPlayers.length,
          halls: uBranches.length,
          events: uEvents.length,
        },
        playersCount: uPlayers.length,
        branchesCount: uBranches.length,
        hallsCount: uBranches.length,
        eventsCount: uEvents.length,
        branchesDetails,
        createdAt: u.createdAt,
      };
    });

    // 4. Platform-wide summary statistics (Real database totals for all accounts)
    const summary = {
      totalCaptains: processedCaptains.length,
      totalAccounts: processedCaptains.length,
      totalPlayers: allPlayers.length,
      totalHalls: allBranches.length,
      totalEvents: allEvents.length,
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
      if (statusFilter === "admin" && !c.isAdmin) return false;
      if (statusFilter === "user" && c.isAdmin) return false;

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
