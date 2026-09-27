"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
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
  Info,
} from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: currentSession, status: sessionStatus } = useSession();

  // Mode: "login" | "register" | "admin" | "forgot"
  const [mode, setMode] = useState(() => {
    if (typeof window !== "undefined") {
      const adminParam = searchParams.get("admin");
      const modeParam = searchParams.get("mode");
      if (adminParam === "true") return "admin";
      if (modeParam === "register") return "register";
      if (modeParam === "forgot") return "forgot";
    }
    return "login";
  });

  // Redirect already authenticated users
  useEffect(() => {
    if (sessionStatus === "authenticated" && currentSession?.user) {
      if (currentSession.user.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/");
      }
    }
  }, [sessionStatus, currentSession, router]);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [academyName, setAcademyName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  // Visibility Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [suspendedDetails, setSuspendedDetails] = useState(null);

  // Forgot password flow states
  const [forgotStep, setForgotStep] = useState(1); // 1: send email, 2: verify & change password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmNewPass, setShowConfirmNewPass] = useState(false);
  const [simulatedOtpNotice, setSimulatedOtpNotice] = useState("");

  // Calculate password strength (0 to 4)
  const passwordStrength = useMemo(() => {
    const target = mode === "forgot" ? newPassword : password;
    if (!target) return 0;
    let score = 0;
    if (target.length >= 8) score += 1;
    if (target.length >= 10) score += 1;
    if (/[A-Z]/.test(target) || /[0-9]/.test(target)) score += 1;
    if (/[^A-Za-z0-9]/.test(target)) score += 1;
    return score;
  }, [mode, password, newPassword]);

  const strengthLabels = ["ضعيفة جداً", "مقبولة", "جيدة", "قوية ومثالية"];
  const strengthColors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-blue-500",
    "bg-emerald-500",
  ];

  // 1. Submit Authentication (Login, Register, or Admin)
  async function submitAuth(e) {
    e.preventDefault();
    if (busy) return; // Prevent double submit

    setError("");
    setSuccess("");
    setSuspendedDetails(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    // Frontend Validations
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (!cleanPassword || cleanPassword.length < 8) {
      setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
      return;
    }

    if (mode === "register") {
      const cleanName = name.trim();
      const cleanAcademy = academyName.trim();

      if (!cleanName || cleanName.length < 2) {
        setError("يرجى إدخال اسم الكابتن بشكل صحيح (حرفين على الأقل)");
        return;
      }

      if (!cleanAcademy || cleanAcademy.length < 2) {
        setError("يرجى إدخال اسم الأكاديمية أو النادي");
        return;
      }

      if (cleanPassword !== confirmPassword.trim()) {
        setError("كلمتا المرور غير متطابقتين");
        return;
      }

      if (cleanPassword.toLowerCase() === cleanEmail.toLowerCase()) {
        setError("لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني");
        return;
      }
    }

    setBusy(true);

    try {
      // Step A: If Registering, create user first
      if (mode === "register") {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            academyName: academyName.trim(),
            email: cleanEmail,
            password: cleanPassword,
            confirmPassword: confirmPassword.trim(),
          }),
        });

        const regData = await regRes.json();

        if (!regRes.ok) {
          setError(regData.error || "تعذر إنشاء الحساب");
          setBusy(false);
          return;
        }

        // Registration succeeded: Auto-login
        setSuccess("تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...");
      }

      // Step B: Check if account is suspended / disabled
      try {
        const statusRes = await fetch("/api/auth/check-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail }),
        });

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData?.suspended) {
            setSuspendedDetails(statusData);
            setError(
              `⛔ تم إيقاف هذا الحساب من قِبل إدارة المنصة. سبب الإيقاف: ${statusData.reason || "غير محدد"}`
            );
            setBusy(false);
            return;
          }
        }
      } catch {
        // Non-blocking status pre-check; backend auth enforces it
      }

      // Step C: Perform NextAuth Sign In
      const result = await signIn("credentials", {
        email: cleanEmail,
        password: cleanPassword,
        redirect: false,
      });

      if (result?.error) {
        // Re-check for suspension in case credentials error was thrown due to suspension
        try {
          const recheck = await fetch("/api/auth/check-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: cleanEmail }),
          });
          if (recheck.ok) {
            const recheckData = await recheck.json();
            if (recheckData?.suspended) {
              setSuspendedDetails(recheckData);
              setError(
                `⛔ تم إيقاف هذا الحساب من قِبل إدارة المنصة. سبب الإيقاف: ${recheckData.reason || "غير محدد"}`
              );
              setBusy(false);
              return;
            }
          }
        } catch {}

        setError(
          mode === "admin"
            ? "البريد الإلكتروني أو كلمة المرور الإدارية غير صحيحة"
            : "البريد الإلكتروني أو كلمة المرور غير صحيحة"
        );
        setBusy(false);
        return;
      }

      // Step D: Verify role and navigate
      const session = await getSession();

      if (mode === "admin") {
        if (session?.user?.role !== "admin") {
          await signOut({ redirect: false });
          setError("عذراً، هذا الحساب ليس لديه صلاحيات الوصول إلى لوحة تحكم المنصة الإدارية.");
          setBusy(false);
          return;
        }
        router.push("/admin");
        router.refresh();
        return;
      }

      // Standard Coach Portal
      router.push("/");
      router.refresh();
    } catch {
      setError("تعذر الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً.");
      setBusy(false);
    }
  }

  // 2. Forgot Password - Step 1: Send Code / Link
  async function submitForgotStep1(e) {
    e.preventDefault();
    if (busy) return;

    setError("");
    setSuccess("");
    setSimulatedOtpNotice("");

    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("يرجى كتابة البريد الإلكتروني بشكل صحيح");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إرسال رمز التحقق");
        return;
      }

      setForgotStep(2);
      setSuccess(
        data.message ||
          "إذا كان هذا البريد مسجلاً لدينا، فستصلك تعليمات استعادة كلمة المرور ورمز التحقق (تفقد صندوق الوارد أو Spam)."
      );

      if (data.code) {
        setSimulatedOtpNotice(data.code);
      }
    } catch {
      setError("حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً.");
    } finally {
      setBusy(false);
    }
  }

  // 3. Forgot Password - Step 2: Confirm OTP & Set New Password
  async function submitForgotStep2(e) {
    e.preventDefault();
    if (busy) return;

    setError("");
    setSuccess("");

    if (!forgotOtp || forgotOtp.trim().length !== 6) {
      setError("يرجى إدخال رمز التحقق المكون من 6 أرقام");
      return;
    }

    if (newPassword.length < 8) {
      setError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف");
      return;
    }

    if (newPassword !== confirmNewPass) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    if (newPassword.toLowerCase() === forgotEmail.trim().toLowerCase()) {
      setError("لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني");
      return;
    }

    setBusy(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          code: forgotOtp.trim(),
          newPassword,
          confirmPassword: confirmNewPass,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "تعذر إعادة تعيين كلمة المرور");
        return;
      }

      // Success: Reset flow and return to login
      setSuccess(
        "تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة."
      );
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword("");
      setMode("login");
      setForgotStep(1);
      setForgotOtp("");
      setNewPassword("");
      setConfirmNewPass("");
      setSimulatedOtpNotice("");
    } catch {
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
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-radial from-red-600/15 via-slate-950/0 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-red-900/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-rose-950/15 blur-3xl" />

      {/* Main Container Card */}
      <section className="relative z-10 w-full max-w-4xl grid rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/80 backdrop-blur-xl md:grid-cols-[1.05fr_1.2fr] overflow-hidden">
        {/* Left Side: Brand Banner */}
        <div className="relative flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 text-white border-b md:border-b-0 md:border-l border-slate-800/80">
          <div>
            {/* Logo Emblem */}
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

            {/* Dynamic Headlines based on mode */}
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
                  سوف نرسل لك رمز تحقق من 6 أرقام ورابطاً آمناً لتعيين كلمة مرور جديدة والعودة لإدارة تدريبات أكاديميتك فوراً.
                </p>
              </div>
            ) : mode === "register" ? (
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-[11px] font-extrabold text-red-400 shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>ابدأ تجربتك المجانية 30 يوماً</span>
                </div>
                <h2 className="font-cairo text-2xl sm:text-3xl font-black text-white leading-tight">
                  انضم لأبطال الكاراتيه.
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">
                    إدارة متطورة بلمسة واحدة.
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-sm pt-1">
                  سجل حضور اللاعبين، تابع سداد الاشتراكات الشهرية، نظم بطولات الأكاديمية وصالات التدريب، وتواصل مع أولياء الأمور بسهولة.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/60 border border-red-800/40 text-[11px] font-extrabold text-red-400 shadow-xs">
                  <Sparkles className="h-3 w-3" />
                  <span>إدارة تدريبية ذكية</span>
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
                  <span className="font-semibold">إدارة مركزية للكباتن والأكاديميات وفترات الصلاحية</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">تمديد أو إيقاف أو حذف الحسابات بنقرة زر واحدة</span>
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
                  <span className="font-semibold">رمز تحقق مشفر ورابط آمن بصلاحية 15 دقيقة</span>
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
                  <span className="font-semibold">فصل مالي تام بين الاشتراكات الشهرية والبطولات والأدوات</span>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold">نسخ احتياطي واستعادة سحابية مشفرة لبياناتك</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Interactive Forms */}
        <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md">
            {/* 3-Way Segmented Switcher (Login | Register | Admin) */}
            <nav
              aria-label="نوع تسجيل الدخول"
              className="mb-6 grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80"
            >
              <button
                type="button"
                id="tab-login"
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                  mode === "login"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setSuspendedDetails(null);
                  setMode("login");
                }}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                id="tab-register"
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                  mode === "register"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setSuspendedDetails(null);
                  setMode("register");
                }}
              >
                حساب جديد
              </button>

              <button
                type="button"
                id="tab-admin"
                className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation flex items-center justify-center gap-1 ${
                  mode === "admin"
                    ? "bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm shadow-amber-500/20"
                    : "text-amber-700 hover:text-amber-900 hover:bg-amber-50/60"
                }`}
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setSuspendedDetails(null);
                  setMode("admin");
                }}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>لوحة التحكم</span>
              </button>
            </nav>

            {/* Form Titles */}
            <header className="mb-5 text-right">
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
                      ? "أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق ورابطاً لتعيين كلمة مرور جديدة."
                      : "أدخل رمز التحقق المكون من 6 أرقام وكلمة المرور الجديدة."}
                  </p>
                </>
              ) : mode === "register" ? (
                <>
                  <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900">
                    إنشاء حساب كابتن جديد
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 font-medium">
                    سجّل بياناتك للبدء في إدارة لاعبي الأكاديمية وصالات التدريب.
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
            </header>

            {/* ━━━ FORGOT PASSWORD SUB-FLOW ━━━ */}
            {mode === "forgot" ? (
              forgotStep === 1 ? (
                /* Step 1: Request Code / Link */
                <form className="space-y-4 text-right" onSubmit={submitForgotStep1}>
                  <div>
                    <label
                      htmlFor="forgot-email"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      البريد الإلكتروني المسجل
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="forgot-email"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="coach@example.com"
                        autoComplete="email"
                        dir="ltr"
                      />
                      <Mail className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 flex items-center justify-center gap-2"
                    >
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
                        <span>جاري إرسال التعليمات...</span>
                      </span>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        <span>إرسال رمز ورابط الاستعادة</span>
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
                /* Step 2: Enter Code + New Password */
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
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-black text-amber-900">
                        <span>🔐</span>
                        <span>رمز التحقق التجريبي (للاختبار الفوري):</span>
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
                    </div>
                  )}

                  <div>
                    <label
                      htmlFor="forgot-otp"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      رمز التحقق (6 أرقام)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="forgot-otp"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-3 pl-3 py-2.5 text-center text-lg font-black tracking-widest text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100 font-mono"
                        type="text"
                        maxLength={6}
                        required
                        value={forgotOtp}
                        onChange={(e) =>
                          setForgotOtp(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••••"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-new-password"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      كلمة المرور الجديدة (8 أحرف على الأقل)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="forgot-new-password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type={showNewPass ? "text" : "password"}
                        minLength={8}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title={showNewPass ? "إخفاء" : "إظهار"}
                      >
                        {showNewPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Strength Bar */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-400">قوة كلمة المرور:</span>
                          <span className="text-slate-700">
                            {strengthLabels[passwordStrength - 1] || "ضعيفة"}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                          {[1, 2, 3, 4].map((step) => (
                            <div
                              key={step}
                              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                passwordStrength >= step
                                  ? strengthColors[passwordStrength - 1]
                                  : "bg-slate-200"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="forgot-confirm-password"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      تأكيد كلمة المرور الجديدة
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="forgot-confirm-password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type={showConfirmNewPass ? "text" : "password"}
                        minLength={8}
                        required
                        value={confirmNewPass}
                        onChange={(e) => setConfirmNewPass(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                        className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title={showConfirmNewPass ? "إخفاء" : "إظهار"}
                      >
                        {showConfirmNewPass ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 flex items-center justify-center gap-2"
                    >
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
                      <label
                        htmlFor="reg-name"
                        className="block text-xs font-extrabold text-slate-700 mb-1"
                      >
                        اسم الكابتن / المدرب
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="reg-name"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="مثال: كابتن أحمد محمود"
                          autoComplete="name"
                        />
                        <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-academy"
                        className="block text-xs font-extrabold text-slate-700 mb-1"
                      >
                        اسم الأكاديمية / النادي
                      </label>
                      <div className="relative flex items-center">
                        <input
                          id="reg-academy"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                          required
                          value={academyName}
                          onChange={(e) => setAcademyName(e.target.value)}
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
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-extrabold text-slate-700 mb-1"
                  >
                    {mode === "admin"
                      ? "البريد الإلكتروني للوحة التحكم (Gmail)"
                      : "البريد الإلكتروني"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="auth-email"
                      className={`w-full rounded-xl border bg-slate-50/70 pr-10 pl-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition ${
                        mode === "admin"
                          ? "border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-100"
                          : "border-slate-200 focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                      }`}
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-extrabold text-slate-700 mb-1"
                  >
                    {mode === "admin" ? "كلمة المرور الإدارية" : "كلمة المرور"}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="auth-password"
                      className={`w-full rounded-xl border bg-slate-50/70 pr-10 pl-10 py-2.5 text-sm font-semibold text-slate-900 outline-none transition ${
                        mode === "admin"
                          ? "border-amber-200 focus:border-amber-500 focus:bg-white focus:ring-3 focus:ring-amber-100"
                          : "border-slate-200 focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                      }`}
                      type={showPassword ? "text" : "password"}
                      minLength={8}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete={
                        mode === "register" ? "new-password" : "current-password"
                      }
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
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Meter in Register Mode */}
                  {mode === "register" && password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-400">قوة كلمة المرور:</span>
                        <span className="text-slate-700">
                          {strengthLabels[passwordStrength - 1] || "ضعيفة"}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              passwordStrength >= step
                                ? strengthColors[passwordStrength - 1]
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forgot Password link in Login Mode */}
                  {mode === "login" && (
                    <div className="mt-2 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="rounded border-slate-300 text-red-600 focus:ring-red-500 h-3.5 w-3.5"
                        />
                        <span>تذكرني على هذا الجهاز</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setError("");
                          setSuccess("");
                          setSuspendedDetails(null);
                          setForgotEmail(email);
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

                {/* Confirm Password in Register Mode */}
                {mode === "register" && (
                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="block text-xs font-extrabold text-slate-700 mb-1"
                    >
                      تأكيد كلمة المرور
                    </label>
                    <div className="relative flex items-center">
                      <input
                        id="reg-confirm-password"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                        type={showConfirmPassword ? "text" : "password"}
                        minLength={8}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete="new-password"
                        dir="ltr"
                      />
                      <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                        title={showConfirmPassword ? "إخفاء" : "إظهار"}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Suspended Account Alert Banner */}
                {suspendedDetails && (
                  <div
                    role="alert"
                    className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-950 space-y-2 animate-slide-up"
                  >
                    <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                      <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>الحساب موقوف من قِبل إدارة المنصة</span>
                    </div>
                    <p className="text-xs leading-relaxed text-rose-800">
                      <strong>سبب الإيقاف:</strong>{" "}
                      {suspendedDetails.reason || "مخالفة الشروط أو انتهاء فترة الصلاحية"}
                    </p>
                    <div className="text-[11px] text-rose-700 pt-1 border-t border-rose-200 flex items-center justify-between">
                      <span>لإعادة التفعيل، يرجى مراسلة الإدارة:</span>
                      <strong dir="ltr" className="select-all font-mono">
                        {suspendedDetails.adminEmail || "mg0447837@gmail.com"}
                      </strong>
                    </div>
                  </div>
                )}

                {/* Generic Error Banner */}
                {!suspendedDetails && error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 animate-slide-up flex items-center justify-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Success Banner */}
                {success && (
                  <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center text-xs font-bold text-emerald-700 animate-slide-up flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  id="submit-auth-btn"
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

            <footer className="mt-6 text-center text-[11px] font-medium text-slate-400">
              أكاديمية Re_action للكاراتيه • منظومة الأبطال {new Date().getFullYear()}
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
