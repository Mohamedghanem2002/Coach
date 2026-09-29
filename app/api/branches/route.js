import { NextResponse } from "next/server";
import clientPromise from "../../../backend/mongodb";
import { requireActiveTenant } from "../../../backend/tenant";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;
    const client = await clientPromise;
    const [branches, playerBranches] = await Promise.all([
      client
        .db(process.env.MONGODB_DB)
        .collection("branches")
        .find({ ownerId })
        .sort({ createdAt: 1 })
        .toArray(),
      client
        .db(process.env.MONGODB_DB)
        .collection("players")
        .distinct("branch", { ownerId }),
    ]);
    const knownNames = new Set(branches.map((branch) => branch.name));
    const legacyBranches = playerBranches
      .filter((name) => typeof name === "string" && !knownNames.has(name))
      .map((name) => ({ _id: `legacy-${name}`, name, days: [] }));
    return NextResponse.json([
      ...branches.map((branch) =>
        Object.assign(Object.assign({}, branch), {
          _id: branch._id.toString(),
          days: Array.isArray(branch.days) ? branch.days : [],
        }),
      ),
      ...legacyBranches,
    ]);
  } catch (_a) {
    return NextResponse.json({ error: "تعذر تحميل الفروع" }, { status: 503 });
  }
}

export async function POST(request) {
  try {
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "اكتب اسم الفرع بشكل صحيح" },
        { status: 400 },
      );
    }
    const days = Array.isArray(body.days)
      ? body.days.filter((d) => typeof d === "string")
      : [];
    const client = await clientPromise;
    const collection = client.db(process.env.MONGODB_DB).collection("branches");
    const exists = await collection.findOne({ name, ownerId });
    if (exists)
      return NextResponse.json(
        { error: "اسم الفرع موجود بالفعل" },
        { status: 409 },
      );
    const branch = { ownerId, name, days, createdAt: new Date() };
    const result = await collection.insertOne(branch);
    return NextResponse.json(
      Object.assign(Object.assign({}, branch), {
        _id: result.insertedId.toString(),
      }),
      { status: 201 },
    );
  } catch (_a) {
    return NextResponse.json({ error: "تعذر إضافة الفرع" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name)
      return NextResponse.json(
        { error: "اسم الفرع غير صحيح" },
        { status: 400 },
      );
    const client = await clientPromise;
    const playersInBranch = await client
      .db(process.env.MONGODB_DB)
      .collection("players")
      .countDocuments({ branch: name, ownerId });
    if (playersInBranch > 0) {
      return NextResponse.json(
        { error: "لا يمكن حذف فرع به لاعبين مسجلين" },
        { status: 409 },
      );
    }
    const result = await client
      .db(process.env.MONGODB_DB)
      .collection("branches")
      .deleteOne({ name, ownerId });
    return NextResponse.json({ deleted: result.deletedCount === 1 });
  } catch (_a) {
    return NextResponse.json({ error: "تعذر حذف الفرع" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const tenant = await requireActiveTenant();
    if (!tenant.allowed) return tenant.response;
    const ownerId = tenant.ownerId;
    const body = await request.json();
    const oldName = typeof body.oldName === "string" ? body.oldName.trim() : "";
    const newName = typeof body.newName === "string" ? body.newName.trim() : "";
    const hasDays = Array.isArray(body.days);
    const days = hasDays
      ? body.days.filter((d) => typeof d === "string")
      : undefined;

    if (!oldName) {
      return NextResponse.json(
        { error: "يرجى تحديد الفرع المراد تعديله" },
        { status: 400 }
      );
    }
    const effectiveNewName = newName || oldName;
    if (effectiveNewName.length > 80) {
      return NextResponse.json(
        { error: "اسم الفرع طويل جداً" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const branchesCollection = db.collection("branches");
    const playersCollection = db.collection("players");

    // Check if new name already exists (if name is changing)
    if (newName && newName !== oldName) {
      const duplicate = await branchesCollection.findOne({ name: newName, ownerId });
      if (duplicate) {
        return NextResponse.json(
          { error: "يوجد فرع آخر بنفس هذا الاسم بالفعل" },
          { status: 409 }
        );
      }
    }

    const updateFields = {};
    if (newName && newName !== oldName) {
      updateFields.name = newName;
    }
    if (hasDays) {
      updateFields.days = days;
    }

    if (Object.keys(updateFields).length > 0) {
      const existingBranch = await branchesCollection.findOne({
        name: oldName,
        ownerId,
      });

      if (existingBranch) {
        await branchesCollection.updateOne(
          { _id: existingBranch._id },
          { $set: updateFields }
        );
      } else {
        await branchesCollection.insertOne({
          ownerId,
          name: effectiveNewName,
          days: days || [],
          createdAt: new Date(),
        });
      }
    }

    // Synchronize all players belonging to this branch if name changed
    if (newName && newName !== oldName) {
      await playersCollection.updateMany(
        { branch: oldName, ownerId },
        { $set: { branch: newName } }
      );
    }

    return NextResponse.json({
      success: true,
      oldName,
      newName: effectiveNewName,
      days: days !== undefined ? days : undefined,
    });
  } catch (error) {
    console.error("PATCH /api/branches failed:", error);
    return NextResponse.json({ error: "تعذر تعديل بيانات الفرع" }, { status: 500 });
  }
}


