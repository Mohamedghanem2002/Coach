import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../backend/mongodb";
import { currentUserId } from "../../../backend/tenant";
export const dynamic = "force-dynamic";
function appDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}
function serializePlayer(player) {
  return Object.assign(Object.assign({}, player), {
    attendance: Array.isArray(player.attendance) ? player.attendance : [],
    paymentHistory: Array.isArray(player.paymentHistory)
      ? player.paymentHistory
      : [],
    _id: player._id.toString(),
  });
}
export async function GET() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId)
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB;
    if (!dbName) {
      throw new Error("MONGODB_DB environment variable is not defined");
    }
    const players = await client
      .db(dbName)
      .collection("players")
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .toArray();
    const currentMonth = appDate().slice(0, 7);
    return NextResponse.json(
      players.map((player) => {
        var _a, _b;
        const monthlyPayment =
          (_a = player.paymentHistory) === null || _a === void 0
            ? void 0
            : _a.find((payment) => payment.month === currentMonth);
        return Object.assign(Object.assign({}, player), {
          attendance: Array.isArray(player.attendance) ? player.attendance : [],
          paymentStatus:
            (_b =
              monthlyPayment === null || monthlyPayment === void 0
                ? void 0
                : monthlyPayment.status) !== null && _b !== void 0
              ? _b
              : player.paymentStatus,
          paymentHistory: Array.isArray(player.paymentHistory)
            ? player.paymentHistory
            : [],
          _id: player._id.toString(),
        });
      }),
    );
  } catch (error) {
    console.error("=================================");
    console.error("GET /api/players FAILED");
    console.error("=================================");
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    return NextResponse.json(
      {
        error: "تعذر تحميل اللاعبين",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 503 },
    );
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
    const branch = typeof body.branch === "string" ? body.branch.trim() : "";
    const age = Number(body.age);
    if (!name || !branch || !Number.isInteger(age) || age < 4 || age > 80) {
      return NextResponse.json(
        { error: "بيانات اللاعب غير مكتملة" },
        { status: 400 },
      );
    }
    const player = {
      ownerId,
      name,
      age,
      branch,
      photo: typeof body.photo === "string" ? body.photo : "",
      paymentStatus: body.paymentStatus === "paid" ? "paid" : "unpaid",
      paymentHistory: [],
      attendance: [],
      createdAt: new Date(),
    };
    const client = await clientPromise;
    const result = await client
      .db(process.env.MONGODB_DB)
      .collection("players")
      .insertOne(player);
    return NextResponse.json(
      Object.assign(Object.assign({}, player), {
        _id: result.insertedId.toString(),
      }),
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/players failed:", error);
    return NextResponse.json(
      {
        error: "تعذر إضافة اللاعب",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
export async function PATCH(request) {
  var _a, _b, _c;
  try {
    const ownerId = await currentUserId();
    if (!ownerId)
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 },
      );
    const body = await request.json();
    if (typeof body.id !== "string" || !ObjectId.isValid(body.id)) {
      return NextResponse.json(
        { error: "معرف اللاعب غير صحيح" },
        { status: 400 },
      );
    }
    const client = await clientPromise;
    const collection = client.db(process.env.MONGODB_DB).collection("players");
    if (body.updateInfo === true || body.updateInfo === "true") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const branch = typeof body.branch === "string" ? body.branch.trim() : "";
      const age = Number(body.age);
      if (!name || !branch || !Number.isInteger(age) || age < 4 || age > 80) {
        return NextResponse.json(
          { error: "بيانات اللاعب غير صالحة" },
          { status: 400 },
        );
      }
      const updateData = {
        name,
        age,
        branch,
      };
      if (typeof body.photo === "string") {
        updateData.photo = body.photo;
      }
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        { $set: updateData },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }
    if (body.attendanceStatus === "clear" && typeof body.date === "string") {
      const today = appDate();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.date) || body.date > today) {
        return NextResponse.json(
          {
            error: "لا يمكن تسجيل حضور أو غياب في تاريخ مستقبلي",
          },
          { status: 400 },
        );
      }
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        {
          $pull: {
            attendance: {
              date: body.date,
            },
          },
        },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }
    if (
      body.attendanceStatus === "present" ||
      body.attendanceStatus === "absent"
    ) {
      const date = typeof body.date === "string" ? body.date : appDate();
      const today = appDate();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > today) {
        return NextResponse.json(
          {
            error: "لا يمكن تسجيل حضور أو غياب في تاريخ مستقبلي",
          },
          { status: 400 },
        );
      }
      await collection.updateOne(
        { _id: new ObjectId(body.id), ownerId },
        {
          $pull: {
            attendance: { date },
          },
        },
      );
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        {
          $push: {
            attendance: {
              date,
              status: body.attendanceStatus,
            },
          },
        },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }
    if (body.paymentStatus === "clear") {
      const month =
        typeof body.paymentMonth === "string" &&
        /^\d{4}-\d{2}$/.test(body.paymentMonth)
          ? body.paymentMonth
          : null;
      if (!month) {
        return NextResponse.json(
          { error: "شهر الدفع غير صحيح" },
          { status: 400 },
        );
      }
      const existing = await collection.findOne({
        _id: new ObjectId(body.id),
        ownerId,
      });
      if (!existing) {
        return NextResponse.json(
          { error: "اللاعب غير موجود" },
          { status: 404 },
        );
      }
      const history = (
        (_a = existing.paymentHistory) !== null && _a !== void 0 ? _a : []
      ).filter((payment) => payment.month !== month);
      const updateFields = {
        paymentHistory: history,
      };
      const currentMonth = appDate().slice(0, 7);
      if (month === currentMonth) {
        updateFields.paymentStatus = "unpaid";
      }
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        { $set: updateFields },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }
    if (body.paymentStatus !== "paid" && body.paymentStatus !== "unpaid") {
      return NextResponse.json(
        { error: "نوع التحديث غير صحيح" },
        { status: 400 },
      );
    }
    const month =
      typeof body.paymentMonth === "string" &&
      /^\d{4}-\d{2}$/.test(body.paymentMonth)
        ? body.paymentMonth
        : appDate().slice(0, 7);
    const existing = await collection.findOne({
      _id: new ObjectId(body.id),
      ownerId,
    });
    if (!existing) {
      return NextResponse.json({ error: "اللاعب غير موجود" }, { status: 404 });
    }
    const history = (
      (_b = existing.paymentHistory) !== null && _b !== void 0 ? _b : []
    ).filter((payment) => payment.month !== month);
    history.push({
      month,
      status: body.paymentStatus,
    });
    const player = await collection.findOneAndUpdate(
      { _id: new ObjectId(body.id), ownerId },
      {
        $set: {
          paymentHistory: history,
          paymentStatus: body.paymentStatus,
        },
      },
      { returnDocument: "after" },
    );
    return NextResponse.json(
      player
        ? Object.assign(Object.assign({}, player), {
            _id: player._id.toString(),
            paymentHistory:
              (_c = player.paymentHistory) !== null && _c !== void 0 ? _c : [],
          })
        : null,
    );
  } catch (error) {
    console.error("PATCH /api/players failed:", error);
    return NextResponse.json(
      {
        error: "تعذر تحديث بيانات اللاعب",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
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
    if (typeof body.id !== "string" || !ObjectId.isValid(body.id)) {
      return NextResponse.json(
        { error: "معرف اللاعب غير صحيح" },
        { status: 400 },
      );
    }
    const client = await clientPromise;
    const result = await client
      .db(process.env.MONGODB_DB)
      .collection("players")
      .deleteOne({
        _id: new ObjectId(body.id),
        ownerId,
      });
    return NextResponse.json({
      deleted: result.deletedCount === 1,
    });
  } catch (error) {
    console.error("DELETE /api/players failed:", error);
    return NextResponse.json(
      {
        error: "تعذر حذف اللاعب",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
