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
  ShieldAlert,
  Search,
  CheckCircle,
  AlertTriangle,
  History,
  Sparkles,
  Trophy,
  Trash2,
  DollarSign,
  IdCard,
} from "lucide-react";

export default function CaptainDetailsModal({
  captainId,
  isOpen,
  onClose,
  onOpenSuspend,
  onOpenExtend,
  onOpenReactivate,
  onOpenDelete,
  onTogglePayment,
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playerSearch, setPlayerSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "players" | "halls" | "events" | "audit"

  useEffect(() => {
    if (!isOpen || !captainId) return;
    let cancelled = false;

    fetch(`/api/admin/captains/${captainId}`)
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
        console.error("Failed to load captain details:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, captainId]);

  if (!isOpen) return null;

  const captain = data?.captain || data?.academy;
  const stats = data?.stats || { playersCount: 0, branchesCount: 0, hallsCount: 0, eventsCount: 0 };
  const players = data?.players || [];
  const halls = data?.halls || data?.branches || [];
  const events = data?.events || [];
  const auditLogs = data?.auditLogs || [];

  const filteredPlayers = players.filter((p) => {
    if (!playerSearch) return true;
    const q = playerSearch.toLowerCase();
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.branch || "").toLowerCase().includes(q) ||
      (p.belt || "").toLowerCase().includes(q) ||
      (p.phone || "").toLowerCase().includes(q)
    );
  });

  const isSuspended = captain?.subscriptionStatus === "suspended" || captain?.status === "suspended";
  const isExpired = captain?.subscriptionStatus === "expired";

  const formattedCreated = captain?.createdAt
    ? new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(captain.createdAt)
      )
    : "غير محدد";

  const formattedExpires = captain?.subscriptionExpiresAt
    ? new Intl.DateTimeFormat("ar-EG", { year: "numeric", month: "long", day: "numeric" }).format(
        new Date(captain.subscriptionExpiresAt)
      )
    : "غير محدد";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-xs animate-backdrop"
      dir="rtl"
    >
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 truncate max-w-xs sm:max-w-md">
                  {captain ? captain.name : "تفاصيل الكابتن"}
                </h2>
                {isSuspended ? (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black border border-red-200">
                    موقوف
                  </span>
                ) : isExpired ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black border border-amber-200">
                    منتهي
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black border border-emerald-200">
                    نشط
                  </span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-400 truncate">
                {captain?.academyName || "أكاديمية تدريب"} &bull; معرف:{" "}
                <span className="font-mono text-slate-500" dir="ltr">{captain?.id || captainId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 bg-white shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: "overview", label: "نظرة عامة والاشتراك", icon: Sparkles },
            { id: "players", label: `قائمة اللاعبين (${stats.playersCount})`, icon: Users },
            { id: "halls", label: `صالات التدريب (${stats.branchesCount || stats.hallsCount})`, icon: Building2 },
            { id: "events", label: `الفعاليات والبطولات (${stats.eventsCount})`, icon: Trophy },
            { id: "audit", label: `سجل العمليات (${auditLogs.length})`, icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3.5 text-xs font-black border-b-2 whitespace-nowrap transition cursor-pointer ${
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
              <span className="text-xs font-bold">جارٍ استرداد بيانات وسجلات الكابتن من قاعدة البيانات...</span>
            </div>
          ) : !captain ? (
            <div className="text-center py-16 text-slate-500 text-sm font-bold">
              تعذر العثور على بيانات هذا الكابتن
            </div>
          ) : activeTab === "overview" ? (
            <>
              {/* 3 Main Highlights Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl border border-violet-100 bg-violet-50/60 text-center shadow-xs">
                  <span className="block text-[11px] font-black text-violet-600 mb-1">👥 إجمالي اللاعبين</span>
                  <span className="text-2xl font-black text-violet-900">{stats.playersCount}</span>
                </div>
                <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/60 text-center shadow-xs">
                  <span className="block text-[11px] font-black text-blue-600 mb-1">🏟️ صالات التدريب</span>
                  <span className="text-2xl font-black text-blue-900">{stats.branchesCount || stats.hallsCount}</span>
                </div>
                <div className="p-4 rounded-2xl border border-amber-100 bg-amber-50/60 text-center shadow-xs">
                  <span className="block text-[11px] font-black text-amber-600 mb-1">🏆 الفعاليات المنشأة</span>
                  <span className="text-2xl font-black text-amber-900">{stats.eventsCount}</span>
                </div>
                <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/60 text-center shadow-xs">
                  <span className="block text-[11px] font-black text-slate-500 mb-1">⏰ الأيام المتبقية</span>
                  <span
                    className={`text-2xl font-black ${
                      captain.daysRemaining === null
                        ? "text-slate-400"
                        : captain.daysRemaining <= 0
                        ? "text-red-600"
                        : captain.daysRemaining <= 7
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {captain.daysRemaining !== null ? captain.daysRemaining : "-"}
                  </span>
                </div>
              </div>

              {/* Status & Subscription Control Center */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-black text-slate-800">حالة الحساب وصلاحية الاشتراك</h3>
                    <p className="text-xs font-bold text-slate-400">
                      إدارة تفعيل وتعليق الخدمة والتحكم في فترات الصلاحية
                    </p>
                  </div>

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

                {isSuspended && captain.suspensionReason && (
                  <div className="mb-4 p-4 rounded-2xl border border-red-200 bg-red-50/80 text-xs text-red-900 font-bold space-y-1">
                    <div className="flex items-center gap-1.5 text-red-700 font-black">
                      <AlertTriangle className="w-4 h-4" />
                      <span>سبب التعليق المكتوب للكابتن:</span>
                    </div>
                    <p className="pr-5 text-sm">{captain.suspensionReason}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-bold mb-5">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">خطة الاشتراك:</span>
                    <span className="text-slate-900 font-black uppercase">{captain.subscriptionPlan || "Standard"}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">تاريخ انتهاء الاشتراك:</span>
                    <span className="text-slate-900 font-black">{formattedExpires}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">حالة السداد المالي:</span>
                    <button
                      type="button"
                      onClick={() => onTogglePayment && onTogglePayment(captain)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-black cursor-pointer transition ${
                        captain.subscriptionPaid
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-red-100 text-red-800 hover:bg-red-200"
                      }`}
                    >
                      {captain.subscriptionPaid ? "مدفوع ✓ (اضغط للتغيير)" : "غير مدفوع ✗ (اضغط للتغيير)"}
                    </button>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500">تاريخ انضمام الحساب:</span>
                    <span className="text-slate-900 font-black">{formattedCreated}</span>
                  </div>
                </div>

                {/* Primary Admin Actions */}
                <div className="flex flex-wrap gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenExtend && onOpenExtend(captain)}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>تمديد الاشتراك</span>
                  </button>

                  {isSuspended ? (
                    <button
                      type="button"
                      onClick={() => onOpenReactivate && onOpenReactivate(captain)}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>إعادة تفعيل الحساب</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenSuspend && onOpenSuspend(captain)}
                      className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-black transition cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>تعليق الحساب مؤقتاً</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Captain Profile & Contact Card */}
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                <h3 className="text-sm font-black text-slate-800 mb-3">بيانات الكابتن والأكاديمية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">اسم الكابتن</span>
                      <strong className="text-slate-800 font-black">{captain.name}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">اسم الأكاديمية</span>
                      <strong className="text-slate-800 font-black">{captain.academyName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">البريد الإلكتروني</span>
                      <strong className="text-slate-800 font-mono" dir="ltr">{captain.email}</strong>
                    </div>
                  </div>

                  {captain.phone && (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div>
                        <span className="block text-[10px] text-slate-400 font-bold">رقم الهاتف</span>
                        <strong className="text-slate-800 font-mono" dir="ltr">{captain.phone}</strong>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <IdCard className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">معرف الحساب (ID)</span>
                      <strong className="text-slate-800 font-mono text-[11px]" dir="ltr">{captain.id}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-400 font-bold">تاريخ الانضمام الفعلي</span>
                      <strong className="text-slate-800 font-black">{formattedCreated}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Delete Entire Account Permanently */}
              {onOpenDelete && (
                <div className="p-4 sm:p-5 rounded-3xl border-2 border-red-200 bg-red-50/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <h4 className="text-xs sm:text-sm font-black text-red-800">
                        حذف الحساب نهائياً من قاعدة البيانات
                      </h4>
                    </div>
                    <p className="text-[11px] text-red-700/80 font-medium leading-relaxed">
                      سيؤدي هذا الإجراء إلى مسح حساب الكابتن وجميع لاعبيه ({stats.playersCount}) وصالاته ({stats.branchesCount || stats.hallsCount}) وفعالياته ({stats.eventsCount}) نهائياً دون رجعة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDelete(captain);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف الحساب بجميع بياناته 🗑️</span>
                  </button>
                </div>
              )}
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
                    placeholder="ابحث في لاعبي هذا الكابتن بالاسم أو الصالة أو الحزام..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 pr-10 pl-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white"
                  />
                </div>
                <span className="text-xs font-black text-slate-500 shrink-0">
                  {filteredPlayers.length} لاعب مسجل
                </span>
              </div>

              {filteredPlayers.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 text-xs font-bold">
                  {players.length === 0 ? "لا يوجد لاعبين مسجلين لدى هذا الكابتن حتى الآن" : "لا يوجد لاعبين يطابقون عبارة البحث"}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                      <tr>
                        <th className="p-3">اسم البطل</th>
                        <th className="p-3">صالة التدريب</th>
                        <th className="p-3">الحزام</th>
                        <th className="p-3">العمر</th>
                        <th className="p-3">الهاتف</th>
                        <th className="p-3">تاريخ التسجيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
                      {filteredPlayers.map((player) => (
                        <tr key={player.id || player._id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-black text-slate-900 flex items-center gap-1.5">
                            <span>🥋</span>
                            <span>{player.name}</span>
                          </td>
                          <td className="p-3 text-slate-600">{player.branch || "الرئيسية"}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black">
                              {player.belt || "أبيض"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-600">{player.age ? `${player.age} سنة` : "-"}</td>
                          <td className="p-3 font-mono text-slate-500" dir="ltr">
                            {player.phone || "-"}
                          </td>
                          <td className="p-3 text-slate-400 text-[11px]">
                            {player.createdAt ? new Date(player.createdAt).toLocaleDateString("ar-EG") : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : activeTab === "halls" ? (
            /* Halls List Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    صالات وفروع التدريب المسجلة ({halls.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    عرض كافة صالات التدريب التابعة لهذا الكابتن وأعداد اللاعبين في كل صالة
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                  إجمالي الصالات: {halls.length}
                </span>
              </div>

              {halls.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 text-xs font-bold">
                  لم يقم الكابتن بإضافة صالات تدريب منفصلة حتى الآن.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {halls.map((hall, index) => {
                    const hallPlayers = players.filter((p) => (p.branch || "الرئيسية") === hall.name);
                    const count = hall.playersCount ?? hallPlayers.length;

                    return (
                      <div
                        key={hall._id || hall.id || index}
                        className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-black">
                                <Building2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900">{hall.name}</h4>
                                <span className="text-[11px] text-slate-400 font-bold">
                                  {hall.createdAt
                                    ? `تاريخ الإضافة: ${new Date(hall.createdAt).toLocaleDateString("ar-EG")}`
                                    : "صالة نشطة"}
                                </span>
                              </div>
                            </div>

                            <span className="px-3 py-1 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-xs font-black shadow-xs shrink-0">
                              {count} {count === 1 ? "لاعب" : count === 2 ? "لاعبان" : "لاعبين"}
                            </span>
                          </div>

                          {/* Hall Schedule / Days */}
                          {hall.days && hall.days.length > 0 && (
                            <div className="mb-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-bold text-slate-600 flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>أيام التدريب:</span>
                              <span className="text-slate-800">
                                {Array.isArray(hall.days) ? hall.days.join("، ") : hall.days}
                              </span>
                            </div>
                          )}

                          {/* Registered Players in this hall */}
                          <div>
                            <span className="block text-[11px] font-black text-slate-400 mb-2">
                              أبطال هذه الصالة ({hallPlayers.length}):
                            </span>
                            {hallPlayers.length === 0 ? (
                              <p className="text-[11px] text-slate-400 font-medium italic">
                                لا يوجد لاعبين مسجلين في هذه الصالة حالياً.
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                                {hallPlayers.map((hp) => (
                                  <span
                                    key={hp.id || hp._id}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-black"
                                  >
                                    <span>🥋 {hp.name}</span>
                                    {hp.belt && (
                                      <span className="text-[9px] text-slate-500 font-bold">({hp.belt})</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : activeTab === "events" ? (
            /* Events List Tab */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    الفعاليات والبطولات المنشأة ({events.length})
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    عرض جميع الفعاليات المنشأة بواسطة هذا الكابتن وتفاصيل المشاركين
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black">
                  إجمالي الفعاليات: {events.length}
                </span>
              </div>

              {events.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 text-xs font-bold">
                  لم يقم الكابتن بإنشاء فعاليات أو بطولات حتى الآن.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {events.map((evt, idx) => (
                    <div
                      key={evt.id || evt._id || idx}
                      className="p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black">
                              <Trophy className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900">{evt.title}</h4>
                              <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3 h-3" />
                                <span>{evt.date || "بدون تاريخ محدد"}</span>
                              </span>
                            </div>
                          </div>

                          <span className="px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-black shrink-0">
                            {evt.participantsCount ?? 0} مشارك
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold">
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] text-slate-400">رسوم الاشتراك</span>
                            <span className="text-slate-800 font-black">{evt.fee ?? 0} جنيه</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                            <span className="block text-[10px] text-slate-400">تاريخ الإنشاء</span>
                            <span className="text-slate-800 font-black">
                              {evt.createdAt ? new Date(evt.createdAt).toLocaleDateString("ar-EG") : "-"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Audit Log History Tab */
            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs font-bold">
                  لا توجد عمليات سابقة مسجلة لهذا الكابتن
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log._id || log.id}
                    className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex items-start justify-between gap-3 text-xs"
                  >
                    <div>
                      <strong className="block font-black text-slate-800 mb-0.5">
                        {log.action === "suspend_academy"
                          ? "🚫 تعليق حساب الكابتن"
                          : log.action === "reactivate_academy"
                          ? "✓ إعادة تفعيل الحساب"
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
