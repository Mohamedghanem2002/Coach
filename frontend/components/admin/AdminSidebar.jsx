"use client";
import React from "react";
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
  const displayAccounts = accountsCount || captainsCount || academiesCount || 0;

  const navItems = [
    {
      id: "overview",
      label: "لوحة الإحصائيات",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "accounts",
      label: "إدارة الحسابات",
      icon: Users,
      badge: displayAccounts ? String(displayAccounts) : null,
      aliases: ["captains", "academies"],
    },
    {
      id: "players",
      label: "إدارة اللاعبين",
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
      label: "إدارة الفعاليات",
      icon: Trophy,
      badge: eventsCount ? String(eventsCount) : null,
    },
    {
      id: "audit",
      label: "سجل العمليات",
      icon: History,
      badge: null,
    },
  ];

  return (
    <>
      {/* 1. Desktop Sidebar */}
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

      {/* 2. Mobile Top Bar + Bottom Navigation */}
      <div className="lg:hidden">
        {/* Top Header */}
        <div
          className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200"
          dir="rtl"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-red-600 to-amber-600 flex items-center justify-center text-white shadow-xs">
              <Crown className="w-5 h-5 fill-white/20 stroke-white" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900">تحكم المنصة 👑</span>
              <span className="block text-[10px] text-slate-400 font-mono truncate max-w-[160px]" dir="ltr">
                {adminUser?.email || "mg0447837@gmail.com"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-xs font-black flex items-center gap-1"
            >
              <span>التطبيق</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin?admin=true" })}
              className="p-2 rounded-xl text-red-600 hover:bg-red-50"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <nav
          className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around py-1.5 px-2 shadow-lg"
          dir="rtl"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id || (item.aliases && item.aliases.includes(activeTab));
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition cursor-pointer ${
                  active ? "text-red-600 font-black" : "text-slate-500 font-bold"
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? "stroke-[2.5]" : ""}`} />
                <span className="text-[9px] truncate max-w-[55px]">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
