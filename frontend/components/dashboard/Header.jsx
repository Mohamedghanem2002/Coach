"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarDays,
  Compass,
  LogOut,
  Settings,
  Sparkles,
  FileSpreadsheet,
  Users,
  Cloud,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Check,
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
  onNavigateToBirthdays,
  onOpenAccountSettings,
  onOpenFeatures,
  onInstantCloudBackup,
  onRestore,
  onDownloadBackup,
  onOpenExportExcel,
  isCloudBackingUp = false,
  isRestoring = false,
  isBackingUp = false,
  hasUnreadPlanUpdate = false,
  hasUnreadGuide = false,
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const [showBirthdayMenu, setShowBirthdayMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);

  const birthdayMenuRef = useRef(null);
  const accountMenuRef = useRef(null);

  const fullName = session?.user?.name || "حساب الأكاديمية";
  const academyName = session?.user?.academyName || "CoachMaster";
  const firstName = fullName.split(" ")[0] || "كابتن";
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
  const hasMenuNotification = hasUnreadPlanUpdate || hasUnreadGuide;

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        birthdayMenuRef.current &&
        !birthdayMenuRef.current.contains(event.target)
      ) {
        setShowBirthdayMenu(false);
      }
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (!window.confirm("هل تريد بالتأكيد تسجيل الخروج من النظام؟")) {
        return;
      }
    }
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  return (
    <header
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all select-none"
      dir="rtl"
    >
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
        
        {/* ═══════════════════════════════════════════════════════════════
            1. Brand & Academy Identity (Right in RTL)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2.5 min-w-0 shrink-0">
          {/* Crisp Monochromatic Logo Mark with subtle red accent */}
          <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-slate-900 text-white shadow-2xs">
            <span className="font-cairo text-sm font-black tracking-tight text-white">
              C<span className="text-red-500">M</span>
            </span>
          </div>

          {/* Academy Name & Plan Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-cairo text-sm font-extrabold tracking-tight text-slate-900 truncate max-w-[130px] sm:max-w-[200px] lg:max-w-[240px]">
              {academyName}
            </span>
            <span className="hidden sm:inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200/60">
              PRO
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            2. Primary Desktop View Switcher (Center Segmented Control)
            ═══════════════════════════════════════════════════════════════ */}
        {onToggleEventsView && (
          <nav className="flex items-center rounded-lg bg-slate-100/90 p-0.5 border border-slate-200/60 shadow-2xs">
            {/* Tab 1: Players */}
            <button
              type="button"
              onClick={() => {
                if (currentView !== "players") onToggleEventsView();
              }}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                currentView === "players"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span className="font-cairo">اللاعبين</span>
            </button>

            {/* Tab 2: Events */}
            <button
              type="button"
              onClick={() => {
                if (currentView !== "events") onToggleEventsView();
              }}
              className={`flex items-center gap-1.5 rounded-md px-2.5 sm:px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                currentView === "events"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              <span className="font-cairo">الفعاليات</span>
              {eventsCount > 0 && (
                <span
                  className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black ${
                    currentView === "events"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {eventsCount}
                </span>
              )}
            </button>
          </nav>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            3. Executive Action Suite & Menu (Left in RTL)
            ═══════════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

          {/* 📊 Primary Quick Action: Excel Export (Desktop) */}
          {onOpenExportExcel && (
            <button
              type="button"
              id="header-excel-action"
              onClick={() => onOpenExportExcel("players")}
              className="hidden md:flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 text-xs font-bold transition-colors shadow-2xs cursor-pointer active:scale-98"
              title="تصدير بيانات الأكاديمية إلى إكسيل (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span className="font-cairo">تصدير إكسيل</span>
            </button>
          )}

          {/* 🎂 Birthdays Indicator & Popover */}
          <div className="relative" ref={birthdayMenuRef}>
            <button
              type="button"
              id="header-birthday-trigger"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.innerWidth < 768 &&
                  onNavigateToBirthdays
                ) {
                  onNavigateToBirthdays();
                } else {
                  setShowBirthdayMenu((prev) => !prev);
                  setShowAccountMenu(false);
                }
              }}
              className={`relative flex h-8.5 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-bold transition-all cursor-pointer active:scale-98 ${
                showBirthdayMenu || currentView === "birthdays"
                  ? "border-rose-300 bg-rose-50 text-rose-800 shadow-2xs"
                  : todayBirthdays.length > 0
                  ? "border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100/70"
                  : "border-slate-200/90 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
              }`}
              title="أعياد ميلاد اللاعبين"
            >
              <Cake className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              {totalBirthdayCount > 0 && (
                <span
                  className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black ${
                    todayBirthdays.length > 0
                      ? "bg-rose-600 text-white"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {totalBirthdayCount}
                </span>
              )}
            </button>

            {/* Birthday Popover Flyout */}
            {showBirthdayMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs sm:hidden"
                  onClick={() => setShowBirthdayMenu(false)}
                />
                <div
                  className="fixed sm:absolute bottom-0 sm:bottom-auto left-0 sm:left-0 right-0 sm:right-auto sm:top-full sm:mt-1.5 w-full sm:w-80 rounded-t-2xl sm:rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-xl z-50 animate-slide-up pb-safe"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Cake className="h-4 w-4 text-rose-600" />
                      <strong className="font-cairo text-xs font-bold text-slate-800">
                        أعياد ميلاد الأبطال
                      </strong>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                      {totalBirthdayCount} مناسبة
                    </span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-2 pr-0.5">
                    {todayBirthdays.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="block text-[10.5px] font-bold text-rose-600">
                          أعياد ميلاد اليوم ({todayBirthdays.length}):
                        </span>
                        {todayBirthdays.map((player) => (
                          <div
                            key={player._id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-rose-100 bg-rose-50/50 p-2 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-slate-900">
                                {player.name}
                              </span>
                              <span className="block text-[10px] text-rose-600">
                                اليوم · {player.birthdayInfo?.turningAge} سنة
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowBirthdayMenu(false);
                                sendBirthdayCardViaWhatsApp(player, firstName);
                              }}
                              className="rounded-md bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              🎂 تهنئة
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : upcomingBirthdays.length > 0 ? (
                      <div className="space-y-1.5">
                        <span className="block text-[10.5px] font-bold text-slate-500">
                          قادمة غداً ({upcomingBirthdays.length}):
                        </span>
                        {upcomingBirthdays.map((player) => (
                          <div
                            key={player._id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 p-2 text-xs"
                          >
                            <div className="min-w-0">
                              <span className="block truncate font-bold text-slate-900">
                                {player.name}
                              </span>
                              <span className="block text-[10px] text-slate-500">
                                غداً · {player.birthdayInfo?.turningAge} سنة
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setShowBirthdayMenu(false);
                                sendBirthdayCardViaWhatsApp(player, firstName);
                              }}
                              className="rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 text-[10px] font-bold transition-colors cursor-pointer"
                            >
                              تهنئة
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-400 text-xs">
                        لا توجد أعياد ميلاد قريبة
                      </div>
                    )}

                    {onNavigateToBirthdays && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowBirthdayMenu(false);
                          onNavigateToBirthdays();
                        }}
                        className="mt-2 w-full text-center py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        عرض مركز أعياد الميلاد بالكامل ←
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              4. Executive Dropdown Menu (Captain Profile, Tools & Settings)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="relative" ref={accountMenuRef}>
            <button
              type="button"
              id="header-account-menu-trigger"
              onClick={() => {
                setShowAccountMenu((prev) => !prev);
                setShowBirthdayMenu(false);
              }}
              className="relative flex h-8.5 items-center gap-1.5 rounded-lg border border-slate-200/90 bg-white hover:bg-slate-50 px-2 sm:px-2.5 text-xs font-bold text-slate-700 shadow-2xs transition-colors cursor-pointer active:scale-98"
              title="قائمة الحساب والعمليات"
            >
              {/* Initials Avatar */}
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-900 text-[10.5px] font-bold text-white">
                {initials}
              </div>
              <span className="hidden sm:inline font-cairo text-slate-800 font-bold">
                كابتن {firstName}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 shrink-0" />

              {/* Notification Dot */}
              {hasMenuNotification && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                </span>
              )}
            </button>

            {/* Executive Menu Dropdown */}
            {showAccountMenu && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-2xs sm:hidden"
                  onClick={() => setShowAccountMenu(false)}
                />
                <div
                  className="fixed sm:absolute bottom-0 sm:bottom-auto left-0 sm:left-0 right-0 sm:right-auto sm:top-full sm:mt-1.5 w-full sm:w-72 rounded-t-2xl sm:rounded-xl border border-slate-200/90 bg-white p-1.5 shadow-xl z-50 animate-slide-up pb-safe text-right"
                  dir="rtl"
                >
                  {/* Menu User Header */}
                  <div className="px-3 py-2.5 border-b border-slate-100 mb-1">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="block truncate font-cairo text-xs font-bold text-slate-900">
                        {fullName}
                      </strong>
                      <span className="rounded bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 text-[9.5px] font-bold">
                        نشط PRO
                      </span>
                    </div>
                    <span className="block truncate text-[11px] text-slate-400 mt-0.5">
                      {academyName}
                    </span>
                  </div>

                  {/* Menu Items */}
                  <div className="space-y-0.5">
                    {/* 1. Platform Guide */}
                    {onOpenFeatures && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onOpenFeatures();
                        }}
                        className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
                          <span>دليل ومميزات المنصة</span>
                        </div>
                        {hasUnreadGuide && (
                          <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px] font-black">
                            تحديثات جديدة
                          </span>
                        )}
                      </button>
                    )}

                    {/* 2. Account & Plan Settings */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        onOpenAccountSettings?.();
                      }}
                      className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-slate-400 shrink-0" />
                        <span>إعدادات الحساب والخطة</span>
                      </div>
                      {hasUnreadPlanUpdate && (
                        <span className="rounded-full bg-red-500 text-white px-1.5 py-0.2 text-[9px] font-black">
                          تعديل الخطة
                        </span>
                      )}
                    </button>

                    {/* 3. Excel Export (For mobile access or quick menu) */}
                    {onOpenExportExcel && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAccountMenu(false);
                          onOpenExportExcel("players");
                        }}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>تصدير بيانات الأكاديمية (.xlsx)</span>
                      </button>
                    )}

                    {/* 4. Instant Cloud Backup */}
                    {onInstantCloudBackup && (
                      <button
                        type="button"
                        disabled={isCloudBackingUp}
                        onClick={() => {
                          setShowAccountMenu(false);
                          onInstantCloudBackup();
                        }}
                        className="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-blue-500 shrink-0" />
                          <span>نسخ احتياطي سحابي فوري</span>
                        </div>
                        {isCloudBackingUp && (
                          <span className="text-[10px] text-blue-600 animate-pulse">
                            جاري الحفظ...
                          </span>
                        )}
                      </button>
                    )}

                    {/* Divider */}
                    <div className="my-1 border-t border-slate-100" />

                    {/* 5. Sign Out */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowAccountMenu(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 text-red-500 shrink-0" />
                      <span>تسجيل الخروج من النظام</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
