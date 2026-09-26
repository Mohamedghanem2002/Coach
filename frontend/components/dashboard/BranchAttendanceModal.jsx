"use client";
import { useEffect, useState } from "react";
import { X, Download, MessageCircle, FileText, AlertCircle } from "lucide-react";
import {
  generateBranchAttendanceCardCanvas,
  formatArabicSessionDate,
} from "../../lib/branch-attendance-card-utils";
import { openWhatsAppDirect } from "../../lib/dashboard-utils";
import { copyBlobToClipboard } from "../../lib/birthday-card-utils";

export default function BranchAttendanceModal({
  branchName,
  sessionDate,
  players = [],
  captainName = "كابتن الأكاديمية",
  isOpen,
  onClose,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notice, setNotice] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  const isLoading = isOpen && !dataUrl && !loadError;

  // Compute quick counts for modal header
  const branchPlayers =
    !branchName || branchName === "كل الصالات"
      ? [...players]
      : players.filter((p) => p.branch === branchName);

  const presentCount = branchPlayers.filter((p) =>
    (p.attendance || []).some(
      (a) => a.date === sessionDate && a.status === "present"
    )
  ).length;
  const absentCount = branchPlayers.length - presentCount;

  useEffect(() => {
    if (!isOpen) return undefined;

    let isMounted = true;

    generateBranchAttendanceCardCanvas({
      branchName,
      sessionDate,
      players,
      captainName,
    })
      .then((canvas) => {
        if (!isMounted) return;
        if (!canvas) {
          setLoadError(true);
          return;
        }

        const url = canvas.toDataURL("image/png");
        setDataUrl(url);

        canvas.toBlob((b) => {
          if (isMounted && b) {
            setBlob(b);
          }
        }, "image/png");
      })
      .catch((err) => {
        console.error("Branch attendance card error:", err);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
      setDataUrl("");
      setBlob(null);
      setLoadError(false);
      setNotice("");
      setWhatsAppUrl("");
    };
  }, [isOpen, branchName, sessionDate, players, captainName]);

  if (!isOpen) return null;

  const fileName = `كشف_حضور_صالة_${(branchName || "الصالة").replace(/\s+/g, "_")}_${sessionDate || "حصة"}.png`;

  const handleDownload = () => {
    if (!blob) return;
    setIsDownloading(true);
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      setNotice("✓ تم حفظ وتحميل كارت الحضور والغياب بجهازك بنجاح!");
    } catch (e) {
      console.error(e);
      setNotice("❌ حدث خطأ أثناء تحميل كارت الحضور.");
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handleSendToWhatsApp = async () => {
    if (!blob) return;
    setIsSending(true);
    setWhatsAppUrl("");

    const isMobile =
      typeof navigator !== "undefined" &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

    // 1. Synchronously pre-open blank window on desktop inside the user click gesture
    // This permanently prevents browsers from blocking the popup window
    let preWin = null;
    if (!isMobile) {
      try {
        preWin = window.open("about:blank", "_blank");
      } catch (_) {}
    }

    try {
      // 2. Fast copy image to clipboard as PNG
      const copied = await copyBlobToClipboard(blob);

      // 3. Fallback auto-save if clipboard is unsupported
      if (!copied) {
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 2500);
        } catch (_) {}
      }

      // 4. Open WhatsApp directly to chat or general selection
      openWhatsAppDirect("", "", preWin);

      const targetLink = isMobile ? "whatsapp://send" : "https://web.whatsapp.com";
      setWhatsAppUrl(targetLink);

      setNotice(
        copied
          ? "✓ تم نسخ كارت الحضور والغياب للحافظة وجاري فتح واتساب! اختر المحادثة المطلوبة ثم الصق الصورة (Paste) 🥋"
          : "✓ تم حفظ كارت الحضور والغياب بجهازك وجاري فتح واتساب! اختر المحادثة المطلوبة لإرسالها 🥋"
      );
    } catch (err) {
      console.error(err);
      if (preWin && !preWin.closed) {
        try {
          preWin.close();
        } catch (_) {}
      }
      setNotice("❌ حدث خطأ أثناء تجهيز أو إرسال كارت الحضور.");
    } finally {
      setTimeout(() => setIsSending(false), 800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm animate-fade-in-scale"
      dir="rtl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[95vh] w-full max-w-lg sm:max-w-xl overflow-y-auto rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-5 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600/20 text-red-500 border border-red-500/30">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-cairo text-sm sm:text-base font-black text-red-400 truncate">
                كارت تقرير الحضور والغياب للصالة
              </h3>
              <p className="text-[11px] text-slate-400 font-semibold truncate">
                صالة: {branchName || "كل الصالات"} • {formatArabicSessionDate(sessionDate)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stats Pill Strip */}
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-800/50 p-2">
            <span className="block text-[10px] text-emerald-400 font-bold">الحاضرون</span>
            <strong className="font-cairo text-sm font-black text-emerald-300">{presentCount} بطل 🥋</strong>
          </div>
          <div className="rounded-xl bg-rose-950/40 border border-rose-800/50 p-2">
            <span className="block text-[10px] text-rose-400 font-bold">الغائبون</span>
            <strong className="font-cairo text-sm font-black text-rose-300">{absentCount} بطل ⚠️</strong>
          </div>
          <div className="rounded-xl bg-slate-800/60 border border-slate-700 p-2">
            <span className="block text-[10px] text-slate-400 font-bold">الإجمالي</span>
            <strong className="font-cairo text-sm font-black text-white">{branchPlayers.length} لاعب</strong>
          </div>
        </div>

        {/* Card Canvas Preview */}
        <div className="relative mb-3 flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/80 p-2 sm:p-3 min-h-[300px] overflow-hidden">
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <div className="h-9 w-9 rounded-full border-3 border-red-500/30 border-t-red-500 animate-spin" />
              <p className="font-cairo text-xs font-bold animate-pulse text-red-300">
                جاري توليد وتجهيز كارت الحضور والغياب للصالة...
              </p>
            </div>
          )}

          {loadError && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-rose-400">
              <AlertCircle className="h-8 w-8 text-rose-500" />
              <p className="text-xs font-bold">تعذر توليد كارت الحضور. يرجى المحاولة ثانية.</p>
            </div>
          )}

          {dataUrl && !isLoading && (
            <div className="w-full flex justify-center">
              <img
                src={dataUrl}
                alt={`كشف حضور صالة ${branchName}`}
                className="max-h-[58vh] sm:max-h-[62vh] w-auto max-w-full rounded-xl object-contain shadow-2xl border border-slate-800"
              />
            </div>
          )}
        </div>

        {/* Notice feedback */}
        {notice && (
          <div
            className={`mb-3 rounded-xl p-2.5 text-center text-xs font-bold transition leading-relaxed ${
              notice.startsWith("❌")
                ? "bg-rose-950/80 text-rose-200 border border-rose-800"
                : notice.startsWith("⚠️")
                ? "bg-amber-950/80 text-amber-200 border border-amber-800"
                : "bg-emerald-950/80 text-emerald-200 border border-emerald-800"
            }`}
          >
            <div>{notice}</div>
            {whatsAppUrl && !notice.startsWith("❌") && (
              <div className="mt-2 pt-2 border-t border-emerald-800/60 flex items-center justify-center">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>إذا لم تفتح المحادثة تلقائياً، اضغط هنا لفتح واتساب مباشرة</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: [ حفظ ] [ إرسال عبر واتساب ] */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            disabled={isLoading || isDownloading || !blob}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-3 text-xs font-black text-slate-100 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[48px]"
            title="تحميل وحفظ صورة كارت الحضور والغياب بجهازك"
          >
            {isDownloading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>حفظ</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isLoading || isSending || !blob}
            onClick={handleSendToWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 p-3 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition active-press disabled:opacity-50 cursor-pointer min-h-[48px]"
            title="نسخ كارت الحضور والغياب وفتح واتساب مباشرة لإرسالها"
          >
            {isSending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري الإرسال...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>إرسال عبر واتساب</span>
              </>
            )}
          </button>
        </div>

        {/* Helper Tip */}
        <p className="mt-2 text-center text-[10px] text-slate-500">
          💡 يمكنك إرسال الكارت مباشرة لجروب أولياء الأمور عبر واتساب أو حفظه كصورة عالية الدقة.
        </p>
      </div>
    </div>
  );
}
