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
function toEnglishDigits(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
}
function ageFromDateOfBirth(dateOfBirth) {
  const normalizedDob = toEnglishDigits(dateOfBirth);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDob)) return null;
  const [year, month, day] = normalizedDob.split("-").map(Number);
  const birthday = new Date(year, month - 1, day);
  if (
    birthday.getFullYear() !== year ||
    birthday.getMonth() !== month - 1 ||
    birthday.getDate() !== day
  ) {
    return null;
  }
  const [currentYear, currentMonth, currentDay] = appDate()
    .split("-")
    .map(Number);
  let age = currentYear - year;
  if (currentMonth < month || (currentMonth === month && currentDay < day)) {
    age -= 1;
  }
  return age;
}
function serializePlayer(player) {
  const currentMonth = appDate().slice(0, 7);
  const monthlyPayment = Array.isArray(player.paymentHistory)
    ? player.paymentHistory.find((payment) => payment.month === currentMonth)
    : undefined;

  const totalAmount = Number(
    monthlyPayment?.totalAmount ?? player.totalAmount ?? 100,
  );
  const paidAmount = Number(
    monthlyPayment?.paidAmount ?? (
      monthlyPayment?.status === "paid"
        ? totalAmount
        : (player.paidAmount ?? 0)
    ),
  );
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  let status = monthlyPayment?.status || player.paymentStatus || "unpaid";
  if (paidAmount >= totalAmount && totalAmount > 0) {
    status = "paid";
  } else if (paidAmount > 0 && paidAmount < totalAmount) {
    status = "partially_paid";
  }

  const dynamicAge = player.dateOfBirth
    ? ageFromDateOfBirth(player.dateOfBirth)
    : null;

  return Object.assign(Object.assign({}, player), {
    age: dynamicAge !== null ? dynamicAge : (player.age ?? 0),
    attendance: Array.isArray(player.attendance) ? player.attendance : [],
    paymentHistory: Array.isArray(player.paymentHistory)
      ? player.paymentHistory
      : [],
    paymentStatus: status,
    totalAmount,
    paidAmount,
    remainingAmount,
    belt: player.belt || "أبيض",
    level: player.level || "A",
    lastBirthdayWishedYear: player.lastBirthdayWishedYear || null,
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
        var _a;
        const monthlyPayment =
          (_a = player.paymentHistory) === null || _a === void 0
            ? void 0
            : _a.find((payment) => payment.month === currentMonth);
        const totalAmount = Number(
          monthlyPayment?.totalAmount ?? player.totalAmount ?? 100,
        );
        const paidAmount = Number(
          monthlyPayment?.paidAmount ?? (
            monthlyPayment?.status === "paid"
              ? totalAmount
              : (player.paidAmount ?? 0)
          ),
        );
        const remainingAmount = Math.max(0, totalAmount - paidAmount);
        let status = monthlyPayment?.status || player.paymentStatus || "unpaid";
        if (paidAmount >= totalAmount && totalAmount > 0) {
          status = "paid";
        } else if (paidAmount > 0 && paidAmount < totalAmount) {
          status = "partially_paid";
        }

        return Object.assign(Object.assign({}, player), {
          attendance: Array.isArray(player.attendance) ? player.attendance : [],
          paymentStatus: status,
          totalAmount,
          paidAmount,
          remainingAmount,
          paymentHistory: Array.isArray(player.paymentHistory)
            ? player.paymentHistory
            : [],
          lastBirthdayWishedYear: player.lastBirthdayWishedYear || null,
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
    const dateOfBirth =
      typeof body.dateOfBirth === "string" ? toEnglishDigits(body.dateOfBirth).trim() : "";
    const age = ageFromDateOfBirth(dateOfBirth);
    if (!name || !branch || !Number.isInteger(age) || age < 4 || age > 80) {
      return NextResponse.json(
        { error: "بيانات اللاعب غير مكتملة" },
        { status: 400 },
      );
    }
    const belt = typeof body.belt === "string" && body.belt.trim() ? body.belt.trim() : "أبيض";
    const level = typeof body.level === "string" && body.level.trim() ? body.level.trim().toUpperCase() : "A";
    const player = {
      ownerId,
      name,
      age,
      dateOfBirth,
      guardianPhone:
        typeof body.guardianPhone === "string" ? toEnglishDigits(body.guardianPhone).trim() : "",
      branch,
      belt,
      level,
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
      const dateOfBirth =
        typeof body.dateOfBirth === "string" ? toEnglishDigits(body.dateOfBirth).trim() : "";
      const calculatedAge = ageFromDateOfBirth(dateOfBirth);
      const legacyAge = Number(body.age);
      const age = dateOfBirth ? calculatedAge : legacyAge;
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
        guardianPhone:
          typeof body.guardianPhone === "string"
            ? toEnglishDigits(body.guardianPhone).trim()
            : "",
      };
      if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
      if (typeof body.photo === "string") {
        updateData.photo = body.photo;
      }
      if (typeof body.belt === "string" && body.belt.trim()) {
        updateData.belt = body.belt.trim();
      }
      if (typeof body.level === "string" && body.level.trim()) {
        updateData.level = body.level.trim().toUpperCase();
      }
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        { $set: updateData },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }
    if (body.lastBirthdayWishedYear !== undefined) {
      const year = Number(body.lastBirthdayWishedYear);
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        { $set: { lastBirthdayWishedYear: year } },
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
        updateFields.paidAmount = 0;
        updateFields.remainingAmount = existing.totalAmount || 100;
      }
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        { $set: updateFields },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }

    if (
      body.paymentStatus !== undefined ||
      body.paidAmount !== undefined ||
      body.totalAmount !== undefined
    ) {
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

      const existingMonthPayment = (existing.paymentHistory || []).find(
        (p) => p.month === month,
      );

      const totalAmount =
        body.totalAmount !== undefined
          ? Math.max(0, Number(body.totalAmount) || 0)
          : (existingMonthPayment?.totalAmount ?? existing.totalAmount ?? 100);

      let paidAmount;
      if (body.paidAmount !== undefined) {
        paidAmount = Math.max(0, Number(body.paidAmount) || 0);
      } else if (body.paymentStatus === "paid") {
        paidAmount = totalAmount;
      } else if (body.paymentStatus === "unpaid") {
        paidAmount = 0;
      } else {
        paidAmount =
          existingMonthPayment?.paidAmount ??
          (existingMonthPayment?.status === "paid" ? totalAmount : 0);
      }

      const remainingAmount = Math.max(0, totalAmount - paidAmount);

      let status = body.paymentStatus;
      if (paidAmount >= totalAmount && totalAmount > 0) {
        status = "paid";
      } else if (paidAmount > 0 && paidAmount < totalAmount) {
        status = "partially_paid";
      } else if (paidAmount === 0) {
        status = "unpaid";
      }

      const history = (
        (_b = existing.paymentHistory) !== null && _b !== void 0 ? _b : []
      ).filter((payment) => payment.month !== month);

      history.push({
        month,
        status,
        totalAmount,
        paidAmount,
        remainingAmount,
        updatedAt: new Date(),
      });

      const currentMonth = appDate().slice(0, 7);
      const updateSet = {
        paymentHistory: history,
      };
      if (month === currentMonth) {
        updateSet.paymentStatus = status;
        updateSet.totalAmount = totalAmount;
        updateSet.paidAmount = paidAmount;
        updateSet.remainingAmount = remainingAmount;
      }
      const player = await collection.findOneAndUpdate(
        { _id: new ObjectId(body.id), ownerId },
        {
          $set: updateSet,
        },
        { returnDocument: "after" },
      );
      return NextResponse.json(player ? serializePlayer(player) : null);
    }

    return NextResponse.json(
      { error: "نوع التحديث غير صحيح" },
      { status: 400 },
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
