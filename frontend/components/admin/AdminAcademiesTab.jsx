"use client";
import React, { useState } from "react";
import {
  Search,
  Filter,
  Building2,
  Users,
  Clock,
  ShieldAlert,
  CheckCircle,
  Eye,
  RotateCcw,
  Calendar,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

export default function AdminAcademiesTab({
  academies = [],
  pagination = {},
  search = "",
  onSearchChange,
  statusFilter = "all",
  onStatusFilterChange,
  onPageChange,
  onSelectAcademy,
  onOpenSuspend,
  onOpenExtend,
  onOpenReactivate,
  onOpenDelete,
  onTogglePayment,
  loading = false,
  onRefresh,
}) {
  const statusOptions = [
    { id: "all", label: "جميع الأكاديميات" },
    { id: "active", label: "نشطة" },
    { id: "suspended", label: "موقوفة" },
    { id: "expired", label: "منتهية الصلاحية" },
    { id: "pending", label: "معلقة الدفع" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in" dir="rtl">
      {/* Top Filter and Search Control Bar */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ابحث باسم الأكاديمية، اسم الكابتن، الإيميل أو الهاتف..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-4 py-2.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 transition"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-xs hover:bg-slate-300"
              >
                ✕
              </button>
            )}
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="self-end sm:self-auto flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-black transition cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-600" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-black text-slate-400 shrink-0 ml-1">تصفية:</span>
          {statusOptions.map((opt) => {
            const active = statusFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => onStatusFilterChange(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition cursor-pointer ${
                  active
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500">
        <div>
          {pagination?.total !== undefined ? (
            <span>
              عرض{" "}
              <strong className="text-slate-800 font-black">
                {academies.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              من إجمالي <strong className="text-slate-800 font-black">{pagination.total}</strong> أكاديمية
            </span>
          ) : (
            <span>{academies.length} أكاديمية</span>
          )}
        </div>

        {loading && (
          <span className="text-red-600 font-black animate-pulse flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-600" />
            جارٍ التحديث...
          </span>
        )}
      </div>

      {/* Main Content: Desktop Table & Mobile Cards */}
      {academies.length === 0 ? (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-12 text-center text-slate-400">
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-black text-slate-700 mb-1">لا توجد أكاديميات مطابقة</h3>
          <p className="text-xs font-bold">جرّب تغيير عبارة البحث أو فلتر التصفية</p>
        </div>
      ) : (
        <>
          {/* 1. Desktop Table (Hidden on Mobile) */}
          <div className="hidden md:block rounded-3xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50/80 text-slate-500 font-black border-b border-slate-200/80">
                  <tr>
                    <th className="p-4">الأكاديمية والكابتن</th>
                    <th className="p-4">اللاعبين والصالات وتفاصيلها</th>
                    <th className="p-4">حالة الاشتراك</th>
                    <th className="p-4">انتهاء الصلاحية</th>
                    <th className="p-4">حالة السداد</th>
                    <th className="p-4 text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                  {academies.map((ac) => {
                    const isSuspended = ac.subscriptionStatus === "suspended" || ac.status === "suspended";
                    const isExpired = ac.subscriptionStatus === "expired";

                    const formattedExpires = ac.subscriptionExpiresAt
                      ? new Intl.DateTimeFormat("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(ac.subscriptionExpiresAt))
                      : "غير محدد";

                    return (
                      <tr key={ac.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Academy & Owner */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                              {ac.academyName.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <button
                                type="button"
                                onClick={() => onSelectAcademy(ac.id)}
                                className="font-black text-slate-900 hover:text-red-600 transition text-sm text-right truncate max-w-[200px] cursor-pointer"
                              >
                                {ac.academyName}
                              </button>
                              <span className="block text-[11px] text-slate-400 font-medium truncate">
                                {ac.name} &bull; {ac.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Player & Branch Breakdown */}
                        <td className="p-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-violet-50 text-violet-800 border border-violet-100 text-xs font-black">
                                <Users className="w-3.5 h-3.5 text-violet-600" />
                                <span>{ac.playersCount ?? 0} لاعب</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-800 border border-blue-100 text-xs font-black">
                                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>{ac.branchesCount ?? 0} صالة</span>
                              </span>
                            </div>

                            {/* Details of each branch and its player count */}
                            {Array.isArray(ac.branchesDetails) && ac.branchesDetails.length > 0 && (
                              <div className="flex flex-wrap gap-1 max-w-[280px]">
                                {ac.branchesDetails.map((b) => (
                                  <span
                                    key={b.id || b.name}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200/80"
                                    title={`صالة: ${b.name} (${b.playersCount} لاعب)`}
                                  >
                                    <span className="truncate max-w-[120px]">{b.name}:</span>
                                    <strong className="text-red-600 font-black">{b.playersCount} لاعب</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Subscription Status Badge */}
                        <td className="p-4">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-100 text-red-700 text-[11px] font-black border border-red-200">
                              <ShieldAlert className="w-3 h-3" />
                              <span>موقوفة</span>
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 text-[11px] font-black border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>منتهية</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 text-[11px] font-black border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>نشطة</span>
                            </span>
                          )}
                        </td>

                        {/* Expiration Date & Days remaining */}
                        <td className="p-4">
                          <span className="block text-xs font-black text-slate-900">{formattedExpires}</span>
                          <span
                            className={`block text-[10px] font-bold ${
                              ac.daysRemaining === null
                                ? "text-slate-400"
                                : ac.daysRemaining <= 0
                                ? "text-red-600"
                                : ac.daysRemaining <= 7
                                ? "text-amber-600"
                                : "text-slate-400"
                            }`}
                          >
                            {ac.daysRemaining !== null
                              ? ac.daysRemaining <= 0
                                ? "منتهي"
                                : `متبقي ${ac.daysRemaining} يوم`
                              : ""}
                          </span>
                        </td>

                        {/* Payment Status Toggle */}
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => onTogglePayment(ac)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-black cursor-pointer transition ${
                              ac.subscriptionPaid
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                            }`}
                            title="اضغط لتغيير حالة السداد"
                          >
                            {ac.subscriptionPaid ? "تم السداد ✓" : "غير مسدد ✗"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Inspect Details */}
                            <button
                              type="button"
                              onClick={() => onSelectAcademy(ac.id)}
                              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                              title="عرض التفاصيل الكاملة"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Extend */}
                            <button
                              type="button"
                              onClick={() => onOpenExtend(ac)}
                              className="px-2.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black transition cursor-pointer"
                              title="تمديد الاشتراك"
                            >
                              تمديد
                            </button>

                            {/* Suspend or Reactivate */}
                            {isSuspended ? (
                              <button
                                type="button"
                                onClick={() => onOpenReactivate(ac)}
                                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-black transition cursor-pointer"
                                title="إعادة تفعيل الأكاديمية"
                              >
                                تفعيل
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onOpenSuspend(ac)}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-black transition cursor-pointer"
                                title="إيقاف الأكاديمية مؤقتاً مع إرسال رسالة سبب التوقف"
                              >
                                إيقاف
                              </button>
                            )}

                            {/* Delete Permanently Button */}
                            {onOpenDelete && (
                              <button
                                type="button"
                                onClick={() => onOpenDelete(ac)}
                                className="p-2 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 transition cursor-pointer"
                                title="حذف الأكاديمية وجميع بياناتها نهائياً من قاعدة البيانات"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Mobile Cards (Touch-friendly for phones) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {academies.map((ac) => {
              const isSuspended = ac.subscriptionStatus === "suspended" || ac.status === "suspended";
              const isExpired = ac.subscriptionStatus === "expired";

              return (
                <div
                  key={ac.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-slate-800 to-slate-900 text-white font-black flex items-center justify-center text-sm shrink-0">
                        {ac.academyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-sm font-black text-slate-900 truncate">
                          {ac.academyName}
                        </strong>
                        <span className="block text-xs font-bold text-slate-400 truncate">
                          {ac.name} &bull; {ac.email}
                        </span>
                      </div>
                    </div>

                    {isSuspended ? (
                      <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 text-[10px] font-black shrink-0">
                        موقوفة
                      </span>
                    ) : isExpired ? (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-black shrink-0">
                        منتهية
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black shrink-0">
                        نشطة
                      </span>
                    )}
                  </div>

                  {/* Mobile Quick Stats Row */}
                  <div className="grid grid-cols-4 gap-1.5 py-2 border-y border-slate-100 text-center text-xs">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">اللاعبين</span>
                      <strong className="font-black text-violet-700">{ac.playersCount ?? 0}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">الصالات</span>
                      <strong className="font-black text-blue-700">{ac.branchesCount ?? 0}</strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">المتبقي</span>
                      <strong className="font-black text-slate-800">
                        {ac.daysRemaining !== null ? `${ac.daysRemaining} يوم` : "-"}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400">السداد</span>
                      <button
                        type="button"
                        onClick={() => onTogglePayment(ac)}
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                          ac.subscriptionPaid ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                        }`}
                      >
                        {ac.subscriptionPaid ? "مدفوع ✓" : "معلق ✗"}
                      </button>
                    </div>
                  </div>

                  {/* Mobile Branches Breakdown */}
                  {Array.isArray(ac.branchesDetails) && ac.branchesDetails.length > 0 && (
                    <div className="flex flex-wrap gap-1 py-1">
                      {ac.branchesDetails.map((b) => (
                        <span
                          key={b.id || b.name}
                          className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200"
                        >
                          {b.name}: <strong className="text-red-600 font-black">{b.playersCount} لاعب</strong>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Mobile Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onSelectAcademy(ac.id)}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black transition cursor-pointer"
                    >
                      التفاصيل
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenExtend(ac)}
                      className="flex-1 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-black transition cursor-pointer"
                    >
                      تمديد
                    </button>
                    {isSuspended ? (
                      <button
                        type="button"
                        onClick={() => onOpenReactivate(ac)}
                        className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black transition cursor-pointer"
                      >
                        تفعيل
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onOpenSuspend(ac)}
                        className="flex-1 py-2 rounded-xl bg-amber-50 text-amber-800 text-xs font-black transition cursor-pointer"
                      >
                        إيقاف
                      </button>
                    )}
                    {onOpenDelete && (
                      <button
                        type="button"
                        onClick={() => onOpenDelete(ac)}
                        className="p-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        title="حذف نهائي"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {pagination?.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => onPageChange(pagination.page - 1)}
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
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white disabled:opacity-40 text-xs font-black text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <span>التالي</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
