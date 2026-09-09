import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
export async function POST(request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || name.length > 80 || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "اكتب الاسم والإيميل بشكل صحيح" },
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
    if (await users.findOne({ email })) {
      return NextResponse.json(
        { error: "هذا الإيميل مسجل بالفعل" },
        { status: 409 },
      );
    }
    await users.insertOne({
      name,
      email,
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date(),
    });
    return NextResponse.json({ created: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/auth/register failed", error);
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
