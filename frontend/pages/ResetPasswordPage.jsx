"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  ShieldAlert,
  Zap,
} from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";
  const isParamsMissing = !token || !emailParam;

  const [email, setEmail] = useState(emailParam);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [verifying, setVerifying] = useState(() => !isParamsMissing);
  const [tokenStatus, setTokenStatus] = useState(() =>
    isParamsMissing ? "invalid" : "checking"
  );
  const [statusMessage, setStatusMessage] = useState(() =>
    isParamsMissing
      ? "رابط إعادة تعيين كلمة المرور غير مكتمل أو غير صالح."
      : ""
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token || !emailParam) {
      return;
    }

    let isCancelled = false;

    async function verifyToken() {
      try {
        const res = await fetch(
          `/api/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`
        );
        const data = await res.json();
        if (isCancelled) return;

        if (res.ok && data.valid) {
          setTokenStatus("valid");
          setEmail(data.email || emailParam);
        } else {
          if (data.code === "TOKEN_EXPIRED") {
            setTokenStatus("expired");
            setStatusMessage("انتهت صلاحية هذا الرابط (صلاحيته 15 دقيقة فقط). يرجى طلب رابط جديد.");
          } else if (data.code === "TOKEN_ALREADY_USED") {
            setTokenStatus("already_used");
            setStatusMessage("تم استخدام هذا الرابط مسبقاً لإعادة تعيين كلمة المرور أو أنه لم يعد صالحاً.");
          } else {
            setTokenStatus("invalid");
            setStatusMessage(data.error || "رابط إعادة تعيين كلمة المرور غير صالح.");
          }
        }
      } catch {
        if (!isCancelled) {
          setTokenStatus("invalid");
          setStatusMessage("تعذر التحقق من الرابط. تحقق من اتصال الإنترنت.");
        }
      } finally {
        if (!isCancelled) {
          setVerifying(false);
        }
      }
    }

    verifyToken();

    return () => {
      isCancelled = true;
    };
  }, [token, emailParam]);

  // Calculate password strength (0-4)
  const passwordStrength = React.useMemo(() => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 8) score += 1;
    if (newPassword.length >= 10) score += 1;
    if (/[A-Z]/.test(newPassword) || /[0-9]/.test(newPassword)) score += 1;
    if (/[^A-Za-z0-9]/.test(newPassword)) score += 1;
    return score;
  }, [newPassword]);

  const strengthLabels = ["ضعيفة جداً", "مقبولة", "جيدة", "قوية جداً"];
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين.");
      return;
    }

    if (newPassword.toLowerCase() === email.toLowerCase()) {
      setError("لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني.");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إعادة تعيين كلمة المرور.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-red-600 selection:text-white relative overflow-hidden"
      dir="rtl"
    >
      {/* Background glow effects */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-red-600/15 via-slate-950/0 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-red-900/10 blur-3xl" />

      <section className="relative z-10 w-full max-w-lg rounded-3xl border border-slate-800/80 bg-slate-900/80 shadow-2xl backdrop-blur-xl p-6 sm:p-10 text-white">
        {/* Brand header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-600/30 ring-2 ring-red-400/30">
            <Zap className="h-6 w-6 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="font-cairo text-xl font-black tracking-tight text-white">
                Re_action
              </strong>
              <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-500/30">
                SECURITY
              </span>
            </div>
            <span className="text-xs font-medium text-slate-400">
              استعادة كلمة المرور والحساب
            </span>
          </div>
        </div>

        {/* Verifying loader */}
        {verifying && (
          <div className="py-12 text-center space-y-4">
            <span className="inline-block h-8 w-8 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
            <p className="text-sm font-bold text-slate-300">
              جاري التحقق من صلاحية رابط استعادة الحساب...
            </p>
          </div>
        )}

        {/* Invalid or Expired or Already Used */}
        {!verifying && tokenStatus !== "valid" && (
          <div className="py-6 text-center space-y-5 animate-slide-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                {tokenStatus === "expired"
                  ? "انتهت صلاحية الرابط"
                  : tokenStatus === "already_used"
                  ? "تم استخدام هذا الرابط مسبقاً"
                  : "رابط غير صالح"}
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                {statusMessage}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/auth/signin")}
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 font-cairo text-sm font-black text-white shadow-lg shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="h-4 w-4" />
                <span>طلب رابط استعادة جديد</span>
              </button>
            </div>
          </div>
        )}

        {/* Success State */}
        {!verifying && success && (
          <div className="py-6 text-center space-y-5 animate-slide-up">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-white">
                تم تغيير كلمة المرور بنجاح! 🎉
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                تم تحديث كلمة المرور الخاصة بحسابك في قاعدة البيانات وإبطال الرابط المستخدم. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => router.push("/auth/signin")}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-cairo text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>الانتقال لتسجيل الدخول</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Valid Form */}
        {!verifying && tokenStatus === "valid" && !success && (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="text-center pb-2">
              <h1 className="text-xl font-black text-white">
                تعيين كلمة المرور الجديدة
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                لحساب: <strong className="text-white" dir="ltr">{email}</strong>
              </p>
            </div>

            {/* New Password */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-xs font-extrabold text-slate-300 mb-1"
              >
                كلمة المرور الجديدة (8 أحرف على الأقل)
              </label>
              <div className="relative flex items-center">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showPassword ? "text" : "password"}
                  minLength={8}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pr-10 pl-10 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                  title={showPassword ? "إخفاء" : "إظهار"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {/* Strength Meter */}
              {newPassword && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400">قوة كلمة المرور:</span>
                    <span className="text-slate-200">
                      {strengthLabels[passwordStrength - 1] || "ضعيفة"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full flex-1 rounded-full transition-all duration-300 ${
                          passwordStrength >= step
                            ? strengthColors[passwordStrength - 1]
                            : "bg-slate-700"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-extrabold text-slate-300 mb-1"
              >
                تأكيد كلمة المرور الجديدة
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  minLength={8}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  dir="ltr"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pr-10 pl-10 py-2.5 text-sm font-semibold text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                />
                <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                  title={showConfirmPassword ? "إخفاء" : "إظهار"}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-center text-xs font-bold text-rose-300 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 font-cairo text-sm font-black text-white shadow-lg shadow-red-600/25 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  <span>جاري حفظ كلمة المرور...</span>
                </span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>تأكيد وحفظ كلمة المرور</span>
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => router.push("/auth/signin")}
                className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer"
              >
                ← إلغاء والعودة لتسجيل الدخول
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
