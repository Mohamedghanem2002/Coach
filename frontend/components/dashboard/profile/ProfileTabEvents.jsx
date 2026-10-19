import { Compass } from "lucide-react";

export default function ProfileTabEvents({ playerEvents = [] }) {
  if (playerEvents.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 sm:p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <Compass className="h-4 w-4" />
          </div>
          <h3 className="font-cairo text-sm font-extrabold text-slate-900">
            الفعاليات والرحلات المشترك بها
          </h3>
        </div>
        <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
          {playerEvents.length} فعالية
        </span>
      </div>

      <div className="space-y-2">
        {playerEvents.map((ev) => (
          <div
            key={ev._id}
            className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 text-xs gap-2"
          >
            <div>
              <strong className="font-bold text-slate-900 block">{ev.title}</strong>
              <span className="text-[10px] font-semibold text-slate-500">
                {ev.date} {ev.location ? `• ${ev.location}` : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                  ev.paymentStatus === "paid"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : ev.paymentStatus === "partially_paid"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : "bg-rose-50 text-rose-800 border-rose-200"
                }`}
              >
                {ev.paymentStatus === "paid"
                  ? `✓ مدفوع (${ev.fee} ج.م)`
                  : ev.paymentStatus === "partially_paid"
                    ? `دفع ${ev.paid} • باقي ${ev.remaining} ج.م`
                    : `لم يدفع (باقي ${ev.fee} ج.م)`}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
