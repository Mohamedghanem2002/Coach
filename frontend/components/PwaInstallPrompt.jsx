"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { Download, X, Share, PlusSquare, CheckCircle2 } from "lucide-react";

// Safe hydration helper using React's official useSyncExternalStore
const emptySubscribe = () => () => {};
function useIsClientMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function PwaInstallPrompt() {
  const isMounted = useIsClientMounted();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Pure client calculations (safe after isMounted is true)
  const isStandalone =
    isMounted &&
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://"));

  const isIOS =
    isMounted &&
    typeof window !== "undefined" &&
    (/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));

  const isPreviouslyDismissed =
    isMounted &&
    typeof window !== "undefined" &&
    (() => {
      try {
        return sessionStorage.getItem("coatchmaster_pwa_dismissed") === "true";
      } catch {
        return false;
      }
    })();

  const triggerInstall = useCallback(async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsDismissed(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn("[PWA] Prompt error:", err);
      }
      return;
    }

    setShowIOSModal(true);
  }, [deferredPrompt]);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("[PWA] Service Worker registration failed:", err);
      });
    }

    // 2. Listen for beforeinstallprompt (Android, Chrome, Edge)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 3. Listen for appinstalled
    const handleAppInstalled = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => setInstalledSuccess(false), 5000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 4. Custom global event to open install from anywhere (e.g. Header button)
    const handleTriggerInstall = () => {
      triggerInstall();
    };
    window.addEventListener("trigger_pwa_install", handleTriggerInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("trigger_pwa_install", handleTriggerInstall);
    };
  }, [triggerInstall]);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem("coatchmaster_pwa_dismissed", "true");
    } catch {
      // Ignore
    }
  };

  // Prevent SSR hydration mismatch: render nothing until mounted on client, or if running inside standalone app
  if (!isMounted || isStandalone) {
    return null;
  }

  const shouldShowBanner = !isDismissed && !isPreviouslyDismissed;

  return (
    <>
      {/* ── Success Toast after Installation ── */}
      {installedSuccess && (
        <div
          dir="rtl"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-2xl shadow-emerald-900/30 text-xs font-bold animate-bounce"
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span>تم تثبيت تطبيق CoatchMaster بنجاح على جهازك! 🎉</span>
        </div>
      )}

      {/* ── Floating Smart Install Banner ── */}
      {shouldShowBanner && (
        <div
          dir="rtl"
          className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:left-6 z-50 sm:max-w-md animate-fade-in"
        >
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/95 p-3 sm:p-3.5 shadow-2xl shadow-slate-900/20 backdrop-blur-md">
            {/* Ambient light glow */}
            <div className="absolute top-0 right-0 -mr-6 -mt-6 h-20 w-20 rounded-full bg-red-500/10 blur-xl pointer-events-none" />

            <div className="flex items-center gap-3">
              {/* App Icon (White/Light Karate Emblem) */}
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-xs">
                <Image
                  src="/icons/icon-192.png"
                  alt="CoatchMaster Icon"
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                  priority
                />
              </div>

              {/* Text Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-cairo text-xs sm:text-sm font-black text-slate-900 truncate">
                    CoatchMaster
                  </h3>
                  <span className="rounded-md bg-red-50 border border-red-200/80 px-1.5 py-0.5 text-[9px] font-black text-red-600">
                    تطبيق
                  </span>
                </div>
                <p className="font-cairo text-[11px] text-slate-500 truncate mt-0.5">
                  ثبّت التطبيق على جهازك للوصول السريع
                </p>
              </div>

              {/* Install Button */}
              <button
                type="button"
                onClick={triggerInstall}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white px-3 sm:px-3.5 py-2 text-xs font-black shadow-md shadow-red-500/25 transition-all cursor-pointer shrink-0"
              >
                <Download className="h-3.5 w-3.5 shrink-0" />
                <span>تثبيت</span>
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={handleDismiss}
                aria-label="إغلاق التنبيه"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── iOS / Manual Installation Modal ── */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-fade-in">
          <div
            dir="rtl"
            className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-slate-200 text-right space-y-4 animate-slide-up sm:animate-scale-in"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                  <Image
                    src="/icons/icon-192.png"
                    alt="CoatchMaster"
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-cairo text-sm font-black text-slate-900">
                    تثبيت CoatchMaster
                  </h4>
                  <p className="text-[11px] text-slate-500 font-medium">
                    على الشاشة الرئيسية لجهازك
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="space-y-3 font-cairo text-xs text-slate-700">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-black text-xs border border-blue-200">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">
                    اضغط على زر المشاركة{" "}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-blue-600 font-bold mx-0.5">
                      <Share className="h-3.5 w-3.5 inline ml-1" />
                      مشاركة
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {isIOS
                      ? "ستجده في الشريط السفلي في متصفح سفاري (Safari) على الآيفون."
                      : "أو من قائمة خيارات المتصفح (⋮)."}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600 font-black text-xs border border-rose-200">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900">
                    مرر لأسفل واختر{" "}
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-rose-600 font-bold mx-0.5">
                      <PlusSquare className="h-3.5 w-3.5 inline ml-1" />
                      إضافة إلى الصفحة الرئيسية
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    (Add to Home Screen)
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-emerald-950">
                    اضغط على كلمة <strong>إضافة (Add)</strong> في أعلى الزاوية.
                  </p>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    وسيظهر تطبيق CoatchMaster بأيقونته الرسمية على هاتفك فوراً!
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom button */}
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-black transition-all cursor-pointer"
            >
              فهمت، شكراً لك 👍
            </button>
          </div>
        </div>
      )}
    </>
  );
}
