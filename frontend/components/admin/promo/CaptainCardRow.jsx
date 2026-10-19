"use client";
import React, { useState, useRef, useCallback } from "react";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import {
  generatePromoCardCanvas,
  downloadPromoCard,
} from "../../../lib/promo-card-utils";

export default function CaptainCardRow({ captain, theme, features, onGenerate }) {
  const [state, setState] = useState("idle"); // idle | generating | done | error
  const [dataUrl, setDataUrl] = useState("");
  const canvasRef = useRef(null);

  const generate = useCallback(async () => {
    setState("generating");
    setDataUrl("");
    try {
      const canvas = await generatePromoCardCanvas({
        captainName: captain.name || "كابتن الأكاديمية",
        academyName: captain.academyName || "الأكاديمية",
        theme,
        features,
      });
      if (!canvas) throw new Error("no canvas");
      canvasRef.current = canvas;
      setDataUrl(canvas.toDataURL("image/png", 1.0));
      setState("done");
      onGenerate?.({ captain, canvas });
    } catch {
      setState("error");
    }
  }, [captain, theme, features, onGenerate]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    downloadPromoCard(
      canvasRef.current,
      `CoachMaster-${(captain.academyName || captain.name || "card").replace(/\s+/g, "-")}.png`
    );
  };

  return (
    <div className={`rounded-2xl border bg-white p-3.5 shadow-2xs transition ${
      state === "done" ? "border-emerald-200" : state === "error" ? "border-red-200" : "border-slate-200"
    }`}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white font-black text-sm shrink-0">
          {(captain.name || "ك").charAt(0)}
        </div>
        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black text-slate-900 truncate">{captain.name}</p>
          <p className="text-[11px] text-slate-500 font-medium truncate">🏫 {captain.academyName || "أكاديمية"}</p>
        </div>
        {/* Status + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {state === "idle" && (
            <button
              onClick={generate}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 text-[11px] font-black transition cursor-pointer"
            >
              توليد
            </button>
          )}
          {state === "generating" && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black">
              <Loader2 className="w-3 h-3 animate-spin" />
              جارٍ...
            </span>
          )}
          {state === "done" && (
            <div className="flex items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200">
                ✓ جاهز
              </span>
              <button
                onClick={handleDownload}
                className="w-7 h-7 rounded-lg bg-red-600 hover:bg-red-500 text-white flex items-center justify-center cursor-pointer transition"
                title="تحميل"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={generate}
                className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition"
                title="إعادة توليد"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          )}
          {state === "error" && (
            <button
              onClick={generate}
              className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 text-[11px] font-black border border-red-200 cursor-pointer hover:bg-red-100 transition"
            >
              إعادة المحاولة
            </button>
          )}
        </div>
      </div>

      {/* Mini preview */}
      {dataUrl && (
        <div className="mt-2.5 rounded-xl overflow-hidden border border-slate-100 max-h-32">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt="preview" className="w-full h-auto block" draggable="false" />
        </div>
      )}
    </div>
  );
}
