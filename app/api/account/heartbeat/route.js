import { NextResponse } from "next/server";
import { auth } from "../../../../backend/auth";
import { updateCaptainHeartbeat } from "../../../../backend/activity-tracking";

export const dynamic = "force-dynamic";

/**
 * Lightweight heartbeat ping for captains.
 * Updates lastSeenAt on the server using server-side timestamps.
 * Returns online status confirmation.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً", code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    // Admins are isolated from captain activity tracking
    if (session.user.role === "admin") {
      return NextResponse.json({ success: true, isAdmin: true });
    }

    const userId = session.user.id || session.user.email;
    const result = await updateCaptainHeartbeat(userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Heartbeat failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      timestamp: result.timestamp,
    });
  } catch (err) {
    console.error("POST /api/account/heartbeat error:", err);
    return NextResponse.json({ error: "فشل تحديث نبض الاتصال" }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
