import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "./auth";
import clientPromise from "./mongodb";

// In-memory cache for fast tenant resolution (reduces MongoDB lookups to 0ms for rapid API calls)
const tenantCache = new Map();
const TENANT_CACHE_TTL = 3000; // 3 seconds

export function clearTenantCache(userIdOrEmail) {
  if (!userIdOrEmail) {
    tenantCache.clear();
    return;
  }
  tenantCache.delete(String(userIdOrEmail).toLowerCase());
}

export async function currentUserId() {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.id) return session.user.id;
  if (!session.user.email) return null;
  const client = await clientPromise;
  const user = await client
    .db(process.env.MONGODB_DB)
    .collection("users")
    .findOne(
      { email: session.user.email.trim().toLowerCase() },
      { projection: { _id: 1 } },
    );
  return user?._id ? user._id.toString() : null;
}

/**
 * Server-side authorization check for multi-tenant academy access.
 * Enforces Rules 10 & 11:
 * - Verifies user is authenticated
 * - Verifies user exists in DB
 * - Grants full access to system admin
 * - Blocks suspended academies with 403 SUBSCRIPTION_INACTIVE
 * - Blocks expired subscriptions with 403 SUBSCRIPTION_INACTIVE
 * - Preserves all data intact
 *
 * @returns {Promise<{ allowed: boolean, ownerId?: string, user?: object, response?: NextResponse }>}
 */
export async function requireActiveTenant() {
  const session = await auth();
  if (!session?.user) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "يجب تسجيل الدخول أولًا", code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  const cacheKey = (session.user.id || session.user.email || "").toLowerCase().trim();
  const cached = tenantCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < TENANT_CACHE_TTL) {
    return cached.result;
  }

  const client = await clientPromise;
  const users = client.db(process.env.MONGODB_DB).collection("users");

  const email = (session.user.email || "").trim().toLowerCase();
  let query = {};
  if (session.user.id) {
    try {
      query = { _id: new ObjectId(session.user.id) };
    } catch {
      query = { _id: session.user.id };
    }
  } else if (email) {
    query = { email };
  }

  let user = await users.findOne(query);
  if (!user && email) {
    user = await users.findOne({ email });
  }

  if (!user) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "حساب المستخدم غير موجود", code: "USER_NOT_FOUND" },
        { status: 404 }
      ),
    };
  }

  const ownerId = user._id.toString();
  const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();

  // Admin users are exempt from academy subscription restrictions
  if (user.role === "admin" || email === adminEmail) {
    const adminResult = {
      allowed: true,
      ownerId,
      user,
      isAdmin: true,
    };
    tenantCache.set(cacheKey, { timestamp: Date.now(), result: adminResult });
    return adminResult;
  }

  // 1. Check if captain account is suspended or disabled by administrator
  const isSuspended =
    user.status === "suspended" ||
    user.status === "disabled" ||
    user.subscriptionStatus === "suspended" ||
    user.subscriptionStatus === "disabled";

  if (isSuspended) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "SUBSCRIPTION_INACTIVE",
          code: "SUBSCRIPTION_INACTIVE",
          reason: "suspended",
          message:
            user.suspensionReason ||
            "تم تعليق خدمة الأكاديمية مؤقتاً من قبل الإدارة. يرجى التواصل مع الدعم الفني.",
          academyName: user.academyName || "الأكاديمية",
          subscriptionExpiresAt: user.subscriptionExpiresAt,
          adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "mg0447837@gmail.com",
          contactPhones: [
            { number: "01552488179", display: "0155 248 8179", rawWhatsApp: "201552488179" },
            { number: "01028138408", display: "0102 813 8408", rawWhatsApp: "201028138408" },
          ],
        },
        { status: 403 }
      ),
    };
  }

  // 2. Check automatic subscription expiration
  if (user.subscriptionExpiresAt) {
    const expiresAtTime = new Date(user.subscriptionExpiresAt).getTime();
    if (expiresAtTime < Date.now()) {
      // Automatically synchronize suspended status in DB
      if (user.status !== "suspended" || user.subscriptionStatus !== "expired") {
        users
          .updateOne(
            { _id: user._id },
            {
              $set: {
                status: "suspended",
                subscriptionStatus: "expired",
                suspensionReason:
                  "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك مع إدارة المنصة لاستئناف الخدمة ومواصلة الاستخدام.",
                updatedAt: new Date(),
              },
            }
          )
          .catch(() => {});
      }

      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: "SUBSCRIPTION_INACTIVE",
            code: "SUBSCRIPTION_INACTIVE",
            reason: "expired",
            message:
              "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك مع إدارة المنصة لاستئناف الخدمة ومواصلة الاستخدام.",
            academyName: user.academyName || "الأكاديمية",
            subscriptionExpiresAt: user.subscriptionExpiresAt,
            adminEmail: process.env.ADMIN_NOTIFICATION_EMAIL || "mg0447837@gmail.com",
            contactPhones: [
              { number: "01552488179", display: "0155 248 8179", rawWhatsApp: "201552488179" },
              { number: "01028138408", display: "0102 813 8408", rawWhatsApp: "201028138408" },
            ],
          },
          { status: 403 }
        ),
      };
    }
  }

  const tenantResult = {
    allowed: true,
    ownerId,
    user,
    isAdmin: false,
  };
  tenantCache.set(cacheKey, { timestamp: Date.now(), result: tenantResult });
  return tenantResult;
}
