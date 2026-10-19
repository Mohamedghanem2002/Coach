"use client";
import React from "react";
import { SlidersHorizontal, X } from "lucide-react";

export default function CaptainFilterModal({
  isOpen,
  onClose,
  sortOptions = [],
  sortBy = "newest",
  onSortByChange,
  dateFilterOptions = [],
  dateFilter = "all",
  onDateFilterChange,
}) {
  if (!isOpen) return null;

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

        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-red-600" />
            <span>خيارات الترتيب والتصفية</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sort Options */}
        <div className="space-y-2">
          <span className="block text-xs font-bold text-slate-500">ترتيب النتائج حسب:</span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {sortOptions.map((so) => {
              const isSelected = sortBy === so.id;
              return (
                <button
                  key={so.id}
                  type="button"
                  onClick={() => {
                    onSortByChange && onSortByChange(so.id);
                  }}
                  className={`p-2.5 rounded-xl border text-right font-bold transition cursor-pointer ${
                    isSelected
                      ? "border-red-600 bg-red-50 text-red-700 shadow-2xs"
                      : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {so.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Joined Filter */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <span className="block text-xs font-bold text-slate-500">تاريخ الانضمام:</span>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {dateFilterOptions.map((dopt) => {
              const isSelected = dateFilter === dopt.id;
              return (
                <button
                  key={dopt.id}
                  type="button"
                  onClick={() => {
                    onDateFilterChange && onDateFilterChange(dopt.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                    isSelected
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  {dopt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Apply button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs cursor-pointer"
        >
          تطبيق وإغلاق
        </button>
      </div>
    </div>
  );
}
