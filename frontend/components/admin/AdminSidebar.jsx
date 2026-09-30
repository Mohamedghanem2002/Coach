"use client";
import React, { useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Trophy,
  History,
  ShieldCheck,
  LogOut,
  ExternalLink,
  Crown,
  ChevronLeft,
  UserCheck,
  LayoutGrid,
  X,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  adminUser,
  accountsCount = 0,
  playersCount = 0,
  hallsCount = 0,
  eventsCount = 0,
  captainsCount = 0,
  academiesCount = 0,
}) {
  const [showMoreMobile, setShowMoreMobile] = useState(false);
  const displayAccounts = accountsCount || captainsCount || academiesCount || 0;

  const navItems = [
    {
      id: "overview",
      label: "الإحصائيات",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "accounts",
      label: "الحسابات",
      icon: Users,
      badge: displayAccounts ? String(displayAccounts) : null,
      aliases: ["captains", "academies"],
    },
    {
      id: "players",
      label: "اللاعبين",
      icon: UserCheck,
      badge: playersCount ? String(playersCount) : null,
    },
    {
      id: "halls",
      label: "الصالات والملاعب",
      icon: Building2,
      badge: hallsCount ? String(hallsCount) : null,
    },
    {
      id: "events",
      label: "الفعاليات والبطولات",
      icon: Trophy,
      badge: eventsCount ? String(eventsCount) : null,
    },
    {
      id: "audit",
      label: "سجل العمليات",
      icon: History,
      badge: null,
    },
    {
      id: "promo",
      label: "الكارت الترويجي",
      icon: Sparkles,
      badge: "NEW",
    },
  ];

  const mobilePrimaryTabs = [
    {
      id: "accounts",
      label: "الحسابات",
      icon: Users,
      badge: displayAccounts ? String(displayAccounts) : null,
      aliases: ["captains", "academies"],
    },
    {
      id: "overview",
      label: "الإحصائيات",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "players",
      label: "اللاعبين",
      icon: UserCheck,
      badge: playersCount ? String(playersCount) : null,
    },
  ];

  const isMoreActive = ["halls", "events", "audit", "promo"].includes(activeTab);

  return (
    <>
      {/* ── 1. Desktop Sidebar (Full Menu) ── */}
      <aside
        className="hidden lg:flex w-72 flex-col justify-between border-l border-slate-200/80 bg-white p-5 shrink-0 min-h-screen"
        dir="rtl"
      >
        <div className="space-y-6">
          {/* Platform Admin Brand */}
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-500/20 ring-2 ring-red-100">
              <Crown className="w-6 h-6 fill-white/20 stroke-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-base font-black text-slate-900 tracking-tight">
                  تحكم المنصة
                </h1>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 border border-amber-200">
                  ADMIN
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-400">
                إدارة شاملة لكافة البيانات
              </p>
            </div>
          </div>

          {/* Admin User Card */}
          <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
              {(adminUser?.name || "A").charAt(0)}
            </div>
            <div className="min-w-0">
              <strong className="block text-xs font-black text-slate-800 truncate">
                {adminUser?.name || "المدير العام"}
              </strong>
              <span className="block text-[10px] font-mono text-slate-400 truncate" dir="ltr">
                {adminUser?.email || "mg0447837@gmail.com"}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                activeTab === item.id || (item.aliases && item.aliases.includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-black transition cursor-pointer ${
                    active
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        active ? "bg-white text-red-600" : "bg-slate-200/80 text-slate-700"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2 pt-4 border-t border-slate-100">
          <Link
            href="/"
            className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-black transition cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <ExternalLink className="w-4 h-4 text-slate-400" />
              <span>العودة لبرنامج الأكاديمية</span>
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400" />
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin?admin=true" })}
            className="w-full flex items-center gap-2.5 p-3 rounded-2xl border border-red-100 bg-red-50/50 hover:bg-red-100/80 text-red-600 text-xs font-black transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* ── 2. Mobile App Native Header + Bottom Bar ── */}
      <div className="lg:hidden">
        {/* Native Mobile App Header */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs"
          dir="rtl"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-xs">
              <Crown className="w-4 h-4 fill-white/20 stroke-white" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900 leading-tight">
                لوحة تحكم المنصة 👑
              </span>
              <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[170px]" dir="ltr">
                {adminUser?.email || "mg0447837@gmail.com"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1"
            >
              <span>التطبيق</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin?admin=true" })}
              className="p-1.5 rounded-xl text-red-600 hover:bg-red-50"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Native Mobile App Bottom Navigation Bar (4 Spacious Tabs) */}
        <nav
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around h-16 px-2 shadow-lg"
          dir="rtl"
        >
          {mobilePrimaryTabs.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id || (item.aliases && item.aliases.includes(activeTab));
            return (
              <button
                key={item.id}
                onClick={() => {
                  setShowMoreMobile(false);
                  onSelectTab(item.id);
                }}
                className={`relative flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition cursor-pointer touch-manipulation active-press ${
                  active ? "text-red-600 font-black" : "text-slate-500 font-bold"
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 ${active ? "stroke-[2.5]" : ""}`} />
                  {item.badge && (
                    <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[9px] font-mono font-black">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] truncate">{item.label}</span>
              </button>
            );
          })}

          {/* 4th Tab: "المزيد" opens mobile sheet */}
          <button
            type="button"
            onClick={() => setShowMoreMobile(!showMoreMobile)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition cursor-pointer touch-manipulation active-press ${
              isMoreActive || showMoreMobile ? "text-red-600 font-black" : "text-slate-500 font-bold"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] truncate">المزيد</span>
          </button>
        </nav>

        {/* Native Slide-up Drawer for "المزيد" */}
        {showMoreMobile && (
          <div
            className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-backdrop pb-16"
            onClick={() => setShowMoreMobile(false)}
            dir="rtl"
          >
            <div
              className="w-full bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-3 shadow-2xl animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-2" />

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">الأقسام والخدمات الإدارية</h3>
                <button
                  type="button"
                  onClick={() => setShowMoreMobile(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMobile(false);
                    onSelectTab("halls");
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                    activeTab === "halls" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>الصالات والملاعب</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMobile(false);
                    onSelectTab("events");
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                    activeTab === "events" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-600" />
                  <span>الفعاليات والبطولات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMobile(false);
                    onSelectTab("audit");
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                    activeTab === "audit" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                >
                  <History className="w-4 h-4 text-slate-600" />
                  <span>سجل العمليات</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMoreMobile(false);
                    onSelectTab("promo");
                  }}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                    activeTab === "promo" ? "bg-red-50 border-red-200 text-red-700" : "bg-gradient-to-l from-red-50 to-orange-50 border-red-200 text-red-800"
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-red-500" />
                  <span className="font-black">الكارت الترويجي ✨</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
