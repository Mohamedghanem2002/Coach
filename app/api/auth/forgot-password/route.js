import { NextResponse } from "next/server";
import crypto from "crypto";
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

    const genericSuccessMessage =
      "إذا كان هذا البريد مسجلاً في المنظومة، فستصلك تعليمات استعادة كلمة المرور ورمز التحقق (يرجى تفقد مجلد Spam أيضاً).";

    // SECURITY: Prevent User Enumeration.
    // If user does NOT exist, return the exact same generic response.
    if (!user) {
      return NextResponse.json({
        success: true,
        emailSent: true,
        message: genericSuccessMessage,
      });
    }

    // Generate 6-digit OTP code and a 32-byte cryptographic token
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins validity

    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          resetCode: code,
          resetToken: token,
          resetExpiresAt: expiresAt,
        },
      },
    );

    const baseUrl =
      process.env.NEXTAUTH_URL ||
      request.nextUrl?.origin ||
      "http://localhost:3000";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

    const mailRes = await sendPasswordResetCode({
      email,
      code,
      token,
      resetUrl,
      userName: user.name || "",
    });

    if (!mailRes.success || mailRes.simulated) {
      if (mailRes.simulated) {
        console.warn("[Password Reset] SMTP not configured. Real email delivery is disabled.");
        return NextResponse.json(
          {
            success: false,
            error:
              "لم يتم ضبط خادم إرسال البريد الإلكتروني (SMTP) في النظام بعد. يرجى إضافة بيانات البريد في ملف .env.local أو التواصل مع الإدارة.",
          },
          { status: 503 }
        );
      }

      console.warn("[Password Reset] Email delivery failed:", mailRes.error);
      return NextResponse.json(
        {
          success: false,
          error:
            "تعذر إرسال رسالة استعادة كلمة المرور إلى بريدك الإلكتروني حالياً. يرجى التأكد من صحة البريد أو المحاولة لاحقاً.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailSent: true,
      message: genericSuccessMessage,
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة طلب استعادة كلمة المرور" },
      { status: 500 },
    );
  }
}
