import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { sendAdminRegistrationNotification } from "../../../../backend/email";
import { recordAuditLog } from "../../../../backend/audit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const academyName =
      typeof body.academyName === "string" ? body.academyName.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!name || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "اكتب الاسم والإيميل بشكل صحيح" },
        { status: 400 },
      );
    }
    if (!academyName || academyName.length > 100) {
      return NextResponse.json(
        { error: "اكتب اسم الأكاديمية أو النادي بشكل صحيح (مثال: أكاديمية النجوم)" },
        { status: 400 },
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const users = client.db(process.env.MONGODB_DB).collection("users");
    const escapedEmail = email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const existingUser = await users.findOne({
      $or: [
        { email },
        { email: { $regex: new RegExp(`^${escapedEmail}$`, "i") } }
      ]
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "الايميل مسجل من قبل" },
        { status: 409 },
      );
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();
    const isSystemAdmin = email === adminEmail;

    const now = new Date();
    // Default 30 days subscription trial for new academies
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const newUser = {
      name,
      academyName,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, 12),
      role: isSystemAdmin ? "admin" : "user",
      status: "active",
      subscriptionStatus: "active",
      subscriptionPlan: isSystemAdmin ? "system_admin" : "trial",
      subscriptionStartedAt: now,
      subscriptionExpiresAt: expiresAt,
      subscriptionPaid: true,
      createdAt: now,
    };

    const insertResult = await users.insertOne(newUser);
    const userId = insertResult.insertedId;

    // Fail-safe admin notification (Rule 16: Failure MUST NOT break registration)
    if (!isSystemAdmin) {
      sendAdminRegistrationNotification({
        academyName,
        ownerName: name,
        email,
        phone,
        registeredAt: now,
      }).catch((emailErr) => {
        console.error("Non-blocking admin email notification error:", emailErr?.message || emailErr);
      });

      // Record audit log
      recordAuditLog({
        action: "register_academy",
        targetAcademyId: userId,
        targetAcademyName: academyName,
        adminEmail: "نظام التسجيل التلقائي",
        details: {
          ownerName: name,
          email,
          phone,
          plan: "trial",
          expiresAt,
        },
      }).catch((auditErr) => {
        console.error("Non-blocking audit log error:", auditErr?.message || auditErr);
      });
    }

    return NextResponse.json({ created: true, id: userId.toString() }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/register failed", error);
    if (error?.code === 11000 || error?.message?.includes("duplicate key") || error?.message?.includes("E11000")) {
      return NextResponse.json({ error: "الايميل مسجل من قبل" }, { status: 409 });
    }
    if (error instanceof Error && error.name === "MongoServerSelectionError") {
      return NextResponse.json(
        {
          error:
            "قاعدة البيانات غير متاحة حاليًا. تحقق من اتصال MongoDB Atlas.",
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "تعذر إنشاء الحساب" }, { status: 500 });
  }
}

