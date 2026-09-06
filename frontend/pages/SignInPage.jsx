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
      className="grid min-h-screen place-items-center bg-linear-to-br from-slate-50 via-white to-red-50 p-6"
      dir="rtl"
    >
      <section className="relative w-full max-w-110 overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-10 text-center shadow-2xl sm:px-10">
        <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-red-600 via-red-400 to-red-600" />
        <div className="mx-auto mb-6 grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-red-500 to-red-700 text-3xl text-white shadow-lg shadow-red-200">
          🥋
        </div>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[1.5px] text-red-600">
          إدارة أكاديمية الكاراتيه
        </p>
        <h1 className="mb-2 text-2xl font-extrabold text-slate-900">
          {isRegistering ? "إنشاء حساب جديد" : "مرحبًا بك في coach"}
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
              autoComplete={isRegistering ? "new-password" : "current-password"}
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
          className="mt-5 inline-block text-xs font-semibold text-slate-500 transition hover:text-red-600"
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
      </section>
    </main>
  );
}
