import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "../../../../backend/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";

    if (!email || !code) {
      return NextResponse.json(
        { error: "البريد الإلكتروني ورمز التحقق مطلوبان" },
        { status: 400 },
      );
    }

    if (code.length !== 6) {
      return NextResponse.json(
        { error: "رمز التحقق يجب أن يتكون من 6 أرقام" },
        { status: 400 },
      );
    }

    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const users = client.db(process.env.MONGODB_DB).collection("users");

    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const user = await users.findOne({
      $or: [
        { email },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, "i") } },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { error: "هذا الحساب غير موجود" },
        { status: 404 },
      );
    }

    if (!user.resetCode) {
      return NextResponse.json(
        { error: "لم يتم طلب رمز استعادة كلمة المرور أو تم استخدامه بالفعل" },
        { status: 400 },
      );
    }

    if (user.resetCode !== code) {
      return NextResponse.json(
        { error: "رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة" },
        { status: 400 },
      );
    }

    if (!user.resetExpiresAt || new Date(user.resetExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "انتهت صلاحية رمز التحقق (صلاحيته 15 دقيقة)، يرجى طلب رمز جديد" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          resetCode: null,
          resetExpiresAt: null,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json({
      success: true,
      message: "تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.",
    });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إعادة تعيين كلمة المرور" },
      { status: 500 },
    );
  }
}
