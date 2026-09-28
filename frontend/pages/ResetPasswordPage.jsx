"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  KeyRound, ArrowRight, ShieldAlert, Zap,
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
  const [tokenStatus, setTokenStatus] = useState(() => isParamsMissing ? "invalid" : "checking");
  const [statusMessage, setStatusMessage] = useState(() =>
    isParamsMissing ? "رابط إعادة تعيين كلمة المرور غير مكتمل أو غير صالح." : ""
  );

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token || !emailParam) return;
    let isCancelled = false;

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(emailParam)}`);
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
        if (!isCancelled) setVerifying(false);
      }
    }

    verifyToken();
    return () => { isCancelled = true; };
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
  const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) { setError("كلمة المرور يجب أن تتكون من 8 أحرف على الأقل."); return; }
    if (newPassword !== confirmPassword) { setError("كلمتا المرور غير متطابقتين."); return; }
    if (newPassword.toLowerCase() === email.toLowerCase()) { setError("لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, token, newPassword, confirmPassword }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "تعذر إعادة تعيين كلمة المرور."); return; }
      setSuccess(true);
    } catch {
      setError("حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen flex flex-col justify-center items-center p-4 selection:bg-red-600 selection:text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1a0a0a 100%)" }}
      dir="rtl"
    >
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-red-600/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-rose-900/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Card */}
      <section
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/8 shadow-2xl shadow-black/70 overflow-hidden animate-fade-in-scale"
        style={{ background: "rgba(15,23,42,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
      >
        {/* Accent top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-red-600 to-rose-500" />

        <div className="p-7 sm:p-10 space-y-6">
          {/* Brand header */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-lg shadow-red-600/30 ring-2 ring-red-400/25">
              <Zap className="h-6 w-6 fill-white" />
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <strong className="text-xl font-black tracking-tight text-white">Re_action</strong>
                <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[9px] font-black text-red-400 border border-red-500/30 tracking-widest">SECURITY</span>
              </div>
              <p className="text-xs font-medium text-slate-400">استعادة كلمة المرور والحساب</p>
            </div>
          </div>

          {/* ── State: Verifying ──────────────────────────────────────────── */}
          {verifying && (
            <div className="py-10 text-center space-y-4">
              <div className="flex justify-center">
                <span className="spinner spinner-lg" style={{ borderColor: "rgba(220,38,38,0.3)", borderTopColor: "#dc2626" }} />
              </div>
              <p className="text-sm font-bold text-slate-300">جاري التحقق من صلاحية رابط استعادة الحساب...</p>
            </div>
          )}

          {/* ── State: Invalid / Expired / Used ──────────────────────────── */}
          {!verifying && tokenStatus !== "valid" && (
            <div className="py-4 text-center space-y-5 animate-slide-up">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">
                  {tokenStatus === "expired" ? "انتهت صلاحية الرابط" :
                   tokenStatus === "already_used" ? "تم استخدام هذا الرابط مسبقاً" :
                   "رابط غير صالح"}
                </h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">{statusMessage}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/auth/signin?mode=forgot")}
                className="btn btn-lg btn-full bg-red-600 hover:bg-red-700 text-white font-black shadow-red-600/25"
              >
                <KeyRound className="h-4 w-4" />
                <span>طلب رابط استعادة جديد</span>
              </button>
            </div>
          )}

          {/* ── State: Success ────────────────────────────────────────────── */}
          {!verifying && success && (
            <div className="py-4 text-center space-y-5 animate-slide-up">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">تم تغيير كلمة المرور بنجاح! 🎉</h2>
                <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">
                  تم تحديث كلمة المرور في قاعدة البيانات وإبطال الرابط المستخدم. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/auth/signin")}
                className="btn btn-lg btn-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black shadow-emerald-600/25"
              >
                <span>الانتقال لتسجيل الدخول</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── State: Valid Form ─────────────────────────────────────────── */}
          {!verifying && tokenStatus === "valid" && !success && (
            <form className="space-y-4" onSubmit={handleSubmit} dir="rtl">
              <div className="text-center">
                <h1 className="text-xl font-black text-white">تعيين كلمة المرور الجديدة</h1>
                <p className="text-xs text-slate-400 mt-1">
                  لحساب: <strong className="text-white font-mono" dir="ltr">{email}</strong>
                </p>
              </div>

              {/* New Password */}
              <div className="form-field">
                <label htmlFor="newPassword" className="block text-xs font-extrabold text-slate-300 mb-1.5">
                  كلمة المرور الجديدة <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="newPassword" name="newPassword"
                    type={showPassword ? "text" : "password"}
                    minLength={8} required
                    value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password" dir="ltr"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pr-10 pl-10 py-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-600"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title={showPassword ? "إخفاء" : "إظهار"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Strength Meter */}
                {newPassword && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-400">قوة كلمة المرور:</span>
                      <span className="text-slate-200">{strengthLabels[passwordStrength - 1] || "ضعيفة"}</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className={`h-full flex-1 rounded-full transition-all duration-300 ${passwordStrength >= step ? strengthColors[passwordStrength - 1] : "bg-slate-700"}`} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-field">
                <label htmlFor="confirmPassword" className="block text-xs font-extrabold text-slate-300 mb-1.5">
                  تأكيد كلمة المرور الجديدة <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword" name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    minLength={8} required
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••" autoComplete="new-password" dir="ltr"
                    className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pr-10 pl-10 py-3 text-sm font-semibold text-white outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/20 placeholder:text-slate-600"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
                  <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-white transition cursor-pointer" title={showConfirmPassword ? "إخفاء" : "إظهار"}>
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-bold text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={busy} className="btn btn-lg btn-full bg-red-600 hover:bg-red-700 text-white font-black shadow-red-600/25">
                {busy ? <><span className="btn-spinner" /><span>جاري حفظ كلمة المرور...</span></> : <><CheckCircle2 className="h-4 w-4" /><span>تأكيد وحفظ كلمة المرور</span></>}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => router.push("/auth/signin")} className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer">
                  ← إلغاء والعودة لتسجيل الدخول
                </button>
              </div>
            </form>
          )}

          {/* Footer */}
          <p className="text-center text-[11px] text-slate-600 border-t border-white/5 pt-5">
            Re_action DOJO · منظومة الأبطال {new Date().getFullYear()}
          </p>
        </div>
      </section>
    </main>
  );
}
