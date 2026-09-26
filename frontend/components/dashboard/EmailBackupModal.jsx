"use client";
import { useState, useEffect } from "react";
import {
  Mail,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Settings,
  HelpCircle,
  X,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";

export default function EmailBackupModal({ isOpen, onClose, showToast, userEmail }) {
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [status, setStatus] = useState(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [actionError, setActionError] = useState("");

  // Form states
  const [gmailUser, setGmailUser] = useState(userEmail || "");
  const [gmailAppPassword, setGmailAppPassword] = useState("");
  const [recipientEmail, setRecipientEmail] = useState(userEmail || "");
  const [autoDailyBackup, setAutoDailyBackup] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/backup/email");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.gmailUser && !gmailUser) setGmailUser(data.gmailUser);
        else if (userEmail && !gmailUser) setGmailUser(userEmail);
        if (data.recipientEmail && !recipientEmail) setRecipientEmail(data.recipientEmail);
        else if (userEmail && !recipientEmail) setRecipientEmail(userEmail);
        if (data.autoDailyBackup !== undefined) setAutoDailyBackup(data.autoDailyBackup);
      }
    } catch (err) {
      console.error("Failed to load email backup status:", err);
    } finally {
      setLoadingStatus(false);
    }
  }

  async function handleSaveSettings(e) {
    if (e) e.preventDefault();
    setActionError("");

    if (!gmailUser.trim() || !gmailUser.includes("@")) {
      showToast("يرجى كتابة بريد Gmail بشكل صحيح", "error");
      return;
    }

    const cleanPass = gmailAppPassword.replace(/\s+/g, "");
    if (!cleanPass) {
      showToast("يرجى إدخال كلمة مرور التطبيقات (App Password) المكونة من 16 حرفاً", "error");
      return;
    }

    if (cleanPass.length !== 16) {
      setActionError("تنبيه: كلمة مرور تطبيقات جوجل (App Password) تتكون دائماً من 16 حرفاً إنجليزياً (وليس كلمة مرور الحساب العادية). اضغط على 'كيف تستخرج كلمة مرور التطبيقات' بالأعلى للمساعدة.");
    }

    setSavingSettings(true);
    try {
      const res = await fetch("/api/backup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_settings",
          gmailUser,
          gmailAppPassword,
          recipientEmail: recipientEmail || gmailUser,
          autoDailyBackup,
        }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setActionError(result.details || result.error || "تعذر حفظ الإعدادات");
        showToast(result.error || "تعذر حفظ الإعدادات", "error");
        return;
      }

      showToast("✓ تم حفظ إعدادات البريد بنجاح!");
      fetchStatus();
    } catch {
      setActionError("حدث خطأ أثناء الاتصال بالخادم لحفظ الإعدادات");
      showToast("حدث خطأ أثناء الاتصال بالخادم", "error");
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleSendNow() {
    setActionError("");
    setSendingEmail(true);
    try {
      const res = await fetch("/api/backup/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_now" }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorText = result.details || result.error || "تعذر إرسال النسخة إلى Gmail";
        setActionError(errorText);
        showToast(result.error || "تعذر إرسال النسخة إلى Gmail", "error");
        setShowHowTo(true);
        return;
      }

      showToast("✓ " + (result.message || "تم إرسال النسخة الاحتياطية بنجاح إلى Gmail!"));
      setActionError("");
      fetchStatus();
    } catch {
      setActionError("تعذر الاتصال بخدمة البريد في السيرفر");
      showToast("تعذر الاتصال بخدمة البريد", "error");
    } finally {
      setSendingEmail(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs animate-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 border border-red-200 text-red-600 shadow-2xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-cairo text-base font-black text-slate-900">
                النسخ الاحتياطي السحابي عبر Gmail
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                حفظ بيانات الأكاديمية يومياً تلقائياً على بريدك
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Error Alert Banner */}
        {actionError && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs space-y-2.5 animate-fade-in text-right">
            <div className="flex items-start gap-2 text-rose-900 font-black">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
            <p className="text-[11px] text-rose-800 leading-relaxed font-semibold">
              جوجل تمنع استخدام كلمة مرور الحساب العادية لحماية بياناتك. اضغط على الزر أدناه لإنشاء كلمة مرور تطبيقات (16 حرفاً) واستخدامها بدلاً منها:
            </p>
            <div>
              <a
                href="https://myaccount.google.com/apppasswords"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-[11px] shadow-xs transition"
              >
                <span>فتح صفحة كلمات مرور التطبيقات في Google</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        )}

        {/* Status Card */}
        {loadingStatus ? (
          <div className="py-6 text-center text-xs font-bold text-slate-400">
            جاري فحص حالة بريد النسخ الاحتياطي...
          </div>
        ) : status?.configured ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                <span className="font-cairo text-xs font-black text-emerald-900">
                  النسخ الاحتياطي اليومي عبر Gmail مُفعّل ومؤمن
                </span>
              </div>
              <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                تلقائي يومياً
              </span>
            </div>

            <div className="text-xs font-semibold text-emerald-800 space-y-1">
              <div>
                📧 المستلم: <strong className="font-black text-emerald-950">{status.recipientEmail}</strong>
              </div>
              {status.lastSentDate ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700">
                  <Clock className="h-3.5 w-3.5" />
                  <span>آخر نسخة مرسلة بنجاح: {status.lastSentDate} (تضم {status.playersCount || 0} لاعب)</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-700">
                  لم يتم إرسال أول نسخة بعد اليوم.
                </div>
              )}
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={handleSendNow}
                disabled={sendingEmail}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs active:scale-98 transition cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{sendingEmail ? "جار الإرسال إلى Gmail..." : "إرسال نسخة احتياطية الآن إلى Gmail"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs font-semibold text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-black text-blue-950 font-cairo">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span>احمِ بياناتك تلقائياً دون أي تدخل منك</span>
            </div>
            <p className="leading-relaxed text-blue-800">
              قم بضبط حساب Gmail الخاص بك ليرسل النظام كل يوم نسخة احتياطية مشفرة بملف JSON إلى بريدك تلقائياً. حتى لو تعطل الجهاز، يمكنك استرجاع كافة اللاعبين والاشتراكات من بريدك في ثوانٍ.
            </p>
          </div>
        )}

        {/* Configuration Form */}
        <form onSubmit={handleSaveSettings} className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5 text-slate-500" />
              {status?.configured ? "تعديل إعدادات البريد" : "إعداد حساب Gmail"}
            </span>
            <button
              type="button"
              onClick={() => setShowHowTo(!showHowTo)}
              className="flex items-center gap-1 text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>كيف تستخرج كلمة مرور التطبيقات؟</span>
            </button>
          </div>

          {/* Guide Dropdown */}
          {showHowTo && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900 space-y-2 animate-fade-in">
              <div className="font-black text-amber-950">
                📌 خطوات استخراج كلمة مرور التطبيقات (App Password) من جوجل:
              </div>
              <ol className="list-decimal pr-4 space-y-1 text-[11px] leading-relaxed">
                <li>
                  تأكد من تفعيل <strong>التحقق بخطوتين (2-Step Verification)</strong> في حسابك على Google.
                </li>
                <li>
                  افتح الرابط المباشر:{" "}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-blue-700 underline inline-flex items-center gap-0.5"
                  >
                    myaccount.google.com/apppasswords <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>في خانة اسم التطبيق اكتب: <strong>Re_action DOJO</strong> واضغط على <strong>إنشاء (Create)</strong>.</li>
                <li>سيظهر لك كود أصفر مكون من <strong>16 حرفاً</strong>، انسخه وضعه في الخانة بالأسفل.</li>
              </ol>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                حسابك على Gmail
              </label>
              <input
                type="email"
                placeholder="example@gmail.com"
                value={gmailUser}
                onChange={(e) => setGmailUser(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
                <span>كلمة مرور التطبيقات (Google App Password)</span>
                <span className="text-[10px] text-slate-400 font-normal">16 حرفاً مشفرة</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="abcd efgh ijkl mnop"
                  value={gmailAppPassword}
                  onChange={(e) => setGmailAppPassword(e.target.value)}
                  className="w-full h-10 px-3 pr-8 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white tracking-widest"
                  dir="ltr"
                />
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                البريد المستلم للنسخ الاحتياطية (افتراضياً نفس حسابك)
              </label>
              <input
                type="email"
                placeholder="mg0447837@gmail.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white"
                dir="ltr"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={autoDailyBackup}
                onChange={(e) => setAutoDailyBackup(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
              <span className="text-xs font-extrabold text-slate-700">
                إرسال نسخة احتياطية يومياً تلقائياً عند فتح النظام
              </span>
            </label>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs active:scale-98 transition cursor-pointer"
            >
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>{savingSettings ? "جار الحفظ..." : "حفظ إعدادات البريد"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold active:scale-98 transition cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </form>

        {/* How to restore instructions */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1.5 text-xs text-slate-700">
          <div className="font-black text-slate-900 flex items-center gap-1.5">
            <span>🔄 كيف تسترجع النسخة من الجيميل في أي وقت؟</span>
          </div>
          <ol className="list-decimal pr-4 space-y-1 text-[11px] text-slate-600 leading-relaxed">
            <li>افتح رسالة الـ Gmail على هاتفك أو الكمبيوتر.</li>
            <li>اضغط على تنزيل الملف المرفق (<code className="text-red-600">.json</code>).</li>
            <li>اضغط على زر <strong>«استعادة نسخة»</strong> في التطبيق واختر الملف، وسيتم استرجاع كل شيء فوراً.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
