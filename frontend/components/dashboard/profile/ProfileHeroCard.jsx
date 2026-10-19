import {
  Maximize2,
  Sparkles,
  MessageCircle,
  Eye,
  Phone,
  FileText,
  Calendar,
} from "lucide-react";
import { formatArabicMonth } from "../../../lib/dashboard-utils";

export default function ProfileHeroCard({
  player,
  beltStyle,
  currentAge,
  isNew,
  registrationDate,
  hasActiveBirthday,
  birthdayInfo,
  isSendingBirthdayText,
  shareBirthdayText,
  setShowBirthdayModal,
  showWelcomeCardButton,
  setShowWelcomeCardModal,
  guardianPhone,
  openGuardianChat,
  isOpeningChat,
  startEditing,
  handlePhoneCallClick,
  isSendingText,
  shareReportText,
  reportMonth,
  setReportMonth,
  setShowCardModal,
  setShowZoomPhoto,
}) {
  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs space-y-4">
      <div className="flex items-center gap-3.5 sm:gap-4">
        {/* صورة / أفاتار اللاعب بحزام الكاراتيه مع إشارة التكبير */}
        <div
          onClick={() => {
            if (player.photo) setShowZoomPhoto(true);
          }}
          className={`relative flex h-16 w-16 sm:h-20 sm:w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 font-cairo text-2xl sm:text-3xl font-black text-white shadow-xs ring-4 ring-offset-2 ring-offset-white ${beltStyle.border} ${
            player.photo ? "cursor-pointer hover:scale-105 transition-transform group" : ""
          }`}
          title={player.photo ? "انقر لتكبير صورة اللاعب 🔍" : player.name}
        >
          {player.photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={player.photo}
                alt={player.name}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Maximize2 className="h-5 w-5 text-white drop-shadow" />
              </div>
            </>
          ) : (
            <span>{player.name.charAt(0)}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="truncate font-cairo text-base sm:text-xl font-black text-slate-900 leading-tight">
              {player.name}
            </h2>
            {player.fileNumber && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                <span className="text-amber-400 font-bold">ملف:</span>
                <span>#{player.fileNumber}</span>
              </span>
            )}
            {isNew && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-2.5 py-0.5 text-[11px] font-black text-white shadow-2xs">
                <Sparkles className="h-3 w-3 text-amber-200" />
                <span>بطل جديد</span>
              </span>
            )}
          </div>

          {/* شارات الهوية المنظمة */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold shadow-2xs ${beltStyle.bg} ${beltStyle.text} ${beltStyle.border}`}>
              <span className={`h-2 w-2 rounded-full ${beltStyle.dot}`} />
              🥋 حزام {player.belt || "أبيض"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              🏢 {player.branch}
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[11px] font-bold text-slate-700">
              🎂 {currentAge} سنة
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2 py-0.5 text-[11px] font-black text-red-700">
              مستوى {player.level || "A"}
            </span>
          </div>

          <span className="mt-1.5 block text-[10px] sm:text-[11px] font-medium text-slate-400">
            عضو منذ: {registrationDate}
          </span>
        </div>
      </div>

      {/* بنر سياقي ذكي (يظهر فقط إذا كان هناك مناسبة خاصة أو كارت ترحيب متاح - بدون تكرار) */}
      {hasActiveBirthday ? (
        <div className="rounded-2xl border border-rose-200 bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 p-3 shadow-2xs flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0 animate-bounce">🎂</span>
            <div className="min-w-0">
              <strong className="block font-cairo text-xs sm:text-sm font-black text-rose-950 truncate">
                {birthdayInfo.isToday ? `اليوم عيد ميلاد ${player.name}!` : `غداً عيد ميلاد ${player.name}!`}
              </strong>
              <span className="block text-[11px] font-bold text-amber-900 truncate">
                يُتم {birthdayInfo.turningAge} عاماً · كل عام وبطلنا بألف خير! 🎉
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              disabled={isSendingBirthdayText}
              onClick={shareBirthdayText}
              className="flex items-center gap-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 transition cursor-pointer disabled:opacity-60"
              title="إرسال تهنئة عبر واتساب"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span className="hidden xs:inline">تهنئة واتساب</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBirthdayModal(true)}
              className="flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-black text-amber-900 shadow-2xs hover:bg-amber-50 active:scale-95 transition cursor-pointer"
              title="معاينة كارت عيد الميلاد"
            >
              <Eye className="h-3.5 w-3.5 text-amber-700" />
              <span>الكارت</span>
            </button>
          </div>
        </div>
      ) : showWelcomeCardButton ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/60 p-3 shadow-2xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-2xs text-sm">
              🥋
            </div>
            <div className="min-w-0">
              <strong className="block font-cairo text-xs sm:text-sm font-black text-emerald-950 truncate">
                مرحباً ببطلنا الجديد في الأكاديمية!
              </strong>
              <span className="block text-[11px] font-medium text-emerald-800 truncate">
                كارت الترحيب جاهز للمشاركة على السوشيال ميديا ✨
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowWelcomeCardModal(true)}
            className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-3 py-1.5 text-xs font-black shadow-xs transition active:scale-95 cursor-pointer ring-2 ring-emerald-300/60"
            title="معاينة كارت الترحيب بالبطل"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>كارت الترحيب</span>
          </button>
        </div>
      ) : null}

      {/* شبكة الإجراءات السريعة الأربعة - تطبيق أصيل (4 Quick Action Buttons) */}
      <div className="pt-2 border-t border-slate-100 grid grid-cols-4 gap-2">
        {/* 1. واتساب ولي الأمر */}
        {guardianPhone ? (
          <button
            type="button"
            onClick={openGuardianChat}
            disabled={isOpeningChat}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 py-2.5 px-1 text-emerald-900 transition active-press cursor-pointer touch-manipulation disabled:opacity-60 shadow-2xs"
            title="فتح محادثة واتساب مع ولي الأمر"
          >
            <div className="h-8 w-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageCircle className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black truncate max-w-full">واتساب</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => startEditing("")}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-dashed border-slate-300 py-2.5 px-1 text-slate-500 transition active-press cursor-pointer touch-manipulation"
            title="إضافة رقم ولي الأمر"
          >
            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center">
              <Phone className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold truncate max-w-full">+ هاتف</span>
          </button>
        )}

        {/* 2. اتصال هاتفي مباشر */}
        {guardianPhone ? (
          <a
            href={`tel:${guardianPhone}`}
            onClick={handlePhoneCallClick}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-blue-50 hover:bg-blue-100/80 border border-blue-200/80 py-2.5 px-1 text-blue-900 transition active-press touch-manipulation shadow-2xs text-center"
            title="اتصال هاتفي مباشر"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Phone className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-black truncate max-w-full">اتصال</span>
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 border border-slate-200 py-2.5 px-1 text-slate-300 opacity-60 cursor-not-allowed text-center"
          >
            <div className="h-8 w-8 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center">
              <Phone className="h-4 w-4" />
            </div>
            <span className="text-[11px] font-bold truncate max-w-full">اتصال</span>
          </button>
        )}

        {/* 3. تقرير نصي فوري */}
        <button
          type="button"
          disabled={isSendingText}
          onClick={() => shareReportText(reportMonth)}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 py-2.5 px-1 text-slate-800 transition active-press cursor-pointer touch-manipulation disabled:opacity-60 shadow-2xs"
          title={`إرسال تقرير شهر ${formatArabicMonth(reportMonth)} لولي الأمر عبر واتساب`}
        >
          <div className="h-8 w-8 rounded-full bg-slate-800 text-white flex items-center justify-center shadow-xs">
            <FileText className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-black truncate max-w-full">تقرير فوري</span>
        </button>

        {/* 4. كارت ID اللاعب */}
        <button
          type="button"
          onClick={() => setShowCardModal(true)}
          className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-red-50 hover:bg-red-100/80 border border-red-200/80 py-2.5 px-1 text-red-900 transition active-press cursor-pointer touch-manipulation shadow-2xs"
          title={`معاينة ومشاركة كارت شهر ${formatArabicMonth(reportMonth)}`}
        >
          <div className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center shadow-xs">
            <Eye className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-black truncate max-w-full">كارت اللاعب</span>
        </button>
      </div>

      {/* شريط تبديل شهر التقرير والكارت في البروفايل */}
      <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-100 border border-slate-200/80 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 min-w-0">
          <Calendar className="h-3.5 w-3.5 text-red-600 shrink-0" />
          <span className="truncate">شهر التقرير والكارت:</span>
          <span className="text-red-700 font-extrabold truncate">{formatArabicMonth(reportMonth)}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              const [y, m] = reportMonth.split("-").map(Number);
              const d = new Date(y, m - 2, 1);
              setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
            }}
            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] active:scale-95 cursor-pointer"
            title="الشهر السابق"
          >
            ◀ السابق
          </button>
          <button
            type="button"
            onClick={() => {
              const [y, m] = reportMonth.split("-").map(Number);
              const d = new Date(y, m, 1);
              setReportMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
            }}
            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] active:scale-95 cursor-pointer"
            title="الشهر التالي"
          >
            التالي ▶
          </button>
        </div>
      </div>
    </div>
  );
}
