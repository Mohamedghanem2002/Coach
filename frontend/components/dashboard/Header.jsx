"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getTodayBirthdays,
  getUpcomingBirthdays,
  generateBirthdayWishUrl,
} from "../../lib/dashboard-utils";

export default function Header({ players = [], onOpenPlayer }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [showBirthdayMenu, setShowBirthdayMenu] = useState(false);
  const menuRef = useRef(null);

  const todayFormatted = new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const fullName = session?.user?.name || "حساب الأكاديمية";
  const firstName = fullName.split(" ")[0] || "كابتن";
  const email = session?.user?.email || "";

  const todayBirthdays = useMemo(() => getTodayBirthdays(players), [players]);
  const upcomingBirthdays = useMemo(
    () => getUpcomingBirthdays(players, 7),
    [players]
  );
  const totalBirthdayCount = todayBirthdays.length + upcomingBirthdays.length;

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowBirthdayMenu(false);
      }
    }
    if (showBirthdayMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showBirthdayMenu]);

  return (
    <header
      className="sticky top-0 z-40 flex min-h-[64px] items-center justify-between gap-3 border-b border-slate-200/80 glass-nav px-4 py-2 sm:min-h-[72px] sm:gap-6 sm:px-8 shadow-xs"
      dir="rtl"
    >
      {/* البراند والشعار */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md shadow-red-500/20 ring-2 ring-red-100 sm:h-11 sm:w-11">
          <span className="text-xl sm:text-2xl drop-shadow-xs" aria-hidden="true">
            🥋
          </span>
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
          مرحباً بك يا كابتن{" "}
          <span className="text-red-600 font-extrabold">{firstName}</span> 🥋
        </h1>
      </div>

      {/* الحساب وإجراءات الخروج + زر تذكار أعياد الميلاد */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* زر التذكار وقائمة أعياد الميلاد */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className={`relative flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-all duration-200 cursor-pointer ${
              todayBirthdays.length > 0
                ? "border-rose-300 bg-gradient-to-r from-rose-50 to-amber-50 text-rose-700 shadow-sm shadow-rose-500/10 hover:border-rose-400 active:scale-95"
                : "border-slate-200 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
            }`}
            onClick={() => setShowBirthdayMenu((prev) => !prev)}
            title="تذكار أعياد ميلاد اللاعبين"
          >
            <span className="text-base">🎂</span>
            <span className="hidden md:inline font-cairo">أعياد الميلاد</span>
            {todayBirthdays.length > 0 ? (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-xs">
                {todayBirthdays.length}
              </span>
            ) : upcomingBirthdays.length > 0 ? (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-black text-white shadow-xs">
                {upcomingBirthdays.length}
              </span>
            ) : null}

            {todayBirthdays.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
              </span>
            )}
          </button>

          {/* القائمة المنسدلة للتذكار */}
          {showBirthdayMenu && (
            <div
              className="absolute left-0 mt-2 w-80 sm:w-96 rounded-2xl border border-amber-200/80 bg-white p-3 shadow-xl z-50 animate-slide-up"
              dir="rtl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎉</span>
                  <strong className="font-cairo text-sm font-black text-slate-800">
                    أعياد ميلاد أبطال الأكاديمية
                  </strong>
                </div>
                <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
                  {totalBirthdayCount} مناسبة
                </span>
              </div>

              <div className="mt-2.5 max-h-80 overflow-y-auto space-y-2.5 pr-0.5">
                {/* أعياد ميلاد اليوم */}
                {todayBirthdays.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-600 mb-1.5">
                      <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>أعياد ميلاد اليوم ({todayBirthdays.length}):</span>
                    </div>
                    <div className="space-y-2">
                      {todayBirthdays.map((player) => (
                        <div
                          key={player._id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-rose-200/80 bg-rose-50/50 p-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate font-cairo text-xs font-black text-slate-900">
                              {player.name}
                            </strong>
                            <span className="block text-[10px] font-bold text-rose-700">
                              يُتم اليوم {player.birthdayInfo?.turningAge} سنة 🎂 ({player.branch})
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={generateBirthdayWishUrl(player, firstName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-black text-white shadow-xs hover:bg-emerald-700"
                              title="إرسال تهنئة عبر واتساب"
                            >
                              📲 تهنئة
                            </a>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                              onClick={() => {
                                setShowBirthdayMenu(false);
                                onOpenPlayer?.(player);
                              }}
                            >
                              الملف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* أعياد ميلاد قادمة */}
                {upcomingBirthdays.length > 0 && (
                  <div className={todayBirthdays.length > 0 ? "border-t border-slate-100 pt-2" : ""}>
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 mb-1.5">
                      <span>🗓️ قادمة خلال 7 أيام ({upcomingBirthdays.length}):</span>
                    </div>
                    <div className="space-y-1.5">
                      {upcomingBirthdays.map((player) => (
                        <div
                          key={player._id}
                          className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate font-cairo text-xs font-black text-slate-900">
                              {player.name}
                            </strong>
                            <span className="block text-[10px] font-medium text-slate-500">
                              {player.birthdayInfo?.daysLeft === 1
                                ? "غداً"
                                : `بعد ${player.birthdayInfo?.daysLeft} أيام`} ({player.birthdayInfo?.dateFormatted}) • {player.birthdayInfo?.turningAge} سنة
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={generateBirthdayWishUrl(player, firstName)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 text-[10px] font-black hover:bg-emerald-100"
                            >
                              واتساب
                            </a>
                            <button
                              type="button"
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
                              onClick={() => {
                                setShowBirthdayMenu(false);
                                onOpenPlayer?.(player);
                              }}
                            >
                              الملف
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {totalBirthdayCount === 0 && (
                  <div className="py-6 text-center text-slate-400">
                    <span className="text-2xl block mb-1">🥋🎂</span>
                    <p className="text-xs font-bold text-slate-600">
                      لا توجد أعياد ميلاد اليوم أو خلال الـ 7 أيام القادمة.
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      تأكد من تسجيل تواريخ ميلاد اللاعبين في ملفاتهم.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className="hidden items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/60 p-1.5 pl-3 text-left md:flex"
          dir="ltr"
        >
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
          className="group flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2 text-xs font-bold text-red-600 transition-all duration-200 hover:bg-red-600 hover:text-white hover:shadow-md hover:shadow-red-500/20 active:scale-95 cursor-pointer"
          onClick={async () => {
            await signOut({ redirect: false });
            router.push("/auth/signin");
          }}
          title="تسجيل الخروج من النظام"
        >
          <span className="transition-transform group-hover:-translate-x-0.5">
            خروج
          </span>
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


