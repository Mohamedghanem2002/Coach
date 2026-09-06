export default function Stat({ label, value, note, icon, color }) {
  const styles = {
    red: "border-red-100 bg-red-50/60 text-red-600",
    green: "border-green-100 bg-green-50/60 text-green-600",
    blue: "border-blue-100 bg-blue-50/60 text-blue-600",
    orange: "border-orange-100 bg-orange-50/60 text-orange-600",
  };
  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles[color]}`}>
      <div className="mb-3 grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-base">
        {icon}
      </div>
      <div>
        <span className="block text-[10px] font-semibold text-slate-500">
          {label}
        </span>
        <strong className="mt-1 block text-2xl font-extrabold text-slate-900">
          {value}
        </strong>
        <small className="mt-1 block text-[9px] text-slate-400">{note}</small>
      </div>
    </div>
  );
}
