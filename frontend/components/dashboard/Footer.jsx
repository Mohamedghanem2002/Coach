"use client";

import { useState } from "react";
import { Phone, Copy, Check, ExternalLink } from "lucide-react";

import { FacebookIcon, WhatsAppIcon } from "../common/SocialIcons";


export default function Footer({ academyName = "CoachMaster" } = {}) {
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
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1760px] px-4 sm:px-6 lg:px-8 xl:px-10 space-y-3.5">
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

        {/* ━━━ السطر الثاني: هوية المنصة والمطور ━━━ */}
        <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-center sm:justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-start">
            <span className="font-cairo font-black text-slate-900 bg-red-50 border border-red-200/80 text-red-700 px-2 py-0.5 rounded-lg text-xs">
              منصة CoachMaster 🥋
            </span>
            <span className="text-slate-300">•</span>
            <span>نظام إدارة وتدريب أكاديميات الكاراتيه</span>
            {academyName && academyName !== "CoachMaster" && (
              <>
                <span className="text-slate-300">•</span>

              </>
            )}
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
