"use client";
import React, { useState } from "react";
import {
  X,
  Sparkles,
  Users,
  Building2,
  Trophy,
  CreditCard,
  BarChart3,
  Smartphone,
  CheckCircle2,
  Zap,
  ShieldCheck,
  Cake,
  FileText,
  Clock,
  ShoppingBag,
  RotateCcw,
} from "lucide-react";

const FEATURE_CATEGORIES = [
  {
    id: "players",
    title: "إدارة اللاعبين والأبطال",
    icon: Users,
    color: "from-blue-600 to-indigo-600",
    badge: "الأساس",
    desc: "منظومة متكاملة لبيانات أبطال الأكاديمية",
    points: [
      {
        title: "تسجيل بيانات اللاعبين بالكامل",
        desc: "حفظ الاسم، السن، تاريخ الميلاد، الحزام، الصالة التابع لها، ورقم هاتف ولي الأمر للتواصل المباشر.",
      },
      {
        title: "كروت بروفايل احترافية للواتساب",
        desc: "توليد كارت شخصي عالي الدقة بصورة اللاعب ورتبته لمشاركته مع ولي الأمر بضغطة زر.",
      },
      {
        title: "كروت تهنئة أعياد الميلاد التلقائية",
        desc: "تنبيه يومي بأعياد ميلاد أبطال اليوم والغد مع توليد كارت تهنئة احترافي باسم وصورة اللاعب فوراً.",
      },
      {
        title: "كروت ترحيب بالأبطال الجدد",
        desc: "كارت ترحيب مخصص عند انضمام أي لاعب جديد للأكاديمية لترك انطباع احترافي لدى أولياء الأمور.",
      },
      {
        title: "بحث وتصفية سريعة",
        desc: "فلترة فورية حسب الفرع، الحزام، حالة السداد، أو الحضور لتسهيل إدارة الأعداد الكبيرة.",
      },
    ],
  },
  {
    id: "branches",
    title: "الصالات ومواعيد الحصص",
    icon: Building2,
    color: "from-rose-600 to-red-600",
    badge: "تنظيم",
    desc: "إدارة الفروع ومواعيد التدريب الرسمية",
    points: [
      {
        title: "إضافة فروع وتحديد أيام التدريب",
        desc: "تحديد أيام تمرين كل صالة من أيام الأسبوع السبعة مع إمكانية التحديد السريع (سبت/إثنين/أربعاء أو أحد/ثلاثاء/خميس).",
      },
      {
        title: "تحديد ساعات الحصة بنظام 12 ساعة",
        desc: "ضبط وقت بداية ونهاية التدريب بالساعة والدقيقة بصيغة 12 ساعة الواضحة (صباحاً ومساءً).",
      },
      {
        title: "زر تحضير الكل الذكي",
        desc: "زر تحضير يفتح حصرياً أثناء موعد الحصة المعتمد للصالة، ويقفل تلقائياً في العطلات أو بعد انتهاء الحصة.",
      },
      {
        title: "تقرير غياب وحضور الصالة للواتساب",
        desc: "توليد كارت تقرير حضور الصالة بأسماء الحاضرين والغائبين لمشاركته على جروب أولياء الأمور.",
      },
    ],
  },
  {
    id: "finances",
    title: "الاشتراكات وسجل المشتريات",
    icon: CreditCard,
    color: "from-emerald-600 to-teal-600",
    badge: "مالية",
    desc: "متابعة الاشتراكات الشهرية وسداد الأدوات والبدل",
    points: [
      {
        title: "متابعة اشتراكات الشهور",
        desc: "تتبع سداد اشتراك كل شهر (مدفوع بالكامل، مدفوع جزئياً، متبقي) مع ملخصات المبالغ تلقائياً.",
      },
      {
        title: "نافذة السداد السريع",
        desc: "تسجيل المبالغ المدفوعة وتاريخ الدفعة بنقرة واحدة من صف اللاعب مباشرة.",
      },
      {
        title: "سجل الأدوات والبدل مع حالة الاستلام",
        desc: "تسجيل شراء البدل، الأحزمة، والواقيات مع زر تفاعلي فوري (استلم ✓ / لم يستلم ⏳) ومتابعة المتبقي.",
      },
      {
        title: "تنبيهات المبالغ المتبقية",
        desc: "حساب فوري للمتأخرات والمبالغ المستحقة لسهولة تحصيلها بدون أي التباس.",
      },
    ],
  },
  {
    id: "events",
    title: "الفعاليات والبطولات",
    icon: Trophy,
    color: "from-amber-500 to-orange-600",
    badge: "بطولات",
    desc: "تنظيم البطولات والمعسكرات واختبارات الأحزمة",
    points: [
      {
        title: "إنشاء الفعاليات والمسابقات",
        desc: "تحديد اسم الفعالية، التاريخ، المكان، رسوم الاشتراك، والحد الأقصى للمشاركين.",
      },
      {
        title: "تسجيل اللاعبين ومتابعة الرسوم",
        desc: "إضافة أبطال الأكاديمية للفعالية وتتبع من سدد الرسوم ومن عليه متبقي.",
      },
      {
        title: "كشوفات قابلة للمشاركة والطباعة",
        desc: "تصدير كشف المشاركين في البطولة أو الاختبار لترتيب المشاركة الرسمية.",
      },
    ],
  },
  {
    id: "reports",
    title: "التقارير ولوحة التحكم الحية",
    icon: BarChart3,
    color: "from-sky-600 to-blue-600",
    badge: "ذكاء",
    desc: "إحصائيات فورية شاملة عن أداء الأكاديمية",
    points: [
      {
        title: "مؤشرات الحضور اليومية",
        desc: "عرض نسب الحضور اليومية والغياب في الوقت الفعلي لكل فرع وللأكاديمية ككل.",
      },
      {
        title: "إحصائيات مالية واضحة",
        desc: "معرفة إجمالي المحصل، المتبقي، وعدد الاشتراكات النشطة خلال الشهر المحدد.",
      },
      {
        title: "تقارير واتساب فورية",
        desc: "إرسال تقرير نصي أو كارت مصمم بكامل تفاصيل الحضور والمدفوعات لولي الأمر.",
      },
    ],
  },
  {
    id: "security",
    title: "النسخ الاحتياطي والسرعة",
    icon: ShieldCheck,
    color: "from-purple-600 to-pink-600",
    badge: "أمان",
    desc: "حماية بياناتك والعمل على جميع الأجهزة",
    points: [
      {
        title: "نسخ احتياطي سحابي فوري",
        desc: "حفظ نسخة من جميع بيانات الأكاديمية على السحابة بضغطة زر واحدة لحمايتها من أي فقدان.",
      },
      {
        title: "استعادة البيانات بأمان",
        desc: "إمكانية استعادة بياناتك من السحابة أو من ملف احتياطي في أي وقت.",
      },
      {
        title: "يعمل على كل الشاشات",
        desc: "مصمم بأعلى معايير السرعة ليعمل بسلاسة فائقة على الموبايل والتابلت والكمبيوتر بدون تحميل أي تطبيق.",
      },
    ],
  },
];

export default function SystemFeaturesModal({ isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState(FEATURE_CATEGORIES[0].id);

  if (!isOpen) return null;

  const currentCat = FEATURE_CATEGORIES.find((c) => c.id === activeCategory) || FEATURE_CATEGORIES[0];
  const IconComp = currentCat.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl max-h-[92vh] rounded-3xl bg-white shadow-2xl border border-slate-200/90 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 shadow-md">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-cairo text-base sm:text-lg font-black text-white">
                  دليل ومميزات منصة CoachMaster
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-600/30 text-red-200 border border-red-500/40">
                  دليل الكابتن 🥋
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                تعرف على جميع إمكانيات ومميزات منصتك لإدارة أكاديميتك باحترافية وسهولة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white transition cursor-pointer"
            title="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 p-2 sm:p-2.5 bg-slate-100 border-b border-slate-200 overflow-x-auto scrollbar-none shrink-0">
          {FEATURE_CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            const CatIcon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all shrink-0 cursor-pointer ${
                  active
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/80 scale-[1.02]"
                    : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
                }`}
              >
                <CatIcon className={`h-3.5 w-3.5 ${active ? "text-red-600" : "text-slate-500"}`} />
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Section banner */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-l from-slate-50 to-red-50/40 border border-red-100">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${currentCat.color} text-white shadow-xs`}>
                <IconComp className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cairo text-sm sm:text-base font-black text-slate-900">
                    {currentCat.title}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    {currentCat.badge}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {currentCat.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Feature Points Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentCat.points.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-red-200 hover:shadow-xs transition"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 border border-red-100 font-black text-xs mt-0.5">
                  ✓
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-cairo text-xs sm:text-sm font-black text-slate-900 leading-tight">
                    {pt.title}
                  </h4>
                  <p className="text-[11px] font-medium text-slate-600 mt-1 leading-relaxed">
                    {pt.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip Box */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs font-semibold">
            <Zap className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed text-[11px]">
              <strong className="block font-black text-amber-950 mb-0.5">💡 نصيحة للكابتن:</strong>
              يمكنك استخدام النظام بالكامل من هاتفك المحمول بكل سهولة وسرعة، وبدون الحاجة لتحميل أي تطبيقات من المتجر.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500">
            منصة CoachMaster • نظام إدارة الأكاديميات الذكية
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition cursor-pointer shadow-xs"
          >
            فهمت، حسناً ✓
          </button>
        </div>
      </div>
    </div>
  );
}
