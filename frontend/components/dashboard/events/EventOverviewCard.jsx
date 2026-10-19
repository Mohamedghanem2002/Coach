import {
  Edit2,
  Trash2,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  ChevronLeft,
  FileSpreadsheet,
  Share2,
} from "lucide-react";
import { TYPE_CONFIG, STATUS_LABELS } from "./events-config";

export default function EventOverviewCard({
  event,
  eventIdx,
  onSelectEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onExportEventCSV,
  onShareWhatsAppReport,
}) {
  const typeInfo = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
  const statusInfo = STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;
  const TypeIcon = typeInfo.icon;
  const parts = event.participants || [];
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
    <div className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200">
      <div>
        {/* Card Top: Badges & Edit/Delete */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2.5 rounded-2xl border ${typeInfo.color}`}>
              <TypeIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-black text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full ml-1">
                #{eventIdx + 1}
              </span>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${typeInfo.badge}`}>
                {typeInfo.label}
              </span>
              <span className={`mr-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
            </div>
          </div>

          {/* Edit / Delete quick buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditEvent(event);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="تعديل الفعالية"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (
                  confirm(
                    `هل أنت متأكد من حذف فعالية (${event.title})؟`
                  )
                ) {
                  onDeleteEvent(event._id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="حذف الفعالية"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-cairo text-base font-black text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
          {event.title}
        </h3>

        {/* Meta info pills */}
        <div className="mt-3 space-y-1.5 text-xs font-semibold text-slate-600 bg-slate-50/90 p-3 rounded-2xl">
          <div className="flex items-center gap-2 truncate">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {event.date} {event.time ? `(${event.time})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{event.location || "المكان غير محدد"}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span className="text-slate-800 font-bold">
              رسوم الاشتراك: <strong className="text-emerald-700">{event.fee} ج.م</strong>
            </span>
          </div>
        </div>

        {/* Financial Progress Strip */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black">
            <span className="text-slate-600">
              المشتركون:{" "}
              <strong className="text-slate-900 font-cairo">
                {parts.length} لاعب
              </strong>
              {parts.length > 0 && ` (${attendedCount} حاضر)`}
            </span>
            <span className="text-emerald-700 font-bold">
              {paidRev.toLocaleString("ar-EG")} ج.م
            </span>
          </div>

          <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${Math.min(100, collectionPercent)}%` }}
            />
          </div>

          {remRev > 0 && (
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
              <span>باقي مستحقات للتحصيل:</span>
              <span>{remRev.toLocaleString("ar-EG")} ج.م</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Bottom: Open Detail Action */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            onSelectEvent(event._id);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black text-white active-press transition cursor-pointer min-h-[40px]"
        >
          <Users className="h-3.5 w-3.5" />
          <span>عرض تفاصيل الفعالية وحساباتها ({parts.length})</span>
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onExportEventCSV(event)}
          className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active-press transition cursor-pointer min-h-[40px]"
          title="تصدير كشف Excel"
        >
          <FileSpreadsheet className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={() => onShareWhatsAppReport(event)}
          className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer min-h-[40px]"
          title="تقرير واتساب"
        >
          <Share2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
