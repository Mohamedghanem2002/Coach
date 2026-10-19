"use client";
import { useState, useMemo } from "react";
import {
  Compass,
  Plus,
  Clock,
  Users,
  FileSpreadsheet,
  ChevronDown,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { formatWhatsAppPhone, openWhatsAppDirect } from "../../lib/dashboard-utils";
import { exportEventToExcel } from "../../lib/excel-export-utils";
import { TYPE_CONFIG, STATUS_LABELS } from "./events/events-config";
import EventOverviewCard from "./events/EventOverviewCard";
import EventDetailHero from "./events/EventDetailHero";
import EventBulkActionsDock from "./events/EventBulkActionsDock";
import EventParticipantCard from "./events/EventParticipantCard";

export { TYPE_CONFIG, STATUS_LABELS };

export default function EventsView({
  events = [],
  players = [],
  branches = [],
  academyName = "CoachMaster",
  captainName = "كابتن",
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onOpenAddParticipants,
  onOpenPaymentModal,
  onUpdateAttendance,
  onRemoveParticipant,
  onBulkPayment,
  onOpenExportExcel,
  showToast = () => {},
}) {
  // Selected event scope: "all" = all events combined, or specific event _id
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [participantFilter, setParticipantFilter] = useState("all"); // "all", "paid", "partial", "unpaid", "attended", "absent"
  const [participantSearch, setParticipantSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  // Selected event (for detail view) - strictly matched by unique _id
  const selectedEvent = useMemo(() => {
    if (selectedEventId === "all") return null;
    return events.find((e) => e._id === selectedEventId) || null;
  }, [events, selectedEventId]);

  // Calculations strictly scoped by selectedEventId (ID-isolated accounting)
  const activeStats = useMemo(() => {
    let totalParticipants = 0;
    let paidCount = 0;
    let unpaidCount = 0;
    let totalExpected = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    // Scope list: either the single selected event or all events
    const scopedEvents =
      selectedEventId === "all"
        ? events
        : events.filter((e) => e._id === selectedEventId);

    scopedEvents.forEach((ev) => {
      const parts = ev.participants || [];
      totalParticipants += parts.length;

      parts.forEach((p) => {
        const tot = Number(p.totalAmount ?? ev.fee ?? 100);
        const paid = Number(p.paidAmount ?? 0);
        const rem = Math.max(0, tot - paid);

        totalExpected += tot;
        totalPaid += paid;
        totalRemaining += rem;

        const isPaidInFull =
          p.paymentStatus === "paid" || (tot > 0 && paid >= tot);
        if (isPaidInFull) {
          paidCount += 1;
        } else {
          unpaidCount += 1;
        }
      });
    });

    const collectionPercent =
      totalExpected > 0 ? Math.round((totalPaid / totalExpected) * 100) : 0;

    return {
      totalEvents: scopedEvents.length,
      totalParticipants,
      paidCount,
      unpaidCount,
      totalExpected,
      totalPaid,
      totalRemaining,
      collectionPercent,
    };
  }, [events, selectedEventId]);

  // Filter events in overview
  const filteredEvents = useMemo(() => {
    if (eventTypeFilter === "all") return events;
    return events.filter((e) => e.type === eventTypeFilter);
  }, [events, eventTypeFilter]);

  // Filter participants of current selected event
  const currentParticipants = useMemo(() => {
    if (!selectedEvent) return [];
    let list = selectedEvent.participants || [];

    // Filter by payment / attendance status
    if (participantFilter === "paid") {
      list = list.filter((p) => p.paymentStatus === "paid");
    } else if (participantFilter === "partial") {
      list = list.filter((p) => p.paymentStatus === "partially_paid");
    } else if (participantFilter === "unpaid") {
      list = list.filter((p) => p.paymentStatus === "unpaid");
    } else if (participantFilter === "attended") {
      list = list.filter((p) => Boolean(p.attended));
    } else if (participantFilter === "absent") {
      list = list.filter((p) => !p.attended);
    }

    // Search query
    if (participantSearch.trim()) {
      const q = participantSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.branch && p.branch.toLowerCase().includes(q)) ||
          (p.parentPhone && p.parentPhone.includes(q)) ||
          (p.phone && p.phone.includes(q))
      );
    }

    return list;
  }, [selectedEvent, participantFilter, participantSearch]);

  function handleToggleSelectParticipant(pId) {
    setSelectedParticipants((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
  }

  function handleSelectAllParticipants() {
    const allIds = currentParticipants.map((p) => p.playerId);
    const isAll = allIds.every((id) => selectedParticipants.includes(id));
    if (isAll) {
      setSelectedParticipants([]);
    } else {
      setSelectedParticipants(allIds);
    }
  }

  function handleExportEventCSV(event) {
    if (!event || !event.participants?.length) {
      showToast("لا يوجد مشتركون لتصديرهم في هذا الحدث", "error");
      return;
    }
    try {
      exportEventToExcel({
        event,
        academyName,
        captainName,
      });
      showToast(`تم تصدير كشف مشتركي (${event.title}) إلى ملف Excel (.xlsx) بنجاح.`);
    } catch (err) {
      console.error("Export error:", err);
      showToast("حدث خطأ أثناء تصدير ملف Excel", "error");
    }
  }

  function handleShareWhatsAppReport(event) {
    if (!event) return;
    const parts = event.participants || [];
    const totalRevenue = parts.reduce(
      (sum, p) => sum + (Number(p.totalAmount) || 0),
      0
    );
    const paidRevenue = parts.reduce(
      (sum, p) => sum + (Number(p.paidAmount) || 0),
      0
    );
    const remainingRevenue = Math.max(0, totalRevenue - paidRevenue);
    const attendedCount = parts.filter((p) => p.attended).length;

    const message = `*🎪 تقرير فعالية: ${event.title}*
📅 *التاريخ:* ${event.date} ${event.time ? `(${event.time})` : ""}
📍 *المكان:* ${event.location || "غير محدد"}
💵 *رسوم الاشتراك:* ${event.fee} ج.م
👥 *إجمالي الأبطال المشتركين:* ${parts.length} لاعب
🥋 *حضور الفعالية:* ${attendedCount} من أصل ${parts.length}
✅ *المتحصلات المالية:* ${paidRevenue.toLocaleString("ar-EG")} ج.م
⏳ *المستحقات المتبقية:* ${remainingRevenue.toLocaleString("ar-EG")} ج.م

أكاديمية CoachMaster للأبطال 🥋`;

    openWhatsAppDirect("", message);
  }

  function handleSendParticipantWhatsApp(participant, event) {
    const total = Number(participant.totalAmount ?? event.fee ?? 100);
    const paid = Number(participant.paidAmount ?? 0);
    const remaining = Math.max(0, total - paid);

    const phone = participant.parentPhone || participant.phone;
    const cleanPhone = formatWhatsAppPhone(phone);

    const message = `السلام عليكم ورحمة الله،
تحية طيبة من كابتن أكاديمية CoachMaster 🥋

نحيطكم علماً بتفاصيل اشتراك البطل *${participant.name}* في:
*${event.title}*
📅 التاريخ: ${event.date} ${event.time ? `(${event.time})` : ""}
📍 المكان: ${event.location || "محدد في الإعلان"}
💵 قيمة الاشتراك: ${total} ج.م
✅ المبلغ المسدد: ${paid} ج.م
${remaining > 0 ? `⏳ المبلغ المتبقي: *${remaining} ج.م*` : "🎉 تم سداد الاشتراك بالكامل!"}

شاكرين لكم حسن تعاونكم ودعمكم الدائم للبطل!`;

    openWhatsAppDirect(cleanPhone, message);
  }

  return (
    <div
      className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden"
      dir="rtl"
    >
      {/* ━━━ Header & Summary Cards ━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-sm shadow-red-600/20 ring-4 ring-red-50">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-cairo text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              إدارة الفعاليات والرحلات والمعسكرات
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-0.5">
              تنظيم أنشطة الأكاديمية الخارجية، وتحديد الأبطال المشتركين ومتابعة سدادهم
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateEvent}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs sm:text-sm font-bold text-white shadow-sm shadow-red-600/20 active-press transition cursor-pointer min-h-[44px]"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>إنشاء فعالية جديدة</span>
        </button>
      </div>

      {/* ━━━ Event Selection Scope Bar & Distinction ━━━ */}
      {events.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-3.5 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
                <Layers className="h-4 w-4" />
              </span>
              <div>
                <span className="block text-[11px] font-bold text-slate-400">
                  نطاق الحسابات والبيانات:
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  {selectedEvent ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-0.5 text-xs font-black text-red-700">
                      <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
                      <span>فعالية محددة: {selectedEvent.title}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-black text-blue-700">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      <span>جميع الفعاليات (إجمالي {events.length} فعالية)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onOpenExportExcel && (
                <button
                  type="button"
                  onClick={() => onOpenExportExcel("events", selectedEvent?._id || null)}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black transition active-press cursor-pointer shadow-2xs"
                  title="تصدير بيانات الفعاليات والمشتركين إلى Excel"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  <span>تصدير إكسيل</span>
                </button>
              )}

              {selectedEvent && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventId("all");
                    setSelectedParticipants([]);
                    setParticipantSearch("");
                  }}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-black transition active-press cursor-pointer shadow-2xs"
                  title="التبديل إلى حسابات وعرض كافة الفعاليات"
                >
                  <span>🌐 عرض إجمالي جميع الفعاليات</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile-Friendly Accessible Event Selector */}
          <div>
            <label htmlFor="event-scope-selector" className="block text-[11px] font-bold text-slate-600 mb-1.5">
              اختر الفعالية لعرض حساباتها المستقلة:
            </label>
            <div className="relative">
              <select
                id="event-scope-selector"
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedParticipants([]);
                  setParticipantSearch("");
                }}
                className="w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 py-3 pr-4 pl-10 text-xs sm:text-sm font-black text-slate-800 focus:bg-white focus:border-red-500 focus:outline-hidden focus:ring-2 focus:ring-red-100 transition shadow-2xs cursor-pointer"
              >
                <option value="all">
                  🌐 جميع الفعاليات — (عرض إجمالي كافة الفعاليات: {events.length} فعالية)
                </option>
                {events.map((ev, idx) => (
                  <option key={ev._id} value={ev._id}>
                    [{idx + 1}] {ev.title} • 📅 {ev.date || "بدون تاريخ"}{ev.time ? ` (${ev.time})` : ""}{ev.location ? ` • 📍 ${ev.location}` : ""} • (👥 {(ev.participants || []).length} مشترك) • (💵 {ev.fee} ج.م)
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      )}

      {/* ━━━ 6 Core Independent Financial & Participation Metrics ━━━ */}
      {events.length > 0 && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-500">
              {selectedEvent
                ? `حسابات فعالية (${selectedEvent.title}) فقط:`
                : "إجمالي حسابات جميع الفعاليات مجمعة:"}
            </span>
            <span className="text-[11px] font-extrabold text-slate-400">
              {activeStats.collectionPercent}% تم تحصيله
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* 1. عدد المشتركين */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">عدد المشتركين</span>
                <Users className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              </div>
              <strong className="block font-cairo text-lg sm:text-xl font-black text-slate-900">
                {activeStats.totalParticipants} <span className="text-xs font-bold text-slate-400 font-sans">لاعب</span>
              </strong>
            </div>

            {/* 2. عدد المدفوعين */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[11px] font-bold">عدد المدفوعين</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              </div>
              <strong className="block font-cairo text-lg sm:text-xl font-black text-emerald-900">
                {activeStats.paidCount} <span className="text-xs font-bold text-emerald-700/70 font-sans">لاعب</span>
              </strong>
            </div>

            {/* 3. عدد غير المدفوعين */}
            <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-rose-700 mb-1">
                <span className="text-[11px] font-bold">عدد غير المدفوعين</span>
                <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
              </div>
              <strong className="block font-cairo text-lg sm:text-xl font-black text-rose-900">
                {activeStats.unpaidCount} <span className="text-xs font-bold text-rose-700/70 font-sans">لاعب</span>
              </strong>
            </div>

            {/* 4. إجمالي المبلغ */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-[11px] font-bold">إجمالي المبلغ</span>
                <DollarSign className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
              </div>
              <strong className="block font-cairo text-lg sm:text-xl font-black text-slate-900">
                {activeStats.totalExpected.toLocaleString("ar-EG")} <span className="text-xs font-bold text-slate-400 font-sans">ج.م</span>
              </strong>
            </div>

            {/* 5. المدفوع */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 mb-1">
                <span className="text-[11px] font-bold">المدفوع</span>
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              </div>
              <strong className="block font-cairo text-lg sm:text-xl font-black text-emerald-900">
                {activeStats.totalPaid.toLocaleString("ar-EG")} <span className="text-xs font-bold text-emerald-700/70 font-sans">ج.م</span>
              </strong>
            </div>

            {/* 6. المتبقي */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 shadow-2xs">
              <div className="flex items-center justify-between text-amber-700 mb-1">
                <span className="text-[11px] font-bold">المتبقي</span>
                <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              </div>
              <strong className="block font-cairo text-lg sm:text-xl font-black text-amber-900">
                {activeStats.totalRemaining.toLocaleString("ar-EG")} <span className="text-xs font-bold text-amber-700/70 font-sans">ج.م</span>
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* ━━━ Main Body: Overview OR Detail View ━━━ */}
      {events.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 mb-4 ring-8 ring-amber-50/50">
            <Compass className="h-8 w-8" />
          </div>
          <h3 className="font-cairo text-base font-black text-slate-900">
            لا توجد فعاليات أو رحلات مسجلة بعد
          </h3>
          <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto mt-1 mb-6 leading-relaxed">
            اضغط على الزر بالأسفل لإنشاء أول رحلة أو بطولة أو معسكر للأبطال وتحديد
            المشتركين فيها ومتابعة الحضور والسداد.
          </p>
          <button
            type="button"
            onClick={onOpenCreateEvent}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-sm shadow-red-600/20 active-press transition cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>إنشاء أول فعالية الآن</span>
          </button>
        </div>
      ) : selectedEvent ? (
        /* ━━━ Detail View: Selected Event & Participants ━━━ */
        <div className="space-y-4 animate-slide-up">
          {/* Top Bar: Back to All Events */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedEventId("all");
                setSelectedParticipants([]);
                setParticipantSearch("");
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs font-black text-slate-700 hover:bg-slate-50 active-press transition shadow-2xs cursor-pointer min-h-[40px]"
            >
              <ArrowRight className="h-4 w-4 text-slate-500" />
              <span>العودة لكافة الفعاليات ({events.length})</span>
            </button>

            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              لوحة تفاصيل الحدث وإدارة المشتركين
            </span>
          </div>

          {/* Event Hero Details Card */}
          <EventDetailHero
            selectedEvent={selectedEvent}
            onOpenAddParticipants={onOpenAddParticipants}
            onExportEventCSV={handleExportEventCSV}
            onShareWhatsAppReport={handleShareWhatsAppReport}
            onOpenEditEvent={onOpenEditEvent}
            onDeleteEvent={onDeleteEvent}
            onBackToAll={() => setSelectedEventId("all")}
          />

          {/* ━━━ Participants Management Card ━━━ */}
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
            {/* Search and Filters Strip */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    placeholder="ابحث عن لاعب بالاسم، الصالة، أو الهاتف..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-2.5 pr-10 pl-3 text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:border-red-400 focus:outline-hidden focus:ring-2 focus:ring-red-100 transition shadow-2xs"
                  />
                </div>

                {/* Select All Toggle */}
                {currentParticipants.length > 0 && (
                  <button
                    type="button"
                    onClick={handleSelectAllParticipants}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-700 hover:bg-slate-50 active-press transition cursor-pointer shrink-0"
                  >
                    <span>
                      {selectedParticipants.length === currentParticipants.length
                        ? "إلغاء تحديد الكل"
                        : "تحديد جميع المعروضين"}
                    </span>
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-scroll">
                {[
                  {
                    id: "all",
                    label: "الكل",
                    count: (selectedEvent.participants || []).length,
                  },
                  {
                    id: "paid",
                    label: "مدفوع بالكامل",
                    count: (selectedEvent.participants || []).filter(
                      (p) => p.paymentStatus === "paid"
                    ).length,
                    activeClass: "bg-emerald-600 text-white shadow-xs",
                  },
                  {
                    id: "partial",
                    label: "دفع جزئي",
                    count: (selectedEvent.participants || []).filter(
                      (p) => p.paymentStatus === "partially_paid"
                    ).length,
                    activeClass: "bg-amber-600 text-white shadow-xs",
                  },
                  {
                    id: "unpaid",
                    label: "لم يدفع",
                    count: (selectedEvent.participants || []).filter(
                      (p) => p.paymentStatus === "unpaid"
                    ).length,
                    activeClass: "bg-rose-600 text-white shadow-xs",
                  },
                  {
                    id: "attended",
                    label: "حاضر",
                    count: (selectedEvent.participants || []).filter((p) => p.attended)
                      .length,
                    activeClass: "bg-blue-600 text-white shadow-xs",
                  },
                  {
                    id: "absent",
                    label: "غائب",
                    count: (selectedEvent.participants || []).filter((p) => !p.attended)
                      .length,
                    activeClass: "bg-slate-700 text-white shadow-xs",
                  },
                ].map((tab) => {
                  const isActive = participantFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setParticipantFilter(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition active-press cursor-pointer min-h-[34px] ${
                        isActive
                          ? tab.activeClass || "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                          isActive ? "bg-white/30 text-white" : "bg-slate-200/80 text-slate-700"
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bulk Actions Dock (if any selected) */}
            <EventBulkActionsDock
              selectedCount={selectedParticipants.length}
              onBulkPayment={async () => {
                await onBulkPayment({
                  eventId: selectedEvent._id,
                  playerIds: selectedParticipants,
                  status: "paid",
                });
                setSelectedParticipants([]);
                showToast(
                  `تم تسجيل سداد كامل لـ (${selectedParticipants.length}) لاعبين.`
                );
              }}
              onBulkRemove={async () => {
                if (
                  confirm(
                    `هل تريد إزالة (${selectedParticipants.length}) لاعبين من هذه الفعالية؟`
                  )
                ) {
                  for (const pId of selectedParticipants) {
                    await onRemoveParticipant(selectedEvent._id, pId);
                  }
                  setSelectedParticipants([]);
                  showToast(`تمت إزالة المشتركين المحددين.`);
                }
              }}
              onCancel={() => setSelectedParticipants([])}
            />

            {/* Participants Grid / List */}
            {currentParticipants.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-200 rounded-3xl space-y-3">
                <Users className="h-10 w-10 mx-auto text-slate-300" />
                <p className="font-cairo text-sm font-black text-slate-700">
                  لا يوجد مشتركون مطابقون للفلتر المحدد
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenAddParticipants(selectedEvent)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-black text-red-600 hover:bg-red-600 hover:text-white transition cursor-pointer"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>إضافة أبطال إلى {selectedEvent.title}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {currentParticipants.map((participant) => (
                  <EventParticipantCard
                    key={participant.playerId}
                    participant={participant}
                    selectedEvent={selectedEvent}
                    isSelected={selectedParticipants.includes(participant.playerId)}
                    onToggleSelect={handleToggleSelectParticipant}
                    onSendWhatsApp={handleSendParticipantWhatsApp}
                    onRemove={onRemoveParticipant}
                    onUpdateAttendance={onUpdateAttendance}
                    onOpenPaymentModal={onOpenPaymentModal}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ━━━ Overview View: All Events Cards Grid ━━━ */
        <div className="space-y-4">
          {/* Type Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 touch-scroll">
              {[
                { id: "all", label: "جميع الفعاليات", count: events.length },
                {
                  id: "trip",
                  label: "رحلات 🏕️",
                  count: events.filter((e) => e.type === "trip").length,
                },
                {
                  id: "tournament",
                  label: "بطولات 🏆",
                  count: events.filter((e) => e.type === "tournament").length,
                },
                {
                  id: "camp",
                  label: "معسكرات ⛺",
                  count: events.filter((e) => e.type === "camp").length,
                },
                {
                  id: "belt_exam",
                  label: "اختبارات أحزمة 🥋",
                  count: events.filter((e) => e.type === "belt_exam").length,
                },
                {
                  id: "other",
                  label: "خاصة ✨",
                  count: events.filter((e) => e.type === "other").length,
                },
              ].map((tab) => {
                const isActive = eventTypeFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setEventTypeFilter(tab.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition active-press cursor-pointer min-h-[38px] ${
                      isActive
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`rounded-full px-1.5 py-0.2 text-[10px] font-black ${
                        isActive ? "bg-white/30 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event, eventIdx) => (
              <EventOverviewCard
                key={event._id}
                event={event}
                eventIdx={eventIdx}
                onSelectEvent={setSelectedEventId}
                onOpenEditEvent={onOpenEditEvent}
                onDeleteEvent={onDeleteEvent}
                onExportEventCSV={handleExportEventCSV}
                onShareWhatsAppReport={handleShareWhatsAppReport}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
