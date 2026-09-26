"use client";
import { useEffect, useState } from "react";
import { X, Download, MessageCircle, Share2, Copy, Sparkles, Check } from "lucide-react";
import {
  generateWelcomeCardCanvas,
  downloadWelcomeCard,
  sendWelcomeCardViaWhatsApp,
  shareWelcomeCardSocial,
  copyBlobToClipboard,
} from "../../lib/welcome-card-utils";

export default function WelcomeCardModal({
  player,
  captainName = "كابتن الأكاديمية",
  isOpen,
  onClose,
}) {
  const [dataUrl, setDataUrl] = useState("");
  const [blob, setBlob] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSharingSocial, setIsSharingSocial] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);
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

    generateWelcomeCardCanvas(player, captainName)
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
        console.error("Welcome card error:", err);
        if (isMounted) setLoadError(true);
      });

    return () => {
      isMounted = false;
      setDataUrl("");
      setBlob(null);
      setLoadError(false);
      setNotice("");
      setCopiedSuccess(false);
    };
  }, [isOpen, player, captainName]);

  if (!isOpen || !player) return null;

  const handleDownload = async () => {
    if (!blob) return;
    await downloadWelcomeCard(player, captainName, {
      existingBlob: blob,
      onProgress: setIsDownloading,
      onNotice: setNotice,
    });
  };

  const handleWhatsApp = async () => {
    if (!blob) return;
    await sendWelcomeCardViaWhatsApp(player, captainName, {
      existingBlob: blob,
      onProgress: setIsSendingWhatsApp,
      onNotice: setNotice,
    });
  };

  const handleSocialShare = async () => {
    if (!blob) return;
    await shareWelcomeCardSocial(player, captainName, {
      existingBlob: blob,
      onProgress: setIsSharingSocial,
      onNotice: setNotice,
    });
  };

  const handleCopy = async () => {
    if (!blob) return;
    setIsCopying(true);
    const success = await copyBlobToClipboard(blob);
    setIsCopying(false);
    if (success) {
      setCopiedSuccess(true);
      setNotice("✓ تم نسخ كارت الترحيب إلى الحافظة بنجاح! يمكنك الآن لصقه مباشرة في أي محادثة أو منشور.");
      setTimeout(() => setCopiedSuccess(false), 3000);
    } else {
      setNotice("⚠️ تعذر النسخ المباشر للحافظة. يمكنك استخدام زر (تحميل) أو (مشاركة).");
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 backdrop-blur-md animate-fade-in-scale"
      dir="rtl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[94vh] w-full max-w-sm sm:max-w-md overflow-y-auto rounded-3xl border border-amber-400/40 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 sm:p-5 text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-red-600 text-lg shadow-md">
              🥋
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-cairo text-xs sm:text-sm font-black text-amber-300">
                  كارت ترحيب بالبطل الجديد
                </h3>
                <span className="rounded-full bg-red-600/30 border border-red-500/40 px-2 py-0.5 text-[9px] font-black text-red-300">
                  حصري
                </span>
              </div>
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
        <div className="relative mb-3 flex items-center justify-center overflow-hidden rounded-2xl border border-amber-400/30 bg-slate-950/90 p-2 min-h-[320px]">
          {isLoading ? (
            <div className="flex flex-col items-center gap-2.5 py-16 text-center">
              <span className="h-9 w-9 rounded-full border-3 border-amber-400 border-t-transparent animate-spin" />
              <span className="font-cairo text-xs font-bold text-amber-200">
                جاري تصميم كارت الترحيب الرياضي الفاخر...
              </span>
              <span className="text-[11px] text-slate-400">
                يتم الآن تجهيز الصورة بجودة عالية للمشاركة على السوشيال ميديا 🥋✨
              </span>
            </div>
          ) : dataUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={dataUrl}
              alt={`كارت ترحيب ${player.name}`}
              className="max-h-[50vh] w-auto rounded-xl shadow-2xl object-contain ring-1 ring-white/10"
            />
          ) : (
            <span className="text-xs text-rose-400">تعذر إنشاء كارت الترحيب</span>
          )}
        </div>

        {/* Feedback Notice */}
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

        {/* Action Buttons Grid */}
        <div className="space-y-2 pt-1">
          {/* Primary Quick Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp */}
            <button
              type="button"
              disabled={isLoading || isSendingWhatsApp || !blob}
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 p-2.5 text-xs font-black text-white shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
              title="إرسال كارت الترحيب والتهنئة عبر واتساب"
            >
              {isSendingWhatsApp ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <MessageCircle className="h-4 w-4 shrink-0" />
                  <span>إرسال واتساب</span>
                </>
              )}
            </button>

            {/* Social Share (Instagram, Stories, Facebook, etc.) */}
            <button
              type="button"
              disabled={isLoading || isSharingSocial || !blob}
              onClick={handleSocialShare}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 p-2.5 text-xs font-black text-white shadow-md shadow-purple-600/20 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[44px]"
              title="مشاركة الكارت على ستوري انستجرام، فيسبوك أو تطبيقات أخرى"
            >
              {isSharingSocial ? (
                <>
                  <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                  <span>جاري المشاركة...</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 shrink-0" />
                  <span>مشاركة ستوري / سوشيال</span>
                </>
              )}
            </button>
          </div>

          {/* Secondary Actions Row (Download HD + Copy) */}
          <div className="grid grid-cols-2 gap-2">
            {/* Download */}
            <button
              type="button"
              disabled={isLoading || isDownloading || !blob}
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-2 text-xs font-bold text-slate-100 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[40px]"
              title="تحميل كارت الترحيب بجودة فائقة PNG"
            >
              {isDownloading ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                  <span>جاري التحميل...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  <span>تحميل كصورة HD</span>
                </>
              )}
            </button>

            {/* Copy image to clipboard */}
            <button
              type="button"
              disabled={isLoading || isCopying || !blob}
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/90 hover:bg-slate-700 p-2 text-xs font-bold text-slate-100 transition active:scale-95 disabled:opacity-50 cursor-pointer min-h-[40px]"
              title="نسخ الصورة للحافظة للصقها فوراً في أي تطبيق"
            >
              {copiedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">تم النسخ ✓</span>
                </>
              ) : isCopying ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin shrink-0" />
                  <span>جاري النسخ...</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-sky-400 shrink-0" />
                  <span>نسخ الصورة</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
