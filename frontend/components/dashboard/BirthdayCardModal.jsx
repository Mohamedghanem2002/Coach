"use client";
import { useEffect, useState } from "react";
import { X, Download, MessageCircle } from "lucide-react";
import {
  generateBirthdayCardCanvas,
  sendBirthdayCardViaWhatsApp,
  downloadBirthdayCard,
  copyBlobToClipboard,
} from "../../lib/birthday-card-utils";
import { formatWhatsAppPhone, openWhatsAppDirect } from "../../lib/dashboard-utils";

export default function BirthdayCardModal({
  player,
  captainName = "كابتن الأكاديمية",
  cachedBlob,
  isOpen,
  onClose,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [blob, setBlob] = useState(cachedBlob || null);
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

  useEffect(() => {
    if (!isOpen || !player) return undefined;

    let isMounted = true;

    if (cachedBlob) {
      const url = URL.createObjectURL(cachedBlob);
      Promise.resolve().then(() => {
        if (!isMounted) {
          URL.revokeObjectURL(url);
          return;
        }
        setBlob(cachedBlob);
        setDataUrl(url);
      });
      return () => {
        isMounted = false;
        URL.revokeObjectURL(url);
      };
    }

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
          if (isMounted && b) {
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
  }, [isOpen, player, captainName, cachedBlob]);

  if (!isOpen || !player) return null;

  const handleDownload = async () => {
    if (!blob) return;
    await downloadBirthdayCard(player, captainName, {
      existingBlob: blob,
      onProgress: setIsDownloading,
      onNotice: setNotice,
    });
  };

  const handleSendWhatsApp = async () => {
    if (!blob) return;
    await sendBirthdayCardViaWhatsApp(player, captainName, {
      existingBlob: blob,
      onProgress: setIsSending,
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
                معاينة كارت تهنئة عيد الميلاد
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
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUrl}
              alt={`كارت عيد ميلاد ${player.name}`}
              className="max-h-[52vh] w-auto rounded-xl shadow-xl object-contain ring-1 ring-white/10"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء الكارت</span>
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
            {notice}
          </div>
        )}

        {/* Under preview: TWO clear actions: [ حفظ ] [ إرسال عبر واتساب ] */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Action 1: حفظ */}
          <button
            type="button"
            disabled={isLoading || isDownloading || !blob}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-3 text-xs font-black text-slate-100 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[48px]"
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
            disabled={isLoading || isSending || !blob}
            onClick={handleSendWhatsApp}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 p-3 text-xs font-bold text-white shadow-sm shadow-emerald-600/20 transition active-press disabled:opacity-50 cursor-pointer min-h-[48px]"
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
}
