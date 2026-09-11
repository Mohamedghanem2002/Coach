"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Cake,
  Calendar,
  Sparkles,
  Phone,
  Search,
  ExternalLink,
  PartyPopper,
  X,
  Eye,
  Building2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import {
  getBirthdayInfo,
  isBirthdayCongratulated,
  BELT_HEX,
} from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";
import BirthdayCardModal from "./BirthdayCardModal";

export default function BirthdayReminder({
  players = [],
  branches = [],
  captainName = "كابتن الأكاديمية",
  onOpenPlayer,
  onBack,
  allowDismiss = true,
  isMobileView = false,
}) {
  const [selectedTab, setSelectedTab] = useState(null); // null = auto
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDismissed, setIsDismissed] = useState(false);
  const [sendingPlayerId, setSendingPlayerId] = useState(null);
  const [reminderNotice, setReminderNotice] = useState("");
  const [congratulateTick, setCongratulateTick] = useState(0);
  const [previewPlayer, setPreviewPlayer] = useState(null);

  // Listen to congratulate events to refresh live
  useEffect(() => {
    const handleCongratulated = () => setCongratulateTick((t) => t + 1);
    window.addEventListener("birthday_congratulated", handleCongratulated);
    return () =>
      window.removeEventListener("birthday_congratulated", handleCongratulated);
  }, []);

  // Filter players by branch first
  const scopedPlayers = useMemo(() => {
    if (!Array.isArray(players)) return [];
    if (selectedBranch === "all") return players;
    return players.filter((p) => p.branch === selectedBranch);
  }, [players, selectedBranch]);

  // Analyze birthdays: ONLY Today & Tomorrow (1 day before)
  const {
    todayList,
    todayPendingCount,
    tomorrowList,
    congratulatedList,
  } = useMemo(() => {
    void congratulateTick;
    const now = new Date();

    const today = [];
    let pendingCount = 0;
    const tomorrow = [];
    const congratulated = [];

    scopedPlayers.forEach((player) => {
      const bday = getBirthdayInfo(player, now);
      if (!bday) return;

      const playerWithBday = { ...player, birthdayInfo: bday };
      const isWished =
        player.lastBirthdayWishedYear === now.getFullYear() ||
        isBirthdayCongratulated(player._id, now);

      if (isWished) {
        congratulated.push(playerWithBday);
      }

      if (bday.isToday) {
        today.push(playerWithBday);
        if (!isWished) pendingCount += 1;
      } else if (!isWished && bday.daysLeft === 1) {
        // ONLY 1 day before (Tomorrow)
        tomorrow.push(playerWithBday);
      }
    });

    // Sort today: pending first
    today.sort((a, b) => {
      const aW = isBirthdayCongratulated(a._id, now) ? 1 : 0;
      const bW = isBirthdayCongratulated(b._id, now) ? 1 : 0;
      return aW - bW;
    });

    return {
      todayList: today,
      todayPendingCount: pendingCount,
      tomorrowList: tomorrow,
      congratulatedList: congratulated,
    };
  }, [scopedPlayers, congratulateTick]);

  // Derived effective tab: auto select best matching tab if user hasn't clicked one
  const activeTab = useMemo(() => {
    if (selectedTab !== null) return selectedTab;
    if (todayList.length > 0) return "today";
    if (tomorrowList.length > 0) return "tomorrow";
    return "today";
  }, [selectedTab, todayList.length, tomorrowList.length]);

  // Active list based on selected tab
  const rawList = useMemo(() => {
    switch (activeTab) {
      case "today":
        return todayList;
      case "tomorrow":
        return tomorrowList;
      case "congratulated":
        return congratulatedList;
      default:
        return todayList;
    }
  }, [activeTab, todayList, tomorrowList, congratulatedList]);

  // Filter by search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return rawList;
    const q = searchQuery.toLowerCase().trim();
    return rawList.filter((p) => {
      const nameMatch = p.name && p.name.toLowerCase().includes(q);
      const branchMatch = p.branch && p.branch.toLowerCase().includes(q);
      const phoneMatch =
        (p.guardianPhone && p.guardianPhone.includes(q)) ||
        (p.parentPhone && p.parentPhone.includes(q)) ||
        (p.phone && p.phone.includes(q));
      return nameMatch || branchMatch || phoneMatch;
    });
  }, [rawList, searchQuery]);

  // Available branch options (clean unique string names)
  const branchOptions = useMemo(() => {
    const names = new Set();
    if (Array.isArray(branches)) {
      branches.forEach((b) => {
        const name = typeof b === "string" ? b : b?.name;
        if (name && typeof name === "string") names.add(name);
      });
    }
    if (Array.isArray(players)) {
      players.forEach((p) => {
        if (p.branch && typeof p.branch === "string") names.add(p.branch);
      });
    }
    return ["all", ...Array.from(names)];
  }, [branches, players]);

  if (isDismissed && allowDismiss) return null;

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-amber-200/90 bg-gradient-to-br from-amber-50/95 via-rose-50/80 to-orange-50/90 p-3.5 sm:p-6 shadow-sm transition-all duration-300 animate-slide-up w-full max-w-full"
      dir="rtl"
    >
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-amber-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -right-16 h-44 w-44 rounded-full bg-rose-400/20 blur-3xl" />

      {/* Notice Alert Banner */}
      {reminderNotice && (
        <div
          className={`relative z-20 mb-3.5 flex items-center justify-between gap-2 rounded-2xl p-3 text-xs font-black shadow-xs animate-slide-up ${
            reminderNotice.startsWith("❌")
              ? "bg-rose-100 border border-rose-300 text-rose-900"
              : "bg-emerald-100 border border-emerald-300 text-emerald-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🎉</span>
            <span>{reminderNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setReminderNotice("")}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/5 hover:bg-black/10 text-xs font-bold transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ━━━ Header & Hero Strip ━━━ */}
      <div className="relative z-10 flex items-center justify-between gap-2.5 border-b border-amber-200/70 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative flex h-10 w-10 sm:h-13 sm:w-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-red-600 text-white shadow-md shadow-rose-500/25 ring-3 ring-amber-100">
            <PartyPopper className="h-5 w-5 sm:h-6 sm:w-6 animate-bounce" />
            {todayPendingCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-600 ring-2 ring-white" />
              </span>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-cairo text-sm sm:text-lg font-black text-slate-900 truncate">
                تذكار أعياد ميلاد الأبطال
              </h2>
              {todayList.length > 0 ? (
                <span className="shrink-0 rounded-full bg-gradient-to-r from-rose-600 to-red-600 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-2xs animate-pulse">
                  {todayPendingCount > 0 ? `${todayPendingCount} اليوم` : "اليوم 🎉"}
                </span>
              ) : tomorrowList.length > 0 ? (
                <span className="shrink-0 rounded-full bg-amber-500/90 px-2 py-0.5 text-[9px] sm:text-[10px] font-black text-white shadow-2xs">
                  غداً ({tomorrowList.length}) 🎈
                </span>
              ) : null}
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-500 truncate hidden xs:block">
              عرض أعياد ميلاد الأبطال اليوم وقبلها بيوم واحد (غداً) لإرسال كارت التهنئة الرسمي
            </p>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 active-press transition shadow-2xs cursor-pointer"
            >
              <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden xs:inline">العودة</span>
            </button>
          )}

          {allowDismiss && (
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/70 border border-amber-200 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer shadow-2xs"
              onClick={() => setIsDismissed(true)}
              title="إخفاء مؤقتاً"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ━━━ KPI Strip: Today, Tomorrow (1 day before), and Congratulated ━━━ */}
      <div className="relative z-10 mt-3">
        {/* Mobile Swipeable Carousel */}
        <div className="sm:hidden flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 touch-scroll">
          {[
            {
              id: "today",
              icon: "🎂",
              label: "اليوم",
              count: todayList.length,
              sub: todayPendingCount > 0 ? `${todayPendingCount} ينتظر` : null,
              activeBg: "border-rose-400 bg-white text-rose-700 ring-2 ring-rose-200",
              badgeBg: "bg-rose-600 text-white",
            },
            {
              id: "tomorrow",
              icon: "🗓️",
              label: "قادمة غداً (قبلها بيوم)",
              count: tomorrowList.length,
              activeBg: "border-amber-400 bg-white text-amber-800 ring-2 ring-amber-200",
              badgeBg: "bg-amber-500 text-white",
            },
            {
              id: "congratulated",
              icon: "✅",
              label: "تمت التهنئة",
              count: congratulatedList.length,
              activeBg: "border-emerald-400 bg-white text-emerald-800 ring-2 ring-emerald-200",
              badgeBg: "bg-emerald-600 text-white",
            },
          ].map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl border shrink-0 transition-all active-press cursor-pointer min-h-[42px] ${
                  isActive
                    ? item.activeBg
                    : "border-amber-200/80 bg-white/80 text-slate-700"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-black">{item.label}</span>
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-black ${
                        isActive ? item.badgeBg : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.count}
                    </span>
                  </div>
                  {item.sub && (
                    <span className="block text-[9px] font-black text-rose-500 animate-pulse">
                      {item.sub}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Desktop 3 Metric Cards */}
        <div className="hidden sm:grid grid-cols-3 gap-3">
          <div
            onClick={() => setSelectedTab("today")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "today"
                ? "border-rose-400 bg-white shadow-sm ring-2 ring-rose-200"
                : "border-amber-200/80 bg-white/80 hover:bg-white hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">مناسبات اليوم</span>
              <span className="text-base">🎂</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <strong className="font-cairo text-xl font-black text-rose-600">
                {todayList.length}
              </strong>
              {todayPendingCount > 0 && (
                <span className="text-[10px] font-black text-rose-500 animate-pulse">
                  ({todayPendingCount} بانتظار التهنئة)
                </span>
              )}
            </div>
          </div>

          <div
            onClick={() => setSelectedTab("tomorrow")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "tomorrow"
                ? "border-amber-400 bg-white shadow-sm ring-2 ring-amber-200"
                : "border-amber-200/80 bg-white/80 hover:bg-white hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">قادمة غداً (قبلها بيوم واحد)</span>
              <span className="text-base">🗓️</span>
            </div>
            <strong className="block font-cairo text-xl font-black text-amber-700 mt-1">
              {tomorrowList.length} بطل
            </strong>
          </div>

          <div
            onClick={() => setSelectedTab("congratulated")}
            className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === "congratulated"
                ? "border-emerald-400 bg-white shadow-sm ring-2 ring-emerald-200"
                : "border-amber-200/80 bg-white/80 hover:bg-white hover:border-amber-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500">تمت تهنئتهم هذا العام</span>
              <span className="text-base">✅</span>
            </div>
            <strong className="block font-cairo text-xl font-black text-emerald-700 mt-1">
              {congratulatedList.length} لاعب
            </strong>
          </div>
        </div>
      </div>

      {/* ━━━ Controls: Navigation Tabs, Search & Branch Filters ━━━ */}
      <div className="relative z-10 mt-3 space-y-2.5">
        {/* Navigation Tabs (Desktop) */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-scroll">
          {[
            {
              id: "today",
              label: "🎉 أبطال اليوم",
              count: todayList.length,
              activeClass: "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-xs",
            },
            {
              id: "tomorrow",
              label: "🗓️ قادمة غداً (قبلها بيوم واحد)",
              count: tomorrowList.length,
              activeClass: "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xs",
            },
            {
              id: "congratulated",
              label: "⭐ تم إرسال التهنئة",
              count: congratulatedList.length,
              activeClass: "bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition active-press cursor-pointer min-h-[38px] ${
                  isActive
                    ? tab.activeClass
                    : "bg-white/80 text-slate-700 hover:bg-white border border-amber-200/80"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                    isActive ? "bg-white/30 text-white" : "bg-amber-100 text-amber-900"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Branch Pills Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم أو الهاتف..."
              className="w-full rounded-2xl border border-amber-200/80 bg-white/95 py-2.5 pr-9 pl-8 text-xs font-bold text-slate-800 placeholder-slate-400 shadow-2xs focus:border-rose-400 focus:outline-hidden focus:ring-2 focus:ring-rose-200/40"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Branch Filter Selector */}
          {branchOptions.length > 2 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-scroll">
              <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0 hidden xs:inline" />
              {branchOptions.map((branchName) => {
                const label = branchName === "all" ? "كل الصالات" : branchName;
                return (
                  <button
                    key={branchName}
                    type="button"
                    onClick={() => setSelectedBranch(branchName)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-black shrink-0 transition active-press cursor-pointer ${
                      selectedBranch === branchName
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white/80 text-slate-600 hover:bg-white border border-amber-200/70"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ━━━ Cards Grid: Mobile Champion Story Cards ━━━ */}
      <div className="relative z-10 mt-3.5">
        {filteredList.length > 0 ? (
          <div className="grid gap-3 sm:gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredList.map((player) => {
              const info = player.birthdayInfo;
              const isToday = info?.isToday;
              const now = new Date();
              const isWished =
                player.lastBirthdayWishedYear === now.getFullYear() ||
                isBirthdayCongratulated(player._id, now);
              const phone =
                player.guardianPhone ||
                player.parentPhone ||
                player.guardianMobile ||
                player.mobile ||
                player.phone ||
                "";
              const beltColor = BELT_HEX[player.belt] || "#cbd5e1";

              return (
                <div
                  key={player._id}
                  className={`group relative flex flex-col justify-between rounded-3xl border p-3.5 sm:p-4.5 transition-all duration-200 ${
                    isToday
                      ? isWished
                        ? "border-emerald-300 bg-white shadow-xs ring-2 ring-emerald-200/50"
                        : "border-rose-400 bg-white shadow-md shadow-rose-500/10 ring-2 ring-rose-300/80"
                      : "border-amber-200/80 bg-white/95 shadow-2xs hover:bg-white hover:border-amber-300"
                  }`}
                >
                  <div>
                    {/* Top Row: Avatar, Name, Belt, Branch & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* 48px Athlete Avatar */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-red-500 font-cairo text-sm font-black text-white shadow-xs ring-2 ring-slate-100">
                          {player.photo ? (
                            <img
                              src={player.photo}
                              alt={player.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span>{player.name?.charAt(0) || "ب"}</span>
                          )}
                          <span
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white shadow-xs"
                            style={{ backgroundColor: beltColor }}
                            title={`حزام ${player.belt}`}
                          />
                        </div>

                        {/* Name & Branch Tags */}
                        <div className="min-w-0 flex-1">
                          <strong
                            onClick={() => onOpenPlayer?.(player)}
                            className="block truncate font-cairo text-xs sm:text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors cursor-pointer"
                            title="فتح الملف الشخصي"
                          >
                            {player.name}
                          </strong>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-slate-500">
                            <span className="flex items-center gap-0.5">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              <span>{player.branch}</span>
                            </span>
                            <span>•</span>
                            <span className="text-slate-800 font-black">
                              {player.belt}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Celebration Status Badge */}
                      {isToday ? (
                        isWished ? (
                          <span className="shrink-0 rounded-xl bg-emerald-50 border border-emerald-300 px-2 py-1 text-[10px] font-black text-emerald-800 shadow-2xs flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                            <span>تمت التهنئة</span>
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-2.5 py-1 text-[10px] sm:text-[11px] font-black text-white shadow-xs animate-pulse">
                            🎉 اليوم!
                          </span>
                        )
                      ) : isWished ? (
                        <span className="shrink-0 rounded-xl bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                          تمت التهنئة
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-xl bg-amber-100 border border-amber-300 px-2.5 py-1 text-[10px] font-black text-amber-900">
                          🗓️ غداً (قبلها بيوم)
                        </span>
                      )}
                    </div>

                    {/* Milestone Highlight Banner */}
                    <div className="mt-3 rounded-2xl bg-amber-50/90 border border-amber-100/90 p-2 text-center text-xs font-bold">
                      {isToday ? (
                        <p className="text-rose-800 font-black leading-snug">
                          🥳 يُتم اليوم{" "}
                          <span className="text-sm underline decoration-rose-400 font-black">
                            {info?.turningAge} سنة
                          </span>
                          ! كل عام وبطلنا بألف خير 🥋
                        </p>
                      ) : (
                        <p className="text-amber-900 leading-snug">
                          🎂 يوافق غداً{" "}
                          <strong className="text-slate-900 font-black">
                            {info?.dateFormatted}
                          </strong>{" "}
                          (سيُتم {info?.turningAge} سنة)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* ━━━ Mobile-First Touch Action System ━━━ */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-2">
                    {/* Primary Button: Full Width WhatsApp Card Send */}
                    <button
                      type="button"
                      disabled={sendingPlayerId === player._id}
                      onClick={async () => {
                        await sendBirthdayCardViaWhatsApp(player, captainName, {
                          onProgress: (isBusy) =>
                            setSendingPlayerId(isBusy ? player._id : null),
                          onNotice: setReminderNotice,
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:brightness-110 active-press transition cursor-pointer disabled:opacity-60 min-h-[44px]"
                      title={
                        phone
                          ? `إرسال كارت التهنئة لواتساب ولي الأمر (${phone})`
                          : "إرسال كارت التهنئة عبر واتساب"
                      }
                    >
                      {sendingPlayerId === player._id ? (
                        <>
                          <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                          <span>جاري إرسال الكارت...</span>
                        </>
                      ) : (
                        <>
                          <Cake className="h-4 w-4 shrink-0" />
                          <span className="font-cairo">
                            {isWished ? "إعادة إرسال كارت التهنئة" : "إرسال كارت التهنئة (واتساب)"}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Secondary Row: 3 Touch Targets */}
                    <div className="grid grid-cols-3 gap-1.5">
                      {/* 1. Preview Modal */}
                      <button
                        type="button"
                        onClick={() => setPreviewPlayer(player)}
                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 active-press transition cursor-pointer min-h-[38px] text-[11px] font-black"
                        title="معاينة وتحميل الكارت"
                      >
                        <Eye className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>معاينة</span>
                      </button>

                      {/* 2. Call */}
                      {phone ? (
                        <a
                          href={`tel:${phone}`}
                          className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 active-press transition min-h-[38px] text-[11px] font-black text-center"
                          title={`اتصال بولي الأمر (${phone})`}
                        >
                          <Phone className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                          <span>اتصال</span>
                        </a>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 opacity-50 min-h-[38px] text-[11px] font-bold"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0" />
                          <span>اتصال</span>
                        </button>
                      )}

                      {/* 3. Profile */}
                      <button
                        type="button"
                        onClick={() => onOpenPlayer?.(player)}
                        className="flex items-center justify-center gap-1 py-2 px-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active-press transition cursor-pointer min-h-[38px] text-[11px] font-black"
                        title="فتح الملف الشخصي"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                        <span>الملف</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ━━━ Empty State ━━━ */
          <div className="rounded-3xl border-2 border-dashed border-amber-200/90 bg-white/70 p-6 sm:p-8 text-center">
            {activeTab === "today" ? (
              <div className="space-y-3 max-w-md mx-auto">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-2xl ring-6 ring-amber-50">
                  🎈
                </div>
                <h3 className="font-cairo text-sm sm:text-base font-black text-slate-900">
                  لا توجد أعياد ميلاد اليوم بين أبطال الأكاديمية
                </h3>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {tomorrowList.length > 0
                    ? `لديك (${tomorrowList.length}) بطل يحتفلون بعيد ميلادهم غداً! يمكنك استعراضهم وتجهيز وإرسال كروت التهنئة مسبقاً.`
                    : "لا توجد أعياد ميلاد مسجلة اليوم أو غداً. يتم تنبيه الكابتن تلقائياً قبل عيد ميلاد أي بطل بيوم واحد."}
                </p>
                {tomorrowList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTab("tomorrow")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-600 text-xs font-black text-white shadow-md shadow-rose-500/20 hover:brightness-110 active-press transition cursor-pointer"
                  >
                    <span>استعراض مناسبات الغد ({tomorrowList.length})</span>
                    <span>←</span>
                  </button>
                )}
              </div>
            ) : activeTab === "tomorrow" ? (
              <div className="space-y-2 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 text-xl">
                  🗓️
                </div>
                <h3 className="font-cairo text-sm sm:text-base font-black text-slate-900">
                  لا توجد أعياد ميلاد قادمة غداً
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  سيتم تنبيهك تلقائياً هنا قبل حلول موعد عيد ميلاد أي بطل بيوم واحد لتجهيز كارت التهنئة.
                </p>
              </div>
            ) : activeTab === "congratulated" ? (
              <div className="space-y-2 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 text-xl">
                  ⭐
                </div>
                <h3 className="font-cairo text-sm sm:text-base font-black text-slate-900">
                  لم يتم تسجيل تهاني مرسلة بعد هذا العام
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  عند إرسال أي كارت تهنئة لأحد الأبطال، سيتم توثيقه هنا تلقائياً لسهولة المتابعة.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-w-md mx-auto">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                  📅
                </div>
                <h3 className="font-cairo text-sm sm:text-base font-black text-slate-900">
                  لا توجد مناسبات مطابقة للفلتر المحدد
                </h3>
                <p className="text-xs font-semibold text-slate-500">
                  تأكد من تسجيل تواريخ ميلاد الأبطال في استماراتهم الشخصية لتفعيل التنبيهات الاحتفالية.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ━━━ Card Preview & Download Modal ━━━ */}
      {previewPlayer && (
        <BirthdayCardModal
          player={previewPlayer}
          captainName={captainName}
          isOpen={Boolean(previewPlayer)}
          onClose={() => setPreviewPlayer(null)}
        />
      )}
    </div>
  );
}
