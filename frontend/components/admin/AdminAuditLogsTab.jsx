"use client";
import React, { useState, useEffect } from "react";
import {
  History,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle,
  Clock,
  CreditCard,
  UserPlus,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

export default function AdminAuditLogsTab() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = (page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      search,
      action: actionFilter,
    });

    fetch(`/api/admin/audit-logs?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setLogs(resData.logs || []);
          setPagination(resData.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch audit logs:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        page: "1",
        limit: "20",
        search,
        action: actionFilter,
      });

      fetch(`/api/admin/audit-logs?${params.toString()}`)
        .then((res) => res.json())
        .then((resData) => {
          if (!ignore && resData.success) {
            setLogs(resData.logs || []);
            setPagination(resData.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 });
          }
        })
        .catch((err) => {
          console.error("Failed to fetch audit logs:", err);
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [actionFilter, search]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "suspend_academy":
      case "suspend_captain":
        return {
          label: "تعليق حساب",
          color: "bg-red-100 text-red-700 border-red-200",
          icon: ShieldAlert,
        };
      case "reactivate_academy":
      case "reactivate_captain":
        return {
          label: "إعادة تفعيل",
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: CheckCircle,
        };
      case "extend_subscription":
        return {
          label: "تمديد اشتراك",
          color: "bg-indigo-100 text-indigo-700 border-indigo-200",
          icon: Clock,
        };
      case "register_academy":
      case "register_captain":
        return {
          label: "تسجيل جديد",
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: UserPlus,
        };
      case "mark_subscription_paid":
        return {
          label: "سداد اشتراك",
          color: "bg-emerald-100 text-emerald-800 border-emerald-200",
          icon: CreditCard,
        };
      case "mark_subscription_unpaid":
        return {
          label: "إلغاء سداد",
          color: "bg-amber-100 text-amber-800 border-amber-200",
          icon: CreditCard,
        };
      case "delete_captain_permanent":
      case "delete_academy_permanent":
        return {
          label: "حذف نهائي 🗑️",
          color: "bg-rose-100 text-rose-800 border-rose-200",
          icon: ShieldAlert,
        };
      case "update_plan":
        return {
          label: "تعديل الخطة 📋",
          color: "bg-purple-100 text-purple-800 border-purple-200",
          icon: Clock,
        };
      default:
        return {
          label: action,
          color: "bg-slate-100 text-slate-700 border-slate-200",
          icon: History,
        };
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" dir="rtl">
      {/* Top Filter and Search */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث في سجل العمليات..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer"
          >
            بحث
          </button>
        </form>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-black text-slate-400 shrink-0">نوع الإجراء:</span>
          {[
            { id: "all", label: "الكل" },
            { id: "suspend_academy", label: "تعليق" },
            { id: "reactivate_academy", label: "تفعيل" },
            { id: "extend_subscription", label: "تمديد" },
            { id: "register_academy", label: "تسجيل" },
            { id: "mark_subscription_paid", label: "سداد" },
            { id: "delete_captain_permanent", label: "حذف نهائي" },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActionFilter(opt.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                actionFilter === opt.id
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / Cards */}
      {logs.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center text-slate-400">
          <History className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-black text-slate-700 mb-1">لا توجد سجلات مطابقة</h3>
          <p className="text-xs font-bold">لم يتم تسجيل أي عمليات بالمعايير الحالية</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-black border-b border-slate-200/80">
                <tr>
                  <th className="p-4">نوع الإجراء</th>
                  <th className="p-4">الأكاديمية المستهدفة</th>
                  <th className="p-4">المسؤول / المشرف</th>
                  <th className="p-4">التفاصيل والملاحظات</th>
                  <th className="p-4">التاريخ والوقت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                {logs.map((log) => {
                  const badge = getActionBadge(log.action);
                  const Icon = badge.icon;
                  const dateStr = new Intl.DateTimeFormat("ar-EG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(log.createdAt));

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-black border ${badge.color}`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="p-4 font-black text-slate-900">
                        {log.targetAcademyName || "غير محدد"}
                      </td>
                      <td className="p-4 text-slate-600 font-mono text-[11px]" dir="ltr">
                        {log.adminEmail || "النظام"}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {log.details?.reason && <span>سبب: {log.details.reason}</span>}
                        {log.details?.daysAdded && <span>تمديد: +{log.details.daysAdded} يوم</span>}
                        {log.details?.ownerName && <span>مالك: {log.details.ownerName}</span>}
                        {!log.details?.reason && !log.details?.daysAdded && !log.details?.ownerName && (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-400 font-mono text-[11px]">
                        {dateStr}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => fetchLogs(pagination.page - 1)}
            disabled={!pagination.hasPrev}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
            <span>السابق</span>
          </button>

          <span className="text-xs font-bold text-slate-500">
            صفحة <strong className="text-slate-900 font-black">{pagination.page}</strong> من{" "}
            <strong className="text-slate-900 font-black">{pagination.totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => fetchLogs(pagination.page + 1)}
            disabled={!pagination.hasNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            <span>التالي</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
