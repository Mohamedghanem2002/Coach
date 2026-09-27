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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date();

    // Query non-admin academies
    const allUsers = await db
      .collection("users")
      .find({ role: { $ne: "admin" } })
      .toArray();

    // Filter in-memory for rich text search and computed subscription status
    const filtered = allUsers.filter((u) => {
      // 1. Search text filter
      if (search) {
        const matchesName = (u.name || "").toLowerCase().includes(search);
        const matchesAcademy = (u.academyName || "").toLowerCase().includes(search);
        const matchesEmail = (u.email || "").toLowerCase().includes(search);
        const matchesPhone = (u.phone || "").toLowerCase().includes(search);
        if (!matchesName && !matchesAcademy && !matchesEmail && !matchesPhone) {
          return false;
        }
      }

      const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended";
      const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < now.getTime();

      // 2. Status filter
      if (statusFilter === "active") {
        if (isSuspended || isExpired) return false;
      } else if (statusFilter === "suspended") {
        if (!isSuspended) return false;
      } else if (statusFilter === "expired") {
        if (!isExpired || isSuspended) return false;
      } else if (statusFilter === "pending") {
        if (u.subscriptionPaid !== false) return false;
      }

      return true;
    });

    // Sort by registration date descending
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pageUsers = filtered.slice(offset, offset + limit);

    // Compute exact player and branch counts for each academy from actual DB relationships
    const academies = await Promise.all(
      pageUsers.map(async (u) => {
        const uId = u._id.toString();

        const [playersCount, branchesCount, eventsCount] = await Promise.all([
          db.collection("players").countDocuments({ ownerId: u._id }),
          db.collection("branches").countDocuments({ ownerId: u._id }),
          db.collection("events").countDocuments({ ownerId: u._id }),
        ]);

        const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended";
        const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < now.getTime();

        let computedStatus = "active";
        if (isSuspended) computedStatus = "suspended";
        else if (isExpired) computedStatus = "expired";

        // Calculate days remaining
        let daysRemaining = null;
        if (u.subscriptionExpiresAt) {
          const diffMs = new Date(u.subscriptionExpiresAt).getTime() - now.getTime();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        }

        return {
          id: uId,
          _id: uId,
          name: u.name,
          academyName: u.academyName || "Re_action DOJO",
          email: u.email,
          phone: u.phone || "",
          status: u.status || "active",
          subscriptionStatus: computedStatus,
          subscriptionPlan: u.subscriptionPlan || "trial",
          subscriptionStartedAt: u.subscriptionStartedAt || u.createdAt,
          subscriptionExpiresAt: u.subscriptionExpiresAt || null,
          subscriptionPaid: u.subscriptionPaid !== false,
          suspensionReason: u.suspensionReason || null,
          daysRemaining,
          playersCount,
          branchesCount,
          eventsCount,
          createdAt: u.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      academies,
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
    console.error("GET /api/admin/academies failed:", error);
    return NextResponse.json(
      { error: "تعذر تحميل قائمة الأكاديميات", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
