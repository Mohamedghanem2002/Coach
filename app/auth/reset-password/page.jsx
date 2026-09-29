import { Suspense } from "react";
import ResetPasswordPage from "../../../frontend/pages/ResetPasswordPage";

export const metadata = {
  title: "استعادة كلمة المرور | CoachMaster",
  description: "إعادة تعيين كلمة المرور الخاصة بحساب كابتن الأكاديمية",
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
      <ResetPasswordPage />
    </Suspense>
  );
}
