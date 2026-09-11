"use client";
import { useState, useMemo } from "react";
import {
  Compass,
  Trophy,
  Tent,
  Award,
  Sparkles,
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  FileSpreadsheet,
  Share2,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Check,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Filter,
  ArrowRight,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { BELT_HEX } from "../../lib/dashboard-utils";

const TYPE_CONFIG = {
  trip: {
    label: "رحلة ترفيهية",
    icon: Compass,
    color: "text-amber-700 bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    gradient: "from-amber-500 to-orange-600",
  },
  tournament: {
    label: "بطولة ومنافسة",
    icon: Trophy,
    color: "text-rose-700 bg-rose-50 border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    gradient: "from-rose-500 to-red-600",
  },
  camp: {
    label: "معسكر تدريبي",
    icon: Tent,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
  },
  belt_exam: {
    label: "اختبار حزام",
    icon: Award,
    color: "text-sky-700 bg-sky-50 border-sky-200",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    gradient: "from-sky-500 to-blue-600",
  },
  other: {
    label: "فعالية خاصة",
    icon: Sparkles,
    color: "text-purple-700 bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    gradient: "from-purple-500 to-indigo-600",
  },
};

const STATUS_LABELS = {
  upcoming: {
    label: "قادم",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  active: {
    label: "نشط الآن",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500 animate-pulse",
  },
  completed: {
    label: "مكتمل",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "ملغي",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};

export default function EventsView({
  events = [],
  players = [],
  branches = [],
  onOpenCreateEvent,
  onOpenEditEvent,
  onDeleteEvent,
  onOpenAddParticipants,
  onOpenPaymentModal,
  onUpdateAttendance,
  onRemoveParticipant,
  onBulkPayment,
  showToast = () => {},
}) {
  // Mobile navigation: null = overview list, string ID = detail view
  const [activeEventId, setActiveEventId] = useState(null);
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [participantFilter, setParticipantFilter] = useState("all"); // "all", "paid", "partial", "unpaid", "attended", "absent"
  const [participantSearch, setParticipantSearch] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("all");

  // Selected event (for detail view)
  const selectedEvent = useMemo(() => {
    if (!activeEventId) return null;
    return events.find((e) => e._id === activeEventId) || null;
  }, [events, activeEventId]);

  // Overall statistics
  const overallStats = useMemo(() => {
    let totalParticipants = 0;
    let totalRevenue = 0;
    let totalPaid = 0;
    let totalRemaining = 0;

    events.forEach((ev) => {
      const parts = ev.participants || [];
      totalParticipants += parts.length;
      parts.forEach((p) => {
        const tot = Number(p.totalAmount ?? ev.fee ?? 100);
        const paid = Number(p.paidAmount ?? 0);
        totalRevenue += tot;
        totalPaid += paid;
        totalRemaining += Math.max(0, tot - paid);
      });
    });

    return {
      totalEvents: events.length,
      totalParticipants,
      totalRevenue,
      totalPaid,
      totalRemaining,
    };
  }, [events]);

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

    const headers = [
      "م",
      "اسم اللاعب",
      "الصالة",
      "الحزام",
      "رقم ولي الأمر",
      "هاتف اللاعب",
      "قيمة الاشتراك",
      "المبلغ المدفوع",
      "المبلغ المتبقي",
      "حالة السداد",
      "حضور الفعالية",
      "ملاحظات",
    ];

    const rows = event.participants.map((p, idx) => {
      const total = Number(p.totalAmount ?? event.fee ?? 100);
      const paid = Number(p.paidAmount ?? 0);
      const remaining = Math.max(0, total - paid);
      const statusText =
        p.paymentStatus === "paid"
          ? "مدفوع بالكامل"
          : p.paymentStatus === "partially_paid"
          ? "دفع جزئي"
          : "لم يدفع";

      return [
        idx + 1,
        `"${p.name || ""}"`,
        `"${p.branch || ""}"`,
        `"${p.belt || ""}"`,
        `"${p.parentPhone || ""}"`,
        `"${p.phone || ""}"`,
        total,
        paid,
        remaining,
        `"${statusText}"`,
        p.attended ? "حاضر" : "غائب",
        `"${p.notes || ""}"`,
      ];
    });

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `كشف_مشتركي_${event.title.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`تم تصدير كشف مشتركي (${event.title}) بنجاح.`);
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

أكاديمية Re_action للأبطال 🥋`;

    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank");
  }

  function handleSendParticipantWhatsApp(participant, event) {
    const total = Number(participant.totalAmount ?? event.fee ?? 100);
    const paid = Number(participant.paidAmount ?? 0);
    const remaining = Math.max(0, total - paid);

    const phone = participant.parentPhone || participant.phone;
    let cleanPhone = phone ? phone.replace(/\D/g, "") : "";
    if (cleanPhone.startsWith("01")) cleanPhone = "2" + cleanPhone;

    const message = `السلام عليكم ورحمة الله،
تحية طيبة من كابتن أكاديمية Re_action 🥋

نحيطكم علماً بتفاصيل اشتراك البطل *${participant.name}* في:
*${event.title}*
📅 التاريخ: ${event.date} ${event.time ? `(${event.time})` : ""}
📍 المكان: ${event.location || "محدد في الإعلان"}
💵 قيمة الاشتراك: ${total} ج.م
✅ المبلغ المسدد: ${paid} ج.م
${remaining > 0 ? `⏳ المبلغ المتبقي: *${remaining} ج.م*` : "🎉 تم سداد الاشتراك بالكامل!"}

شاكرين لكم حسن تعاونكم ودعمكم الدائم للبطل!`;

    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(
          message
        )}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  return (
    <div
      className="space-y-6 animate-fade-in w-full max-w-full overflow-x-hidden"
      dir="rtl"
    >
      {/* ━━━ Header & Summary Cards ━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 via-rose-500 to-red-600 text-white shadow-md shadow-rose-500/20 ring-4 ring-rose-50">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-cairo text-lg sm:text-xl font-black text-slate-900 leading-tight">
              إدارة الفعاليات والرحلات والمعسكرات
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              تنظيم أنشطة الأكاديمية الخارجية، وتحديد الأبطال المشتركين ومتابعة سدادهم
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateEvent}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 text-xs sm:text-sm font-black text-white shadow-lg shadow-red-500/25 hover:brightness-110 active-press transition cursor-pointer min-h-[44px]"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>إنشاء فعالية جديدة</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs">
          <span className="block text-[11px] font-bold text-slate-400">
            إجمالي الفعاليات
          </span>
          <strong className="block font-cairo text-xl font-black text-slate-900 mt-0.5">
            {overallStats.totalEvents}
          </strong>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-2xs">
          <span className="block text-[11px] font-bold text-blue-600">
            إجمالي المشتركين
          </span>
          <strong className="block font-cairo text-xl font-black text-blue-900 mt-0.5">
            {overallStats.totalParticipants} لاعب
          </strong>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-2xs">
          <span className="block text-[11px] font-bold text-emerald-600">
            المتحصلات المسددة
          </span>
          <strong className="block font-cairo text-xl font-black text-emerald-900 mt-0.5">
            {overallStats.totalPaid.toLocaleString("ar-EG")} ج.م
          </strong>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-2xs">
          <span className="block text-[11px] font-bold text-amber-600">
            المستحقات المتبقية
          </span>
          <strong className="block font-cairo text-xl font-black text-amber-900 mt-0.5">
            {overallStats.totalRemaining.toLocaleString("ar-EG")} ج.م
          </strong>
        </div>
      </div>

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
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-xs font-black text-white shadow-lg shadow-red-500/25 active-press transition cursor-pointer"
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
                setActiveEventId(null);
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
          {(() => {
            const typeInfo = TYPE_CONFIG[selectedEvent.type] || TYPE_CONFIG.other;
            const statusInfo =
              STATUS_LABELS[selectedEvent.status] || STATUS_LABELS.upcoming;
            const TypeIcon = typeInfo.icon;
            const parts = selectedEvent.participants || [];
            const totalRev = parts.reduce(
              (sum, p) => sum + (Number(p.totalAmount) || 0),
              0
            );
            const paidRev = parts.reduce(
              (sum, p) => sum + (Number(p.paidAmount) || 0),
              0
            );
            const remRev = Math.max(0, totalRev - paidRev);
            const attendedCount = parts.filter((p) => p.attended).length;
            const collectionPercent =
              totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 0;

            return (
              <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
                {/* Event Header Strip */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-2xl border ${typeInfo.color}`}>
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${typeInfo.badge}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black flex items-center gap-1.5 ${statusInfo.color}`}>
                          <span className={`h-2 w-2 rounded-full ${statusInfo.dot}`} />
                          <span>{statusInfo.label}</span>
                        </span>
                      </div>
                      <h3 className="font-cairo text-lg sm:text-xl font-black text-slate-900 mt-1">
                        {selectedEvent.title}
                      </h3>
                      {selectedEvent.notes && (
                        <p className="text-xs font-semibold text-slate-500 mt-1 max-w-xl">
                          {selectedEvent.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => onOpenAddParticipants(selectedEvent)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-xs font-black text-white shadow-md shadow-red-500/20 hover:brightness-110 active-press transition cursor-pointer min-h-[40px]"
                    >
                      <UserPlus className="h-4 w-4 stroke-[2.5]" />
                      <span>إضافة لاعبين</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportEventCSV(selectedEvent)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer min-h-[40px] text-xs font-black"
                      title="تصدير كشف المشتركين Excel"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span className="hidden sm:inline">Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppReport(selectedEvent)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer min-h-[40px] text-xs font-black"
                      title="مشاركة تقرير الفعالية عبر واتساب"
                    >
                      <Share2 className="h-4 w-4" />
                      <span className="hidden sm:inline">واتساب</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditEvent(selectedEvent)}
                      className="flex items-center justify-center p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 active-press transition cursor-pointer min-h-[40px]"
                      title="تعديل بيانات الحدث"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          confirm(
                            `هل أنت متأكد من حذف فعالية (${selectedEvent.title}) وجميع بيانات مشتركيها؟`
                          )
                        ) {
                          onDeleteEvent(selectedEvent._id);
                          setActiveEventId(null);
                        }
                      }}
                      className="flex items-center justify-center p-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 active-press transition cursor-pointer min-h-[40px]"
                      title="حذف الحدث"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Event Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400">التاريخ والموعد</span>
                    <strong className="block font-cairo font-black text-slate-800 mt-0.5 truncate">
                      {selectedEvent.date} {selectedEvent.time ? `(${selectedEvent.time})` : ""}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400">المكان</span>
                    <strong className="block font-cairo font-black text-slate-800 mt-0.5 truncate">
                      {selectedEvent.location || "غير محدد"}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400">قيمة الاشتراك</span>
                    <strong className="block font-cairo font-black text-emerald-700 mt-0.5">
                      {selectedEvent.fee} ج.م / لاعب
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="block text-[10px] font-bold text-slate-400">الحضور الفعلي</span>
                    <strong className="block font-cairo font-black text-blue-700 mt-0.5">
                      {attendedCount} حاضر من {parts.length}
                    </strong>
                  </div>
                </div>

                {/* Financial Progress Bar */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-emerald-50/30 to-amber-50/30 border border-slate-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black">
                    <div className="flex items-center gap-1.5 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>المسدد: {paidRev.toLocaleString("ar-EG")} ج.م</span>
                    </div>
                    {remRev > 0 ? (
                      <span className="text-amber-800">
                        المتبقي معلق: {remRev.toLocaleString("ar-EG")} ج.م
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold">
                        🎉 تم سداد كافة الاشتراكات بالكامل!
                      </span>
                    )}
                    <span className="text-slate-500 font-bold">
                      {collectionPercent}% تم تحصيله
                    </span>
                  </div>

                  <div className="h-2.5 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                      style={{ width: `${Math.min(100, collectionPercent)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })()}

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
            {selectedParticipants.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg animate-slide-up">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 font-cairo text-xs font-black text-white shadow-xs">
                    {selectedParticipants.length}
                  </span>
                  <span className="text-xs font-bold">لاعب محدد لإجراء جماعي</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
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
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-black text-white active-press transition cursor-pointer"
                  >
                    تسجيل سداد كامل
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
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
                    className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-black text-white active-press transition cursor-pointer"
                  >
                    إزالة من الفعالية
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedParticipants([])}
                    className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            )}

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
                {currentParticipants.map((participant) => {
                  const pId = participant.playerId;
                  const isSelected = selectedParticipants.includes(pId);
                  const total = Number(
                    participant.totalAmount ?? selectedEvent.fee ?? 100
                  );
                  const paid = Number(participant.paidAmount ?? 0);
                  const remaining = Math.max(0, total - paid);
                  const beltColor = BELT_HEX[participant.belt] || "#cbd5e1";
                  const phone = participant.parentPhone || participant.phone;

                  return (
                    <div
                      key={pId}
                      className={`p-3.5 rounded-2xl border transition-all space-y-3 ${
                        isSelected
                          ? "border-red-500 bg-red-50/40 shadow-xs ring-2 ring-red-100"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-2xs"
                      }`}
                    >
                      {/* Row 1: Checkbox, Avatar, Name & Contacts */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          {/* Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectParticipant(pId)}
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition active-press cursor-pointer ${
                              isSelected
                                ? "border-red-600 bg-red-600 text-white shadow-xs"
                                : "border-slate-300 bg-white hover:border-slate-400"
                            }`}
                            aria-label="تحديد اللاعب"
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </button>

                          {/* Avatar with Belt Indicator */}
                          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 overflow-hidden ring-2 ring-slate-100">
                            {participant.photo ? (
                              <img
                                src={participant.photo}
                                alt={participant.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="font-cairo text-sm font-black text-slate-600">
                                {participant.name?.slice(0, 1) || "ب"}
                              </span>
                            )}
                            <span
                              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white"
                              style={{ backgroundColor: beltColor }}
                              title={`حزام ${participant.belt}`}
                            />
                          </div>

                          {/* Name & Branch */}
                          <div className="min-w-0">
                            <strong className="block truncate font-cairo text-sm font-black text-slate-900">
                              {participant.name}
                            </strong>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] font-bold text-slate-500">
                              <span>{participant.branch}</span>
                              <span>•</span>
                              <span className="text-slate-700">{participant.belt}</span>
                            </div>
                          </div>
                        </div>

                        {/* Direct Contact Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          {phone && (
                            <a
                              href={`tel:${phone}`}
                              className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active-press transition"
                              title={`اتصال بولي الأمر (${phone})`}
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() =>
                              handleSendParticipantWhatsApp(
                                participant,
                                selectedEvent
                              )
                            }
                            className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer"
                            title="إرسال تفاصيل الفعالية عبر واتساب"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(
                                  `هل أنت متأكد من إزالة اللاعب (${participant.name}) من هذا الحدث؟`
                                )
                              ) {
                                onRemoveParticipant(selectedEvent._id, pId);
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 active-press transition cursor-pointer"
                            title="إزالة من الفعالية"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Row 2: Attendance Toggle & Payment Button */}
                      <div className="grid grid-cols-2 gap-2 pt-1.5 border-t border-slate-100">
                        {/* Attendance Toggle */}
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAttendance(
                              selectedEvent._id,
                              pId,
                              !participant.attended
                            )
                          }
                          className={`min-h-[42px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs font-black transition active-press cursor-pointer ${
                            participant.attended
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {participant.attended ? (
                            <>
                              <CheckCircle2 className="h-4 w-4" />
                              <span>حاضر ✓</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-slate-400" />
                              <span>غائب</span>
                            </>
                          )}
                        </button>

                        {/* Payment Modal Trigger */}
                        <button
                          type="button"
                          onClick={() =>
                            onOpenPaymentModal(participant, selectedEvent)
                          }
                          className={`min-h-[42px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs font-black transition active-press cursor-pointer ${
                            participant.paymentStatus === "paid"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                              : participant.paymentStatus === "partially_paid"
                              ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-2xs"
                              : "bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          {participant.paymentStatus === "paid" ? (
                            <>
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                              <span className="truncate">مدفوع ({total} ج.م)</span>
                            </>
                          ) : participant.paymentStatus === "partially_paid" ? (
                            <>
                              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                              <span className="truncate">
                                دفع {paid} • باقي {remaining}
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-rose-600 shrink-0" />
                              <span className="truncate">لم يدفع ({total})</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
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
            {filteredEvents.map((event) => {
              const typeInfo = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
              const statusInfo =
                STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;
              const TypeIcon = typeInfo.icon;
              const parts = event.participants || [];
              const totalRev = parts.reduce(
                (sum, p) => sum + (Number(p.totalAmount) || 0),
                0
              );
              const paidRev = parts.reduce(
                (sum, p) => sum + (Number(p.paidAmount) || 0),
                0
              );
              const remRev = Math.max(0, totalRev - paidRev);
              const attendedCount = parts.filter((p) => p.attended).length;
              const collectionPercent =
                totalRev > 0 ? Math.round((paidRev / totalRev) * 100) : 0;

              return (
                <div
                  key={event._id}
                  className="group relative flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200"
                >
                  <div>
                    {/* Card Top: Badges & Edit/Delete */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`p-2.5 rounded-2xl border ${typeInfo.color}`}>
                          <TypeIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${typeInfo.badge}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`mr-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      {/* Edit / Delete quick buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenEditEvent(event);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          title="تعديل الفعالية"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                `هل أنت متأكد من حذف فعالية (${event.title})؟`
                              )
                            ) {
                              onDeleteEvent(event._id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="حذف الفعالية"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-cairo text-base font-black text-slate-900 group-hover:text-red-600 transition-colors leading-snug">
                      {event.title}
                    </h3>

                    {/* Meta info pills */}
                    <div className="mt-3 space-y-1.5 text-xs font-semibold text-slate-600 bg-slate-50/90 p-3 rounded-2xl">
                      <div className="flex items-center gap-2 truncate">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {event.date} {event.time ? `(${event.time})` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location || "المكان غير محدد"}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="text-slate-800 font-bold">
                          رسوم الاشتراك: <strong className="text-emerald-700">{event.fee} ج.م</strong>
                        </span>
                      </div>
                    </div>

                    {/* Financial Progress Strip */}
                    <div className="mt-3.5 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className="text-slate-600">
                          المشتركون:{" "}
                          <strong className="text-slate-900 font-cairo">
                            {parts.length} لاعب
                          </strong>
                          {parts.length > 0 && ` (${attendedCount} حاضر)`}
                        </span>
                        <span className="text-emerald-700 font-bold">
                          {paidRev.toLocaleString("ar-EG")} ج.م
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-300"
                          style={{ width: `${Math.min(100, collectionPercent)}%` }}
                        />
                      </div>

                      {remRev > 0 && (
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                          <span>باقي مستحقات للتحصيل:</span>
                          <span>{remRev.toLocaleString("ar-EG")} ج.م</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Bottom: Open Detail Action */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveEventId(event._id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-black text-white active-press transition cursor-pointer min-h-[40px]"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>عرض وإدارة المشتركين ({parts.length})</span>
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportEventCSV(event)}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 active-press transition cursor-pointer min-h-[40px]"
                      title="تصدير كشف Excel"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppReport(event)}
                      className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer min-h-[40px]"
                      title="تقرير واتساب"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
