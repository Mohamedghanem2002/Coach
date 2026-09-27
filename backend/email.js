import { getEmailBackupSettings } from "./emailBackup";

let _cachedNodemailer = null;
async function getNodemailer() {
  if (!_cachedNodemailer) {
    const mod = await import("nodemailer");
    _cachedNodemailer = mod.default || mod;
  }
  return _cachedNodemailer;
}

/**
 * Creates a transporter using either generic SMTP environment variables
 * or existing Gmail credentials from settings / env.
 */
async function createTransporter() {
  const nm = await getNodemailer();

  // 1. Generic SMTP configuration via environment variables
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return {
      transporter: nm.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      }),
      fromEmail: process.env.SMTP_FROM || process.env.SMTP_USER,
    };
  }

  // 2. Gmail fallback via backup settings or GMAIL_* env vars
  const backupSettings = getEmailBackupSettings();
  const gmailUser = process.env.GMAIL_USER || backupSettings.gmailUser;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || backupSettings.gmailAppPassword;

  if (gmailUser && gmailPass) {
    return {
      transporter: nm.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      }),
      fromEmail: gmailUser,
    };
  }

  return null;
}

/**
 * Sends an email notification to the administrator when a new academy registers.
 * Designed to be non-blocking and safe: failures are logged and returned as `{ success: false }`
 * without throwing errors to the registration transaction.
 */
export async function sendAdminRegistrationNotification({
  academyName,
  ownerName,
  email,
  phone = "",
  registeredAt = new Date(),
}) {
  const adminEmail = (process.env.ADMIN_NOTIFICATION_EMAIL || process.env.ADMIN_EMAIL || "mg0447837@gmail.com").trim();

  try {
    const transportInfo = await createTransporter();
    if (!transportInfo) {
      console.log("[Email Notification] SMTP not configured. Registration notification logged for admin:", {
        adminEmail,
        academyName,
        ownerName,
        email,
        registeredAt,
      });
      return { success: true, simulated: true };
    }

    const { transporter, fromEmail } = transportInfo;

    const dateFormatted = new Intl.DateTimeFormat("ar-EG", {
      timeZone: "Africa/Cairo",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(registeredAt);

    const subject = `🥋 تسجيل أكاديمية جديدة: ${academyName}`;

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; direction: rtl; }
          .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 30px; box-shadow: 0 4px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px; }
          .badge { background: #fee2e2; color: #dc2626; padding: 5px 14px; border-radius: 999px; font-size: 13px; font-weight: bold; }
          .title { font-size: 22px; font-weight: 900; margin: 12px 0 5px 0; color: #0f172a; }
          .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          .info-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
          .info-label { font-weight: bold; color: #64748b; width: 35%; }
          .info-value { font-weight: 800; color: #0f172a; }
          .highlight { background: #f0fdf4; color: #15803d; padding: 3px 8px; border-radius: 6px; font-weight: bold; }
          .btn-container { text-align: center; margin: 30px 0 10px 0; }
          .btn { background: #dc2626; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; display: inline-block; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 25px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">إشعار نظام إدارة الأكاديميات</span>
            <h1 class="title">تم تسجيل أكاديمية جديدة بالمنصة! 🎉</h1>
            <p style="color: #64748b; font-size: 13px; margin-top: 6px;">📅 ${dateFormatted} (توقيت القاهرة)</p>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            مرحباً بالمدير العام، قام كابتن / مالك أكاديمية جديد بإنشاء حساب على منصة الأكاديميات:
          </p>

          <table class="info-table">
            <tr>
              <td class="info-label">اسم الأكاديمية:</td>
              <td class="info-value"><span class="highlight">${academyName}</span></td>
            </tr>
            <tr>
              <td class="info-label">اسم المالك / الكابتن:</td>
              <td class="info-value">${ownerName}</td>
            </tr>
            <tr>
              <td class="info-label">البريد الإلكتروني:</td>
              <td class="info-value" dir="ltr" style="text-align: right;">${email}</td>
            </tr>
            ${phone ? `
            <tr>
              <td class="info-label">رقم الهاتف:</td>
              <td class="info-value" dir="ltr" style="text-align: right;">${phone}</td>
            </tr>` : ""}
            <tr>
              <td class="info-label">فترة الاشتراك المبدئية:</td>
              <td class="info-value">30 يوماً تجريبي (نشط)</td>
            </tr>
            <tr>
              <td class="info-label">تاريخ التسجيل:</td>
              <td class="info-value">${dateFormatted}</td>
            </tr>
          </table>

          <div class="btn-container">
            <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/admin" class="btn">
              فتح لوحة تحكم الإدارة 🚀
            </a>
          </div>

          <div class="footer">
            <p>تم إرسال هذا الإشعار تلقائياً إلى بريدك المعتمد: <strong>${adminEmail}</strong></p>
            <p>نظام إدارة المنصة الموحد &copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: `"لوحة تحكم المنصة" <${fromEmail}>`,
      to: adminEmail,
      subject,
      html,
    });

    console.log(`[Email Notification] Admin registration email sent successfully to ${adminEmail}, messageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email Notification] Failed to send admin notification (handled safely):", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}
