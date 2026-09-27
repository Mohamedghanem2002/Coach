import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ suspended: false });
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();
    if (email === adminEmail) {
      return NextResponse.json({ suspended: false, isAdmin: true });
    }

    const client = await clientPromise;
    const user = await client
      .db(process.env.MONGODB_DB)
      .collection("users")
      .findOne({ email });

    if (!user) {
      return NextResponse.json({ suspended: false });
    }

    if (user.role === "admin") {
      return NextResponse.json({ suspended: false, isAdmin: true });
    }

    const isSuspended =
      user.status === "suspended" ||
      user.status === "disabled" ||
      user.subscriptionStatus === "suspended" ||
      user.subscriptionStatus === "disabled";

    if (isSuspended) {
      return NextResponse.json({
        suspended: true,
        reason:
          user.suspensionReason ||
          "تم إيقاف هذا الحساب من قِبل إدارة المنصة. يرجى التواصل مع الإدارة لاستئناف الخدمة.",
        adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || adminEmail,
      });
    }

    return NextResponse.json({ suspended: false });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json({ suspended: false });
  }
}
