import { NextResponse } from "next/server";
import { currentUserId } from "../../../../backend/tenant";
import {
  getAvailableSnapshots,
  restoreSnapshotById,
  createCloudSnapshot,
} from "../../../../backend/snapshotBackup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const snapshots = getAvailableSnapshots(ownerId);
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("GET /api/backup/snapshots error:", error);
    return NextResponse.json(
      { error: "تعذر جلب النسخ الاحتياطية المحفوظة", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    // Action 1: Create a cloud snapshot now (Zero passwords required!)
    if (body?.action === "create_snapshot") {
      const result = await createCloudSnapshot(ownerId);
      return NextResponse.json(result);
    }

    // Action 2: Restore snapshot
    const snapshotId = body?.snapshotId || "latest";
    const result = await restoreSnapshotById(snapshotId, ownerId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("POST /api/backup/snapshots error:", error);
    return NextResponse.json(
      {
        error: "تعذر استرجاع النسخة السحابية",
        details: error?.message || String(error),
      },
      { status: 400 }
    );
  }
}
