"use client";
import React from "react";
import {
  Building2,
  Users,
  ShieldAlert,
  Clock,
  CreditCard,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Activity,
  ChevronLeft,
  Trophy,
  UserCheck,
  TrendingUp,
  PieChart,
  ShieldCheck,
  User,
} from "lucide-react";

export default function AdminOverviewTab({
  stats,
  analytics,
  recentAccounts = [],
  recentAuditLogs = [],
  onSelectAccount,
  onNavigateToTab,
}) {
  const statCards = [
    {
      title: "إجمالي الحسابات",
      value: stats?.totalAccounts ?? stats?.totalAcademies ?? 0,
      icon: Users,
      color: "from-blue-600 to-indigo-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200/80",
      description: "المسجلة في المنصة بالكامل",
      tab: "accounts",
    },
    {
      title: "حسابات نشطة",
      value: stats?.activeAccounts ?? stats?.activeAcademies ?? 0,
      icon: CheckCircle2,
      color: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200/80",
      description: "سارية الصلاحية وتعمل",
      tab: "accounts",
    },
    {
      title: "حسابات جديدة (30 يوم)",
      value: stats?.newAccounts30d ?? 0,
      icon: UserCheck,
      color: "from-indigo-600 to-violet-600",
      textColor: "text-indigo-600",
      bgColor: "bg-indigo-50 border-indigo-200/80",
      description: `منهم ${stats?.newAccounts7d ?? 0} بآخر أسبوع`,
      tab: "accounts",
    },
    {
      title: "إجمالي اللاعبين",
      value: stats?.totalPlayers ?? 0,
      icon: Users,
      color: "from-violet-600 to-purple-600",
      textColor: "text-violet-600",
      bgColor: "bg-violet-50 border-violet-200/80",
      description: "إجمالي أبطال الأكاديميات (إحصائي)",
      tab: null,
    },
    {
      title: "إجمالي الصالات والملاعب",
      value: stats?.totalHalls ?? stats?.totalBranches ?? 0,
      icon: Building2,
      color: "from-cyan-600 to-blue-600",
      textColor: "text-cyan-600",
      bgColor: "bg-cyan-50 border-cyan-200/80",
      description: "صالات ومقرات تدريب",
      tab: "halls",
    },
    {
      title: "إجمالي الفعاليات",
      value: stats?.totalEvents ?? 0,
      icon: Trophy,
      color: "from-amber-600 to-orange-600",
      textColor: "text-amber-600",
      bgColor: "bg-amber-50 border-amber-200/80",
      description: "بطولات ورحلات منظمة",
      tab: "events",
    },
    {
      title: "فعاليات قادمة ⏱️",
      value: stats?.upcomingEvents ?? 0,
      icon: Clock,
      color: "from-blue-600 to-cyan-600",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50 border-blue-200/80",
      description: "مواعيدها سارية للمستقبل",
      tab: "events",
    },
    {
      title: "فعاليات منتهية ✓",
      value: stats?.completedEvents ?? 0,
      icon: CheckCircle2,
      color: "from-emerald-600 to-teal-600",
      textColor: "text-emerald-600",
      bgColor: "bg-emerald-50 border-emerald-200/80",
      description: "فعاليات وبطولات مكتملة",
      tab: "events",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in" dir="rtl">
      {/* 1. Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl shadow-slate-950/10">
        <div className="absolute top-0 -left-10 w-72 h-72 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>لوحة التحكم الرئيسية للمنصة</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
              مركز إدارة المنصة وبيانات النظام الفورية 👑
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-bold mt-1 max-w-xl">
              إحصائيات متزامنة حية من قاعدة البيانات الحالية، تغطي كافة الحسابات واللاعبين والصالات والفعاليات وسجلات العمليات بدقة متناهية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onNavigateToTab && onNavigateToTab("accounts")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg shadow-red-600/30 transition cursor-pointer active:scale-95"
            >
              <span>إدارة الحسابات</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateToTab && onNavigateToTab("halls")}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs border border-slate-700 transition cursor-pointer"
            >
              <span>الصالات والمقرات</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real Database Top Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              onClick={() => item.tab && onNavigateToTab && onNavigateToTab(item.tab)}
              className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer"
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
              <div className="text-xs font-bold text-slate-500 mt-1 flex items-center justify-between">
                <span>{item.title}</span>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Real Database Analytics & Distribution Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* User Growth Card */}
        <div className="p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span>نمو الحسابات (User Growth)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="block text-[10px] font-bold text-slate-500">آخر 7 أيام</span>
              <strong className="text-base font-black text-blue-900">
                {analytics?.usersGrowth?.last7Days ?? stats?.newAccounts7d ?? 0}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="block text-[10px] font-bold text-slate-500">آخر 30 يوماً</span>
              <strong className="text-base font-black text-blue-900">
                {analytics?.usersGrowth?.last30Days ?? stats?.newAccounts30d ?? 0}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-500">الإجمالي</span>
              <strong className="text-base font-black text-slate-800">
                {stats?.totalAccounts ?? stats?.totalAcademies ?? 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Players Growth Card */}
        <div className="p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
            <Users className="w-4 h-4 text-violet-600" />
            <span>تسجيل اللاعبين (Players Growth)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-violet-50/60 border border-violet-100">
              <span className="block text-[10px] font-bold text-slate-500">آخر 7 أيام</span>
              <strong className="text-base font-black text-violet-900">
                {analytics?.playersGrowth?.last7Days ?? 0}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-violet-50/60 border border-violet-100">
              <span className="block text-[10px] font-bold text-slate-500">آخر 30 يوماً</span>
              <strong className="text-base font-black text-violet-900">
                {analytics?.playersGrowth?.last30Days ?? 0}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="block text-[10px] font-bold text-slate-500">إجمالي الأبطال</span>
              <strong className="text-base font-black text-slate-800">
                {stats?.totalPlayers ?? 0}
              </strong>
            </div>
          </div>
        </div>

        {/* Accounts Distribution Card */}
        <div className="p-5 rounded-3xl border border-slate-200/90 bg-white shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-black text-xs">
            <PieChart className="w-4 h-4 text-emerald-600" />
            <span>توزيع الحسابات (Accounts Distribution)</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
              <span className="block text-[10px] font-bold text-slate-500">بها لاعبون</span>
              <strong className="text-base font-black text-emerald-900">
                {stats?.accountsWithPlayers ?? 0}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-blue-50/60 border border-blue-100">
              <span className="block text-[10px] font-bold text-slate-500">بها صالات</span>
              <strong className="text-base font-black text-blue-900">
                {stats?.accountsWithHalls ?? 0}
              </strong>
            </div>

            <div className="p-2.5 rounded-2xl bg-amber-50/60 border border-amber-100">
              <span className="block text-[10px] font-bold text-slate-500">بها فعاليات</span>
              <strong className="text-base font-black text-amber-900">
                {stats?.accountsWithEvents ?? 0}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Two Column Layout: Recent Accounts & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Accounts (7 cols on desktop) */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    أحدث الحسابات المسجلة بالنظام (Recently Joined)
                  </h2>
                  <p className="text-[11px] font-bold text-slate-400">
                    كافة الحسابات بالمنصة مرتبة من الأحدث إلى الأقدم
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigateToTab && onNavigateToTab("accounts")}
                className="text-xs font-black text-red-600 hover:text-red-700 hover:underline cursor-pointer"
              >
                عرض كل الحسابات ({stats?.totalAccounts ?? stats?.totalAcademies ?? 0})
              </button>
            </div>

            {recentAccounts.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs font-bold">
                لا توجد حسابات مسجلة حتى الآن
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentAccounts.map((ac) => (
                  <div
                    key={ac.id || ac._id}
                    onClick={() => onSelectAccount && onSelectAccount(ac.id || ac._id)}
                    className="group flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-red-50/50 hover:border-red-200 transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-black text-xs shrink-0 shadow-2xs group-hover:border-red-300">
                        {(ac.name || ac.academyName || "U").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <strong className="block text-xs sm:text-sm font-black text-slate-900 truncate">
                            {ac.name}
                          </strong>
                          {ac.isAdmin && (
                            <span className="rounded-md bg-amber-100 px-1 py-0.2 text-[9px] font-black text-amber-800 border border-amber-200">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] font-bold text-slate-400 truncate">
                          {ac.academyName} &bull; {ac.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-left hidden sm:block text-xs font-bold">
                        <span className="block text-slate-800 font-black">
                          {ac.playersCount ?? 0} لاعب
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {ac.branchesCount ?? ac.hallsCount ?? 0} صالات &bull; {ac.eventsCount ?? 0} فعاليات
                        </span>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                          ac.subscriptionStatus === "suspended"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : ac.subscriptionPlan === "lifetime" || ac.isLifetime
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : ac.subscriptionStatus === "expired"
                            ? "bg-amber-100 text-amber-800 border-amber-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {ac.subscriptionStatus === "suspended"
                          ? "موقوف"
                          : ac.subscriptionPlan === "lifetime" || ac.isLifetime
                          ? "مدى الحياة ♾️"
                          : ac.subscriptionStatus === "expired"
                          ? "منتهي"
                          : "نشط"}
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

              <button
                onClick={() => onNavigateToTab && onNavigateToTab("audit")}
                className="text-xs font-black text-indigo-600 hover:underline cursor-pointer"
              >
                عرض السجل الكامل
              </button>
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
                  if (log.action === "suspend_academy" || log.action === "suspend_captain") {
                    badgeColor = "bg-red-100 text-red-700 border border-red-200";
                    actionText = "تعليق حساب";
                  } else if (log.action === "reactivate_academy" || log.action === "reactivate_captain") {
                    badgeColor = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                    actionText = "إعادة تفعيل";
                  } else if (log.action === "extend_subscription") {
                    badgeColor = "bg-indigo-100 text-indigo-700 border border-indigo-200";
                    actionText = "تمديد اشتراك";
                  } else if (log.action === "register_academy" || log.action === "register_captain") {
                    badgeColor = "bg-blue-100 text-blue-700 border border-blue-200";
                    actionText = "تسجيل حساب";
                  } else if (log.action === "mark_subscription_paid") {
                    badgeColor = "bg-emerald-100 text-emerald-800 border border-emerald-200";
                    actionText = "سداد اشتراك";
                  } else if (log.action === "mark_subscription_unpaid") {
                    badgeColor = "bg-amber-100 text-amber-800 border border-amber-200";
                    actionText = "إلغاء سداد";
                  } else if (log.action === "delete_captain_permanent" || log.action === "delete_academy_permanent") {
                    badgeColor = "bg-rose-100 text-rose-800 border border-rose-200";
                    actionText = "حذف نهائي 🗑️";
                  } else if (log.action === "update_plan") {
                    badgeColor = "bg-purple-100 text-purple-800 border border-purple-200";
                    actionText = "تعديل خطة";
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
