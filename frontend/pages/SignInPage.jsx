"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Mail, Lock, User, CheckCircle2, ShieldCheck,
  Zap, Sparkles, Building2, Crown, KeyRound,
  RefreshCw, AlertCircle, ShieldAlert, Users, CalendarCheck,
  CreditCard, Trophy, Cake, CloudUpload, ArrowRight, ChevronDown, ChevronUp,
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
      className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700 animate-slide-up flex items-start gap-2"
    >
      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

function SuccessBanner({ msg }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-700 animate-slide-up flex items-center gap-2"
    >
      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

const ACADEMY_FEATURES = [
  {
    icon: Users,
    title: "إدارة الأبطال والأحزمة",
    desc: "ملف رياضي متكامل لكل لاعب، صورته الشخصية، تاريخ ميلاده، وتدرج الأحزمة من الأبيض إلى الأسود مع سجل الترقيات.",
    badge: "ملفات الأبطال",
    color: "text-red-600 bg-red-50 border-red-200",
  },
  {
    icon: CalendarCheck,
    title: "تسجيل الحضور وكروت الواتساب",
    desc: "تحضير الحصص بلمسة واحدة، واحتساب نسب الالتزام، وتوليد كروت تقرير حضور وغياب أنيقة لمشاركتها بضغطة زر مع أولياء الأمور.",
    badge: "حضور ذكي",
    color: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    icon: CreditCard,
    title: "المحاسبة وفصل الاشتراكات",
    desc: "فصل مالي ذكي تماماً بين اشتراك الشهر، ومتبقي الأدوات والمشتريات والبدل، ورسوم الفعاليات بدون أي اختلاط أو أخطاء حسابية.",
    badge: "فصل مالي",
    color: "text-sky-600 bg-sky-50 border-sky-200",
  },
  {
    icon: Trophy,
    title: "إدارة البطولات والمعسكرات",
    desc: "تنظيم المسابقات والرحلات واختبارات الأحزمة، وتحديد المشتركين، ورسوم كل بطل، ومتابعة المتحصلات المالية بسهولة.",
    badge: "بطولات وفعاليات",
    color: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    icon: Cake,
    title: "مركز احتفالات أعياد الميلاد",
    desc: "تنبيه تلقائي بأعياد ميلاد الأبطال اليوم وغداً، وتوليد كروت تهنئة رسمية مصممة خصيصاً لمشاركتها عبر واتساب لإسعاد اللاعبين.",
    badge: "تهنئة آلية",
    color: "text-rose-600 bg-rose-50 border-rose-200",
  },
  {
    icon: CloudUpload,
    title: "النسخ الاحتياطي السحابي الفوري",
    desc: "حفظ فوري ومشفر لكافة بيانات ناديك في حسابك السحابي بضغطة واحدة، مع استعادة سريعة لحماية سجلات الأكاديمية بنسبة 100%.",
    badge: "أمان سحابي",
    color: "text-indigo-600 bg-indigo-50 border-indigo-200",
  },
];

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

  const [showFeaturesMobile, setShowFeaturesMobile] = useState(false);

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

  function clearAndSetMode(m) {
    setError(""); setSuccess(""); setSuspendedDetails(null); setMode(m);
  }

  const isAdmin = mode === "admin";
  const isForgot = mode === "forgot";

  const accent = {
    login:    { from: "from-red-600", to: "to-rose-700", ring: "focus:ring-red-100", border: "focus:border-red-500", btnBg: "bg-red-600 hover:bg-red-700 shadow-red-600/25" },
    register: { from: "from-red-600", to: "to-rose-600", ring: "focus:ring-red-100", border: "focus:border-red-500", btnBg: "bg-red-600 hover:bg-red-700 shadow-red-600/25" },
    admin:    { from: "from-amber-500", to: "to-red-600", ring: "focus:ring-amber-100", border: "focus:border-amber-500", btnBg: "bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:brightness-110 shadow-amber-500/30" },
    forgot:   { from: "from-blue-600", to: "to-indigo-600", ring: "focus:ring-blue-100", border: "focus:border-blue-500", btnBg: "bg-red-600 hover:bg-red-700 shadow-red-600/25" },
  }[mode] || {};

  const inputClass = `w-full rounded-2xl border border-slate-200 bg-slate-50/80 pr-10 pl-3.5 py-3 text-sm font-semibold text-slate-900 outline-none transition ${accent.border} ${accent.ring} focus:ring-3 focus:bg-white placeholder:text-slate-400 placeholder:font-normal`;
  const inputWithToggleClass = `w-full rounded-2xl border border-slate-200 bg-slate-50/80 pr-10 pl-11 py-3 text-sm font-semibold text-slate-900 outline-none transition ${accent.border} ${accent.ring} focus:ring-3 focus:bg-white placeholder:text-slate-400 placeholder:font-normal`;

  return (
    <main
      className="min-h-screen flex flex-col justify-between selection:bg-red-600 selection:text-white relative overflow-x-hidden bg-slate-950 font-sans"
      dir="rtl"
    >
      {/* ── Ambient Background Accents ──────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-red-600/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-rose-900/15 blur-[100px]" />
        <div className="absolute top-1/2 left-0 w-[350px] h-[350px] rounded-full bg-indigo-900/15 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Main Container ─────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 flex flex-col justify-center">

        {/* ── Top Header Brand Strip (Ultra-crisp on Mobile & Desktop) ────── */}
        <header className="flex items-center justify-between gap-3 mb-4 sm:mb-7">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-700 text-white shadow-lg shadow-red-600/30 ring-2 ring-white/10 shrink-0">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 fill-white stroke-white" />
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-950" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cairo text-lg sm:text-2xl font-black text-white tracking-tight">
                  DOJO PRO
                </span>
                <span className="rounded-full bg-red-600/20 border border-red-500/40 text-red-400 px-2 py-0.5 text-[10px] font-black">
                  دوجو برو 🥋
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-400">
                المنظومة الاحترافية الشاملة لإدارة أكاديميات الكاراتيه والأبطال
              </p>
            </div>
          </div>

          {/* Quick Info Tag on Desktop */}
          <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-bold text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>نظام إداري معتمد للأندية والأكاديميات</span>
          </div>
        </header>

        {/* ── Core Layout Grid (Desktop 2-Col / Mobile Streamlined Stack) ─── */}
        <div className="grid lg:grid-cols-[1fr_1.05fr] rounded-3xl border border-white/10 overflow-hidden shadow-2xl bg-slate-900/80 backdrop-blur-xl">

          {/* ═════════════════════════════════════════════════════════════════
              PANEL 1: Interactive Features Showcase (شرح ما تقدمه المنظومة)
          ═════════════════════════════════════════════════════════════════ */}
          <section className="relative flex flex-col justify-between p-5 sm:p-8 lg:p-10 border-b lg:border-b-0 lg:border-l border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-950/95 to-slate-900/90 text-white order-2 lg:order-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-red-950/70 border border-red-800/50 px-3 py-1 text-xs font-extrabold text-red-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>ماذا تقدم منظومة DOJO PRO للأكاديمية؟</span>
                </div>

                {/* Mobile accordion toggle button */}
                <button
                  type="button"
                  onClick={() => setShowFeaturesMobile(!showFeaturesMobile)}
                  className="lg:hidden text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <span>{showFeaturesMobile ? "طي المميزات" : "عرض كل المميزات"}</span>
                  {showFeaturesMobile ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  منظومة سحابية متطورة مصممة خصيصاً{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">
                    لكباتن ومدربي الكاراتيه
                  </span>
                </h2>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed max-w-lg">
                  تحكم كامل في الحضور والغياب، الاشتراكات والمشتريات، البطولات والأحزمة، مع تواصل فوري مع أولياء الأمور عبر واتساب.
                </p>
              </div>

              {/* Feature Cards Grid (Always visible on desktop, toggleable on mobile) */}
              <div className={`${showFeaturesMobile ? "grid" : "hidden lg:grid"} grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2`}>
                {ACADEMY_FEATURES.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <article
                      key={idx}
                      className="rounded-2xl border border-white/5 bg-white/[0.03] p-3.5 transition-all hover:bg-white/[0.06] hover:border-white/10"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/20 text-red-400 border border-red-500/30">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                          {feat.badge}
                        </span>
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-200 font-cairo">
                        {feat.title}
                      </h3>
                      <p className="mt-1 text-[11px] text-slate-400 leading-relaxed font-normal">
                        {feat.desc}
                      </p>
                    </article>
                  );
                })}
              </div>

              {/* Quick Summary Pill for Mobile when collapsed */}
              {!showFeaturesMobile && (
                <div className="lg:hidden flex flex-wrap gap-1.5 pt-1">
                  {["حضور بلمسة", "فصل مالي تام", "كروت واتساب", "أعياد ميلاد", "نسخ سحابي", "بطولات وأحزمة"].map((tag, i) => (
                    <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom trust statement */}
            <div className="pt-4 mt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span>تطوير وإشراف: <strong className="text-slate-200">محمد غانم</strong></span>
              <span>نظام آمن ومشفر 100% 🛡️</span>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
              PANEL 2: Auth Forms (Login / Register / Admin / Forgot)
          ═════════════════════════════════════════════════════════════════ */}
          <section className="p-5 sm:p-8 lg:p-10 bg-white flex flex-col justify-center order-1 lg:order-2">
            <div className="w-full max-w-md mx-auto space-y-4 sm:space-y-5">

              {/* ── Segmented Mode Switcher (The 3 Main Tabs) ───────────── */}
              <nav
                aria-label="نوع تسجيل الدخول"
                className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/90 shadow-2xs"
              >
                {[
                  { id: "login", label: "تسجيل الدخول", icon: <Zap className="w-3.5 h-3.5" /> },
                  { id: "register", label: "حساب جديد", icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: "admin", label: "لوحة التحكم", icon: <Crown className="w-3.5 h-3.5 text-amber-500" /> },
                ].map((tab) => {
                  const isActive = (mode === tab.id || (tab.id === "login" && mode === "forgot"));
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`tab-${tab.id}`}
                      onClick={() => clearAndSetMode(tab.id)}
                      className={`
                        py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation
                        flex items-center justify-center gap-1.5
                        ${isActive
                          ? tab.id === "admin"
                            ? "bg-gradient-to-r from-amber-500 to-red-600 text-white shadow-sm shadow-amber-500/25"
                            : "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                          : tab.id === "admin"
                            ? "text-amber-800 hover:text-amber-950 hover:bg-amber-50/70"
                            : "text-slate-500 hover:text-slate-900 hover:bg-white/60"
                        }
                      `}
                    >
                      {tab.icon}
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* ── Dynamic Form Header ─────────────────────────────────── */}
              <header className="text-right space-y-1">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <span>دخول لوحة التحكم المركزية</span>
                      <Crown className="w-5 h-5 text-amber-500" />
                    </>
                  ) : isForgot ? (
                    <>
                      <span>استعادة كلمة المرور</span>
                      <KeyRound className="w-5 h-5 text-red-600" />
                    </>
                  ) : mode === "register" ? (
                    "إنشاء حساب كابتن وأكاديمية جديدة ✨"
                  ) : (
                    "مرحباً بك يا كابتن 👋"
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {isAdmin
                    ? "أدخل البريد الإداري وكلمة المرور الخاصة بإدارة منصة الأكاديميات."
                    : isForgot
                    ? (forgotStep === 1
                        ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق سريعاً."
                        : "أدخل رمز التحقق المكون من 6 أرقام لتعيين كلمة مرور جديدة.")
                    : mode === "register"
                    ? "سجّل بياناتك وبيانات الأكاديمية لبدء إدارة الحضور والاشتراكات فوراً."
                    : "سجّل دخولك للمتابعة وإدارة حصص واشتراكات الأبطال اليوم."}
                </p>
              </header>

              {/* ── Forgot Password Flow ────────────────────────────────── */}
              {isForgot ? (
                forgotStep === 1 ? (
                  <form className="space-y-3.5 text-right" onSubmit={submitForgotStep1}>
                    <div>
                      <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                        البريد الإلكتروني المسجل <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-email"
                          className={inputClass}
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="coach@example.com"
                          autoComplete="email"
                          dir="ltr"
                        />
                        <Mail className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <ErrorBanner msg={error} />

                    <button
                      className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-sm shadow-red-600/25 active-press transition cursor-pointer flex items-center justify-center gap-2"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          <span>جاري إرسال الرمز...</span>
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          <span>إرسال رمز الاستعادة</span>
                        </>
                      )}
                    </button>

                    <div className="text-center pt-1">
                      <button
                        type="button"
                        onClick={() => clearAndSetMode("login")}
                        className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      >
                        ← العودة لتسجيل الدخول
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="space-y-3.5 text-right" onSubmit={submitForgotStep2}>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="truncate min-w-0">
                        <span className="text-slate-500 font-medium">البريد: </span>
                        <strong className="text-slate-800 font-bold" dir="ltr">{forgotEmail}</strong>
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
                      <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-black text-amber-900">
                          <span>🔐</span>
                          <span>رمز التحقق السريع للاختبار:</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-xl border border-amber-200">
                          <span className="font-mono text-lg font-black tracking-widest text-red-600 select-all">
                            {simulatedOtpNotice}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForgotOtp(simulatedOtpNotice)}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] transition cursor-pointer"
                          >
                            تعبئة تلقائياً ✍️
                          </button>
                        </div>
                      </div>
                    )}

                    <SuccessBanner msg={success} />

                    <div>
                      <label htmlFor="forgot-otp" className="block text-xs font-bold text-slate-700 mb-1.5">
                        رمز التحقق (6 أرقام) <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="forgot-otp"
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 px-3 text-center text-xl font-black tracking-widest text-slate-900 outline-none transition focus:border-red-500 focus:ring-3 focus:ring-red-100 focus:bg-white font-mono"
                        type="text"
                        maxLength={6}
                        required
                        value={forgotOtp}
                        onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="••••••"
                        dir="ltr"
                      />
                    </div>

                    <div>
                      <label htmlFor="forgot-new-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                        كلمة المرور الجديدة <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-new-password"
                          className={inputWithToggleClass}
                          type={showNewPass ? "text" : "password"}
                          minLength={8}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          dir="ltr"
                        />
                        <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title={showNewPass ? "إخفاء" : "إظهار"}
                        >
                          {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <StrengthBar pw={newPassword} strength={passwordStrength} />
                    </div>

                    <div>
                      <label htmlFor="forgot-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                        تأكيد كلمة المرور الجديدة <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-confirm-password"
                          className={inputWithToggleClass}
                          type={showConfirmNewPass ? "text" : "password"}
                          minLength={8}
                          required
                          value={confirmNewPass}
                          onChange={(e) => setConfirmNewPass(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          dir="ltr"
                        />
                        <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPass(!showConfirmNewPass)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title={showConfirmNewPass ? "إخفاء" : "إظهار"}
                        >
                          {showConfirmNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <ErrorBanner msg={error} />

                    <button
                      className="w-full h-12 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-sm shadow-red-600/25 active-press transition cursor-pointer flex items-center justify-center gap-2"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          <span>جاري حفظ كلمة المرور...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>تأكيد وتغيير كلمة المرور</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => clearAndSetMode("login")}
                        className="font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                      >
                        ← إلغاء والعودة للدخول
                      </button>
                      <button
                        type="button"
                        onClick={submitForgotStep1}
                        disabled={busy}
                        className="font-bold text-red-600 hover:text-red-700 transition cursor-pointer flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>إعادة إرسال الرمز</span>
                      </button>
                    </div>
                  </form>
                )
              ) : (
                /* ── Main Auth Form (Login / Register / Admin) ───────────── */
                <form className="space-y-3.5 text-right" onSubmit={submitAuth}>

                  {/* Register-only: Name & Academy */}
                  {mode === "register" && (
                    <>
                      <div>
                        <label htmlFor="reg-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                          اسم الكابتن / المدرب <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="reg-name"
                            className={inputClass}
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="مثال: كابتن أحمد محمود"
                            autoComplete="name"
                          />
                          <User className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="reg-academy" className="block text-xs font-bold text-slate-700 mb-1.5">
                          اسم الأكاديمية أو النادي <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="reg-academy"
                            className={inputClass}
                            required
                            value={academyName}
                            onChange={(e) => setAcademyName(e.target.value)}
                            placeholder="مثال: أكاديمية الأبطال للكاراتيه"
                            autoComplete="organization"
                          />
                          <Building2 className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                        <p className="mt-1 text-[11px] text-slate-400 font-medium">
                          💡 يظهر الاسم تلقائياً على كروت الحضور والشهادات (قابل للتعديل).
                        </p>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div>
                    <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isAdmin ? "البريد الإلكتروني للإدارة" : "البريد الإلكتروني"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-email"
                        className={`${inputClass} ${isAdmin ? "border-amber-200 focus:border-amber-500 focus:ring-amber-100" : ""}`}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isAdmin ? "mg0447837@gmail.com" : "coach@example.com"}
                        autoComplete="email"
                        dir="ltr"
                      />
                      <Mail className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isAdmin ? "text-amber-500" : "text-slate-400"}`} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isAdmin ? "كلمة المرور الإدارية" : "كلمة المرور"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        className={`${inputWithToggleClass} ${isAdmin ? "border-amber-200 focus:border-amber-500 focus:ring-amber-100" : ""}`}
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        dir="ltr"
                      />
                      <Lock className={`pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isAdmin ? "text-amber-500" : "text-slate-400"}`} />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title={showPassword ? "إخفاء" : "إظهار"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {mode === "register" && <StrengthBar pw={password} strength={passwordStrength} />}

                    {mode === "login" && (
                      <div className="mt-2.5 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-3.5 h-3.5 cursor-pointer"
                          />
                          <span>تذكرني</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setError(""); setSuccess(""); setSuspendedDetails(null);
                            setForgotEmail(email); setMode("forgot"); setForgotStep(1);
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline transition cursor-pointer"
                        >
                          نسيت كلمة المرور؟
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Register-only: Confirm password */}
                  {mode === "register" && (
                    <div>
                      <label htmlFor="reg-confirm-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                        تأكيد كلمة المرور <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="reg-confirm-password"
                          className={inputWithToggleClass}
                          type={showConfirmPassword ? "text" : "password"}
                          minLength={8}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="new-password"
                          dir="ltr"
                        />
                        <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((p) => !p)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title={showConfirmPassword ? "إخفاء" : "إظهار"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Suspended account alert banner */}
                  {suspendedDetails && (
                    <div role="alert" className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 text-rose-950 space-y-2 animate-slide-up">
                      <div className="flex items-center gap-2 font-black text-rose-900 text-sm">
                        <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                        <span>الحساب موقوف من قِبل إدارة المنصة</span>
                      </div>
                      <p className="text-xs leading-relaxed text-rose-800">
                        <strong>سبب الإيقاف:</strong> {suspendedDetails.reason || "مخالفة الشروط أو انتهاء فترة الصلاحية"}
                      </p>
                      <div className="text-[11px] text-rose-700 pt-1.5 border-t border-rose-200 flex items-center justify-between flex-wrap gap-1">
                        <span>للتواصل مع الإدارة:</span>
                        <strong dir="ltr" className="select-all font-mono font-bold">{suspendedDetails.adminEmail || "mg0447837@gmail.com"}</strong>
                      </div>
                    </div>
                  )}

                  {!suspendedDetails && <ErrorBanner msg={error} />}
                  <SuccessBanner msg={success} />

                  {/* Submit Button */}
                  <button
                    id="submit-auth-btn"
                    className={`w-full h-12 rounded-2xl font-black text-white text-xs sm:text-sm active-press transition cursor-pointer flex items-center justify-center gap-2 shadow-sm ${accent.btnBg}`}
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? (
                      <>
                        <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        <span>جاري المعالجة...</span>
                      </>
                    ) : isAdmin ? (
                      <>
                        <Crown className="h-4 w-4" />
                        <span>فتح لوحة التحكم المركزية</span>
                      </>
                    ) : mode === "register" ? (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>إنشاء الحساب وبدء التجربة المجانية</span>
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 fill-current" />
                        <span>تسجيل الدخول إلى الأكاديمية 🥋</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Bottom Quick Switch Hint */}
              <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                {mode === "login" ? (
                  <span>
                    ليس لديك حساب كابتن بعد؟{" "}
                    <button
                      type="button"
                      onClick={() => clearAndSetMode("register")}
                      className="font-black text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      أنشئ حسابك الآن مجاناً
                    </button>
                  </span>
                ) : mode === "register" ? (
                  <span>
                    لديك حساب بالفعل؟{" "}
                    <button
                      type="button"
                      onClick={() => clearAndSetMode("login")}
                      className="font-black text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      تسجيل الدخول
                    </button>
                  </span>
                ) : (
                  <span>
                    العودة لبوابة الكباتن؟{" "}
                    <button
                      type="button"
                      onClick={() => clearAndSetMode("login")}
                      className="font-black text-red-600 hover:text-red-700 underline cursor-pointer"
                    >
                      دخول الكابتن
                    </button>
                  </span>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-4 text-center text-xs text-slate-500 border-t border-white/5">
        <span>منظومة </span>
        <strong className="text-slate-300 font-bold">DOJO PRO (دوجو برو)</strong>
        <span> • جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
