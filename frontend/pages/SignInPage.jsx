"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Mail, Lock, User, CheckCircle2, ShieldCheck,
  Zap, Sparkles, Building2, Crown, KeyRound,
  RefreshCw, AlertCircle, ShieldAlert,
} from "lucide-react";

const STRENGTH_LABELS = ["ضعيفة جداً", "مقبولة", "جيدة", "قوية ومثالية"];
const STRENGTH_COLORS = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

function StrengthBar({ pw, strength = 0 }) {
  if (!pw) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-400">قوة كلمة المرور:</span>
        <span className="text-slate-700">{STRENGTH_LABELS[strength - 1] || "ضعيفة"}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-full flex-1 rounded-full transition-all duration-300 ${
              strength >= step ? STRENGTH_COLORS[strength - 1] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ErrorBanner({ msg }) {
  if (!msg) return null;
  return (
    <div
      role="alert"
      className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 animate-slide-up flex items-start gap-2"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}

function SuccessBanner({ msg }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 animate-slide-up flex items-center gap-2"
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{msg}</span>
    </div>
  );
}

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
  const [forgotStep, setForgotStep] = useState(1);
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
  const strengthColors = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  // 1. Submit Authentication (Login, Register, or Admin)
  async function submitAuth(e) {
    e.preventDefault();
    if (busy) return;
    setError(""); setSuccess(""); setSuspendedDetails(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) { setError("يرجى إدخال بريد إلكتروني صحيح"); return; }
    if (!cleanPassword || cleanPassword.length < 8) { setError("كلمة المرور يجب ألا تقل عن 8 أحرف"); return; }
    if (mode === "register") {
      const cleanName = name.trim();
      const cleanAcademy = academyName.trim();
      if (!cleanName || cleanName.length < 2) { setError("يرجى إدخال اسم الكابتن بشكل صحيح (حرفين على الأقل)"); return; }
      if (!cleanAcademy || cleanAcademy.length < 2) { setError("يرجى إدخال اسم الأكاديمية أو النادي"); return; }
      if (cleanPassword !== confirmPassword.trim()) { setError("كلمتا المرور غير متطابقتين"); return; }
      if (cleanPassword.toLowerCase() === cleanEmail.toLowerCase()) { setError("لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني"); return; }
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const regRes = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), academyName: academyName.trim(), email: cleanEmail, password: cleanPassword, confirmPassword: confirmPassword.trim() }),
        });
        const regData = await regRes.json();
        if (!regRes.ok) { setError(regData.error || "تعذر إنشاء الحساب"); setBusy(false); return; }
        setSuccess("تم إنشاء حسابك بنجاح! جاري تسجيل الدخول...");
      }
      try {
        const statusRes = await fetch("/api/auth/check-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: cleanEmail }) });
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          if (statusData?.suspended) { setSuspendedDetails(statusData); setError(`⛔ تم إيقاف هذا الحساب من قِبل إدارة المنصة. سبب الإيقاف: ${statusData.reason || "غير محدد"}`); setBusy(false); return; }
        }
      } catch { /* Non-blocking */ }
      const result = await signIn("credentials", { email: cleanEmail, password: cleanPassword, redirect: false });
      if (result?.error) {
        try {
          const recheck = await fetch("/api/auth/check-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: cleanEmail }) });
          if (recheck.ok) {
            const recheckData = await recheck.json();
            if (recheckData?.suspended) { setSuspendedDetails(recheckData); setError(`⛔ تم إيقاف هذا الحساب من قِبل إدارة المنصة. سبب الإيقاف: ${recheckData.reason || "غير محدد"}`); setBusy(false); return; }
          }
        } catch { }
        setError(mode === "admin" ? "البريد الإلكتروني أو كلمة المرور الإدارية غير صحيحة" : "البريد الإلكتروني أو كلمة المرور غير صحيحة");
        setBusy(false); return;
      }
      const session = await getSession();
      if (mode === "admin") {
        if (session?.user?.role !== "admin") { await signOut({ redirect: false }); setError("عذراً، هذا الحساب ليس لديه صلاحيات الوصول إلى لوحة تحكم المنصة الإدارية."); setBusy(false); return; }
        router.push("/admin"); router.refresh(); return;
      }
      router.push("/"); router.refresh();
    } catch { setError("تعذر الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت والمحاولة مجدداً."); setBusy(false); }
  }

  // 2. Forgot Password - Step 1: Send Code / Link
  async function submitForgotStep1(e) {
    e?.preventDefault();
    if (busy) return;
    setError(""); setSuccess(""); setSimulatedOtpNotice("");
    const cleanEmail = forgotEmail.trim().toLowerCase();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) { setError("يرجى كتابة البريد الإلكتروني بشكل صحيح"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: cleanEmail }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "تعذر إرسال رمز التحقق"); return; }
      setForgotStep(2);
      setSuccess(data.message || "إذا كان هذا البريد مسجلاً لدينا، فستصلك تعليمات استعادة كلمة المرور ورمز التحقق (تفقد صندوق الوارد أو Spam).");
      if (data.code) setSimulatedOtpNotice(data.code);
    } catch { setError("حدث خطأ في الاتصال بالخادم. يرجى المحاولة لاحقاً."); }
    finally { setBusy(false); }
  }

  // 3. Forgot Password - Step 2: Confirm OTP & Set New Password
  async function submitForgotStep2(e) {
    e.preventDefault();
    if (busy) return;
    setError(""); setSuccess("");
    if (!forgotOtp || forgotOtp.trim().length !== 6) { setError("يرجى إدخال رمز التحقق المكون من 6 أرقام"); return; }
    if (newPassword.length < 8) { setError("كلمة المرور الجديدة يجب ألا تقل عن 8 أحرف"); return; }
    if (newPassword !== confirmNewPass) { setError("كلمتا المرور غير متطابقتين"); return; }
    if (newPassword.toLowerCase() === forgotEmail.trim().toLowerCase()) { setError("لا يمكن أن تكون كلمة المرور مطابقة للبريد الإلكتروني"); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: forgotEmail.trim().toLowerCase(), code: forgotOtp.trim(), newPassword, confirmPassword: confirmNewPass }) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "تعذر إعادة تعيين كلمة المرور"); return; }
      setSuccess("تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.");
      setEmail(forgotEmail.trim().toLowerCase());
      setPassword(""); setMode("login"); setForgotStep(1);
      setForgotOtp(""); setNewPassword(""); setConfirmNewPass(""); setSimulatedOtpNotice("");
    } catch { setError("حدث خطأ أثناء حفظ كلمة المرور الجديدة."); }
    finally { setBusy(false); }
  }

  // ─── Shared Helpers ───────────────────────────────────────────────────────
  function clearAndSetMode(m) {
    setError(""); setSuccess(""); setSuspendedDetails(null); setMode(m);
  }

  const isAdmin = mode === "admin";
  const isForgot = mode === "forgot";

  // ─── Accent config per mode ────────────────────────────────────────────────
  const accent = {
    login:    { from: "from-red-600", to: "to-red-700",   ring: "focus:ring-red-100",   border: "focus:border-red-500",   btnBg: "bg-red-600 hover:bg-red-700 shadow-red-600/25" },
    register: { from: "from-red-600", to: "to-rose-600",  ring: "focus:ring-red-100",   border: "focus:border-red-500",   btnBg: "bg-red-600 hover:bg-red-700 shadow-red-600/25" },
    admin:    { from: "from-amber-500", to: "to-red-600", ring: "focus:ring-amber-100", border: "focus:border-amber-500", btnBg: "bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:brightness-110 shadow-amber-500/30" },
    forgot:   { from: "from-blue-600", to: "to-indigo-600", ring: "focus:ring-blue-100", border: "focus:border-blue-500", btnBg: "bg-red-600 hover:bg-red-700 shadow-red-600/25" },
  }[mode] || {};

  const inputClass = `w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-3 py-3 text-sm font-semibold text-slate-900 outline-none transition ${accent.border} ${accent.ring} focus:ring-3 focus:bg-white placeholder:text-slate-400 placeholder:font-normal`;
  const inputWithToggleClass = `w-full rounded-xl border border-slate-200 bg-slate-50/80 pr-10 pl-10 py-3 text-sm font-semibold text-slate-900 outline-none transition ${accent.border} ${accent.ring} focus:ring-3 focus:bg-white placeholder:text-slate-400 placeholder:font-normal`;



  return (
    <main
      className="min-h-screen flex flex-col justify-center items-center selection:bg-red-600 selection:text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #1a0a0a 100%)" }}
      dir="rtl"
    >
      {/* ── Ambient Glow ──────────────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-red-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-rose-900/15 blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[300px] h-[300px] rounded-full bg-violet-900/10 blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Main Card ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 w-full max-w-[900px] mx-auto px-4 sm:px-6 animate-fade-in-scale">
        <div className="grid md:grid-cols-[1fr_1.1fr] rounded-3xl border border-white/8 overflow-hidden shadow-2xl"
          style={{ background: "rgba(15,23,42,0.85)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
        >

          {/* ── LEFT: Brand Panel ───────────────────────────────────────── */}
          <div
            className="relative flex flex-col justify-between p-7 sm:p-10 border-b md:border-b-0 md:border-l border-white/8 overflow-hidden"
            style={{ background: "linear-gradient(160deg, rgba(30,15,30,0.9) 0%, rgba(10,5,25,0.95) 100%)" }}
          >
            {/* Subtle left glow */}
            <div className="pointer-events-none absolute top-0 right-0 w-40 h-40 rounded-full bg-red-600/10 blur-3xl" />

            <div className="relative z-10">
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className={`
                  relative flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg shrink-0
                  bg-gradient-to-br ${accent.from} ${accent.to}
                  ring-2 ring-white/20
                `}>
                  {isAdmin ? <Crown className="h-6 w-6" /> : isForgot ? <KeyRound className="h-6 w-6" /> : <Zap className="h-6 w-6 fill-white stroke-white" />}
                  <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-lg font-black tracking-tight text-white">Re_action</strong>
                    <span className={`rounded-md px-2 py-0.5 text-[9px] font-black border tracking-widest ${isAdmin ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-red-500/20 text-red-400 border-red-500/30"}`}>
                      {isAdmin ? "ADMIN" : "DOJO"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                    {isAdmin ? "بوابة الإدارة المركزية" : "منظومة إدارة أكاديمية الكاراتيه"}
                  </p>
                </div>
              </div>

              {/* Dynamic headline */}
              <div className="space-y-3">
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-extrabold ${
                  isAdmin  ? "bg-amber-950/60 border-amber-700/50 text-amber-300" :
                  isForgot ? "bg-blue-950/60 border-blue-700/50 text-blue-300"   :
                             "bg-red-950/60 border-red-800/40 text-red-400"
                }`}>
                  {isAdmin ? <Crown className="h-3.5 w-3.5" /> : isForgot ? <ShieldCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                  <span>{isAdmin ? "لوحة التحكم المركزية العليا" : isForgot ? "استعادة الحساب الآمنة" : mode === "register" ? "ابدأ تجربتك المجانية 30 يوماً" : "إدارة تدريبية ذكية"}</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                  {isAdmin  ? (<>التحكم الشامل بالمنصة.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-rose-300">متابعة الاشتراكات والأكاديميات.</span></>) :
                   isForgot ? (<>استرجع الوصول لحسابك.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">حماية كاملة لبياناتك.</span></>) :
                   mode === "register" ? (<>انضم لأبطال الكاراتيه.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-200">إدارة متطورة بلمسة واحدة.</span></>) :
                   (<>قيادة تدريبية ذكية.<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-amber-200">متابعة دقيقة للأبطال.</span></>)}
                </h2>

                <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                  {isAdmin  ? "أهلاً في بوابة المشرف العام. تابع فترات صلاحية الأكاديميات، تمديد وتجميد الاشتراكات، وسجلات العمليات الإدارية." :
                   isForgot ? "سوف نرسل لك رمز تحقق من 6 أرقام ورابطاً آمناً لتعيين كلمة مرور جديدة." :
                   mode === "register" ? "سجل حضور اللاعبين، تابع الاشتراكات، نظم بطولات الأكاديمية وصالات التدريب." :
                   "سجل حضور وغياب لاعبيك بلمسة واحدة، تابع الاشتراكات الشهرية، وشارك تقارير التدريب فوراً."}
                </p>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="relative z-10 hidden sm:flex flex-col gap-2.5 pt-7 mt-7 border-t border-white/8">
              {(isAdmin ? [
                "إدارة مركزية للكباتن والأكاديميات وفترات الصلاحية",
                "تمديد أو إيقاف أو حذف الحسابات بنقرة زر واحدة",
                "سجل تدقيق أمني فوري وتفصيلي لكافة العمليات",
              ] : isForgot ? [
                "رمز تحقق مشفر ورابط آمن بصلاحية 15 دقيقة",
                "تحديث فوري وآمن لكلمة المرور في قاعدة البيانات",
              ] : [
                "تسجيل حضور وغياب فوري بنظام اللمس السريع",
                "فصل مالي تام بين الاشتراكات الشهرية والبطولات والأدوات",
                "نسخ احتياطي واستعادة سحابية مشفرة لبياناتك",
              ]).map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 text-slate-300 text-xs">
                  <CheckCircle2 className={`h-4 w-4 shrink-0 ${isAdmin ? "text-amber-400" : isForgot ? "text-blue-400" : "text-emerald-400"}`} />
                  <span className="font-semibold">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Forms Panel ──────────────────────────────────────── */}
          <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
            <div className="w-full max-w-md space-y-5">

              {/* ── Mode Tabs ─────────────────────────────────────────────── */}
              <nav
                aria-label="نوع تسجيل الدخول"
                className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80"
              >
                {[
                  { id: "login",    label: "تسجيل الدخول" },
                  { id: "register", label: "حساب جديد" },
                  { id: "admin",    label: "لوحة التحكم", icon: <Crown className="w-3.5 h-3.5" /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    id={`tab-${tab.id}`}
                    onClick={() => clearAndSetMode(tab.id)}
                    className={`
                      py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation
                      flex items-center justify-center gap-1
                      ${(mode === tab.id || (tab.id === "login" && mode === "forgot"))
                        ? tab.id === "admin"
                          ? "bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm shadow-amber-500/20"
                          : "bg-white text-slate-900 shadow-sm border border-slate-200/60"
                        : tab.id === "admin"
                          ? "text-amber-700 hover:text-amber-900 hover:bg-amber-50/60"
                          : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                      }
                    `}
                  >
                    {tab.icon}
                    <span>{tab.label}</span>
                  </button>
                ))}
              </nav>

              {/* ── Form Header ────────────────────────────────────────────── */}
              <header className="text-right space-y-1">
                <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  {isAdmin  ? <><span>دخول لوحة التحكم</span><span className="text-amber-500">👑</span></> :
                   isForgot ? <><span>استعادة كلمة المرور</span><KeyRound className="w-5 h-5 text-red-600" /></> :
                   mode === "register" ? "إنشاء حساب كابتن جديد" :
                   "أهلاً بك مجدداً يا كابتن 👋"}
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isAdmin  ? "أدخل بريد المدير العام وكلمة المرور الإدارية لفتح لوحة التحكم." :
                   isForgot ? (forgotStep === 1 ? "أدخل بريدك الإلكتروني وسنرسل لك رمز تحقق ورابطاً لتعيين كلمة مرور جديدة." : "أدخل رمز التحقق المكون من 6 أرقام وكلمة المرور الجديدة.") :
                   mode === "register" ? "سجّل بياناتك للبدء في إدارة لاعبي الأكاديمية وصالات التدريب." :
                   "أدخل بريدك الإلكتروني وكلمة المرور للمتابعة."}
                </p>
              </header>

              {/* ═══════════════════════════════════════════════════════════
                  FORGOT PASSWORD SUB-FLOW
              ═══════════════════════════════════════════════════════════ */}
              {isForgot ? (
                forgotStep === 1 ? (
                  <form className="space-y-4 text-right" onSubmit={submitForgotStep1}>
                    <div className="form-field">
                      <label htmlFor="forgot-email" className="form-label form-label-required">البريد الإلكتروني المسجل</label>
                      <div className="input-group">
                        <input id="forgot-email" className={`${inputClass} focus:border-blue-500 focus:ring-blue-100`} type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="coach@example.com" autoComplete="email" dir="ltr" />
                        <Mail className="input-icon" />
                      </div>
                    </div>
                    <ErrorBanner msg={error} />
                    <button className={`btn btn-lg btn-full ${accent.btnBg} text-white font-black`} type="submit" disabled={busy}>
                      {busy ? <><span className="btn-spinner" /><span>جاري إرسال التعليمات...</span></> : <><Mail className="h-4 w-4" /><span>إرسال رمز ورابط الاستعادة</span></>}
                    </button>
                    <div className="text-center">
                      <button type="button" onClick={() => clearAndSetMode("login")} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">← العودة لتسجيل الدخول</button>
                    </div>
                  </form>
                ) : (
                  <form className="space-y-4 text-right" onSubmit={submitForgotStep2}>
                    {/* Email display */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="truncate min-w-0"><span className="text-slate-500 font-medium">البريد: </span><strong className="text-slate-800 font-bold" dir="ltr">{forgotEmail}</strong></div>
                      <button type="button" onClick={() => setForgotStep(1)} className="text-red-600 hover:text-red-700 font-bold underline shrink-0 mr-2 cursor-pointer">تعديل</button>
                    </div>

                    {/* OTP dev notice */}
                    {simulatedOtpNotice && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-2">
                        <div className="flex items-center gap-1.5 font-black text-amber-900"><span>🔐</span><span>رمز التحقق التجريبي (للاختبار الفوري):</span></div>
                        <div className="flex items-center justify-between gap-2 bg-white px-3 py-2 rounded-xl border border-amber-200">
                          <span className="font-mono text-xl font-black tracking-widest text-red-600 select-all">{simulatedOtpNotice}</span>
                          <button type="button" onClick={() => setForgotOtp(simulatedOtpNotice)} className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer">تعبئة تلقائياً ✍️</button>
                        </div>
                      </div>
                    )}

                    <SuccessBanner msg={success} />

                    {/* OTP input */}
                    <div className="form-field">
                      <label htmlFor="forgot-otp" className="form-label form-label-required">رمز التحقق (6 أرقام)</label>
                      <input id="forgot-otp" className="w-full rounded-xl border border-slate-200 bg-slate-50/80 py-3 px-3 text-center text-xl font-black tracking-widest text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-100 focus:bg-white font-mono" type="text" maxLength={6} required value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" dir="ltr" />
                    </div>

                    {/* New password */}
                    <div className="form-field">
                      <label htmlFor="forgot-new-password" className="form-label form-label-required">كلمة المرور الجديدة</label>
                      <div className="input-group">
                        <input id="forgot-new-password" className={inputWithToggleClass} type={showNewPass ? "text" : "password"} minLength={8} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" dir="ltr" />
                        <Lock className="input-icon" />
                        <button type="button" onClick={() => setShowNewPass(!showNewPass)} className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer" title={showNewPass ? "إخفاء" : "إظهار"} style={{ top: "50%", transform: "translateY(-50%)" }}>
                          {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <StrengthBar pw={newPassword} strength={passwordStrength} />
                    </div>

                    {/* Confirm new password */}
                    <div className="form-field">
                      <label htmlFor="forgot-confirm-password" className="form-label form-label-required">تأكيد كلمة المرور الجديدة</label>
                      <div className="input-group">
                        <input id="forgot-confirm-password" className={inputWithToggleClass} type={showConfirmNewPass ? "text" : "password"} minLength={8} required value={confirmNewPass} onChange={(e) => setConfirmNewPass(e.target.value)} placeholder="••••••••" autoComplete="new-password" dir="ltr" />
                        <Lock className="input-icon" />
                        <button type="button" onClick={() => setShowConfirmNewPass(!showConfirmNewPass)} className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer" title={showConfirmNewPass ? "إخفاء" : "إظهار"} style={{ top: "50%", transform: "translateY(-50%)" }}>
                          {showConfirmNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <ErrorBanner msg={error} />
                    <button className="btn btn-lg btn-full bg-red-600 hover:bg-red-700 text-white font-black shadow-red-600/25" type="submit" disabled={busy}>
                      {busy ? <><span className="btn-spinner" /><span>جاري حفظ كلمة المرور...</span></> : <><CheckCircle2 className="h-4 w-4" /><span>تأكيد وتغيير كلمة المرور</span></>}
                    </button>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <button type="button" onClick={() => clearAndSetMode("login")} className="font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer">← إلغاء والعودة للدخول</button>
                      <button type="button" onClick={submitForgotStep1} disabled={busy} className="font-bold text-red-600 hover:text-red-700 transition cursor-pointer flex items-center gap-1"><RefreshCw className="h-3 w-3" />إعادة إرسال الرمز</button>
                    </div>
                  </form>
                )
              ) : (
                /* ═══════════════════════════════════════════════════════════
                   MAIN AUTH FORMS (Login / Register / Admin)
                ═══════════════════════════════════════════════════════════ */
                <form className="space-y-4 text-right" onSubmit={submitAuth}>

                  {/* Register-only fields */}
                  {mode === "register" && (
                    <>
                      <div className="form-field">
                        <label htmlFor="reg-name" className="form-label form-label-required">اسم الكابتن / المدرب</label>
                        <div className="input-group">
                          <input id="reg-name" className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: كابتن أحمد محمود" autoComplete="name" />
                          <User className="input-icon" />
                        </div>
                      </div>

                      <div className="form-field">
                        <label htmlFor="reg-academy" className="form-label form-label-required">اسم الأكاديمية / النادي</label>
                        <div className="input-group">
                          <input id="reg-academy" className={inputClass} required value={academyName} onChange={(e) => setAcademyName(e.target.value)} placeholder="مثال: أكاديمية أبطال المستقبل للكاراتيه" autoComplete="organization" />
                          <Building2 className="input-icon" />
                        </div>
                        <p className="form-hint">💡 سيظهر هذا الاسم على الكروت والشهادات (يمكن تعديله لاحقاً)</p>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div className="form-field">
                    <label htmlFor="auth-email" className="form-label form-label-required">
                      {isAdmin ? "البريد الإلكتروني للوحة التحكم" : "البريد الإلكتروني"}
                    </label>
                    <div className="input-group">
                      <input
                        id="auth-email"
                        className={`${inputClass} ${isAdmin ? "border-amber-200 focus:border-amber-500 focus:ring-amber-100" : ""}`}
                        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        placeholder={isAdmin ? "mg0447837@gmail.com" : "coach@example.com"}
                        autoComplete="email" dir="ltr"
                      />
                      <Mail className={`input-icon ${isAdmin ? "text-amber-500" : ""}`} />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="form-field">
                    <label htmlFor="auth-password" className="form-label form-label-required">
                      {isAdmin ? "كلمة المرور الإدارية" : "كلمة المرور"}
                    </label>
                    <div className="input-group">
                      <input
                        id="auth-password"
                        className={`${inputWithToggleClass} ${isAdmin ? "border-amber-200 focus:border-amber-500 focus:ring-amber-100" : ""}`}
                        type={showPassword ? "text" : "password"} minLength={8} required value={password}
                        onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                        autoComplete={mode === "register" ? "new-password" : "current-password"} dir="ltr"
                      />
                      <Lock className={`input-icon ${isAdmin ? "text-amber-500" : ""}`} />
                      <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer" style={{ top: "50%", transform: "translateY(-50%)" }} title={showPassword ? "إخفاء" : "إظهار"}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Password strength — register only */}
                    {mode === "register" && <StrengthBar pw={password} strength={passwordStrength} />}

                    {/* Remember me + Forgot link — login only */}
                    {mode === "login" && (
                      <div className="mt-2.5 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                          <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="checkbox-input w-3.5 h-3.5" />
                          <span>تذكرني</span>
                        </label>
                        <button type="button" onClick={() => { setError(""); setSuccess(""); setSuspendedDetails(null); setForgotEmail(email); setMode("forgot"); setForgotStep(1); }} className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer">
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Confirm password — register only */}
                  {mode === "register" && (
                    <div className="form-field">
                      <label htmlFor="reg-confirm-password" className="form-label form-label-required">تأكيد كلمة المرور</label>
                      <div className="input-group">
                        <input id="reg-confirm-password" className={inputWithToggleClass} type={showConfirmPassword ? "text" : "password"} minLength={8} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" dir="ltr" />
                        <Lock className="input-icon" />
                        <button type="button" onClick={() => setShowConfirmPassword((p) => !p)} className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer" style={{ top: "50%", transform: "translateY(-50%)" }} title={showConfirmPassword ? "إخفاء" : "إظهار"}>
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suspended account alert */}
                  {suspendedDetails && (
                    <div role="alert" className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-950 space-y-2 animate-slide-up">
                      <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>الحساب موقوف من قِبل إدارة المنصة</span>
                      </div>
                      <p className="text-xs leading-relaxed text-rose-800"><strong>سبب الإيقاف:</strong> {suspendedDetails.reason || "مخالفة الشروط أو انتهاء فترة الصلاحية"}</p>
                      <div className="text-[11px] text-rose-700 pt-1 border-t border-rose-200 flex items-center justify-between flex-wrap gap-1">
                        <span>للتواصل مع الإدارة:</span>
                        <strong dir="ltr" className="select-all font-mono">{suspendedDetails.adminEmail || "mg0447837@gmail.com"}</strong>
                      </div>
                    </div>
                  )}

                  {!suspendedDetails && <ErrorBanner msg={error} />}
                  <SuccessBanner msg={success} />

                  {/* Submit button */}
                  <button
                    id="submit-auth-btn"
                    className={`btn btn-lg btn-full font-black text-white ${accent.btnBg}`}
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <><span className="btn-spinner" /><span>جاري المعالجة...</span></>
                    ) : isAdmin ? (
                      <><Crown className="h-4 w-4" /><span>فتح لوحة التحكم المركزية</span></>
                    ) : mode === "register" ? (
                      <><ShieldCheck className="h-4 w-4" /><span>إنشاء الحساب والدخول</span></>
                    ) : (
                      <><Zap className="h-4 w-4 fill-current" /><span>تسجيل الدخول إلى الأكاديمية</span></>
                    )}
                  </button>
                </form>
              )}

              {/* Footer */}
              <footer className="text-center text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                أكاديمية Re_action للكاراتيه • منظومة الأبطال {new Date().getFullYear()}
              </footer>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
