"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  ShieldCheck,
  KeyRound,
  BadgeCheck,
  Sparkles,
} from "lucide-react";

export default function AccountSettingsModal({
  isOpen,
  onClose,
  onUserUpdated,
  showToast,
}) {
  const { data: session, update: updateSession } = useSession();

  const [name, setName] = useState(session?.user?.name || "");
  const [academyName, setAcademyName] = useState(
    session?.user?.academyName || "Re_action DOJO"
  );
  const [email, setEmail] = useState(session?.user?.email || "");

  // Native tab: "profile" | "security"
  const [activeTab, setActiveTab] = useState("profile");

  // Security / Password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleClose = () => {
    setNotice(null);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setActiveTab("profile");
    onClose();
  };

  // Fetch current account info when modal opens
  useEffect(() => {
    if (!isOpen) return undefined;

    let isMounted = true;

    async function loadAccount() {
      try {
        setFetching(true);
        const res = await fetch("/api/account");
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.user) {
            setName(data.user.name || "");
            setAcademyName(data.user.academyName || "Re_action DOJO");
            setEmail(data.user.email || "");
          }
        }
      } catch (err) {
        console.error("Failed to fetch account info:", err);
      } finally {
        if (isMounted) setFetching(false);
      }
    }

    loadAccount();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setNotice(null);

    const trimmedName = name.trim();
    const trimmedAcademy = academyName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      setNotice({ type: "error", message: "يرجى كتابة اسم الكابتن / المدرب" });
      setActiveTab("profile");
      return;
    }

    if (!trimmedAcademy) {
      setNotice({ type: "error", message: "يرجى كتابة اسم الأكاديمية أو النادي" });
      setActiveTab("profile");
      return;
    }

    if (!trimmedEmail) {
      setNotice({ type: "error", message: "يرجى إدخال بريد إلكتروني صالح" });
      setActiveTab("profile");
      return;
    }

    if (newPassword || currentPassword || confirmNewPassword) {
      if (!currentPassword) {
        setNotice({
          type: "error",
          message: "يرجى إدخال كلمة المرور الحالية لتأكيد التغيير",
        });
        setActiveTab("security");
        return;
      }
      if (newPassword.length < 8) {
        setNotice({
          type: "error",
          message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
        });
        setActiveTab("security");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setNotice({
          type: "error",
          message: "كلمتا المرور الجديدتان غير متطابقتين",
        });
        setActiveTab("security");
        return;
      }
      if (newPassword.toLowerCase() === trimmedEmail.toLowerCase()) {
        setNotice({
          type: "error",
          message: "لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني",
        });
        setActiveTab("security");
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: trimmedName,
        academyName: trimmedAcademy,
        email: trimmedEmail,
      };

      if (newPassword && currentPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
        payload.confirmNewPassword = confirmNewPassword;
      }

      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setNotice({
          type: "error",
          message: result.error || "حدث خطأ أثناء حفظ التعديلات",
        });
        return;
      }

      // Update NextAuth session in-memory
      await updateSession({
        name: trimmedName,
        academyName: trimmedAcademy,
        email: trimmedEmail,
      });

      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");

      setNotice({
        type: "success",
        message: "تم حفظ بيانات الحساب والأكاديمية بنجاح! ✨",
      });

      if (onUserUpdated) {
        onUserUpdated(result.user);
      }

      if (showToast) {
        showToast("تم تحديث بيانات الحساب والأكاديمية بنجاح 🥋", "success");
      }

      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (err) {
      console.error("Account update error:", err);
      setNotice({
        type: "error",
        message: "تعذر الاتصال بالخادم، يرجى المحاولة لاحقاً",
      });
    } finally {
      setLoading(false);
    }
  }

  const coachInitial = name ? name.trim().charAt(0) : "ك";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 selection:bg-red-500 selection:text-white"
      dir="rtl"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Dialog (Native App Sheet Style) */}
      <div className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl z-10 max-h-[92dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-bottom-sheet sm:animate-fade-in-scale">
        
        {/* Mobile Pull / Drag Handle */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="h-1.5 w-11 rounded-full bg-slate-300" />
        </div>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-cairo text-sm sm:text-base font-black text-slate-900 leading-tight">
                إعدادات الحساب والأكاديمية
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                الملف الشخصي وهوية المنظومة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          
          {/* ━━━ Native App Profile Header Card (Live Identity Card) ━━━ */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 text-white shadow-sm">
            <div className="flex items-center gap-3.5">
              {/* Avatar Initial with Ring */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-xl font-black text-white shadow-md ring-2 ring-white/20">
                <span>{coachInitial}</span>
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-slate-900">
                  <BadgeCheck className="h-3.5 w-3.5" />
                </span>
              </div>

              {/* Live Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="font-cairo text-sm sm:text-base font-black truncate text-white">
                    {name || "اسم الكابتن"}
                  </strong>
                  <span className="rounded-full bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.2 text-[10px] font-black">
                    كابتن معتمد 🥋
                  </span>
                </div>
                <p className="mt-0.5 text-xs font-bold text-slate-300 truncate">
                  {academyName || "اسم الأكاديمية"}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5" dir="ltr">
                  {email || "coach@example.com"}
                </p>
              </div>
            </div>
          </div>

          {/* ━━━ Native Segmented Control Switcher ━━━ */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              <span>بيانات الأكاديمية والمدرب</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>الأمان وكلمة المرور</span>
            </button>
          </div>

          {/* ━━━ Tab 1: Profile & Academy Information ━━━ */}
          {activeTab === "profile" && (
            <div className="space-y-3.5 animate-fade-in">
              {/* Grouped Form Fields */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3.5">
                {/* Coach Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    اسم الكابتن / المدرب
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      maxLength={80}
                      placeholder="مثال: كابتن أحمد محمود"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-100 min-h-[44px]"
                    />
                    <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                    يظهر كمسؤول الأكاديمية في التقارير ورسائل الواتساب الرسمية.
                  </span>
                </div>

                {/* Academy Name */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    اسم الأكاديمية / النادي
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      required
                      maxLength={100}
                      placeholder="مثال: أكاديمية Re_action DOJO"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-100 min-h-[44px]"
                    />
                    <Building2 className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                    يظهر في أعلى المنظومة، وعلى بطاقات الأبطال والشهادات والتقارير.
                  </span>
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    البريد الإلكتروني للحساب
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="coach@example.com"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-100 min-h-[44px]"
                    />
                    <Mail className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  </div>
                  <span className="mt-1 block text-[10px] font-semibold text-slate-400">
                    يُستخدم لتسجيل الدخول والنسخ الاحتياطي السحابي.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ━━━ Tab 2: Security & Password Management ━━━ */}
          {activeTab === "security" && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 space-y-3.5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200/70">
                  <Lock className="h-4 w-4 text-red-600" />
                  <span className="text-xs font-black text-slate-800">
                    تغيير كلمة المرور (اختياري)
                  </span>
                </div>

                {/* Current Password */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    كلمة المرور الحالية
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="أدخل كلمة المرور الحالية"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-10 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 min-h-[42px]"
                    />
                    <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    كلمة المرور الجديدة (8 أحرف على الأقل)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      minLength={8}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-10 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 min-h-[42px]"
                    />
                    <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    تأكيد كلمة المرور الجديدة
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      minLength={8}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-10 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 min-h-[42px]"
                    />
                    <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute left-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                  <div className="pt-1">
                    <div className="flex items-center justify-between text-[10px] font-extrabold mb-1">
                      <span className="text-slate-500">مستوى قوة كلمة المرور:</span>
                      <span
                        className={
                          newPassword.length >= 10
                            ? "text-emerald-600"
                            : newPassword.length >= 8
                            ? "text-amber-600"
                            : "text-rose-600"
                        }
                      >
                        {newPassword.length >= 10
                          ? "قوية جداً 🛡️"
                          : newPassword.length >= 8
                          ? "متوسطة المقبولية"
                          : "قصيرة جداً"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden flex gap-1">
                      <div
                        className={`h-full flex-1 rounded-full ${
                          newPassword.length >= 8 ? "bg-amber-500" : "bg-rose-500"
                        }`}
                      />
                      <div
                        className={`h-full flex-1 rounded-full ${
                          newPassword.length >= 10 ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Security Hint */}
              <div className="rounded-xl bg-blue-50/80 border border-blue-200/60 p-3 text-[11px] font-bold text-blue-800 flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  نصيحة: احرص على استخدام كلمة مرور قوية تحتوي على 8 أحرف وأرقام لحماية حسابك وقاعدة بيانات أبطالك.
                </span>
              </div>
            </div>
          )}

          {/* Feedback Notices */}
          {notice && (
            <div
              className={`rounded-xl p-3 text-xs font-bold flex items-center gap-2 animate-slide-up ${
                notice.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border border-rose-200 text-rose-800"
              }`}
            >
              {notice.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              )}
              <span>{notice.message}</span>
            </div>
          )}
        </form>

        {/* ━━━ Sticky Action Footer (App-Style) ━━━ */}
        <div className="p-4 border-t border-slate-100 bg-white/95 backdrop-blur-md flex items-center gap-2.5 pb-safe shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="flex-initial px-4 py-3 min-h-[46px] rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition active-press cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || fetching}
            className="flex-1 py-3 min-h-[46px] rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-xs sm:text-sm shadow-md shadow-red-600/25 active-press transition flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>حفظ التعديلات</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
