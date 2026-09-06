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
    <header
      className="sticky top-0 z-50 flex min-h-[60px] items-center justify-between gap-3 border-b border-slate-200 bg-white px-3 shadow-sm sm:min-h-[68px] sm:gap-4 sm:px-10"
      dir="rtl"
    >
      {/* البراند */}
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-linear-to-br from-red-500 to-red-700 text-lg text-white shadow-md shadow-red-100 sm:h-10 sm:w-10 sm:text-xl">
          🥋
        </span>
        <div>
          <strong className="block text-base font-extrabold leading-tight text-slate-900 sm:text-[17px]">
            coach
          </strong>
          <small className="hidden text-[10px] text-slate-400 sm:block">
            إدارة أكاديمية الكاراتيه
          </small>
        </div>
      </div>

      {/* الوسط */}
      <div className="hidden text-center sm:block">
        <p className="mb-0.5 text-[10px] font-semibold text-slate-400">
          {todayFormatted}
        </p>
        <h1 className="text-base font-bold text-slate-900">
          مرحباً يا كابتن {firstName} <span>👋</span>
        </h1>
      </div>

      {/* الحساب */}
      <div className="flex items-center gap-3">
        <div className="hidden gap-px text-left sm:grid" dir="ltr">
          <strong className="text-xs font-semibold text-slate-900">
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
          <span className="text-[10px] text-slate-400">
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
          className="flex items-center gap-1 rounded-lg border border-transparent bg-red-50 px-2.5 py-2 text-[10px] font-bold text-red-600 transition hover:border-red-200 hover:bg-red-100 sm:px-3.5 sm:text-[11px]"
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
