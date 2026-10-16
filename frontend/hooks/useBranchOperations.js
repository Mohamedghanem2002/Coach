"use client";
import { useState, useCallback } from "react";
import { isBranchWorkingDate } from "../lib/dashboard-utils";
import { broadcastSyncEvent } from "../lib/sync-utils";

export function useBranchOperations({
  branches,
  setBranches,
  players,
  setPlayers,
  branch,
  setBranch,
  playerListRef,
  showToast,
  setNotice,
} = {}) {
  const [showBranches, setShowBranches] = useState(false);
  const [quickBranchName, setQuickBranchName] = useState("");
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [busyBranch, setBusyBranch] = useState("");
  const [branchAttendanceReport, setBranchAttendanceReport] = useState(null);

  const addBranch = useCallback(
    async (name, days = []) => {
      try {
        const response = await fetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, days }),
        });
        const data = await response.json();
        if (!response.ok) {
          const errMsg = data.error || "تعذر إضافة الفرع.";
          showToast(errMsg, "error");
          setNotice(errMsg);
          return null;
        }
        const nextBranches = [...branches, data];
        setBranches(nextBranches);
        broadcastSyncEvent({ type: "BRANCHES_UPDATED", branches: nextBranches });
        showToast("تمت إضافة الصالة ومواعيدها بنجاح.");
        setNotice("تمت إضافة الفرع بنجاح.");
        return data;
      } catch {
        showToast("تعذر الاتصال بالخادم لإضافة الصالة.", "error");
        return null;
      }
    },
    [branches, setBranches, showToast, setNotice]
  );

  const updateBranch = useCallback(
    async (oldName, { newName, days }) => {
      try {
        const response = await fetch("/api/branches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ oldName, newName, days }),
        });
        const data = await response.json();
        if (!response.ok) {
          const errMsg = data.error || "تعذر تعديل بيانات الفرع.";
          showToast(errMsg, "error");
          return { success: false, error: errMsg };
        }
        const effectiveName = data.newName || oldName;
        const nextBranches = branches.map((b) =>
          (b.name || "").trim() === (oldName || "").trim()
            ? {
                ...b,
                name: effectiveName,
                days: data.days !== undefined ? data.days : b.days,
              }
            : b
        );
        setBranches(nextBranches);
        broadcastSyncEvent({ type: "BRANCHES_UPDATED", branches: nextBranches });
        if (data.newName && data.newName !== oldName) {
          setPlayers((current) =>
            current.map((p) =>
              (p.branch || "").trim() === (oldName || "").trim()
                ? { ...p, branch: data.newName }
                : p
            )
          );
          if (branch === oldName) setBranch(data.newName);
          showToast(`تم تعديل اسم الفرع إلى "${data.newName}" وتحديث جميع بيانات اللاعبين.`);
        } else {
          showToast("تم تحديث مواعيد وأيام عمل الصالة بنجاح.");
        }
        return { success: true };
      } catch {
        showToast("تعذر الاتصال بالخادم لتعديل بيانات الفرع.", "error");
        return { success: false };
      }
    },
    [branches, setBranches, setPlayers, branch, setBranch, showToast]
  );

  const renameBranch = useCallback(
    (oldName, newName) => updateBranch(oldName, { newName }),
    [updateBranch]
  );

  const deleteBranch = useCallback(
    async (name) => {
      const response = await fetch("/api/branches", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error || "تعذر حذف الفرع.");
        return;
      }
      const nextBranches = branches.filter((branchItem) => branchItem.name !== name);
      setBranches(nextBranches);
      broadcastSyncEvent({ type: "BRANCHES_UPDATED", branches: nextBranches });
      if (branch === name) setBranch("كل الصالات");
      setNotice("تم حذف الفرع.");
    },
    [branches, setBranches, branch, setBranch, setNotice]
  );

  const handleSelectBranch = useCallback(
    (name) => {
      setBranch(name);
      if (playerListRef?.current) {
        window.setTimeout(() => {
          playerListRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 80);
      }
    },
    [setBranch, playerListRef]
  );

  const handleBlockedBranchDelete = useCallback(
    (name, playerCount) => {
      setNotice(
        `لا يمكن حذف ${name} لأنها تحتوي على ${playerCount} لاعب. انقل اللاعبين أولًا إلى صالة أخرى.`
      );
    },
    [setNotice]
  );

  const handleQuickBranchSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!quickBranchName.trim()) return;
      await addBranch(quickBranchName.trim());
      setQuickBranchName("");
      setIsAddingBranch(false);
    },
    [quickBranchName, addBranch]
  );

  const markBranchPresent = useCallback(
    async (branchName, sessionDate, updatePlayer) => {
      const branchPlayers = players.filter(
        (player) => player.branch === branchName
      );
      if (!branchPlayers.length) {
        setNotice("لا يوجد لاعبين مسجلين في هذه الصالة.");
        return;
      }
      const targetBranch = (branches || []).find((b) => b.name === branchName);
      if (targetBranch && !isBranchWorkingDate(targetBranch, sessionDate)) {
        setNotice(`لا يمكن تسجيل الحضور لأن الوقت الحالي خارج مواعيد عمل صالة ${branchName}.`);
        return;
      }
      setBusyBranch(branchName);
      const results = await Promise.all(
        branchPlayers.map((player) =>
          updatePlayer(player._id, {
            attendanceStatus: "present",
            date: sessionDate,
          })
        )
      );
      setBusyBranch("");
      const savedCount = results.filter(Boolean).length;
      if (savedCount) {
        setNotice(`تم تسجيل حضور ${savedCount} لاعب من ${branchName}.`);
      }
    },
    [players, branches, setNotice]
  );

  return {
    showBranches,
    setShowBranches,
    quickBranchName,
    setQuickBranchName,
    isAddingBranch,
    setIsAddingBranch,
    busyBranch,
    branchAttendanceReport,
    setBranchAttendanceReport,
    addBranch,
    updateBranch,
    renameBranch,
    deleteBranch,
    handleSelectBranch,
    handleBlockedBranchDelete,
    handleQuickBranchSubmit,
    markBranchPresent,
  };
}
