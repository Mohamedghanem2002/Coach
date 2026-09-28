"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useSession, getSession, signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye, EyeOff, Mail, Lock, User, CheckCircle2, ShieldCheck,
  Zap, Sparkles, Building2, Crown, KeyRound,
  RefreshCw, AlertCircle, ShieldAlert, Users, CalendarCheck,
  CreditCard, Trophy, CloudUpload, Phone, Copy, Check,
  ExternalLink, ChevronDown, ChevronUp,
} from "lucide-react";

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

const STRENGTH_LABELS = ["ضعيفة جداً", "مقبولة", "جيدة", "قوية وممتازة"];
const STRENGTH_COLORS = ["bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

function StrengthBar({ pw, strength = 0 }) {
  if (!pw) return null;
  return (
    <div className="mt-1.5 space-y-1">
      <div className="flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-400">قوة كلمة المرور:</span>
        <span className="text-slate-600">{STRENGTH_LABELS[strength - 1] || "ضعيفة"}</span>
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
      className="rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-800 animate-slide-up space-y-1.5"
    >
      <div className="flex items-start gap-2 font-bold text-rose-700">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
        <span className="leading-relaxed">{msg}</span>
      </div>
      <div className="pt-1.5 border-t border-rose-200/80 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <span className="text-rose-900 font-semibold">تحتاج مساعدة فورية؟</span>
        <div className="flex items-center gap-2">
          <a
            href="tel:01552488179"
            className="inline-flex items-center gap-1 font-mono font-bold text-rose-700 hover:text-rose-900 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs"
            dir="ltr"
            title="اتصال هاتفي مباشر"
          >
            <Phone className="w-3 h-3 text-red-600" />
            <span>0155 248 8179</span>
          </a>
          <a
            href="https://wa.me/201552488179"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs"
            title="مراسلة واتساب فورية"
          >
            <WhatsAppIcon className="w-3 h-3" />
            <span>واتساب</span>
          </a>
        </div>
      </div>
    </div>
  );
}

function SuccessBanner({ msg }) {
  if (!msg) return null;
  return (
    <div
      role="status"
      className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-3 text-xs font-bold text-emerald-700 animate-slide-up flex items-center gap-2"
    >
      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
      <span className="leading-relaxed">{msg}</span>
    </div>
  );
}

// 5 Concise, High-Value Feature Points matching the site tone
const CONCISE_FEATURES = [
  {
    icon: Users,
    title: "إدارة الأبطال والأحزمة",
    desc: "ملف رياضي شامل لكل لاعب، صورته، وتوثيق دقيق لتدرج وترقيات الأحزمة.",
  },
  {
    icon: CalendarCheck,
    title: "تسجيل الحضور وكروت الواتساب",
    desc: "تحضير بلمسة واحدة، واحتساب نسب الالتزام، وإرسال كروت حضور ومتابعة لأولياء الأمور.",
  },
  {
    icon: CreditCard,
    title: "المحاسبة وفصل الاشتراكات",
    desc: "فصل مالي ذكي تماماً بين اشتراك الشهر ومتبقي المشتريات والبدل ورسوم الفعاليات.",
  },
  {
    icon: Trophy,
    title: "إدارة البطولات والمعسكرات",
    desc: "تنظيم المسابقات والرحلات والاختبارات، ومتابعة المشتركين والرسوم بدون أخطاء.",
  },
  {
    icon: CloudUpload,
    title: "النسخ السحابي المشفر",
    desc: "حفظ فوري وآمن لكافة بيانات ناديك في السحابة مع استعادة سريعة بضغطة زر واحدة.",
  },
];

const CONTACT_NUMBERS = [
  {
    number: "01552488179",
    display: "0155 248 8179",
    rawWhatsApp: "201552488179",
    label: "م. محمد غانم (الدعم الفني)",
  },
  {
    number: "01028138408",
    display: "0102 813 8408",
    rawWhatsApp: "201028138408",
    label: "دعم الكباتن والأكاديميات",
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
  const [copiedNumber, setCopiedNumber] = useState(null);

  const handleCopy = (num) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

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
  const [phone, setPhone] = useState("");
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
          body: JSON.stringify({
            name: name.trim(),
            academyName: academyName.trim(),
            email: cleanEmail,
            password: cleanPassword,
            confirmPassword: confirmPassword.trim(),
            phone: phone.trim(),
          }),
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
      setSuccess(data.message || "إذا كان هذا البريد مسجلاً لدينا، فستصلك تعليمات استعادة كلمة المرور ورمز التحقق.");
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

  const inputClass = "w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-10 pl-3.5 py-2.5 sm:py-3 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-3 focus:ring-red-50 placeholder:text-slate-400 placeholder:font-normal";
  const inputWithToggleClass = "w-full rounded-xl border border-slate-200 bg-slate-50/60 pr-10 pl-11 py-2.5 sm:py-3 text-sm font-semibold text-slate-900 outline-none transition focus:bg-white focus:border-red-500 focus:ring-3 focus:ring-red-50 placeholder:text-slate-400 placeholder:font-normal";

  return (
    <main
      className="min-h-screen flex flex-col justify-between selection:bg-red-500 selection:text-white bg-slate-50 text-slate-900 font-sans"
      dir="rtl"
    >
      {/* ── Top Header: هادئ ومتناسق مع تصميم الموقع ── */}
      <header className="w-full max-w-5xl mx-auto px-4 pt-5 sm:pt-7 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
            <Zap className="h-5 w-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-cairo text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                CoachMaster
              </span>
              <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                كوتش ماستر 🥋
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
              المنظومة السحابية الذكية لإدارة أكاديميات الكاراتيه والأبطال
            </p>
          </div>
        </div>

        {/* كبسولة الدعم الفني السريع في الهيدر */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-white border border-slate-200/90 px-3 py-1.5 rounded-full shadow-2xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-slate-500">الدعم الفني:</span>
          <a
            href="tel:01552488179"
            className="font-mono font-bold text-slate-800 hover:text-red-600 transition"
            dir="ltr"
          >
            0155 248 8179
          </a>
          <span className="text-slate-300">|</span>
          <a
            href="https://wa.me/201552488179"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
          >
            <WhatsAppIcon className="h-3 w-3" />
            <span>واتساب</span>
          </a>
        </div>
      </header>

      {/* ── Main Container: بطاقة هادئة وبيضاء بنفس طراز لوحة التحكم ── */}
      <div className="w-full max-w-5xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden grid lg:grid-cols-[1.1fr_1.3fr]">

          {/* ═════════════════════════════════════════════════════════════════
              العمود 1: شرح مختصر وهادئ لما تقدمه المنظومة للأكاديمية
          ═════════════════════════════════════════════════════════════════ */}
          <section className="bg-slate-50/70 border-b lg:border-b-0 lg:border-l border-slate-200/80 p-5 sm:p-7 flex flex-col justify-between space-y-5 order-2 lg:order-1">
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5 text-red-600" />
                  <span>مميزات كوتش ماستر</span>
                </span>

                {/* زر طي/عرض للهواتف */}
                <button
                  type="button"
                  onClick={() => setShowFeaturesMobile(!showFeaturesMobile)}
                  className="lg:hidden text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showFeaturesMobile ? "طي المميزات" : "عرض المميزات"}</span>
                  {showFeaturesMobile ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>

              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  ماذا تقدم المنظومة للأكاديمية والكابتن؟
                </h2>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  أدوات احترافية مبسطة تختصر وقتك وتوفر نظاماً دقيقاً لإدارة ناديك الرياضي:
                </p>
              </div>

              {/* قائمة المميزات المختصرة (ظاهرة دائمًا على الكمبيوتر، قابلة للطي على الموبايل) */}
              <div className={`${showFeaturesMobile ? "block" : "hidden lg:block"} space-y-2.5 pt-1`}>
                {CONCISE_FEATURES.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 shrink-0 border border-red-100">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-bold text-slate-800">
                          {feat.title}
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed font-normal">
                          {feat.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* شريط موجز للموبايل عند الطي */}
              {!showFeaturesMobile && (
                <div className="lg:hidden flex flex-wrap gap-1.5 pt-1">
                  {["حضور بلمسة", "فصل مالي تام", "كروت واتساب", "أحزمة وبطولات", "نسخ سحابي"].map((tag, i) => (
                    <span key={i} className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600">
                      ✓ {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* سطر الثقة أسفل العمود */}
            <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-[11px] text-slate-500">
              <span>تطوير وإشراف: <strong className="text-slate-700">محمد غانم</strong></span>
              <span className="text-emerald-700 font-bold">بيانات مشفرة 100% 🛡️</span>
            </div>
          </section>

          {/* ═════════════════════════════════════════════════════════════════
              العمود 2: نموذج تسجيل الدخول / حساب جديد / الإدارة (سهل ومريح)
          ═════════════════════════════════════════════════════════════════ */}
          <section className="p-5 sm:p-7 lg:p-8 bg-white flex flex-col justify-center order-1 lg:order-2">
            <div className="w-full max-w-md mx-auto space-y-4">

              {/* ── التبويبات الثلاثة الرئيسية ── */}
              <nav
                aria-label="نوع تسجيل الدخول"
                className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80"
              >
                {[
                  { id: "login", label: "تسجيل الدخول", icon: <Zap className="w-3.5 h-3.5" /> },
                  { id: "register", label: "حساب جديد", icon: <Sparkles className="w-3.5 h-3.5" /> },
                  { id: "admin", label: "لوحة التحكم", icon: <Crown className="w-3.5 h-3.5" /> },
                ].map((tab) => {
                  const isActive = (mode === tab.id || (tab.id === "login" && mode === "forgot"));
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      id={`tab-${tab.id}`}
                      onClick={() => clearAndSetMode(tab.id)}
                      className={`
                        py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer
                        flex items-center justify-center gap-1.5
                        ${isActive
                          ? tab.id === "admin"
                            ? "bg-amber-500 text-white shadow-xs"
                            : "bg-white text-slate-900 shadow-xs border border-slate-200/90"
                          : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
                        }
                      `}
                    >
                      {tab.icon}
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* ── عنوان النموذج التفاعلي ── */}
              <header className="text-right space-y-0.5">
                <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                  {isAdmin ? (
                    <>
                      <span>دخول لوحة التحكم المركزية</span>
                      <Crown className="w-4 h-4 text-amber-500" />
                    </>
                  ) : isForgot ? (
                    <>
                      <span>استعادة كلمة المرور</span>
                      <KeyRound className="w-4 h-4 text-red-600" />
                    </>
                  ) : mode === "register" ? (
                    "إنشاء حساب كابتن جديد ✨"
                  ) : (
                    "مرحباً بك يا كابتن 👋"
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  {isAdmin
                    ? "أدخل البريد الإداري وكلمة المرور لإدارة منصة الأكاديميات."
                    : isForgot
                    ? (forgotStep === 1
                        ? "أدخل بريدك الإلكتروني المسجل وسنرسل لك رمز تحقق سريعاً."
                        : "أدخل رمز التحقق المكون من 6 أرقام لتعيين كلمة مرور جديدة.")
                    : mode === "register"
                    ? "سجّل بياناتك وبيانات الأكاديمية لبدء إدارة الحضور والاشتراكات فوراً."
                    : "سجّل دخولك للمتابعة وإدارة حصص واشتراكات الأبطال اليوم."}
                </p>
              </header>

              {/* ── استعادة كلمة المرور ── */}
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
                      className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs active-press transition cursor-pointer flex items-center justify-center gap-2"
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
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
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
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-900">
                          <span>🔐</span>
                          <span>رمز التحقق السريع للاختبار:</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                          <span className="font-mono text-base font-black tracking-widest text-red-600 select-all">
                            {simulatedOtpNotice}
                          </span>
                          <button
                            type="button"
                            onClick={() => setForgotOtp(simulatedOtpNotice)}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-slate-100 px-2 py-0.5 rounded cursor-pointer"
                          >
                            تعبئة تلقائية
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label htmlFor="forgot-otp" className="block text-xs font-bold text-slate-700 mb-1.5">
                        رمز التحقق (6 أرقام) <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-otp"
                          className={`${inputClass} tracking-widest font-mono text-center text-base`}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          required
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="------"
                          dir="ltr"
                        />
                        <KeyRound className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="forgot-new-pass" className="block text-xs font-bold text-slate-700 mb-1.5">
                        كلمة المرور الجديدة <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-new-pass"
                          className={inputWithToggleClass}
                          type={showNewPass ? "text" : "password"}
                          minLength={8}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="8 أحرف على الأقل"
                          autoComplete="new-password"
                          dir="ltr"
                        />
                        <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowNewPass((p) => !p)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="forgot-confirm-pass" className="block text-xs font-bold text-slate-700 mb-1.5">
                        تأكيد كلمة المرور الجديدة <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="forgot-confirm-pass"
                          className={inputWithToggleClass}
                          type={showConfirmNewPass ? "text" : "password"}
                          minLength={8}
                          required
                          value={confirmNewPass}
                          onChange={(e) => setConfirmNewPass(e.target.value)}
                          placeholder="تأكيد كلمة المرور"
                          autoComplete="new-password"
                          dir="ltr"
                        />
                        <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <button
                          type="button"
                          onClick={() => setShowConfirmNewPass((p) => !p)}
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        >
                          {showConfirmNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <ErrorBanner msg={error} />
                    <SuccessBanner msg={success} />

                    <button
                      className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active-press transition cursor-pointer flex items-center justify-center gap-2"
                      type="submit"
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          <span>جاري الحفظ...</span>
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
                /* ── نموذج الدخول / التسجيل / الإدارة الأساسي ── */
                <form className="space-y-3.5 text-right" onSubmit={submitAuth}>

                  {/* في حالة حساب جديد: الاسم واسم الأكاديمية ورقم الهاتف */}
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
                      </div>

                      <div>
                        <label htmlFor="reg-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                          رقم الهاتف / واتساب <span className="text-slate-400 font-normal">(اختياري للدعم والتفعيل)</span>
                        </label>
                        <div className="relative">
                          <input
                            id="reg-phone"
                            className={inputClass}
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="01xxxxxxxxx"
                            autoComplete="tel"
                            dir="ltr"
                          />
                          <Phone className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* البريد الإلكتروني */}
                  <div>
                    <label htmlFor="auth-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isAdmin ? "البريد الإلكتروني للإدارة" : "البريد الإلكتروني"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-email"
                        className={inputClass}
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={isAdmin ? "mg0447837@gmail.com" : "coach@example.com"}
                        autoComplete="email"
                        dir="ltr"
                      />
                      <Mail className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                  </div>

                  {/* كلمة المرور */}
                  <div>
                    <label htmlFor="auth-password" className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isAdmin ? "كلمة المرور الإدارية" : "كلمة المرور"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="auth-password"
                        className={inputWithToggleClass}
                        type={showPassword ? "text" : "password"}
                        minLength={8}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        autoComplete={mode === "register" ? "new-password" : "current-password"}
                        dir="ltr"
                      />
                      <Lock className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title={showPassword ? "إخفاء" : "إظهار"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {mode === "register" && <StrengthBar pw={password} strength={passwordStrength} />}

                    {mode === "login" && (
                      <div className="mt-2 flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
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

                  {/* في حالة حساب جديد: تأكيد كلمة المرور */}
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
                          className="absolute left-3.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:text-slate-700 transition cursor-pointer"
                          title={showConfirmPassword ? "إخفاء" : "إظهار"}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* تنبيه الحساب الموقوف إن وجد */}
                  {suspendedDetails && (
                    <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-rose-950 space-y-1.5 animate-slide-up">
                      <div className="flex items-center gap-2 font-black text-rose-900 text-xs">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>الحساب موقوف من قِبل إدارة المنصة</span>
                      </div>
                      <p className="text-xs leading-relaxed text-rose-800">
                        <strong>سبب الإيقاف:</strong> {suspendedDetails.reason || "مخالفة الشروط أو انتهاء فترة الصلاحية"}
                      </p>
                      <div className="text-[11px] text-rose-700 pt-1 border-t border-rose-200 flex items-center justify-between flex-wrap gap-1">
                        <span>للتواصل مع الإدارة:</span>
                        <strong dir="ltr" className="select-all font-mono font-bold">{suspendedDetails.adminEmail || "mg0447837@gmail.com"}</strong>
                      </div>
                    </div>
                  )}

                  {!suspendedDetails && <ErrorBanner msg={error} />}
                  <SuccessBanner msg={success} />

                  {/* ملاحظة مساعدة سريعة وهادئة خاصة بالتسجيل */}
                  {mode === "register" && (
                    <div className="rounded-xl border border-slate-200/90 bg-slate-50/80 p-3 text-right space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Phone className="h-3.5 w-3.5 text-red-600" />
                          <span>واجهتك أي صعوبة في التسجيل؟</span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          مساعدة مباشرة 💬
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        كلمني أو ابعتلي واتساب وهساعدك تسجل وتفعل حساب الأكاديمية فوراً:
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-0.5">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                          <span className="font-mono font-bold text-slate-800" dir="ltr">0155 248 8179</span>
                          <a href="tel:01552488179" className="text-slate-400 hover:text-red-600 p-0.5" title="اتصال">
                            <Phone className="w-3 h-3" />
                          </a>
                          <a href="https://wa.me/201552488179" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 p-0.5" title="واتساب">
                            <WhatsAppIcon className="w-3 h-3" />
                          </a>
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
                          <span className="font-mono font-bold text-slate-800" dir="ltr">0102 813 8408</span>
                          <a href="tel:01028138408" className="text-slate-400 hover:text-red-600 p-0.5" title="اتصال">
                            <Phone className="w-3 h-3" />
                          </a>
                          <a href="https://wa.me/201028138408" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-emerald-600 p-0.5" title="واتساب">
                            <WhatsAppIcon className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* زر الإرسال الرئيسي */}
                  <button
                    id="submit-auth-btn"
                    className={`w-full h-11 rounded-xl font-bold text-white text-xs sm:text-sm active-press transition cursor-pointer flex items-center justify-center gap-2 shadow-xs ${
                      isAdmin
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
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

              {/* الرابط البديل أسفل النموذج */}
              <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
                {mode === "login" ? (
                  <span>
                    ليس لديك حساب كابتن بعد؟{" "}
                    <button
                      type="button"
                      onClick={() => clearAndSetMode("register")}
                      className="font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
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
                      className="font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
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
                      className="font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
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

      {/* ── Footer بسيط وهادئ بنفس ألوان وستايل الموقع وفيه أرقام الفون ── */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-4 px-4 sm:px-6 text-xs text-slate-500 mt-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* كبسولات أرقام التواصل وروابط الواتساب والفيسبوك */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {CONTACT_NUMBERS.map((contact) => {
              const isCopied = copiedNumber === contact.number;
              return (
                <div
                  key={contact.number}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <span
                    className="font-mono text-xs font-black text-slate-800 tracking-wider pl-1"
                    dir="ltr"
                  >
                    {contact.display}
                  </span>

                  <span className="h-3 w-px bg-slate-200 shrink-0" />

                  {/* اتصال هاتف */}
                  <a
                    href={`tel:${contact.number}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={`اتصال (${contact.number})`}
                  >
                    <Phone className="h-3 w-3" />
                  </a>

                  {/* مراسلة واتساب */}
                  <a
                    href={`https://wa.me/${contact.rawWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title={`مراسلة واتساب (${contact.number})`}
                  >
                    <WhatsAppIcon className="h-3 w-3" />
                  </a>

                  {/* نسخ الرقم */}
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.number)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
                    title={isCopied ? "تم النسخ" : "نسخ الرقم"}
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* كبسولة رابط فيسبوك */}
            <a
              href="https://www.facebook.com/share/189fmyCdsT/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-slate-50/80 px-3 py-1 text-slate-700 hover:text-[#1877F2] hover:bg-blue-50/50 shadow-2xs transition-colors"
              title="صفحة فيسبوك الرسمية"
            >
              <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />
              <span className="font-bold">فيسبوك</span>
              <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
            </a>
          </div>

          {/* حقوق المنظومة والمطور */}
          <div className="text-[11px] text-slate-400 text-center sm:text-left font-medium">
            <span>منظومة </span>
            <strong className="text-slate-700 font-bold">CoachMaster (كوتش ماستر)</strong>
            <span> • تطوير محمد غانم • جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
