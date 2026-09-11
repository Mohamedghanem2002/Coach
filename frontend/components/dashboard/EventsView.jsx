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
  Banknote,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  Share2,
  Phone,
  MessageSquare,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Check,
  Building2,
  DollarSign,
} from "lucide-react";
import { BELT_HEX } from "../../lib/dashboard-utils";

const TYPE_CONFIG = {
  trip: { label: "رحلة ترفيهية", icon: Compass, color: "text-amber-600 bg-amber-50 border-amber-200" },
  tournament: { label: "بطولة ومنافسة", icon: Trophy, color: "text-rose-600 bg-rose-50 border-rose-200" },
  camp: { label: "معسكر تدريبي", icon: Tent, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  belt_exam: { label: "اختبار حزام", icon: Award, color: "text-sky-600 bg-sky-50 border-sky-200" },
  other: { label: "فعالية خاصة", icon: Sparkles, color: "text-purple-600 bg-purple-50 border-purple-200" },
};

const STATUS_LABELS = {
  upcoming: { label: "قادم", color: "bg-blue-50 text-blue-700 border-blue-200" },
  active: { label: "نشط الآن", color: "bg-emerald-50 text-emerald-700 border-emerald-200 animate-pulse" },
  completed: { label: "مكتمل", color: "bg-slate-100 text-slate-700 border-slate-200" },
  cancelled: { label: "ملغي", color: "bg-rose-50 text-rose-700 border-rose-200" },
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
  const [selectedEventId, setSelectedEventId] = useState(
    events.length > 0 ? events[0]._id : null,
  );
  const [selectedParticipants, setSelectedParticipants] = useState([]);
  const [participantFilter, setParticipantFilter] = useState("all"); // "all", "paid", "partial", "unpaid"

  const selectedEvent = useMemo(() => {
    return events.find((e) => e._id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

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

  // Filter participants of current selected event
  const currentParticipants = useMemo(() => {
    if (!selectedEvent) return [];
    const list = selectedEvent.participants || [];
    if (participantFilter === "paid") return list.filter((p) => p.paymentStatus === "paid");
    if (participantFilter === "partial") return list.filter((p) => p.paymentStatus === "partially_paid");
    if (participantFilter === "unpaid") return list.filter((p) => p.paymentStatus === "unpaid");
    return list;
  }, [selectedEvent, participantFilter]);

  function handleToggleSelectParticipant(pId) {
    setSelectedParticipants((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId],
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

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
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
    const totalRevenue = parts.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
    const paidRevenue = parts.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
    const remainingRevenue = Math.max(0, totalRevenue - paidRevenue);

    const message = `*🎪 تقرير فعالية: ${event.title}*
📅 *التاريخ:* ${event.date} ${event.time ? `(${event.time})` : ""}
📍 *المكان:* ${event.location || "غير محدد"}
💵 *رسوم الاشتراك:* ${event.fee} ج.م
👥 *إجمالي الأبطال المشتركين:* ${parts.length} لاعب
✅ *المتحصلات:* ${paidRevenue.toLocaleString("ar-EG")} ج.م
⏳ *المتبقي معلق:* ${remainingRevenue.toLocaleString("ar-EG")} ج.م

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
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  }

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* ━━━ Header & Summary Cards ━━━ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 text-white shadow-md shadow-amber-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-cairo text-base sm:text-xl font-black text-slate-900 leading-tight">
                إدارة الفعاليات والرحلات والمعسكرات
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                تنظيم أنشطة الأكاديمية الخارجية، وتحديد الأبطال المشتركين ومتابعة سدادهم
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCreateEvent}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 text-xs sm:text-sm font-black text-white shadow-lg shadow-red-500/25 hover:from-red-700 hover:to-rose-700 active-press transition cursor-pointer min-h-[44px]"
        >
          <Plus className="h-4 w-4 stroke-[3]" />
          <span>إنشاء فعالية جديدة</span>
        </button>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-xs">
          <span className="block text-[11px] font-bold text-slate-400">إجمالي الفعاليات</span>
          <strong className="block font-cairo text-xl font-black text-slate-900 mt-0.5">
            {overallStats.totalEvents}
          </strong>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 shadow-xs">
          <span className="block text-[11px] font-bold text-blue-600">إجمالي المشتركين</span>
          <strong className="block font-cairo text-xl font-black text-blue-800 mt-0.5">
            {overallStats.totalParticipants} لاعب
          </strong>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 shadow-xs">
          <span className="block text-[11px] font-bold text-emerald-600">المتحصلات المسددة</span>
          <strong className="block font-cairo text-xl font-black text-emerald-800 mt-0.5">
            {overallStats.totalPaid.toLocaleString("ar-EG")} ج.م
          </strong>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 shadow-xs">
          <span className="block text-[11px] font-bold text-amber-600">المستحقات المتبقية</span>
          <strong className="block font-cairo text-xl font-black text-amber-800 mt-0.5">
            {overallStats.totalRemaining.toLocaleString("ar-EG")} ج.م
          </strong>
        </div>
      </div>

      {/* شريط اختيار الفعالية على الموبايل */}
      {events.length > 0 && (
        <div className="lg:hidden space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700">اختر الفعالية:</span>
            <span className="text-[10px] font-bold text-slate-400">{events.length} فعالية</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {events.map((event) => {
              const isSelected = selectedEvent?._id === event._id;
              const typeInfo = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
              const TypeIcon = typeInfo.icon;
              const parts = event.participants || [];
              return (
                <button
                  key={event._id}
                  type="button"
                  onClick={() => setSelectedEventId(event._id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-2xl border shrink-0 transition active-press text-right ${
                    isSelected
                      ? "border-red-500 bg-red-50/80 text-red-950 shadow-xs ring-2 ring-red-200"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className={`p-1.5 rounded-xl border ${typeInfo.color}`}>
                    <TypeIcon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 text-right">
                    <strong className="block text-xs font-black truncate max-w-[130px]">{event.title}</strong>
                    <span className="text-[10px] font-semibold text-slate-500">{parts.length} لاعب • {event.date}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* If no events */}
      {events.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-50 text-amber-600 mb-4">
            <Compass className="h-8 w-8" />
          </div>
          <h3 className="font-cairo text-base font-black text-slate-900">
            لا توجد فعاليات أو رحلات مسجلة بعد
          </h3>
          <p className="text-xs font-semibold text-slate-400 max-w-sm mx-auto mt-1 mb-6">
            اضغط على الزر بالأسفل لإنشاء أول رحلة أو بطولة أو معسكر للأبطال وتحديد المشتركين فيها
          </p>
          <button
            type="button"
            onClick={onOpenCreateEvent}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-red-600 text-xs font-black text-white shadow-lg shadow-red-500/25 active:scale-95 transition cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span>إنشاء أول فعالية الآن</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* ━━━ Right Column: Events List Cards (Desktop only) ━━━ */}
          <div className="hidden lg:block lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-cairo text-sm font-black text-slate-800">
                قائمة الفعاليات ({events.length})
              </h3>
            </div>

            <div className="space-y-3">
              {events.map((event) => {
                const isSelected = selectedEvent?._id === event._id;
                const typeInfo = TYPE_CONFIG[event.type] || TYPE_CONFIG.other;
                const statusInfo = STATUS_LABELS[event.status] || STATUS_LABELS.upcoming;
                const TypeIcon = typeInfo.icon;
                const parts = event.participants || [];
                const totalRev = parts.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
                const paidRev = parts.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
                const remRev = Math.max(0, totalRev - paidRev);

                return (
                  <div
                    key={event._id}
                    onClick={() => setSelectedEventId(event._id)}
                    className={`p-4 rounded-3xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? "border-red-500 bg-white shadow-lg ring-2 ring-red-100"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-md"
                    }`}
                  >
                    {/* Top strip */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-xl border ${typeInfo.color}`}>
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <strong className="block font-cairo text-sm font-black text-slate-900 leading-snug">
                            {event.title}
                          </strong>
                          <span className="text-[10px] font-bold text-slate-400">
                            {typeInfo.label}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full border text-[10px] font-black ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600 bg-slate-50/80 p-2.5 rounded-2xl mb-3">
                      <div className="flex items-center gap-1.5 truncate">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.date}</span>
                      </div>
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{event.location || "غير محدد"}</span>
                      </div>
                    </div>

                    {/* Progress & Financials */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-600">المشتركون: <strong className="text-slate-900">{parts.length}</strong></span>
                        <span className="text-emerald-700">مدفوع: {paidRev.toLocaleString("ar-EG")} ج.م</span>
                      </div>

                      {remRev > 0 && (
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                          <span>باقي مستحقات:</span>
                          <span>{remRev.toLocaleString("ar-EG")} ج.م</span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenEditEvent(event);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition cursor-pointer"
                        title="تعديل بيانات الحدث"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`هل أنت متأكد من حذف فعالية (${event.title})؟`)) {
                            onDeleteEvent(event._id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                        title="حذف الحدث"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ━━━ Left Column: Selected Event Management & Participants ━━━ */}
          <div className="lg:col-span-7">
            {selectedEvent ? (
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-5">
                {/* Event header card */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-600">
                      لوحة المشتركين والمدفوعات
                    </span>
                    <h3 className="font-cairo text-lg font-black text-slate-900">
                      {selectedEvent.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      رسوم الاشتراك: <strong className="text-emerald-700">{selectedEvent.fee} ج.م</strong> • التاريخ: {selectedEvent.date} {selectedEvent.time ? `(${selectedEvent.time})` : ""}
                    </p>
                  </div>

                  {/* Actions for this event */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenAddParticipants(selectedEvent)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 border border-red-200 text-xs font-black text-red-600 hover:bg-red-600 hover:text-white transition active-press cursor-pointer"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      <span>إضافة لاعبين</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportEventCSV(selectedEvent)}
                      className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition active-press cursor-pointer"
                      title="تصدير كشف المشتركين Excel"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppReport(selectedEvent)}
                      className="p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition active-press cursor-pointer"
                      title="مشاركة تقرير الفعالية عبر واتساب"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenEditEvent(selectedEvent)}
                      className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition active-press cursor-pointer"
                      title="تعديل بيانات الحدث"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`هل أنت متأكد من حذف فعالية (${selectedEvent.title})؟`)) {
                          onDeleteEvent(selectedEvent._id);
                        }
                      }}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition active-press cursor-pointer"
                      title="حذف الحدث"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Filter Pills for Participants */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setParticipantFilter("all")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        participantFilter === "all"
                          ? "bg-slate-900 text-white"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                      }`}
                    >
                      الكل ({(selectedEvent.participants || []).length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setParticipantFilter("paid")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        participantFilter === "paid"
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                      }`}
                    >
                      مدفوع بالكامل ({(selectedEvent.participants || []).filter((p) => p.paymentStatus === "paid").length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setParticipantFilter("partial")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        participantFilter === "partial"
                          ? "bg-amber-600 text-white"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                      }`}
                    >
                      دفع جزئي ({(selectedEvent.participants || []).filter((p) => p.paymentStatus === "partially_paid").length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setParticipantFilter("unpaid")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                        participantFilter === "unpaid"
                          ? "bg-rose-600 text-white"
                          : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                      }`}
                    >
                      لم يدفع ({(selectedEvent.participants || []).filter((p) => p.paymentStatus === "unpaid").length})
                    </button>
                  </div>

                  {currentParticipants.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllParticipants}
                      className="text-xs font-black text-slate-600 hover:text-slate-900 underline cursor-pointer shrink-0"
                    >
                      {selectedParticipants.length === currentParticipants.length ? "إلغاء التحديد" : "تحديد الكل"}
                    </button>
                  )}
                </div>

                {/* Bulk Actions Dock (if any selected) */}
                {selectedParticipants.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 text-white shadow-md animate-fade-in">
                    <span className="text-xs font-bold">
                      تم تحديد <strong className="text-red-400 font-black">{selectedParticipants.length}</strong> لاعب
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          await onBulkPayment({
                            eventId: selectedEvent._id,
                            playerIds: selectedParticipants,
                            status: "paid",
                          });
                          setSelectedParticipants([]);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-xs font-black text-white hover:bg-emerald-700 cursor-pointer"
                      >
                        تسجيل سداد كامل
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`هل تريد حذف (${selectedParticipants.length}) لاعبين من هذا الحدث؟`)) {
                            for (const pId of selectedParticipants) {
                              await onRemoveParticipant(selectedEvent._id, pId);
                            }
                            setSelectedParticipants([]);
                          }
                        }}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 text-xs font-black text-white hover:bg-rose-700 cursor-pointer"
                      >
                        حذف من الحدث
                      </button>
                    </div>
                  </div>
                )}

                {/* Participants list */}
                {currentParticipants.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold border-2 border-dashed border-slate-100 rounded-2xl">
                    لا يوجد لاعبين مضافين لهذا الحدث بعد
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => onOpenAddParticipants(selectedEvent)}
                        className="text-xs font-black text-red-600 underline cursor-pointer"
                      >
                        اضغط هنا لاختيار وإضافة أبطال إلى {selectedEvent.title}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {currentParticipants.map((participant) => {
                      const pId = participant.playerId;
                      const isSelected = selectedParticipants.includes(pId);
                      const total = Number(participant.totalAmount ?? selectedEvent.fee ?? 100);
                      const paid = Number(participant.paidAmount ?? 0);
                      const remaining = Math.max(0, total - paid);
                      const beltColor = BELT_HEX[participant.belt] || "#cbd5e1";

                      return (
                        <div
                          key={pId}
                          className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                            isSelected
                              ? "border-red-500 bg-red-50/40 shadow-xs"
                              : "border-slate-200/80 bg-white hover:border-slate-300"
                          }`}
                        >
                          {/* الصف الأول: معلومات اللاعب وأزرار التواصل */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              {/* Checkbox */}
                              <button
                                type="button"
                                onClick={() => handleToggleSelectParticipant(pId)}
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition active-press cursor-pointer ${
                                  isSelected
                                    ? "border-red-600 bg-red-600 text-white"
                                    : "border-slate-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </button>

                              {/* Avatar */}
                              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 overflow-hidden ring-2 ring-slate-100">
                                {participant.photo ? (
                                  <img
                                    src={participant.photo}
                                    alt={participant.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <span className="font-cairo text-sm font-black text-slate-500">
                                    {participant.name?.slice(0, 1) || "ب"}
                                  </span>
                                )}
                                <span
                                  className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white"
                                  style={{ backgroundColor: beltColor }}
                                />
                              </div>

                              {/* Name & Branch */}
                              <div className="min-w-0">
                                <strong className="block truncate font-cairo text-xs sm:text-sm font-black text-slate-900">
                                  {participant.name}
                                </strong>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-semibold text-slate-500">
                                  <span>{participant.branch}</span>
                                  <span>•</span>
                                  <span className="text-slate-700 font-bold">{participant.belt}</span>
                                </div>
                              </div>
                            </div>

                            {/* أزرار الاتصال والواتساب والحذف */}
                            <div className="flex items-center gap-1 shrink-0">
                              {(participant.parentPhone || participant.phone) && (
                                <a
                                  href={`tel:${participant.parentPhone || participant.phone}`}
                                  className="flex h-8 w-8 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 active-press transition"
                                  title="اتصال هاتفي بولي الأمر"
                                >
                                  <Phone className="h-3.5 w-3.5" />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSendParticipantWhatsApp(participant, selectedEvent)}
                                className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active-press transition cursor-pointer"
                                title="إرسال تفاصيل الفعالية عبر واتساب"
                              >
                                <MessageSquare className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`إزالة (${participant.name}) من هذا الحدث؟`)) {
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

                          {/* الصف الثاني: زرا الحضور وحالة السداد */}
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                            {/* Attendance Toggle */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdateAttendance(selectedEvent._id, pId, !participant.attended)
                              }
                              className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-black transition active-press cursor-pointer ${
                                participant.attended
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              {participant.attended ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>حاضر بالفعالية ✓</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-slate-400" />
                                  <span>غائب عن الفعالية</span>
                                </>
                              )}
                            </button>

                            {/* Payment Badge Button */}
                            <button
                              type="button"
                              onClick={() => onOpenPaymentModal(participant, selectedEvent)}
                              className={`min-h-[40px] flex items-center justify-center gap-1.5 px-2 rounded-xl text-xs font-black transition active-press cursor-pointer ${
                                participant.paymentStatus === "paid"
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                                  : participant.paymentStatus === "partially_paid"
                                  ? "bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 shadow-xs"
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
                                  <span className="truncate">دفع {paid} • باقي {remaining}</span>
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
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
