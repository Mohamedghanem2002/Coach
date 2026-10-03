/**
 * CoachMaster Promotional Card Generator
 * Generates a stunning 1080x1350 promotional card (4:5 portrait) for marketing.
 * Supports both:
 * 1. Unified Card for ALL Subscribers/Academies on ONE Card with adaptive font sizing + full features guide.
 * 2. Dedicated Single Academy Card with full features guide.
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
    } catch (_) {}
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
      bg1: "#0c0d16", bg2: "#190b14", bg3: "#0a0f1c",
      accent: "#ef4444", accent2: "#f97316", gold: "#f59e0b",
      cardBg: "rgba(255,255,255,0.055)", cardBorder: "rgba(255,255,255,0.13)",
      textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.88)",
      textMuted: "rgba(255,255,255,0.60)",
      glowColor: "rgba(239,68,68,0.38)", glowColor2: "rgba(249,115,22,0.24)",
    },
    light: {
      bg1: "#f8fafc", bg2: "#fff1f2", bg3: "#eff6ff",
      accent: "#dc2626", accent2: "#ea580c", gold: "#d97706",
      cardBg: "rgba(255,255,255,0.94)", cardBorder: "rgba(220,38,38,0.24)",
      textPrimary: "#0f172a", textSecondary: "#1e293b",
      textMuted: "#64748b",
      glowColor: "rgba(220,38,38,0.20)", glowColor2: "rgba(234,88,12,0.14)",
    },
    red: {
      bg1: "#340000", bg2: "#771111", bg3: "#1a0800",
      accent: "#fbbf24", accent2: "#f97316", gold: "#fde68a",
      cardBg: "rgba(255,255,255,0.09)", cardBorder: "rgba(251,191,36,0.32)",
      textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.88)",
      textMuted: "rgba(255,255,255,0.62)",
      glowColor: "rgba(251,191,36,0.32)", glowColor2: "rgba(249,115,22,0.22)",
    },
  };

  const pal = themes[theme] || themes.dark;

  // 1. Background Gradient
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, pal.bg1);
  bg.addColorStop(0.48, pal.bg2);
  bg.addColorStop(1, pal.bg3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Ambient Glows
  const topGlow = ctx.createRadialGradient(W / 2, 0, 40, W / 2, 0, 650);
  topGlow.addColorStop(0, pal.glowColor);
  topGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 700);

  const botGlow = ctx.createRadialGradient(W / 2, H, 40, W / 2, H, 550);
  botGlow.addColorStop(0, pal.glowColor2);
  botGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = botGlow;
  ctx.fillRect(0, H - 600, W, 600);

  // 2. Decorative Matrix Grid Lines (Subtle)
  ctx.save();
  ctx.strokeStyle = theme === "light" ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.025)";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  ctx.restore();

  // 3. Double Outer Border with Gradient
  ctx.save();
  const borderGrad = ctx.createLinearGradient(0, 0, W, H);
  borderGrad.addColorStop(0, pal.accent);
  borderGrad.addColorStop(0.5, pal.gold);
  borderGrad.addColorStop(1, pal.accent2);
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 4;
  roundRect(ctx, 22, 22, W - 44, H - 44, 34);
  ctx.stroke();

  ctx.strokeStyle = theme === "light" ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, 32, 32, W - 64, H - 64, 26);
  ctx.stroke();
  ctx.restore();

  // 4. Corner Ornaments
  [[46, 46], [W - 46, 46], [46, H - 46], [W - 46, H - 46]].forEach(([cx, cy]) => {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fillStyle = pal.accent; ctx.shadowColor = pal.accent; ctx.shadowBlur = 18; ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = pal.gold; ctx.shadowColor = pal.gold; ctx.shadowBlur = 10; ctx.fill();
    ctx.restore();
  });

  // 5. Header — Logo + System Name + Tagline
  const headerY = 36;

  // Logo circle
  ctx.save();
  const logoGrad = ctx.createRadialGradient(W / 2, headerY + 44, 10, W / 2, headerY + 44, 44);
  logoGrad.addColorStop(0, pal.accent);
  logoGrad.addColorStop(1, pal.accent2);
  ctx.fillStyle = logoGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(W / 2, headerY + 44, 44, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = pal.gold; ctx.lineWidth = 2.2; ctx.shadowColor = pal.gold; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(W / 2, headerY + 44, 50, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Logo emoji
  ctx.save();
  ctx.font = "40px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🥋", W / 2, headerY + 46);
  ctx.restore();

  // System name
  ctx.save();
  ctx.font = "900 58px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";
  const cmGrad = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
  cmGrad.addColorStop(0, pal.accent);
  cmGrad.addColorStop(0.5, pal.gold);
  cmGrad.addColorStop(1, pal.accent2);
  ctx.fillStyle = cmGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 18; ctx.shadowOffsetY = 2;
  ctx.fillText("CoachMaster", W / 2, headerY + 132);
  ctx.restore();

  // Header Tagline Subtitle
  ctx.save();
  ctx.font = "700 21px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
  if (isMultiCaptains) {
    ctx.fillText("نخبة الأكاديميات والمدربين المعتمدين بالمنصة ⭐", W / 2, headerY + 165);
  } else {
    ctx.fillText("المنصة المتكاملة لإدارة الأكاديميات والرياضات القتالية الذكية", W / 2, headerY + 165);
  }
  ctx.restore();

  // Glowing header divider line
  const dividerY = headerY + 188;
  ctx.save();
  const divGrad = ctx.createLinearGradient(90, 0, W - 90, 0);
  divGrad.addColorStop(0, "rgba(0,0,0,0)");
  divGrad.addColorStop(0.25, pal.accent);
  divGrad.addColorStop(0.75, pal.gold);
  divGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = divGrad; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(90, dividerY); ctx.lineTo(W - 90, dividerY); ctx.stroke();
  ctx.restore();

  // ════════════════════════════════════════════════════════════════════════════
  // 📐 ADAPTIVE VERTICAL LAYOUT ENGINE
  // Budget available from startY to footerTopY (~1040px)
  // ════════════════════════════════════════════════════════════════════════════
  const footerTopY = H - 85;
  const startContentY = dividerY + 16;
  const totalContentBudget = footerTopY - startContentY; // ~1025px

  if (isMultiCaptains && captainsList.length > 0) {
    // ══════════════════════════════════════════════════════════════════════════
    // 🌟 UNIFIED ALL SUBSCRIBERS CARD (DYNAMIC HEIGHT & FONT SCALING)
    // ══════════════════════════════════════════════════════════════════════════
    const count = captainsList.length;

    // Determine optimal column count based on number of captains
    const numCols = count === 1 ? 1 : count <= 4 ? 2 : count <= 18 ? 3 : 4;
    const numRows = Math.ceil(count / numCols);

    // Dynamic vertical budget distribution
    // Target heights adapt smoothly based on row count
    let ctaTargetH;
    let subTitleHeight;
    let featTitleHeight;
    let sectionGap1;
    let sectionGap2;
    let subRowTargetH;
    let subGapY;

    if (numRows === 1) {
      // 1 to 3 captains: massive space available! Expand everything generously!
      ctaTargetH = 120;
      subTitleHeight = 36;
      featTitleHeight = 40;
      sectionGap1 = 20;
      sectionGap2 = 20;
      subRowTargetH = count === 1 ? 115 : 100;
      subGapY = 12;
    } else if (numRows === 2) {
      // 4 to 6 captains: generous space!
      ctaTargetH = 114;
      subTitleHeight = 34;
      featTitleHeight = 36;
      sectionGap1 = 18;
      sectionGap2 = 18;
      subRowTargetH = 82;
      subGapY = 10;
    } else if (numRows === 3) {
      // 7 to 9 captains: well balanced
      ctaTargetH = 106;
      subTitleHeight = 30;
      featTitleHeight = 32;
      sectionGap1 = 16;
      sectionGap2 = 16;
      subRowTargetH = 70;
      subGapY = 9;
    } else if (numRows === 4) {
      // 10 to 12 captains
      ctaTargetH = 98;
      subTitleHeight = 28;
      featTitleHeight = 30;
      sectionGap1 = 14;
      sectionGap2 = 14;
      subRowTargetH = 62;
      subGapY = 8;
    } else if (numRows === 5) {
      // 13 to 15 captains
      ctaTargetH = 92;
      subTitleHeight = 26;
      featTitleHeight = 28;
      sectionGap1 = 12;
      sectionGap2 = 12;
      subRowTargetH = 55;
      subGapY = 7;
    } else if (numRows === 6) {
      // 16 to 18 captains
      ctaTargetH = 86;
      subTitleHeight = 25;
      featTitleHeight = 26;
      sectionGap1 = 10;
      sectionGap2 = 10;
      subRowTargetH = 49;
      subGapY = 6;
    } else {
      // 19+ captains
      ctaTargetH = 80;
      subTitleHeight = 24;
      featTitleHeight = 25;
      sectionGap1 = 9;
      sectionGap2 = 9;
      subRowTargetH = Math.max(38, Math.floor(320 / numRows));
      subGapY = 5;
    }

    const subGridH = numRows * subRowTargetH + (numRows - 1) * subGapY;
    const fixedElementsH = subTitleHeight + subGridH + sectionGap1 + featTitleHeight + sectionGap2 + ctaTargetH;

    // Calculate features grid height to absorb the exact remaining budget to 100% fill the card!
    const remainingForFeatGrid = totalContentBudget - fixedElementsH;
    const featGridH = Math.max(260, remainingForFeatGrid);
    const featGapY = numRows <= 2 ? 12 : numRows <= 4 ? 9 : 7;
    const featItemH = (featGridH - 3 * featGapY) / 4;

    // ── SECTION 1: SUBSCRIBERS HEADER & GRID ──────────────────────────────
    const subHeaderY = startContentY;
    ctx.save();
    ctx.font = numRows <= 2 ? "900 22px 'Cairo', sans-serif" : "900 19px 'Cairo', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
    ctx.shadowColor = pal.gold; ctx.shadowBlur = 8;
    ctx.fillText(`🏆 الأكاديميات والمدربين المعتمدين بالمنصة (${count} مشترك)`, W / 2, subHeaderY + subTitleHeight - 10);
    ctx.restore();

    const actualSubGridY = subHeaderY + subTitleHeight;
    const gridW = W - 100;
    const gapX = numCols === 1 ? 0 : numCols === 2 ? 16 : numCols === 3 ? 12 : 8;
    const itemW = (gridW - (numCols - 1) * gapX) / numCols;
    const subItemH = subRowTargetH;

    captainsList.forEach((c, i) => {
      const colIndex = i % numCols;
      const rowIndex = Math.floor(i / numCols);

      // RTL layout: colIndex 0 is rightmost
      const itemX = (W - 50) - (colIndex + 1) * itemW - colIndex * gapX;
      const itemY = actualSubGridY + rowIndex * (subItemH + subGapY);

      const acad = (c.academyName || c.name || "أكاديمية الفنون القتالية").trim();
      const capt = (c.name || "كابتن الأكاديمية").trim();
      const icon = c.icon || "🥋";

      // Card Container Box
      const cornerR = subItemH >= 80 ? 16 : subItemH >= 60 ? 13 : subItemH >= 48 ? 10 : 8;
      ctx.save();
      roundRect(ctx, itemX, itemY, itemW, subItemH, cornerR);
      ctx.fillStyle = pal.cardBg; ctx.fill();
      ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();

      // Right Accent Micro-Bar
      const barW = subItemH >= 80 ? 5.5 : 4;
      ctx.save();
      const accentGrad = ctx.createLinearGradient(0, itemY, 0, itemY + subItemH);
      accentGrad.addColorStop(0, i % 3 === 0 ? pal.accent : i % 3 === 1 ? pal.gold : pal.accent2);
      accentGrad.addColorStop(1, i % 3 === 0 ? pal.accent2 : i % 3 === 1 ? pal.accent : pal.gold);
      roundRect(ctx, itemX + itemW - barW, itemY, barW, subItemH, cornerR);
      ctx.fillStyle = accentGrad; ctx.fill();
      ctx.restore();

      // Adaptive text & icon scaling for subscriber cards
      if (subItemH >= 95) {
        // High luxury single/few captains layout
        ctx.save();
        ctx.font = "32px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, itemX + itemW - 32, itemY + subItemH / 2);
        ctx.restore();

        const textRightX = itemX + itemW - 64;
        const maxTextW = itemW - 76;

        ctx.save();
        ctx.font = "900 22px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + subItemH * 0.40, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 16px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + subItemH * 0.76, maxTextW);
        ctx.restore();
      } else if (subItemH >= 75) {
        // Medium-large cards
        ctx.save();
        ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, itemX + itemW - 24, itemY + subItemH / 2);
        ctx.restore();

        const textRightX = itemX + itemW - 48;
        const maxTextW = itemW - 58;

        ctx.save();
        ctx.font = "900 18.5px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + subItemH * 0.42, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 14px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + subItemH * 0.78, maxTextW);
        ctx.restore();
      } else if (subItemH >= 58) {
        // Standard multi-cards
        ctx.save();
        ctx.font = "19px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, itemX + itemW - 20, itemY + subItemH / 2);
        ctx.restore();

        const textRightX = itemX + itemW - 38;
        const maxTextW = itemW - 46;

        ctx.save();
        ctx.font = "900 15.5px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + subItemH * 0.43, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 12px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + subItemH * 0.80, maxTextW);
        ctx.restore();
      } else if (subItemH >= 46) {
        // Compact multi-cards
        ctx.save();
        ctx.font = "16px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, itemX + itemW - 16, itemY + subItemH / 2);
        ctx.restore();

        const textRightX = itemX + itemW - 32;
        const maxTextW = itemW - 38;

        ctx.save();
        ctx.font = "900 13.5px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + subItemH * 0.43, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 11px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + subItemH * 0.81, maxTextW);
        ctx.restore();
      } else {
        // Ultra-compact cards (20+ captains)
        ctx.save();
        ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, itemX + itemW - 13, itemY + subItemH / 2);
        ctx.restore();

        const textRightX = itemX + itemW - 26;
        const maxTextW = itemW - 30;

        ctx.save();
        ctx.font = "900 11.5px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(acad, textRightX, itemY + subItemH * 0.44, maxTextW);
        ctx.restore();

        ctx.save();
        ctx.font = "700 9.5px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
        ctx.fillText(`كابتن: ${capt}`, textRightX, itemY + subItemH * 0.83, maxTextW);
        ctx.restore();
      }
    });

    // ── SECTION 2: FULL DETAILED SYSTEM FEATURES GUIDE ─────────────────────
    const featHeaderY = actualSubGridY + subGridH + sectionGap1;

    ctx.save();
    ctx.font = numRows <= 2 ? "900 25px 'Cairo', sans-serif" : "900 21px 'Cairo', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
    ctx.fillText("✨  أبرز إمكانيات ومميزات منصة CoachMaster للمدربين", W / 2, featHeaderY + featTitleHeight - 8);
    ctx.restore();

    const featGridY = featHeaderY + featTitleHeight;
    const featGapX = 14;
    const featColW = (gridW - featGapX) / 2;

    featureList.forEach((feat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      // RTL: col 0 on right, col 1 on left
      const fx = col === 0 ? 50 + featColW + featGapX : 50;
      const fy = featGridY + row * (featItemH + featGapY);

      const fCornerR = featItemH >= 110 ? 18 : featItemH >= 80 ? 14 : 11;
      ctx.save();
      roundRect(ctx, fx, fy, featColW, featItemH, fCornerR);
      ctx.fillStyle = pal.cardBg; ctx.fill();
      ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.2; ctx.stroke();
      ctx.restore();

      // Micro accent bar on right
      const fBarW = featItemH >= 90 ? 5 : 4;
      ctx.save();
      roundRect(ctx, fx + featColW - fBarW, fy, fBarW, featItemH, fCornerR);
      ctx.fillStyle = i % 3 === 0 ? pal.accent : i % 3 === 1 ? pal.gold : pal.accent2;
      ctx.fill();
      ctx.restore();

      const icon = typeof feat === "object" ? feat.icon : feat.split(" ")[0];
      const title = typeof feat === "object" ? (feat.title || feat.text) : feat.split(" ").slice(1).join(" ");
      const desc = typeof feat === "object" && feat.desc ? feat.desc : "";

      // Adaptive text & icon rendering for features
      if (featItemH >= 115) {
        // High luxury layout (1-3 captains)
        ctx.save();
        ctx.font = "34px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, fx + featColW - 32, fy + featItemH * 0.38);
        ctx.restore();

        const textRightX = fx + featColW - 68;
        const maxTextW = featColW - 80;

        ctx.save();
        ctx.font = "900 22px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(title, textRightX, fy + featItemH * 0.36, maxTextW);
        ctx.restore();

        if (desc) {
          ctx.save();
          ctx.font = "700 15.5px 'Cairo', 'Arial', sans-serif";
          ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
          ctx.fillText(`↳ ${desc}`, textRightX, fy + featItemH * 0.74, maxTextW);
          ctx.restore();
        }
      } else if (featItemH >= 90) {
        // Generous layout (4-6 captains)
        ctx.save();
        ctx.font = "28px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, fx + featColW - 26, fy + featItemH * 0.40);
        ctx.restore();

        const textRightX = fx + featColW - 56;
        const maxTextW = featColW - 68;

        ctx.save();
        ctx.font = "900 19px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(title, textRightX, fy + featItemH * 0.37, maxTextW);
        ctx.restore();

        if (desc) {
          ctx.save();
          ctx.font = "700 13.5px 'Cairo', 'Arial', sans-serif";
          ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
          ctx.fillText(`↳ ${desc}`, textRightX, fy + featItemH * 0.75, maxTextW);
          ctx.restore();
        }
      } else if (featItemH >= 72) {
        // Standard layout (7-12 captains)
        ctx.save();
        ctx.font = "23px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, fx + featColW - 22, fy + featItemH * 0.42);
        ctx.restore();

        const textRightX = fx + featColW - 48;
        const maxTextW = featColW - 58;

        ctx.save();
        ctx.font = "900 16.5px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(title, textRightX, fy + featItemH * 0.38, maxTextW);
        ctx.restore();

        if (desc) {
          ctx.save();
          ctx.font = "600 12px 'Cairo', 'Arial', sans-serif";
          ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
          ctx.fillText(`↳ ${desc}`, textRightX, fy + featItemH * 0.77, maxTextW);
          ctx.restore();
        }
      } else {
        // Compact layout (13+ captains)
        ctx.save();
        ctx.font = "19px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(icon, fx + featColW - 18, fy + featItemH * 0.44);
        ctx.restore();

        const textRightX = fx + featColW - 38;
        const maxTextW = featColW - 46;

        ctx.save();
        ctx.font = "900 14px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
        ctx.fillText(title, textRightX, fy + featItemH * 0.39, maxTextW);
        ctx.restore();

        if (desc) {
          ctx.save();
          ctx.font = "600 10.5px 'Cairo', 'Arial', sans-serif";
          ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
          ctx.fillText(`↳ ${desc}`, textRightX, fy + featItemH * 0.78, maxTextW);
          ctx.restore();
        }
      }
    });

    // ── SECTION 3: PROMINENT CTA BANNER ─────────────────────────────────────
    const ctaY = featGridY + 4 * (featItemH + featGapY) + sectionGap2;
    const ctaH = ctaTargetH;

    ctx.save();
    const ctaGrad = ctx.createLinearGradient(50, ctaY, W - 50, ctaY + ctaH);
    ctaGrad.addColorStop(0, pal.accent);
    ctaGrad.addColorStop(1, pal.accent2);
    const ctaCornerR = ctaH >= 100 ? 22 : 16;
    roundRect(ctx, 50, ctaY, W - 100, ctaH, ctaCornerR);
    ctx.fillStyle = ctaGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 24; ctx.fill();
    ctx.restore();

    if (ctaH >= 105) {
      ctx.save();
      ctx.font = "900 27px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
      ctx.fillText("انضم لنخبة الأكاديميات وسجل أكاديميتك الآن! 🚀", W / 2, ctaY + ctaH * 0.40);
      ctx.restore();

      ctx.save();
      ctx.font = "700 18px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText("طور منظومة تدريبك للمستوى الاحترافي مع CoachMaster ⚡", W / 2, ctaY + ctaH * 0.78);
      ctx.restore();
    } else if (ctaH >= 90) {
      ctx.save();
      ctx.font = "900 23px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
      ctx.fillText("انضم لنخبة الأكاديميات وسجل أكاديميتك الآن! 🚀", W / 2, ctaY + ctaH * 0.40);
      ctx.restore();

      ctx.save();
      ctx.font = "700 15px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText("طور منظومة تدريبك للمستوى الاحترافي مع CoachMaster ⚡", W / 2, ctaY + ctaH * 0.78);
      ctx.restore();
    } else {
      ctx.save();
      ctx.font = "900 20px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
      ctx.fillText("انضم لنخبة الأكاديميات وسجل أكاديميتك الآن! 🚀", W / 2, ctaY + ctaH * 0.40);
      ctx.restore();

      ctx.save();
      ctx.font = "700 13px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillText("طور منظومة تدريبك للمستوى الاحترافي مع CoachMaster ⚡", W / 2, ctaY + ctaH * 0.78);
      ctx.restore();
    }

  } else {
    // ══════════════════════════════════════════════════════════════════════════
    // 👤 SINGLE ACADEMY PROMO CARD (PERFECTLY PROPORTIONED TO FILL CANVAS)
    // ══════════════════════════════════════════════════════════════════════════
    const acadSecY = startContentY + 6;
    const acadH = 205; // Generous hero card for single academy

    ctx.save();
    roundRect(ctx, 50, acadSecY, W - 100, acadH, 26);
    ctx.fillStyle = pal.cardBg; ctx.fill();
    ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();

    // Right Accent Stripe
    ctx.save();
    const stripeGrad = ctx.createLinearGradient(0, acadSecY, 0, acadSecY + acadH);
    stripeGrad.addColorStop(0, pal.accent);
    stripeGrad.addColorStop(0.5, pal.gold);
    stripeGrad.addColorStop(1, pal.accent2);
    roundRect(ctx, W - 58, acadSecY, 8, acadH, 26);
    ctx.fillStyle = stripeGrad; ctx.fill();
    ctx.restore();

    // Academy Label
    ctx.save();
    ctx.font = "700 20px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
    ctx.fillText("🏫  الأكاديمية المعتمدة", W - 85, acadSecY + 42);
    ctx.restore();

    // Academy Name
    ctx.save();
    ctx.font = "900 42px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
    ctx.shadowColor = pal.accent; ctx.shadowBlur = 14;
    const acWidth = ctx.measureText(academyName).width;
    if (acWidth > W - 180) ctx.font = "900 32px 'Cairo', 'Arial', sans-serif";
    ctx.fillText(academyName, W - 85, acadSecY + 95);
    ctx.restore();

    // Glowing Separator Line
    ctx.save();
    const acSepGrad = ctx.createLinearGradient(85, 0, W - 85, 0);
    acSepGrad.addColorStop(0, "rgba(255,255,255,0)");
    acSepGrad.addColorStop(0.5, pal.cardBorder);
    acSepGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = acSepGrad;
    ctx.fillRect(85, acadSecY + 118, W - 170, 1.5);
    ctx.restore();

    // Captain Label
    ctx.save();
    ctx.font = "700 18px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
    ctx.fillText("🥋  المدرب المسئول", W - 85, acadSecY + 148);
    ctx.restore();

    // Captain Name
    ctx.save();
    ctx.font = "900 32px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
    ctx.shadowColor = pal.gold; ctx.shadowBlur = 12;
    ctx.fillText(captainName, W - 85, acadSecY + 184);
    ctx.restore();

    // ── SECTION 2: SINGLE ACADEMY FEATURES SECTION ──────────────────────────
    const featSecY = acadSecY + acadH + 20;
    const featTitleH = 38;

    ctx.save();
    ctx.font = "900 28px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
    ctx.fillText("✨  أبرز إمكانيات ومميزات منصة CoachMaster للمدربين", W / 2, featSecY + 28);
    ctx.restore();

    const gapX = 16;
    const gapY = 12;
    const colW = (W - 100 - gapX) / 2;
    const ctaH = 120;
    const sectionGap2 = 20;

    // Remaining height exactly calculated for features grid
    const featGridY = featSecY + featTitleH + 8;
    const featGridH = (footerTopY - sectionGap2 - ctaH) - featGridY;
    const itemH = (featGridH - 3 * gapY) / 4; // ~130px per feature card!

    featureList.forEach((feat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const itemX = col === 0 ? 50 + colW + gapX : 50;
      const itemY = featGridY + row * (itemH + gapY);

      ctx.save();
      roundRect(ctx, itemX, itemY, colW, itemH, 20);
      ctx.fillStyle = pal.cardBg; ctx.fill();
      ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.restore();

      // Micro accent bar
      ctx.save();
      roundRect(ctx, itemX + colW - 5.5, itemY, 5.5, itemH, 20);
      ctx.fillStyle = i % 3 === 0 ? pal.accent : i % 3 === 1 ? pal.gold : pal.accent2;
      ctx.fill();
      ctx.restore();

      const icon = typeof feat === "object" ? feat.icon : feat.split(" ")[0];
      const title = typeof feat === "object" ? (feat.title || feat.text) : feat.split(" ").slice(1).join(" ");
      const desc = typeof feat === "object" && feat.desc ? feat.desc : "";

      // Large Icon
      ctx.save();
      ctx.font = "34px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(icon, itemX + colW - 32, itemY + itemH * 0.38);
      ctx.restore();

      const textRightX = itemX + colW - 68;
      const maxTextW = colW - 80;

      // Title
      ctx.save();
      ctx.font = "900 22px 'Cairo', 'Arial', sans-serif";
      ctx.textAlign = "right"; ctx.direction = "rtl";
      ctx.fillStyle = pal.textPrimary;
      ctx.fillText(title, textRightX, itemY + itemH * 0.36, maxTextW);
      ctx.restore();

      // Description subline
      if (desc) {
        ctx.save();
        ctx.font = "700 15px 'Cairo', 'Arial', sans-serif";
        ctx.textAlign = "right"; ctx.direction = "rtl";
        ctx.fillStyle = pal.textSecondary;
        ctx.fillText(`↳ ${desc}`, textRightX, itemY + itemH * 0.74, maxTextW);
        ctx.restore();
      }
    });

    // ── SECTION 3: CTA BANNER ───────────────────────────────────────────────
    const ctaY = featGridY + 4 * (itemH + gapY) + sectionGap2;

    ctx.save();
    const ctaGrad = ctx.createLinearGradient(50, ctaY, W - 50, ctaY + ctaH);
    ctaGrad.addColorStop(0, pal.accent);
    ctaGrad.addColorStop(1, pal.accent2);
    roundRect(ctx, 50, ctaY, W - 100, ctaH, 24);
    ctx.fillStyle = ctaGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 26; ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "900 29px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
    ctx.fillText("انضم لمنصة CoachMaster الآن! 🚀", W / 2, ctaY + ctaH * 0.40);
    ctx.restore();

    ctx.save();
    ctx.font = "700 19px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.fillText("وطور أكاديميتك للمستوى الاحترافي ⚡", W / 2, ctaY + ctaH * 0.78);
    ctx.restore();
  }

  // 6. Footer (Shared across all modes)
  const footerY = H - 75;

  ctx.save();
  const footGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  footGrad.addColorStop(0, "rgba(0,0,0,0)");
  footGrad.addColorStop(0.5, pal.textMuted);
  footGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = footGrad; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(100, footerY); ctx.lineTo(W - 100, footerY); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = "700 20px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
  ctx.fillText("تصميم وتطوير: Mohamed Ghanem  •  CoachMaster © 2025", W / 2, footerY + 36);
  ctx.restore();

  // Stars near footer
  [[160, footerY + 36], [W - 160, footerY + 36], [W / 2 - 250, footerY + 36], [W / 2 + 250, footerY + 36]]
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
