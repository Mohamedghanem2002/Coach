"use client";

import { useState } from "react";
import { Phone, Copy, Check, ExternalLink, Code2 } from "lucide-react";

function FacebookIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-4 h-4" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function Footer({ academyName = "Re_action DOJO" } = {}) {
  const [copiedNumber, setCopiedNumber] = useState(null);

  const phoneContacts = [
    {
      number: "01552488179",
      display: "0155 248 8179",
      rawWhatsApp: "201552488179",
    },
    {
      number: "01028138408",
      display: "0102 813 8408",
      rawWhatsApp: "201028138408",
    },
  ];

  const facebookLink = "https://www.facebook.com/share/189fmyCdsT/";

  const handleCopy = (num) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedNumber(num);
      setTimeout(() => setCopiedNumber(null), 2000);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full mt-4 md:mt-10 border-t-0 md:border-t md:border-slate-200/80 bg-transparent md:bg-white/95 md:backdrop-blur-sm text-slate-700 pt-1 md:pt-7 pb-28 md:pb-8 shadow-none md:shadow-xs transition-colors"
      dir="rtl"
    >
      {/* ══════════════════ MOBILE-SPECIFIC APP FOOTER (< md) ══════════════════ */}
      <div className="md:hidden mx-auto max-w-lg px-3 mb-2">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
          {/* Developer Identity Row */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xs">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className="font-cairo text-sm font-black text-slate-900">
                    محمد غانم
                  </strong>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/70 px-2 py-0.2 text-[9px] font-black text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    مطور المنظومة
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                  برمجة وتطوير الأنظمة والتطبيقات
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Contact Buttons (2 Big Touch Targets) */}
          <div className="grid grid-cols-2 gap-2">
            {/* WhatsApp Direct */}
            <a
              href="https://wa.me/201552488179"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-xs shadow-emerald-500/20 active-press transition cursor-pointer touch-manipulation"
              title="محادثة واتساب مباشرة"
            >
              <WhatsAppIcon className="h-4 w-4 fill-white" />
              <span>واتساب الدعم</span>
            </a>

            {/* Direct Phone Call */}
            <a
              href="tel:01552488179"
              className="flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-xs active-press transition cursor-pointer touch-manipulation"
              title="اتصال هاتفي مباشر"
            >
              <Phone className="h-4 w-4" />
              <span>اتصال هاتفي</span>
            </a>
          </div>

          {/* Secondary Links: Facebook + Copy Number */}
          <div className="flex items-center justify-between gap-2 pt-1 text-[11px] font-bold">
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#1877F2] bg-blue-50/80 border border-blue-200/60 rounded-xl px-2.5 py-1.5 transition active-press cursor-pointer"
            >
              <FacebookIcon className="h-3.5 w-3.5 fill-current" />
              <span>فيسبوك</span>
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>

            <button
              type="button"
              onClick={() => handleCopy("01552488179")}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border transition active-press cursor-pointer ${
                copiedNumber === "01552488179"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                  : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {copiedNumber === "01552488179" ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>تم النسخ</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-slate-400" />
                  <span className="font-mono text-xs" dir="ltr">0155 248 8179</span>
                </>
              )}
            </button>
          </div>

          {/* Minimal Copyright */}
          <div className="border-t border-slate-100 pt-2 text-center text-[10px] text-slate-400 font-semibold">
            <span>جميع الحقوق محفوظة © {currentYear} • </span>
            <strong className="text-slate-600 font-bold">{academyName}</strong>
          </div>
        </div>
      </div>

      {/* ══════════════════ DESKTOP FOOTER (>= md) ══════════════════ */}
      <div className="hidden md:block mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Top / Main Smart Bar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-5 pb-6 border-b border-slate-100">

          {/* Identity & Developer */}
          <div className="flex items-center gap-3.5 w-full lg:w-auto justify-start">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white shadow-xs">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cairo text-base font-extrabold text-slate-900 tracking-tight">
                  محمد غانم
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  مطور برمجيات
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500">
                برمجة وتطوير الأنظمة والتطبيقات
              </p>
            </div>
          </div>

          {/* Smart Contact & Social Pills */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-start lg:justify-end">

            {/* Phone & WhatsApp interactive badges */}
            {phoneContacts.map((contact) => {
              const isCopied = copiedNumber === contact.number;
              return (
                <div
                  key={contact.number}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50/70 p-1 pl-2 transition-all hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                >
                  {/* WhatsApp Quick Link */}
                  <a
                    href={`https://wa.me/${contact.rawWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer"
                    title={`محادثة واتساب (${contact.number})`}
                  >
                    <WhatsAppIcon className="h-3.5 w-3.5 fill-current" />
                  </a>

                  {/* Phone Call Quick Link */}
                  <a
                    href={`tel:${contact.number}`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                    title={`اتصال هاتفي (${contact.number})`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>

                  {/* Phone Number Display */}
                  <span className="font-mono text-xs font-bold text-slate-800 dir-ltr px-1">
                    {contact.display}
                  </span>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.number)}
                    className={`flex h-6 items-center gap-1 px-2 rounded-md text-[10px] font-bold transition-all cursor-pointer ${isCopied
                        ? "bg-emerald-500 text-white"
                        : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200/60"
                      }`}
                    title="نسخ الرقم"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-2.5 w-2.5" />
                        <span>تم</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-2.5 w-2.5" />
                        <span>نسخ</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}

            {/* Facebook Profile Pill */}
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200/80 bg-blue-50/60 px-3.5 py-1.5 text-xs font-bold text-[#1877F2] hover:bg-[#1877F2] hover:text-white transition-all shadow-2xs cursor-pointer group"
              title="فتح البروفايل الشخصي على فيسبوك"
            >
              <FacebookIcon className="h-4 w-4 fill-current group-hover:scale-105 transition-transform" />
              <span>فيسبوك</span>
              <ExternalLink className="h-3 w-3 opacity-60 group-hover:opacity-100" />
            </a>
          </div>
        </div>

        {/* Bottom Minimal Strip */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-right text-[11px] font-medium text-slate-400">
          <div>
            <span>جميع الحقوق محفوظة © {currentYear} • تصميم وتطوير </span>
            <span className="font-bold text-slate-700">محمد غانم</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <span>نظام أكاديمية</span>
            <span className="font-extrabold text-red-600">{academyName || "Re_action DOJO"}</span>
            <span className="text-slate-300">•</span>
            <span>إدارة تدريب وبطولات الكاراتيه</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
