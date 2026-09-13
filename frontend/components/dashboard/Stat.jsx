export default function Stat({ label, value, note, icon, color = "red" }) {
  const colorThemes = {
    red: {
      border: "border-slate-200/90 hover:border-red-200",
      iconBg: "bg-red-600 text-white shadow-sm shadow-red-600/20",
      accent: "text-red-600",
    },
    green: {
      border: "border-slate-200/90 hover:border-emerald-200",
      iconBg: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20",
      accent: "text-emerald-600",
    },
    blue: {
      border: "border-slate-200/90 hover:border-sky-200",
      iconBg: "bg-sky-600 text-white shadow-sm shadow-sky-600/20",
      accent: "text-sky-600",
    },
    orange: {
      border: "border-slate-200/90 hover:border-amber-200",
      iconBg: "bg-amber-600 text-white shadow-sm shadow-amber-600/20",
      accent: "text-amber-600",
    },
  };

  const theme = colorThemes[color] || colorThemes.red;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${theme.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold text-slate-500">
            {label}
          </span>
          <strong className="mt-1 block font-cairo text-2xl font-black tracking-tight text-slate-900">
            {value}
          </strong>
          {note && (
            <small className="mt-1 block truncate text-[10px] font-medium text-slate-400">
              {note}
            </small>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-md ${theme.iconBg}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

