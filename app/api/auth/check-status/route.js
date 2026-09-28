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

    const now = new Date();
    const isExpired =
      user.subscriptionExpiresAt &&
      new Date(user.subscriptionExpiresAt).getTime() < now.getTime();

    const isSuspended =
      user.status === "suspended" ||
      user.status === "disabled" ||
      user.subscriptionStatus === "suspended" ||
      user.subscriptionStatus === "disabled" ||
      isExpired;

    if (isSuspended) {
      if (isExpired && user.status !== "suspended") {
        client
          .db(process.env.MONGODB_DB)
          .collection("users")
          .updateOne(
            { _id: user._id },
            {
              $set: {
                status: "suspended",
                subscriptionStatus: "expired",
                suspensionReason:
                  "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك لاستئناف الخدمة ومواصلة الاستخدام.",
                updatedAt: now,
              },
            }
          )
          .catch(() => {});
      }

      return NextResponse.json({
        suspended: true,
        isExpired: Boolean(isExpired),
        reason: isExpired
          ? "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك لاستئناف الخدمة ومواصلة الاستخدام."
          : (user.suspensionReason || "تم إيقاف هذا الحساب من قِبل إدارة المنصة. يرجى التواصل مع الإدارة لاستئناف الخدمة."),
        adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || adminEmail,
        contactPhones: [
          { number: "01552488179", display: "0155 248 8179", rawWhatsApp: "201552488179" },
          { number: "01028138408", display: "0102 813 8408", rawWhatsApp: "201028138408" },
        ],
      });
    }

    return NextResponse.json({ suspended: false });
  } catch (error) {
    console.error("Check status error:", error);
    return NextResponse.json({ suspended: false });
  }
}
