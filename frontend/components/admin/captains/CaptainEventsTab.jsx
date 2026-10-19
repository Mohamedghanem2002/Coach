"use client";
import React from "react";
import { Trophy, ShieldAlert } from "lucide-react";

export default function CaptainEventsTab({ stats = {} }) {
  return (
    <div className="space-y-4">
      {/* Big Count Card */}
      <div className="rounded-2xl border border-amber-100 bg-white p-6 shadow-2xs flex flex-col items-center justify-center text-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mb-1">
          <Trophy className="w-7 h-7 text-amber-500" />
        </div>
        <strong className="text-5xl font-black text-amber-900">
          {stats.eventsCount ?? 0}
        </strong>
        <span className="text-sm font-black text-slate-500">فعالية وبطولة منظمة</span>
      </div>

      {/* Info Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-800 mb-0.5">
            تفاصيل الفعاليات متاحة في لوحة الكابتن
          </p>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            يمكن للكابتن الاطلاع على الفعاليات والبطولات التي نظمها من لوحة التحكم الخاصة به.
            تعرض هنا الإدارة إجمالي عدد الفعاليات فقط.
          </p>
        </div>
      </div>
    </div>
  );
}
