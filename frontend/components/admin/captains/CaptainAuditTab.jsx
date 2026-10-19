"use client";
import React from "react";
import { History } from "lucide-react";

export default function CaptainAuditTab({ auditLogs = [] }) {
  if (auditLogs.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 text-slate-400 text-xs font-bold space-y-1">
        <History className="w-10 h-10 mx-auto text-slate-300" />
        <p className="text-slate-700 font-black">
          لا توجد سجلات لعمليات إدارية سابقة لهذا الحساب
        </p>
        <p className="text-slate-400 text-[11px]">
          يتم تسجيل عمليات التعليق، التمديد، والسداد تلقائياً.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {auditLogs.map((log) => {
        const isActionSuspend = log.action === "suspend_academy";
        const isActionReactivate = log.action === "reactivate_academy";
        const isActionExtend = log.action === "extend_subscription";
        const isActionPay = log.action === "mark_subscription_paid";

        return (
          <div
            key={log._id || log.id}
            className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs flex items-start justify-between gap-3 text-xs"
          >
            <div className="space-y-1">
              <strong
                className={`block font-black text-xs ${
                  isActionSuspend
                    ? "text-rose-700"
                    : isActionReactivate
                    ? "text-emerald-700"
                    : isActionExtend
                    ? "text-blue-700"
                    : isActionPay
                    ? "text-amber-800"
                    : "text-slate-900"
                }`}
              >
                {isActionSuspend
                  ? "🚫 تعليق حساب الكابتن"
                  : isActionReactivate
                  ? "✅ إعادة تفعيل الحساب"
                  : isActionExtend
                  ? "⏰ تمديد الاشتراك"
                  : isActionPay
                  ? "💳 تسجيل سداد الاشتراك"
                  : log.action === "mark_subscription_unpaid"
                  ? "⚠️ إلغاء سداد الاشتراك"
                  : log.action}
              </strong>

              <div className="text-[11px] text-slate-500 font-medium">
                <span>بواسطة المسؤول: </span>
                <span className="font-mono text-slate-700 font-bold">
                  {log.adminEmail}
                </span>
                {log.details?.reason && (
                  <span className="block text-slate-600 mt-0.5">
                    السبب: <strong>{log.details.reason}</strong>
                  </span>
                )}
                {log.details?.daysAdded && (
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-black">
                    +{log.details.daysAdded} يوم
                  </span>
                )}
              </div>
            </div>

            <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              {new Date(log.createdAt).toLocaleDateString("ar-EG")}
            </span>
          </div>
        );
      })}
    </div>
  );
}
