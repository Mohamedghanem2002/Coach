import {
  Compass,
  Trophy,
  Tent,
  Award,
  Sparkles,
} from "lucide-react";

export const TYPE_CONFIG = {
  trip: {
    label: "رحلة ترفيهية",
    icon: Compass,
    color: "text-amber-700 bg-amber-50 border-amber-200",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    gradient: "from-amber-500 to-orange-600",
  },
  tournament: {
    label: "بطولة ومنافسة",
    icon: Trophy,
    color: "text-rose-700 bg-rose-50 border-rose-200",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    gradient: "from-rose-500 to-red-600",
  },
  camp: {
    label: "معسكر تدريبي",
    icon: Tent,
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badge: "bg-emerald-100 text-emerald-800 border-emerald-200",
    gradient: "from-emerald-500 to-teal-600",
  },
  belt_exam: {
    label: "اختبار حزام",
    icon: Award,
    color: "text-sky-700 bg-sky-50 border-sky-200",
    badge: "bg-sky-100 text-sky-800 border-sky-200",
    gradient: "from-sky-500 to-blue-600",
  },
  other: {
    label: "فعالية خاصة",
    icon: Sparkles,
    color: "text-purple-700 bg-purple-50 border-purple-200",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    gradient: "from-purple-500 to-indigo-600",
  },
};

export const STATUS_LABELS = {
  upcoming: {
    label: "قادم",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  active: {
    label: "نشط الآن",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500 animate-pulse",
  },
  completed: {
    label: "مكتمل",
    color: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  cancelled: {
    label: "ملغي",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500",
  },
};
