"use client";

import { useState } from "react";
import { Phone, Copy, Check, ExternalLink } from "lucide-react";

function FacebookIcon({ className = "w-3.5 h-3.5" }) {
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

function WhatsAppIcon({ className = "w-3.5 h-3.5" }) {
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
      className="w-full mt-10 sm:mt-12 border-t border-slate-200/70 bg-slate-50/40 py-5 pb-24 md:pb-6 transition-colors"
      dir="rtl"
    >
      <div className="mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 space-y-3.5">
        {/* ━━━ كبسولات التواصل المدمجة (كبسولة لكل رقم + كبسولة فيسبوك) ━━━ */}
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2.5">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {phoneContacts.map((contact) => {
              const isCopied = copiedNumber === contact.number;
              return (
                <div
                  key={contact.number}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 shadow-2xs hover:border-slate-300 transition-colors"
                >
                  <span
                    className="font-mono text-xs font-black text-slate-800 tracking-wider pl-1"
                    dir="ltr"
                  >
                    {contact.display}
                  </span>

                  <span className="h-3 w-px bg-slate-200 shrink-0" />

                  {/* اتصال هاتف */}
                  <a
                    href={`tel:${contact.number}`}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={`اتصال (${contact.number})`}
                  >
                    <Phone className="h-3 w-3" />
                  </a>

                  {/* مراسلة واتساب */}
                  <a
                    href={`https://wa.me/${contact.rawWhatsApp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title={`مراسلة واتساب (${contact.number})`}
                  >
                    <WhatsAppIcon className="h-3 w-3" />
                  </a>

                  {/* نسخ الرقم */}
                  <button
                    type="button"
                    onClick={() => handleCopy(contact.number)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                    title={isCopied ? "تم النسخ" : "نسخ الرقم"}
                  >
                    {isCopied ? (
                      <Check className="h-3 w-3 text-emerald-600 stroke-[3]" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
              );
            })}

            {/* كبسولة رابط فيسبوك */}
            <a
              href={facebookLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/90 bg-white px-3 py-1 text-xs font-bold text-slate-700 hover:text-[#1877F2] hover:border-blue-200 hover:bg-blue-50/30 shadow-2xs transition-colors"
              title="صفحة فيسبوك الرسمية"
            >
              <FacebookIcon className="h-3.5 w-3.5 text-[#1877F2]" />
              <span>فيسبوك</span>
              <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
            </a>
          </div>

          {/* سطر الحقوق السريع */}
          <div className="text-[11px] font-semibold text-slate-400 text-center sm:text-left">
            جميع الحقوق محفوظة © {currentYear}
          </div>
        </div>

        {/* ━━━ السطر الثاني: هوية الأكاديمية والمطور ━━━ */}
        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-cairo font-black text-slate-800">
              {academyName || "Re_action DOJO"}
            </span>
            <span className="text-slate-300">•</span>
            <span>نظام إدارة أكاديمية الكاراتيه 🥋</span>
          </div>

          <div className="text-xs">
            <span>تطوير: </span>
            <strong className="text-slate-700 font-bold">محمد غانم</strong>
          </div>
        </div>
      </div>
    </footer>
  );
}
