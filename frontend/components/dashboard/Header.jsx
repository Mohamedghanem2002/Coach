"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function Header() {
  var _a, _b, _c, _d, _e, _f, _g;
  const { data: session } = useSession();
  const router = useRouter();
  const todayFormatted = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const firstName =
    (_c =
      (_b =
        (_a =
          session === null || session === void 0 ? void 0 : session.user) ===
          null || _a === void 0
          ? void 0
          : _a.name) === null || _b === void 0
        ? void 0
        : _b.split(" ")[0]) !== null && _c !== void 0
      ? _c
      : "";
  return (
    <header className="main-header" dir="rtl">
      {/* البراند */}
      <div className="header-brand">
        <span className="brand-mark">🥋</span>
        <div>
          <strong>coach</strong>
          <small>إدارة أكاديمية الكاراتيه</small>
        </div>
      </div>

      {/* الوسط */}
      <div className="header-center">
        <p className="eyebrow">{todayFormatted}</p>
        <h1>
          مرحباً يا كابتن {firstName} <span>👋</span>
        </h1>
      </div>

      {/* الحساب */}
      <div className="account-actions">
        <div className="account-details">
          <strong>
            {(_e =
              (_d =
                session === null || session === void 0
                  ? void 0
                  : session.user) === null || _d === void 0
                ? void 0
                : _d.name) !== null && _e !== void 0
              ? _e
              : "حساب الأكاديمية"}
          </strong>
          <span>
            {(_g =
              (_f =
                session === null || session === void 0
                  ? void 0
                  : session.user) === null || _f === void 0
                ? void 0
                : _f.email) !== null && _g !== void 0
              ? _g
              : ""}
          </span>
        </div>
        <button
          className="logout-button"
          onClick={async () => {
            await signOut({ redirect: false });
            router.push("/auth/signin");
          }}
        >
          خروج ↩
        </button>
      </div>
    </header>
  );
}
