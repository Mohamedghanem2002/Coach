"use client";
import { useEffect, useState } from "react";
import { X, Download, Send, ClipboardCopy, Share2, MessageCircle } from "lucide-react";
import {
  generateBirthdayCardCanvas,
  sendBirthdayCardViaWhatsApp,
  shareBirthdayCard,
  downloadBirthdayCard,
} from "../../lib/birthday-card-utils";

export default function BirthdayCardModal({
  player,
  captainName = "كابتن الأكاديمية",
  isOpen,
  onClose,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState("");

  const isLoading = isOpen && !dataUrl && !loadError;

  const phone =
    player?.guardianPhone ||
    player?.parentPhone ||
    player?.guardianMobile ||
    player?.mobile ||
    player?.phone ||
    "";

  useEffect(() => {
    if (!isOpen || !player) return undefined;

    let isMounted = true;

    generateBirthdayCardCanvas(player, captainName)
      .then((canvas) => {
        if (!isMounted) return;
        if (!canvas) {
          setLoadError(true);
          return;
        }

        const url = canvas.toDataURL("image/png");
        setDataUrl(url);

        canvas.toBlob((b) => {
          if (isMounted) {
            setBlob(b);
          }
        }, "image/png");
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
      setDataUrl("");
      setBlob(null);
      setLoadError(false);
      setNotice("");
    };
  }, [isOpen, player, captainName]);

  if (!isOpen || !player) return null;

  const handleCopy = async () => {
    if (!blob || !navigator.clipboard?.write) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setNotice("✓ تم نسخ كارت عيد الميلاد للحافظة كصورة بنجاح!");
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.warn("Copy error:", err);
    }
  };

  const handleSend = async () => {
    await sendBirthdayCardViaWhatsApp(player, captainName, {
      onProgress: setIsSending,
      onNotice: setNotice,
    });
  };

  const handleShare = async () => {
    await shareBirthdayCard(player, captainName, {
      onProgress: setIsSharing,
      onNotice: setNotice,
    });
  };

  const handleDownload = async () => {
    await downloadBirthdayCard(player, captainName, {
      onProgress: setIsDownloading,
      onNotice: setNotice,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm animate-fade-in-scale"
      dir="rtl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[94vh] w-full max-w-sm sm:max-w-md overflow-y-auto rounded-3xl border border-amber-300/40 bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-5 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎂</span>
            <div>
              <h3 className="font-cairo text-xs sm:text-sm font-black text-amber-300">
                كارت تهنئة عيد الميلاد
              </h3>
              <p className="text-[10px] text-slate-400">
                للبطل: {player.name} {phone ? `• (${phone})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Image Display */}
        <div className="relative mb-3 flex items-center justify-center overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950/90 p-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2.5 py-12">
              <span className="h-8 w-8 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
              <span className="font-cairo text-xs font-bold text-amber-200">
                جاري تصميم كارت عيد الميلاد بالألوان الفاتحة والمبهجة...
              </span>
            </div>
          ) : dataUrl ? (
            <img
              src={dataUrl}
              alt={`كارت عيد ميلاد ${player.name}`}
              className="max-h-[55vh] w-auto rounded-xl shadow-xl object-contain ring-1 ring-white/10"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء الكارت</span>
          )}
        </div>

        {/* Notice alert */}
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
            {notice}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-2">
          {/* Main Action 1: Open Player Chat & Paste Card */}
          <button
            type="button"
            disabled={isLoading || isSending}
            onClick={handleSend}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 p-3 text-xs font-black text-white shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isSending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري تجهيز الكارت وفتح الشات...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>إرسال لشات اللاعب (واتساب) 💬</span>
              </>
            )}
          </button>

          {/* Main Action 2: Share Card Directly as Image */}
          <button
            type="button"
            disabled={isLoading || isSharing}
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 p-2.5 text-xs font-black text-white shadow-md shadow-orange-950/40 transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isSharing ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري المشاركة...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 shrink-0" />
                <span>مشاركة الكارت كصورة مباشرة 📤</span>
              </>
            )}
          </button>

          {/* Sub actions: Copy & Download */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              disabled={isLoading || !blob}
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-2.5 text-[11px] sm:text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
            >
              <ClipboardCopy className="h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span className="truncate">{copied ? "✓ تم النسخ!" : "نسخ الكارت"}</span>
            </button>

            <button
              type="button"
              disabled={isLoading || isDownloading}
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 p-2.5 text-[11px] sm:text-xs font-bold text-slate-200 transition active:scale-95 cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                  <span className="truncate">جاري...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="truncate">تحميل بالجهاز</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

