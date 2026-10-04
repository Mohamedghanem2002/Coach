"use client";
import { useState, useRef, useEffect, useMemo } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Cake,
  CalendarDays,
  LogOut,
  Settings,
  Sparkles,
  FileSpreadsheet,
  Cloud,
  ChevronDown,
  X,
} from "lucide-react";
import {
  getTodayBirthdays,
  getUpcomingBirthdays,
} from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";
import CoachMasterLogo from "./CoachMasterLogo";

/* ═══════════════════════════════════════════════════════════════════════════
   MODULE-LEVEL HELPER COMPONENTS (Satisfies react-hooks/static-components)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Small count badge */
function CountBadge({ count, variant = "default" }) {
  if (!count && count !== 0) return null;
  const styles = {
    default: "bg-slate-100 text-slate-700 border border-slate-200",
    brand: "bg-red-600 text-white",
    rose: "bg-rose-600 text-white",
    amber: "bg-amber-500 text-white",
    slate: "bg-slate-900 text-white",
    emerald: "bg-emerald-600 text-white",
  };
  return (
    <span
      className={`flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-black ${
        styles[variant] || styles.default
      }`}
    >
      {count}
    </span>
  );
}

/** Notification pulsing indicator dot */
function NotifDot({ visible }) {
  if (!visible) return null;
  return (
    <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
    </span>
  );
}

/** Menu Item for Settings / Account dropdown */
function SettingsMenuItem({
  icon: Icon,
  iconClass = "text-slate-400",
  label,
  subtitle,
  badge,
  badgeVariant = "red",
  onClick,
  onClose,
  danger = false,
  disabled = false,
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onClose?.();
        onClick?.();
      }}
      className={[
        "w-full flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150 text-right select-none",
        danger
          ? "text-red-600 hover:bg-red-50 active:bg-red-100/80"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-950 active:bg-slate-100",
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            danger
              ? "bg-red-50 text-red-600"
              : "bg-slate-100/80 text-slate-600"
          }`}
        >
          <Icon className={`h-4 w-4 shrink-0 ${danger ? "text-red-600" : iconClass}`} />
        </div>
        <div className="min-w-0 text-right">
          <p className="truncate font-bold leading-tight">{label}</p>
          {subtitle && (
            <p className="text-[10.5px] font-normal text-slate-400 truncate mt-0.5 leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {badge && (
        <span
          className={`rounded-full px-2 py-0.5 text-[9.5px] font-black shrink-0 ${
            badgeVariant === "red"
              ? "bg-red-500 text-white"
              : "bg-amber-100 text-amber-800 border border-amber-200"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/** Settings & Account Flyout (Anchored under the Settings button on all screens) */
function SettingsFlyout({
  fullName,
  academyName,
  firstName,
  hasUnreadGuide,
  hasUnreadPlanUpdate,
  isCloudBackingUp,
  onOpenFeatures,
  onOpenAccountSettings,
  onInstantCloudBackup,
  onSignOut,
  onClose,
}) {
  return (
    <>
      {/* Invisible/Subtle Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-2xs"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Flyout panel — Always drops down right below the Settings button */}
      <div
        className={[
          "absolute left-0 top-full mt-2 z-50",
          "w-72 sm:w-80 max-w-[calc(100vw-24px)]",
          "rounded-2xl border border-slate-200/90 bg-white p-2",
          "shadow-2xl shadow-slate-900/15 animate-slide-down",
          "max-h-[85vh] overflow-y-auto text-right",
        ].join(" ")}
        dir="rtl"
      >
        {/* Profile Card Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 mb-1.5 bg-slate-50/80 rounded-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-xs font-black shadow-xs">
              {firstName.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-900 leading-tight">
                {fullName}
              </p>
              <p className="truncate text-[10.5px] font-semibold text-slate-400 mt-0.5 leading-tight">
                {academyName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 text-[10px] font-black text-emerald-700">
              PRO
            </span>
            <button
              type="button"
              aria-label="إغلاق"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* List of Settings Options */}
        <div className="space-y-0.5">
          {/* 1. إعدادات الحساب والخطة */}
          <SettingsMenuItem
            icon={Settings}
            iconClass="text-slate-600"
            label="إعدادات الحساب والخطة"
            subtitle="بيانات الكابتن، الاشتراكات وتفاصيل الخطة"
            badge={hasUnreadPlanUpdate ? "تحديث" : null}
            onClick={onOpenAccountSettings}
            onClose={onClose}
          />

          {/* 2. دليل ومميزات المنصة */}
          {onOpenFeatures && (
            <SettingsMenuItem
              icon={Sparkles}
              iconClass="text-amber-500"
              label="دليل ومميزات المنصة"
              subtitle="شرح ومميزات النظام وتحديثات الإصدار"
              badge={hasUnreadGuide ? "جديد" : null}
              badgeVariant="red"
              onClick={onOpenFeatures}
              onClose={onClose}
            />
          )}

          {/* 3. نسخ احتياطي سحابي */}
          {onInstantCloudBackup && (
            <SettingsMenuItem
              icon={Cloud}
              iconClass="text-sky-500"
              label="نسخ احتياطي سحابي فوري"
              subtitle={isCloudBackingUp ? "جاري الحفظ والمزامنة..." : "حفظ بيانات الأكاديمية واللاعبين"}
              badge={isCloudBackingUp ? "جاري..." : null}
              badgeVariant="amber"
              disabled={isCloudBackingUp}
              onClick={onInstantCloudBackup}
              onClose={onClose}
            />
          )}

          {/* فاصل */}
          <div className="my-1.5 border-t border-slate-100" />

          {/* 4. تسجيل الخروج من النظام — داخل الإعدادات تماماً كما طلب المستخدم */}
          <SettingsMenuItem
            icon={LogOut}
            label="تسجيل الخروج من النظام"
            subtitle="الخروج الآمن من جلسة العمل الحالية"
            danger
            onClick={onSignOut}
            onClose={onClose}
          />
        </div>
      </div>
    </>
  );
}

/** Birthday Dropdown Flyout */
function BirthdayFlyout({
  todayBirthdays,
  upcomingBirthdays,
  totalBirthdayCount,
  firstName,
  onClose,
  onOpenPlayer,
  onNavigateToBirthdays,
}) {
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-2xs"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={[
          "absolute right-0 top-full mt-2 z-50",
          "w-72 sm:w-80 max-w-[calc(100vw-24px)]",
          "rounded-2xl border border-slate-200/90 bg-white p-3.5",
          "shadow-2xl shadow-slate-900/15 animate-slide-down",
          "max-h-[85vh] overflow-y-auto text-right",
        ].join(" ")}
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2.5">
          <div className="flex items-center gap-2">
            <Cake className="h-4 w-4 text-rose-500" />
            <strong className="font-cairo text-xs font-bold text-slate-800">
              أعياد ميلاد الأبطال
            </strong>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {totalBirthdayCount} مناسبة
            </span>
            <button
              type="button"
              aria-label="إغلاق"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          {todayBirthdays.length > 0 && (
            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping inline-block" />
                اليوم ({todayBirthdays.length}):
              </span>
              {todayBirthdays.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-rose-100 bg-rose-50/60 p-2 text-xs"
                >
                  <div className="min-w-0">
                    <span className="block truncate font-bold text-slate-900">
                      {player.name}
                    </span>
                    <span className="block text-[10px] text-rose-600 font-semibold">
                      اليوم 🎉 · {player.birthdayInfo?.turningAge} سنة
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        sendBirthdayCardViaWhatsApp(player, firstName);
                      }}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10.5px] font-bold transition-colors cursor-pointer"
                    >
                      🎂 تهنئة
                    </button>
                    {onOpenPlayer && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenPlayer(player);
                        }}
                        className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2 py-1 text-[10.5px] font-bold transition-colors cursor-pointer"
                      >
                        الملف
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {upcomingBirthdays.length > 0 && (
            <div className={`space-y-1.5 ${todayBirthdays.length > 0 ? "pt-2 border-t border-slate-100" : ""}`}>
              <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" />
                غداً ({upcomingBirthdays.length}):
              </span>
              {upcomingBirthdays.map((player) => (
                <div
                  key={player._id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2 text-xs"
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
                      onClose();
                      sendBirthdayCardViaWhatsApp(player, firstName);
                    }}
                    className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-2.5 py-1 text-[10.5px] font-bold transition-colors cursor-pointer"
                  >
                    تهنئة
                  </button>
                </div>
              ))}
            </div>
          )}

          {todayBirthdays.length === 0 && upcomingBirthdays.length === 0 && (
            <div className="py-6 text-center text-slate-400 text-xs">
              <Cake className="h-8 w-8 mx-auto mb-2 text-slate-300 opacity-60" />
              لا توجد أعياد ميلاد قريبة
            </div>
          )}

          {onNavigateToBirthdays && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToBirthdays();
              }}
              className="mt-2 w-full text-center py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-100"
            >
              عرض مركز أعياد الميلاد بالكامل ←
            </button>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN 2-ROW HEADER COMPONENT
   ═══════════════════════════════════════════════════════════════════════════ */
export default function Header({
  players = [],
  onOpenPlayer,
  academyName: propAcademyName,
  currentView = "players",
  onToggleEventsView, // Not rendered in header anymore per user request
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

  // Active flyout state: null | "settings" | "birthdays"
  const [activeMenu, setActiveMenu] = useState(null);
  const headerRef = useRef(null);

  const fullName = session?.user?.name || "حساب الأكاديمية";
  const academyName = propAcademyName || session?.user?.academyName || "CoachMaster";
  const firstName = fullName.split(" ")[0] || "كابتن";

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
  const hasSettingsNotification = hasUnreadPlanUpdate || hasUnreadGuide;

  // Click outside to close any open menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setActiveMenu(null);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      if (!window.confirm("هل تريد بالتأكيد تسجيل الخروج من النظام؟")) {
        return;
      }
    }
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  const toggleMenu = (name) => {
    setActiveMenu((prev) => (prev === name ? null : name));
  };

  return (
    <header
      ref={headerRef}
      dir="rtl"
      className="sticky top-0 z-40 w-full border-b border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs transition-all select-none"
    >
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
        
        {/* ═══════════════════════════════════════════════════════════════════
            الجزء العلوي (TOP ROW): الوجو والإعدادات (وتسجيل الخروج داخل الإعدادات)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex h-13 sm:h-14 items-center justify-between gap-3 border-b border-slate-100">
          
          {/* 1. الوجو وهوية المنصة والأكاديمية (الجانب الأيمن) */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            {/* الشعار الجديد الفاتح الخاص بالمنصة */}
            <CoachMasterLogo size="default" />

            {/* هوية المنصة فوق + اسم أكاديمية الكابتن تحت (في جميع الشاشات) */}
            <div className="flex flex-col justify-center min-w-0">
              {/* السطر الأول: اسم المنصة (ظاهر في جميع الشاشات) */}
              <div className="flex items-center gap-1.5 leading-none">
                <span className="font-cairo text-[10.5px] sm:text-[11.5px] font-black tracking-wide text-red-600 flex items-center gap-1 select-none">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                  CoachMaster
                </span>
                <span className="text-[9px] font-bold text-slate-400 select-none">
                  · المنصة
                </span>
              </div>

              {/* السطر الثاني: اسم أكاديمية الكابتن + شارة PRO */}
              <div className="flex items-center gap-1.5 min-w-0 mt-0.5">
                <h1
                  className="font-cairo text-xs sm:text-[14px] font-extrabold tracking-tight text-slate-900 truncate max-w-[125px] xs:max-w-[170px] sm:max-w-[240px] md:max-w-[320px] leading-tight"
                  title={academyName}
                >
                  {academyName}
                </h1>
                <span className="inline-flex items-center rounded-md bg-red-50 border border-red-200/80 px-1.5 py-0.5 text-[8.5px] sm:text-[9px] font-black text-red-700 leading-none shrink-0 shadow-2xs">
                  PRO
                </span>
              </div>
            </div>
          </div>

          {/* 2. زر الإعدادات الموحّد (الجانب الأيسر) */}
          <div className="relative">
            <button
              type="button"
              id="header-settings-btn"
              aria-label="قائمة الإعدادات والحساب"
              aria-expanded={activeMenu === "settings"}
              onClick={() => toggleMenu("settings")}
              className={[
                "relative flex h-9 items-center gap-2 rounded-xl border px-2.5 sm:px-3 text-xs font-bold transition-all duration-150 cursor-pointer active:scale-97",
                activeMenu === "settings"
                  ? "border-slate-300 bg-slate-100 text-slate-950 shadow-xs"
                  : "border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 shadow-2xs",
              ].join(" ")}
            >
              <div className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <Settings
                  className={`h-3.5 w-3.5 transition-transform duration-300 ${
                    activeMenu === "settings" ? "rotate-90 text-slate-900" : ""
                  }`}
                />
              </div>
              
              <span className="font-cairo font-bold">
                الإعدادات
              </span>

              <span className="hidden sm:inline text-slate-400 font-normal text-[11px]">
                · {firstName}
              </span>

              <ChevronDown
                className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${
                  activeMenu === "settings" ? "-rotate-180" : ""
                }`}
              />

              {/* نقطة تنبيه حية */}
              <NotifDot visible={hasSettingsNotification} />
            </button>

            {/* القائمة المنسدلة للإعدادات (تحتوي على كل الإعدادات ومن ضمنها تسجيل الخروج) */}
            {activeMenu === "settings" && (
              <SettingsFlyout
                fullName={fullName}
                academyName={academyName}
                firstName={firstName}
                hasUnreadGuide={hasUnreadGuide}
                hasUnreadPlanUpdate={hasUnreadPlanUpdate}
                isCloudBackingUp={isCloudBackingUp}
                onOpenFeatures={onOpenFeatures}
                onOpenAccountSettings={onOpenAccountSettings}
                onInstantCloudBackup={onInstantCloudBackup}
                onSignOut={handleSignOut}
                onClose={() => setActiveMenu(null)}
              />
            )}
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            الجزء السفلي (BOTTOM ROW): باقي العناصر (تمت إزالة اللاعبين والفعاليات)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="flex min-h-[44px] py-1.5 items-center justify-between gap-2 relative overflow-visible">
          
          {/* الجانب الأيمن: تصدير إكسيل وأعياد الميلاد */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* 1. زر تصدير إكسيل المميز */}
            {onOpenExportExcel && (
              <button
                type="button"
                id="header-export-excel-btn"
                onClick={() => onOpenExportExcel("players")}
                className="flex h-8 sm:h-8.5 items-center gap-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/70 hover:bg-emerald-100/80 text-emerald-800 px-2.5 sm:px-3 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-97 select-none shrink-0"
                title="تصدير بيانات الأكاديمية واللاعبين إلى ملف إكسيل (.xlsx)"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="font-cairo">تصدير إكسيل</span>
              </button>
            )}

            {/* 2. زر أعياد الميلاد مع العداد */}
            <div className="relative">
              <button
                type="button"
                id="header-birthdays-btn"
                aria-label="أعياد ميلاد اللاعبين"
                aria-expanded={activeMenu === "birthdays"}
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.innerWidth < 768 &&
                    onNavigateToBirthdays
                  ) {
                    onNavigateToBirthdays();
                  } else {
                    toggleMenu("birthdays");
                  }
                }}
                className={[
                  "relative flex h-8 sm:h-8.5 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-bold transition-all cursor-pointer active:scale-97 select-none shrink-0",
                  activeMenu === "birthdays" || currentView === "birthdays"
                    ? "border-rose-300 bg-rose-50 text-rose-800 shadow-2xs"
                    : todayBirthdays.length > 0
                    ? "border-rose-200 bg-rose-50/70 text-rose-700 hover:bg-rose-100/80"
                    : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 shadow-2xs",
                ].join(" ")}
                title="أعياد ميلاد أبطال الأكاديمية"
              >
                <Cake className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                <span className="font-cairo">أعياد الميلاد</span>
                {totalBirthdayCount > 0 && (
                  <CountBadge
                    count={totalBirthdayCount}
                    variant={todayBirthdays.length > 0 ? "rose" : "amber"}
                  />
                )}
              </button>

              {/* القائمة المنبثقة لأعياد الميلاد */}
              {activeMenu === "birthdays" && (
                <BirthdayFlyout
                  todayBirthdays={todayBirthdays}
                  upcomingBirthdays={upcomingBirthdays}
                  totalBirthdayCount={totalBirthdayCount}
                  firstName={firstName}
                  onClose={() => setActiveMenu(null)}
                  onOpenPlayer={onOpenPlayer}
                  onNavigateToBirthdays={onNavigateToBirthdays}
                />
              )}
            </div>

          </div>

          {/* الجانب الأيسر: اختصارات سريعة (دليل المنصة + نسخ سحابي) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* دليل المنصة */}
            {onOpenFeatures && (
              <button
                type="button"
                id="header-features-quick-btn"
                onClick={onOpenFeatures}
                className="flex h-8 sm:h-8.5 items-center gap-1.5 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-2.5 sm:px-3 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-97 select-none shrink-0"
                title="دليل ومميزات المنصة"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="hidden xs:inline font-cairo">دليل المنصة</span>
                {hasUnreadGuide && (
                  <span className="flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-red-500 px-0.5 text-[8.5px] font-black text-white">
                    1
                  </span>
                )}
              </button>
            )}

            {/* نسخ احتياطي سحابي سريع */}
            {onInstantCloudBackup && (
              <button
                type="button"
                id="header-backup-quick-btn"
                disabled={isCloudBackingUp}
                onClick={onInstantCloudBackup}
                className="flex h-8 sm:h-8.5 items-center gap-1.5 rounded-xl border border-sky-200/80 bg-sky-50/60 hover:bg-sky-100/80 text-sky-800 px-2.5 sm:px-3 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-97 select-none shrink-0 disabled:opacity-50"
                title="حفظ نسخة احتياطية سحابية فورية"
              >
                <Cloud className={`h-3.5 w-3.5 text-sky-600 shrink-0 ${isCloudBackingUp ? "animate-pulse" : ""}`} />
                <span className="hidden xs:inline font-cairo">
                  {isCloudBackingUp ? "جاري الحفظ..." : "نسخ سحابي"}
                </span>
              </button>
            )}

          </div>

        </div>

      </div>
    </header>
  );
}
