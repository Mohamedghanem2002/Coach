"use client";
import { Users, BarChart3, Building2, Compass, Plus } from "lucide-react";

export default function MobileBottomNav({
  activeTab = "players",
  onChangeTab,
  onOpenAddPlayer,
  playersCount = 0,
  branchesCount = 0,
  eventsCount = 0,
  birthdayCount = 0,
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
    // Center FAB placeholder
    null,
    {
      id: "branches",
      label: "الصالات",
      icon: Building2,
      badge: branchesCount > 0 ? branchesCount : null,
    },
    {
      id: "stats",
      label: "المؤشرات",
      icon: BarChart3,
      badge: birthdayCount > 0 ? "🎂" : null,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 mobile-bottom-bar pb-safe w-full max-w-full"
      dir="rtl"
      aria-label="شريط التنقل الرئيسي للهاتف"
    >
      <div className="mx-auto flex max-w-lg w-full items-end pt-1.5">
        {tabs.map((tab, idx) => {
          // Center FAB
          if (tab === null) {
            return (
              <div
                key="fab"
                className="flex flex-1 items-center justify-center"
              >
                <button
                  type="button"
                  onClick={onOpenAddPlayer}
                  className="
                    flex h-[52px] w-[52px] -translate-y-3
                    items-center justify-center
                    rounded-full
                    bg-red-600
                    text-white
                    shadow-lg shadow-red-600/35
                    ring-[3px] ring-white
                    active:scale-95
                    transition-all duration-150
                    touch-manipulation cursor-pointer select-none
                  "
                  title="تسجيل لاعب جديد"
                  aria-label="تسجيل لاعب جديد"
                >
                  <Plus className="h-6 w-6 stroke-[2.5]" />
                </button>
              </div>
            );
          }

          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`
                relative flex flex-1 flex-col items-center justify-center
                py-1.5 px-1 gap-0.5
                min-h-[52px] min-w-0
                touch-manipulation cursor-pointer
                transition-all duration-150
                ${isActive ? "text-red-600" : "text-slate-400 hover:text-slate-600"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Icon with badge */}
              <div className="relative flex h-7 w-7 items-center justify-center">
                <Icon
                  className={`h-[22px] w-[22px] transition-all duration-200 ${
                    isActive ? "scale-110 stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
                {tab.badge && (
                  <span
                    className={`
                      absolute -top-1.5 -right-1.5
                      flex h-[15px] min-w-[15px] items-center justify-center
                      rounded-full px-0.5
                      text-[9px] font-black leading-none
                      ${tab.id === "events"
                        ? "bg-amber-500 text-white"
                        : "bg-slate-100 border border-slate-300/80 text-slate-700"
                      }
                    `}
                  >
                    {tab.badge > 99 ? "99+" : tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[10px] leading-none font-bold tracking-tight ${
                  isActive ? "font-extrabold" : ""
                }`}
              >
                {tab.label}
              </span>

              {/* Active indicator */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-[2.5px] w-6 rounded-full bg-red-600 animate-slide-down" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
