"use client";
import { useState } from "react";
import { Building2, Pencil, Trash2, Check, X } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

export default function BranchManager({
  branches,
  players = [],
  onAdd,
  onRename,
  onDelete,
  onDeleteBlocked,
  notice = "",
  onClose,
}) {
  const [name, setName] = useState("");
  const [editingBranch, setEditingBranch] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [deleteTargetBranch, setDeleteTargetBranch] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);

  function submit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    onAdd(name.trim());
    setName("");
  }

  function startEdit(branch) {
    setEditingBranch(branch.name);
    setEditingName(branch.name);
  }

  function cancelEdit() {
    setEditingBranch(null);
    setEditingName("");
  }

  async function handleRenameSubmit(oldName) {
    const trimmed = editingName.trim();
    if (!trimmed || trimmed === oldName) {
      cancelEdit();
      return;
    }
    if (onRename) {
      setIsRenaming(true);
      try {
        await onRename(oldName, trimmed);
      } finally {
        setIsRenaming(false);
        cancelEdit();
      }
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTargetBranch) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTargetBranch);
    } finally {
      setIsDeleting(false);
      setDeleteTargetBranch(null);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-md animate-fade-in-scale"
        onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        dir="rtl"
      >
        <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl sm:p-8">
          {/* رأس النافذة */}
          <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-xs text-lg font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                  إعداد الصالات
                </p>
                <h2 className="font-cairo text-lg font-black text-slate-900 sm:text-xl">
                  إدارة فروع الأكاديمية
                </h2>
              </div>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          <p className="mb-4 text-xs font-medium leading-6 text-slate-500">
            أضف الصالات الرياضية وأماكن التدريب التابعة للأكاديمية، أو عدّل أسماءها لترتيب حضور واشتراكات الأبطال.
          </p>

          {notice && (
            <div
              className={`mb-4 flex items-center gap-2 rounded-xl border p-3 text-xs font-bold leading-6 ${
                notice.startsWith("تم")
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
              role="status"
            >
              <span>{notice.startsWith("تم") ? "✓" : "⚠️"}</span>
              <span>{notice}</span>
            </div>
          )}

          <form className="mb-5 flex flex-col gap-2 sm:flex-row" onSubmit={submit}>
            <input
              className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-right text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-3 focus:ring-red-100"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="اسم الفرع، مثال: صالة النادي الرئيسي"
              required
            />
            <button
              className="min-h-11 whitespace-nowrap rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 text-xs font-black text-white shadow-xs hover:brightness-110 active:scale-95 cursor-pointer"
              type="submit"
            >
              ＋ إضافة فرع
            </button>
          </form>

          <div className="grid max-h-[42vh] gap-2.5 overflow-y-auto pr-0.5">
            {branches.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400">
                <span className="text-3xl block mb-2">🏢</span>
                <p className="text-xs font-bold">لم تتم إضافة فروع بعد.</p>
              </div>
            ) : (
              branches.map((branch) => {
                const playerCount = players.filter(
                  (player) => player.branch === branch.name
                ).length;
                const isEditingThis = editingBranch === branch.name;

                return (
                  <div
                    key={branch._id}
                    className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 transition hover:border-slate-300 hover:bg-white"
                  >
                    {isEditingThis ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          className="h-9 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-900 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                          disabled={isRenaming}
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameSubmit(branch.name)}
                          disabled={isRenaming || !editingName.trim()}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                          title="حفظ الاسم"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isRenaming}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          title="إلغاء"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-2xs border border-slate-200/60">
                            🥋
                          </div>
                          <div className="min-w-0 flex-1">
                            <strong className="block truncate font-cairo text-sm font-extrabold text-slate-900">
                              {branch.name}
                            </strong>
                            <span className="text-[11px] font-bold text-slate-400">
                              {playerCount} لاعب مسجل
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {onRename && (
                            <button
                              type="button"
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              onClick={() => startEdit(branch)}
                              title="تعديل اسم الفرع"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-200/60 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95 cursor-pointer"
                            onClick={() => {
                              if (playerCount) {
                                onDeleteBlocked?.(branch.name, playerCount);
                                return;
                              }
                              setDeleteTargetBranch(branch.name);
                            }}
                            title="حذف الفرع"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">حذف</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Confirmation modal for deleting empty branch */}
      <ConfirmDialog
        isOpen={Boolean(deleteTargetBranch)}
        title="تأكيد حذف الفرع"
        message={`هل أنت متأكد من رغبتك في حذف فرع "${deleteTargetBranch}"؟ لن يمكنك التراجع عن هذا الإجراء.`}
        confirmText="نعم، احذف الفرع"
        cancelText="تراجع"
        confirmVariant="danger"
        isBusy={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetBranch(null)}
      />
    </>
  );
}
