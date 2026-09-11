"use client";
import { Users, BarChart3, Building2, Compass, Plus } from "lucide-react";

export default function MobileBottomNav({
  activeTab = "players",
  onChangeTab,
  onOpenAddPlayer,
  playersCount = 0,
  branchesCount = 0,
  eventsCount = 0,
}) {
  const tabs = [
    {
      id: "players",
      label: "اللاعبين",
      icon: Users,
      badge: playersCount > 0 ? playersCount : null,
    },
    {
      id: "events",
      label: "الفعاليات",
      icon: Compass,
      badge: eventsCount > 0 ? eventsCount : null,
    },
    // Center FAB: Add Player
    {
      id: "branches",
      label: "الصالات",
      icon: Building2,
      badge: branchesCount > 0 ? branchesCount : null,
    },
    {
      id: "stats",
      label: "الإحصائيات",
      icon: BarChart3,
      badge: null,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 mobile-bottom-bar px-2 pt-1.5 pb-safe"
      dir="rtl"
      aria-label="شريط التنقل الرئيسي للهاتف"
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-1">
        {/* Tab 1: Players */}
        {(() => {
          const tab = tabs[0];
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all touch-manipulation cursor-pointer active-press min-h-[50px] ${
                isActive
                  ? "text-red-600 font-black"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative flex h-6 items-center justify-center">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -left-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-100 border border-slate-300 px-1 text-[9px] font-black text-slate-700">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`mt-1 text-[11px] leading-tight truncate ${isActive ? "font-black" : "font-semibold"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-red-600 animate-slide-up" />
              )}
            </button>
          );
        })()}

        {/* Tab 2: Events */}
        {(() => {
          const tab = tabs[1];
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all touch-manipulation cursor-pointer active-press min-h-[50px] ${
                isActive
                  ? "text-red-600 font-black"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative flex h-6 items-center justify-center">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -left-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-black text-white shadow-2xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`mt-1 text-[11px] leading-tight truncate ${isActive ? "font-black" : "font-semibold"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-red-600 animate-slide-up" />
              )}
            </button>
          );
        })()}

        {/* Center Prominent Elevated FAB: Add Player */}
        <div className="flex shrink-0 items-center justify-center px-1">
          <button
            type="button"
            onClick={onOpenAddPlayer}
            className="flex h-12 w-12 -translate-y-3.5 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-500 text-white shadow-lg shadow-red-500/35 ring-4 ring-white active:scale-90 transition-all touch-manipulation cursor-pointer"
            title="تسجيل لاعب جديد"
            aria-label="تسجيل لاعب جديد"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: Branches */}
        {(() => {
          const tab = tabs[2];
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all touch-manipulation cursor-pointer active-press min-h-[50px] ${
                isActive
                  ? "text-red-600 font-black"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative flex h-6 items-center justify-center">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -left-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-slate-100 border border-slate-300 px-1 text-[9px] font-black text-slate-700">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`mt-1 text-[11px] leading-tight truncate ${isActive ? "font-black" : "font-semibold"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-red-600 animate-slide-up" />
              )}
            </button>
          );
        })()}

        {/* Tab 4: Stats */}
        {(() => {
          const tab = tabs[3];
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-1 flex-col items-center justify-center py-1 px-1 transition-all touch-manipulation cursor-pointer active-press min-h-[50px] ${
                isActive
                  ? "text-red-600 font-black"
                  : "text-slate-400 hover:text-slate-600 font-bold"
              }`}
            >
              <div className="relative flex h-6 items-center justify-center">
                <Icon className={`h-5 w-5 transition-transform ${isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"}`} />
              </div>
              <span className={`mt-1 text-[11px] leading-tight truncate ${isActive ? "font-black" : "font-semibold"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="mt-0.5 h-1 w-5 rounded-full bg-red-600 animate-slide-up" />
              )}
            </button>
          );
        })()}
      </div>
    </nav>
  );
}

