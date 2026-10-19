import { X } from "lucide-react";

export default function ProfileZoomPhotoModal({ isOpen, onClose, player }) {
  if (!isOpen || !player?.photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-3 sm:p-5 backdrop-blur-md animate-fade-in-scale"
      dir="rtl"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative max-h-[94vh] max-w-md sm:max-w-lg w-full overflow-hidden rounded-3xl border border-slate-700 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 p-4 sm:p-5 text-white shadow-2xl flex flex-col items-center">
        {/* Modal Header */}
        <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥋</span>
            <div>
              <h3 className="font-cairo text-xs sm:text-sm font-black text-red-400">
                صورة البطل / {player.name}
              </h3>
              <p className="text-[10px] text-slate-400">
                حزام {player.belt || "أبيض"} • فرع {player.branch}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white cursor-pointer transition"
            title="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Enlarged Photo Display */}
        <div className="relative flex items-center justify-center max-h-[68vh] w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/90 p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={player.photo}
            alt={player.name}
            className="max-h-[64vh] w-auto max-w-full rounded-xl object-contain shadow-2xl ring-1 ring-white/10"
          />
        </div>

        {/* Bottom Actions */}
        <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-400 px-1 pt-1 shrink-0">
          <span className="text-[10px] text-slate-400">انقر في أي مكان خارج الصورة للإغلاق</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
