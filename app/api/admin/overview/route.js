import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireAdmin } from "../../../../backend/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date();

    // Query non-admin academies
    const allUsers = await db
      .collection("users")
      .find({ role: { $ne: "admin" } })
      .toArray();

    // Query all players, branches, events
    const [totalPlayers, totalBranches, totalEvents] = await Promise.all([
      db.collection("players").countDocuments({}),
      db.collection("branches").countDocuments({}),
      db.collection("events").countDocuments({}),
    ]);

    let activeAcademies = 0;
    let suspendedAcademies = 0;
    let expiredAcademies = 0;
    let pendingPaymentAcademies = 0;

    for (const u of allUsers) {
      const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended";
      const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < now.getTime();

      if (isSuspended) {
        suspendedAcademies++;
      } else if (isExpired) {
        expiredAcademies++;
      } else {
        activeAcademies++;
      }

      if (u.subscriptionPaid === false) {
        pendingPaymentAcademies++;
      }
    }

    // Recent 5 academies with real player counts
    const sortedUsers = [...allUsers].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    const recentUsersSlice = sortedUsers.slice(0, 5);

    const recentAcademies = await Promise.all(
      recentUsersSlice.map(async (u) => {
        const uId = u._id.toString();
        const playersCount = await db
          .collection("players")
          .countDocuments({ ownerId: u._id });
        const branchesCount = await db
          .collection("branches")
          .countDocuments({ ownerId: u._id });

        const isSuspended = u.status === "suspended" || u.subscriptionStatus === "suspended";
        const isExpired = u.subscriptionExpiresAt && new Date(u.subscriptionExpiresAt).getTime() < now.getTime();
        let computedStatus = "active";
        if (isSuspended) computedStatus = "suspended";
        else if (isExpired) computedStatus = "expired";

        return {
          id: uId,
          name: u.name,
          academyName: u.academyName || "أكاديمية جديدة",
          email: u.email,
          phone: u.phone || "",
          status: u.status || "active",
          subscriptionStatus: computedStatus,
          subscriptionPlan: u.subscriptionPlan || "trial",
          subscriptionExpiresAt: u.subscriptionExpiresAt || null,
          subscriptionPaid: u.subscriptionPaid !== false,
          playersCount,
          branchesCount,
          createdAt: u.createdAt,
        };
      })
    );

    // Recent audit logs
    const recentAuditLogs = await db
      .collection("audit_logs")
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    return NextResponse.json({
      success: true,
      stats: {
        totalAcademies: allUsers.length,
        activeAcademies,
        suspendedAcademies,
        expiredAcademies,
        pendingPaymentAcademies,
        totalPlayers,
        totalBranches,
        totalEvents,
      },
      recentAcademies,
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
