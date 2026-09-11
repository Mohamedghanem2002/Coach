"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

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
      className="min-h-screen bg-slate-900 p-3 sm:grid sm:place-items-center sm:p-6"
      dir="rtl"
    >
      <section className="mx-auto grid min-h-[calc(100vh-24px)] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 bg-white shadow-2xl shadow-black/40 sm:min-h-[580px] sm:grid-cols-[1fr_1.15fr]">
        {/* جانب العلامة التجارية الرياضي الفاخر */}
        <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/50 p-5 sm:p-12 text-white">
          {/* لمسات إضاءة خلفية دائرية */}
          <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-600/10 blur-3xl" />

          <div className="relative z-10">
            {/* الشعار */}
            <div className="mb-3 sm:mb-10 flex items-center gap-3">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-xl sm:text-2xl text-white shadow-lg shadow-red-500/30 ring-2 ring-red-400/30 shrink-0">
                🥋
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="font-cairo text-base sm:text-lg font-black tracking-tight text-white">
                    Re_action
                  </strong>
                  <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-red-400 border border-red-500/30">
                    DOJO
                  </span>
                </div>
                <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
                  إدارة أكاديمية الكاراتيه
                </span>
              </div>
            </div>

            <div className="hidden sm:block">
              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-red-400">
                المنظومة الاحترافية للمدربين
              </p>
              <h2 className="font-cairo text-2xl font-black leading-tight text-white sm:text-3xl">
                إدارة رياضية ذكية.
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-300">
                  متابعة دقيقة للأبطال.
                </span>
              </h2>
              <p className="mt-4 max-w-sm text-xs sm:text-sm leading-relaxed text-slate-400">
                سجل حضور وغياب لاعبيك فوراً، تابع سداد الاشتراكات الشهرية، واطبع تقارير التدريب بنقرة واحدة.
              </p>
            </div>
          </div>

          {/* مميزات سريعة - تظهر على الشاشات الكبيرة */}
          <div className="relative z-10 mt-6 sm:mt-10 hidden sm:grid gap-2.5 border-t border-slate-800/80 pt-6 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                ✓
              </span>
              <span>تسجيل الحضور الفوري والغياب اليومي للصالات</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                ✓
              </span>
              <span>متابعة الاشتراكات والتحصيل لكل شهر باستقلالية</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 text-xs">
                ✓
              </span>
              <span>مشاركة تقارير اللاعبين الفورية عبر واتساب كصورة وكتابة</span>
            </div>
          </div>
        </div>

        {/* جانب النموذج وإدخال البيانات */}
        <div className="flex items-center p-5 sm:p-12 bg-white">
          <div className="w-full max-w-md mx-auto">
            {/* تبويبات التبديل بين الدخول والتسجيل */}
            <div className="mb-5 sm:mb-6 flex rounded-2xl bg-slate-100 p-1 border border-slate-200/60">
              <button
                type="button"
                className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all active-press cursor-pointer ${
                  !isRegistering
                    ? "bg-white text-slate-900 shadow-xs"
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
                className={`flex-1 rounded-xl py-2 text-xs font-extrabold transition-all active-press cursor-pointer ${
                  isRegistering
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                onClick={() => {
                  setError("");
                  setIsRegistering(true);
                }}
              >
                إنشاء حساب كابتن
              </button>
            </div>

            <div className="mb-5 sm:mb-6">
              <h1 className="font-cairo text-xl sm:text-2xl font-black text-slate-900">
                {isRegistering ? "انضم لأكاديمية Re_action" : "أهلاً بك مجدداً يا كابتن 👋"}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {isRegistering
                  ? "أنشئ حسابك للبدء في إدارة وتدريب لاعبيك اليوم."
                  : "سجّل الدخول للمتابعة من حيث توقفت."}
              </p>
            </div>

            <form className="space-y-4 text-right" onSubmit={submit}>
              {isRegistering && (
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    اسم الكابتن / المدرب
                  </label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-base sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    name="name"
                    required
                    placeholder="مثال: كابتن ياسر"
                    autoComplete="name"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  البريد الإلكتروني
                </label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-base sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                  name="email"
                  type="email"
                  required
                  placeholder="coach@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  كلمة المرور
                </label>
                <div className="relative flex items-center">
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 pl-11 text-base sm:text-sm font-semibold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    minLength={8}
                    required
                    placeholder="••••••••"
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
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
              </div>

              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-bold text-rose-700 animate-slide-up">
                  {error}
                </div>
              )}

              <button
                className="mt-2 flex min-h-[46px] w-full items-center justify-center rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3.5 font-cairo text-sm font-black text-white shadow-md shadow-red-500/25 transition-all hover:brightness-110 active-press disabled:opacity-60 cursor-pointer"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "جاري التنفيذ..."
                  : isRegistering
                    ? "✓ إنشاء الحساب والدخول"
                    : "تسجيل الدخول إلى اللوحة"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

