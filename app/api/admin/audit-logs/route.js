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
    const actionFilter = (searchParams.get("action") || "all").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "25", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const logs = await db
      .collection("audit_logs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const filtered = logs.filter((log) => {
      if (actionFilter !== "all" && log.action !== actionFilter) {
        return false;
      }
      if (search) {
        const target = (log.targetAcademyName || "").toLowerCase();
        const admin = (log.adminEmail || "").toLowerCase();
        const action = (log.action || "").toLowerCase();
        if (!target.includes(search) && !admin.includes(search) && !action.includes(search)) {
          return false;
        }
      }
      return true;
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pageLogs = filtered.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      logs: pageLogs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
      })),
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
    console.error("GET /api/admin/audit-logs failed:", error);
    return NextResponse.json(
      { error: "تعذر تحميل سجل تدقيق العمليات", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
