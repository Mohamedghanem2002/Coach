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

async function extractCaptainId(request, context) {
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
      if (lastPart && lastPart !== "captains" && lastPart !== "academies") {
        id = lastPart;
      }
    } catch {}
  }
  return id;
}

// GET: Full Captain profile, statistics, players list, halls list, events list, and audit logs
export async function GET(request, context) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const id = await extractCaptainId(request, context);
    if (!id) {
      return NextResponse.json(
        { error: "معرف الكابتن مطلوب في الطلب", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const queryId = parseQueryId(id);
    const user = await db.collection("users").findOne({ _id: queryId });

    if (!user) {
      return NextResponse.json(
        { error: "حساب الكابتن غير موجود في النظام", code: "NOT_FOUND" },
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

    // Query real DB records belonging to this captain
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

    // Build halls with player breakdowns
    const hallsWithDetails = branches.map((b) => {
      const bName = (b.name || "").trim().toLowerCase();
      const hallPlayers = players.filter(
        (p) => (p.branch || "").trim().toLowerCase() === bName
      );
      return {
        id: b._id.toString(),
        _id: b._id.toString(),
        name: b.name,
        days: b.days || [],
        playersCount: hallPlayers.length,
        players: hallPlayers.map((hp) => ({
          id: hp._id.toString(),
          name: hp.name,
          belt: hp.belt || "",
        })),
        createdAt: b.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      captain: {
        id: user._id.toString(),
        _id: user._id.toString(),
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
      academy: {
        id: user._id.toString(),
        _id: user._id.toString(),
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
        hallsCount: branches.length,
        eventsCount: events.length,
      },
      players: players.map((p) => ({
        id: p._id.toString(),
        _id: p._id.toString(),
        name: p.name,
        branch: p.branch || "",
        belt: p.belt || "",
        age: p.age || null,
        dateOfBirth: p.dateOfBirth || null,
        phone: p.guardianPhone || p.phone || "",
        paymentStatus: p.paymentStatus || "unpaid",
        createdAt: p.createdAt,
      })),
      branches: hallsWithDetails,
      halls: hallsWithDetails,
      events: events.map((e) => ({
        id: e._id.toString(),
        _id: e._id.toString(),
        title: e.title || e.name || "فعالية تدريبية",
        date: e.date || null,
        fee: Number(e.fee ?? 100),
        participantsCount: Array.isArray(e.participants) ? e.participants.length : 0,
        createdAt: e.createdAt,
      })),
      auditLogs: auditLogs.map((log) => ({
        ...log,
        _id: log._id?.toString(),
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/captains/[id] error:", error);
    return NextResponse.json(
      { error: "تعذر تحميل تفاصيل الكابتن", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// PATCH: Suspend, reactivate, extend subscription, toggle payment
export async function PATCH(request, context) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const id = await extractCaptainId(request, context);
    if (!id) {
      return NextResponse.json(
        { error: "معرف الكابتن مطلوب في الطلب", code: "INVALID_ID" },
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
        { error: "حساب الكابتن غير موجود", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const targetAcademyId = user._id.toString();
    const targetAcademyName = user.academyName || user.name || "الأكاديمية";

    const updateFields = {
      updatedAt: new Date(),
    };

    let auditAction = "";
    let auditDetails = {};
    let successMessage = "";

    const now = new Date();

    // 1. Suspend Captain
    if (action === "suspend") {
      const reason = (body.reason || "تم تعليق الحساب بقرار من إدارة المنصة").trim();
      updateFields.status = "suspended";
      updateFields.subscriptionStatus = "suspended";
      updateFields.suspensionReason = reason;

      auditAction = "suspend_academy";
      auditDetails = { reason };
      successMessage = `تم تعليق حساب الكابتن "${user.name}" بنجاح.`;
    }

    // 2. Reactivate / Activate Captain
    else if (action === "activate" || action === "reactivate") {
      updateFields.status = "active";
      updateFields.subscriptionStatus = "active";
      updateFields.suspensionReason = null;

      const isPast = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() < now.getTime();
      if (isPast || !user.subscriptionExpiresAt) {
        updateFields.subscriptionExpiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      }

      auditAction = "reactivate_academy";
      auditDetails = {
        restoredExpiresAt: updateFields.subscriptionExpiresAt || user.subscriptionExpiresAt,
      };
      successMessage = `تمت إعادة تفعيل حساب الكابتن "${user.name}" واستئناف الخدمة.`;
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

        const baseDate = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getTime() > now.getTime()
          ? new Date(user.subscriptionExpiresAt)
          : now;

        newExpiresAt = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
      }

      updateFields.subscriptionExpiresAt = newExpiresAt;
      updateFields.status = "active";
      updateFields.subscriptionStatus = "active";

      auditAction = "extend_subscription";
      auditDetails = {
        daysAdded: body.days || null,
        newExpiresAt,
      };
      successMessage = `تم تمديد اشتراك الكابتن "${user.name}" بنجاح حتى ${newExpiresAt.toISOString().slice(0, 10)}.`;
    }

    // 4. Toggle Payment Status
    else if (action === "toggle_payment") {
      const currentPaid = user.subscriptionPaid !== false;
      const newPaid = !currentPaid;
      updateFields.subscriptionPaid = newPaid;

      auditAction = newPaid ? "mark_subscription_paid" : "mark_subscription_unpaid";
      auditDetails = { paid: newPaid };
      successMessage = `تم تحديث حالة السداد إلى: ${newPaid ? "مدفوع ✓" : "غير مدفوع ✗"}.`;
    }

    else {
      return NextResponse.json(
        { error: `الإجراء المطلوب (${action}) غير معروف` },
        { status: 400 }
      );
    }

    // Apply update
    await db.collection("users").updateOne({ _id: user._id }, { $set: updateFields });

    // Record audit log
    if (auditAction) {
      await recordAuditLog({
        action: auditAction,
        targetAcademyId,
        targetAcademyName,
        adminEmail: adminCheck.admin.email,
        adminId: adminCheck.admin.id,
        details: auditDetails,
      });
    }

    return NextResponse.json({
      success: true,
      message: successMessage,
      updated: updateFields,
    });
  } catch (error) {
    console.error("PATCH /api/admin/captains/[id] failed:", error);
    return NextResponse.json(
      { error: "تعذر تحديث بيانات الكابتن", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

// DELETE: Cascading permanent deletion of captain account, players, halls, and events
export async function DELETE(request, context) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const id = await extractCaptainId(request, context);
    if (!id) {
      return NextResponse.json(
        { error: "معرف الكابتن مطلوب في الطلب", code: "INVALID_ID" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const queryId = parseQueryId(id);
    const user = await db.collection("users").findOne({ _id: queryId });

    if (!user) {
      return NextResponse.json(
        { error: "حساب الكابتن غير موجود", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Protect system admin account
    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();
    if (user.role === "admin" || (user.email && user.email.toLowerCase().trim() === adminEmail)) {
      return NextResponse.json(
        { error: "لا يمكن حذف حساب الإدارة العامة للنظام" },
        { status: 403 }
      );
    }

    const targetAcademyId = user._id.toString();
    const targetCaptainName = user.name || user.academyName || "الكابتن";

    // Sequential cascading deletion
    const playersDel = await db.collection("players").deleteMany({ ownerId: user._id });
    const branchesDel = await db.collection("branches").deleteMany({ ownerId: user._id });
    const eventsDel = await db.collection("events").deleteMany({ ownerId: user._id });

    try {
      await db.collection("cloud_snapshots").deleteMany({ ownerId: user._id });
    } catch {}

    await db.collection("users").deleteOne({ _id: user._id });

    // Record audit log
    await recordAuditLog({
      action: "delete_academy_permanent",
      targetAcademyId,
      targetAcademyName: targetCaptainName,
      adminEmail: adminCheck.admin.email,
      adminId: adminCheck.admin.id,
      details: {
        deletedEmail: user.email,
        deletedName: user.name,
        deletedPlayersCount: playersDel.deletedCount || 0,
        deletedBranchesCount: branchesDel.deletedCount || 0,
        deletedEventsCount: eventsDel.deletedCount || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم حذف حساب الكابتن "${targetCaptainName}" وجميع لاعبيه (${playersDel.deletedCount || 0} لاعب) وصالاته (${branchesDel.deletedCount || 0} صالة) نهائياً من قاعدة البيانات بنجاح.`,
      deletedCaptainId: targetAcademyId,
    });
  } catch (error) {
    console.error("DELETE /api/admin/captains/[id] failed:", error);
    return NextResponse.json(
      { error: "تعذر حذف الكابتن وبياناته", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
