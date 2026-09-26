"use client";
import { useState, useEffect, useRef } from "react";
import {
  RotateCcw,
  Sparkles,
  CloudDownload,
  UploadCloud,
  CheckCircle2,
  Calendar,
  Users,
  Building2,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

export default function RestoreModal({
  isOpen,
  onClose,
  showToast,
  onRestoreSuccess,
}) {
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [snapshots, setSnapshots] = useState([]);
  const [restoringId, setRestoringId] = useState(null);
  const [showOlderSnapshots, setShowOlderSnapshots] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
    }
  }, [isOpen]);

  async function fetchSnapshots() {
    setLoadingSnapshots(true);
    try {
      const res = await fetch("/api/backup/snapshots");
      if (res.ok) {
        const data = await res.json();
        setSnapshots(Array.isArray(data.snapshots) ? data.snapshots : []);
      }
    } catch (err) {
      console.error("Failed to load snapshots:", err);
    } finally {
      setLoadingSnapshots(false);
    }
  }

  // 1-Click Cloud Restore
  async function handleRestoreSnapshot(snapshot) {
    const isLatest = snapshot.isLatest;
    const confirmMsg = isLatest
      ? `هل أنت متأكد من استرجاع أحدث نسخة سحابية؟\n\n- عدد اللاعبين: ${snapshot.playersCount}\n- عدد الصالات: ${snapshot.branchesCount}\n- التاريخ: ${snapshot.date} (${snapshot.time})\n\nسيتم استبدال البيانات الحالية بالنسخة المحفوظة فوراً.`
      : `هل أنت متأكد من استرجاع هذه النسخة السابقة؟\n\n- التاريخ: ${snapshot.date} (${snapshot.time})\n- عدد اللاعبين: ${snapshot.playersCount}\n\nسيتم استرجاع هذه النسخة فوراً.`;

    if (!window.confirm(confirmMsg)) return;

    setRestoringId(snapshot.id);
    try {
      const res = await fetch("/api/backup/snapshots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ snapshotId: snapshot.id }),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(result.error || result.details || "تعذر استرجاع النسخة السحابية", "error");
        return;
      }

      showToast(`✓ تمت استرجاع النسخة السحابية بنجاح! (${result.stats?.playersRestored || snapshot.playersCount} لاعب)`);
      if (typeof onRestoreSuccess === "function") {
        await onRestoreSuccess();
      }
      onClose();
    } catch {
      showToast("حدث خطأ أثناء الاتصال بالخادم للاسترجاع", "error");
    } finally {
      setRestoringId(null);
    }
  }

  // File Upload Restore (Fallback)
  async function handleManualFileSelected(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const backupData = parsed?.data || parsed;
      const countPlayers = (backupData.players || []).length;
      const countBranches = (backupData.branches || []).length;

      if (!countPlayers && !countBranches) {
        showToast("الملف المحدد لا يحتوي على بيانات صالحة للاستعادة.", "error");
        return;
      }

      const confirmed = window.confirm(
        `هل تريد استرجاع النسخة من الملف المحدد؟\n\n- عدد اللاعبين: ${countPlayers}\n- عدد الصالات: ${countBranches}\n\nسيتم استرجاع هؤلاء اللاعبين فوراً إلى النظام.`
      );
      if (!confirmed) return;

      setUploadingFile(true);
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(result.error || result.details || "تعذر استعادة النسخة من الملف", "error");
        return;
      }

      showToast(`✓ تمت الاستعادة بنجاح من الملف! (${countPlayers} لاعب)`);
      if (typeof onRestoreSuccess === "function") {
        await onRestoreSuccess();
      }
      onClose();
    } catch {
      showToast("ملف غير صالح أو حدث خطأ أثناء قراءة الملف", "error");
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  if (!isOpen) return null;

  const latestSnapshot = snapshots.find((s) => s.isLatest) || snapshots[0];
  const olderSnapshots = snapshots.filter((s) => s !== latestSnapshot);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-4 backdrop-blur-xs animate-backdrop"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 shadow-2xs">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-cairo text-base font-black text-slate-900">
                استعادة النسخة الاحتياطية
              </h3>
              <p className="text-xs font-semibold text-slate-500">
                استرجع بيانات الأكاديمية واللاعبين بضغطة واحدة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: 1-Click Cloud Restore (Hero) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-cairo text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              <span>الاسترجاع السحابي الفوري (بدون تنزيل ملفات)</span>
            </span>
            <button
              type="button"
              onClick={fetchSnapshots}
              disabled={loadingSnapshots}
              className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition"
            >
              <RefreshCw className={`h-3 w-3 ${loadingSnapshots ? "animate-spin" : ""}`} />
              <span>تحديث</span>
            </button>
          </div>

          {loadingSnapshots ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-center text-xs font-bold text-slate-500 space-y-2">
              <RefreshCw className="h-5 w-5 mx-auto animate-spin text-emerald-600" />
              <div>جاري فحص النسخ السحابية المحفوظة...</div>
            </div>
          ) : latestSnapshot ? (
            <div className="rounded-2xl border-2 border-emerald-500 bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-4 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-cairo text-xs font-black text-emerald-950">
                    أحدث نسخة سحابية متوفرة
                  </span>
                </div>
                <span className="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-2xs">
                  جاهزة للاسترجاع
                </span>
              </div>

              {/* Snapshot Details */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-emerald-100 text-slate-700">
                  <Users className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">اللاعبين</div>
                    <div className="font-black text-slate-900">{latestSnapshot.playersCount} لاعب</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-2.5 border border-emerald-100 text-slate-700">
                  <Building2 className="h-4 w-4 text-teal-600 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500">الصالات</div>
                    <div className="font-black text-slate-900">{latestSnapshot.branchesCount} صالة</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white/60 p-2 rounded-xl border border-emerald-100/60">
                <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                <span>تاريخ الحفظ: {latestSnapshot.date} - الساعة {latestSnapshot.time}</span>
              </div>

              {/* Big 1-Click Action Button */}
              <button
                type="button"
                onClick={() => handleRestoreSnapshot(latestSnapshot)}
                disabled={restoringId !== null}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-cairo font-black text-sm shadow-md transition cursor-pointer"
              >
                <CloudDownload className="h-4 w-4" />
                <span>
                  {restoringId === latestSnapshot.id
                    ? "جار استرجاع البيانات الآن..."
                    : "استرجاع أحدث نسخة سحابية فوراً (ضغطة واحدة)"}
                </span>
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-600 space-y-1">
              <AlertTriangle className="h-5 w-5 mx-auto text-amber-500" />
              <div className="font-black text-slate-800">لا توجد نسخ سحابية محفوظة بعد اليوم</div>
              <p className="text-[11px] text-slate-500">
                سيقوم النظام بإنشاء نسخة تلقائية يومياً، أو يمكنك الضغط على «نسخ احتياطي» بالأعلى لحفظ نسخة الآن.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Older Snapshots */}
        {olderSnapshots.length > 0 && (
          <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50/50 space-y-2">
            <button
              type="button"
              onClick={() => setShowOlderSnapshots(!showOlderSnapshots)}
              className="w-full flex items-center justify-between text-xs font-black text-slate-700 hover:text-slate-900 transition"
            >
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>النسخ المحفوظة السابقة ({olderSnapshots.length})</span>
              </span>
              {showOlderSnapshots ? (
                <ChevronUp className="h-4 w-4 text-slate-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-slate-500" />
              )}
            </button>

            {showOlderSnapshots && (
              <div className="space-y-2 pt-2 border-t border-slate-200">
                {olderSnapshots.map((snap) => (
                  <div
                    key={snap.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{snap.date} - {snap.time}</div>
                      <div className="text-[10px] text-slate-500">
                        {snap.playersCount} لاعب • {snap.branchesCount} صالة
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snap)}
                      disabled={restoringId !== null}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs transition cursor-pointer"
                    >
                      {restoringId === snap.id ? "جار الاسترجاع..." : "استرجاع"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Section 3: Manual File Upload (Fallback) */}
        <div className="pt-1 border-t border-slate-100">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleManualFileSelected}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingFile}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 bg-slate-50/60 hover:bg-slate-100/60 text-slate-600 font-bold text-xs transition cursor-pointer"
          >
            <UploadCloud className="h-4 w-4 text-slate-500" />
            <span>
              {uploadingFile
                ? "جار قراءة الملف واسترجاعه..."
                : "أو اختيار ملف نسخة احتياطية (.json) من جهازك يدوياً"}
            </span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
