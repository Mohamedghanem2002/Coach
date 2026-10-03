"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, Download, MessageCircle } from "lucide-react";
import {
  generateWelcomeCardCanvas,
  formatWhatsAppPhone,
  copyBlobToClipboard,
  openWhatsAppDirect,
  markWelcomeCardHandled,
} from "../../lib/welcome-card-utils";
import { dataUrlToBlob } from "../../lib/birthday-card-utils";

const emptySubscribe = () => () => {};

export default function WelcomeCardModal({
  player,
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الكاراتيه",
  isOpen,
  onClose,
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const [dataUrl, setDataUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notice, setNotice] = useState("");
  const [whatsAppUrl, setWhatsAppUrl] = useState("");

  const isLoading = isOpen && !dataUrl && !loadError;

  const guardianPhone =
    player?.guardianPhone ||
    player?.parentPhone ||
    player?.guardianMobile ||
    player?.mobile ||
    player?.phone ||
    "";
  const cleanPhone = guardianPhone ? formatWhatsAppPhone(guardianPhone) : "";

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

    generateWelcomeCardCanvas(player, captainName, academyName)
      .then((canvas) => {
        if (!isMounted) return;
        if (!canvas) {
          setLoadError(true);
          return;
        }

        const url = canvas.toDataURL("image/png");
        const syncBlob = dataUrlToBlob(url);
        setDataUrl(url);
        if (syncBlob) setBlob(syncBlob);
      })
      .catch((err) => {
        console.error("Welcome card error:", err);
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
  }, [isOpen, player, captainName, academyName]);

  if (!isOpen || !player || !isClient) return null;

  const handleDownload = async () => {
    let currentBlob = blob;
    if (!currentBlob && dataUrl) {
      currentBlob = dataUrlToBlob(dataUrl);
      if (currentBlob) setBlob(currentBlob);
    }
    if (!currentBlob) return;
    setIsDownloading(true);
    try {
      const fileName = `كارت_ترحيب_${(player.name || "اللاعب").replace(/\s+/g, "_")}.png`;

      // On iOS Safari, support native share/save sheet if available
      const isIOS =
        typeof navigator !== "undefined" &&
        /iphone|ipad|ipod/i.test(navigator.userAgent || "");

      if (
        isIOS &&
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [new File([currentBlob], fileName, { type: "image/png" })] })
      ) {
        try {
          const file = new File([currentBlob], fileName, { type: "image/png" });
          await navigator.share({
            files: [file],
            title: `كارت ترحيب ${player.name}`,
          });
          markWelcomeCardHandled(player._id || player.id);
          setNotice("✓ تم فتح نافذة الحفظ والمشاركة بنجاح!");
          return;
        } catch (shareErr) {
          if (shareErr.name === "AbortError") return;
        }
      }

      const url = URL.createObjectURL(currentBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      markWelcomeCardHandled(player._id || player.id);
      setNotice("✓ تم حفظ وتحميل كارت الترحيب بجهازك بنجاح!");
    } catch (e) {
      console.error(e);
      setNotice("❌ حدث خطأ أثناء تحميل كارت الترحيب.");
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handleSendToWhatsApp = async () => {
    let currentBlob = blob;
    if (!currentBlob && dataUrl) {
      currentBlob = dataUrlToBlob(dataUrl);
      if (currentBlob) setBlob(currentBlob);
    }
    if (!currentBlob) return;
    setIsSending(true);
    setWhatsAppUrl("");

    const isMobile =
      typeof navigator !== "undefined" &&
      /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

    let preWin = null;
    if (!isMobile) {
      try {
        preWin = window.open("about:blank", "_blank");
      } catch (_) {}
    }

    const fileName = `كارت_ترحيب_${(player.name || "اللاعب").replace(/\s+/g, "_")}.png`;

    try {
      const copied = await copyBlobToClipboard(blob);

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

      openWhatsAppDirect(cleanPhone, "", preWin);
      markWelcomeCardHandled(player._id || player.id);

      const targetLink = cleanPhone
        ? (isMobile ? `whatsapp://send?phone=${cleanPhone}` : `https://web.whatsapp.com/send?phone=${cleanPhone}`)
        : (isMobile ? `whatsapp://send` : `https://web.whatsapp.com`);
      setWhatsAppUrl(targetLink);

      if (cleanPhone) {
        setNotice(
          copied
            ? `✓ تم نسخ كارت الترحيب للحافظة وجاري فتح محادثة (${cleanPhone})! الصق الصورة (Paste) ثم أرسلها 🥋`
            : `✓ تم حفظ كارت الترحيب بجهازك وجاري فتح محادثة (${cleanPhone}) لإرسالها فوراً 🥋`
        );
      } else {
        setNotice(
          copied
            ? "✓ تم نسخ كارت الترحيب للحافظة وجاري فتح واتساب! اختر المحادثة المطلوبة ثم الصق الصورة (Paste) 🥋"
            : "✓ تم حفظ كارت الترحيب بجهازك وجاري فتح واتساب! اختر المحادثة المطلوبة لإرسالها 🥋"
        );
      }
    } catch (err) {
      console.error(err);
      if (preWin && !preWin.closed) {
        try {
          preWin.close();
        } catch (_) {}
      }
      setNotice("❌ حدث خطأ أثناء تجهيز أو إرسال كارت الترحيب.");
    } finally {
      setTimeout(() => setIsSending(false), 800);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 p-3 sm:p-4 backdrop-blur-sm animate-fade-in-scale"
      dir="rtl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="relative flex flex-col w-full max-w-sm sm:max-w-lg h-auto max-h-[92dvh] sm:max-h-[90dvh] rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 p-3.5 sm:p-5 text-white shadow-2xl overflow-hidden"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header: shrink-0 */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">🥋</span>
            <div className="min-w-0">
              <h3 className="font-cairo text-xs sm:text-sm font-black text-red-400 truncate">
                معاينة كارت الترحيب بالبطل
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                للبطل: {player.name}
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

        {/* Card Image Display Preview: flex-1 min-h-0 */}
        <div className="flex-1 min-h-0 relative my-1 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-2.5 py-8 text-center px-4">
              <span className="h-8 w-8 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
              <span className="font-cairo text-xs font-bold text-red-200">
                جاري تصميم كارت الترحيب بالبطل...
              </span>
            </div>
          ) : dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUrl}
              alt={`كارت ترحيب ${player.name}`}
              className="max-h-full max-w-full w-auto h-auto rounded-xl shadow-2xl object-contain ring-1 ring-white/10 select-none"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء كارت الترحيب</span>
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
            <div>{notice}</div>
            {whatsAppUrl && !notice.startsWith("❌") && (
              <div className="mt-1.5 pt-1.5 border-t border-emerald-800/60 flex items-center justify-center">
                <a
                  href={whatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition active:scale-95 cursor-pointer"
                >
                  <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>إذا لم تفتح المحادثة تلقائياً، اضغط هنا لفتح واتساب مباشرة</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons: shrink-0 guaranteed visible at bottom */}
        <div className="shrink-0 grid grid-cols-2 gap-2.5 pt-2 pb-safe">
          {/* Action 1: حفظ */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-2.5 sm:p-3 text-xs font-black text-slate-100 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[46px] touch-manipulation"
            title="تحميل وحفظ صورة كارت الترحيب بجهازك"
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

          {/* Action 2: إرسال عبر واتساب */}
          <button
            type="button"
            disabled={isSending}
            onClick={handleSendToWhatsApp}
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 p-2.5 sm:p-3 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[46px] touch-manipulation"
            title="نسخ كارت الترحيب وفتح واتساب مباشرة لإرسالها لرقم ولي الأمر"
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
