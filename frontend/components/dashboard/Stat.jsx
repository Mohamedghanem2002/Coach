export default function Stat({ label, value, note, icon, color = "red" }) {
  const colorThemes = {
    red: {
      border: "border-rose-100 hover:border-rose-200",
      iconBg: "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20",
      accent: "text-rose-600",
    },
    green: {
      border: "border-emerald-100 hover:border-emerald-200",
      iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-500/20",
      accent: "text-emerald-600",
    },
    blue: {
      border: "border-sky-100 hover:border-sky-200",
      iconBg: "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-sky-500/20",
      accent: "text-sky-600",
    },
    orange: {
      border: "border-amber-100 hover:border-amber-200",
      iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20",
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

