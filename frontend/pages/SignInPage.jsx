"use client";
import { useState, useEffect } from "react";
import { getSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles,
  Building2,
  Crown,
  KeyRound,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  // Mode: "login" | "register" | "admin" | "forgot"
  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("admin") === "true") {
        return "admin";
      }
    }
    return "login";
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot password states
  const [forgotStep, setForgotStep] = useState(1); // 1: send OTP, 2: verify & change password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState("");

  // Normal login, registration, or admin sign-in submission
  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? "").trim(),
      academyName: String(form.get("academyName") ?? "").trim(),
      email: String(form.get("email") ?? "").trim().toLowerCase(),
      password: String(form.get("password") ?? "").trim(),
    };

    try {
      // 1. New Coach Registration
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "تعذر إنشاء الحساب");
          setBusy(false);
          return;
        }
      }

      // 2. Perform NextAuth Sign In
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          mode === "admin"
            ? "البريد الإلكتروني أو كلمة المرور الإدارية غير صحيحة"
            : "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );
        setBusy(false);
        return;
      }

      // 3. Admin Portal Role Enforcement
      if (mode === "admin") {
        const session = await getSession();
        if (session && session.user?.role && session.user.role !== "admin") {
          await signOut({ redirect: false });
          setError("عذراً، هذا الحساب ليس لديه صلاحيات الوصول إلى لوحة تحكم المنصة الإدارية.");
          setBusy(false);
          return;
        }
        // Redirect directly to admin panel
        router.push("/admin");
        router.refresh();
        return;
      }

      // 4. Standard Coach Portal
      router.push("/");
      router.refresh();
      return;
    } catch (_err) {
      setError("تعذر الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  // Request Password Reset OTP (Step 1)
  async function submitForgotStep1(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إرسال رمز التحقق");
        return;
      }

      setForgotStep(2);
      setSuccess(data.message || "تم إرسال رمز التحقق بنجاح! تفقد بريدك الإلكتروني (بما في ذلك مجلد Spam).");
      if (data.code) {
        setSimulatedOtpNotice(data.code);
      }
    } catch (_err) {
      setError("حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setBusy(false);
    }
  }

  // Verify OTP and Reset Password (Step 2)
  async function submitForgotStep2(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail,
          code: forgotOtp,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إعادة تعيين كلمة المرور");
        return;
      }

      // Successful reset: return to login with notification
      setSuccess("تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
      setMode("login");
      setForgotStep(1);
      setForgotOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setSimulatedOtpNotice("");
    } catch (_err) {
      setError("حدث خطأ أثناء حفظ كلمة المرور الجديدة.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-3 sm:p-6 selection:bg-red-600 selection:text-white relative overflow-hidden"
      dir="rtl"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-red-600/15 via-slate-950/0 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-red-900/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-950/15 blur-3xl" />

      {/* Main Container Card */}
      <section className="relative z-10 w-full max-w-4xl grid rounded-3xl border border-slate-800/80 bg-slate-900/60 shadow-2xl shadow-black/80 backdrop-blur-xl md:grid-cols-[1.1fr_1.2fr] overflow-hidden">

        {/* Left/Hero Side: Dynamic Brand Experience */}
        <div className="relative flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 text-white border-b md:border-b-0 md:border-l border-slate-800/80">
          <div>
            {/* Emblem */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shrink-0 transition-all ${
                  mode === "admin"
                    ? "bg-gradient-to-br from-amber-500 to-red-600 shadow-amber-500/30 ring-2 ring-amber-400/40"
                    : mode === "forgot"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-600/30 ring-2 ring-blue-400/30"
                    : "bg-red-600 shadow-red-600/30 ring-2 ring-red-400/30"
                }`}
              >
                {mode === "admin" ? (
                  <Crown className="h-6 w-6 stroke-white fill-white/20" />
                ) : mode === "forgot" ? (
                  <KeyRound className="h-6 w-6" />
                ) : (
                  <Zap className="h-6 w-6 fill-white stroke-white" />
                )}

                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <strong className="font-cairo text-lg sm:text-xl font-black tracking-tight text-white">
                    Re_action
                  </strong>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-black border tracking-wide ${
                      mode === "admin"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                    }`}
                  >
                    {mode === "admin" ? "ADMIN PANEL" : "DOJO 2026"}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  {mode === "admin"
                    ? "بوابة إدارة المنصة والتحكم المركزي"
                    : "منظومة إدارة أكاديمية الكاراتيه الاحترافية"}
                </span>
              </div>
            </div>

            {/* Dynamic Copy depending on mode */}
            {mode === "admin" ? (
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-700/50 text-[11px] font-extrabold text-amber-300 shadow-xs">
                  <Crown className="h-3.5 w-3.5" />
                  <span>لوحة الإدارة المركزية العليا</span>
                </div>
                <h2 className="font-cairo text-2xl sm:text-3xl font-black text-white leading-tight">
                  التحكم الشامل بالمنصة.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-rose-300">
                    متابعة الاشتراكات والأكاديميات.
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm pt-1">
                  أهلاً بك في بوابة المشرف العام. تابع فترات صلاحية الأكاديميات المشتركة، تمديد وتجميد الاشتراكات، وسجلات العمليات الإدارية الحساسة.
                </p>
              </div>
            ) : mode === "forgot" ? (
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-700/50 text-[11px] font-extrabold text-blue-300 shadow-xs">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>استعادة الحساب الآمنة</span>
                </div>
                <h2 className="font-cairo text-2xl sm:text-3xl font-black text-white leading-tight">
                  استرجع الوصول لحسابك.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-300">
                    حماية كاملة لبياناتك.
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm pt-1">
                  سوف نرسل لك رمز تحقق سريع على بريدك الإلكتروني المعتمد لتعيين كلمة مرور جديدة ومتابعة تدريبات أكاديميتك فوراً.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-[11px] font-extrabold text-red-400 shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>إدارة متكاملة من الدرجة الأولى</span>
                </div>
                <h2 className="font-cairo text-2xl sm:text-3xl font-black text-white leading-tight">
                  قيادة تدريبية ذكية.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">
                    متابعة دقيقة للأبطال.
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm pt-1">
                  سجل حضور وغياب لاعبيك بلمسة واحدة، تابع سداد الاشتراكات الشهرية واستقلالية حسابات الفعاليات، وشارك تقارير التدريب فوراً.
                </p>
              </div>
            )}
          </div>

          {/* Feature Highlights Grid */}
          <div className="hidden sm:grid gap-2.5 pt-8 mt-8 border-t border-slate-800/80 text-xs">
            {mode === "admin" ? (
              <>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">إدارة مركزية للأكاديميات المشتركة وفترات الصلاحية</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">تمديد أو إيقاف مؤقت للاشتراكات بنقرة زر واحدة</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">سجل تدقيق أمني فوري وتفصيلي لكافة العمليات</span>
                </div>
              </>
            ) : mode === "forgot" ? (
              <>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-semibold">رمز تحقق مشفر بصلاحية 15 دقيقة لحماية الحساب</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />
                  <span className="font-semibold">تحديث فوري وآمن لكلمة المرور في قاعدة البيانات</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">تسجيل حضور وغياب فوري بنظام اللمس السريع</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">فصل مالي تام بين الاشتراكات الشهرية والأدوات</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">إرسال تقارير وتهاني واتساب المباشرة لولي الأمر</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right/Form Side: Interactive Entry */}
        <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md">

            {/* 3-Way Segmented Switcher (Login | Register | Admin Control Panel) */}
            <div className="mb-6 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("login");
                }}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("register");
                }}
              >
                حساب جديد
              </button>

              <button
                type="button"
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation flex items-center justify-center gap-1 ${
                  mode === "admin"
                    ? "bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm shadow-amber-500/20"
                    : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/60"
                }`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setMode("admin");
                }}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>لوحة التحكم</span>
              </button>
            </div>

            {/* Form Titles based on Mode */}
            <div className="mb-5 text-right">
              {mode === "admin" ? (
                <>
                  <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>دخول لوحة التحكم</span>
                    <span className="text-amber-500">👑</span>
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    أدخل بريد المدير العام (Gmail) وكلمة المرور الإدارية لفتح لوحة التحكم.
                  </p>
                </>
              ) : mode === "forgot" ? (
                <>
                  <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    <span>استعادة كلمة المرور</span>
                    <KeyRound className="w-5 h-5 text-red-600" />
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    {forgotStep === 1
                      ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق من 6 أرقام."
                      : "أدخل رمز التحقق المكون من 6 أرقام وكلمة المرور الجديدة."}
                  </p>
                </>
              ) : mode === "register" ? (
                <>
                  <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900">
                    إنشاء حساب مدرب جديد
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    سجّل بياناتك للبدء في إدارة لاعبين الأكاديمية وصالات التدريب.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900">
                    أهلاً بك مجدداً يا كابتن 👋
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    أدخل بريدك الإلكتروني وكلمة المرور للمتابعة.
                  </p>
                </>
              )}
            </div>

            {/* ━━━ FORGOT PASSWORD MODE ━━━ */}
            {mode === "forgot" ? (
              forgotStep === 1 ? (
                /* Step 1: Enter Email to Receive OTP */
                <form className="space-y-4 text-right" onSubmit={submitForgotStep1}>
                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      البريد الإلكتروني المسجل
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="coach@example.com"
                        dir="ltr"
                      />
                      <Mail className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 animate-slide-up flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 font-cairo text-sm font-black text-white shadow-sm shadow-red-600/20 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري إرسال الرمز...</span>
                      </span>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>إرسال رمز التحقق</span>
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                        setSuccess("");
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      ← العودة لتسجيل الدخول
                    </button>
                  </div>
                </form>
              ) : (
                /* Step 2: Enter OTP + New Password */
                <form className="space-y-3.5 text-right" onSubmit={submitForgotStep2}>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                    <div className="truncate">
                      <span className="text-slate-500 font-medium">البريد: </span>
                      <strong className="text-slate-800 font-bold" dir="ltr">
                        {forgotEmail}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="text-red-600 hover:text-red-700 font-bold underline shrink-0 mr-2 cursor-pointer"
                    >
                      تعديل
                    </button>
                  </div>

                  {simulatedOtpNotice && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2 animate-slide-up">
                      <div className="flex items-center gap-1.5 font-black text-amber-900">
                        <span>🔐</span>
                        <span>رمز التحقق الخاص بك (أدخل هذا الرمز أدناه):</span>
                      </div>
                      <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200">
                        <span className="font-mono text-xl font-black tracking-widest text-red-600 select-all">
                          {simulatedOtpNotice}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForgotOtp(simulatedOtpNotice)}
                          className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer"
                        >
                          تعبئة الرمز تلقائياً ✍️
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-700 font-semibold leading-relaxed">
                        💡 يمكنك إدخال الرمز مباشرة لإتمام تعيين كلمة المرور الجديدة دون أي انتظار.
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      رمز التحقق (6 أرقام)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-3 py-2.5 text-center text-lg font-black tracking-widest text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100 font-mono"
                        type="text"
                        maxLength={6}
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      كلمة المرور الجديدة (8 أحرف على الأقل)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold text-slate-700 mb-1">
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <div className="relative flex items-center">
                      <input
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type={showConfirmPassword ? "text" : "password"}
                        minLength={8}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 animate-slide-up flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 font-cairo text-sm font-black text-white shadow-sm shadow-red-600/20 transition-all active:scale-98 disabled:opacity-60 cursor-pointer"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري حفظ كلمة المرور...</span>
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تأكيد وتغيير كلمة المرور</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError("");
                        setSuccess("");
                      }}
                      className="font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                    >
                      ← إلغاء والعودة للدخول
                    </button>
                    <button
                      type="button"
                      onClick={submitForgotStep1}
                      disabled={busy}
                      className="font-bold text-red-600 hover:text-red-700 transition cursor-pointer"
                    >
                      إعادة إرسال الرمز 🔄
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* ━━━ MAIN AUTH FORMS (Login, Register, Admin) ━━━ */
              <form className="space-y-3.5 text-right" onSubmit={submitAuth}>
                {mode === "register" && (
                  <>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        اسم الكابتن / المدرب
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                          name="name"
                          required
                          placeholder="مثال: كابتن أحمد محمود"
                          autoComplete="name"
                        />
                        <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">
                        اسم الأكاديمية / النادي
                      </label>
                      <div className="relative flex items-center">
                        <input
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                          name="academyName"
                          required
                          placeholder="مثال: أكاديمية أبطال المستقبل للكاراتيه"
                          autoComplete="organization"
                        />
                        <Building2 className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                      <span className="mt-1 block text-[10px] text-slate-400 font-medium">
                        💡 سيظهر هذا الاسم على الكروت والشهادات وتقارير الواتساب (يمكن تعديله في أي وقت)
                      </span>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    {mode === "admin"
                      ? "البريد الإلكتروني للوحة التحكم (Gmail)"
                      : "البريد الإلكتروني"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className={`w-full rounded-xl border bg-slate-50/70 pr-10 pl-3 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition ${
                        mode === "admin"
                          ? "border-amber-200 focus:border-amber-500 focus:ring-3 focus:ring-amber-100"
                          : "border-slate-200 focus:border-red-500 focus:ring-3 focus:ring-red-100"
                      }`}
                      name="email"
                      type="email"
                      required
                      placeholder={
                        mode === "admin" ? "mg0447837@gmail.com" : "coach@example.com"
                      }
                      autoComplete="email"
                      dir="ltr"
                    />
                    <Mail
                      className={`absolute right-3 h-4 w-4 pointer-events-none ${
                        mode === "admin" ? "text-amber-500" : "text-slate-400"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    {mode === "admin" ? "كلمة المرور الإدارية" : "كلمة المرور"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      className={`w-full rounded-xl border bg-slate-50/70 pr-10 pl-10 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition ${
                        mode === "admin"
                          ? "border-amber-200 focus:border-amber-500 focus:ring-3 focus:ring-amber-100"
                          : "border-slate-200 focus:border-red-500 focus:ring-3 focus:ring-red-100"
                      }`}
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      placeholder="••••••••"
                      autoComplete={mode === "register" ? "new-password" : "current-password"}
                      dir="ltr"
                    />
                    <Lock
                      className={`absolute right-3 h-4 w-4 pointer-events-none ${
                        mode === "admin" ? "text-amber-500" : "text-slate-400"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                      title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Forgot Password Link in Login Mode */}
                  {mode === "login" && (
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setSuccess("");
                          setMode("forgot");
                          setForgotStep(1);
                        }}
                        className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
                      >
                        نسيت كلمة المرور؟
                      </button>
                    </div>
                  )}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 animate-slide-up flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {success && (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700 animate-slide-up flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  className={`mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl font-cairo text-sm font-black text-white shadow-sm transition-all active:scale-98 disabled:opacity-60 cursor-pointer ${
                    mode === "admin"
                      ? "bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:brightness-110 shadow-amber-500/25"
                      : "bg-red-600 hover:bg-red-700 shadow-red-600/20"
                  }`}
                  type="submit"
                  disabled={busy}
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>جاري المعالجة...</span>
                    </span>
                  ) : mode === "admin" ? (
                    <>
                      <Crown className="h-4 w-4" />
                      <span>فتح لوحة التحكم المركزية</span>
                    </>
                  ) : mode === "register" ? (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>إنشاء الحساب والدخول</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 fill-current" />
                      <span>تسجيل الدخول إلى الأكاديمية</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <p className="mt-6 text-center text-[11px] font-medium text-slate-400">
              أكاديمية Re_action للكاراتيه • جميع الحقوق محفوظة {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
