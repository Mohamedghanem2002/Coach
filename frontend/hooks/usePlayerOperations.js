"use client";
import { useState, useCallback } from "react";
import { normalizePlayer } from "../lib/dashboard-utils";
import { broadcastSyncEvent } from "../lib/sync-utils";

export function usePlayerOperations({
  setPlayers,
  setSelected,
  selected,
  branch,
  setBranch,
  setSearch,
  paymentMonth,
  today,
  setNotice,
  showToast,
} = {}) {
  const [showForm, setShowForm] = useState(false);
  const [welcomePlayer, setWelcomePlayer] = useState(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [bulkAttendanceBusy, setBulkAttendanceBusy] = useState(false);

  const updatePlayer = useCallback(
    async (id, data) => {
      if (data.attendanceStatus && data.date > today) {
        setNotice("لا يمكن تسجيل حضور أو غياب في تاريخ مستقبلي.");
        return null;
      }

      // ─── Instant 0ms Optimistic UI for ALL Player Updates ───
      let previousPlayer = null;
      const didOptimistic = true;

      setPlayers((current) =>
        current.map((p) => {
          if (p._id !== id) return p;
          previousPlayer = p;
          let updated = { ...p, ...data };

          if (data.attendanceStatus) {
            const currentAtt = Array.isArray(p.attendance) ? p.attendance : [];
            const filteredAtt = currentAtt.filter((item) => item.date !== data.date);
            if (data.attendanceStatus !== "clear") {
              filteredAtt.push({ date: data.date, status: data.attendanceStatus });
            }
            updated.attendance = filteredAtt;
          }

          if (data.paymentStatus) {
            const month = data.paymentMonth || paymentMonth;
            const history = Array.isArray(p.paymentHistory) ? p.paymentHistory : [];
            const otherPayments = history.filter((pay) => pay.month !== month);
            const amount = p.totalAmount || p.defaultTotalAmount || 0;
            if (data.paymentStatus === "paid") {
              otherPayments.push({
                month,
                status: "paid",
                paidAmount: amount,
                remainingAmount: 0,
                totalAmount: amount,
                updatedAt: new Date().toISOString(),
              });
              updated.paymentStatus = "paid";
              updated.paidAmount = amount;
              updated.remainingAmount = 0;
            } else {
              otherPayments.push({
                month,
                status: "unpaid",
                paidAmount: 0,
                remainingAmount: amount,
                totalAmount: amount,
                updatedAt: new Date().toISOString(),
              });
              updated.paymentStatus = "unpaid";
              updated.paidAmount = 0;
              updated.remainingAmount = amount;
            }
            updated.paymentHistory = otherPayments;
          }

          return normalizePlayer(updated);
        })
      );

      setSelected((current) => {
        if (current?._id !== id) return current;
        let updated = { ...current, ...data };
        if (data.attendanceStatus) {
          const currentAtt = Array.isArray(current.attendance) ? current.attendance : [];
          const filteredAtt = currentAtt.filter((item) => item.date !== data.date);
          if (data.attendanceStatus !== "clear") {
            filteredAtt.push({ date: data.date, status: data.attendanceStatus });
          }
          updated.attendance = filteredAtt;
        }
        if (data.paymentStatus) {
          updated.paymentStatus = data.paymentStatus;
        }
        return normalizePlayer(updated);
      });

      try {
        const response = await fetch("/api/players", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            Object.assign(Object.assign({ id }, data), {
              paymentMonth: data.paymentMonth || paymentMonth,
            })
          ),
        });
        const result = await response.json();
        if (!response.ok || !result) {
          if (didOptimistic && previousPlayer) {
            setPlayers((current) =>
              current.map((p) => (p._id === id ? previousPlayer : p))
            );
            setSelected((current) =>
              current?._id === id ? previousPlayer : current
            );
          }
          setNotice(
            (result === null || result === void 0 ? void 0 : result.error) ||
              "تعذر تحديث بيانات اللاعب."
          );
          return null;
        }
        const safePlayer = normalizePlayer(result);
        setPlayers((current) =>
          current.map((player) => (player._id === id ? safePlayer : player))
        );
        setSelected((current) =>
          (current === null || current === void 0 ? void 0 : current._id) === id
            ? safePlayer
            : current
        );

        broadcastSyncEvent({ type: "PLAYER_UPDATED", player: safePlayer });

        if (data.attendanceStatus) {
          setNotice(
            `تم تسجيل ${data.attendanceStatus === "present" ? "حضور" : "غياب"} اللاعب بنجاح.`
          );
        } else if (data.paymentStatus) {
          setNotice(
            `تم ${data.paymentStatus === "paid" ? "تسجيل دفع" : "إلغاء الدفع"} اللاعب بنجاح.`
          );
        } else if (data.purchaseAction === "add") {
          setNotice(`تم تسجيل السلعة (${data.title || "السلعة"}) بنجاح.`);
        } else if (data.purchaseAction === "toggle_delivery") {
          setNotice(
            data.deliveryStatus === "received"
              ? "تم تسجيل استلام السلعة بنجاح ✓"
              : "تم تغيير حالة السلعة إلى (لم يستلم بعد) ⏳"
          );
        } else if (data.purchaseAction === "update") {
          setNotice("تم تحديث بيانات السلعة بنجاح.");
        } else if (data.purchaseAction === "delete") {
          setNotice("تم حذف السلعة من حساب اللاعب بنجاح.");
        } else {
          setNotice("تم تحديث بيانات اللاعب بنجاح ✓");
        }
        return safePlayer;
      } catch (_a) {
        if (didOptimistic && previousPlayer) {
          setPlayers((current) =>
            current.map((p) => (p._id === id ? previousPlayer : p))
          );
          setSelected((current) =>
            current?._id === id ? previousPlayer : current
          );
        }
        setNotice("تعذر الاتصال بالخادم. حاول مرة أخرى.");
        return null;
      }
    },
    [today, paymentMonth, setPlayers, setSelected, setNotice]
  );

  const handleAddPlayer = useCallback(
    async (playerData) => {
      try {
        const response = await fetch("/api/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(playerData),
        });
        const result = await response.json();
        if (!response.ok) {
          setNotice(result.error || "راجع بيانات اللاعب وحاول مرة أخرى.");
          return;
        }
        const newPlayer = normalizePlayer(result);
        setPlayers((current) => [newPlayer, ...current]);
        setShowForm(false);
        if (branch !== "كل الصالات" && newPlayer.branch && newPlayer.branch !== branch) {
          setBranch(newPlayer.branch);
        }
        setSearch("");
        broadcastSyncEvent({ type: "PLAYER_ADDED", player: newPlayer });
        setNotice("تمت إضافة اللاعب بنجاح! تم تجهيز كارت الترحيب 🥋");
        setWelcomePlayer(newPlayer);
      } catch (_error) {
        setNotice("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      }
    },
    [branch, setBranch, setSearch, setPlayers, setNotice]
  );

  const deletePlayer = useCallback(
    async (id) => {
      const response = await fetch("/api/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) {
        setNotice("تعذر حذف اللاعب.");
        return;
      }
      setPlayers((current) => current.filter((player) => player._id !== id));
      setSelected(null);
      broadcastSyncEvent({ type: "PLAYER_DELETED", id });
      setNotice("تم حذف اللاعب.");
    },
    [setPlayers, setSelected, setNotice]
  );

  const togglePlayerSelection = useCallback((id) => {
    setSelectedPlayerIds((current) =>
      current.includes(id)
        ? current.filter((playerId) => playerId !== id)
        : [...current, id]
    );
  }, []);

  const toggleFilteredSelection = useCallback((filteredPlayers = []) => {
    const filteredIds = filteredPlayers.map((player) => player._id);
    setSelectedPlayerIds((current) => {
      const allSelected = filteredIds.length > 0 && filteredIds.every((id) => current.includes(id));
      return allSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : [...new Set([...current, ...filteredIds])];
    });
  }, []);

  const markSelectedAttendance = useCallback(
    async (status, sessionDate) => {
      if (!selectedPlayerIds.length || bulkAttendanceBusy) return;
      setBulkAttendanceBusy(true);
      const results = await Promise.all(
        selectedPlayerIds.map((id) =>
          updatePlayer(id, {
            attendanceStatus: status,
            date: sessionDate,
          })
        )
      );
      const savedCount = results.filter(Boolean).length;
      setBulkAttendanceBusy(false);
      setSelectedPlayerIds([]);
      if (savedCount) {
        setNotice(
          `تم تسجيل ${status === "present" ? "حضور" : "غياب"} ${savedCount} لاعب.`
        );
      }
    },
    [selectedPlayerIds, bulkAttendanceBusy, updatePlayer, setNotice]
  );

  const markSelectedPayment = useCallback(
    async (status) => {
      if (!selectedPlayerIds.length || bulkAttendanceBusy) return;
      setBulkAttendanceBusy(true);
      const results = await Promise.all(
        selectedPlayerIds.map((id) =>
          updatePlayer(id, { paymentStatus: status })
        )
      );
      const savedCount = results.filter(Boolean).length;
      setBulkAttendanceBusy(false);
      setSelectedPlayerIds([]);
      if (savedCount) {
        setNotice(
          `تم ${status === "paid" ? "تسجيل دفع" : "إلغاء دفع"} ${savedCount} لاعب.`
        );
      }
    },
    [selectedPlayerIds, bulkAttendanceBusy, updatePlayer, setNotice]
  );

  const deleteSelectedPlayers = useCallback(async () => {
    if (!selectedPlayerIds.length || bulkAttendanceBusy) return;
    const count = selectedPlayerIds.length;
    const confirmMessage =
      count === 1
        ? "هل أنت متأكد من حذف هذا اللاعب نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        : `هل أنت متأكد من حذف ${count} لاعبين محددين نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`;
    if (!window.confirm(confirmMessage)) return;

    setBulkAttendanceBusy(true);
    try {
      const response = await fetch("/api/players", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedPlayerIds }),
      });
      if (!response.ok) {
        setNotice("تعذر حذف اللاعبين المحددين.");
        return;
      }
      const data = await response.json();
      const deletedCount = data.deletedCount || count;
      setPlayers((current) =>
        current.filter((p) => !selectedPlayerIds.includes(p._id))
      );
      if (selected && selectedPlayerIds.includes(selected._id)) {
        setSelected(null);
      }
      broadcastSyncEvent({ type: "BULK_PLAYERS_DELETED", ids: selectedPlayerIds });
      setSelectedPlayerIds([]);
      setNotice(`✓ تم حذف ${deletedCount} لاعب بنجاح.`);
    } catch (err) {
      console.error("Bulk delete error:", err);
      setNotice("حدث خطأ أثناء حذف اللاعبين.");
    } finally {
      setBulkAttendanceBusy(false);
    }
  }, [selectedPlayerIds, bulkAttendanceBusy, selected, setPlayers, setSelected, setNotice]);

  return {
    showForm,
    setShowForm,
    welcomePlayer,
    setWelcomePlayer,
    selectedPlayerIds,
    setSelectedPlayerIds,
    bulkAttendanceBusy,
    updatePlayer,
    handleAddPlayer,
    deletePlayer,
    togglePlayerSelection,
    toggleFilteredSelection,
    markSelectedAttendance,
    markSelectedPayment,
    deleteSelectedPlayers,
  };
}
