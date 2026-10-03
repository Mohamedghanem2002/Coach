"use client";
import React, { useState, useEffect, useMemo } from "react";
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
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  CreditCard,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Award,
} from "lucide-react";

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function CaptainDetailsModal({
  captainId,
  isOpen,
  onClose,
  refreshTrigger,
  onOpenSuspend,
  onOpenExtend,
  onOpenReactivate,
  onOpenDelete,
  onTogglePayment,
}) {
  const [data, setData] = useState(null);
  const [loadedCaptainId, setLoadedCaptainId] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "halls" | "events" | "audit"
  const [copiedKey, setCopiedKey] = useState(null);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [totalAmountInput, setTotalAmountInput] = useState("");
  const [paidAmountInput, setPaidAmountInput] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState(null);

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
          setLoadedCaptainId(captainId);
          setFetchError(null);
        }
      })
      .catch((err) => {
        console.error("Failed to load captain details:", err);
        if (!cancelled) {
          setFetchError(err.message || "فشل تحميل البيانات");
          setLoadedCaptainId(captainId);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, captainId, refreshTrigger]);

  const loading = !data || loadedCaptainId !== captainId;

  if (!isOpen) return null;

  const captain = data?.captain || data?.academy;
  const stats = data?.stats || {
    playersCount: 0,
    branchesCount: 0,
    hallsCount: 0,
    eventsCount: 0,
  };
  const players = data?.players || [];
  const halls = data?.halls || data?.branches || [];
  const events = data?.events || [];
  const auditLogs = data?.auditLogs || [];

  const handleCopy = (text, key) => {
    if (!text) return;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleSavePaymentAmounts = async () => {
    if (!captain) return;
    setSavingPayment(true);
    setPaymentNotice(null);
    try {
      const numTotal = Math.max(0, Number(totalAmountInput) || 0);
      const numPaid = Math.max(0, Number(paidAmountInput) || 0);

      const res = await fetch(`/api/admin/captains/${captain.id || captain._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_subscription_payment",
          totalAmount: numTotal,
          paidAmount: numPaid,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل حفظ المبالغ");

      // Update local state directly
      setData((prev) => {
        if (!prev) return prev;
        const remaining = Math.max(0, numTotal - numPaid);
        const isPaid = numTotal > 0 ? numPaid >= numTotal : prev.captain?.subscriptionPaid;
        const updatedCaptain = {
          ...prev.captain,
          subscriptionTotalAmount: numTotal,
          subscriptionPaidAmount: numPaid,
          subscriptionRemainingAmount: remaining,
          subscriptionPaid: isPaid,
          subscriptionPaymentStatus: numTotal > 0 ? (numPaid >= numTotal ? "paid" : (numPaid > 0 ? "partial" : "unpaid")) : (isPaid ? "paid" : "unpaid"),
        };
        return {
          ...prev,
          captain: updatedCaptain,
          academy: updatedCaptain,
        };
      });

      setPaymentNotice({
        type: "success",
        message: result.message || "تم تحديث رسوم الاشتراك والمدفوعات بنجاح! ✨",
      });
      setIsEditingPayment(false);
      setTimeout(() => setPaymentNotice(null), 4000);
    } catch (err) {
      setPaymentNotice({
        type: "error",
        message: err.message || "تعذر حفظ المبالغ",
      });
    } finally {
      setSavingPayment(false);
    }
  };

  const isSuspended =
    captain?.subscriptionStatus === "suspended" || captain?.status === "suspended";
  const isExpired = captain?.subscriptionStatus === "expired";
  const cleanPhone = (captain?.phone || "").replace(/\D/g, "");
  const waPhone = cleanPhone.startsWith("0") ? `2${cleanPhone}` : cleanPhone;

  const formattedCreated = captain?.createdAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(captain.createdAt))
    : "غير محدد";

  const formattedStarted = captain?.subscriptionStartedAt || captain?.createdAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(captain.subscriptionStartedAt || captain.createdAt))
    : "غير محدد";

  const formattedExpires = captain?.subscriptionExpiresAt
    ? new Intl.DateTimeFormat("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(captain.subscriptionExpiresAt))
    : "غير محدد";

  const isLifetime = captain?.subscriptionPlan === "lifetime" || captain?.isLifetime;

  const modalTabs = [
    { id: "overview", label: "نظرة عامة والاشتراك", icon: Sparkles },
    {
      id: "halls",
      label: "صالات التدريب",
      count: stats.branchesCount || stats.hallsCount || halls.length,
      icon: Building2,
    },
    {
      id: "events",
      label: "الفعاليات والبطولات",
      count: stats.eventsCount ?? events.length,
      icon: Trophy,
    },
    {
      id: "audit",
      label: "سجل العمليات",
      count: auditLogs.length,
      icon: History,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 md:p-6 bg-slate-950/65 backdrop-blur-xs animate-backdrop"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl h-[92vh] max-h-[92vh] sm:h-[86vh] sm:max-h-[820px] flex flex-col rounded-t-[28px] sm:rounded-3xl border border-slate-200/90 bg-slate-50 shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300" />
        </div>

        {/* ── 1. App-Style Profile Header ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 bg-white shrink-0 shadow-2xs">
          {loading ? (
            <div className="flex items-center gap-3 w-full animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-slate-200 shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-slate-200 rounded-md" />
                <div className="h-3 w-28 bg-slate-100 rounded-md" />
              </div>
              <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md font-black text-lg shrink-0">
                  {(captain?.name || "ك").charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 truncate">
                      {captain ? captain.name : "ملف الكابتن"}
                    </h2>
                    {captain?.isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 text-[11px] font-black border border-purple-200 shrink-0">
                        <Award className="w-3 h-3 text-purple-600" />
                        <span>مدير المنصة 🛡️</span>
                      </span>
                    )}
                    {isSuspended ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-black border border-rose-200 shrink-0">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>موقوف ⛔</span>
                      </span>
                    ) : isExpired ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[11px] font-black border border-amber-200 shrink-0">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>منتهي الصلاحية ⏳</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-black border border-emerald-200 shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span>نشط 🟢</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="font-bold text-red-600 inline-flex items-center gap-1 truncate">
                      🥋 {captain?.academyName || "أكاديمية تدريب"}
                    </span>
                    {captain?.phone && (
                      <span className="font-mono text-slate-600 font-semibold hidden sm:inline" dir="ltr">
                        {captain.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Contact & Close Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {captain?.phone && (
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-200/80">
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200/60 shadow-2xs transition-all cursor-pointer"
                      title="اتصال هاتفي بالكابتن"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/${waPhone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border border-slate-200/60 shadow-2xs transition-all cursor-pointer"
                      title="مراسلة واتساب مباشرة"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </>
          )}
        </div>

        {/* ── 2. Modern Segmented Tabs Bar ── */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200 bg-white/80 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {modalTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 py-1.5 px-3.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      active ? "text-red-400" : "text-slate-400"
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. Body Content (Scrollable) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <div className="w-9 h-9 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-black text-slate-600">
                جارٍ جلب وتنسيق بيانات الكابتن والأكاديمية...
              </span>
              <span className="text-[11px] text-slate-400 mt-1 font-medium">
                استرجاع اللاعبين، الصالات، والاشتراك
              </span>
            </div>
          ) : !captain ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 p-8">
              <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <h3 className="text-sm font-black text-slate-700">
                تعذر العثور على بيانات هذا الكابتن
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                قد يكون تم حذف الحساب أو المعرف غير صالح
              </p>
            </div>
          ) : activeTab === "overview" ? (
            /* ═════════════════════════════════════════════════════════════
                TAB 1: EXECUTIVE OVERVIEW & SUBSCRIPTION
            ═════════════════════════════════════════════════════════════ */
            <div className="space-y-4">
              {/* 4 Clean Metric Glance Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3.5 rounded-2xl border border-violet-100 bg-white shadow-2xs">
                  <div className="flex items-center justify-between text-violet-700 mb-1">
                    <span className="text-xs font-black">👥 إجمالي الأبطال</span>
                    <Users className="w-4 h-4" />
                  </div>
                  <strong className="text-2xl font-black text-violet-950">
                    {stats.playersCount}
                  </strong>
                  <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                    لاعب مسجل
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-blue-100 bg-white shadow-2xs">
                  <div className="flex items-center justify-between text-blue-700 mb-1">
                    <span className="text-xs font-black">🏟️ صالات التدريب</span>
                    <Building2 className="w-4 h-4" />
                  </div>
                  <strong className="text-2xl font-black text-blue-950">
                    {stats.branchesCount || stats.hallsCount}
                  </strong>
                  <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                    مقر تدريب
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-amber-100 bg-white shadow-2xs">
                  <div className="flex items-center justify-between text-amber-700 mb-1">
                    <span className="text-xs font-black">🏆 الفعاليات</span>
                    <Trophy className="w-4 h-4" />
                  </div>
                  <strong className="text-2xl font-black text-amber-950">
                    {stats.eventsCount}
                  </strong>
                  <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                    بطولة ونشاط
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="text-xs font-black">⏰ الأيام المتبقية</span>
                    <Clock className="w-4 h-4" />
                  </div>
                  <strong
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
                    {captain.daysRemaining !== null
                      ? `${captain.daysRemaining} يوم`
                      : "غير محدد"}
                  </strong>
                  <span className="block text-[10px] text-slate-400 font-bold mt-0.5">
                    حتى التجديد
                  </span>
                </div>
              </div>

              {/* Suspended Alert Banner */}
              {isSuspended && captain.suspensionReason && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/90 text-rose-900 shadow-2xs space-y-1">
                  <div className="flex items-center gap-2 text-rose-700 font-black text-xs">
                    <AlertTriangle className="w-4 h-4" />
                    <span>سبب تعليق حساب الكابتن:</span>
                  </div>
                  <p className="pr-6 text-xs text-rose-800 font-semibold leading-relaxed">
                    {captain.suspensionReason}
                  </p>
                </div>
              )}

              {/* Subscription & Service Card */}
              <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        صلاحية اشتراك المنصة
                      </h3>
                      <span className="text-[11px] text-slate-400 font-bold">
                        الخطة الحالية:{" "}
                        <span className={`uppercase font-black ${isLifetime ? "text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md" : "text-slate-800"}`}>
                          {isLifetime ? "اشتراك مدى الحياة ♾️" : captain.subscriptionPlan || "Standard"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* 1-Tap Payment Toggle */}
                  {captain.isAdmin ? (
                    <span className="px-3 py-1.5 rounded-full text-xs font-black bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1.5 shadow-2xs">
                      <Award className="w-3.5 h-3.5 text-purple-600" />
                      <span>حساب إداري دائم</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onTogglePayment && onTogglePayment(captain)}
                      className={`px-3 py-1.5 rounded-full text-xs font-black cursor-pointer transition flex items-center gap-1.5 shadow-2xs ${
                        captain.subscriptionPaid
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100"
                      }`}
                      title="انقر لتعديل حالة السداد"
                    >
                      {captain.subscriptionPaid ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>الاشتراك: مسدد ✓</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          <span>الاشتراك: غير مسدد ✗</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">تاريخ البداية (الدخول):</span>
                    <strong className="text-slate-900 font-black">
                      {formattedStarted}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">تاريخ الانتهاء:</span>
                    <strong className={`font-black ${isLifetime ? "text-purple-700 font-bold" : "text-slate-900"}`}>
                      {captain.isAdmin ? "غير محدد (دائم)" : isLifetime ? "مفتوح دائم (مدى الحياة ♾️)" : formattedExpires}
                    </strong>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">الأيام المتبقية:</span>
                    <span
                      className={`font-mono font-black ${
                        captain.isAdmin || isLifetime || captain.daysRemaining === null
                          ? "text-purple-700"
                          : captain.daysRemaining <= 0
                          ? "text-rose-600"
                          : captain.daysRemaining <= 7
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {captain.isAdmin
                        ? "دائم ♾️"
                        : isLifetime
                        ? "مدى الحياة ♾️"
                        : captain.daysRemaining !== null
                        ? captain.daysRemaining <= 0
                          ? "انتهت الصلاحية"
                          : `${captain.daysRemaining} يوم`
                        : "غير محدد"}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">حالة الخدمة:</span>
                    <span
                      className={`font-black ${
                        captain.isAdmin || isLifetime
                          ? "text-purple-600"
                          : isSuspended
                          ? "text-rose-600"
                          : isExpired
                          ? "text-amber-600"
                          : "text-emerald-600"
                      }`}
                    >
                      {captain.isAdmin
                        ? "مدير المنصة"
                        : isLifetime
                        ? "اشتراك مدى الحياة نشط ♾️"
                        : isSuspended
                        ? "الخدمة معلقة مؤقتاً"
                        : isExpired
                        ? "منتهي الصلاحية"
                        : "الخدمة سارية ونشطة"}
                    </span>
                  </div>
                </div>

                {/* ━━━ Subscription Financial Details (المطلوب / المدفوع / المتبقي) ━━━ */}
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                          الرسوم المالية للاشتراك
                        </h4>
                        <span className="text-[10px] font-bold text-slate-400">
                          المطلوب من الكابتن، ما تم دفعه، والمتبقي عليه
                        </span>
                      </div>
                    </div>

                    {!captain.isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          if (!isEditingPayment) {
                            setTotalAmountInput(captain.subscriptionTotalAmount !== undefined && captain.subscriptionTotalAmount !== null ? String(captain.subscriptionTotalAmount) : "");
                            setPaidAmountInput(captain.subscriptionPaidAmount !== undefined && captain.subscriptionPaidAmount !== null ? String(captain.subscriptionPaidAmount) : "");
                          }
                          setIsEditingPayment((prev) => !prev);
                          setPaymentNotice(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-2xs cursor-pointer active:scale-95"
                      >
                        {isEditingPayment ? "إلغاء التعديل ✕" : "تعديل المبالغ ✏️"}
                      </button>
                    )}
                  </div>

                  {/* Financial 3-Card Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                    {/* 1. المطلوب */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        المبلغ المطلوب
                      </span>
                      <strong className="text-sm sm:text-base font-black text-slate-900 font-mono">
                        {captain.subscriptionTotalAmount !== undefined && captain.subscriptionTotalAmount !== null
                          ? `${captain.subscriptionTotalAmount} ج.م`
                          : "0 ج.م"}
                      </strong>
                    </div>

                    {/* 2. المدفوع */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        المدفوع الفعلي
                      </span>
                      <strong className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                        {captain.subscriptionPaidAmount !== undefined && captain.subscriptionPaidAmount !== null
                          ? `${captain.subscriptionPaidAmount} ج.م`
                          : "0 ج.م"}
                      </strong>
                    </div>

                    {/* 3. المتبقي */}
                    <div
                      className={`p-2.5 rounded-xl border shadow-2xs ${
                        (captain.subscriptionRemainingAmount || 0) > 0
                          ? "bg-rose-50/90 border-rose-200 text-rose-900"
                          : "bg-emerald-50/90 border-emerald-200 text-emerald-900"
                      }`}
                    >
                      <span className="block text-[10px] font-bold text-slate-400 mb-0.5">
                        المتبقي عليه
                      </span>
                      <strong className="text-sm sm:text-base font-black font-mono">
                        {(captain.subscriptionRemainingAmount || 0) > 0
                          ? `${captain.subscriptionRemainingAmount} ج.م ⚠️`
                          : "0 ج.م (خالص ✓)"}
                      </strong>
                    </div>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditingPayment && (
                    <div className="mt-2 p-3 sm:p-3.5 rounded-xl bg-white border-2 border-red-500/30 space-y-3 animate-slide-up shadow-sm">
                      <div className="text-xs font-black text-slate-800 flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span>تعديل رسوم الاشتراك للـكابتن {captain.name}:</span>
                        <span className="text-[11px] text-slate-400 font-bold">
                          يُحسب المتبقي تلقائياً
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                            المبلغ المطلوب (ج.م) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={totalAmountInput}
                            onChange={(e) => setTotalAmountInput(e.target.value)}
                            placeholder="مثال: 500"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs sm:text-sm font-bold font-mono outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-extrabold text-slate-700 mb-1">
                            المبلغ المدفوع (ج.م) <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={paidAmountInput}
                            onChange={(e) => setPaidAmountInput(e.target.value)}
                            placeholder="مثال: 300"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs sm:text-sm font-bold font-mono outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                          />
                        </div>
                      </div>

                      {/* Live Calculation Preview & Shortcuts */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-bold">المتبقي المحسوب:</span>
                          <span
                            className={`font-mono font-black px-2 py-0.5 rounded-lg ${
                              Math.max(0, (Number(totalAmountInput) || 0) - (Number(paidAmountInput) || 0)) > 0
                                ? "bg-rose-100 text-rose-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {Math.max(0, (Number(totalAmountInput) || 0) - (Number(paidAmountInput) || 0))} ج.م
                          </span>
                        </div>

                        {/* Quick Action Shortcuts */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPaidAmountInput(totalAmountInput || "0")}
                            className="text-[10px] font-bold px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 cursor-pointer"
                          >
                            سداد كامل ✓
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaidAmountInput("0")}
                            className="text-[10px] font-bold px-2 py-1 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                          >
                            تصفير 0
                          </button>
                        </div>
                      </div>

                      {/* Save & Cancel Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSavePaymentAmounts}
                          disabled={savingPayment}
                          className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition cursor-pointer shadow-xs disabled:opacity-60 flex items-center justify-center gap-1.5"
                        >
                          {savingPayment ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              <span>جاري الحفظ...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>حفظ المبالغ</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingPayment(false)}
                          className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Feedback Notice */}
                  {paymentNotice && (
                    <div
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-slide-up ${
                        paymentNotice.type === "success"
                          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                          : "bg-rose-50 border border-rose-200 text-rose-800"
                      }`}
                    >
                      {paymentNotice.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{paymentNotice.message}</span>
                    </div>
                  )}
                </div>

                {/* Primary Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {!captain.isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onOpenExtend && onOpenExtend(captain)}
                        className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs transition cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>تمديد صلاحية الاشتراك</span>
                      </button>

                      {isSuspended ? (
                        <button
                          type="button"
                          onClick={() => onOpenReactivate && onOpenReactivate(captain)}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition cursor-pointer"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>إعادة تفعيل الحساب</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenSuspend && onOpenSuspend(captain)}
                          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>تعليق الحساب مؤقتاً</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="w-full p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-center text-xs font-black text-purple-700">
                      🛡️ حساب إداري مصرح ومحمي من تعديل حالة الاشتراك أو التعليق
                    </div>
                  )}
                </div>
              </div>

              {/* Coach Profile & Account Info Grid */}
              <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-2xs space-y-3">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>بيانات الكابتن ومعلومات الاتصال</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Captain Name */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">اسم الكابتن:</span>
                    <strong className="text-slate-900 font-black text-sm">
                      {captain.name}
                    </strong>
                  </div>

                  {/* Academy Name */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">الأكاديمية:</span>
                    <strong className="text-red-600 font-black text-sm">
                      🥋 {captain.academyName}
                    </strong>
                  </div>

                  {/* Phone with quick call / WA / copy */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">الهاتف:</span>
                    {captain.phone ? (
                      <div className="flex items-center gap-2">
                        <strong
                          className="text-slate-900 font-mono font-black"
                          dir="ltr"
                        >
                          {captain.phone}
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleCopy(captain.phone, "phone")}
                          className="text-slate-400 hover:text-slate-800 p-1"
                          title="نسخ رقم الهاتف"
                        >
                          {copiedKey === "phone" ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400">غير مسجل</span>
                    )}
                  </div>

                  {/* Email with quick copy */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">البريد الإلكتروني:</span>
                    <div className="flex items-center gap-1.5 max-w-[65%]">
                      <strong
                        className="text-slate-700 font-mono text-[11px] truncate"
                        dir="ltr"
                        title={captain.email}
                      >
                        {captain.email}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(captain.email, "email")}
                        className="text-slate-400 hover:text-slate-800 p-1 shrink-0"
                        title="نسخ البريد"
                      >
                        {copiedKey === "email" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Join Date */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">تاريخ الانضمام:</span>
                    <strong className="text-slate-800 font-bold">
                      {formattedCreated}
                    </strong>
                  </div>

                  {/* Account ID */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-500 font-bold">معرف الحساب:</span>
                    <div className="flex items-center gap-1.5">
                      <strong className="text-slate-500 font-mono text-[10px]" dir="ltr">
                        {captain.id || captain._id}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(captain.id || captain._id, "id")}
                        className="text-slate-400 hover:text-slate-800 p-1 shrink-0"
                        title="نسخ المعرف"
                      >
                        {copiedKey === "id" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Delete Permanently */}
              {!captain.isAdmin && onOpenDelete && (
                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>حذف الحساب نهائياً من قاعدة البيانات</span>
                    </h4>
                    <p className="text-[11px] text-rose-700/90 font-medium mt-0.5">
                      سيؤدي هذا الإجراء لمسح الكابتن وجميع لاعبيه (
                      {stats.playersCount} لاعب) وصالاته نهائياً.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenDelete(captain);
                    }}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition cursor-pointer shrink-0 shadow-2xs"
                  >
                    حذف الحساب نهائياً
                  </button>
                </div>
              )}
            </div>

          ) : activeTab === "halls" ? (
            /* ═════════════════════════════════════════════════════════════
                TAB 3: HALLS SUMMARY (counts only)
            ═════════════════════════════════════════════════════════════ */
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
          ) : activeTab === "events" ? (
            /* ═════════════════════════════════════════════════════════════
                TAB 4: EVENTS SUMMARY (counts only)
            ═════════════════════════════════════════════════════════════ */
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
          ) : (
            /* ═════════════════════════════════════════════════════════════
                TAB 5: AUDIT LOG (سجل العمليات الإدارية)
            ═════════════════════════════════════════════════════════════ */
            <div className="space-y-2.5">
              {auditLogs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 text-slate-400 text-xs font-bold space-y-1">
                  <History className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="text-slate-700 font-black">
                    لا توجد سجلات لعمليات إدارية سابقة لهذا الحساب
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    يتم تسجيل عمليات التعليق، التمديد، والسداد تلقائياً.
                  </p>
                </div>
              ) : (
                auditLogs.map((log) => {
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
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
