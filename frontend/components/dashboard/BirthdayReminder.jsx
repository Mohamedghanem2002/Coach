"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getTodayBirthdays,
  getUpcomingBirthdays,
} from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";

export default function BirthdayReminder({
  players = [],
  captainName = "كابتن الأكاديمية",
  onOpenPlayer,
}) {
  const [activeTab, setActiveTab] = useState("today"); // 'today' | 'upcoming'
  const [isDismissed, setIsDismissed] = useState(false);
  const [sendingPlayerId, setSendingPlayerId] = useState(null);
  const [reminderNotice, setReminderNotice] = useState("");
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

  // If dismissed or no birthdays at all, render nothing
  if (isDismissed) return null;
  if (todayBirthdays.length === 0 && upcomingBirthdays.length === 0) return null;

  const hasToday = todayBirthdays.length > 0;
  const currentList =
    activeTab === "today"
      ? hasToday
        ? todayBirthdays
        : upcomingBirthdays
      : upcomingBirthdays;

  return (
    <div
      className="relative mt-4 overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50/90 via-rose-50/70 to-orange-50/80 p-4 sm:p-5 shadow-sm transition-all duration-300 animate-slide-up"
      dir="rtl"
    >
      {/* عناصر زخرفية في الخلفية */}
      <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-amber-300/20 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-rose-300/20 blur-2xl" />

      {/* إشعار العملية التنبيهي */}
      {reminderNotice && (
        <div
          className={`relative z-20 mb-3 flex items-center justify-between gap-2 rounded-2xl p-2.5 sm:p-3 text-xs font-bold shadow-xs animate-slide-up ${
            reminderNotice.startsWith("❌")
              ? "bg-rose-100 border border-rose-300 text-rose-900"
              : "bg-emerald-100 border border-emerald-300 text-emerald-900"
          }`}
        >
          <span>{reminderNotice}</span>
          <button
            type="button"
            onClick={() => setReminderNotice("")}
            className="text-xs font-bold text-slate-500 hover:text-slate-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* الرأس: العنوان وأزرار التبديل وزر الإخفاء */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-amber-200/60 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-red-500 text-white shadow-md shadow-rose-500/20 ring-2 ring-amber-200">
            <span className="text-xl sm:text-2xl animate-bounce">🎂</span>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-cairo text-base sm:text-lg font-black tracking-tight text-slate-900">
                تذكار أعياد ميلاد أبطال الأكاديمية
              </h3>
              <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white shadow-xs animate-pulse">
                احتفال 🎉
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500">
              فرصة مميزة للتواصل مع أولياء الأمور وتهنئة اللاعبين بعيد ميلادهم!
            </p>
          </div>
        </div>

        {/* التبديل بين اليوم والقادمة وزر الإغلاق */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "today" && hasToday
                ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs"
                : "bg-white/80 text-slate-600 hover:bg-white border border-amber-200/60"
            }`}
            onClick={() => setActiveTab("today")}
          >
            <span>🎉 اليوم</span>
            <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px] font-black">
              {todayBirthdays.length}
            </span>
          </button>

          {upcomingBirthdays.length > 0 && (
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                activeTab === "upcoming" || !hasToday
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs"
                : "bg-white/80 text-slate-600 hover:bg-white border border-amber-200/60"
              }`}
              onClick={() => setActiveTab("upcoming")}
            >
              <span>🗓️ غداً</span>
              <span className="rounded-full bg-white/30 px-1.5 py-0.2 text-[10px] font-black">
                {upcomingBirthdays.length}
              </span>
            </button>
          )}

          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:bg-amber-100 hover:text-slate-700 transition-colors text-xs mr-1 cursor-pointer"
            onClick={() => setIsDismissed(true)}
            title="إخفاء التذكير مؤقتاً"
          >
            ✕
          </button>
        </div>
      </div>

      {/* قائمة اللاعبين المحتفلين */}
      <div className="relative z-10 mt-3.5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {currentList.map((player) => {
          const info = player.birthdayInfo;
          const isToday = info?.isToday;
          const phone =
            player.guardianPhone ||
            player.parentPhone ||
            player.guardianMobile ||
            player.mobile ||
            player.phone ||
            "";

          return (
            <div
              key={player._id}
              className={`group relative flex flex-col justify-between rounded-2xl border p-3.5 transition-all duration-200 ${
                isToday
                  ? "border-rose-300/80 bg-white/95 shadow-sm shadow-rose-500/10 ring-2 ring-rose-200/50"
                  : "border-amber-200/70 bg-white/80 shadow-2xs hover:bg-white hover:border-amber-300"
              }`}
            >
              {/* شارة التوقيت */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-red-500 font-cairo text-sm font-black text-white shadow-xs">
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{player.name.charAt(0)}</span>
                    )}
                    <span className="absolute -bottom-1 -right-1 text-xs">
                      {isToday ? "🎂" : "🎈"}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <strong className="block truncate font-cairo text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                      {player.name}
                    </strong>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
                      <span>🏢 {player.branch}</span>
                    </div>
                  </div>
                </div>

                {isToday ? (
                  <span className="shrink-0 rounded-lg bg-gradient-to-r from-rose-600 to-red-600 px-2.5 py-1 text-[11px] font-black text-white shadow-xs">
                    🎉 اليوم!
                  </span>
                ) : (
                  <span className="shrink-0 rounded-lg bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                    غداً
                  </span>
                )}
              </div>

              {/* ملخص العمر والميلاد */}
              <div className="mt-3 rounded-xl bg-amber-50/70 border border-amber-100 p-2 text-center text-xs font-bold text-slate-700">
                {isToday ? (
                  <p className="text-rose-700 font-black">
                    🥳 يُتم اليوم <span className="text-sm font-black underline decoration-rose-400">{info?.turningAge} سنة</span>! كل عام وبطلنا بألف خير 🥋
                  </p>
                ) : (
                  <p className="text-amber-800">
                    🎂 يوافق <span className="font-black text-slate-900">{info?.dateFormatted}</span> (سيُتم {info?.turningAge} سنة)
                  </p>
                )}
              </div>

              {/* أزرار الإجراءات السريعة للكارت والملف */}
              <div className="mt-3 flex items-center gap-2">
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
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 transition-all text-center cursor-pointer disabled:opacity-60"
                  title={
                    phone
                      ? `إرسال كارت التهنئة الرسمي لواتساب ولي الأمر (${phone})`
                      : "إرسال كارت التهنئة عبر واتساب"
                  }
                >
                  {sendingPlayerId === player._id ? (
                    <>
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                      <span className="truncate">جاري إرسال الكارت...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🎂</span>
                      <span className="truncate font-cairo">إرسال كارت التهنئة</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:scale-95 transition-all cursor-pointer shrink-0"
                  onClick={() => onOpenPlayer?.(player)}
                  title="فتح الملف الشخصي للاعب"
                >
                  <span>👤</span>
                  <span>الملف</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
