"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  Calendar,
  Users,
  Clock,
  ShieldCheck,
  ShieldAlert,
  CreditCard,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export default function AcademyDetailsModal({
  academyId,
  isOpen,
  onClose,
  onOpenSuspend,
  onOpenExtend,
  onOpenReactivate,
  onTogglePayment,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerSearch, setPlayerSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "players" | "audit"

  useEffect(() => {
    if (!isOpen || !academyId) {
      return;
    }
    let cancelled = false;

    fetch(`/api/admin/academies/${academyId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load details");
        return res.json();
      })
      .then((resData) => {
        if (!cancelled && resData.success) {
          setData(resData);
        }
      })
      .catch((err) => {
        console.error("Failed to load academy details:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, academyId]);

  if (!isOpen) return null;

  const academy = data?.academy;
  const stats = data?.stats || { playersCount: 0, branchesCount: 0, eventsCount: 0 };
  const players = data?.players || [];
  const branches = data?.branches || [];
  const auditLogs = data?.auditLogs || [];

  const filteredPlayers = players.filter((p) => {
    if (!playerSearch) return true;
    const q = playerSearch.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.branch || "").toLowerCase().includes(q) ||
      (p.belt || "").toLowerCase().includes(q)
    );
  });

  const isSuspended = academy?.subscriptionStatus === "suspended" || academy?.status === "suspended";
  const isExpired = academy?.subscriptionStatus === "expired";

  const formattedCreated = academy?.createdAt
    ? new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(academy.createdAt)
      )
    : "غير محدد";

  const formattedExpires = academy?.subscriptionExpiresAt
    ? new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(academy.subscriptionExpiresAt)
      )
    : "غير محدد";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-backdrop" dir="rtl">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-red-600 to-rose-700 flex items-center justify-center text-white shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                {academy ? academy.academyName : "تفاصيل الأكاديمية"}
              </h2>
              <p className="text-xs font-bold text-slate-400">
                مالك الحساب: {academy?.name || "كابتن الأكاديمية"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 bg-white shrink-0">
          {[
            { id: "overview", label: "نظرة عامة والاشتراك", icon: Sparkles },
            { id: "players", label: `قائمة اللاعبين (${stats.playersCount})`, icon: Users },
            { id: "audit", label: `سجل العمليات (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-black border-b-2 transition cursor-pointer ${
                  active
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body content (scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-bold">جارٍ تحميل بيانات الأكاديمية...</span>
            </div>
          ) : !academy ? (
            <div className="text-center py-16 text-slate-500 text-sm font-bold">
              تعذر العثور على بيانات الأكاديمية
            </div>
          ) : activeTab === "overview" ? (
            <>
              {/* Top stats pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">إجمالي اللاعبين</span>
                  <span className="text-2xl font-black text-slate-900">{stats.playersCount}</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">الصالات / الفروع</span>
                  <span className="text-2xl font-black text-slate-900">{stats.branchesCount}</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">الفعاليات المنشأة</span>
                  <span className="text-2xl font-black text-slate-900">{stats.eventsCount}</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-center">
                  <span className="block text-[11px] font-bold text-slate-400 mb-1">الأيام المتبقية</span>
                  <span
                    className={`text-2xl font-black ${
                      academy.daysRemaining === null
                        ? "text-slate-400"
                        : academy.daysRemaining <= 0
                        ? "text-red-600"
                        : academy.daysRemaining <= 7
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {academy.daysRemaining !== null ? academy.daysRemaining : "-"}
                  </span>
                </div>
              </div>

              {/* Status & Subscription Control Center */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">حالة الاشتراك وصلاحية الخدمة</h3>
                    <p className="text-xs font-bold text-slate-400">
                      إدارة تفعيل وتعليق الخدمة والتحكم في فترات الصلاحية
                    </p>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isSuspended ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-black border border-red-200">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>معلق وموقوف</span>
                      </span>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-black border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>منتهي الصلاحية</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black border border-emerald-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>نشط ويعمل</span>
                      </span>
                    )}
                  </div>
                </div>

                {isSuspended && academy.suspensionReason && (
                  <div className="mb-4 p-3.5 rounded-2xl border border-red-200 bg-red-50/70 text-xs text-red-900 font-bold">
                    <strong>سبب التعليق:</strong> {academy.suspensionReason}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold mb-5">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">خطة الاشتراك:</span>
                    <span className="text-slate-900 font-black uppercase">{academy.subscriptionPlan || "Standard"}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">تاريخ انتهاء الاشتراك:</span>
                    <span className="text-slate-900 font-black">{formattedExpires}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">حالة السداد المالي:</span>
                    <button
                      type="button"
                      onClick={() => onTogglePayment(academy)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black cursor-pointer transition ${
                        academy.subscriptionPaid
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {academy.subscriptionPaid ? "مدفوع ✓ (اضغط للتغيير)" : "غير مدفوع ✗ (اضغط للتغيير)"}
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">تاريخ تسجيل الأكاديمية:</span>
                    <span className="text-slate-900 font-black">{formattedCreated}</span>
                  </div>
                </div>

                {/* Primary Admin Action Buttons */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenExtend(academy)}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>تمديد الاشتراك</span>
                  </button>

                  {isSuspended ? (
                    <button
                      type="button"
                      onClick={() => onOpenReactivate(academy)}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>إعادة تفعيل الخدمة</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenSuspend(academy)}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-black transition cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>تعليق الأكاديمية مؤقتاً</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Owner Contact Information */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <h3 className="text-sm font-black text-slate-800 mb-3">بيانات التواصل مع المالك</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">اسم المالك</span>
                      <strong className="text-slate-800 font-black">{academy.name}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">البريد الإلكتروني</span>
                      <strong className="text-slate-800 font-mono" dir="ltr">{academy.email}</strong>
                    </div>
                  </div>

                  {academy.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">رقم الهاتف</span>
                        <strong className="text-slate-800 font-mono" dir="ltr">{academy.phone}</strong>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">الصالات المسجلة</span>
                      <strong className="text-slate-800 font-black">
                        {branches.map((b) => b.name).join("، ") || "الصالات الافتراضية"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === "players" ? (
            /* Players List Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="ابحث في لاعبي هذه الأكاديمية..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white"
                  />
                </div>
                <span className="text-xs font-black text-slate-500 shrink-0">
                  {filteredPlayers.length} لاعب
                </span>
              </div>

              {filteredPlayers.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  لا يوجد لاعبين مسجلين يطابقون البحث
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                      <tr>
                        <th className="p-3">اسم البطل</th>
                        <th className="p-3">الصالة</th>
                        <th className="p-3">الحزام</th>
                        <th className="p-3">العمر</th>
                        <th className="p-3">الهاتف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                      {filteredPlayers.map((player) => (
                        <tr key={player.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-black text-slate-900">{player.name}</td>
                          <td className="p-3 text-slate-600">{player.branch || "الرئيسية"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px]">
                              {player.belt || "أبيض"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{player.age ? `${player.age} سنة` : "-"}</td>
                          <td className="p-3 font-mono text-slate-500" dir="ltr">
                            {player.phone || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            /* Audit Log History Tab */
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  لا توجد عمليات سابقة مسجلة لهذه الأكاديمية
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log._id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="block font-black text-slate-800 mb-0.5">
                        {log.action === "suspend_academy"
                          ? "🚫 تعليق خدمة الأكاديمية"
                          : log.action === "reactivate_academy"
                          ? "✓ إعادة تفعيل الأكاديمية"
                          : log.action === "extend_subscription"
                          ? "⏰ تمديد الاشتراك"
                          : log.action === "mark_subscription_paid"
                          ? "💳 تسجيل سداد الاشتراك"
                          : log.action === "mark_subscription_unpaid"
                          ? "⚠️ إلغاء سداد الاشتراك"
                          : log.action}
                      </strong>
                      <span className="text-[11px] text-slate-500 font-medium">
                        بواسطة: {log.adminEmail}
                        {log.details?.reason ? ` • السبب: ${log.details.reason}` : ""}
                        {log.details?.daysAdded ? ` • المدة: +${log.details.daysAdded} يوم` : ""}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
