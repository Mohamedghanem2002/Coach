import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../../../backend/mongodb";
import { requireAdmin } from "../../../../../backend/admin-auth";
import { recordAuditLog } from "../../../../../backend/audit";
import {
  computeSubscriptionExpiry,
  calculateDaysRemaining,
} from "../../../../../backend/subscription-utils";

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
        academyName: user.academyName || "CoachMaster",
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
      branches: branches.map((b) => {
        const bName = (b.name || "").trim().toLowerCase();
        const pInBranch = players.filter(
          (p) => (p.branch || "").trim().toLowerCase() === bName
        ).length;
        return {
          id: b._id.toString(),
          name: b.name,
          playersCount: pInBranch,
          createdAt: b.createdAt,
        };
      }),
      events: events.map((e) => ({
        id: e._id.toString(),
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

    // 3. Extend / Set Subscription Validity (Counts from Entry Date, Additive, or Lifetime)
    else if (action === "extend_subscription") {
      const isLifetimeAction = body.isLifetime || body.plan === "lifetime" || body.mode === "lifetime" || body.calculationBase === "lifetime" || body.months >= 1200;
      const mode = isLifetimeAction ? "lifetime" : (body.calculationBase || body.mode || (body.customDate ? "custom_date" : "from_entry"));
      const entryDate = user.subscriptionStartedAt || user.createdAt || now;

      let newExpiresAt = null;

      if (isLifetimeAction) {
        newExpiresAt = computeSubscriptionExpiry({
          entryDate,
          currentExpiry: user.subscriptionExpiresAt,
          mode: "lifetime",
          months: 1200,
          now,
        });
        updateFields.subscriptionPlan = "lifetime";
        updateFields.isLifetime = true;
      } else if (mode === "custom_date" || body.customDate) {
        newExpiresAt = new Date(body.customDate);
        if (isNaN(newExpiresAt.getTime())) {
          return NextResponse.json({ error: "تاريخ الانتهاء المخصص غير صالح" }, { status: 400 });
        }
        if (user.subscriptionPlan === "lifetime") {
          updateFields.subscriptionPlan = "custom";
          updateFields.isLifetime = false;
        }
      } else {
        const months = body.months ? parseInt(body.months, 10) : null;
        const days = body.days ? parseInt(body.days, 10) : null;

        if ((!months || months <= 0) && (!days || days <= 0)) {
          return NextResponse.json({ error: "مدة الاشتراك المحددة غير صالحة" }, { status: 400 });
        }

        newExpiresAt = computeSubscriptionExpiry({
          entryDate,
          currentExpiry: user.subscriptionExpiresAt,
          mode,
          months,
          days,
          now,
        });
        if (months === 1) updateFields.subscriptionPlan = "standard";
        else if (months === 3) updateFields.subscriptionPlan = "quarterly";
        else if (months === 6) updateFields.subscriptionPlan = "semi-annual";
        else if (months === 12) updateFields.subscriptionPlan = "annual";
        else if (user.subscriptionPlan === "lifetime") {
          updateFields.subscriptionPlan = "standard";
          updateFields.isLifetime = false;
        }
      }

      if (!user.subscriptionStartedAt) {
        updateFields.subscriptionStartedAt = entryDate;
      }

      updateFields.subscriptionExpiresAt = newExpiresAt;

      // Auto-update account status based on new expiration
      const isPast = !isLifetimeAction && newExpiresAt.getTime() < now.getTime();
      if (isPast) {
        updateFields.status = "suspended";
        updateFields.subscriptionStatus = "expired";
        updateFields.suspensionReason = "انتهت فترة الصلاحية المحددة للاشتراك تلقائياً.";
      } else {
        updateFields.status = "active";
        updateFields.subscriptionStatus = "active";
        updateFields.suspensionReason = null;
      }

      const daysRemaining = calculateDaysRemaining(newExpiresAt, now, {
        subscriptionPlan: updateFields.subscriptionPlan || user.subscriptionPlan,
        isLifetime: isLifetimeAction || user.isLifetime,
      });

      auditAction = "extend_subscription";
      auditDetails = {
        mode,
        months: body.months || null,
        days: body.days || null,
        entryDate,
        newExpiresAt,
        daysRemaining,
        plan: updateFields.subscriptionPlan || user.subscriptionPlan,
      };

      const formattedDate = newExpiresAt.toISOString().slice(0, 10);
      successMessage = isLifetimeAction
        ? `تم تفعيل وتأكيد اشتراك مدى الحياة ♾️ لأكاديمية "${targetAcademyName}" بنجاح.`
        : mode === "from_entry"
        ? `تم ضبط صلاحية اشتراك أكاديمية "${targetAcademyName}" بنجاح حتى ${formattedDate} (محسوبة من تاريخ الدخول).`
        : `تم تمديد اشتراك أكاديمية "${targetAcademyName}" بنجاح حتى ${formattedDate}.`;
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

export async function DELETE(request, context) {
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
    let user = await db.collection("users").findOne({ _id: queryId });
    if (!user && typeof id === "string") {
      user = await db.collection("users").findOne({ _id: id });
    }
    if (!user && typeof id === "string") {
      user = await db.collection("users").findOne({ email: id.toLowerCase().trim() });
    }

    if (!user) {
      return NextResponse.json(
        { error: "الأكاديمية غير موجودة في قاعدة البيانات", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    // Protect currently logged-in administrator from self-destructive deletion
    const currentAdminId = adminCheck.admin.id;
    if (
      user._id.toString() === currentAdminId ||
      (user.email && user.email.toLowerCase().trim() === adminCheck.admin.email.toLowerCase().trim())
    ) {
      return NextResponse.json(
        { error: "لا يمكن للمسؤول حذف حسابه الشخصي المسجل به حالياً منعاً للتعطيل الذاتي للنظام", code: "FORBIDDEN_SELF_DELETE" },
        { status: 403 }
      );
    }

    // Protect system master admin
    const masterAdminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();
    if (user.email && user.email.toLowerCase().trim() === masterAdminEmail) {
      return NextResponse.json(
        { error: "لا يمكن حذف حساب المسؤول العام الرئيسي للنظام", code: "FORBIDDEN_MASTER_ADMIN" },
        { status: 403 }
      );
    }

    const targetAcademyId = user._id.toString();
    const targetAcademyName = user.academyName || user.name || "الأكاديمية";
    const targetEmail = user.email || "";

    // Cascading deletion of all academy data (players, branches, events, snapshots, user)
    const playersDel = await db.collection("players").deleteMany({ ownerId: user._id });
    if (user._id.toString() !== user._id) {
      await db.collection("players").deleteMany({ ownerId: user._id.toString() });
    }

    const branchesDel = await db.collection("branches").deleteMany({ ownerId: user._id });
    if (user._id.toString() !== user._id) {
      await db.collection("branches").deleteMany({ ownerId: user._id.toString() });
    }

    const eventsDel = await db.collection("events").deleteMany({ ownerId: user._id });
    if (user._id.toString() !== user._id) {
      await db.collection("events").deleteMany({ ownerId: user._id.toString() });
    }

    let snapshotsDel = { deletedCount: 0 };
    try {
      snapshotsDel = await db.collection("cloud_snapshots").deleteMany({ ownerId: user._id });
      if (targetEmail) {
        await db.collection("cloud_snapshots").deleteMany({ userEmail: targetEmail });
      }
    } catch {}

    await db.collection("users").deleteOne({ _id: user._id });
    if (targetEmail) {
      await db.collection("users").deleteOne({ email: targetEmail });
    }

    // Record audit log
    await recordAuditLog({
      action: "delete_academy_permanent",
      targetAcademyId,
      targetAcademyName,
      adminEmail: adminCheck.admin.email,
      adminId: adminCheck.admin.id,
      details: {
        deletedEmail: targetEmail,
        deletedName: targetAcademyName,
        deletedPlayersCount: playersDel.deletedCount || 0,
        deletedBranchesCount: branchesDel.deletedCount || 0,
        deletedEventsCount: eventsDel.deletedCount || 0,
        deletedSnapshotsCount: snapshotsDel.deletedCount || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم حذف حساب أكاديمية "${targetAcademyName}" (${targetEmail}) وجميع لاعبيها (${playersDel.deletedCount || 0} لاعب) وصالاتها (${branchesDel.deletedCount || 0} صالة) وفعالياتها (${eventsDel.deletedCount || 0}) نهائياً من قاعدة البيانات بنجاح.`,
      deletedAcademyId: targetAcademyId,
      deletedSummary: {
        players: playersDel.deletedCount || 0,
        branches: branchesDel.deletedCount || 0,
        events: eventsDel.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error("DELETE /api/admin/academies/[id] failed:", error);
    return NextResponse.json(
      { error: "تعذر حذف الأكاديمية وبياناتها", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
