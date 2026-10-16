"use client";
import React from "react";
import { Check, X, CreditCard, Trash2 } from "lucide-react";

export default function BulkActionDock({
  selectedPlayerIds = [],
  bulkAttendanceBusy = false,
  onToggleAll,
  onMarkAttendance,
  onMarkPayment,
  onDeleteSelected,
  onClearSelection,
}) {
  if (selectedPlayerIds.length === 0) return null;

  return (
    <div className="fixed bottom-22 md:bottom-6 left-1/2 -translate-x-1/2 z-40 md:z-50 glass-dock text-white rounded-2xl shadow-2xl border border-white/15 p-2.5 sm:px-5 flex items-center justify-between gap-2.5 animate-slide-up max-w-4xl w-[96%] sm:w-[94%] mb-safe">
      <div className="flex items-center gap-1.5 text-xs font-extrabold text-white shrink-0">
        <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-red-600 font-cairo text-xs sm:text-sm font-black text-white shadow-xs">
          {selectedPlayerIds.length}
        </span>
        <span className="hidden xs:inline text-[11px] sm:text-xs">محدد</span>
      </div>

      <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-scroll">
        <button
          type="button"
          className="min-h-9 whitespace-nowrap rounded-xl bg-white/10 px-2.5 text-xs font-bold text-slate-200 hover:bg-white/20 transition-all cursor-pointer active-press"
          onClick={onToggleAll}
        >
          الكل
        </button>
        <button
          type="button"
          className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 text-xs font-black text-white shadow-xs active-press disabled:opacity-60 cursor-pointer"
          disabled={bulkAttendanceBusy}
          onClick={() => onMarkAttendance("present")}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>حضور</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-rose-600 hover:bg-rose-700 px-3 text-xs font-black text-white shadow-xs active-press disabled:opacity-60 cursor-pointer"
          disabled={bulkAttendanceBusy}
          onClick={() => onMarkAttendance("absent")}
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>غياب</span>
        </button>
        <button
          type="button"
          className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-sky-600 hover:bg-sky-700 px-3 text-xs font-black text-white shadow-xs active-press disabled:opacity-60 cursor-pointer"
          disabled={bulkAttendanceBusy}
          onClick={() => onMarkPayment("paid")}
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>دفع</span>
        </button>
        <button
          type="button"
          className="min-h-9 whitespace-nowrap rounded-xl bg-white/10 px-2.5 text-xs font-bold text-slate-300 hover:bg-white/20 transition-all disabled:opacity-60 cursor-pointer active-press"
          disabled={bulkAttendanceBusy}
          onClick={() => onMarkPayment("unpaid")}
        >
          إلغاء
        </button>
        <button
          type="button"
          className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-red-600 hover:bg-red-700 px-3 text-xs font-black text-white shadow-xs active-press disabled:opacity-60 cursor-pointer"
          disabled={bulkAttendanceBusy}
          onClick={onDeleteSelected}
          title="حذف اللاعبين المحددين نهائياً"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>حذف</span>
        </button>
        <button
          type="button"
          className="min-h-9 rounded-xl border border-white/20 px-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all cursor-pointer active-press shrink-0"
          onClick={onClearSelection}
          title="إلغاء التحديد"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
