import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "../../../../backend/mongodb";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/reset-password?token=...&email=...
 * Validates a reset token or code before displaying or submitting the reset form.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = (searchParams.get("email") || "").trim().toLowerCase();
    const token = (searchParams.get("token") || "").trim();
    const code = (searchParams.get("code") || "").trim();

    if (!email || (!token && !code)) {
      return NextResponse.json(
        { valid: false, error: "معلومات التحقق من الرابط غير مكتملة", code: "INVALID_PARAMS" },
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
        { valid: false, error: "هذا الحساب غير موجود في المنظومة", code: "USER_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (!user.resetToken && !user.resetCode) {
      return NextResponse.json(
        {
          valid: false,
          error: "تم استخدام هذا الرابط مسبقاً أو أنه لم يعد صالحاً. يرجى طلب رابط جديد.",
          code: "TOKEN_ALREADY_USED",
        },
        { status: 400 },
      );
    }

    const isTokenMatch = token && user.resetToken === token;
    const isCodeMatch = code && user.resetCode === code;

    if (!isTokenMatch && !isCodeMatch) {
      return NextResponse.json(
        { valid: false, error: "رابط استعادة كلمة المرور غير صحيح.", code: "TOKEN_INVALID" },
        { status: 400 },
      );
    }

    if (!user.resetExpiresAt || new Date(user.resetExpiresAt) < new Date()) {
      return NextResponse.json(
        {
          valid: false,
          error: "انتهت صلاحية هذا الرابط (صلاحيته 15 دقيقة فقط). يرجى طلب رابط جديد.",
          code: "TOKEN_EXPIRED",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      valid: true,
      email: user.email,
      name: user.name,
      expiresAt: user.resetExpiresAt,
    });
  } catch (error) {
    console.error("GET /api/auth/reset-password error:", error);
    return NextResponse.json(
      { valid: false, error: "حدث خطأ أثناء التحقق من الرابط" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/reset-password
 * Resets the password and immediately invalidates the single-use token/code.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    const newPassword =
      typeof body.newPassword === "string" ? body.newPassword : "";
    const confirmPassword =
      typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!email || (!code && !token)) {
      return NextResponse.json(
        { error: "البريد الإلكتروني ورمز التحقق أو الرابط مطلوبان" },
        { status: 400 },
      );
    }

    if (code && code.length !== 6 && !token) {
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

    if (confirmPassword && newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "كلمتا المرور غير متطابقتين" },
        { status: 400 },
      );
    }

    if (newPassword.toLowerCase() === email) {
      return NextResponse.json(
        { error: "لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني" },
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

    if (!user.resetCode && !user.resetToken) {
      return NextResponse.json(
        {
          error: "تم استخدام هذا الرمز أو الرابط مسبقاً أو أنه لم يعد صالحاً. يرجى طلب رابط جديد.",
          code: "TOKEN_ALREADY_USED",
        },
        { status: 400 },
      );
    }

    const isCodeMatch = code && user.resetCode === code;
    const isTokenMatch = token && user.resetToken === token;

    if (!isCodeMatch && !isTokenMatch) {
      return NextResponse.json(
        { error: "رمز التحقق أو الرابط غير صحيح، يرجى التأكد وإعادة المحاولة", code: "TOKEN_INVALID" },
        { status: 400 },
      );
    }

    if (!user.resetExpiresAt || new Date(user.resetExpiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: "انتهت صلاحية رمز التحقق (صلاحيته 15 دقيقة فقط)، يرجى طلب رمز جديد.",
          code: "TOKEN_EXPIRED",
        },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Atomically update password and invalidate one-time token & code
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          passwordHash,
          resetCode: null,
          resetToken: null,
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
