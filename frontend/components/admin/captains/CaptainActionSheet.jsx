"use client";
import React from "react";
import {
  X,
  Eye,
  Clock,
  CreditCard,
  CheckCircle,
  ShieldAlert,
  Phone,
  Trash2,
} from "lucide-react";
import { WhatsAppIcon } from "../../common/SocialIcons";

export default function CaptainActionSheet({
  captain,
  onClose,
  onSelectCaptain,
  onOpenExtend,
  onTogglePayment,
  onOpenReactivate,
  onOpenSuspend,
  onOpenDelete,
}) {
  if (!captain) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs animate-backdrop"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="w-full max-w-lg mx-auto bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-4 shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto" />

        {/* Header info */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-black flex items-center justify-center shrink-0">
              {(captain.name || "C").charAt(0)}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-slate-900 truncate">
                {captain.name}
              </h3>
              <span className="block text-xs text-red-600 font-bold truncate">
                🥋 {captain.academyName}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Native Actions List */}
        <div className="space-y-1.5 text-xs font-bold text-slate-700">
          {/* View Full Profile */}
          <button
            type="button"
            onClick={() => {
              const cid = captain.id || captain._id;
              onClose();
              onSelectCaptain(cid);
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-900"
          >
            <Eye className="w-4 h-4 text-blue-600" />
            <span>عرض الملف الرياضي واللاعبين والصالات</span>
          </button>

          {/* Extend Subscription */}
          {!captain.isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenExtend && onOpenExtend(captain);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-900"
            >
              <Clock className="w-4 h-4 text-amber-600" />
              <span>تمديد فترة الاشتراك والصلاحية</span>
            </button>
          )}

          {/* Toggle Payment */}
          {!captain.isAdmin && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onTogglePayment && onTogglePayment(captain);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-900"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>تعديل حالة السداد</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                captain.subscriptionTotalAmount > 0
                  ? (captain.subscriptionRemainingAmount > 0
                      ? "bg-amber-100 text-amber-900 border border-amber-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200")
                  : (captain.subscriptionPaid
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800")
              }`}>
                {captain.subscriptionTotalAmount > 0
                  ? (captain.subscriptionRemainingAmount > 0
                      ? `دفع جزئي (متبقي ${captain.subscriptionRemainingAmount} ج.م)`
                      : `مسدد بالكامل (${captain.subscriptionTotalAmount} ج.م) ✓`)
                  : (captain.subscriptionPaid ? "مسدد ✓" : "غير مسدد")}
              </span>
            </button>
          )}

          {/* Suspend or Reactivate */}
          {!captain.isAdmin ? (
            captain.subscriptionStatus === "suspended" || captain.status === "suspended" ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReactivate && onOpenReactivate(captain);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 text-emerald-700 transition cursor-pointer"
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>إعادة تفعيل الحساب واستئناف الخدمة</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSuspend && onOpenSuspend(captain);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 text-amber-800 transition cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>إيقاف وتعليق الحساب مؤقتاً</span>
              </button>
            )
          ) : (
            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-100 text-center text-xs font-black text-purple-700">
              🛡️ حساب مدير المنصة محمي من أي تعديلات أو تعليق
            </div>
          )}

          {/* Direct Call / WhatsApp if phone available */}
          {captain.phone && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <a
                href={`tel:${captain.phone.replace(/\D/g, "")}`}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition"
              >
                <Phone className="w-3.5 h-3.5 text-red-600" />
                <span>اتصال هاتف</span>
              </a>

              <a
                href={`https://wa.me/${captain.phone.replace(/\D/g, "").startsWith("0") ? `2${captain.phone.replace(/\D/g, "")}` : captain.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 transition"
              >
                <WhatsAppIcon className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
            </div>
          )}

          {/* Delete permanently */}
          {!captain.isAdmin && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDelete && onOpenDelete(captain);
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف الحساب بجميع بياناته نهائياً</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
