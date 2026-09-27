"use client";
import React from "react";
import {
  Building2,
  Users,
  ShieldAlert,
  Clock,
  CreditCard,
  Calendar,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronLeft,
} from "lucide-react";

export default function AdminOverviewTab({
  stats,
  recentAcademies = [],
  recentAuditLogs = [],
  onSelectAcademy,
  onNavigateToAcademies,
}) {
  const statCards = [
    {
      title: "إجمالي الأكاديميات",
      value: stats?.totalAcademies ?? 0,
      icon: Building2,
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200/80",
      description: "المسجلة على المنصة",
    },
    {
      title: "أكاديميات نشطة",
      value: stats?.activeAcademies ?? 0,
      icon: CheckCircle2,
      color: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200/80",
      description: "اشتراك سارٍ وتعمل",
    },
    {
      title: "أكاديميات موقوفة",
      value: stats?.suspendedAcademies ?? 0,
      icon: ShieldAlert,
      color: "from-red-600 to-rose-600",
      textColor: "text-red-600",
      bgColor: "bg-red-50 border-red-200/80",
      description: "معلقة بقرار الإدارة",
    },
    {
      title: "اشتراكات منتهية",
      value: stats?.expiredAcademies ?? 0,
      icon: Clock,
      color: "from-amber-600 to-orange-600",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200/80",
      description: "تحتاج للتجديد",
    },
    {
      title: "إجمالي اللاعبين",
      value: stats?.totalPlayers ?? 0,
      icon: Users,
      color: "from-violet-600 to-purple-600",
      textColor: "text-violet-600",
      bgColor: "bg-violet-50 border-violet-200/80",
      description: "عبر كافة الأكاديميات",
    },
    {
      title: "معلقة الدفع",
      value: stats?.pendingPaymentAcademies ?? 0,
      icon: CreditCard,
      color: "from-rose-600 to-pink-600",
      textColor: "text-rose-600",
      bgColor: "bg-rose-50 border-rose-200/80",
      description: "بانتظار سداد الرسوم",
    },
    {
      title: "إجمالي الصالات",
      value: stats?.totalBranches ?? 0,
      icon: Building2,
      color: "from-cyan-600 to-blue-600",
      textColor: "text-cyan-600",
      bgColor: "bg-cyan-50 border-cyan-200/80",
      description: "الفروع والدوجو",
    },
    {
      title: "إجمالي الفعاليات",
      value: stats?.totalEvents ?? 0,
      icon: Calendar,
      color: "from-fuchsia-600 to-pink-600",
      textColor: "text-fuchsia-600",
      bgColor: "bg-fuchsia-50 border-fuchsia-200/80",
      description: "بطولات ورحلات",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in" dir="rtl">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة التحكم الرئيسية للمنصة</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              مرحباً بك في مركز إدارة أكاديميات المنصة 👑
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-bold mt-1 max-w-xl">
              إحصائيات فورية حية من قاعدة البيانات، مراقبة جميع الأكاديميات، حساب أعداد اللاعبين بدقة، وإدارة الاشتراكات والتعليق الفوري.
            </p>
          </div>

          <button
            onClick={onNavigateToAcademies}
            className="self-start sm:self-auto flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-red-600/30 transition cursor-pointer active:scale-95"
          >
            <span>إدارة جميع الأكاديميات</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <div
                  className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${item.bgColor} ${item.textColor}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 transition">
                  {item.description}
                </span>
              </div>

              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {item.value.toLocaleString("ar-EG")}
              </div>
              <div className="text-xs font-bold text-slate-500 mt-1">
                {item.title}
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Recent Academies & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Academies (8 cols on desktop) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    أحدث الأكاديميات المسجلة
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400">
                    آخر الحسابات المنضمة للمنصة
                  </p>
                </div>
              </div>

              <button
                onClick={onNavigateToAcademies}
                className="text-xs font-black text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                عرض الكل ({stats?.totalAcademies ?? 0})
              </button>
            </div>

            {recentAcademies.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                لا توجد أكاديميات مسجلة حتى الآن
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAcademies.map((ac) => (
                  <div
                    key={ac.id}
                    onClick={() => onSelectAcademy(ac.id)}
                    className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-red-50/50 hover:border-red-200 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shrink-0 shadow-2xs group-hover:border-red-300">
                        {ac.academyName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <strong className="block text-xs sm:text-sm font-black text-slate-900 truncate">
                          {ac.academyName}
                        </strong>
                        <span className="block text-[11px] font-bold text-slate-400 truncate">
                          المالك: {ac.name} &bull; {ac.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left hidden sm:block">
                        <span className="block text-xs font-black text-slate-800">
                          {ac.playersCount} لاعب
                        </span>
                        <span className="block text-[10px] font-bold text-slate-400">
                          {ac.branchesCount} صالات
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                          ac.subscriptionStatus === "suspended"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : ac.subscriptionStatus === "expired"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {ac.subscriptionStatus === "suspended"
                          ? "موقوفة"
                          : ac.subscriptionStatus === "expired"
                          ? "منتهية"
                          : "نشطة"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity / Audit Log (5 cols on desktop) */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    نشاط الإدارة وسجل العمليات
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400">
                    سجل فوري لجميع الإجراءات الإدارية
                  </p>
                </div>
              </div>
            </div>

            {recentAuditLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                لا توجد عمليات إدارية مسجلة بعد
              </div>
            ) : (
              <div className="space-y-3">
                {recentAuditLogs.slice(0, 6).map((log) => {
                  let badgeColor = "bg-slate-100 text-slate-700";
                  let actionText = log.action;
                  if (log.action === "suspend_academy") {
                    badgeColor = "bg-red-100 text-red-700 border border-red-200";
                    actionText = "تعليق أكاديمية";
                  } else if (log.action === "reactivate_academy") {
                    badgeColor = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                    actionText = "إعادة تفعيل";
                  } else if (log.action === "extend_subscription") {
                    badgeColor = "bg-indigo-100 text-indigo-700 border border-indigo-200";
                    actionText = "تمديد اشتراك";
                  } else if (log.action === "register_academy") {
                    badgeColor = "bg-blue-100 text-blue-700 border border-blue-200";
                    actionText = "تسجيل أكاديمية";
                  } else if (log.action === "mark_subscription_paid") {
                    badgeColor = "bg-emerald-100 text-emerald-800";
                    actionText = "سداد اشتراك";
                  }

                  return (
                    <div
                      key={log._id}
                      className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start justify-between gap-2.5 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${badgeColor}`}>
                            {actionText}
                          </span>
                          <strong className="text-slate-800 font-black truncate max-w-[130px]">
                            {log.targetAcademyName}
                          </strong>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 truncate">
                          بواسطة: {log.adminEmail}
                        </p>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(log.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
