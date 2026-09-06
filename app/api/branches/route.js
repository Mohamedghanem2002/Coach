import { NextResponse } from "next/server";
import clientPromise from "../../../backend/mongodb";
import { currentUserId } from "../../../backend/tenant";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId)
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
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
      .map((name) => ({ _id: `legacy-${name}`, name }));
    return NextResponse.json([
      ...branches.map((branch) =>
        Object.assign(Object.assign({}, branch), {
          _id: branch._id.toString(),
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
    const ownerId = await currentUserId();
    if (!ownerId)
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "اكتب اسم الفرع بشكل صحيح" },
        { status: 400 },
      );
    }
    const client = await clientPromise;
    const collection = client.db(process.env.MONGODB_DB).collection("branches");
    const exists = await collection.findOne({ name, ownerId });
    if (exists)
      return NextResponse.json(
        { error: "اسم الفرع موجود بالفعل" },
        { status: 409 },
      );
    const branch = { ownerId, name, createdAt: new Date() };
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
    const ownerId = await currentUserId();
    if (!ownerId)
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
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
