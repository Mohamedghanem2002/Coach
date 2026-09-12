"use client";
import { useEffect, useState } from "react";
import { X, Download, Send, ClipboardCopy, Share2, MessageCircle } from "lucide-react";
import { formatWhatsAppPhone, openWhatsAppDirect } from "../../lib/dashboard-utils";

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
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async () => {
    if (!blob || !navigator.clipboard?.write) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopied(true);
      setNotice("✓ تم نسخ صورة بطاقة اللاعب للحافظة بنجاح! يمكنك لصقها في واتساب كصورة.");
      setTimeout(() => setCopied(false), 3500);
    } catch (err) {
      console.warn("Copy error:", err);
      setNotice("❌ تعذر نسخ الصورة للحافظة تلقائياً.");
    }
  };

  const handleDownload = () => {
    if (!blob) return;
    setIsDownloading(true);
    try {
      const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
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
      setTimeout(() => setIsDownloading(false), 1200);
    }
  };

  const handleShareCard = async () => {
    if (!blob) return;
    setIsSharing(true);
    setNotice("⏳ جاري تجهيز بطاقة اللاعب للمشاركة...");

    try {
      const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `بطاقة اللاعب ${player.name}`,
        });
        setNotice("✓ تم مشاركة بطاقة اللاعب كصورة بنجاح!");
        return;
      }

      // Fallback if native file share is unsupported
      await handleCopy();
      handleDownload();
      if (cleanPhone) {
        openWhatsAppDirect(cleanPhone);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Share card error:", err);
        setNotice("❌ حدث خطأ أثناء مشاركة البطاقة");
      }
    } finally {
      setTimeout(() => setIsSharing(false), 800);
    }
  };

  const handleSendToWhatsAppApp = async () => {
    if (!blob) return;
    setIsSending(true);
    setNotice("⏳ جاري تجهيز البطاقة وفتح تطبيق واتساب...");

    try {
      // 1. Copy image to clipboard as PNG so the coach can paste it straight into WhatsApp as image
      let copySuccess = false;
      if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          copySuccess = true;
        } catch (clipErr) {
          console.warn("Clipboard write failed:", clipErr);
        }
      }

      // 2. Auto-save / download card image to the device
      try {
        const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2500);
      } catch (_) {}

      // 3. Open WhatsApp chat directly WITHOUT text parameter!
      // (So the chat opens cleanly and the coach can paste the card image directly!)
      if (cleanPhone) {
        openWhatsAppDirect(cleanPhone);
        setNotice(
          copySuccess
            ? `✓ تم فتح شات ولي الأمر (${cleanPhone}) ونسخ البطاقة للحافظة! اضغط لصق (Paste) لإرسال البطاقة كصورة 🥋`
            : `✓ تم فتح شات ولي الأمر (${cleanPhone}) وحفظ صورة البطاقة بجهازك لإرسالها فوراً 🥋`
        );
      } else {
        // Fallback if no phone number registered
        const fileName = `بطاقة_اللاعب_${player.name.replace(/\s+/g, "_")}.png`;
        const file = new File([blob], fileName, { type: "image/png" });
        if (
          typeof navigator !== "undefined" &&
          navigator.canShare &&
          navigator.canShare({ files: [file] })
        ) {
          await navigator.share({
            files: [file],
            title: `بطاقة اللاعب ${player.name}`,
          });
        } else {
          openWhatsAppDirect("");
        }
        setNotice("⚠️ لم يتم تسجيل رقم هاتف لولي الأمر! تم نسخ البطاقة وحفظها بجهازك 🥋");
      }
    } catch (err) {
      console.error(err);
      setNotice("❌ حدث خطأ أثناء تجهيز أو إرسال البطاقة.");
    } finally {
      setTimeout(() => setIsSending(false), 1200);
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
                بطاقة اللاعب الرسمية
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

        {/* Card Image Display */}
        <div className="relative mb-3 flex items-center justify-center overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-2 min-h-[320px]">
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
              className="max-h-[55vh] w-auto rounded-xl shadow-xl object-contain ring-1 ring-white/10"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء البطاقة</span>
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
          {/* Main Action 1: Open WhatsApp Chat directly with copied Card */}
          <button
            type="button"
            disabled={isLoading || isSending}
            onClick={handleSendToWhatsAppApp}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 p-3 text-xs font-black text-white shadow-lg shadow-emerald-900/30 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            title="فتح محادثة واتساب ونسخ البطاقة للحافظة مباشرة لإرسالها كصورة"
          >
            {isSending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري التجهيز والفتح...</span>
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>إرسال لشات اللاعب (واتساب) 💬</span>
              </>
            )}
          </button>

          {/* Main Action 2: Share Card directly as image file */}
          <button
            type="button"
            disabled={isLoading || isSharing}
            onClick={handleShareCard}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:brightness-110 p-2.5 text-xs font-black text-white shadow-md shadow-orange-950/40 transition active:scale-95 disabled:opacity-60 cursor-pointer"
            title="مشاركة البطاقة كصورة مباشرة عبر واتساب والتطبيقات الأخرى"
          >
            {isSharing ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                <span>جاري المشاركة...</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 shrink-0" />
                <span>مشاركة البطاقة كصورة مباشرة 📤</span>
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
              <span className="truncate">{copied ? "✓ تم النسخ!" : "نسخ البطاقة"}</span>
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
                  <span className="truncate">تحميل الصورة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

