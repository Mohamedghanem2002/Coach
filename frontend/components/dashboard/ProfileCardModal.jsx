"use client";
import { useEffect, useState } from "react";
import { X, Download, MessageCircle } from "lucide-react";
import { formatWhatsAppPhone, openWhatsAppDirect } from "../../lib/dashboard-utils";
import { copyBlobToClipboard } from "../../lib/birthday-card-utils";

export default function ProfileCardModal({
  player,
  captainName = "كابتن الأكاديمية",
  canvasGenerator,
  cachedBlob,
  isOpen,
  onClose,
  paymentMonth,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [blob, setBlob] = useState(cachedBlob || null);
  const [loadError, setLoadError] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [notice, setNotice] = useState("");

  const isLoading = isOpen && !dataUrl && !loadError;

  const guardianPhone =
    player?.guardianPhone ||
    player?.parentPhone ||
    player?.guardianMobile ||
    player?.mobile ||
    player?.phone ||
    "";
  const cleanPhone = guardianPhone ? formatWhatsAppPhone(guardianPhone) : "";

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

    if (typeof canvasGenerator === "function") {
      canvasGenerator()
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
    }

    return () => {
      isMounted = false;
      setDataUrl("");
      setBlob(null);
      setLoadError(false);
      setNotice("");
    };
  }, [isOpen, player, cachedBlob, canvasGenerator]);

  if (!isOpen || !player) return null;

  const handleDownload = () => {
    if (!blob) return;
    setIsDownloading(true);
    try {
      const fileName = `بطاقة_اللاعب_${(player.name || "اللاعب").replace(/\s+/g, "_")}.png`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2500);
      setNotice("✓ تم حفظ وتحميل بطاقة اللاعب بجهازك بنجاح!");
    } catch (e) {
      console.error(e);
      setNotice("❌ حدث خطأ أثناء تحميل البطاقة.");
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const handleSendToWhatsApp = async () => {
    if (!blob) return;
    setIsSending(true);

    const fileName = `بطاقة_اللاعب_${(player.name || "اللاعب").replace(/\s+/g, "_")}.png`;

    try {
      // 1. Fast copy image to clipboard as PNG
      const copied = await copyBlobToClipboard(blob);

      // 2. Fallback auto-save if clipboard is unsupported
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

      // 3. Open WhatsApp directly to player's chat (or manual contact selection)
      openWhatsAppDirect(cleanPhone);

      if (cleanPhone) {
        setNotice(
          copied
            ? `✓ تم فتح محادثة ولي الأمر (${cleanPhone}) ونسخ البطاقة للحافظة! الصق الصورة (Paste) ثم أرسلها 🥋`
            : `✓ تم فتح محادثة ولي الأمر (${cleanPhone}) وحفظ البطاقة بجهازك لإرسالها فوراً 🥋`
        );
      } else {
        setNotice(
          copied
            ? "✓ تم نسخ البطاقة للحافظة وفتح واتساب! اختر المحادثة المطلوبة ثم الصق الصورة (Paste) 🥋"
            : "✓ تم حفظ البطاقة بجهازك وفتح واتساب! اختر المحادثة المطلوبة لإرسالها 🥋"
        );
      }
    } catch (err) {
      console.error(err);
      setNotice("❌ حدث خطأ أثناء تجهيز أو إرسال البطاقة.");
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
      <div className="relative max-h-[94vh] w-full max-w-sm sm:max-w-md overflow-y-auto rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 to-slate-950 p-4 sm:p-5 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥋</span>
            <div>
              <h3 className="font-cairo text-xs sm:text-sm font-black text-red-400">
                معاينة بطاقة اللاعب الرسمية
              </h3>
              <p className="text-[10px] text-slate-400">
                للبطل: {player.name} {guardianPhone ? `• (${guardianPhone})` : ""}
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

        {/* Card Image Display Preview */}
        <div className="relative mb-3 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-2 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2.5 py-14">
              <span className="h-8 w-8 rounded-full border-3 border-red-500 border-t-transparent animate-spin" />
              <span className="font-cairo text-xs font-bold text-red-200">
                جاري تصميم بطاقة اللاعب الرسمية...
              </span>
            </div>
          ) : dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUrl}
              alt={`بطاقة اللاعب ${player.name}`}
              className="max-h-[52vh] w-auto rounded-xl shadow-xl object-contain ring-1 ring-white/10"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء البطاقة</span>
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

        {/* Under the preview: TWO clear actions: [ حفظ ] [ إرسال عبر واتساب ] */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          {/* Action 1: حفظ */}
          <button
            type="button"
            disabled={isLoading || isDownloading || !blob}
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-3 text-xs font-black text-slate-100 shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[48px]"
            title="تحميل وحفظ صورة البطاقة بجهازك"
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
            disabled={isLoading || isSending || !blob}
            onClick={handleSendToWhatsApp}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 p-3 text-xs font-black text-white shadow-lg shadow-emerald-900/40 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[48px]"
            title="نسخ البطاقة وفتح واتساب مباشرة لإرسالها كصورة"
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
