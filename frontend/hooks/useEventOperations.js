"use client";
import { useState, useCallback } from "react";
import { broadcastSyncEvent } from "../lib/sync-utils";

export function useEventOperations({
  events,
  setEvents,
  showToast,
} = {}) {
  const [activeView, setActiveView] = useState("players"); // "players" | "events" | "finances" | "birthdays" | "branches"
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [addParticipantsEvent, setAddParticipantsEvent] = useState(null);
  const [paymentParticipantData, setPaymentParticipantData] = useState(null);
  const [eventActionBusy, setEventActionBusy] = useState(false);

  const handleSaveEvent = useCallback(
    async (data) => {
      setEventActionBusy(true);
      try {
        const isEditing = Boolean(data.id);
        const res = await fetch("/api/events", {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        const saved = await res.json();
        if (isEditing) {
          setEvents((prev) => prev.map((e) => (e._id === saved._id ? saved : e)));
          showToast("تم تحديث بيانات الفعالية بنجاح");
        } else {
          setEvents((prev) => [saved, ...prev]);
          showToast("تم إنشاء الفعالية بنجاح");
        }
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
        setShowAddEventModal(false);
        setEditingEvent(null);
      } catch {
        showToast("تعذر حفظ الفعالية، يرجى المحاولة ثانية", "error");
      } finally {
        setEventActionBusy(false);
      }
    },
    [setEvents, showToast]
  );

  const handleDeleteEvent = useCallback(
    async (eventId) => {
      try {
        const res = await fetch(`/api/events?id=${eventId}`, { method: "DELETE" });
        if (!res.ok) throw new Error();
        setEvents((prev) => prev.filter((e) => e._id !== eventId));
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
        showToast("تم حذف الفعالية بنجاح");
      } catch {
        showToast("تعذر حذف الفعالية", "error");
      }
    },
    [setEvents, showToast]
  );

  const handleAddParticipants = useCallback(
    async ({ eventId, playerIds, fee }) => {
      setEventActionBusy(true);
      try {
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            action: "add_participants",
            playerIds,
            fee,
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
        showToast(`تمت إضافة (${playerIds.length}) لاعبين إلى الفعالية بنجاح`);
        setAddParticipantsEvent(null);
      } catch {
        showToast("تعذر إضافة اللاعبين للفعالية", "error");
      } finally {
        setEventActionBusy(false);
      }
    },
    [setEvents, showToast]
  );

  const handleSaveParticipantPayment = useCallback(
    async ({ playerId, paidAmount, totalAmount, notes }) => {
      if (!paymentParticipantData?.event?._id) return;
      setEventActionBusy(true);
      try {
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId: paymentParticipantData.event._id,
            action: "update_payment",
            playerId,
            paidAmount,
            totalAmount,
            notes,
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
        showToast("تم تسجيل دفعة الفعالية بنجاح");
        setPaymentParticipantData(null);
      } catch {
        showToast("تعذر حفظ دفعة الفعالية", "error");
      } finally {
        setEventActionBusy(false);
      }
    },
    [paymentParticipantData, setEvents, showToast]
  );

  const handleUpdateParticipantAttendance = useCallback(
    async (eventId, playerId, attended) => {
      try {
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            action: "update_attendance",
            playerId,
            attended,
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
      } catch {
        showToast("تعذر تحديث الحضور", "error");
      }
    },
    [setEvents, showToast]
  );

  const handleRemoveParticipant = useCallback(
    async (eventId, playerId) => {
      try {
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            action: "remove_participant",
            playerId,
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
        showToast("تمت إزالة اللاعب من الفعالية");
      } catch {
        showToast("تعذر إزالة اللاعب", "error");
      }
    },
    [setEvents, showToast]
  );

  const handleBulkParticipantPayment = useCallback(
    async ({ eventId, playerIds, status }) => {
      try {
        const res = await fetch("/api/events", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventId,
            action: "bulk_payment",
            playerIds,
            status,
          }),
        });
        if (!res.ok) throw new Error();
        const updated = await res.json();
        setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
        broadcastSyncEvent({ type: "EVENTS_UPDATED" });
        showToast("تم تحديث السداد الجماعي بنجاح");
      } catch {
        showToast("تعذر تحديث السداد الجماعي", "error");
      }
    },
    [setEvents, showToast]
  );

  return {
    activeView,
    setActiveView,
    showAddEventModal,
    setShowAddEventModal,
    editingEvent,
    setEditingEvent,
    addParticipantsEvent,
    setAddParticipantsEvent,
    paymentParticipantData,
    setPaymentParticipantData,
    eventActionBusy,
    handleSaveEvent,
    handleDeleteEvent,
    handleAddParticipants,
    handleSaveParticipantPayment,
    handleUpdateParticipantAttendance,
    handleRemoveParticipant,
    handleBulkParticipantPayment,
  };
}
