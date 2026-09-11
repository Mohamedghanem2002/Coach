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
} from "lucide-react";
import {
  getTodayBirthdays,
  getUpcomingBirthdays,
  BELT_HEX,
} from "../../lib/dashboard-utils";
import { sendBirthdayCardViaWhatsApp } from "../../lib/birthday-card-utils";

export default function BirthdayReminder({
  players = [],
  captainName = "كابتن الأكاديمية",
  onOpenPlayer,
  allowDismiss = true,
}) {
  const [selectedTab, setSelectedTab] = useState(null); // null = auto
  const [isDismissed, setIsDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
    return getUpcomingBirthdays(players, 30);
  }, [players, congratulateTick]);

  // Derive activeTab cleanly without setState in effect
  const activeTab =
    selectedTab !== null
      ? selectedTab
      : todayBirthdays.length > 0
      ? "today"
      : "upcoming";

  // If dismissed manually, return null
  if (isDismissed && allowDismiss) return null;

  const currentList = activeTab === "today" ? todayBirthdays : upcomingBirthdays;

  const filteredList = currentList.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.branch && p.branch.toLowerCase().includes(q))
    );
  });

  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 via-rose-50/70 to-orange-50/80 p-4 sm:p-6 shadow-sm transition-all duration-300 animate-slide-up w-full max-w-full"
      dir="rtl"
    >
      {/* عناصر زخرفية في الخلفية */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-36 w-36 rounded-full bg-amber-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -right-12 h-36 w-36 rounded-full bg-rose-300/25 blur-3xl" />

      {/* إشعار العملية التنبيهي */}
      {reminderNotice && (
        <div
          className={`relative z-20 mb-4 flex items-center justify-between gap-2 rounded-2xl p-3 text-xs font-black shadow-xs animate-slide-up ${
            reminderNotice.startsWith("❌")
              ? "bg-rose-100 border border-rose-300 text-rose-900"
              : "bg-emerald-100 border border-emerald-300 text-emerald-900"
          }`}
        >
          <div className="flex items-center gap-2">
            <span>🎉</span>
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

      {/* الرأس: العنوان وأزرار التبديل */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-red-500 text-white shadow-md shadow-rose-500/25 ring-4 ring-amber-100">
            <PartyPopper className="h-6 w-6 animate-bounce" />
            {todayBirthdays.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-white" />
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-cairo text-base sm:text-lg font-black tracking-tight text-slate-900">
                أعياد ميلاد أبطال الأكاديمية
              </h3>
              {todayBirthdays.length > 0 ? (
                <span className="rounded-full bg-rose-500 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs animate-pulse">
                  احتفال اليوم 🎉
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-black text-white shadow-xs">
                  مناسبات الشهر 🎈
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 mt-0.5">
              تواصل مع أولياء الأمور وشارك الأبطال فرحة يوم ميلادهم بكارت التهنئة الرسمي!
            </p>
          </div>
        </div>

        {/* التبديل بين اليوم والقادمة وزر الإغلاق */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-xs p-1 rounded-2xl border border-amber-200/80">
            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer active-press ${
                activeTab === "today"
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setSelectedTab("today")}
            >
              <span>🎉 اليوم</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  activeTab === "today"
                    ? "bg-white/30 text-white"
                    : "bg-rose-100 text-rose-700"
                }`}
              >
                {todayBirthdays.length}
              </span>
            </button>

            <button
              type="button"
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer active-press ${
                activeTab === "upcoming"
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setSelectedTab("upcoming")}
            >
              <span>🗓️ القادمة (30 يوم)</span>
              <span
                className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                  activeTab === "upcoming"
                    ? "bg-white/30 text-white"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {upcomingBirthdays.length}
              </span>
            </button>
          </div>

          {allowDismiss && (
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/60 border border-amber-200/60 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
              onClick={() => setIsDismissed(true)}
              title="إخفاء التذكار مؤقتاً"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* حقل البحث السريع إذا كانت القائمة تحتوي على أكثر من 3 أبطال */}
      {currentList.length > 3 && (
        <div className="relative z-10 mt-3.5">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن بطل بالاسم أو الصالة..."
              className="w-full rounded-xl border border-amber-200/80 bg-white/90 py-2 pr-9 pl-3 text-xs font-semibold text-slate-800 placeholder-slate-400 shadow-2xs focus:border-rose-400 focus:outline-hidden focus:ring-2 focus:ring-rose-200/40"
            />
          </div>
        </div>
      )}

      {/* المحتوى: قائمة اللاعبين أو الحالة الفارغة التشجيعية */}
      <div className="relative z-10 mt-4">
        {filteredList.length > 0 ? (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredList.map((player) => {
              const info = player.birthdayInfo;
              const isToday = info?.isToday;
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
                  className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 ${
                    isToday
                      ? "border-rose-300 bg-white shadow-sm shadow-rose-500/10 ring-2 ring-rose-200/60"
                      : "border-amber-200/80 bg-white/90 shadow-2xs hover:bg-white hover:border-amber-300 hover:shadow-sm"
                  }`}
                >
                  {/* رأس البطاقة: الصورة والاسم والشارة */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
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
                            className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
                            style={{ backgroundColor: beltColor }}
                            title={`حزام ${player.belt}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <strong className="block truncate font-cairo text-sm font-black text-slate-900 group-hover:text-rose-600 transition-colors">
                            {player.name}
                          </strong>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
                            <span>🏢 {player.branch}</span>
                            <span>•</span>
                            <span className="text-slate-700">{player.belt}</span>
                          </div>
                        </div>
                      </div>

                      {isToday ? (
                        <span className="shrink-0 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-2.5 py-1 text-[11px] font-black text-white shadow-xs">
                          🎉 اليوم!
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-xl bg-amber-100 border border-amber-300 px-2.5 py-1 text-[10px] font-black text-amber-900">
                          {info?.daysLeft === 1
                            ? "غداً"
                            : `بعد ${info?.daysLeft} يوم`}
                        </span>
                      )}
                    </div>

                    {/* تفاصيل الاحتفال والعمر */}
                    <div className="mt-3 rounded-xl bg-amber-50/80 border border-amber-100/90 p-2.5 text-center text-xs font-bold">
                      {isToday ? (
                        <p className="text-rose-700 font-black">
                          🥳 يُتم اليوم{" "}
                          <span className="text-sm underline decoration-rose-400 font-black">
                            {info?.turningAge} سنة
                          </span>
                          ! كل عام وبطلنا بألف خير 🥋
                        </p>
                      ) : (
                        <p className="text-amber-900">
                          🎂 يوافق{" "}
                          <strong className="text-slate-900 font-black">
                            {info?.dateFormatted}
                          </strong>{" "}
                          (سيُتم {info?.turningAge} سنة)
                        </p>
                      )}
                    </div>
                  </div>

                  {/* أزرار التفاعل والإجراءات */}
                  <div className="mt-3.5 flex items-center gap-2 pt-2 border-t border-slate-100">
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
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-2.5 text-xs font-black text-white shadow-xs hover:brightness-110 active-press transition text-center cursor-pointer disabled:opacity-60 min-h-[40px]"
                      title={
                        phone
                          ? `إرسال كارت التهنئة لواتساب ولي الأمر (${phone})`
                          : "إرسال كارت التهنئة عبر واتساب"
                      }
                    >
                      {sendingPlayerId === player._id ? (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                          <span className="truncate">جاري الإرسال...</span>
                        </>
                      ) : (
                        <>
                          <Cake className="h-4 w-4 shrink-0" />
                          <span className="truncate font-cairo">إرسال كارت التهنئة</span>
                        </>
                      )}
                    </button>

                    {phone && (
                      <a
                        href={`tel:${phone}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active-press transition shrink-0"
                        title={`اتصال هاتفي بولي الأمر (${phone})`}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active-press transition cursor-pointer shrink-0"
                      onClick={() => onOpenPlayer?.(player)}
                      title="فتح الملف الشخصي للاعب"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* حالة فارغة تشجيعية إذا لم توجد مناسبات في التبويب الحالي */
          <div className="rounded-2xl border-2 border-dashed border-amber-200/80 bg-white/70 p-6 text-center">
            {activeTab === "today" ? (
              <div className="space-y-3 max-w-md mx-auto">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100/70 text-2xl">
                  🎈
                </div>
                <h4 className="font-cairo text-sm sm:text-base font-black text-slate-800">
                  لا توجد أعياد ميلاد اليوم بين أبطال الأكاديمية
                </h4>
                <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                  {upcomingBirthdays.length > 0
                    ? `لديك (${upcomingBirthdays.length}) مناسبة قادمة خلال الـ 30 يوماً القادمة! يمكنك استعراضها وإرسال التهنئة مبكراً.`
                    : "لا توجد مناسبات قريبة هذا الشهر. يتم تنبيهك تلقائياً عند حلول عيد ميلاد أي بطل."}
                </p>
                {upcomingBirthdays.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedTab("upcoming")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 text-xs font-black text-white shadow-xs hover:brightness-110 active-press transition cursor-pointer"
                  >
                    <span>استعراض المناسبات القادمة ({upcomingBirthdays.length})</span>
                    <span>←</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2 max-w-md mx-auto">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  📅
                </div>
                <h4 className="font-cairo text-sm sm:text-base font-black text-slate-800">
                  لا توجد أعياد ميلاد مسجلة خلال الـ 30 يوماً القادمة
                </h4>
                <p className="text-xs font-semibold text-slate-500">
                  تأكد من تسجيل تواريخ ميلاد الأبطال بدقة في استمارة اللاعب لعرض مناسباتهم تلقائياً.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
