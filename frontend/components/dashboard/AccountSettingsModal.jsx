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
  KeyRound,
  Sparkles,
  ShieldCheck,
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

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [notice, setNotice] = useState(null);

  const handleClose = () => {
    setNotice(null);
    setShowPasswordSection(false);
    setCurrentPassword("");
    setNewPassword("");
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
      setNotice({ type: "error", message: "يرجى إدخال اسم الكابتن / المدرب" });
      return;
    }

    if (!trimmedAcademy) {
      setNotice({ type: "error", message: "يرجى إدخال اسم الأكاديمية أو النادي" });
      return;
    }

    if (!trimmedEmail) {
      setNotice({ type: "error", message: "يرجى إدخال بريد إلكتروني صحيح" });
      return;
    }

    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setNotice({
          type: "error",
          message: "يرجى كتابة كلمة المرور الحالية لتأكيد التغيير",
        });
        return;
      }
      if (newPassword.length < 8) {
        setNotice({
          type: "error",
          message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل",
        });
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

      if (showPasswordSection && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
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
      setShowPasswordSection(false);

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
        onClose();
      }, 1200);
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

  const coachInitial = name ? name.charAt(0) : "ك";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 selection:bg-red-500 selection:text-white" dir="rtl">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-2xl z-10 max-h-[92vh] overflow-y-auto animate-slide-up">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-600/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900 leading-tight">
                إعدادات الحساب والأكاديمية
              </h2>
              <p className="text-[11px] font-semibold text-slate-400">
                تخصيص هوية الأكاديمية وبيانات الكابتن (SaaS Profile)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Live Identity Preview Card */}
        <div className="mt-4 rounded-2xl border border-red-100 bg-gradient-to-br from-red-50/60 via-slate-50 to-amber-50/40 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-red-600">
              <Sparkles className="h-3.5 w-3.5" />
              <span>معاينة هوية المنظومة والكروت الحية</span>
            </div>
            <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              تحديث فوري
            </span>
          </div>

          <div className="flex items-center gap-3 bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white font-cairo font-black text-sm ring-2 ring-red-100">
              {coachInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <strong className="font-cairo text-xs sm:text-sm font-black text-slate-900 truncate">
                  {academyName || "اسم الأكاديمية"}
                </strong>
                <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.2 text-[9px] font-black">
                  رسمي
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                إشراف وتدريب الكابتن / <span className="text-red-600 font-extrabold">{name || "اسم الكابتن"}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {/* Coach Name */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              اسم الكابتن / المدرب المسؤول
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                placeholder="مثال: كابتن أحمد محمود"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
              />
              <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Academy Name */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              اسم الأكاديمية / النادي / الدوجو
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                value={academyName}
                onChange={(e) => setAcademyName(e.target.value)}
                required
                maxLength={100}
                placeholder="مثال: أكاديمية أبطال المستقبل للكاراتيه"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
              />
              <Building2 className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
            <span className="mt-1 block text-[10px] text-slate-400 font-medium">
              💡 يظهر هذا الاسم في أعلى المنظومة، وعلى جميع كروت وبطاقات اللاعبين وتقارير الواتساب
            </span>
          </div>

          {/* Email */}
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
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
              />
              <Mail className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Password Change Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection((prev) => !prev);
                setCurrentPassword("");
                setNewPassword("");
              }}
              className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 hover:text-red-600 transition cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>{showPasswordSection ? "إلغاء تغيير كلمة المرور" : "ترغب في تغيير كلمة المرور؟ (اختياري)"}</span>
            </button>

            {showPasswordSection && (
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5 animate-slide-up">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                    كلمة المرور الحالية
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type={showCurrentPass ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      dir="ltr"
                      className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-9 py-2 text-xs font-medium text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                    <Lock className="absolute right-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="absolute left-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showCurrentPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

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
                      className="w-full rounded-xl border border-slate-200 bg-white pr-9 pl-9 py-2 text-xs font-medium text-slate-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                    />
                    <Lock className="absolute right-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute left-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading || fetching}
              className="flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-black text-white shadow-sm shadow-red-600/20 transition active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>حفظ التعديلات</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
