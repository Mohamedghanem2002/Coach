import { Calendar, Check, X, Trash2, Plus } from "lucide-react";
import { getArabicDayName, formatArabicMonth } from "../../../lib/dashboard-utils";

export default function ProfileTabAttendance({
  activeMonthAttendance,
  reportMonth,
  updatingAttendanceDate,
  deletingAttendanceDate,
  handleTogglePastAttendance,
  handleDeletePastAttendance,
  today,
  customAttendanceDate,
  setCustomAttendanceDate,
  customAttendanceStatus,
  setCustomAttendanceStatus,
  addCustomAttendance,
  isSavingAttendance,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-start">
        {/* سجل الحضور */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Calendar className="h-4 w-4" />
                </div>
                <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                  سجل الحضور والغياب
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                {activeMonthAttendance.sessions.length} حصة ({formatArabicMonth(reportMonth)})
              </span>
            </div>

            {!activeMonthAttendance.sessions || activeMonthAttendance.sessions.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Calendar className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-bold">لا توجد حصص تدريبية مسجلة خلال هذا الشهر.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 sm:max-h-80 lg:max-h-[380px] overflow-y-auto pr-1">
                {[...activeMonthAttendance.sessions].reverse().map((item) => (
                  <div
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5 text-xs gap-2"
                    key={item.date}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-extrabold text-slate-900 truncate">
                        {item.dayName || getArabicDayName(item.date)}
                      </span>
                      <span className="text-slate-500 text-[11px] font-medium font-mono shrink-0">
                        ({item.date})
                      </span>
                      {item.isAutoAbsent && (
                        <span className="text-[9.5px] font-bold text-rose-600 bg-rose-50 border border-rose-200/60 px-1.5 py-0.2 rounded-md shrink-0">
                          غياب تلقائي
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer touch-manipulation ${
                          item.status === "present"
                            ? "bg-emerald-600 text-white hover:bg-emerald-700"
                            : "bg-rose-600 text-white hover:bg-rose-700"
                        }`}
                        onClick={() => handleTogglePastAttendance(item.date, item.status)}
                        title="انقر للتبديل"
                      >
                        {updatingAttendanceDate === item.date ? (
                          <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                        ) : item.status === "present" ? (
                          <><Check className="h-3 w-3" strokeWidth={2.5} /> حاضر</>
                        ) : (
                          <><X className="h-3 w-3" strokeWidth={2.5} /> غائب</>
                        )}
                      </button>
                      {!item.isAutoAbsent && (
                        <button
                          disabled={Boolean(updatingAttendanceDate || deletingAttendanceDate)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer touch-manipulation"
                          onClick={() => handleDeletePastAttendance(item.date)}
                          title="حذف من السجل"
                        >
                          {deletingAttendanceDate === item.date ? (
                            <span className="h-3 w-3 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* إضافة حصة حضور مخصصة */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <Plus className="h-4 w-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-cairo text-sm font-extrabold text-slate-900">
                  تسجيل حصة مخصصة
                </h3>
                <p className="text-[10px] text-slate-400">سجل حضور أو غياب بتاريخ محدد</p>
              </div>
            </div>

            <form onSubmit={addCustomAttendance} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  تاريخ الحصة
                </label>
                <input
                  type="date"
                  max={today}
                  value={customAttendanceDate}
                  onChange={(e) => setCustomAttendanceDate(e.target.value)}
                  className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  حالة الحضور
                </label>
                <select
                  value={customAttendanceStatus}
                  onChange={(e) => setCustomAttendanceStatus(e.target.value)}
                  className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-xs font-bold outline-none focus:border-red-500 focus:bg-white cursor-pointer"
                >
                  <option value="present">حاضر ✓</option>
                  <option value="absent">غائب ×</option>
                </select>
              </div>

              <button
                className="min-h-10 w-full rounded-xl bg-slate-900 px-4 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-60 active:scale-95 cursor-pointer touch-manipulation shadow-2xs"
                type="submit"
                disabled={isSavingAttendance}
              >
                {isSavingAttendance ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>جاري التسجيل...</span>
                  </span>
                ) : (
                  "+ إضافة الحصة للسجل"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
  );
}
