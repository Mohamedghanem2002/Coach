import {
  Check,
  Phone,
  MessageSquare,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { BELT_HEX } from "../../../lib/dashboard-utils";

export default function EventParticipantCard({
  participant,
  selectedEvent,
  isSelected,
  onToggleSelect,
  onSendWhatsApp,
  onRemove,
  onUpdateAttendance,
  onOpenPaymentModal,
}) {
  const pId = participant.playerId;
  const total = Number(
    participant.totalAmount ?? selectedEvent.fee ?? 100
  );
  const paid = Number(participant.paidAmount ?? 0);
  const remaining = Math.max(0, total - paid);
  const beltColor = BELT_HEX[participant.belt] || "#cbd5e1";
  const phone = participant.parentPhone || participant.phone;

  return (
    <div
      className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
        isSelected
          ? "border-red-500 bg-red-50/40 shadow-xs ring-2 ring-red-100"
          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs"
      }`}
    >
      {/* Row 1: Checkbox, Avatar, Name & Contacts */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Checkbox */}
          <button
            type="button"
            onClick={() => onToggleSelect(pId)}
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition active-press cursor-pointer ${
              isSelected
                ? "border-red-600 bg-red-600 text-white shadow-xs"
                : "border-slate-300 bg-white hover:border-slate-400"
            }`}
            aria-label="تحديد اللاعب"
          >
            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
          </button>

          {/* Avatar with Belt Indicator */}
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 overflow-hidden ring-2 ring-slate-100">
            {participant.photo ? (
              <img
                src={participant.photo}
                alt={participant.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-cairo text-sm font-black text-slate-600">
                {participant.name?.slice(0, 1) || "ب"}
              </span>
            )}
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
              style={{ backgroundColor: beltColor }}
              title={`حزام ${participant.belt}`}
            />
          </div>

          {/* Name & Branch */}
          <div className="min-w-0">
            <strong className="block truncate font-cairo text-sm font-black text-slate-900">
              {participant.name}
            </strong>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-slate-500">
              <span>{participant.branch}</span>
              <span>•</span>
              <span className="text-slate-700">{participant.belt}</span>
            </div>
          </div>
        </div>

        {/* Direct Contact Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active-press transition"
              title={`اتصال بولي الأمر (${phone})`}
            >
              <Phone className="h-3.5 w-3.5" />
            </a>
          )}

          <button
            type="button"
            onClick={() => onSendWhatsApp(participant, selectedEvent)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer"
            title="إرسال تفاصيل الفعالية عبر واتساب"
          >
            <MessageSquare className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  `هل أنت متأكد من إزالة اللاعب (${participant.name}) من هذا الحدث؟`
                )
              ) {
                onRemove(selectedEvent._id, pId);
              }
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active-press transition cursor-pointer"
            title="إزالة من الفعالية"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Row 2: Attendance Toggle & Payment Button */}
      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100">
        {/* Attendance Toggle */}
        <button
          type="button"
          onClick={() =>
            onUpdateAttendance(
              selectedEvent._id,
              pId,
              !participant.attended
            )
          }
          className={`min-h-[42px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs font-black transition active-press cursor-pointer ${
            participant.attended
              ? "bg-emerald-600 text-white shadow-xs"
              : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
          }`}
        >
          {participant.attended ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>حاضر ✓</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-slate-400" />
              <span>غائب</span>
            </>
          )}
        </button>

        {/* Payment Modal Trigger */}
        <button
          type="button"
          onClick={() =>
            onOpenPaymentModal(participant, selectedEvent)
          }
          className={`min-h-[42px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs font-black transition active-press cursor-pointer ${
            participant.paymentStatus === "paid"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
              : participant.paymentStatus === "partially_paid"
              ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-2xs"
              : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
          }`}
        >
          {participant.paymentStatus === "paid" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="truncate">مدفوع ({total} ج.م)</span>
            </>
          ) : participant.paymentStatus === "partially_paid" ? (
            <>
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="truncate">
                دفع {paid} • باقي {remaining}
              </span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span className="truncate">لم يدفع ({total})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
