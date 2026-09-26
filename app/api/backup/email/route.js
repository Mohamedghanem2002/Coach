import { NextResponse } from "next/server";
import { currentUserId } from "../../../../backend/tenant";
import {
  getEmailBackupSettings,
  saveEmailBackupSettings,
  getLastEmailBackupStatus,
  sendBackupToEmail,
  checkAndRunDailyEmailBackup,
} from "../../../../backend/emailBackup";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const settings = getEmailBackupSettings();
    const lastStatus = getLastEmailBackupStatus();

    // Trigger daily auto-backup check silently if configured
    let autoRunResult = null;
    if (settings.isConfigured && settings.autoDailyBackup) {
      // Run non-blocking
      checkAndRunDailyEmailBackup(ownerId).catch((err) => {
        console.error("Auto daily backup error:", err);
      });
    }

    return NextResponse.json({
      configured: settings.isConfigured,
      gmailUser: settings.gmailUser || "",
      recipientEmail: settings.recipientEmail || settings.gmailUser || "",
      autoDailyBackup: settings.autoDailyBackup,
      lastSentDate: lastStatus.lastSentDate || null,
      lastSentTime: lastStatus.lastSentTime || null,
      playersCount: lastStatus.playersCount || null,
    });
  } catch (error) {
    console.error("GET /api/backup/email error:", error);
    return NextResponse.json(
      { error: "تعذر جلب حالة النسخ الاحتياطي عبر البريد", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await request.json();
    const action = body?.action || "send_now";

    if (action === "save_settings") {
      const updated = saveEmailBackupSettings({
        gmailUser: body.gmailUser,
        gmailAppPassword: body.gmailAppPassword,
        recipientEmail: body.recipientEmail,
        autoDailyBackup: body.autoDailyBackup,
      });

      return NextResponse.json({
        success: true,
        message: "تم حفظ إعدادات البريد بنجاح",
        configured: updated.isConfigured,
        recipientEmail: updated.recipientEmail,
        autoDailyBackup: updated.autoDailyBackup,
      });
    }

    if (action === "send_now") {
      const result = await sendBackupToEmail({
        ownerId,
        recipientEmailOverride: body?.recipientEmail || null,
        isAutomatic: false,
      });

      return NextResponse.json({
        success: true,
        message: `تم إرسال النسخة الاحتياطية بنجاح إلى: ${result.recipient}`,
        details: result,
      });
    }

    return NextResponse.json({ error: "إجراء غير معروف" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/backup/email error:", error?.message || error);
    const errMsg = error?.message || String(error);
    const isAuthError =
      error?.code === "EAUTH" ||
      errMsg.includes("535") ||
      errMsg.includes("BadCredentials") ||
      errMsg.includes("Username and Password not accepted");

    if (isAuthError) {
      return NextResponse.json(
        {
          error: "كلمة مرور Gmail غير مقبولة",
          details:
            "جوجل ترفض كلمة مرور حسابك العادية لأسباب أمان. يجب توليد واستخدام (كلمة مرور التطبيقات - App Password) المكونة من 16 حرفاً من إعدادات حساب جوجل.",
          isAuthError: true,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "تعذر إرسال النسخة الاحتياطية إلى Gmail",
        details: errMsg,
      },
      { status: 500 }
    );
  }
}
