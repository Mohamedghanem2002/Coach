import { Suspense } from "react";
import SignInPage from "../../../frontend/pages/SignInPage";

export const metadata = {
  title: "تسجيل الدخول وإدارة الأكاديميات | DOJO PRO - دوجو برو",
  description: "منظومة دوجو برو الذكية لإدارة أكاديميات الكاراتيه والأبطال - تسجيل الدخول، إنشاء حساب كابتن جديد، أو فتح لوحة التحكم",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="h-8 w-8 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <SignInPage />
    </Suspense>
  );
}
