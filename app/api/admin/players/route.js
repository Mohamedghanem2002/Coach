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
    const beltFilter = (searchParams.get("belt") || "all").trim();
    const branchFilter = (searchParams.get("branch") || "all").trim();
    const ownerFilter = (searchParams.get("ownerId") || "all").trim();
    const sortBy = (searchParams.get("sortBy") || "newest").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const [allPlayers, allUsers, allBranches] = await Promise.all([
      db.collection("players").find({}).toArray(),
      db.collection("users").find({}).toArray(),
      db.collection("branches").find({}).toArray(),
    ]);

    // Build user lookup map
    const userMap = new Map();
    for (const u of allUsers) {
      userMap.set(u._id.toString(), u);
    }

    // Process players with joined coach & branch information
    const processedPlayers = allPlayers.map((p) => {
      const pId = p._id ? p._id.toString() : "";
      const oId = p.ownerId ? p.ownerId.toString() : "";
      const coach = userMap.get(oId);

      return {
        id: pId,
        _id: pId,
        name: p.name || "لاعب بدون اسم",
        branch: p.branch || "الفرع الرئيسي",
        belt: p.belt || "أبيض",
        age: p.age || null,
        phone: p.phone || "",
        nationalId: p.nationalId || "",
        joinDate: p.joinDate || p.createdAt || null,
        createdAt: p.createdAt || p.joinDate || null,
        ownerId: oId,
        coachName: coach?.name || "كابتن غير محدد",
        coachEmail: coach?.email || "",
        coachPhone: coach?.phone || "",
        academyName: coach?.academyName || "أكاديمية غير محددة",
        isActive: p.isActive !== false,
      };
    });

    // Extract unique belts and branches for filter dropdowns
    const uniqueBelts = Array.from(new Set(processedPlayers.map((p) => p.belt).filter(Boolean)));
    const uniqueBranches = Array.from(new Set(processedPlayers.map((p) => p.branch).filter(Boolean)));
    const uniqueCoaches = Array.from(
      new Map(
        processedPlayers.map((p) => [
          p.ownerId,
          { id: p.ownerId, name: p.coachName, academyName: p.academyName },
        ])
      ).values()
    );

    // Apply Search & Filters
    let filtered = processedPlayers.filter((p) => {
      if (search) {
        const matchesName = (p.name || "").toLowerCase().includes(search);
        const matchesPhone = (p.phone || "").toLowerCase().includes(search);
        const matchesBranch = (p.branch || "").toLowerCase().includes(search);
        const matchesBelt = (p.belt || "").toLowerCase().includes(search);
        const matchesCoach = (p.coachName || "").toLowerCase().includes(search);
        const matchesAcademy = (p.academyName || "").toLowerCase().includes(search);
        const matchesId = (p.id || "").toLowerCase().includes(search);

        if (
          !matchesName &&
          !matchesPhone &&
          !matchesBranch &&
          !matchesBelt &&
          !matchesCoach &&
          !matchesAcademy &&
          !matchesId
        ) {
          return false;
        }
      }

      if (beltFilter && beltFilter !== "all" && p.belt !== beltFilter) {
        return false;
      }

      if (branchFilter && branchFilter !== "all" && p.branch !== branchFilter) {
        return false;
      }

      if (ownerFilter && ownerFilter !== "all" && p.ownerId !== ownerFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      if (sortBy === "name_asc") {
        return (a.name || "").localeCompare(b.name || "", "ar");
      }
      if (sortBy === "name_desc") {
        return (b.name || "").localeCompare(a.name || "", "ar");
      }
      if (sortBy === "age_desc") {
        return (b.age || 0) - (a.age || 0);
      }
      if (sortBy === "age_asc") {
        return (a.age || 0) - (b.age || 0);
      }
      // Default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pagePlayers = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      summary: {
        totalPlayers: allPlayers.length,
        filteredCount: total,
        uniqueBeltsCount: uniqueBelts.length,
        uniqueBranchesCount: uniqueBranches.length,
      },
      filters: {
        belts: uniqueBelts,
        branches: uniqueBranches,
        coaches: uniqueCoaches,
      },
      players: pagePlayers,
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
    console.error("GET /api/admin/players failed:", error);
    return NextResponse.json(
      { error: "تعذر استرداد قائمة اللاعبين", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
