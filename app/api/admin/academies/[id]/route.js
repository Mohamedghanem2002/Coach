import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../../../backend/mongodb";
import { requireAdmin } from "../../../../../backend/admin-auth";
import { recordAuditLog } from "../../../../../backend/audit";

export const dynamic = "force-dynamic";

function parseQueryId(id) {
  try {
    if (typeof id === "string" && id.length === 24) {
      return new ObjectId(id);
    }
  } catch {}
  return id;
}

async function extractAcademyId(request, context) {
  let id = null;
  try {
    const rawParams = context?.params;
    const resolvedParams = rawParams && typeof rawParams.then === "function" ? await rawParams : rawParams;
    id = resolvedParams?.id;
  } catch {}

  if (!id && request) {
    try {
      const url = new URL(request.url);
      const parts = url.pathname.split("/").filter(Boolean);
      const lastPart = parts[parts.length - 1];
      if (lastPart && lastPart !== "academies") {
        id = lastPart;
      }
    } catch {}
  }
  return id;
}

export async function GET(request, context) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const id = await extractAcademyId(request, context);
    if (!id) {
      return NextResponse.json(
        { error: "معرف الأكاديمية مطلوب في الطلب", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const queryId = parseQueryId(id);
    const user = await db.collection("users").findOne({ _id: queryId });

    if (!user) {
      return NextResponse.json(
        { error: "الأكاديمية غير موجودة في النظام", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const now = new Date();
    const isSuspended = user.status === "suspended" || user.subscriptionStatus === "suspended";
    const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < now.getTime();

    let computedStatus = "active";
    if (isSuspended) computedStatus = "suspended";
    else if (isExpired) computedStatus = "expired";

    let daysRemaining = null;
    if (user.subscriptionExpiresAt) {
      const diffMs = new Date(user.subscriptionExpiresAt).getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    // Real DB relationships
    const [players, branches, events, auditLogs] = await Promise.all([
      db.collection("players").find({ ownerId: user._id }).toArray(),
      db.collection("branches").find({ ownerId: user._id }).toArray(),
      db.collection("events").find({ ownerId: user._id }).toArray(),
      db.collection("audit_logs")
        .find({ targetAcademyId: user._id.toString() })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray(),
    ]);

    return NextResponse.json({
      success: true,
      academy: {
        id: user._id.toString(),
        name: user.name,
        academyName: user.academyName || "Re_action DOJO",
        email: user.email,
        phone: user.phone || "",
        role: user.role || "user",
        status: user.status || "active",
        subscriptionStatus: computedStatus,
        subscriptionPlan: user.subscriptionPlan || "trial",
        subscriptionStartedAt: user.subscriptionStartedAt || user.createdAt,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        subscriptionPaid: user.subscriptionPaid !== false,
        suspensionReason: user.suspensionReason || null,
        daysRemaining,
        createdAt: user.createdAt,
      },
      stats: {
        playersCount: players.length,
        branchesCount: branches.length,
        eventsCount: events.length,
      },
      players: players.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        branch: p.branch || "",
        belt: p.belt || "",
        age: p.age || null,
        phone: p.phone || p.parentPhone || "",
        createdAt: p.createdAt,
      })),
      branches: branches.map((b) => ({
        id: b._id.toString(),
        name: b.name,
        createdAt: b.createdAt,
      })),
      auditLogs: auditLogs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/academies/[id] failed:", error);
    return NextResponse.json(
      { error: "تعذر تحميل تفاصيل الأكاديمية", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request, context) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const id = await extractAcademyId(request, context);
    if (!id) {
      return NextResponse.json(
        { error: "معرف الأكاديمية مطلوب في الطلب", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const action = body.action;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const queryId = parseQueryId(id);
    const user = await db.collection("users").findOne({ _id: queryId });

    if (!user) {
      return NextResponse.json(
        { error: "الأكاديمية غير موجودة", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const targetAcademyId = user._id.toString();
    const targetAcademyName = user.academyName || user.name || "الأكاديمية";
    const adminEmail = adminCheck.admin.email;
    const adminId = adminCheck.admin.id;

    const updateFields = {
      updatedAt: new Date(),
    };

    let auditAction = "";
    let auditDetails = {};
    let successMessage = "";

    const now = new Date();

    // 1. Suspend Academy
    if (action === "suspend") {
      const reason = (body.reason || "تم تعليق الحساب بقرار من إدارة المنصة").trim();
      updateFields.status = "suspended";
      updateFields.subscriptionStatus = "suspended";
      updateFields.suspensionReason = reason;

      auditAction = "suspend_academy";
      auditDetails = { reason };
      successMessage = `تم تعليق خدمة أكاديمية "${targetAcademyName}" بنجاح.`;
    }

    // 2. Reactivate / Activate Academy
    else if (action === "activate" || action === "reactivate") {
      updateFields.status = "active";
      updateFields.subscriptionStatus = "active";
      updateFields.suspensionReason = null;

      // If already expired, extend by at least 30 days from now
      const isPast = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < now.getTime();
      if (isPast || !user.subscriptionExpiresAt) {
        updateFields.subscriptionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      auditAction = "reactivate_academy";
      auditDetails = {
        restoredExpiresAt: updateFields.subscriptionExpiresAt || user.subscriptionExpiresAt,
      };
      successMessage = `تمت إعادة تفعيل أكاديمية "${targetAcademyName}" واستئناف الخدمة.`;
    }

    // 3. Extend Subscription
    else if (action === "extend_subscription") {
      let newExpiresAt = null;

      if (body.customDate) {
        newExpiresAt = new Date(body.customDate);
        if (isNaN(newExpiresAt.getTime())) {
          return NextResponse.json({ error: "تاريخ الانتهاء المخصص غير صالح" }, { status: 400 });
        }
      } else {
        const days = parseInt(body.days, 10);
        if (isNaN(days) || days <= 0) {
          return NextResponse.json({ error: "عدد الأيام غير صالح (يجب أن يكون رقماً أكبر من صفر)" }, { status: 400 });
        }

        // If current expiration is in the future, extend from that date; otherwise from now
        const baseDate = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > now.getTime()
          ? new Date(user.subscriptionExpiresAt)
          : now;

        newExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      }

      updateFields.subscriptionExpiresAt = newExpiresAt;
      updateFields.status = "active";
      updateFields.subscriptionStatus = "active";
      updateFields.suspensionReason = null;

      auditAction = "extend_subscription";
      auditDetails = {
        daysAdded: body.days || "custom",
        newExpiresAt,
        previousExpiresAt: user.subscriptionExpiresAt,
      };
      successMessage = `تم تمديد اشتراك أكاديمية "${targetAcademyName}" بنجاح حتى ${newExpiresAt.toISOString().slice(0, 10)}.`;
    }

    // 4. Set Payment Status
    else if (action === "set_payment_status") {
      const isPaid = Boolean(body.paid);
      updateFields.subscriptionPaid = isPaid;

      auditAction = isPaid ? "mark_subscription_paid" : "mark_subscription_unpaid";
      auditDetails = { paid: isPaid };
      successMessage = `تم تحديث حالة السداد إلى: ${isPaid ? "تم الدفع ✓" : "غير مدفوع ✗"}.`;
    }

    // 5. Update Plan
    else if (action === "update_plan") {
      const plan = (body.plan || "standard").trim();
      updateFields.subscriptionPlan = plan;

      auditAction = "update_subscription_plan";
      auditDetails = { newPlan: plan, oldPlan: user.subscriptionPlan };
      successMessage = `تم ترقية وتحديث خطة الاشتراك إلى: ${plan}.`;
    }

    else {
      return NextResponse.json(
        { error: "إجراء غير مدعوم" },
        { status: 400 }
      );
    }

    // Save to database
    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: updateFields }
    );

    // Record audit log
    await recordAuditLog({
      action: auditAction,
      targetAcademyId,
      targetAcademyName,
      adminEmail,
      adminId,
      details: auditDetails,
    });

    return NextResponse.json({
      success: true,
      message: successMessage,
      action,
      updatedFields: updateFields,
    });
  } catch (error) {
    console.error("PATCH /api/admin/academies/[id] failed:", error);
    return NextResponse.json(
      { error: "تعذر تطبيق الإجراء على الأكاديمية", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
