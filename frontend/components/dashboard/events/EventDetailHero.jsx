import {
  UserPlus,
  FileSpreadsheet,
  Share2,
  Edit2,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { TYPE_CONFIG, STATUS_LABELS } from "./events-config";

export default function EventDetailHero({
  selectedEvent,
  onOpenAddParticipants,
  onExportEventCSV,
  onShareWhatsAppReport,
  onOpenEditEvent,
  onDeleteEvent,
  onBackToAll,
}) {
  const typeInfo = TYPE_CONFIG[selectedEvent.type] || TYPE_CONFIG.other;
  const statusInfo =
    STATUS_LABELS[selectedEvent.status] || STATUS_LABELS.upcoming;
  const TypeIcon = typeInfo.icon;
  const parts = selectedEvent.participants || [];
  const totalRev = parts.reduce(
    (sum, p) => sum + (Number(p.totalAmount) || 0),
    0
  );
  const paidRev = parts.reduce(
    (sum, p) => sum + (Number(p.paidAmount) || 0),
    0
  );
  const remRev = Math.max(0, totalRev - paidRev);
  const attendedCount = parts.filter((p) => p.attended).length;
  const collectionPercent =
    totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 0;

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
      {/* Event Header Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className={`p-3 rounded-2xl border ${typeInfo.color}`}>
            <TypeIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${typeInfo.badge}`}>
                {typeInfo.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black flex items-center gap-1.5 ${statusInfo.color}`}>
                <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                <span>{statusInfo.label}</span>
              </span>
            </div>
            <h3 className="font-cairo text-lg sm:text-xl font-black text-slate-900 mt-1">
              {selectedEvent.title}
            </h3>
            {selectedEvent.notes && (
              <p className="text-xs font-semibold text-slate-500 mt-1 max-w-xl">
                {selectedEvent.notes}
              </p>
            )}
          </div>
        </div>

        {/* Actions Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onOpenAddParticipants(selectedEvent)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm shadow-red-600/20 active-press transition cursor-pointer min-h-[40px]"
          >
            <UserPlus className="h-4 w-4 stroke-[2.5]" />
            <span>إضافة لاعبين</span>
          </button>

          <button
            type="button"
            onClick={() => onExportEventCSV(selectedEvent)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer min-h-[40px] text-xs font-black"
            title="تصدير كشف المشتركين Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          <button
            type="button"
            onClick={() => onShareWhatsAppReport(selectedEvent)}
            className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer min-h-[40px] text-xs font-black"
            title="مشاركة تقرير الفعالية عبر واتساب"
          >
            <Share2 className="h-4 w-4" />
            <span className="hidden sm:inline">واتساب</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenEditEvent(selectedEvent)}
            className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active-press transition cursor-pointer min-h-[40px]"
            title="تعديل بيانات الحدث"
          >
            <Edit2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `هل أنت متأكد من حذف فعالية (${selectedEvent.title}) وجميع بيانات مشتركيها؟`
                )
              ) {
                onDeleteEvent(selectedEvent._id);
                onBackToAll();
              }
            }}
            className="flex items-center justify-center p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 active-press transition cursor-pointer min-h-[40px]"
            title="حذف الحدث"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Event Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="block text-[10px] font-bold text-slate-400">التاريخ والموعد</span>
          <strong className="block font-cairo font-black text-slate-800 mt-0.5 truncate">
            {selectedEvent.date} {selectedEvent.time ? `(${selectedEvent.time})` : ""}
          </strong>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="block text-[10px] font-bold text-slate-400">المكان</span>
          <strong className="block font-cairo font-black text-slate-800 mt-0.5 truncate">
            {selectedEvent.location || "غير محدد"}
          </strong>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="block text-[10px] font-bold text-slate-400">قيمة الاشتراك</span>
          <strong className="block font-cairo font-black text-emerald-700 mt-0.5">
            {selectedEvent.fee} ج.م / لاعب
          </strong>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="block text-[10px] font-bold text-slate-400">الحضور الفعلي</span>
          <strong className="block font-cairo font-black text-blue-700 mt-0.5">
            {attendedCount} حاضر من {parts.length}
          </strong>
        </div>
      </div>

      {/* Financial Progress Bar */}
      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-800">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>المسدد: {paidRev.toLocaleString("ar-EG")} ج.م</span>
          </div>
          {remRev > 0 ? (
            <span className="text-amber-800">
              المتبقي معلق: {remRev.toLocaleString("ar-EG")} ج.م
            </span>
          ) : (
            <span className="text-emerald-700 font-bold">
              🎉 تم سداد كافة الاشتراكات بالكامل!
            </span>
          )}
          <span className="text-slate-500 font-bold">
            {collectionPercent}% تم تحصيله
          </span>
        </div>

        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-500"
            style={{ width: `${Math.min(100, collectionPercent)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
