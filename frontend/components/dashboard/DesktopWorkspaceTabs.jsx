"use client";
import React from "react";
import { Users, CreditCard, Building2, Compass, Cake, Plus } from "lucide-react";

export default function DesktopWorkspaceTabs({
  activeView = "players",
  onChangeView,
  playersCount = 0,
  totalPendingPaymentCount = 0,
  branchesCount = 0,
  eventsCount = 0,
  todayBirthdaysCount = 0,
  onAddPlayer,
}) {
  return (
    <div className="hidden md:flex items-center justify-between gap-3 xl:gap-4 border-b border-slate-200/90 pb-4 mb-6">
      <div className="workspace-tabs-container shadow-2xs overflow-x-auto scrollbar-none min-w-0 flex-1 max-w-fit p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80">
        <button
          type="button"
          onClick={() => onChangeView("players")}
          className={`workspace-tab-btn cursor-pointer px-3.5 xl:px-4.5 py-2 xl:py-2.5 rounded-xl font-black text-xs xl:text-sm transition-all ${
            activeView === "players"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Users className="h-4 w-4 text-red-600 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">قائمة الأبطال والتحضير</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-black shrink-0 ${
              activeView === "players" ? "bg-red-100 text-red-800" : "bg-slate-200/80 text-slate-700"
            }`}
          >
            {playersCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeView("finances")}
          className={`workspace-tab-btn cursor-pointer px-3.5 xl:px-4.5 py-2 xl:py-2.5 rounded-xl font-black text-xs xl:text-sm transition-all ${
            activeView === "finances"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <CreditCard className="h-4 w-4 text-sky-600 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">المركز المالي والتقارير</span>
          {totalPendingPaymentCount > 0 ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-800 shrink-0">
              {totalPendingPaymentCount} معلق
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800 shrink-0">
              منضبط ✨
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeView("branches")}
          className={`workspace-tab-btn cursor-pointer px-3.5 xl:px-4.5 py-2 xl:py-2.5 rounded-xl font-black text-xs xl:text-sm transition-all ${
            activeView === "branches"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Building2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">الصالات ومراكز التدريب</span>
          <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700 shrink-0">
            {branchesCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onChangeView("events")}
          className={`workspace-tab-btn cursor-pointer px-3.5 xl:px-4.5 py-2 xl:py-2.5 rounded-xl font-black text-xs xl:text-sm transition-all ${
            activeView === "events"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Compass className="h-4 w-4 text-purple-600 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">الفعاليات والبطولات</span>
          {eventsCount > 0 && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-black text-sky-700 shrink-0">
              {eventsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChangeView("birthdays")}
          className={`workspace-tab-btn cursor-pointer px-3.5 xl:px-4.5 py-2 xl:py-2.5 rounded-xl font-black text-xs xl:text-sm transition-all ${
            activeView === "birthdays"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
          }`}
        >
          <Cake className="h-4 w-4 text-rose-600 shrink-0" />
          <span className="shrink-0 whitespace-nowrap">تذكار أعياد الميلاد</span>
          {todayBirthdaysCount > 0 && (
            <span className="rounded-full bg-red-600 text-white px-2 py-0.5 text-[11px] font-black animate-pulse shrink-0 whitespace-nowrap">
              {todayBirthdaysCount} اليوم!
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          id="workspace-add-player-btn"
          onClick={onAddPlayer}
          className="flex items-center gap-2 px-4 xl:px-5 py-2.5 xl:py-3 rounded-xl xl:rounded-2xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-xs xl:text-sm font-black text-white shadow-xs shadow-red-600/20 cursor-pointer active-press transition shrink-0 whitespace-nowrap select-none"
        >
          <Plus className="h-4 w-4 stroke-[3] shrink-0" />
          <span className="shrink-0 whitespace-nowrap">تسجيل لاعب جديد</span>
        </button>
      </div>
    </div>
  );
}
