import { Clipboard, BookUser } from "lucide-react";
import { BELTS, LEVELS, toEnglishDigits } from "../../../lib/dashboard-utils";

export default function ProfileEditForm({
  saveInfo,
  profileSaving,
  editName,
  setEditName,
  editFileNumber,
  setEditFileNumber,
  editDobDay,
  editDobMonth,
  editDobYear,
  handleEditDayChange,
  handleEditMonthChange,
  handleEditYearChange,
  handleEditDatePaste,
  editMonthInputRef,
  editYearInputRef,
  calculatedEditAge,
  player,
  branches = [],
  editBranch,
  setEditBranch,
  editBelt,
  setEditBelt,
  editLevel,
  setEditLevel,
  editPhoneInputRef,
  editGuardianPhone,
  setEditGuardianPhone,
  handleEditPastePhone,
  handleEditPickContact,
  editContactNotice,
  showEditIOSContactGuide,
  setShowEditIOSContactGuide,
  handlePhotoChange,
  editPhoto,
  setEditPhoto,
  editDefaultTotalAmount,
  setEditDefaultTotalAmount,
  onCancel,
}) {
  return (
    <form onSubmit={saveInfo} className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-2xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900">تعديل بيانات اللاعب</h2>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">قم بتحديث معلومات اللاعب ثم اضغط حفظ التعديلات</p>
      </div>

      {/* اسم اللاعب ورقم الملف */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم اللاعب</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            placeholder="مثال: أحمد محمد"
          />
        </div>
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1 flex items-center justify-between">
            <span>رقم الملف</span>
            <span className="text-[10px] font-normal text-slate-400">اختياري</span>
          </label>
          <input
            type="text"
            inputMode="numeric"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            value={editFileNumber}
            onChange={(e) => setEditFileNumber(toEnglishDigits(e.target.value))}
            placeholder="مثال: 104"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            تاريخ الميلاد (يوم / شهر / سنة)
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            <input
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="text"
              inputMode="numeric"
              placeholder="اليوم"
              maxLength={2}
              value={editDobDay}
              onChange={(e) => handleEditDayChange(e.target.value)}
              onPaste={handleEditDatePaste}
              required={!player.dateOfBirth}
            />
            <input
              ref={editMonthInputRef}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="text"
              inputMode="numeric"
              placeholder="الشهر"
              maxLength={2}
              value={editDobMonth}
              onChange={(e) => handleEditMonthChange(e.target.value)}
              onPaste={handleEditDatePaste}
              required={!player.dateOfBirth}
            />
            <input
              ref={editYearInputRef}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-1 py-2.5 text-center text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="text"
              inputMode="numeric"
              placeholder="السنة"
              maxLength={4}
              value={editDobYear}
              onChange={(e) => handleEditYearChange(e.target.value)}
              onPaste={handleEditDatePaste}
              required={!player.dateOfBirth}
            />
          </div>
          {calculatedEditAge !== null && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 rounded-lg px-2 py-0.5">
              <span>✓</span>
              <span>العمر المحسوب: {calculatedEditAge === 0 ? "أقل من سنة" : `${calculatedEditAge} سنة`}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            الفرع / الصالة
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
            value={editBranch}
            onChange={(e) => setEditBranch(e.target.value)}
          >
            {branches.map((item) => (
              <option key={item._id} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* الحزام والمستوى */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            حزام الكاراتيه
          </label>
          <select
            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 cursor-pointer"
            value={editBelt}
            onChange={(e) => setEditBelt(e.target.value)}
          >
            {BELTS.map((b) => (
              <option key={b.name} value={b.name}>
                🥋 حزام {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            المستوى (Level)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setEditLevel(lvl)}
                className={`rounded-xl py-2 text-xs font-black transition cursor-pointer active:scale-95 ${
                  editLevel === lvl
                    ? "bg-red-600 text-white shadow-xs shadow-red-500/30 ring-2 ring-red-200"
                    : "border border-slate-200 bg-slate-50/60 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1.5">
          <label htmlFor="edit-guardian-phone-input" className="text-xs font-extrabold text-slate-700">
            رقم ولي الأمر <span className="text-slate-400 font-normal text-[11px]">(للواتساب)</span>
          </label>
          <div className="flex items-center gap-1.5">
            {/* زر لصق سريع */}
            <button
              type="button"
              onClick={handleEditPastePhone}
              className="inline-flex items-center gap-1 rounded-lg bg-slate-100 hover:bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 border border-slate-200 transition active:scale-95 cursor-pointer"
              title="لصق الرقم المنسوخ من الحافظة بنقرة واحدة"
            >
              <Clipboard className="h-3 w-3 text-slate-500" />
              <span>لصق 📋</span>
            </button>

            {/* زر سجل الهاتف */}
            <button
              type="button"
              onClick={handleEditPickContact}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 hover:bg-red-100 px-2 py-0.5 text-[11px] font-bold text-red-700 border border-red-200/60 transition active:scale-95 cursor-pointer"
              title="اختيار رقم ولي الأمر مباشرة من سجل الأسماء بالهاتف"
            >
              <BookUser className="h-3.5 w-3.5 text-red-600" />
              <span>جهات الاتصال 📱</span>
            </button>
          </div>
        </div>
        <input
          ref={editPhoneInputRef}
          id="edit-guardian-phone-input"
          name="tel"
          autoComplete="tel"
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
          type="tel"
          inputMode="tel"
          value={editGuardianPhone}
          onChange={(e) => setEditGuardianPhone(toEnglishDigits(e.target.value))}
          placeholder="01xxxxxxxxx"
        />
        {editContactNotice && (
          <p className="mt-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1 animate-slide-up">
            {editContactNotice}
          </p>
        )}

        {/* دليل مستخدمي الآيفون لاستيراد جهات الاتصال */}
        {showEditIOSContactGuide && (
          <div className="mt-2 p-3 rounded-2xl bg-amber-50/95 border border-amber-200/90 text-xs text-amber-950 space-y-2 animate-slide-up shadow-2xs">
            <div className="flex items-center justify-between border-b border-amber-200/60 pb-1.5">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 text-xs">
                <span>🍎</span>
                <span>طرق استيراد الرقم على الآيفون:</span>
              </div>
              <button
                type="button"
                onClick={() => setShowEditIOSContactGuide(false)}
                className="text-amber-600 hover:text-amber-900 font-black text-xs p-1 cursor-pointer"
                aria-label="إغلاق التنبيه"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-[11px] font-semibold text-amber-900/90 leading-relaxed">
              <p>
                <strong>1. التعبئة التلقائية:</strong> اضغط على حقل الرقم وسيظهر لك زر <strong>&quot;تعبئة جهة اتصال&quot;</strong> أعلى لوحة المفاتيح لاختيار الرقم فوراً من سجل هاتفك.
              </p>
              <p>
                <strong>2. اللصق الفوري:</strong> انسخ رقم ولي الأمر من واتساب واضغط زر <strong>&quot;لصق 📋&quot;</strong> لإضافته بنقرة واحدة.
              </p>
              <p className="text-[10px] text-amber-800/80 pt-1 border-t border-amber-200/50">
                💡 لتفعيل نافذة جهات الاتصال المباشرة كما في أندرويد: افتح <strong>إعدادات الآيفون &gt; Safari &gt; خيارات متقدمة &gt; Feature Flags</strong> وفعّل <strong>Contact Picker API</strong>.
              </p>
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          صورة اللاعب الشخصية
        </label>
        <div className="flex items-center gap-2.5 sm:gap-3">
          <input
            className="flex-1 rounded-xl border border-slate-200 bg-slate-50/60 px-2.5 py-2 text-[11px] sm:text-xs text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-red-100 file:px-2.5 file:py-1 file:text-xs file:font-black file:text-red-700 hover:file:bg-red-200 cursor-pointer"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
          />
          {editPhoto && (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={editPhoto}
                alt="Preview"
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-red-200"
              />
              <button
                type="button"
                onClick={() => setEditPhoto("")}
                className="rounded-lg bg-rose-50 px-2 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-100 cursor-pointer"
              >
                إزالة
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-xs font-extrabold text-slate-700 mb-1">
          قيمة اشتراك الشهر الثابت للاعب (ج.م) - اختياري
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs sm:text-sm font-bold outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
          type="text"
          inputMode="numeric"
          value={editDefaultTotalAmount}
          onChange={(e) =>
            setEditDefaultTotalAmount(toEnglishDigits(e.target.value).replace(/[^0-9]/g, ""))
          }
          placeholder="اتركه فارغاً إذا لم تحدد اشتراكاً ثابتاً لهذا اللاعب"
        />
        <p className="mt-1 text-[11px] text-slate-400">
          إذا تم تحديد قيمة هنا، سيتم اعتمادها تلقائياً لكل الشهور القادمة ويمكنك تعديلها في أي وقت.
        </p>
      </div>

      <div className="pt-2 grid gap-2 sm:grid-cols-2">
        <button
          className="rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer transition touch-manipulation"
          type="submit"
          disabled={profileSaving}
        >
          {profileSaving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin inline-block" />
              جاري الحفظ...
            </span>
          ) : (
            "✓ حفظ التعديلات"
          )}
        </button>
        <button
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer transition touch-manipulation"
          type="button"
          onClick={onCancel}
        >
          إلغاء
        </button>
      </div>
    </form>
  );
}
