"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarDays,
  ChevronRight,
  Compass,
  LogOut,
  MessageCircle,
  User,
  Zap,
} from "lucide-react";
import {
  getTodayBirthdays,
  getUpcomingBirthdays,
} from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";

export default function Header({
  players = [],
  onOpenPlayer,
  currentView = "players",
  onToggleEventsView,
  eventsCount = 0,
}) {
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
  const initials = firstName.charAt(0);
  const [congratulateTick, setCongratulateTick] = useState(0);

  useEffect(() => {
    const handleCongratulated = () => setCongratulateTick((t) => t + 1);
    window.addEventListener("birthday_congratulated", handleCongratulated);
    return () =>
      window.removeEventListener("birthday_congratulated", handleCongratulated);
  }, []);

  const todayBirthdays = useMemo(() => {
    void congratulateTick;
    return getTodayBirthdays(players);
  }, [players, congratulateTick]);
  const upcomingBirthdays = useMemo(() => {
    void congratulateTick;
    return getUpcomingBirthdays(players, 1);
  }, [players, congratulateTick]);
  const totalBirthdayCount = todayBirthdays.length + upcomingBirthdays.length;

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
    <header className="sticky top-0 z-40 glass-nav" dir="rtl">
      {/* Animated accent line */}
      <div className="nav-accent-bottom" />

      <div className="mx-auto flex min-h-[58px] sm:min-h-[72px] w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-8 py-2 overflow-hidden">

        {/* Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <div className="relative flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 text-white shadow-md ring-1 ring-red-100">
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 fill-white stroke-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <strong className="font-cairo text-base sm:text-xl font-black tracking-tight text-slate-900 truncate">
                Re_action
              </strong>
              <span className="rounded bg-red-600 px-1 py-0.5 text-[8px] sm:text-[9px] font-black text-white shrink-0">
                PRO
              </span>
            </div>
            {/* Show captain greeting on mobile, subtitle on desktop */}
            <p className="hidden sm:block text-[10px] font-semibold text-slate-400 leading-tight">
              إدارة أكاديمية الكاراتيه
            </p>
            <p className="sm:hidden text-[11px] font-bold text-slate-500 leading-tight truncate">
              أهلاً يا كابتن{" "}
              <span className="font-black text-red-600">{firstName}</span>
            </p>
          </div>
        </div>

        {/* Date & Captain pill — center on desktop */}
        <div className="hidden sm:flex flex-col items-center">
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-xs">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {todayFormatted}
          </div>
          <h1 className="mt-1 text-xs font-bold text-slate-700">
            أهلاً يا كابتن{" "}
            <span className="font-black text-red-600">{firstName}</span>
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {/* Events navigation button on desktop */}
          <button
            type="button"
            onClick={onToggleEventsView}
            className={`hidden sm:flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-black transition-all duration-200 cursor-pointer ${
              currentView === "events"
                ? "border-red-500 bg-red-600 text-white shadow-sm shadow-red-500/20"
                : "border-slate-200/80 bg-white/80 text-slate-700 hover:border-slate-300 hover:bg-white shadow-xs"
            }`}
            title="إدارة الفعاليات والرحلات"
          >
            <Compass className="h-4 w-4" />
            <span className="font-cairo">الفعاليات والرحلات</span>
            {eventsCount > 0 && (
              <span className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ${
                currentView === "events" ? "bg-white text-red-600" : "bg-amber-100 text-amber-800"
              }`}>
                {eventsCount}
              </span>
            )}
          </button>

          {/* Birthday button */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              id="birthday-menu-btn"
              className={`relative flex h-9 sm:h-10 items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 text-xs font-black transition-all duration-200 cursor-pointer touch-manipulation active:scale-95 ${
                todayBirthdays.length > 0
                  ? "border-rose-300 bg-gradient-to-r from-rose-50 to-amber-50 text-rose-700 shadow-sm shadow-rose-500/15 hover:border-rose-400 hover:shadow-md animate-pulse-glow"
                  : "border-slate-200/80 bg-white/80 text-slate-600 hover:border-slate-300 hover:bg-white shadow-xs"
              }`}
              onClick={() => setShowBirthdayMenu((prev) => !prev)}
              title="تذكار أعياد ميلاد اللاعبين"
            >
              <Cake className="h-4 w-4" />
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
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
                </span>
              )}
            </button>

            {/* Birthday panel: Bottom sheet on mobile, anchored dropdown on desktop */}
            {showBirthdayMenu && (
              <>
                {/* Mobile backdrop */}
                <div
                  className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs sm:hidden animate-backdrop"
                  onClick={() => setShowBirthdayMenu(false)}
                />
                <div
                  className="fixed sm:absolute bottom-0 sm:bottom-auto left-0 sm:left-0 right-0 sm:right-auto sm:top-full sm:mt-2.5 w-full sm:w-96 rounded-t-3xl sm:rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xl z-50 animate-bottom-sheet sm:animate-slide-up pb-safe"
                  dir="rtl"
                >
                  {/* Mobile drag handle */}
                  <div className="sheet-drag-handle sm:hidden" />

                  {/* Decorative top bar */}
                  <div className="hidden sm:block absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500" />

                  <div className="mt-1 flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 shadow-xs shadow-rose-500/25">
                        <Cake className="h-4 w-4 text-white" />
                      </div>
                      <strong className="font-cairo text-sm font-black text-slate-800">
                        أعياد ميلاد الأبطال
                      </strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
                        {totalBirthdayCount} مناسبة
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowBirthdayMenu(false)}
                        className="sm:hidden flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  </div>


                <div className="mt-3 max-h-80 overflow-y-auto space-y-2 pr-0.5">
                  {todayBirthdays.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-rose-600 mb-2">
                        <span className="flex h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                        <span>أعياد ميلاد اليوم ({todayBirthdays.length}):</span>
                      </div>
                      <div className="space-y-1.5">
                        {todayBirthdays.map((player) => (
                          <div
                            key={player._id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-rose-200/80 bg-gradient-to-r from-rose-50/80 to-amber-50/60 p-2.5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-amber-500 font-cairo text-xs font-black text-white">
                                {player.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <strong className="block truncate font-cairo text-xs font-black text-slate-900">
                                  {player.name}
                                </strong>
                                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-700">
                                  <Cake className="h-2.5 w-2.5" />
                                  {player.birthdayInfo?.turningAge} سنة · {player.branch}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowBirthdayMenu(false);
                                  sendBirthdayCardViaWhatsApp(player, firstName);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[11px] font-black text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer"
                                title="إرسال كارت التهنئة الرسمي عبر واتساب"
                              >
                                <span className="text-xs">🎂</span>
                                <span>كارت التهنئة</span>
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
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

                  {upcomingBirthdays.length > 0 && (
                    <div className={todayBirthdays.length > 0 ? "border-t border-slate-100 pt-2.5 mt-1" : ""}>
                      <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 mb-2">
                        <CalendarDays className="h-3 w-3" />
                        <span>قادمة غداً ({upcomingBirthdays.length}):</span>
                      </div>
                      <div className="space-y-1.5">
                        {upcomingBirthdays.map((player) => (
                          <div
                            key={player._id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-amber-100/80 bg-amber-50/40 p-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-100 font-cairo text-xs font-black text-amber-800">
                                {player.name.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <strong className="block truncate font-cairo text-xs font-black text-slate-900">
                                  {player.name}
                                </strong>
                                <span className="block text-[10px] font-medium text-slate-500">
                                  غداً · {player.birthdayInfo?.turningAge} سنة
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowBirthdayMenu(false);
                                  sendBirthdayCardViaWhatsApp(player, firstName);
                                }}
                                className="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-1 text-[10px] font-black hover:bg-emerald-100 transition-colors cursor-pointer"
                                title="إرسال كارت التهنئة الرسمي عبر واتساب"
                              >
                                <span className="text-xs">🎂</span>
                              </button>
                              <button
                                type="button"
                                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
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
                    <div className="py-8 text-center text-slate-400">
                      <Cake className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-bold text-slate-600">لا توجد أعياد ميلاد قريبة</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        تأكد من تسجيل تواريخ ميلاد اللاعبين.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

          {/* User avatar pill */}
          <div
            className="hidden items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white px-2 py-1.5 shadow-xs md:flex"
            dir="ltr"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 text-xs font-black text-white shadow-xs ring-2 ring-slate-100">
              {initials}
            </div>
            <div className="min-w-0">
              <span className="block truncate text-xs font-bold text-slate-800 max-w-[120px]">
                {fullName}
              </span>
              {email && (
                <span className="block truncate text-[10px] text-slate-400 max-w-[120px]">
                  {email}
                </span>
              )}
            </div>
          </div>

          {/* Sign out */}
          <button
            type="button"
            id="signout-btn"
            className="group flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition-all duration-200 hover:bg-red-600 hover:border-red-600 hover:text-white hover:shadow-md hover:shadow-red-500/20 active:scale-95 cursor-pointer"
            onClick={async () => {
              await signOut({ redirect: false });
              router.push("/auth/signin");
            }}
            title="تسجيل الخروج من النظام"
          >
            <span className="hidden sm:inline">خروج</span>
            <LogOut className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
