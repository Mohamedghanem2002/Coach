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
    <main className="signin-page" dir="rtl">
      <section className="signin-panel">
        <div className="signin-mark">🥋</div>
        <p className="signin-kicker">إدارة أكاديمية الكاراتيه</p>
        <h1>{isRegistering ? "إنشاء حساب جديد" : "مرحبًا بك في coach"}</h1>
        <p className="signin-copy">
          {isRegistering
            ? "أنشئ حسابك للوصول إلى لوحة الأكاديمية."
            : "سجّل الدخول للوصول إلى لوحة الأكاديمية."}
        </p>
        <form className="signin-form" onSubmit={submit}>
          {isRegistering && (
            <label>
              الاسم
              <input name="name" required autoComplete="name" />
            </label>
          )}
          <label>
            البريد الإلكتروني
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            كلمة المرور
            <input
              name="password"
              type="password"
              minLength={8}
              required
              autoComplete={isRegistering ? "new-password" : "current-password"}
            />
          </label>
          {error && <p className="signin-error">{error}</p>}
          <button className="google-button" type="submit" disabled={busy}>
            {busy
              ? "جاري التنفيذ..."
              : isRegistering
                ? "إنشاء الحساب"
                : "تسجيل الدخول"}
          </button>
        </form>
        <button
          className="signin-switch"
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
