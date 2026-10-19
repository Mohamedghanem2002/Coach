"use client";
import React from "react";
import { Building2, ShieldAlert } from "lucide-react";

export default function CaptainHallsTab({ stats = {} }) {
  return (
    <div className="space-y-4">
      {/* Big Count Card */}
      <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-2xs flex flex-col items-center justify-center text-center gap-2">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-1">
          <Building2 className="w-7 h-7 text-blue-500" />
        </div>
        <strong className="text-5xl font-black text-blue-900">
          {stats.branchesCount ?? stats.hallsCount ?? 0}
        </strong>
        <span className="text-sm font-black text-slate-500">صالة وفرع تدريب مسجل</span>
      </div>

      {/* Info Notice */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <p className="text-xs font-black text-slate-800 mb-0.5">
            تفاصيل الصالات متاحة في لوحة الكابتن
          </p>
          <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
            يمكن للكابتن إدارة صالات وفروع تدريبه من لوحة التحكم الخاصة به.
            تعرض هنا الإدارة إجمالي عدد الصالات فقط.
          </p>
        </div>
      </div>
    </div>
  );
}
