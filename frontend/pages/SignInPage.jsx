"use client";
import { useState } from "react";
import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function SignInPage() {
  const router = useRouter();
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
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
        setError("الإيميل أو كلمة المرور غير صحيحة");
        return;
      }
      if (!(await getSession())) {
        setError("تعذر إنشاء جلسة الدخول. أعد المحاولة.");
        return;
      }
      router.push("/");
      router.refresh();
    } catch (_d) {
      setError("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main
      className="min-h-screen bg-slate-50 p-3 sm:grid sm:place-items-center sm:p-6"
      dir="rtl"
    >
      <section className="mx-auto grid min-h-[calc(100vh-24px)] w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70 sm:min-h-0 sm:grid-cols-[0.85fr_1.15fr] sm:ltr">
        <div className="order-2 flex flex-col justify-between bg-slate-950 p-7 text-white sm:order-1 sm:p-10">
          <div>
            <div className="mb-10 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-600 text-xl">
                🥋
              </span>
              <div>
                <strong className="block text-base font-extrabold">
                  coach
                </strong>
                <span className="text-[10px] text-slate-400">
                  إدارة الأكاديمية
                </span>
              </div>
            </div>
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">
              نظام إدارة الأكاديمية
            </p>
            <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
              إدارة أبسط.
              <br />
              متابعة أوضح.
            </h2>
            <p className="mt-4 max-w-xs text-sm leading-7 text-slate-400">
              تابع لاعبيك، حضورهم، واشتراكاتهم من مكان واحد مصمم ليومك السريع.
            </p>
          </div>
          <div className="mt-10 hidden gap-3 text-xs text-slate-400 sm:grid">
            <span>• سجل حضور اللاعبين بسهولة</span>
            <span>• راقب الاشتراكات والفروع</span>
          </div>
        </div>
        <div className="order-1 flex items-center p-6 sm:order-2 sm:p-12">
          <div className="w-full max-w-md">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-red-600">
              أهلاً بك
            </p>
            <h1 className="mb-2 text-2xl font-extrabold text-slate-900">
              {isRegistering ? "إنشاء حساب جديد" : "تسجيل الدخول"}
            </h1>
            <p className="mb-8 text-[13px] leading-7 text-slate-500">
              {isRegistering
                ? "أنشئ حسابك للوصول إلى لوحة الأكاديمية."
                : "سجّل الدخول للوصول إلى لوحة الأكاديمية."}
            </p>
            <form className="grid gap-4 text-right" onSubmit={submit}>
              {isRegistering && (
                <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                  الاسم
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                    name="name"
                    required
                    autoComplete="name"
                  />
                </label>
              )}
              <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                البريد الإلكتروني
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                />
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-600">
                كلمة المرور
                <input
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-100"
                  name="password"
                  type="password"
                  minLength={8}
                  required
                  autoComplete={
                    isRegistering ? "new-password" : "current-password"
                  }
                />
              </label>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
                  {error}
                </p>
              )}
              <button
                className="flex w-full items-center justify-center rounded-xl bg-linear-to-br from-red-500 to-red-700 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                type="submit"
                disabled={busy}
              >
                {busy
                  ? "جاري التنفيذ..."
                  : isRegistering
                    ? "إنشاء الحساب"
                    : "تسجيل الدخول"}
              </button>
            </form>
            <button
              className="mt-5 text-xs font-semibold text-slate-500 transition hover:text-red-600"
              type="button"
              onClick={() => {
                setError("");
                setIsRegistering((current) => !current);
              }}
            >
              {isRegistering
                ? "لديك حساب؟ تسجيل الدخول"
                : "ليس لديك حساب؟ إنشاء حساب"}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
