import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import { auth } from "../../../backend/auth";
import clientPromise from "../../../backend/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const users = client.db(process.env.MONGODB_DB).collection("users");

    let query = {};
    if (session.user.id) {
      try {
        query = { _id: new ObjectId(session.user.id) };
      } catch {
        query = { _id: session.user.id };
      }
    } else if (session.user.email) {
      query = { email: session.user.email.trim().toLowerCase() };
    }

    let user = await users.findOne(query);
    if (!user && session.user.email) {
      user = await users.findOne({ email: session.user.email.trim().toLowerCase() });
    }

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        academyName: user.academyName || "Re_action DOJO",
        email: user.email,
        phone: user.phone || "",
        role: user.role || "user",
        status: user.status || "active",
        subscriptionStatus: user.subscriptionStatus || "active",
        subscriptionPlan: user.subscriptionPlan || "trial",
        subscriptionExpiresAt: user.subscriptionExpiresAt,
        subscriptionStartedAt: user.subscriptionStartedAt,
        subscriptionPaid: user.subscriptionPaid !== false,
        suspensionReason: user.suspensionReason || null,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/account failed:", error);
    return NextResponse.json(
      { error: "تعذر جلب بيانات الحساب" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const academyName =
      typeof body.academyName === "string" ? body.academyName.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const currentPassword =
      typeof body.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!name || name.length > 80) {
      return NextResponse.json(
        { error: "يرجى كتابة اسم الكابتن بشكل صحيح (حتى 80 حرفًا)" },
        { status: 400 }
      );
    }

    if (!academyName || academyName.length > 100) {
      return NextResponse.json(
        { error: "يرجى كتابة اسم الأكاديمية بشكل صحيح (حتى 100 حرف)" },
        { status: 400 }
      );
    }

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "يرجى كتابة بريد إلكتروني صحيح" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const users = client.db(process.env.MONGODB_DB).collection("users");

    let query = {};
    if (session.user.id) {
      try {
        query = { _id: new ObjectId(session.user.id) };
      } catch {
        query = { _id: session.user.id };
      }
    } else if (session.user.email) {
      query = { email: session.user.email.trim().toLowerCase() };
    }

    let user = await users.findOne(query);
    if (!user && session.user.email) {
      user = await users.findOne({ email: session.user.email.trim().toLowerCase() });
    }

    if (!user) {
      return NextResponse.json(
        { error: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    if (user.role !== "admin") {
      const isSuspended =
        user.status === "suspended" ||
        user.status === "disabled" ||
        user.subscriptionStatus === "suspended" ||
        user.subscriptionStatus === "disabled";
      if (isSuspended) {
        return NextResponse.json(
          { error: "لا يمكن تعديل الحساب وهو موقوف من قِبل إدارة المنصة" },
          { status: 403 }
        );
      }
    }

    // Check if email changed and if another user has it
    if (email !== user.email?.toLowerCase()) {
      const existing = await users.findOne({
        email,
        _id: { $ne: user._id },
      });
      if (existing) {
        return NextResponse.json(
          { error: "هذا البريد الإلكتروني مسجل بالفعل لمستخدم آخر" },
          { status: 409 }
        );
      }
    }

    const updateFields = {
      name,
      academyName,
      email,
      updatedAt: new Date(),
    };

    // If new password requested
    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" },
          { status: 400 }
        );
      }
      if (!currentPassword) {
        return NextResponse.json(
          { error: "يرجى إدخال كلمة المرور الحالية لتأكيد التغيير" },
          { status: 400 }
        );
      }
      const match = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!match) {
        return NextResponse.json(
          { error: "كلمة المرور الحالية غير صحيحة" },
          { status: 403 }
        );
      }
      updateFields.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    await users.updateOne({ _id: user._id }, { $set: updateFields });

    return NextResponse.json({
      success: true,
      message: "تم حفظ التعديلات بنجاح",
      user: {
        id: user._id.toString(),
        name,
        academyName,
        email,
      },
    });
  } catch (error) {
    console.error("PUT /api/account failed:", error);
    return NextResponse.json(
      { error: "تعذر تحديث بيانات الحساب" },
      { status: 500 }
    );
  }
}
