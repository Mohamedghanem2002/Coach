import {
  getBirthdayInfo,
  getBeltStyle,
  formatWhatsAppPhone,
  markBirthdayCongratulated,
  calculateAge,
} from "./dashboard-utils";

export { formatWhatsAppPhone };

/**
 * Strictly opens the native WhatsApp mobile or desktop application
 * Never opens WhatsApp Web
 */
export function openWhatsAppDirect(cleanPhone, text = "") {
  const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
  const paramOnly = text ? `text=${encodeURIComponent(text)}` : "";

  // Direct native WhatsApp application scheme
  // Opens the installed WhatsApp mobile app on iOS/Android (strictly NOT WhatsApp Web)
  const appUrl = cleanPhone
    ? `whatsapp://send?phone=${cleanPhone}${encodedText}`
    : text
    ? `whatsapp://send?${paramOnly}`
    : `whatsapp://send`;

  if (typeof window !== "undefined") {
    try {
      const a = document.createElement("a");
      a.href = appUrl;
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (a.parentNode) {
          document.body.removeChild(a);
        }
      }, 300);
    } catch (_) {
      window.location.href = appUrl;
    }
  }
}

/**
 * Generates an ultra-luxurious, modern and energetic Birthday Greeting Card Canvas
 * Dimensions: 1080 x 1350 (Standard 4:5 portrait)
 * Adheres to Re_action Karate Academy visual identity (Slate-950, Ruby Red, Warm Gold)
 * Features a MUCH LARGER player photo as the hero element with festive candles, balloons & stars
 */
export async function generateBirthdayCardCanvas(
  player,
  captainName = "كابتن الأكاديمية"
) {
  if (typeof document === "undefined") return null;

  if (document.fonts && document.fonts.status !== "loaded") {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 200)),
      ]);
    } catch (_) {
      // Continue even if fonts promise rejected
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bday = getBirthdayInfo(player);
  const dynamicAge = player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age;
  const turningAge = bday?.turningAge ?? dynamicAge ?? 10;
  const beltStyle = getBeltStyle(player.belt);

  // Helper text drawing functions
  const drawCenter = (text, x, y, font, color, shadow = null) => {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0,0,0,0.6)";
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
    font = "800 20px Cairo, sans-serif"
  ) => {
    ctx.save();
    const x = cx - width / 2;
    const y = cy - height / 2;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, height / 2);
    ctx.fillStyle = bgColor;
    ctx.fill();
    if (borderColor) {
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

  // 1. Deep luxury Re_action celebratory gradient background (Slate-950 & Crimson)
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#080c14");
  bg.addColorStop(0.25, "#15060a");
  bg.addColorStop(0.55, "#220810");
  bg.addColorStop(0.85, "#110408");
  bg.addColorStop(1, "#070b12");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Glowing Celebration Radial Highlights (Ruby & Gold)
  const rubyTopGlow = ctx.createRadialGradient(540, 150, 20, 540, 150, 480);
  rubyTopGlow.addColorStop(0, "rgba(225, 29, 72, 0.28)");
  rubyTopGlow.addColorStop(0.5, "rgba(245, 158, 11, 0.12)");
  rubyTopGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = rubyTopGlow;
  ctx.fillRect(0, 0, 1080, 600);

  const heroPhotoGlow = ctx.createRadialGradient(540, 470, 60, 540, 470, 360);
  heroPhotoGlow.addColorStop(0, "rgba(239, 68, 68, 0.3)");
  heroPhotoGlow.addColorStop(0.5, "rgba(245, 158, 11, 0.18)");
  heroPhotoGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = heroPhotoGlow;
  ctx.fillRect(100, 200, 880, 560);

  const bottomGoldGlow = ctx.createRadialGradient(540, 1100, 40, 540, 1100, 420);
  bottomGoldGlow.addColorStop(0, "rgba(245, 158, 11, 0.14)");
  bottomGoldGlow.addColorStop(0.6, "rgba(225, 29, 72, 0.08)");
  bottomGoldGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bottomGoldGlow;
  ctx.fillRect(0, 800, 1080, 550);

  // 3. Double Luxury Borders with Corner Jewels (Re_action brand style)
  ctx.save();
  ctx.strokeStyle = "rgba(245, 158, 11, 0.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(38, 38, 1004, 1274, 38);
  ctx.stroke();

  ctx.strokeStyle = "rgba(225, 29, 72, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(50, 50, 980, 1250, 30);
  ctx.stroke();

  const corners = [
    { x: 58, y: 58 },
    { x: 1022, y: 58 },
    { x: 58, y: 1292 },
    { x: 1022, y: 1292 },
  ];
  corners.forEach((pt) => {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 4. Festive Confetti & Sparkles
  const sparkles = [
    { x: 110, y: 130, r: 20, color: "#fbbf24", char: "★" },
    { x: 970, y: 135, r: 22, color: "#ef4444", char: "★" },
    { x: 140, y: 280, r: 24, color: "#38bdf8", char: "✦" },
    { x: 940, y: 290, r: 24, color: "#fbbf24", char: "✦" },
    { x: 200, y: 180, r: 16, color: "#f472b6", char: "✧" },
    { x: 880, y: 190, r: 18, color: "#34d399", char: "✧" },
    { x: 90, y: 490, r: 22, color: "#fbbf24", char: "★" },
    { x: 990, y: 500, r: 22, color: "#f43f5e", char: "★" },
    { x: 130, y: 690, r: 20, color: "#38bdf8", char: "✦" },
    { x: 950, y: 700, r: 20, color: "#fbbf24", char: "✦" },
    { x: 120, y: 1230, r: 18, color: "#34d399", char: "★" },
    { x: 960, y: 1235, r: 18, color: "#fbbf24", char: "★" },
  ];
  sparkles.forEach((s) => {
    ctx.save();
    ctx.font = `${s.r}px sans-serif`;
    ctx.fillStyle = s.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
    ctx.fillText(s.char, s.x, s.y);
    ctx.restore();
  });

  const confetti = [
    { x: 180, y: 130, r: 6, color: "#fbbf24" },
    { x: 900, y: 140, r: 7, color: "#ef4444" },
    { x: 260, y: 350, r: 5, color: "#38bdf8" },
    { x: 820, y: 360, r: 6, color: "#f472b6" },
    { x: 110, y: 610, r: 6, color: "#34d399" },
    { x: 970, y: 620, r: 6, color: "#fbbf24" },
    { x: 180, y: 830, r: 6, color: "#ef4444" },
    { x: 900, y: 840, r: 6, color: "#38bdf8" },
    { x: 140, y: 1140, r: 5, color: "#fbbf24" },
    { x: 940, y: 1145, r: 6, color: "#a855f7" },
  ];
  confetti.forEach((c) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  });

  // 5. Header: Academy Name & Badge
  drawBadge(
    "🥋 أكاديمية RE_ACTION للكاراتيه 🥋",
    540,
    90,
    390,
    42,
    "rgba(225, 29, 72, 0.22)",
    "#fef08a",
    "rgba(245, 158, 11, 0.55)",
    "800 19px Cairo, sans-serif"
  );

  // 6. Main Celebration Title
  drawCenter(
    "🎉 عـيـد مـيـلاد سـعـيـد 🎉",
    540,
    168,
    "900 52px Cairo, sans-serif",
    "#ffffff",
    { color: "rgba(245, 158, 11, 0.65)", blur: 20, y: 4 }
  );

  drawCenter(
    "★ HAPPY BIRTHDAY CHAMPION ★",
    540,
    212,
    "800 18px Cairo, sans-serif",
    "#fbbf24",
    { color: "rgba(251, 191, 36, 0.4)", blur: 10, y: 2 }
  );

  // 7. HERO PLAYER PHOTO (Centrally Located, Much Larger and Prominent!)
  // Previous radius was 110px. New radius is 185px (Diameter 370px - nearly 70% larger!)
  const avatarX = 540;
  const avatarY = 445;
  const avatarRadius = 185;

  // Birthday Balloons around the Photo (Left and Right)
  const drawBalloon = (bx, by, color, angle = 0) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((angle * Math.PI) / 180);

    // Balloon body
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fill();

    // Balloon highlight sheen
    ctx.beginPath();
    ctx.ellipse(-10, -12, 9, 15, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
    ctx.fill();

    // Balloon knot
    ctx.beginPath();
    ctx.moveTo(-5, 42);
    ctx.lineTo(5, 42);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Balloon wavy string
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.bezierCurveTo(10, 70, -10, 95, 5, 120);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  // Left balloons
  drawBalloon(avatarX - avatarRadius - 65, avatarY - 40, "#ef4444", -12);
  drawBalloon(avatarX - avatarRadius - 105, avatarY + 30, "#fbbf24", -22);

  // Right balloons
  drawBalloon(avatarX + avatarRadius + 65, avatarY - 40, "#38bdf8", 12);
  drawBalloon(avatarX + avatarRadius + 105, avatarY + 30, "#f43f5e", 22);

  // Floating Birthday Candles above the Hero Photo
  const candleY = avatarY - avatarRadius - 28;
  const drawCandle = (cx, cy) => {
    ctx.save();
    // Candle body
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy, 10, 24, 3);
    ctx.fill();
    // Wick
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 6);
    ctx.stroke();
    // Flame
    ctx.fillStyle = "#f97316";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 11, 4.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 9, 2.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCandle(avatarX - 28, candleY);
  drawCandle(avatarX, candleY - 4);
  drawCandle(avatarX + 28, candleY);

  // Outer Radiant Dual Rings around the Hero Avatar
  ctx.save();
  const avatarRing = ctx.createLinearGradient(
    avatarX - avatarRadius,
    avatarY - avatarRadius,
    avatarX + avatarRadius,
    avatarY + avatarRadius
  );
  avatarRing.addColorStop(0, "#fbbf24");
  avatarRing.addColorStop(0.3, "#ef4444");
  avatarRing.addColorStop(0.7, "#dc2626");
  avatarRing.addColorStop(1, "#f59e0b");

  // Outer Glowing Ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 10, 0, Math.PI * 2);
  ctx.strokeStyle = avatarRing;
  ctx.lineWidth = 7;
  ctx.shadowColor = "rgba(239, 68, 68, 0.7)";
  ctx.shadowBlur = 24;
  ctx.stroke();

  // Inner White Divider Ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Draw Player Photo or Athletic Martial Arts Avatar
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
        setTimeout(resolve, 300);
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
    ctx.save();
    const gradDef = ctx.createLinearGradient(
      avatarX - avatarRadius,
      avatarY - avatarRadius,
      avatarX + avatarRadius,
      avatarY + avatarRadius
    );
    gradDef.addColorStop(0, "#dc2626");
    gradDef.addColorStop(0.6, "#991b1b");
    gradDef.addColorStop(1, "#7f1d1d");
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradDef;
    ctx.fill();

    // Player Initial
    ctx.font = "900 130px Cairo, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 12;
    ctx.fillText((player.name || "ب").charAt(0), avatarX, avatarY + 10);
    ctx.restore();
  }

  // Floating Crown / Champion Badge at top of avatar
  drawBadge(
    "👑",
    avatarX,
    avatarY - avatarRadius + 4,
    52,
    52,
    "#fbbf24",
    "#78350f",
    "#ffffff",
    "28px sans-serif"
  );

  // 8. Player Name (Prominent & Vibrant)
  drawCenter(
    player.name,
    540,
    695,
    "900 48px Cairo, sans-serif",
    "#ffffff",
    { color: "rgba(0,0,0,0.85)", blur: 16, y: 3 }
  );

  // 9. Badges: Age Celebration + Belt + Level + Branch
  drawBadge(
    `🎂 كبرت سنة وبقيت ${turningAge} سنين! 🥳🎈`,
    540,
    755,
    460,
    48,
    "rgba(225, 29, 72, 0.95)",
    "#ffffff",
    "rgba(255, 255, 255, 0.4)",
    "900 22px Cairo, sans-serif"
  );

  const beltColorHex = beltStyle.hex || "#f8fafc";
  const beltTextColor =
    beltStyle.hex === "#0f172a" || beltStyle.hex === "#881337"
      ? "#ffffff"
      : "#1e293b";

  drawBadge(
    `🥋 ${player.belt || "حزام أبيض"}`,
    340,
    818,
    210,
    40,
    beltColorHex,
    beltTextColor,
    "rgba(255, 255, 255, 0.35)",
    "800 18px Cairo, sans-serif"
  );

  drawBadge(
    `⭐ مستوى ${player.level || "A"}`,
    540,
    818,
    140,
    40,
    "rgba(245, 158, 11, 0.9)",
    "#ffffff",
    "rgba(255, 255, 255, 0.35)",
    "800 18px Cairo, sans-serif"
  );

  drawBadge(
    `🏢 ${player.branch || "الفرع الرئيسي"}`,
    720,
    818,
    180,
    40,
    "rgba(15, 23, 42, 0.85)",
    "#f1f5f9",
    "rgba(255, 255, 255, 0.25)",
    "700 17px Cairo, sans-serif"
  );

  // 10. WARM, FRIENDLY, NON-FORMAL CELEBRATION MESSAGE BOX
  ctx.save();
  const boxX = 75;
  const boxY = 875;
  const boxW = 930;
  const boxH = 375;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 28);
  ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
  ctx.fill();
  ctx.strokeStyle = "rgba(251, 191, 36, 0.4)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawBadge(
    "💌 تهنئة من القلب لبطلنا الغالي",
    540,
    boxY + 36,
    360,
    38,
    "rgba(225, 29, 72, 0.3)",
    "#fef08a",
    "rgba(245, 158, 11, 0.5)",
    "800 18px Cairo, sans-serif"
  );

  // Warm, young, energetic, and sports-appropriate wording:
  const lines = [
    "🎉 النهارده يوم مش عادي، النهارده يوم مميز لبطلنا!",
    `كل سنة وإنت طيب وبألف صحة وهنا يا ${player.name} ❤️`,
    `كبرت سنة وبقيت ${turningAge} سنين كلها شجاعة وطاقة وبطولة! 🎂🥋`,
    "فخورين بيك وبكل خطوة وتمرين وتطور كبير بتعمله في الكاراتيه 🥊✨",
    "نتمنالك سنة جديدة مليانة نجاح، فرحة، ميداليات دهب وأهداف كتير! 🏆🥇🔥",
    `من أسرة أكاديمية Re_action والكابتن / ${captainName} ❤️`,
  ];

  let textY = boxY + 95;
  lines.forEach((line, index) => {
    const isHeroLine = index === 1 || index === 2;
    const font = isHeroLine
      ? "900 26px Cairo, sans-serif"
      : index === lines.length - 1
      ? "800 23px Cairo, sans-serif"
      : "700 24px Cairo, sans-serif";
    const color = isHeroLine
      ? "#fef08a"
      : index === lines.length - 1
      ? "#fca5a5"
      : "#f8fafc";

    drawCenter(line, 540, textY, font, color, {
      color: "rgba(0,0,0,0.6)",
      blur: 8,
      y: 2,
    });
    textY += 46;
  });
  ctx.restore();

  // 11. Footer
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(120, 1275);
  ctx.lineTo(960, 1275);
  ctx.stroke();

  drawCenter(
    `كارت تهنئة رسمي من نظام Re_action PRO  •  ${new Date().getFullYear()}`,
    540,
    1305,
    "700 18px Cairo, sans-serif",
    "#94a3b8"
  );
  ctx.restore();

  return canvas;
}

/**
 * Sends the Birthday Card directly to the native WhatsApp mobile/desktop application
 * Strictly never opens WhatsApp Web and does not trigger generic Web Share API sheets.
 * Copies card image to clipboard, downloads PNG, and opens native WhatsApp directly to chat.
 */
export async function sendBirthdayCardViaWhatsApp(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري تجهيز كارت عيد الميلاد الفخم...");

  try {
    const canvas = await generateBirthdayCardCanvas(player, captainName);
    if (!canvas) {
      if (onNotice) onNotice("❌ تعذر إنشاء كارت عيد الميلاد");
      if (onProgress) onProgress(false);
      return;
    }

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) {
      if (onNotice) onNotice("❌ تعذر إنشاء صورة الكارت");
      if (onProgress) onProgress(false);
      return;
    }

    const bday = getBirthdayInfo(player);
    const dynamicAge = player.dateOfBirth ? calculateAge(player.dateOfBirth) : player.age;
    const turningAge = bday?.turningAge ?? dynamicAge ?? 10;
    const phone =
      player.guardianPhone ||
      player.parentPhone ||
      player.guardianMobile ||
      player.mobile ||
      player.phone ||
      "";
    const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";

    const fileName = `كارت_عيد_ميلاد_${player.name.replace(/\s+/g, "_")}.png`;

    // Mark player's birthday as congratulated immediately
    markBirthdayCongratulated(player._id);

    // Warm, friendly, non-formal WhatsApp message
    const wishText = `🎉 النهارده يوم مميز لبطلنا! 🥋❤️
كل سنة وإنت طيب وبألف خير يا *${player.name}*! 🎂
كبرت سنة وبقيت *${turningAge}* سنين مليانة شجاعة وبطولة! 🥳🎈

فخورين بيك وبأدائك وتطورك في الأكاديمية ونتمنالك سنة جديدة مليانة نجاح، ميداليات دهب، وأهداف كتير! 🏆🥇🔥

مع تحيات أسرة أكاديمية Re_action والكابتن *${captainName}* ❤️`;

    // 1. Copy image directly to clipboard so user can paste it straight into WhatsApp chat
    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        copied = true;
      } catch (clipErr) {
        console.warn("Clipboard write failed:", clipErr);
      }
    }

    // 2. Auto-save / download card image to the device
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2500);
    } catch (_) {}

    // 3. Directly open the native mobile/desktop WhatsApp application to the guardian's chat
    openWhatsAppDirect(cleanPhone, wishText);

    if (onNotice) {
      onNotice(
        copied
          ? "✓ تم فتح تطبيق واتساب ونسخ كارت التهنئة للحافظة وحفظه بجهازك! الصق الصورة في المحادثة واضغط إرسال."
          : "✓ تم فتح تطبيق واتساب وحفظ كارت التهنئة بجهازك لإرساله فوراً!"
      );
    }
  } catch (err) {
    console.error("Birthday card error:", err);
    if (onNotice) onNotice("❌ حدث خطأ أثناء تجهيز كارت عيد الميلاد");
  } finally {
    if (onProgress) setTimeout(() => onProgress(false), 1200);
  }
}

/**
 * Downloads the high-resolution Birthday Card PNG directly
 */
export async function downloadBirthdayCard(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice } = options;
  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري إنشاء وتحميل كارت عيد الميلاد...");

  try {
    const canvas = await generateBirthdayCardCanvas(player, captainName);
    if (!canvas) {
      if (onNotice) onNotice("❌ تعذر إنشاء كارت عيد الميلاد");
      return;
    }
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) {
      if (onNotice) onNotice("❌ تعذر إنشاء صورة الكارت");
      return;
    }
    const fileName = `كارت_عيد_ميلاد_${player.name.replace(/\s+/g, "_")}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    if (onNotice) onNotice("✓ تم تحميل كارت عيد الميلاد بجهازك بنجاح!");
  } catch (err) {
    console.error("Download birthday card error:", err);
    if (onNotice) onNotice("❌ حدث خطأ أثناء تحميل الكارت");
  } finally {
    if (onProgress) setTimeout(() => onProgress(false), 1500);
  }
}
