import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../../../backend/mongodb";
import { requireAdmin } from "../../../../../backend/admin-auth";
import { recordAuditLog } from "../../../../../backend/audit";
import {
  addCalendarPeriod,
  calculateDaysRemaining,
  isSubscriptionExpired,
  computeSubscriptionExpiry,
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
    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").trim().toLowerCase();
    const isUserAdmin = user.role === "admin" || (user.email && user.email.toLowerCase().trim() === adminEmail);

    const isExpired = isSubscriptionExpired(user, now);
    const isSuspended = user.status === "suspended" || user.subscriptionStatus === "suspended" || isExpired;

    let computedStatus = "active";
    if (isSuspended) computedStatus = isExpired ? "expired" : "suspended";

    const daysRemaining = calculateDaysRemaining(user.subscriptionExpiresAt, now);

    // Auto-sync in DB if expired but still marked active in DB
    if (isExpired && user.status === "active" && !isUserAdmin) {
      db.collection("users")
        .updateOne(
          { _id: user._id },
          {
            $set: {
              status: "suspended",
              subscriptionStatus: "expired",
              suspensionReason: "انتهت فترة اشتراك الحساب تلقائياً. يرجى تجديد أو سداد الاشتراك لاستئناف الخدمة.",
              updatedAt: now,
            },
          }
        )
        .catch(() => {});
      user.status = "suspended";
      user.subscriptionStatus = "expired";
      user.suspensionReason = "انتهت فترة اشتراك الحساب تلقائياً. يرجى تجديد أو سداد الاشتراك لاستئناف الخدمة.";
    }

    // Query real DB records belonging to this account
    const uOId = user._id;
    const uStrId = user._id.toString();

    const [allP, allB, allE, auditLogs] = await Promise.all([
      db.collection("players").find({}).toArray(),
      db.collection("branches").find({}).toArray(),
      db.collection("events").find({}).toArray(),
      db.collection("audit_logs")
        .find({ targetAcademyId: uStrId })
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray(),
    ]);

    const players = allP.filter(
      (p) => p.ownerId && (p.ownerId.toString() === uStrId || String(p.ownerId) === String(uOId))
    );
    const branches = allB.filter(
      (b) => b.ownerId && (b.ownerId.toString() === uStrId || String(b.ownerId) === String(uOId))
    );
    const events = allE.filter(
      (e) => e.ownerId && (e.ownerId.toString() === uStrId || String(e.ownerId) === String(uOId))
    );

    const subTotal = Number(user.subscriptionTotalAmount || 0);
    const subPaid = Number(user.subscriptionPaidAmount || 0);
    const subRemaining = Math.max(0, subTotal - subPaid);
    let subPaymentStatus = "unpaid";
    if (subTotal > 0) {
      if (subPaid >= subTotal) {
        subPaymentStatus = "paid";
      } else if (subPaid > 0) {
        subPaymentStatus = "partial";
      } else {
        subPaymentStatus = "unpaid";
      }
    } else if (user.subscriptionPaid !== false) {
      subPaymentStatus = "paid";
    }

    return NextResponse.json({
      success: true,
      captain: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        academyName: user.academyName || "CoachMaster",
        email: user.email,
        phone: user.phone || "",
        role: user.role || "user",
        isAdmin: isUserAdmin,
        status: user.status || "active",
        subscriptionStatus: computedStatus,
        subscriptionPlan: user.subscriptionPlan || "trial",
        subscriptionStartedAt: user.subscriptionStartedAt || user.createdAt,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        subscriptionPaid: user.subscriptionPaid !== false,
        subscriptionTotalAmount: subTotal,
        subscriptionPaidAmount: subPaid,
        subscriptionRemainingAmount: subRemaining,
        subscriptionPaymentStatus: subPaymentStatus,
        suspensionReason: user.suspensionReason || null,
        daysRemaining,
        createdAt: user.createdAt,
      },
      academy: {
        id: user._id.toString(),
        _id: user._id.toString(),
        name: user.name,
        academyName: user.academyName || "CoachMaster",
        email: user.email,
        phone: user.phone || "",
        role: user.role || "user",
        isAdmin: isUserAdmin,
        status: user.status || "active",
        subscriptionStatus: computedStatus,
        subscriptionPlan: user.subscriptionPlan || "trial",
        subscriptionStartedAt: user.subscriptionStartedAt || user.createdAt,
        subscriptionExpiresAt: user.subscriptionExpiresAt || null,
        subscriptionPaid: user.subscriptionPaid !== false,
        subscriptionTotalAmount: subTotal,
        subscriptionPaidAmount: subPaid,
        subscriptionRemainingAmount: subRemaining,
        subscriptionPaymentStatus: subPaymentStatus,
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

    // Guard: Prevent modifying admin accounts via captain management actions
    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();
    const isTargetAdmin =
      user.role === "admin" ||
      (user.email && user.email.toLowerCase().trim() === adminEmail) ||
      user._id.toString() === adminCheck.admin.id;

    if (isTargetAdmin) {
      return NextResponse.json(
        { error: "لا يمكن تعديل حالة أو اشتراك حسابات مسؤولي المنصة", code: "FORBIDDEN_ADMIN_MODIFICATION" },
        { status: 403 }
      );
    }

    const updateFields = {
      updatedAt: new Date(),
    };

    let auditAction = "";
    let auditDetails = {};
    let successMessage = "";

    const now = new Date();

    // 1. Suspend / Disable Captain
    if (action === "suspend" || action === "disable" || action === "suspend_academy") {
      const reason = (body.reason || "تم تعليق الحساب بقرار من إدارة المنصة").trim();
      updateFields.status = "suspended";
      updateFields.subscriptionStatus = "suspended";
      updateFields.suspensionReason = reason;

      auditAction = "suspend_academy";
      auditDetails = { reason };
      successMessage = `تم إيقاف حساب الكابتن "${user.name}" بنجاح.`;
    }

    // 2. Reactivate / Activate / Enable Captain
    else if (
      action === "activate" ||
      action === "reactivate" ||
      action === "enable" ||
      action === "reactivate_academy"
    ) {
      updateFields.status = "active";
      updateFields.subscriptionStatus = "active";
      updateFields.suspensionReason = null;

      const isPast = isSubscriptionExpired(user, now) || !user.subscriptionExpiresAt;
      if (isPast) {
        updateFields.subscriptionExpiresAt = addCalendarPeriod(now, 1, "months");
      }

      auditAction = "reactivate_academy";
      auditDetails = {
        restoredExpiresAt: updateFields.subscriptionExpiresAt || user.subscriptionExpiresAt,
      };
      successMessage = `تمت إعادة تفعيل وتشغيل حساب الكابتن "${user.name}" واستئناف الخدمة بنجاح.`;
    }

    // 3. Extend / Set Subscription Validity (Counts from Entry Date, Additive, or Lifetime)
    else if (action === "extend_subscription") {
      const isLifetimeAction = Boolean(body.isLifetime || body.plan === "lifetime" || body.mode === "lifetime" || body.calculationBase === "lifetime" || body.months >= 1200);
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
        updateFields.subscriptionPlan = "custom";
        updateFields.isLifetime = false;
      } else {
        const months = body.months ? parseInt(body.months, 10) : null;
        const days = body.days ? parseInt(body.days, 10) : null;

        if ((!months || months <= 0) && (!days || days <= 0)) {
          return NextResponse.json({ error: "مدة الاشتراك المحددة غير صالحة" }, { status: 400 });
        }

        const isUserCurrentlyLifetime =
          user.isLifetime === true ||
          user.subscriptionPlan === "lifetime" ||
          (user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt).getFullYear() > 2050);

        const currentExpiryToUse = isUserCurrentlyLifetime ? null : user.subscriptionExpiresAt;

        newExpiresAt = computeSubscriptionExpiry({
          entryDate,
          currentExpiry: currentExpiryToUse,
          mode,
          months,
          days,
          now,
        });

        updateFields.isLifetime = false;
        if (months === 1) updateFields.subscriptionPlan = "standard";
        else if (months === 3) updateFields.subscriptionPlan = "quarterly";
        else if (months === 6) updateFields.subscriptionPlan = "semi-annual";
        else if (months === 12) updateFields.subscriptionPlan = "annual";
        else updateFields.subscriptionPlan = "standard";
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
        subscriptionPlan: updateFields.subscriptionPlan,
        isLifetime: isLifetimeAction,
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
        ? `تم تفعيل وتأكيد اشتراك مدى الحياة ♾️ للكابتن "${user.name}" بنجاح.`
        : mode === "from_entry"
        ? `تم ضبط صلاحية اشتراك الكابتن "${user.name}" بنجاح حتى ${formattedDate} (محسوبة من تاريخ الدخول).`
        : `تم تمديد اشتراك الكابتن "${user.name}" بنجاح حتى ${formattedDate}.`;
    }

    // 4. Toggle or Set Payment Status (Auto-reactivates and auto-renews when paid)
    else if (action === "toggle_payment" || action === "set_payment_status") {
      let newPaid;
      if (action === "set_payment_status" && body.paid !== undefined) {
        newPaid = Boolean(body.paid);
      } else {
        const currentPaid = user.subscriptionPaid !== false;
        newPaid = !currentPaid;
      }
      updateFields.subscriptionPaid = newPaid;

      // Sync subscriptionPaidAmount with subscriptionTotalAmount
      const subTotal = Number(user.subscriptionTotalAmount || 0);
      if (subTotal > 0) {
        updateFields.subscriptionPaidAmount = newPaid ? subTotal : 0;
      }

      if (newPaid) {
        // Automatically reactivate and resume service
        updateFields.status = "active";
        updateFields.subscriptionStatus = "active";
        updateFields.suspensionReason = null;

        const isPast = isSubscriptionExpired(user, now) || !user.subscriptionExpiresAt;
        if (isPast) {
          // Auto-renew for 1 calendar month from today
          const renewedExpiry = addCalendarPeriod(now, 1, "months");
          updateFields.subscriptionExpiresAt = renewedExpiry;
          successMessage = `تم تأكيد سداد الاشتراك وتفعيل وتشغيل حساب الكابتن "${user.name}" تلقائياً حتى ${renewedExpiry.toISOString().slice(0, 10)}.`;
        } else {
          successMessage = `تم تأكيد سداد الاشتراك وتفعيل حساب الكابتن "${user.name}" بنجاح.`;
        }
      } else {
        successMessage = `تم تحديث حالة السداد للكابتن "${user.name}" إلى: غير مدفوع ✗.`;
      }

      auditAction = newPaid ? "mark_subscription_paid" : "mark_subscription_unpaid";
      auditDetails = { paid: newPaid, autoReactivated: newPaid };
    }

    // 4b. Update Subscription Financials (المبلغ المطلوب، المبلغ المدفوع، وحساب المتبقي تلقائياً)
    else if (action === "update_subscription_payment" || action === "set_subscription_financials") {
      const rawTotal = body.totalAmount !== undefined ? body.totalAmount : body.subscriptionTotalAmount;
      const rawPaid = body.paidAmount !== undefined ? body.paidAmount : body.subscriptionPaidAmount;

      const totalAmount = Math.max(0, Number(rawTotal) || 0);
      const paidAmount = Math.max(0, Number(rawPaid) || 0);
      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      const isFullyPaid = totalAmount > 0 ? paidAmount >= totalAmount : user.subscriptionPaid !== false;

      updateFields.subscriptionTotalAmount = totalAmount;
      updateFields.subscriptionPaidAmount = paidAmount;
      updateFields.subscriptionPaid = isFullyPaid;

      auditAction = "update_subscription_payment";
      auditDetails = {
        totalAmount,
        paidAmount,
        remainingAmount,
        isFullyPaid,
      };

      if (remainingAmount > 0) {
        successMessage = `تم تحديث الرسوم المالية لاشتراك الكابتن "${user.name}": المطلوب (${totalAmount} ج.م) - المدفوع (${paidAmount} ج.م) - المتبقي عليه (${remainingAmount} ج.م).`;
      } else if (totalAmount > 0) {
        successMessage = `تم تأكيد سداد كامل رسوم اشتراك الكابتن "${user.name}" بنجاح (${totalAmount} ج.م) ✓.`;
      } else {
        successMessage = `تم حفظ بيانات رسوم اشتراك الكابتن "${user.name}" بنجاح.`;
      }
    }

    // 5. Update Subscription Plan
    else if (action === "update_plan") {
      const plan = (body.plan || "standard").trim();
      updateFields.subscriptionPlan = plan;

      auditAction = "update_subscription_plan";
      auditDetails = { newPlan: plan, oldPlan: user.subscriptionPlan };
      successMessage = `تم تحديث خطة الاشتراك إلى: ${plan}.`;
    }

    // 6. Reset Captain Password by Administrator
    else if (action === "reset_password" || action === "change_password") {
      const newPassword = typeof body.password === "string" ? body.password.trim() : "";
      if (!newPassword || newPassword.length < 8) {
        return NextResponse.json(
          { error: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" },
          { status: 400 }
        );
      }
      const bcrypt = (await import("bcryptjs")).default;
      updateFields.passwordHash = await bcrypt.hash(newPassword, 12);
      updateFields.resetCode = null;
      updateFields.resetToken = null;
      updateFields.resetExpiresAt = null;

      auditAction = "admin_reset_captain_password";
      auditDetails = {
        captainName: user.name,
        captainEmail: user.email,
        resetByAdmin: adminCheck.admin.email,
      };
      successMessage = `تم تعيين كلمة المرور الجديدة للكابتن "${user.name}" بنجاح.`;
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
    let user = await db.collection("users").findOne({ _id: queryId });
    if (!user && typeof id === "string") {
      user = await db.collection("users").findOne({ _id: id });
    }
    if (!user && typeof id === "string") {
      user = await db.collection("users").findOne({ email: id.toLowerCase().trim() });
    }

    if (!user) {
      return NextResponse.json(
        { error: "حساب الكابتن غير موجود في قاعدة البيانات", code: "NOT_FOUND" },
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
    const targetCaptainName = user.name || user.academyName || "الكابتن";
    const targetEmail = user.email || "";

    // 1. Cascading deletion: Players
    const playersDel = await db.collection("players").deleteMany({ ownerId: user._id });
    if (user._id.toString() !== user._id) {
      await db.collection("players").deleteMany({ ownerId: user._id.toString() });
    }

    // 2. Cascading deletion: Branches / Halls
    const branchesDel = await db.collection("branches").deleteMany({ ownerId: user._id });
    if (user._id.toString() !== user._id) {
      await db.collection("branches").deleteMany({ ownerId: user._id.toString() });
    }

    // 3. Cascading deletion: Events
    const eventsDel = await db.collection("events").deleteMany({ ownerId: user._id });
    if (user._id.toString() !== user._id) {
      await db.collection("events").deleteMany({ ownerId: user._id.toString() });
    }

    // 4. Cascading deletion: Cloud snapshots
    let snapshotsDel = { deletedCount: 0 };
    try {
      snapshotsDel = await db.collection("cloud_snapshots").deleteMany({ ownerId: user._id });
      if (targetEmail) {
        await db.collection("cloud_snapshots").deleteMany({ userEmail: targetEmail });
      }
    } catch {}

    // 5. Delete User Authentication Account
    await db.collection("users").deleteOne({ _id: user._id });
    if (targetEmail) {
      await db.collection("users").deleteOne({ email: targetEmail });
    }

    // 6. Record Audit Log
    await recordAuditLog({
      action: "delete_captain_permanent",
      targetAcademyId,
      targetAcademyName: targetCaptainName,
      adminEmail: adminCheck.admin.email,
      adminId: adminCheck.admin.id,
      details: {
        deletedEmail: targetEmail,
        deletedName: targetCaptainName,
        deletedPlayersCount: playersDel.deletedCount || 0,
        deletedBranchesCount: branchesDel.deletedCount || 0,
        deletedEventsCount: eventsDel.deletedCount || 0,
        deletedSnapshotsCount: snapshotsDel.deletedCount || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: `تم حذف حساب الكابتن "${targetCaptainName}" (${targetEmail}) وجميع لاعبيه (${playersDel.deletedCount || 0} لاعب) وصالاته (${branchesDel.deletedCount || 0} صالة) وفعالياته (${eventsDel.deletedCount || 0}) نهائياً من قاعدة البيانات بنجاح.`,
      deletedCaptainId: targetAcademyId,
      deletedSummary: {
        players: playersDel.deletedCount || 0,
        branches: branchesDel.deletedCount || 0,
        events: eventsDel.deletedCount || 0,
      },
    });
  } catch (error) {
    console.error("DELETE /api/admin/captains/[id] failed:", error);
    return NextResponse.json(
      { error: "تعذر حذف الكابتن وبياناته", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
