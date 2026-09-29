"use client";
import { memo, useEffect, useRef, useState, useMemo } from "react";
import {
  Users,
  CheckCircle2,
  XCircle,
  CreditCard,
  Clock,
  Building2,
  TrendingUp,
  CalendarDays,
  ShoppingBag,
  BarChart3,
  Compass,
  Cake,
  ArrowUpRight,
  ChevronLeft,
  Sparkles,
  PieChart,
  FileText,
} from "lucide-react";
import {
  localDate,
  getPaymentDetailsFor,
  isPlayerPresentOnDate,
  isPlayerAbsentOnDate,
} from "../../lib/dashboard-utils";

/* ── Animated counter hook ─────────────────────────────────────────────── */
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(typeof target === "number" ? target : 0);

  useEffect(() => {
    if (typeof target !== "number") return undefined;
    let animId;
    const start = Date.now();
    const startVal = 0;

    function tick() {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(startVal + (target - startVal) * ease));
      if (progress < 1) {
        animId = requestAnimationFrame(tick);
      }
    }

    animId = requestAnimationFrame(tick);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, duration]);

  return value;
}

/* ── Primary KPI Card ──────────────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  unit,
  subtext,
  icon: Icon,
  color,
  badgeText,
  onClick,
}) {
  const animatedValue = useCountUp(typeof value === "number" ? value : 0);

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-4 shadow-2xs transition-all duration-200 ${
        onClick ? "cursor-pointer active:scale-98 hover:shadow-md" : ""
      } bg-white border-slate-200/90`}
    >
      {/* Top row: Icon + Badge */}
      <div className="flex items-center justify-between gap-2">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-xs shrink-0"
          style={{ background: color }}
        >
          <Icon className="h-5 w-5" />
        </div>
        {badgeText && (
          <span
            className="text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0"
            style={{
              color,
              background: `${color}12`,
              borderColor: `${color}30`,
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* Main value */}
      <div className="mt-3">
        <span className="block text-[11px] font-bold text-slate-500 mb-0.5">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <strong className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-cairo">
            {typeof value === "number"
              ? animatedValue.toLocaleString("ar-EG")
              : value}
          </strong>
          {unit && (
            <span className="text-xs font-bold text-slate-400">{unit}</span>
          )}
        </div>
      </div>

      {/* Footer / Subtext */}
      {subtext && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-500">
          <span className="truncate">{subtext}</span>
          {onClick && (
            <ArrowUpRight className="h-3 w-3 text-slate-300 group-hover:text-slate-600 transition" />
          )}
        </div>
      )}
    </div>
  );
}

/* ── Main Stats & Analytics Component ─────────────────────────────────── */
function StatsGrid({
  players = [],
  branches = [],
  branch = "كل الصالات",
  sessionDate,
  paymentMonth,
  paymentMonthLabel,
  events = [],
  todayBirthdays = [],
  onSelectBranch,
  onFilterStatus,
  onOpenEvents,
  onOpenBirthdays,
  onOpenAttendanceReport,
}) {
  // Segmented Tab: "all" | "finances" | "attendance"
  const [activeTab, setActiveTab] = useState("all");

  const today = localDate();

  // Players filtered by branch
  const dashboardPlayers = useMemo(() => {
    if (!branch || branch === "كل الصالات") return players;
    return players.filter((p) => p.branch === branch);
  }, [players, branch]);

  // Payment Calculations
  const paymentDetailsList = useMemo(() => {
    return dashboardPlayers.map((p) => getPaymentDetailsFor(p, paymentMonth));
  }, [dashboardPlayers, paymentMonth]);

  const paidCount = paymentDetailsList.filter((p) => p.status === "paid").length;
  const partialCount = paymentDetailsList.filter((p) => p.status === "partially_paid").length;
  const unpaidCount = paymentDetailsList.filter((p) => p.status === "unpaid").length;
  const totalRemaining = paymentDetailsList.reduce((sum, p) => sum + (p.remainingAmount || 0), 0);
  const pendingPlayersCount = unpaidCount + partialCount;
  const monthlyCollected = paymentDetailsList.reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  const collectionRate = dashboardPlayers.length
    ? Math.round((paidCount / dashboardPlayers.length) * 100)
    : 0;

  // Purchases / Equipment Calculations
  const allPurchases = useMemo(() => {
    return dashboardPlayers.flatMap((p) => (Array.isArray(p.purchases) ? p.purchases : []));
  }, [dashboardPlayers]);

  const totalPurchasesAmount = allPurchases.reduce((sum, item) => sum + (Number(item.totalAmount) || 0), 0);
  const totalPurchasesPaid = allPurchases.reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);
  const totalPurchasesRemaining = Math.max(0, totalPurchasesAmount - totalPurchasesPaid);
  const totalUndeliveredPurchases = allPurchases.filter(
    (item) => item.deliveryStatus !== "received"
  ).length;

  // Today Attendance
  const presentToday = dashboardPlayers.filter((p) =>
    isPlayerPresentOnDate(p, sessionDate)
  ).length;

  const absentToday = dashboardPlayers.filter((p) =>
    isPlayerAbsentOnDate(p, branches, sessionDate)
  ).length;
  const attendanceTotal = presentToday + absentToday;
  const attendanceRate = attendanceTotal ? Math.round((presentToday / attendanceTotal) * 100) : 0;

  // 7-day Attendance Trend
  const attendanceDays = useMemo(() => {
    const baseDate = sessionDate ? new Date(`${sessionDate}T12:00:00`) : new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(baseDate);
      date.setDate(date.getDate() - (6 - index));
      const day = localDate(date);
      const present = dashboardPlayers.filter((player) =>
        isPlayerPresentOnDate(player, day)
      ).length;
      const absent = dashboardPlayers.filter((player) =>
        isPlayerAbsentOnDate(player, branches, day)
      ).length;
      return {
        date: day,
        isToday: day === sessionDate,
        label: new Intl.DateTimeFormat("ar-EG", { weekday: "short" }).format(date),
        present,
        absent,
      };
    });
  }, [sessionDate, dashboardPlayers, branches]);

  const maxBarVal = Math.max(...attendanceDays.map((d) => Math.max(d.present, d.absent)), 1);

  // Next upcoming event (if any)
  const nextEvent = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0) return null;
    const sorted = [...events]
      .filter((e) => e.date && e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date));
    return sorted[0] || null;
  }, [events, today]);

  return (
    <div className="w-full space-y-4 sm:space-y-6" dir="rtl">
      
      {/* ━━━ 1. App-Style Navigation & Filter Header ━━━ */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs font-bold">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cairo text-base sm:text-lg font-black text-slate-900 leading-tight">
                  مركز المؤشرات والتحليل المالي
                </h2>
                <span className="rounded-full bg-red-50 text-red-700 border border-red-200/80 px-2 py-0.2 text-[10px] font-black">
                  مباشر ⚡
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                حصة {sessionDate} • اشتراك {paymentMonthLabel}
              </p>
            </div>
          </div>

          {/* Quick Branch Context Badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">الصالة:</span>
            <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black text-slate-800">
              {branch === "كل الصالات" ? "جميع الصالات" : branch}
            </span>
          </div>
        </div>

        {/* Branch Selector Pills (Scrollable) */}
        {branches.length > 1 && onSelectBranch && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => onSelectBranch("كل الصالات")}
              className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                branch === "كل الصالات"
                  ? "bg-red-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              كل الصالات ({players.length})
            </button>
            {branches.map((b) => {
              const bCount = players.filter((p) => p.branch === b.name).length;
              const isSelected = branch === b.name;
              return (
                <button
                  key={b._id || b.name}
                  type="button"
                  onClick={() => onSelectBranch(b.name)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {b.name} ({bCount})
                </button>
              );
            })}
          </div>
        )}

        {/* ━━━ Native App Segmented Control ━━━ */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`py-2 px-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer truncate ${
              activeTab === "all"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            نظرة شاملة 📊
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("finances")}
            className={`py-2 px-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer truncate ${
              activeTab === "finances"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            المالية والاشتراكات 💰
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attendance")}
            className={`py-2 px-2 text-center rounded-lg text-xs font-black transition-all cursor-pointer truncate ${
              activeTab === "attendance"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            الحضور والغياب 🥋
          </button>
        </div>
      </div>

      {/* ━━━ 2. Top 4 Core KPIs (Unique, Non-Repetitive) ━━━ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {/* KPI 1: Attendance Today */}
        <KpiCard
          label="حضور الحصة اليوم"
          value={attendanceRate}
          unit="%"
          subtext={`${presentToday} حاضر من إجمالي ${attendanceTotal || dashboardPlayers.length}`}
          icon={CheckCircle2}
          color="#059669"
          badgeText={attendanceRate >= 70 ? "ممتاز" : "متوسط"}
          onClick={() => setActiveTab("attendance")}
        />

        {/* KPI 2: Total Active Champions */}
        <KpiCard
          label="الأبطال المقيدون"
          value={dashboardPlayers.length}
          unit="بطل"
          subtext={branch === "كل الصالات" ? `${branches.length} صالات تابعة` : `صالة ${branch}`}
          icon={Users}
          color="#dc2626"
          badgeText="نشط"
        />

        {/* KPI 3: Monthly Subscriptions Cash */}
        <KpiCard
          label={`اشتراكات شهر ${paymentMonthLabel}`}
          value={monthlyCollected}
          unit="ج.م"
          subtext={`${paidCount} مسدد • ${totalRemaining ? `${totalRemaining.toLocaleString("ar-EG")} ج.م متبقي` : "مكتمل ✨"}`}
          icon={CreditCard}
          color="#0284c7"
          badgeText={`نسبة ${collectionRate}%`}
          onClick={() => onFilterStatus?.(pendingPlayersCount > 0 ? "unpaid" : "all")}
        />

        {/* KPI 4: Equipment & Uniforms Sales */}
        <KpiCard
          label="مبيعات الأدوات والبدل"
          value={totalPurchasesPaid}
          unit="ج.م"
          subtext={
            totalPurchasesRemaining > 0
              ? `متبقي ${totalPurchasesRemaining.toLocaleString("ar-EG")} ج.م ديون`
              : "لا توجد متأخرات أدوات"
          }
          icon={ShoppingBag}
          color="#d97706"
          badgeText={`${allPurchases.length} مبيعة`}
          onClick={() => setActiveTab("finances")}
        />
      </div>

      {/* ━━━ 3. Financial & Revenue Cards ━━━ */}
      {(activeTab === "all" || activeTab === "finances") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-fade-in">
          
          {/* Card A: Subscriptions Financial Health */}
          <div className="rounded-2xl border border-sky-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-cairo text-xs sm:text-sm font-black text-slate-900">
                      اشتراكات شهر {paymentMonthLabel}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      متابعة السداد الشهري للاعبين
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-sky-50 border border-sky-200 px-2 py-0.5 text-[10px] font-black text-sky-700">
                  تحصيل {collectionRate}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 mb-1.5">
                  <span>نسبة استيفاء الاشتراكات</span>
                  <span className="text-sky-600">{paidCount} من {dashboardPlayers.length} مسدد</span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-700"
                    style={{ width: `${collectionRate}%` }}
                  />
                </div>
              </div>

              {/* 3 Metric Columns */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3 border border-slate-100 text-center">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    المحصل نقداً
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-emerald-600 font-cairo">
                    {monthlyCollected.toLocaleString("ar-EG")}
                    <span className="text-[9px] font-normal text-slate-400 mr-0.5">ج.م</span>
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    المتأخرات
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-rose-600 font-cairo">
                    {totalRemaining.toLocaleString("ar-EG")}
                    <span className="text-[9px] font-normal text-slate-400 mr-0.5">ج.م</span>
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    غير مسددين
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-amber-600 font-cairo">
                    {pendingPlayersCount}
                    <span className="text-[9px] font-normal text-slate-400 mr-0.5">لاعب</span>
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick Action */}
            {pendingPlayersCount > 0 && onFilterStatus && (
              <button
                type="button"
                onClick={() => onFilterStatus("unpaid")}
                className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 text-xs font-black transition active-press cursor-pointer"
              >
                <span>تصفية المتأخرين عن سداد الشهر ({pendingPlayersCount})</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Card B: Equipment & Store Sales */}
          <div className="rounded-2xl border border-amber-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-white shadow-xs">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-cairo text-xs sm:text-sm font-black text-slate-900">
                      مبيعات البدل والمستلزمات الرياضية
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400">
                      سجل الأدوات والمعدات المستقل
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {totalUndeliveredPurchases > 0 && (
                    <span className="rounded-full bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-black text-amber-900 flex items-center gap-1">
                      <span>⏳</span>
                      <span>{totalUndeliveredPurchases} بانتظار التسليم</span>
                    </span>
                  )}
                  <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-black text-amber-800">
                    {allPurchases.length} عملية شراء
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3.5">
                <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-600 mb-1.5">
                  <span>نسبة تحصيل المبيعات</span>
                  <span className="text-amber-700">
                    {totalPurchasesAmount ? Math.round((totalPurchasesPaid / totalPurchasesAmount) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-700"
                    style={{
                      width: `${totalPurchasesAmount ? Math.round((totalPurchasesPaid / totalPurchasesAmount) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* 3 Metric Columns */}
              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50/80 p-3 border border-slate-100 text-center">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    إجمالي المبيعات
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-slate-900 font-cairo">
                    {totalPurchasesAmount.toLocaleString("ar-EG")}
                    <span className="text-[9px] font-normal text-slate-400 mr-0.5">ج.م</span>
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    المحصل نقداً
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-emerald-600 font-cairo">
                    {totalPurchasesPaid.toLocaleString("ar-EG")}
                    <span className="text-[9px] font-normal text-slate-400 mr-0.5">ج.م</span>
                  </strong>
                </div>

                <div>
                  <span className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    الباقي ديون
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-rose-600 font-cairo">
                    {totalPurchasesRemaining.toLocaleString("ar-EG")}
                    <span className="text-[9px] font-normal text-slate-400 mr-0.5">ج.م</span>
                  </strong>
                </div>
              </div>
            </div>

            {(totalPurchasesRemaining > 0 || totalUndeliveredPurchases > 0) && onFilterStatus && (
              <button
                type="button"
                onClick={() => onFilterStatus("purchases_debt")}
                className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-black transition active-press cursor-pointer"
              >
                <span>عرض مستحقات وتسليمات الأدوات</span>
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ━━━ 4. Attendance Trends & Session Ring ━━━ */}
      {(activeTab === "all" || activeTab === "attendance") && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-3.5 animate-fade-in">
          
          {/* Weekly Bar Chart */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <h3 className="font-cairo text-xs sm:text-sm font-black text-slate-900">
                  انضباط الحضور خلال آخر 7 أيام
                </h3>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> حاضر
                </span>
                <span className="flex items-center gap-1 text-rose-600">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> غائب
                </span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 items-end gap-1.5 sm:gap-2.5">
              {attendanceDays.map((day) => {
                const presentH = (day.present / maxBarVal) * 100;
                const absentH = (day.absent / maxBarVal) * 100;
                return (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center rounded-xl p-1.5 transition-all ${
                      day.isToday ? "bg-red-50/80 ring-1 ring-red-200" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="mb-1.5 flex items-center justify-center gap-0.5 text-[10px] font-black">
                      <span className="text-emerald-600">{day.present}</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-rose-600">{day.absent}</span>
                    </div>

                    <div className="flex h-24 sm:h-28 w-full items-end justify-center gap-1 rounded-lg border-b border-slate-100 bg-slate-50/70 px-1 pb-1">
                      <div className="flex h-full w-3 sm:w-3.5 flex-col justify-end">
                        <div
                          className="w-full rounded-t-md bg-emerald-500 transition-all duration-500"
                          style={{ height: `${Math.max(presentH, day.present ? 10 : 0)}%` }}
                        />
                      </div>
                      <div className="flex h-full w-3 sm:w-3.5 flex-col justify-end">
                        <div
                          className="w-full rounded-t-md bg-rose-500 transition-all duration-500"
                          style={{ height: `${Math.max(absentH, day.absent ? 10 : 0)}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`mt-1.5 text-[10px] font-bold ${
                        day.isToday ? "text-red-600 font-black" : "text-slate-500"
                      }`}
                    >
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Attendance Gauge & Action */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-emerald-600" />
                <h3 className="font-cairo text-xs sm:text-sm font-black text-slate-900">
                  مؤشر حضور حصة اليوم
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                {sessionDate}
              </span>
            </div>

            {/* Circular Gauge */}
            <div className="py-4 flex flex-col items-center justify-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-500 transition-all duration-1000 ease-out"
                    strokeDasharray={`${attendanceRate}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <strong className="text-2xl font-black text-slate-900 font-cairo leading-none">
                    {attendanceRate}%
                  </strong>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">حضور</span>
                </div>
              </div>

              {/* Present / Absent pills */}
              <div className="mt-3 flex items-center justify-center gap-2 w-full">
                <button
                  type="button"
                  onClick={() => onFilterStatus?.("present")}
                  className="flex-1 rounded-xl bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 p-2 text-center transition cursor-pointer active-press"
                  title="تصفية الحاضرين"
                >
                  <span className="block text-[10px] font-bold text-emerald-800">حاضرون</span>
                  <strong className="text-sm font-black text-emerald-700">{presentToday}</strong>
                </button>
                <button
                  type="button"
                  onClick={() => onFilterStatus?.("absent")}
                  className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100/90 border border-rose-200/80 p-2 text-center transition cursor-pointer active-press"
                  title="تصفية الغائبين"
                >
                  <span className="block text-[10px] font-bold text-rose-800">غائبون</span>
                  <strong className="text-sm font-black text-rose-700">{absentToday}</strong>
                </button>
              </div>
            </div>

            {/* Attendance Report Button */}
            {onOpenAttendanceReport && (
              <button
                type="button"
                onClick={() =>
                  onOpenAttendanceReport(branch === "كل الصالات" ? branches[0]?.name || "كل الصالات" : branch)
                }
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition active-press cursor-pointer"
              >
                <FileText className="h-4 w-4" />
                <span>إصدار كارت تقرير الحضور للواتساب</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ━━━ 5. Upcoming Event / Birthday Spotlight (If Any) ━━━ */}
      {(nextEvent || (todayBirthdays && todayBirthdays.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {nextEvent && (
            <div
              onClick={onOpenEvents}
              className="rounded-2xl border border-sky-200 bg-sky-50/60 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-sky-50 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-xs shrink-0">
                  <Compass className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-sky-700 uppercase">
                    أقرب فعالية قادمة 🏆
                  </span>
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {nextEvent.title}
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-500">
                    التاريخ: {nextEvent.date}
                  </p>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-sky-500 shrink-0" />
            </div>
          )}

          {todayBirthdays && todayBirthdays.length > 0 && (
            <div
              onClick={onOpenBirthdays}
              className="rounded-2xl border border-rose-200 bg-rose-50/60 p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-50 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-xs shrink-0">
                  <Cake className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black text-rose-700 uppercase">
                    احتفالات الأبطال اليوم 🎉
                  </span>
                  <h4 className="text-xs font-black text-slate-900 truncate">
                    {todayBirthdays.length} أبطال يحتفلون اليوم
                  </h4>
                  <p className="text-[10px] font-semibold text-slate-500 truncate">
                    {todayBirthdays.map((p) => p.name).join(" • ")}
                  </p>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-rose-500 shrink-0" />
            </div>
          )}
        </div>
      )}

    </div>
  );
}

export default memo(StatsGrid);
