"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Download, MessageCircle } from "lucide-react";
import {
  generateBirthdayCardCanvas,
  sendBirthdayCardViaWhatsApp,
  downloadBirthdayCard,
  dataUrlToBlob,
  getCachedBirthdayCard,
  setCachedBirthdayCard,
} from "../../lib/birthday-card-utils";
import { formatWhatsAppPhone } from "../../lib/dashboard-utils";

const emptySubscribe = () => () => {};

export default function BirthdayCardModal({
  player,
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الكاراتيه",
  cachedBlob,
  isOpen,
  onClose,
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const playerId = player?._id || player?.id || "";
  const preloaded = getCachedBirthdayCard(playerId);

  const [dataUrl, setDataUrl] = useState(preloaded?.dataUrl || "");
  const [blob, setBlob] = useState(cachedBlob || preloaded?.blob || null);
  const [loadError, setLoadError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notice, setNotice] = useState("");

  const isLoading = isOpen && !dataUrl && !loadError;

  const phone =
    player?.guardianPhone ||
    player?.parentPhone ||
    player?.guardianMobile ||
    player?.mobile ||
    player?.phone ||
    "";
  const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";

  // Lock background body scroll and listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen || !player) return undefined;

    let isMounted = true;

    // 1. If we have a cached blob or preloaded card, use it immediately via microtask
    const existing = getCachedBirthdayCard(playerId);
    if (existing?.dataUrl) {
      Promise.resolve().then(() => {
        if (!isMounted) return;
        setDataUrl(existing.dataUrl);
        setBlob(existing.blob || dataUrlToBlob(existing.dataUrl));
      });
      return undefined;
    }

    if (cachedBlob) {
      const url = URL.createObjectURL(cachedBlob);
      Promise.resolve().then(() => {
        if (!isMounted) {
          URL.revokeObjectURL(url);
          return;
        }
        setBlob(cachedBlob);
        setDataUrl(url);
        setCachedBirthdayCard(playerId, { dataUrl: url, blob: cachedBlob });
      });
      return () => {
        isMounted = false;
        URL.revokeObjectURL(url);
      };
    }

    // 2. Generate card canvas and convert synchronously to blob
    generateBirthdayCardCanvas(player, captainName, academyName)
      .then((canvas) => {
        if (!isMounted) return;
        if (!canvas) {
          setLoadError(true);
          return;
        }

        const url = canvas.toDataURL("image/png");
        // Synchronous blob creation: 100x faster than canvas.toBlob() on mobile!
        const syncBlob = dataUrlToBlob(url);

        setDataUrl(url);
        if (syncBlob) setBlob(syncBlob);

        setCachedBirthdayCard(playerId, {
          dataUrl: url,
          blob: syncBlob,
          canvas,
        });
      })
      .catch(() => {
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, player, playerId, captainName, academyName, cachedBlob]);

  if (!isOpen || !player || !isClient) return null;

  // Immediate Instant Download: never blocked by disabled states
  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      let currentBlob = blob;
      if (!currentBlob && dataUrl) {
        currentBlob = dataUrlToBlob(dataUrl);
        if (currentBlob) setBlob(currentBlob);
      }
      if (!currentBlob) {
        setNotice("⏳ جاري تجهيز كارت عيد الميلاد للحفظ...");
        const canvas = await generateBirthdayCardCanvas(player, captainName, academyName);
        if (canvas) {
          const url = canvas.toDataURL("image/png");
          currentBlob = dataUrlToBlob(url);
          setDataUrl(url);
          if (currentBlob) setBlob(currentBlob);
          setCachedBirthdayCard(playerId, { dataUrl: url, blob: currentBlob, canvas });
        }
      }
      if (!currentBlob) {
        setNotice("❌ تعذر تجهيز صورة الكارت للحفظ.");
        return;
      }
      await downloadBirthdayCard(player, captainName, {
        existingBlob: currentBlob,
        academyName,
        onProgress: setIsDownloading,
        onNotice: setNotice,
      });
    } catch (err) {
      console.error(err);
      setNotice("❌ حدث خطأ أثناء حفظ الكارت");
    } finally {
      setIsDownloading(false);
    }
  };

  // Immediate Instant WhatsApp Send: never blocked by disabled states
  const handleSendWhatsApp = async () => {
    if (isSending) return;
    setIsSending(true);
    try {
      let currentBlob = blob;
      if (!currentBlob && dataUrl) {
        currentBlob = dataUrlToBlob(dataUrl);
        if (currentBlob) setBlob(currentBlob);
      }
      if (!currentBlob) {
        setNotice("⏳ جاري تجهيز كارت عيد الميلاد للإرسال...");
        const canvas = await generateBirthdayCardCanvas(player, captainName, academyName);
        if (canvas) {
          const url = canvas.toDataURL("image/png");
          currentBlob = dataUrlToBlob(url);
          setDataUrl(url);
          if (currentBlob) setBlob(currentBlob);
          setCachedBirthdayCard(playerId, { dataUrl: url, blob: currentBlob, canvas });
        }
      }
      if (!currentBlob) {
        setNotice("❌ تعذر تجهيز صورة الكارت للإرسال.");
        return;
      }
      await sendBirthdayCardViaWhatsApp(player, captainName, {
        existingBlob: currentBlob,
        academyName,
        onProgress: setIsSending,
        onNotice: setNotice,
      });
    } catch (err) {
      console.error(err);
      setNotice("❌ حدث خطأ أثناء إرسال الكارت");
    } finally {
      setIsSending(false);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-sm animate-fade-in-scale"
      dir="rtl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="relative flex flex-col w-full max-w-sm sm:max-w-md h-auto max-h-[92dvh] sm:max-h-[90dvh] rounded-3xl border border-amber-300/40 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-3.5 sm:p-5 text-white shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header: shrink-0 so it is permanently pinned and never pushed off */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🎂</span>
            <div className="min-w-0">
              <h3 className="font-cairo text-xs sm:text-sm font-black text-amber-300 truncate">
                معاينة كارت تهنئة عيد الميلاد
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                للبطل: {player.name} {phone ? `• (${phone})` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition active:scale-95"
            title="إغلاق"
            aria-label="إغلاق النافذة"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card Image Display: flex-1 min-h-0 automatically scales the image to available screen space */}
        <div className="flex-1 min-h-0 relative my-1 flex items-center justify-center overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950/90 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center px-4">
              <span className="h-8 w-8 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
              <span className="font-cairo text-xs font-bold text-amber-200">
                جاري تصميم كارت عيد الميلاد بالألوان الفاتحة والمبهجة...
              </span>
            </div>
          ) : dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUrl}
              alt={`كارت عيد ميلاد ${player.name}`}
              className="max-h-full max-w-full w-auto h-auto rounded-xl shadow-xl object-contain ring-1 ring-white/10 select-none"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء الكارت</span>
          )}
        </div>

        {/* Notice feedback: shrink-0 */}
        {notice && (
          <div
            className={`shrink-0 my-1 rounded-xl p-2 text-center text-xs font-bold transition leading-relaxed ${
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

        {/* Action Buttons: ALWAYS active, bright and clickable immediately without waiting! */}
        <div className="shrink-0 grid grid-cols-2 gap-2.5 pt-2 pb-safe">
          {/* Action 1: حفظ */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-2.5 sm:p-3 text-xs font-black text-slate-100 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[46px] touch-manipulation"
            title="تحميل وحفظ كارت عيد الميلاد بجهازك"
          >
            {isDownloading ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4 shrink-0 text-amber-400" />
                <span>حفظ</span>
              </>
            )}
          </button>

          {/* Action 2: إرسال عبر واتساب */}
          <button
            type="button"
            disabled={isSending}
            onClick={handleSendWhatsApp}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 p-2.5 sm:p-3 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[46px] touch-manipulation"
            title="نسخ الكارت وفتح شات واتساب مباشرة لإرساله كصورة"
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
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
