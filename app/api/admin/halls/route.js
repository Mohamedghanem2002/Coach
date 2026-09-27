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
    const ownerFilter = (searchParams.get("ownerId") || "all").trim();
    const hasPlayersFilter = (searchParams.get("hasPlayers") || "all").trim();
    const sortBy = (searchParams.get("sortBy") || "players_desc").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const [allBranches, allPlayers, allUsers] = await Promise.all([
      db.collection("branches").find({}).toArray(),
      db.collection("players").find({}).toArray(),
      db.collection("users").find({}).toArray(),
    ]);

    // Build user lookup map
    const userMap = new Map();
    for (const u of allUsers) {
      userMap.set(u._id.toString(), u);
    }

    // Process each hall/branch
    const processedHalls = allBranches.map((b) => {
      const bId = b._id ? b._id.toString() : "";
      const oId = b.ownerId ? b.ownerId.toString() : "";
      const coach = userMap.get(oId);
      const bName = (b.name || "").trim().toLowerCase();

      // Find players in this hall (by branch name match or owner match)
      const matchingPlayers = allPlayers.filter((p) => {
        const pOwner = p.ownerId ? p.ownerId.toString() : "";
        const pBranch = (p.branch || "").trim().toLowerCase();
        return pOwner === oId && pBranch === bName;
      });

      return {
        id: bId,
        _id: bId,
        name: b.name || "صالة تدريب",
        days: Array.isArray(b.days) ? b.days : [],
        ownerId: oId,
        coachName: coach?.name || "كابتن غير محدد",
        coachEmail: coach?.email || "",
        coachPhone: coach?.phone || "",
        academyName: coach?.academyName || "أكاديمية غير محددة",
        playersCount: matchingPlayers.length,
        players: matchingPlayers.map((p) => ({
          id: p._id ? p._id.toString() : "",
          name: p.name,
          belt: p.belt || "أبيض",
          age: p.age,
        })),
        createdAt: b.createdAt || null,
      };
    });

    const uniqueCoaches = Array.from(
      new Map(
        processedHalls.map((h) => [
          h.ownerId,
          { id: h.ownerId, name: h.coachName, academyName: h.academyName },
        ])
      ).values()
    );

    // Apply Search & Filters
    let filtered = processedHalls.filter((h) => {
      if (search) {
        const matchesName = (h.name || "").toLowerCase().includes(search);
        const matchesCoach = (h.coachName || "").toLowerCase().includes(search);
        const matchesAcademy = (h.academyName || "").toLowerCase().includes(search);
        const matchesEmail = (h.coachEmail || "").toLowerCase().includes(search);
        const matchesId = (h.id || "").toLowerCase().includes(search);

        if (!matchesName && !matchesCoach && !matchesAcademy && !matchesEmail && !matchesId) {
          return false;
        }
      }

      if (ownerFilter && ownerFilter !== "all" && h.ownerId !== ownerFilter) {
        return false;
      }

      if (hasPlayersFilter === "yes" && h.playersCount === 0) {
        return false;
      }
      if (hasPlayersFilter === "no" && h.playersCount > 0) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "players_desc") {
        return b.playersCount - a.playersCount;
      }
      if (sortBy === "players_asc") {
        return a.playersCount - b.playersCount;
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "", "ar");
      }
      // Default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pageHalls = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      summary: {
        totalHalls: allBranches.length,
        filteredCount: total,
        totalHallsWithPlayers: allBranches.filter((b) => {
          const bName = (b.name || "").trim().toLowerCase();
          const oId = b.ownerId ? b.ownerId.toString() : "";
          return allPlayers.some(
            (p) => (p.ownerId?.toString() || "") === oId && (p.branch || "").trim().toLowerCase() === bName
          );
        }).length,
      },
      filters: {
        coaches: uniqueCoaches,
      },
      halls: pageHalls,
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
    console.error("GET /api/admin/halls failed:", error);
    return NextResponse.json(
      { error: "تعذر استرداد قائمة الصالات", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
