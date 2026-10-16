"use client";
import { useState, useRef, useCallback } from "react";

export function useBackupOperations({
  players,
  reloadAllData,
  showToast,
} = {}) {
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isCloudBackingUp, setIsCloudBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgressModal, setRestoreProgressModal] = useState(null);
  const [showEmailBackupModal, setShowEmailBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showExportExcelModal, setShowExportExcelModal] = useState(false);
  const [exportInitialTab, setExportInitialTab] = useState("players");
  const [exportInitialEventId, setExportInitialEventId] = useState(null);

  const restoreFileRef = useRef(null);

  const handleOpenExportExcel = useCallback((tab = "players", eventId = null) => {
    setExportInitialTab(tab);
    setExportInitialEventId(eventId);
    setShowExportExcelModal(true);
  }, []);

  const handleInstantCloudBackup = useCallback(async () => {
    if (isCloudBackingUp) return;
    setIsCloudBackingUp(true);
    try {
      const res = await fetch("/api/backup/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_snapshot" }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(result.error || result.details || "تعذر حفظ النسخة السحابية", "error");
        return;
      }

      showToast(`✓ تم حفظ النسخة السحابية بنجاح! تم تأمين بيانات (${result.stats?.playersCount ?? players?.length ?? 0}) لاعب.`);
    } catch {
      showToast("تعذر الاتصال بالخادم لحفظ النسخة السحابية", "error");
    } finally {
      setIsCloudBackingUp(false);
    }
  }, [isCloudBackingUp, players, showToast]);

  const handleDownloadBackup = useCallback(async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      a.download = `نسخة_احتياطية_أكاديمية_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showToast("✓ تم تنزيل النسخة الاحتياطية بنجاح. احتفظ بالملف في مكان آمن.");
    } catch {
      showToast("تعذر تنزيل النسخة الاحتياطية. حاول مرة أخرى.", "error");
    } finally {
      setIsBackingUp(false);
    }
  }, [isBackingUp, showToast]);

  const handleFileSelectedForRestore = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (restoreFileRef.current) restoreFileRef.current.value = "";

      const sizeStr = (bytes) => {
        if (!bytes || bytes === 0) return "0 بايت";
        const k = 1024;
        const sizes = ["بايت", "كيلوبايت", "ميجابايت", "جيجابايت"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
      };

      const formattedSize = sizeStr(file.size);

      // 1. Immediately activate loader
      setIsRestoring(true);
      setRestoreProgressModal({
        status: "reading",
        fileName: file.name,
        fileSize: formattedSize,
        stepText: "جارٍ قراءة وفحص ملف النسخة من ذاكرة الجهاز...",
        subText: "يتم قراءة محتوى الملف والتحقق من سلامة البيانات",
      });

      try {
        await new Promise((r) => setTimeout(r, 80));
        const text = await file.text();

        setRestoreProgressModal((prev) => ({
          ...prev,
          status: "analyzing",
          stepText: "جارٍ فحص سلامة البيانات وتوافق اللاعبين...",
        }));

        await new Promise((r) => setTimeout(r, 80));

        let parsed;
        try {
          parsed = JSON.parse(text);
        } catch {
          setRestoreProgressModal(null);
          setIsRestoring(false);
          showToast("الملف المحدد ليس ملف JSON صالحاً أو تالف.", "error");
          return;
        }

        const backupData = parsed?.data || parsed;
        const countPlayers = (backupData.players || []).length;
        const countBranches = (backupData.branches || []).length;

        if (!countPlayers && !countBranches) {
          setRestoreProgressModal(null);
          setIsRestoring(false);
          showToast("الملف المحدد لا يحتوي على بيانات صالحة للاستعادة.", "error");
          return;
        }

        setRestoreProgressModal((prev) => ({
          ...prev,
          status: "restoring",
          stepText: `جارٍ استرجاع وحفظ البيانات في السحابة (${countPlayers} لاعب)...`,
          subText: "يتم الآن تحديث قاعدة بيانات الأكاديمية وربط الحساب",
        }));

        let res;
        try {
          res = await fetch("/api/backup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed),
          });
        } catch (networkErr) {
          console.warn("/api/backup network error, will try /api/players fallback:", networkErr);
        }

        if (!res || !res.ok) {
          try {
            res = await fetch("/api/players", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "restore_backup", data: backupData }),
            });
          } catch (playerErr) {
            console.error("/api/players fallback error:", playerErr);
          }
        }

        const rawText = res ? await res.text() : "";
        let result = {};
        try {
          result = JSON.parse(rawText);
        } catch {
          result = { error: rawText.slice(0, 200) };
        }

        if (!res || !res.ok) {
          const errorMsg = result.details
            ? `${result.error || "تعذر استعادة النسخة الاحتياطية"}: ${result.details}`
            : result.error || `تعذر استعادة النسخة الاحتياطية (${res?.status || "خطأ اتصال"})`;
          setRestoreProgressModal(null);
          setIsRestoring(false);
          showToast(errorMsg, "error");
          return;
        }

        setRestoreProgressModal((prev) => ({
          ...prev,
          status: "success",
          stepText: "تمت الاستعادة بنجاح!",
          subText: `تم استرجاع (${result.stats?.playersRestored ?? countPlayers}) لاعب و (${result.stats?.branchesRestored ?? countBranches}) صالة`,
        }));

        if (typeof reloadAllData === "function") {
          await reloadAllData();
        }

        showToast(`✓ تمت الاستعادة بنجاح! تم استرجاع (${result.stats?.playersRestored ?? countPlayers}) لاعب.`);

        setTimeout(() => {
          setRestoreProgressModal(null);
          setIsRestoring(false);
        }, 1200);
      } catch (err) {
        console.error("Restore failed:", err);
        setRestoreProgressModal(null);
        setIsRestoring(false);
        showToast("حدث خطأ أثناء قراءة ملف النسخة الاحتياطية.", "error");
      } finally {
        if (restoreFileRef.current) restoreFileRef.current.value = "";
      }
    },
    [reloadAllData, showToast]
  );

  return {
    isBackingUp,
    isCloudBackingUp,
    isRestoring,
    restoreProgressModal,
    setRestoreProgressModal,
    showEmailBackupModal,
    setShowEmailBackupModal,
    showRestoreModal,
    setShowRestoreModal,
    showExportExcelModal,
    setShowExportExcelModal,
    exportInitialTab,
    exportInitialEventId,
    restoreFileRef,
    handleOpenExportExcel,
    handleInstantCloudBackup,
    handleDownloadBackup,
    handleFileSelectedForRestore,
  };
}
