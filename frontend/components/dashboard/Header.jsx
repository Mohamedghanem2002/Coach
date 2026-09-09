"use client";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  const todayFormatted = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const fullName = session?.user?.name || "حساب الأكاديمية";
  const firstName = fullName.split(" ")[0] || "كابتن";
  const email = session?.user?.email || "";

  return (
    <header
      className="sticky top-0 z-40 flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-200/80 glass-nav px-4 py-2 sm:min-h-[72px] sm:gap-6 sm:px-8 shadow-xs"
      dir="rtl"
    >
      {/* البراند والشعار */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-500/20 ring-2 ring-red-100 sm:h-11 sm:w-11">
          <span className="text-xl sm:text-2xl drop-shadow-xs" aria-hidden="true">🥋</span>
          <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <strong className="font-cairo text-lg font-black tracking-tight text-slate-900 sm:text-xl">
              COACH
            </strong>
            <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-extrabold text-red-600 ring-1 ring-red-200/60">
              PRO
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-400">
            إدارة أكاديمية الكاراتيه
          </p>
        </div>
      </div>

      {/* التحية والوقت (في المنتصف) */}
      <div className="hidden flex-col items-center sm:flex">
        <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 shadow-2xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{todayFormatted}</span>
        </div>
        <h1 className="mt-1 text-sm font-bold text-slate-800">
          مرحباً بك يا كابتن <span className="text-red-600 font-extrabold">{firstName}</span> 🥋
        </h1>
      </div>

      {/* الحساب وإجراءات الخروج */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/60 p-1.5 pl-3 text-left md:flex" dir="ltr">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white shadow-xs">
            {firstName.charAt(0)}
          </div>
          <div className="min-w-0">
            <span className="block truncate text-xs font-bold text-slate-800">
              {fullName}
            </span>
            {email && (
              <span className="block truncate text-[10px] text-slate-400">
                {email}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="group flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-bold text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-500/20 active:scale-95"
          onClick={async () => {
            await signOut({ redirect: false });
            router.push("/auth/signin");
          }}
          title="تسجيل الخروج من النظام"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">خروج</span>
          <svg
            className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}

