import { NextResponse } from "next/server";
import { auth } from "./auth";
import clientPromise from "./mongodb";

/**
 * Ensures the requesting user is authenticated and holds the admin role.
 * Verifies both the active NextAuth session and the database record.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً كمسؤول للوصول إلى لوحة التحكم", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();
  const userEmail = (session.user.email || "").toLowerCase().trim();

  try {
    const client = await clientPromise;
    const user = await client
      .db(process.env.MONGODB_DB)
      .collection("users")
      .findOne({ email: userEmail });

    const isAdmin =
      (user && user.role === "admin") ||
      session.user.role === "admin" ||
      userEmail === adminEmail;

    if (!isAdmin) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: "غير مصرح لك بالوصول إلى لوحة تحكم الإدارة", code: "FORBIDDEN" },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      admin: {
        id: (user?._id || session.user.id).toString(),
        name: user?.name || session.user.name || "المدير العام",
        email: userEmail,
        role: "admin",
      },
    };
  } catch (error) {
    console.error("requireAdmin error:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { error: "حدث خطأ أثناء التحقق من صلاحيات الإدارة" },
        { status: 500 }
      ),
    };
  }
}
