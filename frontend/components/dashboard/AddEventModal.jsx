"use client";
import { useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Banknote,
  FileText,
  X,
  Compass,
  Trophy,
  Tent,
  Award,
  Sparkles,
} from "lucide-react";

const EVENT_TYPES = [
  { id: "trip", label: "رحلة ترفيهية", icon: Compass, color: "text-amber-600 bg-amber-50 border-amber-200" },
  { id: "tournament", label: "بطولة ومنافسة", icon: Trophy, color: "text-rose-600 bg-rose-50 border-rose-200" },
  { id: "camp", label: "معسكر تدريبي", icon: Tent, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "belt_exam", label: "اختبار حزام", icon: Award, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { id: "other", label: "فعالية أخرى", icon: Sparkles, color: "text-purple-600 bg-purple-50 border-purple-200" },
];

export default function AddEventModal({
  isOpen,
  onClose,
  onSave,
  initialEvent = null,
  isSubmitting = false,
}) {
  const isEditing = Boolean(initialEvent && initialEvent._id);

  const [title, setTitle] = useState(initialEvent?.title || "");
  const [type, setType] = useState(initialEvent?.type || "trip");
  const [date, setDate] = useState(
    initialEvent?.date || new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState(initialEvent?.time || "08:00 ص");
  const [location, setLocation] = useState(initialEvent?.location || "");
  const [fee, setFee] = useState(
    initialEvent?.fee !== undefined ? initialEvent.fee : 150,
  );
  const [description, setDescription] = useState(initialEvent?.description || "");
  const [status, setStatus] = useState(initialEvent?.status || "upcoming");

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return;

    await onSave({
      ...(isEditing ? { id: initialEvent._id } : {}),
      title: title.trim(),
      type,
      date,
      time: time.trim(),
      location: location.trim(),
      fee: Number(fee) >= 0 ? Number(fee) : 0,
      description: description.trim(),
      status,
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs transition-all duration-300"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden animate-bottom-sheet sm:animate-modal-pop max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 text-white shrink-0">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/40 sm:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-xs backdrop-blur-xs">
                <Compass className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-cairo text-base font-black leading-tight">
                  {isEditing ? "تعديل بيانات الفعالية" : "إنشاء فعالية أو رحلة جديدة"}
                </h3>
                <p className="text-[11px] font-semibold text-white/80">
                  تنظيم الرحلات والبطولات وإدارة اشتراكات الأبطال
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 touch-scroll">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم الفعالية / الحدث <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: رحلة وادي الريان، بطولة الجمهورية التنشيطية..."
              className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3.5 py-2.5 text-sm font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
            />
          </div>

          {/* Type Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              نوع الفعالية
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EVENT_TYPES.map((t) => {
                const isSelected = type === t.id;
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-black transition-all active:scale-95 cursor-pointer text-right ${
                      isSelected
                        ? "border-red-500 bg-red-50/70 text-red-700 shadow-xs ring-2 ring-red-200/60"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${t.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                تاريخ الحدث
              </label>
              <div className="relative">
                <Calendar className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pr-9 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                توقيت التجمع
              </label>
              <div className="relative">
                <Clock className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="مثال: 07:30 صباحاً"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pr-9 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Location & Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                المكان / الوجهة
              </label>
              <div className="relative">
                <MapPin className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: محمية وادي الريان - الفيوم"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pr-9 pl-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                رسوم الاشتراك المقررة (ج.م)
              </label>
              <div className="relative">
                <Banknote className="absolute right-3 top-3 h-4 w-4 text-emerald-600" />
                <input
                  type="number"
                  min="0"
                  step="5"
                  required
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="150"
                  className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pr-9 pl-3 py-2.5 text-xs font-black text-emerald-700 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* Status (if editing) */}
          {isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                حالة الفعالية
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 px-3 py-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:border-red-500 outline-none"
              >
                <option value="upcoming">قادم (لم تبدأ بعد)</option>
                <option value="active">نشط / جارية الآن</option>
                <option value="completed">مكتملة ومغلقة</option>
                <option value="cancelled">ملغية</option>
              </select>
            </div>
          )}

          {/* Description & Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ملاحظات وتعليمات المشتركين
            </label>
            <div className="relative">
              <FileText className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
              <textarea
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="مثال: إحضار زي الكاراتيه، التجمع أمام الصالة الرئيسية الساعة 7..."
                className="w-full rounded-xl border border-slate-200/90 bg-slate-50/70 pr-9 pl-3 py-2 text-xs font-medium text-slate-800 focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none transition resize-none"
              />
            </div>
          </div>

          {/* Sticky footer submit */}
          <div className="pt-2 sticky bottom-0 bg-white border-t border-slate-100 mt-4 flex items-center justify-end gap-2 pb-safe">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-11 px-5 rounded-xl border border-slate-200/90 text-xs font-bold text-slate-600 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-11 px-6 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-xs font-black text-white shadow-md shadow-red-500/25 hover:from-red-700 hover:to-rose-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "جاري الحفظ..." : isEditing ? "تحديث الفعالية" : "إنشاء الفعالية"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
