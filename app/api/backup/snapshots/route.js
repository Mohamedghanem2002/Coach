import { NextResponse } from "next/server";
import { requireActiveTenant } from "../../../../backend/tenant";
import {
  getAvailableSnapshots,
  restoreSnapshotById,
  createCloudSnapshot,
} from "../../../../backend/snapshotBackup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;

    const snapshots = await getAvailableSnapshots(ownerId);
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
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;

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
        error: error?.message || "تعذر معالجة طلب النسخة السحابية",
        details: error?.message || String(error),
      },
      { status: 400 }
    );
  }
}
