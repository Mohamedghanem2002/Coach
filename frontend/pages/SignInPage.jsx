"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, ShieldCheck, Zap, Sparkles } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event) {
    var _a, _b, _c;
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const values = {
      name: String((_a = form.get("name")) !== null && _a !== void 0 ? _a : ""),
      email: String(
        (_b = form.get("email")) !== null && _b !== void 0 ? _b : "",
      ),
      password: String(
        (_c = form.get("password")) !== null && _c !== void 0 ? _c : "",
      ),
    };
    try {
      if (isRegistering) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || "تعذر إنشاء الحساب");
          return;
        }
      }
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });
      if (result === null || result === void 0 ? void 0 : result.error) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
        return;
      }
      if (!(await getSession())) {
        setError("تعذر إنشاء جلسة الدخول. يرجى إعادة المحاولة.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (_d) {
      setError("تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.");
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
        
        {/* Left/Hero Side: Athletic Brand Experience */}
        <div className="relative flex flex-col justify-between p-6 sm:p-10 bg-gradient-to-br from-slate-900 via-slate-950 to-red-950/40 text-white border-b md:border-b-0 md:border-l border-slate-800/80">
          <div>
            {/* Academy Emblem */}
            <div className="flex items-center gap-3 mb-6 sm:mb-8">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400/30 shrink-0">
                <Zap className="h-6 w-6 fill-white stroke-white" />
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
                  <span className="rounded-md bg-red-500/20 px-2 py-0.5 text-[10px] font-black text-red-400 border border-red-500/30 tracking-wide">
                    DOJO 2026
                  </span>
                </div>
                <span className="text-[11px] font-medium text-slate-400">
                  منظومة إدارة أكاديمية الكاراتيه الاحترافية
                </span>
              </div>
            </div>

            {/* Inspiring Copy */}
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
          </div>

          {/* Feature Highlights Grid */}
          <div className="hidden sm:grid gap-2.5 pt-8 mt-8 border-t border-slate-800/80 text-xs">
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
          </div>
        </div>

        {/* Right/Form Side: Clean Interactive Entry */}
        <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
          <div className="w-full max-w-md">

            {/* Segmented Auth Switcher */}
            <div className="mb-6 grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              <button
                type="button"
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                  !isRegistering
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setIsRegistering(false);
                }}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                className={`py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer touch-manipulation ${
                  isRegistering
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setIsRegistering(true);
                }}
              >
                حساب كابتن جديد
              </button>
            </div>

            {/* Form Title */}
            <div className="mb-5 text-right">
              <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900">
                {isRegistering ? "إنشاء حساب مدرب جديد" : "أهلاً بك مجدداً يا كابتن 👋"}
              </h1>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {isRegistering
                  ? "سجّل بياناتك للبدء في إدارة لاعبين الأكاديمية وصالات التدريب."
                  : "أدخل بريدك الإلكتروني وكلمة المرور للمتابعة."}
              </p>
            </div>

            {/* Authentication Form */}
            <form className="space-y-3.5 text-right" onSubmit={submit}>
              {isRegistering && (
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
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <div className="relative flex items-center">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-3 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    name="email"
                    type="email"
                    required
                    placeholder="coach@example.com"
                    autoComplete="email"
                    dir="ltr"
                  />
                  <Mail className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <div className="relative flex items-center">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pr-10 pl-10 py-2.5 text-base sm:text-xs font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    required
                    placeholder="••••••••"
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    dir="ltr"
                  />
                  <Lock className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute left-3 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                    title={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 animate-slide-up flex items-center justify-center gap-2">
                  <span>⚠️</span>
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
                    <span>جاري المعالجة...</span>
                  </span>
                ) : isRegistering ? (
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

            <p className="mt-6 text-center text-[11px] font-medium text-slate-400">
              أكاديمية Re_action للكاراتيه • جميع الحقوق محفوظة {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
