import {
  getBeltStyle,
  formatWhatsAppPhone,
  calculateAge,
  openWhatsAppDirect,
} from "./dashboard-utils";
import { copyBlobToClipboard } from "./birthday-card-utils";

export { formatWhatsAppPhone, copyBlobToClipboard };

/**
 * Generates an ultra-stylish, modern, energetic Karate Welcome Card (كارت ترحيب بطل جديد)
 * Dimensions: 1080 x 1350 (Standard 4:5 social media portrait)
 * Aesthetic: Dark obsidian & deep navy with radiant athletic gold, crimson flame accents,
 * geometric speed slashes, glowing multi-layer avatar frame, and professional typography.
 */
export async function generateWelcomeCardCanvas(
  player,
  captainName = "كابتن الأكاديمية"
) {
  if (typeof document === "undefined") return null;

  if (document.fonts && document.fonts.status !== "loaded") {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 250)),
      ]);
    } catch (_) {
      // Continue even if fonts take longer
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dynamicAge = calculateAge(player.dateOfBirth) ?? player.age ?? 0;
  const beltStyle = getBeltStyle(player.belt);
  const joinDate = player.createdAt
    ? new Date(player.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : new Date().toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  // ── Helper functions ──
  const drawCenter = (text, x, y, font, color, shadow = null) => {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0,0,0,0.5)";
      ctx.shadowBlur = shadow.blur || 12;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 4;
    }
    ctx.fillText(text, x, y);
    ctx.restore();
  };

  const drawBadge = (
    text,
    cx,
    cy,
    width,
    height,
    bgColor,
    textColor,
    borderColor = null,
    font = "800 22px Cairo, sans-serif",
    shadow = null
  ) => {
    ctx.save();
    const x = cx - width / 2;
    const y = cy - height / 2;
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0,0,0,0.3)";
      ctx.shadowBlur = shadow.blur || 10;
      ctx.shadowOffsetY = shadow.y || 4;
    }
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    if (borderColor) {
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.font = font;
    ctx.fillStyle = textColor;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText(text, cx, cy);
    ctx.restore();
  };

  // ── 1. Background (Deep Athletic Obsidian & Midnight Mesh) ──
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#060913");
  bg.addColorStop(0.25, "#0b1222");
  bg.addColorStop(0.55, "#0f172a");
  bg.addColorStop(0.85, "#15102a");
  bg.addColorStop(1, "#080b14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  // ── 2. Ambient Energy Glows ──
  // Top Flame Glow
  const topGlow = ctx.createRadialGradient(540, 120, 20, 540, 120, 480);
  topGlow.addColorStop(0, "rgba(239, 68, 68, 0.28)");
  topGlow.addColorStop(0.45, "rgba(245, 158, 11, 0.16)");
  topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, 1080, 500);

  // Hero Avatar Glow
  const heroGlow = ctx.createRadialGradient(540, 450, 40, 540, 450, 360);
  heroGlow.addColorStop(0, "rgba(245, 158, 11, 0.32)");
  heroGlow.addColorStop(0.4, "rgba(220, 38, 38, 0.18)");
  heroGlow.addColorStop(0.8, "rgba(59, 130, 246, 0.08)");
  heroGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = heroGlow;
  ctx.fillRect(100, 150, 880, 600);

  // Bottom Ambient Neon
  const bottomGlow = ctx.createRadialGradient(540, 1250, 30, 540, 1250, 450);
  bottomGlow.addColorStop(0, "rgba(99, 102, 241, 0.2)");
  bottomGlow.addColorStop(0.6, "rgba(239, 68, 68, 0.1)");
  bottomGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 950, 1080, 400);

  // ── 3. Dynamic Sports Geometric Speed Slashes ──
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1.5;
  for (let i = -200; i < 1200; i += 70) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 400, 1350);
    ctx.stroke();
  }
  // Subtle energetic red/gold slash lines
  ctx.strokeStyle = "rgba(239, 68, 68, 0.18)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(80, 260);
  ctx.lineTo(380, 560);
  ctx.stroke();

  ctx.strokeStyle = "rgba(245, 158, 11, 0.2)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(1000, 320);
  ctx.lineTo(700, 620);
  ctx.stroke();
  ctx.restore();

  // ── 4. Luxury Multi-Layer Frame & Corner Accents ──
  ctx.save();
  const goldBorderGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  goldBorderGrad.addColorStop(0, "#fbbf24");
  goldBorderGrad.addColorStop(0.25, "#d97706");
  goldBorderGrad.addColorStop(0.5, "#ef4444");
  goldBorderGrad.addColorStop(0.75, "#f59e0b");
  goldBorderGrad.addColorStop(1, "#fbbf24");

  // Outer border
  ctx.strokeStyle = goldBorderGrad;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(38, 38, 1004, 1274, 34);
  ctx.stroke();

  // Inner subtle border
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(50, 50, 980, 1250, 26);
  ctx.stroke();

  // Corner brackets
  const cornerBrackets = [
    { x: 42, y: 42, dx: 1, dy: 1 },
    { x: 1038, y: 42, dx: -1, dy: 1 },
    { x: 42, y: 1308, dx: 1, dy: -1 },
    { x: 1038, y: 1308, dx: -1, dy: -1 },
  ];
  cornerBrackets.forEach((c) => {
    ctx.strokeStyle = "#fbbf24";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + c.dy * 26);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x + c.dx * 26, c.y);
    ctx.stroke();
  });
  ctx.restore();

  // ── 5. Top Header Banner ──
  // Header Badge Pill
  drawBadge(
    "🥋  إعــلان انـضـمـام بـطـل جـديـد  🥋",
    540,
    104,
    460,
    46,
    "rgba(239, 68, 68, 0.2)",
    "#fecaca",
    "rgba(239, 68, 68, 0.5)",
    "900 21px Cairo, sans-serif"
  );

  // Academy Name
  drawCenter(
    "أَكَـادِيـمِـيَّـة الأَبْـطَـال لِـلْـكَـارَاتِـيـه",
    540,
    168,
    "900 34px Cairo, sans-serif",
    "#ffffff",
    { color: "rgba(245, 158, 11, 0.6)", blur: 18, y: 3 }
  );

  // Subtitle / Stars
  drawCenter(
    "★  ★  ★   WELCOME TO THE SQUAD   ★  ★  ★",
    540,
    205,
    "800 16px Cairo, sans-serif",
    "#f59e0b"
  );

  // ── 6. Player Hero Avatar / Photo Section ──
  const avatarX = 540;
  const avatarY = 445;
  const avatarRadius = 165;

  // Outer glowing aura rings
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 18, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Main metallic avatar border
  ctx.save();
  const avatarRingGrad = ctx.createLinearGradient(
    avatarX - avatarRadius,
    avatarY - avatarRadius,
    avatarX + avatarRadius,
    avatarY + avatarRadius
  );
  avatarRingGrad.addColorStop(0, "#fbbf24");
  avatarRingGrad.addColorStop(0.3, "#f97316");
  avatarRingGrad.addColorStop(0.7, "#dc2626");
  avatarRingGrad.addColorStop(1, "#fbbf24");

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = avatarRingGrad;
  ctx.lineWidth = 8;
  ctx.shadowColor = "rgba(245, 158, 11, 0.6)";
  ctx.shadowBlur = 24;
  ctx.stroke();
  ctx.restore();

  // Draw Player Photo or Athletic Avatar
  let photoLoaded = false;
  if (player.photo) {
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = player.photo;
      await new Promise((resolve) => {
        img.onload = () => {
          photoLoaded = true;
          resolve();
        };
        img.onerror = () => resolve();
        setTimeout(resolve, 350);
      });

      if (photoLoaded) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          img,
          avatarX - avatarRadius,
          avatarY - avatarRadius,
          avatarRadius * 2,
          avatarRadius * 2
        );
        ctx.restore();
      }
    } catch (_) {
      photoLoaded = false;
    }
  }

  if (!photoLoaded) {
    // Stylish Athletic Martial Arts Gradient Avatar
    ctx.save();
    const avatarBg = ctx.createRadialGradient(
      avatarX,
      avatarY - 30,
      20,
      avatarX,
      avatarY,
      avatarRadius
    );
    avatarBg.addColorStop(0, "#1e293b");
    avatarBg.addColorStop(0.7, "#0f172a");
    avatarBg.addColorStop(1, "#020617");

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = avatarBg;
    ctx.fill();

    // Karate Gi / Kimono graphical silhouette
    // Head / Face
    ctx.fillStyle = "#fbcfe8";
    ctx.beginPath();
    ctx.arc(avatarX, avatarY - 32, 42, 0, Math.PI * 2);
    ctx.fill();

    // Red Headband
    ctx.fillStyle = "#dc2626";
    ctx.fillRect(avatarX - 44, avatarY - 60, 88, 16);
    // Headband ribbon tails
    ctx.beginPath();
    ctx.moveTo(avatarX - 42, avatarY - 52);
    ctx.lineTo(avatarX - 70, avatarY - 35);
    ctx.lineTo(avatarX - 65, avatarY - 25);
    ctx.lineTo(avatarX - 40, avatarY - 44);
    ctx.fill();

    // White Karate Kimono Body
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.moveTo(avatarX, avatarY + 12);
    ctx.lineTo(avatarX - 85, avatarY + 155);
    ctx.lineTo(avatarX + 85, avatarY + 155);
    ctx.closePath();
    ctx.fill();

    // Kimono V-neck black inner
    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(avatarX, avatarY + 55);
    ctx.lineTo(avatarX - 22, avatarY + 12);
    ctx.lineTo(avatarX + 22, avatarY + 12);
    ctx.closePath();
    ctx.fill();

    // Kimono fold lines
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(avatarX - 22, avatarY + 12);
    ctx.lineTo(avatarX + 32, avatarY + 105);
    ctx.moveTo(avatarX + 22, avatarY + 12);
    ctx.lineTo(avatarX - 32, avatarY + 105);
    ctx.stroke();

    // Belt around waist
    ctx.fillStyle = beltStyle?.bg || "#dc2626";
    ctx.fillRect(avatarX - 65, avatarY + 105, 130, 20);
    // Belt knot
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(avatarX - 12, avatarY + 102, 24, 26);
    ctx.restore();
  }

  // Floating Hero Badge (Over Avatar Bottom-Right)
  drawBadge(
    "🔥 بـطـل جـديـد",
    avatarX + 115,
    avatarY + 130,
    170,
    42,
    "linear-gradient(90deg, #dc2626, #f59e0b)",
    "#ffffff",
    "#fef08a",
    "900 18px Cairo, sans-serif",
    { color: "rgba(0,0,0,0.6)", blur: 12, y: 4 }
  );

  // ── 7. Player Name ──
  drawCenter(
    `البطل / ${player.name}`,
    540,
    695,
    "900 50px Cairo, sans-serif",
    "#ffffff",
    { color: "rgba(245, 158, 11, 0.7)", blur: 20, y: 4 }
  );

  // ── 8. Badges Row (Belt, Branch, Age) ──
  const badgeY = 762;
  const beltLabel = `🥋 حزام ${player.belt || "أبيض"} (${player.level || "A"})`;
  const branchLabel = `🏢 فرع ${player.branch || "الرئيسي"}`;
  const ageLabel = `⚡ ${dynamicAge} سنة`;

  drawBadge(
    beltLabel,
    260,
    badgeY,
    240,
    46,
    "rgba(30, 41, 59, 0.85)",
    "#fbbf24",
    "rgba(245, 158, 11, 0.4)",
    "800 20px Cairo, sans-serif"
  );

  drawBadge(
    branchLabel,
    540,
    badgeY,
    240,
    46,
    "rgba(30, 41, 59, 0.85)",
    "#38bdf8",
    "rgba(56, 189, 248, 0.4)",
    "800 20px Cairo, sans-serif"
  );

  drawBadge(
    ageLabel,
    800,
    badgeY,
    180,
    46,
    "rgba(30, 41, 59, 0.85)",
    "#4ade80",
    "rgba(74, 222, 128, 0.4)",
    "800 20px Cairo, sans-serif"
  );

  // ── 9. Welcoming Inspirational Quote Card ──
  const quoteBoxY = 825;
  const quoteBoxHeight = 220;
  const quoteBoxWidth = 920;
  const quoteBoxX = 540 - quoteBoxWidth / 2;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(quoteBoxX, quoteBoxY, quoteBoxWidth, quoteBoxHeight, 24);
  const quoteGrad = ctx.createLinearGradient(0, quoteBoxY, 0, quoteBoxY + quoteBoxHeight);
  quoteGrad.addColorStop(0, "rgba(255, 255, 255, 0.08)");
  quoteGrad.addColorStop(1, "rgba(255, 255, 255, 0.02)");
  ctx.fillStyle = quoteGrad;
  ctx.fill();

  ctx.strokeStyle = "rgba(245, 158, 11, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Quote Icon
  ctx.font = "900 50px Cairo, sans-serif";
  ctx.fillStyle = "rgba(245, 158, 11, 0.45)";
  ctx.textAlign = "center";
  ctx.fillText("❝", 540, quoteBoxY + 50);

  // Motivational message
  drawCenter(
    "أهـلاً بـك فـي عـريـن الأَبْـطَـال!",
    540,
    quoteBoxY + 98,
    "900 29px Cairo, sans-serif",
    "#fef08a",
    { color: "rgba(0,0,0,0.5)", blur: 8, y: 2 }
  );

  drawCenter(
    "رحلة صناعة البطل والتميز تبدأ بخطوة وعزيمة لا تلين..",
    540,
    quoteBoxY + 144,
    "700 23px Cairo, sans-serif",
    "#e2e8f0"
  );

  drawCenter(
    "كل الدعم والتشجيع لتصل إلى منصات التتويج والذهب 🥋🏆",
    540,
    quoteBoxY + 184,
    "800 23px Cairo, sans-serif",
    "#fca5a5"
  );
  ctx.restore();

  // ── 10. Coach Leadership & Date Strip ──
  const infoY = 1115;
  // Coach badge
  drawBadge(
    `👤 قيادة وإشراف: كابتن ${captainName}`,
    370,
    infoY,
    440,
    52,
    "rgba(15, 23, 42, 0.9)",
    "#f1f5f9",
    "rgba(245, 158, 11, 0.3)",
    "800 21px Cairo, sans-serif"
  );

  // Join Date badge
  drawBadge(
    `📅 انضم بتاريخ: ${joinDate}`,
    770,
    infoY,
    300,
    52,
    "rgba(15, 23, 42, 0.9)",
    "#94a3b8",
    "rgba(255, 255, 255, 0.15)",
    "700 19px Cairo, sans-serif"
  );

  // ── 11. Bottom Academy Motto ──
  drawCenter(
    "🔥  عَــزِيـمَــة  •  قُــوَّة  •  انْـضِـبَــاط  •  تَـمَـيُّــز  🔥",
    540,
    1220,
    "900 22px Cairo, sans-serif",
    "#f59e0b",
    { color: "rgba(245, 158, 11, 0.5)", blur: 14, y: 2 }
  );

  drawCenter(
    "DETERMINATION • STRENGTH • DISCIPLINE • EXCELLENCE",
    540,
    1255,
    "800 14px Cairo, sans-serif",
    "#64748b"
  );

  return canvas;
}

/**
 * Prepares pre-written exciting social media / WhatsApp message
 */
export function generateWelcomeText(player, captainName = "كابتن الأكاديمية") {
  return `🥋🔥 *إعلان انضمام بطل جديد للأكاديمية!* 🔥🥋

يسعدنا أن نرحب بالبطل / *${player.name}* 🌟
📍 *الفرع:* ${player.branch}
🥋 *الحزام:* ${player.belt || "أبيض"} (المستوى ${player.level || "A"})

مرحباً بك في أسرة الأكاديمية وعالم صناعة الأبطال! نتمنى لك مسيرة رياضية حافلة بالإنجازات والبطولات ومنصات التتويج 🏆🥇

تحت إشراف وتدريب الكابتن / *${captainName}* 🥋❤️`;
}

/**
 * Downloads high quality PNG of the Welcome Card
 */
export async function downloadWelcomeCard(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice, existingBlob } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري إنشاء كارت الترحيب عالي الدقة...");

  try {
    let blob = existingBlob;
    if (!blob) {
      const canvas = await generateWelcomeCardCanvas(player, captainName);
      if (!canvas) throw new Error("Canvas generation failed");
      blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Blob creation failed");
    }

    const fileName = `كارت_ترحيب_البطل_${(player.name || "اللاعب").replace(/\s+/g, "_")}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    if (onNotice) onNotice("✓ تم تحميل كارت الترحيب بجهازك بنجاح!");
    return blob;
  } catch (err) {
    console.error("Error downloading welcome card:", err);
    if (onNotice) onNotice("❌ تعذر تحميل الكارت. حاول مرة أخرى.");
    throw err;
  } finally {
    if (onProgress) onProgress(false);
  }
}

/**
 * Native Social Media share via Web Share API
 */
export async function shareWelcomeCardSocial(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice, existingBlob } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري تجهيز كارت الترحيب للمشاركة...");

  try {
    let blob = existingBlob;
    if (!blob) {
      const canvas = await generateWelcomeCardCanvas(player, captainName);
      if (!canvas) throw new Error("Canvas failed");
      blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Blob failed");
    }

    const fileName = `كارت_ترحيب_${(player.name || "البطل").replace(/\s+/g, "_")}.png`;
    const file = new File([blob], fileName, { type: "image/png" });
    const text = generateWelcomeText(player, captainName);

    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `كارت ترحيب البطل ${player.name}`,
        text,
      });
      if (onNotice) onNotice("✓ تم فتح نافذة المشاركة بنجاح!");
      return;
    }

    // Fallback: Copy to clipboard & trigger download
    await copyBlobToClipboard(blob);
    await downloadWelcomeCard(player, captainName, { existingBlob: blob });
    if (onNotice) {
      onNotice("✓ تم نسخ الصورة وحفظها! يمكنك لصقها الآن في فيسبوك، انستجرام، أو أي تطبيق.");
    }
  } catch (err) {
    if (err?.name !== "AbortError") {
      console.error("Share error:", err);
      if (onNotice) onNotice("❌ تعذر المشاركة المباشرة.");
    }
  } finally {
    if (onProgress) onProgress(false);
  }
}

/**
 * Sends Welcome Card via WhatsApp to player's guardian or general chat
 */
export async function sendWelcomeCardViaWhatsApp(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice, existingBlob } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري تجهيز الكارت والرسالة للواتساب...");

  try {
    let blob = existingBlob;
    if (!blob) {
      const canvas = await generateWelcomeCardCanvas(player, captainName);
      if (!canvas) throw new Error("Canvas generation failed");
      blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Blob creation failed");
    }

    const fileName = `كارت_ترحيب_${player.name.replace(/\s+/g, "_")}.png`;
    const file = new File([blob], fileName, { type: "image/png" });
    const message = generateWelcomeText(player, captainName);

    // Try web share if available
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `كارت ترحيب البطل ${player.name}`,
        text: message,
      });
      if (onNotice) onNotice("✓ تم فتح المشاركة كصورة ورسالة بنجاح!");
      return;
    }

    // Fallback on desktop / devices without file sharing:
    // Copy image to clipboard so coach can simply paste (Ctrl+V) in WhatsApp!
    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        copied = true;
      } catch (_) {}
    }

    // Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2000);

    const phone =
      player.guardianPhone ||
      player.parentPhone ||
      player.guardianMobile ||
      player.mobile ||
      player.phone ||
      "";
    const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";

    openWhatsAppDirect(cleanPhone, message);

    if (onNotice) {
      onNotice(
        copied
          ? `✓ تم نسخ الكارت للحافظة وفتح شات واتساب! اضغط (لصق / Paste) لإرسال الصورة فوراً 🖼️`
          : "✓ تم تنزيل كارت الترحيب وفتح شات واتساب!"
      );
    }
  } catch (err) {
    if (err?.name !== "AbortError") {
      console.error("WhatsApp share error:", err);
      if (onNotice) onNotice("❌ تعذر إرسال الكارت عبر واتساب.");
    }
  } finally {
    if (onProgress) onProgress(false);
  }
}
