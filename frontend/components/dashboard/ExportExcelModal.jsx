"use client";
import { useState, useMemo } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  Users,
  Trophy,
  Layers,
  CheckCircle2,
  CalendarDays,
  MapPin,
  CreditCard,
  Building2,
  Medal,
  Sparkles,
} from "lucide-react";
import {
  exportPlayersToExcel,
  exportEventToExcel,
  exportAllEventsToExcel,
  exportFullMasterReportToExcel,
} from "../../lib/excel-export-utils";
import { getPaymentDetailsFor, getPurchasesSummary, BELTS } from "../../lib/dashboard-utils";

export default function ExportExcelModal({
  isOpen,
  onClose,
  players = [],
  events = [],
  branches = [],
  paymentMonth = "",
  academyName = "CoachMaster",
  captainName = "كابتن الأكاديمية",
  initialTab = "players", // "players" | "events" | "master"
  initialEventId = null,
  showToast,
}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [branchFilter, setBranchFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [beltFilter, setBeltFilter] = useState("all");

  // Events tab state
  const [eventsMode, setEventsMode] = useState("single"); // "single" | "all"
  const [selectedEventId, setSelectedEventId] = useState(
    initialEventId || (events[0]?._id ?? "")
  );
  const [isExporting, setIsExporting] = useState(false);

  // Compute selected event
  const selectedEvent = useMemo(() => {
    return events.find((e) => String(e._id) === String(selectedEventId)) || events[0] || null;
  }, [events, selectedEventId]);

  // Compute filtered players for live preview
  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      if (branchFilter !== "all" && p.branch !== branchFilter) return false;
      if (beltFilter !== "all" && p.belt !== beltFilter) return false;

      if (statusFilter !== "all") {
        const payDetails = getPaymentDetailsFor(p, paymentMonth);
        if (statusFilter === "paid" && payDetails.status !== "paid") return false;
        if (statusFilter === "unpaid" && payDetails.status !== "unpaid") return false;
        if (statusFilter === "partially_paid" && payDetails.status !== "partially_paid") return false;
        if (statusFilter === "has_debt") {
          const debt = getPurchasesSummary(p).remainingAmount;
          if (debt <= 0) return false;
        }
        if (statusFilter === "frozen" && !p.isFrozen) return false;
      }
      return true;
    });
  }, [players, branchFilter, beltFilter, statusFilter, paymentMonth]);

  // Financial summary for filtered players
  const playerStats = useMemo(() => {
    let totalFees = 0;
    let totalPaid = 0;
    let totalRemaining = 0;
    let totalDebt = 0;

    filteredPlayers.forEach((p) => {
      const pay = getPaymentDetailsFor(p, paymentMonth);
      const pur = getPurchasesSummary(p);
      totalFees += pay.totalAmount || 0;
      totalPaid += pay.paidAmount || 0;
      totalRemaining += pay.remainingAmount || 0;
      totalDebt += pur.remainingAmount || 0;
    });

    return { totalFees, totalPaid, totalRemaining, totalDebt };
  }, [filteredPlayers, paymentMonth]);

  // Financial summary for selected event
  const selectedEventStats = useMemo(() => {
    if (!selectedEvent) return { count: 0, attended: 0, expected: 0, paid: 0, rem: 0 };
    const parts = Array.isArray(selectedEvent.participants) ? selectedEvent.participants : [];
    const attended = parts.filter((p) => p.attended).length;
    const expected = parts.reduce((s, p) => s + Number(p.totalAmount ?? selectedEvent.fee ?? 100), 0);
    const paid = parts.reduce((s, p) => s + Number(p.paidAmount ?? 0), 0);
    const rem = Math.max(0, expected - paid);
    return { count: parts.length, attended, expected, paid, rem };
  }, [selectedEvent]);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      if (activeTab === "players") {
        exportPlayersToExcel({
          players,
          branches,
          paymentMonth,
          academyName,
          captainName,
          branchFilter,
          statusFilter,
          beltFilter,
        });
        showToast?.(`تم تصدير كشف بيانات (${filteredPlayers.length}) لاعب إلى Excel بنجاح!`, "success");
      } else if (activeTab === "events") {
        if (eventsMode === "single") {
          if (!selectedEvent) {
            showToast?.("يرجى اختيار فعالية للتصدير", "error");
            setIsExporting(false);
            return;
          }
          exportEventToExcel({
            event: selectedEvent,
            academyName,
            captainName,
          });
          showToast?.(`تم تصدير كشف مشتركي (${selectedEvent.title}) إلى Excel بنجاح!`, "success");
        } else {
          exportAllEventsToExcel({
            events,
            academyName,
            captainName,
          });
          showToast?.(`تم تصدير سجل كافة الفعاليات (${events.length}) إلى Excel بنجاح!`, "success");
        }
      } else if (activeTab === "master") {
        exportFullMasterReportToExcel({
          players,
          events,
          branches,
          paymentMonth,
          academyName,
          captainName,
        });
        showToast?.("تم تصدير التقرير الشامل متعدد الصفحات إلى Excel بنجاح!", "success");
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      console.error("Export error:", err);
      showToast?.("حدث خطأ أثناء إنشاء ملف Excel، يرجى المحاولة ثانية", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden animate-bottom-sheet sm:animate-modal-pop max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ━━━ Header ━━━ */}
        <div className="relative px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20 ring-4 ring-emerald-100/70">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-cairo text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  تصدير بيانات الأكاديمية إلى Excel
                </h3>
                <span className="rounded-md bg-emerald-100/90 text-emerald-800 text-[10px] font-black px-2 py-0.5 border border-emerald-200">
                  .XLSX
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 truncate">
                تصدير تقارير احترافية ومنظمة متوافقة 100% مع Microsoft Excel
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ━━━ Top Segmented Tabs ━━━ */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("players")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === "players"
                  ? "bg-white text-emerald-700 shadow-xs ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">بيانات اللاعبين</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === "events"
                  ? "bg-white text-emerald-700 shadow-xs ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Trophy className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">الفعاليات والبطولات</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("master")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 sm:px-3 rounded-lg text-xs font-black transition cursor-pointer ${
                activeTab === "master"
                  ? "bg-white text-emerald-700 shadow-xs ring-1 ring-black/5"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">تقرير شامل</span>
            </button>
          </div>
        </div>

        {/* ━━━ Scrollable Body ━━━ */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* ━━━━━━━━━━ TAB 1: PLAYERS ━━━━━━━━━━ */}
          {activeTab === "players" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-0.5">
                  <p className="font-black">تصدير مخصص لبيانات اللاعبين واشتراكاتهم</p>
                  <p className="text-emerald-700 leading-relaxed">
                    يتضمن الملف أسماء الأبطال، الصالة، الأحزمة، أرقام الهواتف، الاشتراكات الشهرية، المديونيات، وملاحظات الحساب مرتبة في ورقة عمل منظمة.
                  </p>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Branch Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-slate-400" />
                    <span>تصفية حسب الصالة:</span>
                  </label>
                  <select
                    value={branchFilter}
                    onChange={(e) => setBranchFilter(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="all">جميع الصالات ({players.length})</option>
                    {branches.map((b) => (
                      <option key={b._id || b.name} value={b.name}>
                        {b.name} ({players.filter((p) => p.branch === b.name).length})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment Status Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <CreditCard className="h-3 w-3 text-slate-400" />
                    <span>حالة السداد:</span>
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="all">كل الحالات</option>
                    <option value="paid">المسددين بالكامل فقط</option>
                    <option value="partially_paid">سداد جزئي</option>
                    <option value="unpaid">غير المسددين</option>
                    <option value="has_debt">عليهم مديونية مشتريات</option>
                    <option value="frozen">الاشتراكات المجمدة</option>
                  </select>
                </div>

                {/* Belt Filter */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                    <Medal className="h-3 w-3 text-slate-400" />
                    <span>تصفية حسب الحزام:</span>
                  </label>
                  <select
                    value={beltFilter}
                    onChange={(e) => setBeltFilter(e.target.value)}
                    className="w-full h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                  >
                    <option value="all">كافة الأحزمة</option>
                    {BELTS.map((belt) => {
                      const beltName = typeof belt === "string" ? belt : belt.name;
                      return (
                        <option key={beltName} value={beltName}>
                          حزام {beltName} ({players.filter((p) => p.belt === beltName).length})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Live Preview Stats */}
              <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    معاينة نتائج الفلتر الحالي:
                  </span>
                  <span className="text-xs font-black text-emerald-700 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    {filteredPlayers.length} بطل محدد
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                    <p className="text-[10px] font-bold text-slate-500">إجمالي الاشتراكات</p>
                    <p className="text-xs font-black text-slate-900 mt-0.5">{playerStats.totalFees} ج.م</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-200/80">
                    <p className="text-[10px] font-bold text-emerald-700">المحصل الفعلي</p>
                    <p className="text-xs font-black text-emerald-700 mt-0.5">{playerStats.totalPaid} ج.م</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-rose-200/80">
                    <p className="text-[10px] font-bold text-rose-700">المتبقي المطلوب</p>
                    <p className="text-xs font-black text-rose-700 mt-0.5">{playerStats.totalRemaining} ج.م</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━ TAB 2: EVENTS ━━━━━━━━━━ */}
          {activeTab === "events" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3 sm:p-4 flex items-start gap-3">
                <Trophy className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-0.5">
                  <p className="font-black">تصدير كشوف المشتركين والحسابات الختامية للفعاليات</p>
                  <p className="text-emerald-700 leading-relaxed">
                    يمكنك تصدير كشف مشتركين لفعالية محددة بالاسم ورسومها وحضورها، أو تصدير سجل شامل لكافة الفعاليات.
                  </p>
                </div>
              </div>

              {/* Sub-mode Selection: Single Event vs All Events */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEventsMode("single")}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
                    eventsMode === "single"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <strong className="block text-xs font-black text-slate-900">فعالية أو بطولة معينة</strong>
                    <span className="text-[10.5px] font-semibold text-slate-500">كشف مشتركين تفصيلي لفعالية مختارة</span>
                  </div>
                  <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${eventsMode === "single" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>
                    {eventsMode === "single" && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEventsMode("all")}
                  className={`p-3 rounded-2xl border text-right transition cursor-pointer flex items-center justify-between ${
                    eventsMode === "all"
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div>
                    <strong className="block text-xs font-black text-slate-900">كافة الفعاليات معاً</strong>
                    <span className="text-[10.5px] font-semibold text-slate-500">ملف يضم كل البطولات والأنشطة</span>
                  </div>
                  <span className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 ${eventsMode === "all" ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-300"}`}>
                    {eventsMode === "all" && <CheckCircle2 className="h-3 w-3" />}
                  </span>
                </button>
              </div>

              {/* Single Event Selector */}
              {eventsMode === "single" && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Trophy className="h-3.5 w-3.5 text-emerald-600" />
                      <span>اختر الفعالية المراد تصديرها:</span>
                    </label>

                    {events.length === 0 ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold text-center">
                        لا توجد فعاليات مسجلة حالياً في النظام
                      </div>
                    ) : (
                      <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-hidden"
                      >
                        {events.map((ev) => (
                          <option key={ev._id} value={ev._id}>
                            {ev.title} - ({ev.date || "بدون تاريخ"}) - {ev.participants?.length || 0} مشترك
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Selected Event Card Preview */}
                  {selectedEvent && (
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-2.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-cairo text-sm font-black text-slate-900">
                          {selectedEvent.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CalendarDays className="h-3 w-3 text-slate-400" />
                            {selectedEvent.date || "غير محدد"}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {selectedEvent.location || "المكان غير محدد"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center pt-1">
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-500">المشتركين</p>
                          <p className="text-xs font-black text-slate-900 mt-0.5">{selectedEventStats.count}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                          <p className="text-[10px] font-bold text-slate-500">الحاضرين</p>
                          <p className="text-xs font-black text-emerald-700 mt-0.5">{selectedEventStats.attended}</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-emerald-200/80">
                          <p className="text-[10px] font-bold text-emerald-700">المحصل</p>
                          <p className="text-xs font-black text-emerald-700 mt-0.5">{selectedEventStats.paid} ج.م</p>
                        </div>
                        <div className="p-2 rounded-xl bg-white border border-rose-200/80">
                          <p className="text-[10px] font-bold text-rose-700">المتبقي</p>
                          <p className="text-xs font-black text-rose-700 mt-0.5">{selectedEventStats.rem} ج.م</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* All Events Mode Preview */}
              {eventsMode === "all" && (
                <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-2 text-center">
                  <Trophy className="h-8 w-8 text-emerald-600 mx-auto" />
                  <p className="text-xs font-black text-slate-800">
                    سيتم تصدير سجل متكامل يشمل جميع الفعاليات ({events.length} فعالية)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    يحتوي الملف على ورقتين: الأولى لسجل الفعاليات وإيراداتها، والثانية لكافة المشتركين في جميع الفعاليات.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ━━━━━━━━━━ TAB 3: MASTER REPORT ━━━━━━━━━━ */}
          {activeTab === "master" && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 space-y-0.5">
                  <p className="font-black">تقرير الأكاديمية الشامل (All-In-One Workbook)</p>
                  <p className="text-emerald-700 leading-relaxed">
                    ملف Excel متكامل ومركزي يحتوي على كافة بيانات الأكاديمية مقسمة في صفحات مستقلة منظمة.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Users className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-black text-slate-900">ورقة 1: أبطال الأكاديمية</strong>
                    <span className="text-[10px] text-slate-500">{players.length} لاعب مسجل مع الاشتراكات والمديونيات</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Trophy className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-black text-slate-900">ورقة 2: سجل الفعاليات</strong>
                    <span className="text-[10px] text-slate-500">{events.length} فعالية وبطولة مع الإيرادات</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-black text-slate-900">ورقة 3: إحصائيات الصالات</strong>
                    <span className="text-[10px] text-slate-500">{branches.length} صالات مع معدلات التحصيل</span>
                  </div>
                </div>

                <div className="p-3 rounded-2xl border border-slate-200 bg-white flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-black text-slate-900">تنسيق فوري RTL</strong>
                    <span className="text-[10px] text-slate-500">جاهز للطباعة والمشاركة والفتح في إكسيل</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ━━━ Footer Action Bar ━━━ */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-black transition cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || (activeTab === "events" && eventsMode === "single" && !selectedEvent)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-black shadow-md shadow-emerald-600/20 active-press transition cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>جاري إنشاء ملف Excel...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>
                  {activeTab === "players"
                    ? `تصدير كشف اللاعبين (${filteredPlayers.length})`
                    : activeTab === "events"
                    ? eventsMode === "single"
                      ? `تصدير مشتركي (${selectedEvent?.title || "الفعالية"})`
                      : `تصدير كافة الفعاليات (${events.length})`
                    : "تصدير التقرير الشامل"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
