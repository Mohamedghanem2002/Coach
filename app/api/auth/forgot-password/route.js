import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { sendPasswordResetCode } from "../../../../backend/email";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "يرجى كتابة البريد الإلكتروني بشكل صحيح" },
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
        { error: "هذا البريد الإلكتروني غير مسجل في المنظومة" },
        { status: 404 },
      );
    }

    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetCode: code,
          resetExpiresAt: expiresAt,
        },
      },
    );

    const mailRes = await sendPasswordResetCode({
      email,
      code,
      userName: user.name || "",
    });

    if (!mailRes.success) {
      console.warn("[Password Reset] Email delivery failed:", mailRes.error);
      return NextResponse.json({
        success: true,
        emailSent: false,
        code,
        isAuthError: mailRes.isAuthError,
        message: mailRes.isAuthError
          ? "تعذر إرسال الإيميل لأن حساب Google يتطلب (كلمة مرور تطبيقات App Password) مكونة من 16 حرفاً لحساب Gmail بدلاً من كلمة السر العادية. يمكنك استخدام رمز التحقق المعروض أدناه لإتمام العملية فوراً."
          : "تعذر إرسال الإيميل إلى بريدك حالياً. يمكنك استخدام رمز التحقق المعروض أدناه لإتمام العملية.",
      });
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني بنجاح (تفقد صندوق الوارد أو Spam)",
      code: mailRes?.simulated ? code : undefined,
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة طلب استعادة كلمة المرور" },
      { status: 500 },
    );
  }
}
