"use client";

import { useState } from "react";
import { Phone, Copy, Check, ExternalLink, Code2, Sparkles } from "lucide-react";

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
      label: "الخط الأول (دعم وطلبات)",
      tag: "أساسي",
    },
    {
      number: "01028138408",
      display: "0102 813 8408",
      rawWhatsApp: "201028138408",
      label: "الخط الثاني (مباشر وسريع)",
      tag: "إضافي",
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
      className="w-full mt-8 sm:mt-12 border-t border-slate-200/90 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/90 pt-6 sm:pt-10 pb-28 md:pb-10 transition-colors"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        {/* ━━━ بطاقة هوية المطور ورابط الفيسبوك ━━━ */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs">
          {/* إضاءات جمالية متناسقة مع ألوان الموقع (Red & Rose ambient blurs) */}
          <div className="pointer-events-none absolute -left-10 -top-10 h-36 w-36 rounded-full bg-red-500/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-36 w-36 rounded-full bg-rose-500/10 blur-2xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* معلومات المطور */}
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 via-rose-600 to-red-700 text-white shadow-md shadow-red-600/20 ring-4 ring-red-50">
                <Code2 className="h-6 w-6 stroke-[2.2]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-cairo text-base sm:text-xl font-black text-slate-900 tracking-tight">
                    محمد غانم
                  </h3>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200/80 px-2.5 py-0.5 text-[10px] font-black text-red-700">
                    <Sparkles className="h-3 w-3 text-red-600 animate-spin-slow" />
                    مطور المنظومة 🥋
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold truncate mt-0.5">
                  برمجة وتطوير الأنظمة وإدارة أندية وأكاديميات الكاراتيه
                </p>
              </div>
            </div>

            {/* رابط فيسبوك المباشر */}
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-[#1877F2] hover:bg-[#1565cf] text-white text-xs sm:text-sm font-black shadow-md shadow-blue-500/25 active-press transition cursor-pointer touch-manipulation group shrink-0"
              title="زيارة صفحة فيسبوك الرسمية"
            >
              <FacebookIcon className="h-4 w-4 fill-white group-hover:scale-110 transition-transform" />
              <span>صفحة فيسبوك الرسمية</span>
              <ExternalLink className="h-3.5 w-3.5 text-white/80 group-hover:translate-x-[-2px] transition-transform" />
            </a>
          </div>
        </div>

        {/* ━━━ شبكة بطاقات الأرقام (اتصال + مراسلة واتس جنب كل رقم) ━━━ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {phoneContacts.map((contact, idx) => {
            const isCopied = copiedNumber === contact.number;
            return (
              <div
                key={contact.number}
                className="relative rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all space-y-3.5"
              >
                {/* رأس كارت الرقم */}
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white font-mono text-xs font-black shadow-2xs">
                      0{idx + 1}
                    </div>
                    <div>
                      <span className="block text-[11px] font-bold text-slate-400">
                        {contact.label}
                      </span>
                      <strong className="block font-mono text-base sm:text-lg font-black text-slate-900 tracking-wider" dir="ltr">
                        {contact.display}
                      </strong>
                    </div>
                  </div>

                  <span className="rounded-lg bg-slate-100 border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {contact.tag}
                  </span>
                </div>

                {/* أزرار الإجراءات لكل رقم: اتصال + مراسلة واتس + نسخ */}
                <div className="grid grid-cols-12 gap-2">
                  {/* زر الاتصال الهاتفي المباشر */}
                  <a
                    href={`tel:${contact.number}`}
                    className="col-span-5 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-black shadow-xs shadow-red-600/20 active-press transition cursor-pointer touch-manipulation text-center"
                    title={`إجراء اتصال هاتفي (${contact.number})`}
                  >
                    <Phone className="h-4 w-4" />
                    <span>اتصال</span>
                  </a>

                  {/* زر مراسلة واتساب الفورية */}
                  <a
                    href={`https://wa.me/${contact.rawWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="col-span-5 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs shadow-emerald-600/20 active-press transition cursor-pointer touch-manipulation text-center"
                    title={`مراسلة عبر واتساب (${contact.number})`}
                  >
                    <WhatsAppIcon className="h-4 w-4 fill-white" />
                    <span>مراسلة واتس</span>
                  </a>

                  {/* زر نسخ الرقم */}
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.number)}
                    className={`col-span-2 flex items-center justify-center rounded-xl border text-xs font-bold transition active-press cursor-pointer touch-manipulation ${
                      isCopied
                        ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600"
                    }`}
                    title={isCopied ? "تم نسخ الرقم بنجاح" : "نسخ رقم الهاتف"}
                  >
                    {isCopied ? (
                      <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Copy className="h-4 w-4 text-slate-500" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ━━━ شريط الحقوق السفلي (بنفس هوية الموقع) ━━━ */}
        <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-right text-xs font-semibold text-slate-500">
          <div>
            <span>جميع الحقوق محفوظة © {currentYear} • تصميم وتطوير </span>
            <strong className="text-slate-800 font-black">محمد غانم</strong>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <span>نظام إدارة أكاديمية</span>
            <span className="font-cairo font-black text-red-600">{academyName || "Re_action DOJO"}</span>
            <span className="text-slate-300">•</span>
            <span>كاراتيه وبطولات 🥋</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
