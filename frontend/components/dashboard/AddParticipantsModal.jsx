"use client";
import { useMemo, useState } from "react";
import { Search, UserPlus, Check, X, Building2, Users } from "lucide-react";
import { BELT_HEX } from "../../lib/dashboard-utils";

export default function AddParticipantsModal({
  isOpen,
  onClose,
  onAddParticipants,
  players = [],
  branches = [],
  event = null,
  isSubmitting = false,
}) {
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [batchFee, setBatchFee] = useState(event?.fee !== undefined ? event.fee : 150);

  // Set of already participating player IDs in this event
  const existingPlayerIdSet = useMemo(() => {
    return new Set((event?.participants || []).map((p) => p.playerId?.toString()));
  }, [event]);

  // Filter players based on search and branch
  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const matchesBranch =
        selectedBranch === "all" || player.branch === selectedBranch;
      const matchesSearch =
        !search.trim() || player.name.toLowerCase().includes(search.trim().toLowerCase());
      return matchesBranch && matchesSearch;
    });
  }, [players, selectedBranch, search]);

  // Selectable players (those not already in event)
  const selectablePlayers = useMemo(() => {
    return filteredPlayers.filter((p) => !existingPlayerIdSet.has(p._id?.toString()));
  }, [filteredPlayers, existingPlayerIdSet]);

  if (!isOpen || !event) return null;

  function togglePlayer(id) {
    setSelectedPlayerIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  }

  function toggleSelectAll() {
    const selectableIds = selectablePlayers.map((p) => p._id.toString());
    const allSelected = selectableIds.every((id) => selectedPlayerIds.includes(id));
    if (allSelected) {
      setSelectedPlayerIds((prev) =>
        prev.filter((id) => !selectableIds.includes(id)),
      );
    } else {
      setSelectedPlayerIds((prev) => [
        ...new Set([...prev, ...selectableIds]),
      ]);
    }
  }

  async function handleConfirm() {
    if (!selectedPlayerIds.length) return;
    await onAddParticipants({
      eventId: event._id,
      playerIds: selectedPlayerIds,
      fee: Number(batchFee) >= 0 ? Number(batchFee) : (event.fee || 150),
    });
    setSelectedPlayerIds([]);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4 backdrop-blur-xs transition-all duration-300"
      dir="rtl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl border border-slate-200/80 bg-white shadow-2xl overflow-hidden animate-bottom-sheet sm:animate-modal-pop max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative border-b border-slate-100 bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 text-white shrink-0">
          <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-white/40 sm:hidden" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white shadow-xs backdrop-blur-xs">
                <UserPlus className="h-5 w-5 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="font-cairo text-base font-black leading-tight">
                  إضافة أبطال إلى {event.title}
                </h3>
                <p className="text-[11px] font-semibold text-white/80">
                  حدد اللاعبين المشتركين بالحدث لتسجيلهم ومتابعة سدادهم
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Search & Branch Bar */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/70 shrink-0">
          <div className="relative flex items-center rounded-xl border border-slate-200/90 bg-white px-3 py-1 shadow-xs">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم اللاعب..."
              className="w-full bg-transparent px-2.5 py-1.5 text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar touch-scroll">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedBranch("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  selectedBranch === "all"
                    ? "bg-red-600 text-white shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                }`}
              >
                كل الصالات ({players.length})
              </button>
              {branches.map((b) => (
                <button
                  key={b._id}
                  type="button"
                  onClick={() => setSelectedBranch(b.name)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                    selectedBranch === b.name
                      ? "bg-red-600 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {selectablePlayers.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="shrink-0 text-xs font-black text-red-600 hover:text-red-700 underline cursor-pointer"
              >
                تحديد المتاح
              </button>
            )}
          </div>
        </div>

        {/* Players List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 touch-scroll">
          {filteredPlayers.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs font-bold">
              لا يوجد لاعبين مطابقين للبحث
            </div>
          ) : (
            filteredPlayers.map((player) => {
              const pId = player._id?.toString();
              const isAlreadyIn = existingPlayerIdSet.has(pId);
              const isSelected = selectedPlayerIds.includes(pId);
              const beltColor = BELT_HEX[player.belt] || "#e2e8f0";

              return (
                <div
                  key={pId}
                  onClick={() => {
                    if (!isAlreadyIn) togglePlayer(pId);
                  }}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isAlreadyIn
                      ? "border-emerald-200 bg-emerald-50/40 opacity-75 cursor-not-allowed"
                      : isSelected
                      ? "border-red-500 bg-red-50/60 shadow-xs ring-2 ring-red-100 cursor-pointer"
                      : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Checkbox */}
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all ${
                        isAlreadyIn
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : isSelected
                          ? "border-red-600 bg-red-600 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {(isAlreadyIn || isSelected) && (
                        <Check className="h-4 w-4 stroke-[3]" />
                      )}
                    </div>

                    {/* Avatar */}
                    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 overflow-hidden ring-2 ring-slate-100">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-cairo text-sm font-black text-slate-500">
                          {player.name.slice(0, 1)}
                        </span>
                      )}
                      <span
                        className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-white"
                        style={{ backgroundColor: beltColor }}
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <strong className="block truncate font-cairo text-xs font-black text-slate-900">
                        {player.name}
                      </strong>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-slate-500">
                        <span className="flex items-center gap-0.5">
                          <Building2 className="h-3 w-3 text-slate-400" />
                          {player.branch}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600 font-bold">{player.belt}</span>
                      </div>
                    </div>
                  </div>

                  {/* Badge */}
                  <div>
                    {isAlreadyIn ? (
                      <span className="rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-black text-emerald-800">
                        مشترك بالفعل ✓
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">
                        {isSelected ? "تم الاختيار" : "اضغط للإضافة"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 pb-safe">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="text-xs font-black text-slate-800">
              تم تحديد: <span className="text-red-600 text-sm font-black">{selectedPlayerIds.length}</span> لاعب
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
              <span>الرسوم:</span>
              <input
                type="number"
                min="0"
                value={batchFee}
                onChange={(e) => setBatchFee(e.target.value)}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs font-black text-emerald-700 text-center outline-none"
              />
              <span>ج.م</span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={selectedPlayerIds.length === 0 || isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-xs font-black text-white shadow-md shadow-red-500/25 active:scale-95 transition disabled:opacity-40 cursor-pointer"
            >
              {isSubmitting
                ? "جاري الإضافة..."
                : `إضافة (${selectedPlayerIds.length}) لاعبين`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
