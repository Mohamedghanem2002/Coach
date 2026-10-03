/**
 * CoachMaster Promotional Card Generator
 * Generates a stunning 1080x1350 promotional card (4:5 portrait) for marketing.
 * Supports both:
 * 1. Unified Card for ALL Subscribers/Academies on ONE Card with adaptive font sizing.
 * 2. Dedicated Single Academy Card.
 */

// Features list shown on the card
export const SYSTEM_FEATURES = [
  {
    icon: "👥",
    text: "إدارة اللاعبين والأبطال",
    title: "إدارة اللاعبين والأبطال",
    desc: "بيانات كاملة، كروت بروفايل وترحيب لكل بطل",
  },
  {
    icon: "🏟️",
    text: "إدارة الصالات والفروع",
    title: "إدارة الصالات والفروع",
    desc: "تنظيم الحصص بنظام 12 ساعة وتحضير ذكي",
  },
  {
    icon: "🏆",
    text: "الاختبارات والبطولات",
    title: "الاختبارات والبطولات",
    desc: "تنظيم الفعاليات، المعسكرات وكشوفات المشاركة",
  },
  {
    icon: "💳",
    text: "متابعة الاشتراكات والمدفوعات",
    title: "متابعة الاشتراكات والمدفوعات",
    desc: "تتبع سداد الرسوم وتسليم البدل والأدوات",
  },
  {
    icon: "🎂",
    text: "كروت تهنئة أعياد الميلاد",
    title: "كروت تهنئة أعياد الميلاد",
    desc: "تنبيه يومي وتوليد كروت واتساب احترافية فوراً",
  },
  {
    icon: "📊",
    text: "تقارير ولوحة تحكم ذكية",
    title: "تقارير ولوحة تحكم ذكية",
    desc: "مؤشرات حضور يومية وإحصائيات مالية دقيقة",
  },
  {
    icon: "📱",
    text: "يعمل على الجوال والكمبيوتر",
    title: "يعمل على الجوال والكمبيوتر",
    desc: "واجهة فائقة السرعة وبدون تحميل أي تطبيق",
  },
  {
    icon: "🔒",
    text: "نظام آمن وموثوق",
    title: "نظام آمن وموثوق",
    desc: "نسخ احتياطي سحابي فوري وحماية تامة للبيانات",
  },
];

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r);
  } else {
    const radii = Array.isArray(r) ? r : [r, r, r, r];
    ctx.moveTo(x + radii[0], y);
    ctx.lineTo(x + w - radii[1], y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radii[1]);
    ctx.lineTo(x + w, y + h - radii[2]);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radii[2], y + h);
    ctx.lineTo(x + radii[3], y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radii[3]);
    ctx.lineTo(x, y + radii[0]);
    ctx.quadraticCurveTo(x, y, x + radii[0], y);
    ctx.closePath();
  }
}

export async function generatePromoCardCanvas({
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الفنون القتالية",
  theme = "dark",
  features = null,
  captains = null,
  isAllSubscribers = false,
}) {
  if (typeof document === "undefined") return null;

  if (document.fonts && document.fonts.status !== "loaded") {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((r) => setTimeout(r, 300)),
      ]);
    } catch (_) { }
  }

  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const featureList = (features || SYSTEM_FEATURES).slice(0, 8);
  const isMultiCaptains = isAllSubscribers || (Array.isArray(captains) && captains.length > 0);
  const captainsList = Array.isArray(captains) && captains.length > 0 ? captains : [];

  const themes = {
    dark: {
      bg1: "#0f0f1a", bg2: "#1a0a0a", bg3: "#0a0f1a",
      accent: "#ef4444", accent2: "#f97316", gold: "#f59e0b",
      cardBg: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.12)",
      textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.85)",
      textMuted: "rgba(255,255,255,0.50)",
      glowColor: "rgba(239,68,68,0.35)", glowColor2: "rgba(249,115,22,0.2)",
    },
    light: {
      bg1: "#f8fafc", bg2: "#fff1f2", bg3: "#eff6ff",
      accent: "#dc2626", accent2: "#ea580c", gold: "#d97706",
      cardBg: "rgba(255,255,255,0.92)", cardBorder: "rgba(220,38,38,0.22)",
      textPrimary: "#0f172a", textSecondary: "#1e293b",
      textMuted: "#64748b",
      glowColor: "rgba(220,38,38,0.18)", glowColor2: "rgba(234,88,12,0.12)",
    },
    red: {
      bg1: "#3b0000", bg2: "#7f1d1d", bg3: "#1c0a00",
      accent: "#fbbf24", accent2: "#f97316", gold: "#fde68a",
      cardBg: "rgba(255,255,255,0.08)", cardBorder: "rgba(251,191,36,0.3)",
      textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.85)",
      textMuted: "rgba(255,255,255,0.55)",
      glowColor: "rgba(251,191,36,0.3)", glowColor2: "rgba(249,115,22,0.2)",
    },
  };

  const pal = themes[theme] || themes.dark;

  // 1. Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, pal.bg1);
  bg.addColorStop(0.45, pal.bg2);
  bg.addColorStop(1, pal.bg3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient glows
  const topGlow = ctx.createRadialGradient(W / 2, 0, 50, W / 2, 0, 600);
  topGlow.addColorStop(0, pal.glowColor);
  topGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 700);

  const botGlow = ctx.createRadialGradient(W / 2, H, 50, W / 2, H, 500);
  botGlow.addColorStop(0, pal.glowColor2);
  botGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = botGlow;
  ctx.fillRect(0, H - 600, W, 600);

  // 2. Grid lines (subtle)
  ctx.save();
  ctx.strokeStyle = theme === "light" ? "rgba(0,0,0,0.04)" : "rgba(255,255,255,0.03)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 90) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 90) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // 3. Outer border (double)
  ctx.save();
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, pal.accent);
  borderGrad.addColorStop(0.5, pal.gold);
  borderGrad.addColorStop(1, pal.accent2);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRect(ctx, 24, 24, W - 48, H - 48, 36); ctx.stroke();
  ctx.strokeStyle = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 34, 34, W - 68, H - 68, 28); ctx.stroke();
  ctx.restore();

  // 4. Corner ornaments
  [[48, 48], [W - 48, 48], [48, H - 48], [W - 48, H - 48]].forEach(([cx, cy]) => {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = pal.accent; ctx.shadowColor = pal.accent; ctx.shadowBlur = 18; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = pal.gold; ctx.shadowColor = pal.gold; ctx.shadowBlur = 10; ctx.fill();
    ctx.restore();
  });

  // 5. Header — Logo + System Name
  const headerY = 55;

  // Logo circle
  ctx.save();
  const logoGrad = ctx.createRadialGradient(W / 2, headerY + 50, 10, W / 2, headerY + 50, 50);
  logoGrad.addColorStop(0, pal.accent); logoGrad.addColorStop(1, pal.accent2);
  ctx.fillStyle = logoGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 26;
  ctx.beginPath(); ctx.arc(W / 2, headerY + 50, 50, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = pal.gold; ctx.lineWidth = 2.5; ctx.shadowColor = pal.gold; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(W / 2, headerY + 50, 57, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Logo emoji
  ctx.save();
  ctx.font = "46px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🥋", W / 2, headerY + 53);
  ctx.restore();

  // System name
  ctx.save();
  ctx.font = "900 64px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";
  const cmGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  cmGrad.addColorStop(0, pal.accent);
  cmGrad.addColorStop(0.5, pal.gold);
  cmGrad.addColorStop(1, pal.accent2);
  ctx.fillStyle = cmGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 18; ctx.shadowOffsetY = 2;
  ctx.fillText("CoachMaster", W / 2, headerY + 150);
  ctx.restore();

  // Header Subtitle / Tagline
  ctx.save();
  ctx.font = "700 24px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
  if (isMultiCaptains) {
    ctx.fillText("نخبة الأكاديميات والمدربين المشتركين بالمنصة ⭐", W / 2, headerY + 190);
  } else {
    ctx.fillText("منصة إدارة الأكاديميات الرياضية الذكية", W / 2, headerY + 190);
  }
  ctx.restore();

  // Top glowing divider
  ctx.save();
  const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  divGrad.addColorStop(0, "rgba(0,0,0,0)");
  divGrad.addColorStop(0.3, pal.accent);
  divGrad.addColorStop(0.7, pal.gold);
  divGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = divGrad; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(100, headerY + 215); ctx.lineTo(W - 100, headerY + 215); ctx.stroke();
  ctx.restore();

  if (isMultiCaptains && captainsList.length > 0) {
    // ══════════════════════════════════════════════════════════════════════════
    // 🌟 ALL SUBSCRIBERS IN ONE CARD LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    const count = captainsList.length;
    // Adapt columns & font sizes based on count
    const numCols = count <= 4 ? 1 : count <= 14 ? 2 : 3;
    const numRows = Math.ceil(count / numCols);

    const startY = headerY + 235;
    const maxAvailableH = 700; // available height for grid
    const gapX = 14;
    const gapY = count > 12 ? 8 : 10;
    const itemH = Math.max(46, Math.min(count <= 3 ? 110 : count <= 6 ? 90 : count <= 10 ? 76 : count <= 16 ? 62 : 50, Math.floor((maxAvailableH - (numRows - 1) * gapY) / numRows)));
    const gridW = W - 120;
    const itemW = (gridW - (numCols - 1) * gapX) / numCols;

    // Badges / Stats header for subscribers
    ctx.save();
    ctx.font = "800 20px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
    ctx.fillText(`🏆 الأكاديميات والمدربين المعتمدين (${count} مشترك)`, W / 2, startY + 12);
    ctx.restore();

    const actualGridY = startY + 30;

    captainsList.forEach((c, i) => {
      const colIndex = i % numCols;
      const rowIndex = Math.floor(i / numCols);

      // RTL layout: col 0 is rightmost
      const itemX = (W - 60) - (colIndex + 1) * itemW - colIndex * gapX;
      const itemY = actualGridY + rowIndex * (itemH + gapY);

      const acad = (c.academyName || c.name || "أكاديمية الفنون القتالية").trim();
      const capt = (c.name || "كابتن الأكاديمية").trim();

      // Card box
      ctx.save();
      roundRect(ctx, itemX, itemY, itemW, itemH, 16);
      ctx.fillStyle = pal.cardBg; ctx.fill();
      ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();

      // Right accent micro-bar
      ctx.save();
      const accentGrad = ctx.createLinearGradient(0, itemY, 0, itemY + itemH);
      accentGrad.addColorStop(0, i % 3 === 0 ? pal.accent : i % 3 === 1 ? pal.gold : pal.accent2);
      accentGrad.addColorStop(1, i % 3 === 0 ? pal.accent2 : i % 3 === 1 ? pal.accent : pal.gold);
      roundRect(ctx, itemX + itemW - 6, itemY, 6, itemH, 16);
      ctx.fillStyle = accentGrad; ctx.fill();
      ctx.restore();

      // Emoji icon
      const icon = c.icon || "🥋";
      ctx.save();
      ctx.font = itemH >= 70 ? "24px serif" : "18px serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(icon, itemX + itemW - 24, itemY + itemH / 2);
      ctx.restore();

      // Font sizing logic (adapted smoothly to count)
      const textRightX = itemX + itemW - 48;
      const maxTextW = itemW - 60;

      if (itemH >= 75) {
        // Large layout
        ctx.save();
        ctx.font = "900 24px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + 32, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 17px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + 60, maxTextW);
        ctx.restore();
      } else if (itemH >= 58) {
        // Medium layout
        ctx.save();
        ctx.font = "900 20px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + 26, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 14px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + 47, maxTextW);
        ctx.restore();
      } else {
        // Compact layout for large number of subscribers
        ctx.save();
        ctx.font = "900 16px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + 21, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 12px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + 39, maxTextW);
        ctx.restore();
      }
    });

    // Features Strip (Summary pills)
    const pillsY = actualGridY + numRows * (itemH + gapY) + 18;
    const highlightPills = [
      "👥 إدارة اللاعبين",
      "🏟️ الفروع والحصص",
      "💳 الاشتراكات",
      "🏆 البطولات",
      "📊 التقارير الذكية",
      "📱 موبايل وكمبيوتر",
    ];

    const pillGap = 10;
    const pillCols = 3;
    const pillW = (gridW - (pillCols - 1) * pillGap) / pillCols;
    const pillH = 36;

    highlightPills.forEach((pText, pi) => {
      const pCol = pi % pillCols;
      const pRow = Math.floor(pi / pillCols);
      const px = (W - 60) - (pCol + 1) * pillW - pCol * pillGap;
      const py = pillsY + pRow * (pillH + 8);

      ctx.save();
      roundRect(ctx, px, py, pillW, pillH, 10);
      ctx.fillStyle = pal.cardBg; ctx.fill();
      ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();

      ctx.save();
      ctx.font = "700 14px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
      ctx.fillStyle = pal.textSecondary;
      ctx.fillText(pText, px + pillW / 2, py + pillH / 2);
      ctx.restore();
    });

    // CTA Banner
    const ctaY = pillsY + 2 * (pillH + 8) + 16;
    ctx.save();
    const ctaGrad = ctx.createLinearGradient(60, ctaY, W - 60, ctaY + 95);
    ctaGrad.addColorStop(0, pal.accent); ctaGrad.addColorStop(1, pal.accent2);
    roundRect(ctx, 60, ctaY, W - 120, 95, 22);
    ctx.fillStyle = ctaGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 24; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "900 28px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
    ctx.fillText("انضم لنخبة الأكاديميات وسجل أكاديميتك الآن! 🚀", W / 2, ctaY + 38);
    ctx.restore();

    ctx.save();
    ctx.font = "600 19px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("طور منظومة تدريبك للمستوى الاحترافي مع CoachMaster ⚡", W / 2, ctaY + 72);
    ctx.restore();

  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // 👤 SINGLE ACADEMY PROMO CARD LAYOUT
    // ══════════════════════════════════════════════════════════════════════════
    const acadSecY = headerY + 235;

    ctx.save();
    roundRect(ctx, 60, acadSecY, W - 120, 165, 24);
    ctx.fillStyle = pal.cardBg; ctx.fill();
    ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Right accent stripe
    ctx.save();
    const stripeGrad = ctx.createLinearGradient(0, acadSecY, 0, acadSecY + 165);
    stripeGrad.addColorStop(0, pal.accent); stripeGrad.addColorStop(1, pal.accent2);
    roundRect(ctx, W - 68, acadSecY, 8, 165, 24);
    ctx.fillStyle = stripeGrad; ctx.fill();
    ctx.restore();

    // Academy label
    ctx.save();
    ctx.font = "700 20px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
    ctx.fillText("🏫  الأكاديمية المعتمدة", W - 90, acadSecY + 36);
    ctx.restore();

    // Academy name
    ctx.save();
    ctx.font = "900 40px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
    ctx.shadowColor = pal.accent; ctx.shadowBlur = 12;
    const acWidth = ctx.measureText(academyName).width;
    if (acWidth > W - 200) ctx.font = "900 30px 'Cairo', 'Arial', sans-serif";
    ctx.fillText(academyName, W - 90, acadSecY + 84);
    ctx.restore();

    // Separator line
    ctx.save();
    ctx.fillStyle = pal.cardBorder;
    ctx.fillRect(90, acadSecY + 102, W - 180, 1);
    ctx.restore();

    // Captain label
    ctx.save();
    ctx.font = "700 18px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
    ctx.fillText("🥋  المدرب المسئول", W - 90, acadSecY + 124);
    ctx.restore();

    // Captain name
    ctx.save();
    ctx.font = "800 30px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
    ctx.shadowColor = pal.gold; ctx.shadowBlur = 10;
    ctx.fillText(captainName, W - 90, acadSecY + 155);
    ctx.restore();

    // Features Grid (2 col) with detailed descriptions
    const featSecY = acadSecY + 175;

    ctx.save();
    ctx.font = "900 28px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
    ctx.fillText("✨  أبرز إمكانيات ومميزات النظام", W / 2, featSecY + 28);
    ctx.restore();

    const gap = 12;
    const colW = (W - 120 - gap) / 2;
    const itemH = 92;
    const gridY = featSecY + 44;

    featureList.forEach((feat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const itemX = col === 0 ? 60 + colW + gap : 60;
      const itemY = gridY + row * (itemH + gap);
      const fw = colW;

      ctx.save();
      roundRect(ctx, itemX, itemY, fw, itemH, 18);
      ctx.fillStyle = pal.cardBg; ctx.fill();
      ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();

      // Micro bar
      ctx.save();
      roundRect(ctx, itemX + fw - 5, itemY, 5, itemH, 18);
      ctx.fillStyle = i % 3 === 0 ? pal.accent : i % 3 === 1 ? pal.gold : pal.accent2;
      ctx.fill();
      ctx.restore();

      const icon = typeof feat === "object" ? feat.icon : feat.split(" ")[0];
      const title = typeof feat === "object" ? (feat.title || feat.text) : feat.split(" ").slice(1).join(" ");
      const desc = typeof feat === "object" && feat.desc ? feat.desc : "";

      // Icon
      ctx.save();
      ctx.font = "26px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(icon, itemX + fw - 24, itemY + 34);
      ctx.restore();

      const textRightX = itemX + fw - 52;
      const maxTextW = fw - 62;

      if (desc) {
        // Title
        ctx.save();
        ctx.font = "900 18px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl";
        ctx.fillStyle = pal.textPrimary;
        ctx.fillText(title, textRightX, itemY + 32, maxTextW);
        ctx.restore();

        // Subline description
        ctx.save();
        ctx.font = "600 13px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl";
        ctx.fillStyle = pal.textSecondary;
        ctx.fillText(desc, textRightX, itemY + 62, maxTextW);
        ctx.restore();
      } else {
        ctx.save();
        ctx.font = "900 20px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl";
        ctx.fillStyle = pal.textPrimary;
        ctx.fillText(title, textRightX, itemY + itemH / 2 + 7, maxTextW);
        ctx.restore();
      }
    });

    // CTA Banner
    const rows = Math.ceil(featureList.length / 2);
    const ctaY = gridY + rows * (itemH + gap) + 14;

    ctx.save();
    const ctaGrad = ctx.createLinearGradient(60, ctaY, W - 60, ctaY + 98);
    ctaGrad.addColorStop(0, pal.accent); ctaGrad.addColorStop(1, pal.accent2);
    roundRect(ctx, 60, ctaY, W - 120, 98, 22);
    ctx.fillStyle = ctaGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 24; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "900 28px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
    ctx.fillText("انضم لمنصة CoachMaster الآن! 🚀", W / 2, ctaY + 38);
    ctx.restore();

    ctx.save();
    ctx.font = "600 19px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText("وطور أكاديميتك للمستوى الاحترافي ⚡", W / 2, ctaY + 72);
    ctx.restore();
  }

  // 6. Footer (Shared)
  const footerY = H - 85;

  ctx.save();
  const footGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  footGrad.addColorStop(0, "rgba(0,0,0,0)");
  footGrad.addColorStop(0.5, pal.textMuted);
  footGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = footGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, footerY); ctx.lineTo(W - 100, footerY); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = "700 20px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
  ctx.fillText("تصميم وتطوير: Fox Developer  •  CoachMaster © 2025", W / 2, footerY + 38);
  ctx.restore();

  // Stars near footer
  [[160, footerY + 38], [W - 160, footerY + 38], [W / 2 - 250, footerY + 38], [W / 2 + 250, footerY + 38]]
    .forEach(([sx, sy]) => {
      ctx.save(); ctx.font = "16px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⭐", sx, sy); ctx.restore();
    });

  // 7. Subtle background watermark
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.font = "bold 90px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.direction = "ltr";
  ctx.fillStyle = theme === "light" ? "#000" : "#fff";
  ctx.translate(W / 2, H / 2); ctx.rotate(-Math.PI / 6);
  ctx.fillText("CoachMaster", 0, 0);
  ctx.restore();

  return canvas;
}

export function downloadPromoCard(canvas, fileName = "CoachMaster-PromoCard.png") {
  if (!canvas) return;
  const link = document.createElement("a");
  link.download = fileName;
  link.href = canvas.toDataURL("image/png", 1.0);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => { if (link.parentNode) document.body.removeChild(link); }, 300);
}

export function canvasToBlob(canvas) {
  return new Promise((resolve) => {
    if (!canvas) return resolve(null);
    canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
  });
}
