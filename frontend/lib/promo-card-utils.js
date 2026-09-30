/**
 * CoachMaster Promotional Card Generator
 * Generates a stunning 1080x1350 promotional card (4:5 portrait) for marketing.
 * Showcases the academy name, captain name, and CoachMaster platform features.
 */

// Features list shown on the card
export const SYSTEM_FEATURES = [
  { icon: "👥", text: "إدارة اللاعبين والأبطال" },
  { icon: "🏟️", text: "إدارة الصالات والفروع" },
  { icon: "🏆", text: "الفعاليات والبطولات" },
  { icon: "💳", text: "متابعة الاشتراكات والمدفوعات" },
  { icon: "🎂", text: "كروت تهنئة أعياد الميلاد" },
  { icon: "📊", text: "تقارير ولوحة تحكم ذكية" },
  { icon: "📱", text: "يعمل على الجوال والكمبيوتر" },
  { icon: "🔒", text: "نظام آمن وموثوق" },
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

  const themes = {
    dark: {
      bg1: "#0f0f1a", bg2: "#1a0a0a", bg3: "#0a0f1a",
      accent: "#ef4444", accent2: "#f97316", gold: "#f59e0b",
      cardBg: "rgba(255,255,255,0.05)", cardBorder: "rgba(255,255,255,0.12)",
      textPrimary: "#ffffff", textSecondary: "rgba(255,255,255,0.80)",
      textMuted: "rgba(255,255,255,0.45)",
      glowColor: "rgba(239,68,68,0.35)", glowColor2: "rgba(249,115,22,0.2)",
    },
    light: {
      bg1: "#f8fafc", bg2: "#fff1f2", bg3: "#eff6ff",
      accent: "#dc2626", accent2: "#ea580c", gold: "#d97706",
      cardBg: "rgba(255,255,255,0.9)", cardBorder: "rgba(220,38,38,0.2)",
      textPrimary: "#0f172a", textSecondary: "#1e293b",
      textMuted: "#94a3b8",
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
  const headerY = 70;

  // Logo circle
  ctx.save();
  const logoGrad = ctx.createRadialGradient(W / 2, headerY + 58, 10, W / 2, headerY + 58, 58);
  logoGrad.addColorStop(0, pal.accent); logoGrad.addColorStop(1, pal.accent2);
  ctx.fillStyle = logoGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 30;
  ctx.beginPath(); ctx.arc(W / 2, headerY + 58, 58, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = pal.gold; ctx.lineWidth = 2.5; ctx.shadowColor = pal.gold; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(W / 2, headerY + 58, 66, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Logo emoji (karate)
  ctx.save();
  ctx.font = "54px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("🥋", W / 2, headerY + 61);
  ctx.restore();

  // System name
  ctx.save();
  ctx.font = "900 72px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.direction = "ltr";
  const cmGrad = ctx.createLinearGradient(W / 2 - 220, 0, W / 2 + 220, 0);
  cmGrad.addColorStop(0, pal.accent);
  cmGrad.addColorStop(0.5, pal.gold);
  cmGrad.addColorStop(1, pal.accent2);
  ctx.fillStyle = cmGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 20; ctx.shadowOffsetY = 3;
  ctx.fillText("CoachMaster", W / 2, headerY + 170);
  ctx.restore();

  // Tagline
  ctx.save();
  ctx.font = "600 30px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textSecondary;
  ctx.fillText("منصة إدارة الأكاديميات الرياضية", W / 2, headerY + 215);
  ctx.restore();

  // Divider
  ctx.save();
  const divGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  divGrad.addColorStop(0, "rgba(0,0,0,0)");
  divGrad.addColorStop(0.3, pal.accent);
  divGrad.addColorStop(0.7, pal.gold);
  divGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = divGrad; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(100, headerY + 240); ctx.lineTo(W - 100, headerY + 240); ctx.stroke();
  ctx.restore();

  // 6. Academy & Captain Section
  const acadSecY = headerY + 270;

  ctx.save();
  roundRect(ctx, 60, acadSecY, W - 120, 175, 24);
  ctx.fillStyle = pal.cardBg; ctx.fill();
  ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();

  // Left accent stripe
  ctx.save();
  const stripeGrad = ctx.createLinearGradient(0, acadSecY, 0, acadSecY + 175);
  stripeGrad.addColorStop(0, pal.accent); stripeGrad.addColorStop(1, pal.accent2);
  roundRect(ctx, 60, acadSecY, 8, 175, 24);
  ctx.fillStyle = stripeGrad; ctx.fill();
  ctx.restore();

  // Academy label
  ctx.save();
  ctx.font = "700 22px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
  ctx.fillText("🏫  الأكاديمية", W - 90, acadSecY + 40);
  ctx.restore();

  // Academy name
  ctx.save();
  ctx.font = "900 46px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
  ctx.shadowColor = pal.accent; ctx.shadowBlur = 12;
  const acWidth = ctx.measureText(academyName).width;
  if (acWidth > W - 200) ctx.font = "900 34px 'Cairo', 'Arial', sans-serif";
  ctx.fillText(academyName, W - 90, acadSecY + 92);
  ctx.restore();

  // Separator dot
  ctx.save();
  ctx.fillStyle = pal.cardBorder;
  ctx.fillRect(90, acadSecY + 108, W - 200, 1);
  ctx.restore();

  // Captain label
  ctx.save();
  ctx.font = "700 22px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
  ctx.fillText("🥋  المدرب", W - 90, acadSecY + 132);
  ctx.restore();

  // Captain name
  ctx.save();
  ctx.font = "800 36px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "right"; ctx.direction = "rtl"; ctx.fillStyle = pal.gold;
  ctx.shadowColor = pal.gold; ctx.shadowBlur = 10;
  ctx.fillText(captainName, W - 90, acadSecY + 172);
  ctx.restore();

  // 7. Features Grid (2 col)
  const featSecY = acadSecY + 198;

  ctx.save();
  ctx.font = "900 34px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textPrimary;
  ctx.fillText("✨  مميزات النظام", W / 2, featSecY + 36);
  ctx.restore();

  const gap = 14;
  const colW = (W - 120 - gap) / 2;
  const itemH = 84;
  const gridY = featSecY + 58;

  featureList.forEach((feat, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    // RTL: col 0 → right half, col 1 → left half
    const itemX = col === 0 ? 60 + colW + gap : 60;
    const itemY = gridY + row * (itemH + gap);
    const fw = colW;

    ctx.save();
    roundRect(ctx, itemX, itemY, fw, itemH, 18);
    ctx.fillStyle = pal.cardBg; ctx.fill();
    ctx.strokeStyle = pal.cardBorder; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();

    // micro bar
    ctx.save();
    roundRect(ctx, itemX, itemY, 5, itemH, 18);
    ctx.fillStyle = i % 3 === 0 ? pal.accent : i % 3 === 1 ? pal.gold : pal.accent2;
    ctx.fill();
    ctx.restore();

    const icon = typeof feat === "object" ? feat.icon : feat.split(" ")[0];
    const text = typeof feat === "object" ? feat.text : feat.split(" ").slice(1).join(" ");

    ctx.save();
    ctx.font = "28px serif"; ctx.textAlign = "right"; ctx.textBaseline = "middle";
    ctx.fillText(icon, itemX + fw - 20, itemY + itemH / 2);
    ctx.restore();

    ctx.save();
    ctx.font = "700 20px 'Cairo', 'Arial', sans-serif";
    ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.direction = "rtl";
    ctx.fillStyle = pal.textSecondary;
    ctx.fillText(text, itemX + fw - 56, itemY + itemH / 2);
    ctx.restore();
  });

  // 8. CTA Banner
  const rows = Math.ceil(featureList.length / 2);
  const ctaY = gridY + rows * (itemH + gap) + 20;

  ctx.save();
  const ctaGrad = ctx.createLinearGradient(60, ctaY, W - 60, ctaY + 110);
  ctaGrad.addColorStop(0, pal.accent); ctaGrad.addColorStop(1, pal.accent2);
  roundRect(ctx, 60, ctaY, W - 120, 110, 24);
  ctx.fillStyle = ctaGrad; ctx.shadowColor = pal.accent; ctx.shadowBlur = 28; ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = "900 32px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.3)"; ctx.shadowBlur = 8;
  ctx.fillText("انضم لمنصة CoachMaster الآن! 🚀", W / 2, ctaY + 45);
  ctx.restore();

  ctx.save();
  ctx.font = "600 22px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("وطور أكاديميتك للمستوى الاحترافي ⚡", W / 2, ctaY + 83);
  ctx.restore();

  // 9. Footer
  const footerY = ctaY + 130;

  ctx.save();
  const footGrad = ctx.createLinearGradient(100, 0, W - 100, 0);
  footGrad.addColorStop(0, "rgba(0,0,0,0)");
  footGrad.addColorStop(0.5, pal.textMuted);
  footGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.strokeStyle = footGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(100, footerY); ctx.lineTo(W - 100, footerY); ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = "700 22px 'Cairo', 'Arial', sans-serif";
  ctx.textAlign = "center"; ctx.direction = "rtl"; ctx.fillStyle = pal.textMuted;
  ctx.fillText("تصميم وتطوير: Fox Developer  •  CoachMaster © 2025", W / 2, footerY + 40);
  ctx.restore();

  // Stars near footer
  [[160, footerY + 40], [W - 160, footerY + 40], [W / 2 - 250, footerY + 40], [W / 2 + 250, footerY + 40]]
    .forEach(([sx, sy]) => {
      ctx.save(); ctx.font = "16px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("⭐", sx, sy); ctx.restore();
    });

  // 10. Subtle watermark
  ctx.save();
  ctx.globalAlpha = 0.04;
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
