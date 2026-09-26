import fs from "fs";
import path from "path";
import clientPromise from "./mongodb";

let _cachedNodemailer = null;
async function getNodemailer() {
  if (!_cachedNodemailer) {
    const mod = await import("nodemailer");
    _cachedNodemailer = mod.default || mod;
  }
  return _cachedNodemailer;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const SETTINGS_FILE = path.join(DATA_DIR, "email_backup_settings.json");
const STATUS_FILE = path.join(DATA_DIR, "last_email_backup.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getEmailBackupSettings() {
  ensureDataDir();
  let fileSettings = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      fileSettings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")) || {};
    } catch {}
  }

  const gmailUser = fileSettings.gmailUser || process.env.GMAIL_USER || "";
  const gmailAppPassword = fileSettings.gmailAppPassword || process.env.GMAIL_APP_PASSWORD || "";
  const recipientEmail = fileSettings.recipientEmail || process.env.BACKUP_RECIPIENT_EMAIL || gmailUser || "";
  const autoDailyBackup = fileSettings.autoDailyBackup !== undefined ? Boolean(fileSettings.autoDailyBackup) : true;

  return {
    gmailUser,
    gmailAppPassword,
    recipientEmail,
    autoDailyBackup,
    isConfigured: Boolean(gmailUser && gmailAppPassword),
  };
}

export function saveEmailBackupSettings(newSettings = {}) {
  ensureDataDir();
  const current = getEmailBackupSettings();
  const updated = {
    gmailUser: (newSettings.gmailUser !== undefined ? newSettings.gmailUser : current.gmailUser).trim(),
    gmailAppPassword: (newSettings.gmailAppPassword !== undefined ? newSettings.gmailAppPassword : current.gmailAppPassword).replace(/\s+/g, ""),
    recipientEmail: (newSettings.recipientEmail !== undefined ? newSettings.recipientEmail : current.recipientEmail).trim(),
    autoDailyBackup: newSettings.autoDailyBackup !== undefined ? Boolean(newSettings.autoDailyBackup) : current.autoDailyBackup,
  };

  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");

  // Reset auth failure marker so new settings can be tested
  try {
    const currentStatus = getLastEmailBackupStatus();
    delete currentStatus.lastAuthFailedDate;
    fs.writeFileSync(STATUS_FILE, JSON.stringify(currentStatus, null, 2), "utf-8");
  } catch {}

  return {
    ...updated,
    isConfigured: Boolean(updated.gmailUser && updated.gmailAppPassword),
  };
}

export function getLastEmailBackupStatus() {
  ensureDataDir();
  if (fs.existsSync(STATUS_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATUS_FILE, "utf-8")) || {};
    } catch {}
  }
  return { lastSentDate: null, lastSentTime: null };
}

function recordLastEmailBackup(details) {
  ensureDataDir();
  try {
    const prev = getLastEmailBackupStatus();
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ ...prev, ...details }, null, 2), "utf-8");
  } catch {}
}

export async function generateBackupPayload(ownerId) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const [players, branches, events] = await Promise.all([
    db.collection("players").find({ ownerId }).toArray(),
    db.collection("branches").find({ ownerId }).toArray(),
    db.collection("events").find({ ownerId }).toArray(),
  ]);

  return {
    system: "Re_action DOJO",
    version: "1.0",
    type: "full_database_backup",
    exportedAt: new Date().toISOString(),
    ownerId,
    stats: {
      playersCount: players.length,
      branchesCount: branches.length,
      eventsCount: events.length,
    },
    data: {
      branches,
      players,
      events,
    },
  };
}

export async function sendBackupToEmail({ ownerId, recipientEmailOverride = null, isAutomatic = false }) {
  const settings = getEmailBackupSettings();

  if (!settings.isConfigured) {
    throw new Error(
      "لم يتم ضبط إعدادات الجيميل بعد. يرجى إدخال حساب Gmail وكلمة مرور التطبيقات (App Password) المكونة من 16 حرفاً."
    );
  }

  const recipient = (recipientEmailOverride || settings.recipientEmail || settings.gmailUser).trim();
  if (!recipient || !recipient.includes("@")) {
    throw new Error("يرجى تحديد بريد إلكتروني صحيح لاستلام النسخة الاحتياطية.");
  }

  const backupPayload = await generateBackupPayload(ownerId);
  const jsonContent = JSON.stringify(backupPayload, null, 2);

  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
  }).format(new Date()); // YYYY-MM-DD

  const arabicDate = new Intl.DateTimeFormat("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const filename = `reaction_dojo_backup_${todayStr}.json`;

  // Always save a local copy to cloud_backups directory for instant 1-click restore
  try {
    const cloudDir = path.join(DATA_DIR, "cloud_backups");
    if (!fs.existsSync(cloudDir)) fs.mkdirSync(cloudDir, { recursive: true });
    fs.writeFileSync(path.join(cloudDir, filename), jsonContent, "utf-8");
  } catch (cloudErr) {
    console.warn("Could not save copy to cloud_backups:", cloudErr?.message);
  }

  const nm = await getNodemailer();
  const transporter = nm.createTransport({
    service: "gmail",
    auth: {
      user: settings.gmailUser,
      pass: settings.gmailAppPassword,
    },
  });

  const subject = isAutomatic
    ? `🛡️ [نسخ احتياطي تلقائي] أكاديمية Re_action DOJO - ${todayStr}`
    : `🛡️ [نسخة احتياطية] أكاديمية Re_action DOJO - ${todayStr}`;

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; direction: rtl; }
        .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 30px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #e2e8f0; }
        .header { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 25px; }
        .badge { background: #fee2e2; color: #dc2626; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: bold; }
        .title { font-size: 22px; font-weight: 900; margin: 10px 0 5px 0; color: #0f172a; }
        .stats-grid { display: flex; gap: 10px; margin: 20px 0; }
        .stat-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 15px; text-align: center; }
        .stat-num { font-size: 24px; font-weight: 900; color: #dc2626; }
        .stat-label { font-size: 11px; font-weight: bold; color: #64748b; margin-top: 4px; }
        .instructions { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px; padding: 20px; margin: 25px 0; }
        .instructions h3 { margin: 0 0 10px 0; color: #166534; font-size: 15px; }
        .instructions ol { margin: 0; padding-right: 20px; color: #15803d; font-size: 13px; line-height: 1.8; }
        .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 25px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <span class="badge">Re_action DOJO Cloud Backup</span>
          <h1 class="title">نسخة احتياطية لقاعدة بيانات الأكاديمية</h1>
          <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">📅 ${arabicDate} (توقيت القاهرة)</p>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">
          مرحباً يا كابتن، مرفق مع هذه الرسالة ملف النسخة الاحتياطية الشاملة لكافة بيانات الأكاديمية حتى اللحظة.
        </p>

        <div class="stats-grid">
          <div class="stat-box">
            <div class="stat-num">${backupPayload.stats.playersCount}</div>
            <div class="stat-label">إجمالي اللاعبين</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${backupPayload.stats.branchesCount}</div>
            <div class="stat-label">الصالات</div>
          </div>
          <div class="stat-box">
            <div class="stat-num">${backupPayload.stats.eventsCount}</div>
            <div class="stat-label">الفعاليات</div>
          </div>
        </div>

        <div class="instructions">
          <h3>🔄 كيف تسترجع هذه النسخة من الجيميل في أي وقت؟</h3>
          <ol>
            <li>قم بتنزيل الملف المرفق أدناه (<strong>${filename}</strong>) إلى هاتفك أو جهازك.</li>
            <li>افتح موقع أو تطبيق الأكاديمية واضغط على زر <strong>"استعادة نسخة"</strong> في الصفحة الرئيسية.</li>
            <li>اختر الملف الذي قمت بتنزيله واضغط موافق، وسيتم فوراً استرجاع جميع اللاعبين والبيانات إلى النظام كما كانت!</li>
          </ol>
        </div>

        <div class="footer">
          <p>تم إنشاء هذه الرسالة تلقائياً بواسطة نظام <strong>Re_action DOJO</strong> لحماية بياناتك من الضياع للأبد.</p>
          <p>تطوير: محمد غانم | 01552488179</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const info = await transporter.sendMail({
    from: `"Re_action DOJO" <${settings.gmailUser}>`,
    to: recipient,
    subject,
    html,
    attachments: [
      {
        filename,
        content: jsonContent,
        contentType: "application/json",
      },
    ],
  });

  const record = {
    lastSentDate: todayStr,
    lastSentTime: new Date().toISOString(),
    recipient,
    messageId: info.messageId,
    playersCount: backupPayload.stats.playersCount,
    isAutomatic,
  };

  recordLastEmailBackup(record);
  return record;
}

export async function checkAndRunDailyEmailBackup(ownerId) {
  try {
    const settings = getEmailBackupSettings();
    if (!settings.isConfigured || !settings.autoDailyBackup) {
      return { skipped: true, reason: "not_configured_or_disabled" };
    }

    const status = getLastEmailBackupStatus();
    const todayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
    }).format(new Date());

    if (status.lastSentDate === todayStr) {
      return { skipped: true, reason: "already_sent_today", lastSentTime: status.lastSentTime };
    }

    if (status.lastAuthFailedDate === todayStr) {
      return { skipped: true, reason: "auth_failed_today_waiting_for_user_update" };
    }

    console.log(`[AutoBackup] Starting daily Gmail backup for owner ${ownerId} on ${todayStr}...`);
    const result = await sendBackupToEmail({ ownerId, isAutomatic: true });
    console.log(`[AutoBackup] Daily Gmail backup sent successfully to ${result.recipient}`);
    return { success: true, result };
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error("[AutoBackup] Daily Gmail backup error:", errMsg);
    if (error?.code === "EAUTH" || errMsg.includes("535") || errMsg.includes("BadCredentials")) {
      const todayStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(new Date());
      recordLastEmailBackup({ lastAuthFailedDate: todayStr });
    }
    return { success: false, error: errMsg };
  }
}
