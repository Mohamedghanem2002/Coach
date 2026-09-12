import {
  getBirthdayInfo,
  getBeltStyle,
  formatWhatsAppPhone,
  markBirthdayCongratulated,
  calculateAge,
} from "./dashboard-utils";

export { formatWhatsAppPhone };

/**
 * Opens WhatsApp directly to the recipient's chat
 * On mobile: triggers native WhatsApp application
 * On desktop: opens WhatsApp Web chat directly with the phone number
 */
export function openWhatsAppDirect(cleanPhone, text = "") {
  if (typeof window === "undefined") return;

  const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
  const paramOnly = text ? `text=${encodeURIComponent(text)}` : "";

  const isMobile =
    typeof navigator !== "undefined" &&
    /android|iphone|ipad|ipod/i.test(navigator.userAgent || "");

  if (cleanPhone) {
    if (isMobile) {
      // Mobile native app deep link
      const appUrl = `whatsapp://send?phone=${cleanPhone}${encodedText}`;
      const fallbackUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}${encodedText}`;

      try {
        const a = document.createElement("a");
        a.href = appUrl;
        a.rel = "noopener noreferrer";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          if (a.parentNode) document.body.removeChild(a);
        }, 300);

        // Fallback to web link if native scheme does not respond
        setTimeout(() => {
          if (document.hasFocus && document.hasFocus()) {
            window.open(fallbackUrl, "_blank");
          }
        }, 1200);
      } catch (_) {
        window.location.href = appUrl;
      }
    } else {
      // Desktop: Open WhatsApp Web directly into the contact chat
      const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}${encodedText}`;
      window.open(webUrl, "_blank", "noopener,noreferrer");
    }
  } else {
    if (isMobile) {
      window.location.href = text ? `whatsapp://send?${paramOnly}` : `whatsapp://send`;
    } else {
      window.open("https://web.whatsapp.com", "_blank", "noopener,noreferrer");
    }
  }
}

/**
 * Generates an ultra-luxurious, bright, joyful and modern Birthday Greeting Card Canvas
 * Dimensions: 1080 x 1350 (Standard 4:5 portrait)
 * Festive Light Palette: Luminous Ivory, Radiant Gold, Energetic Crimson & Ruby Accents
 * Features a large player hero photo with festive candles, balloons, sparkles & celebratory ribbons
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
      ctx.shadowColor = shadow.color || "rgba(0,0,0,0.15)";
      ctx.shadowBlur = shadow.blur || 10;
      ctx.shadowOffsetX = shadow.x || 0;
      ctx.shadowOffsetY = shadow.y || 2;
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
    font = "800 20px Cairo, sans-serif",
    shadow = null
  ) => {
    ctx.save();
    const x = cx - width / 2;
    const y = cy - height / 2;
    if (shadow) {
      ctx.shadowColor = shadow.color || "rgba(0,0,0,0.1)";
      ctx.shadowBlur = shadow.blur || 8;
      ctx.shadowOffsetY = shadow.y || 3;
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

  // 1. Luminous Light Celebratory Background (Warm Ivory & Champagne Dawn)
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(0.18, "#fff8f0"); // Warm champagne dawn
  bg.addColorStop(0.45, "#fff1f2"); // Delicate festive rose blossom
  bg.addColorStop(0.75, "#fffbeb"); // Warm celebratory gold glow
  bg.addColorStop(1, "#fffdfa");    // Soft pearl white
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Radiant Celebration Ambient Highlights (Warm Gold & Rose)
  const topGlow = ctx.createRadialGradient(540, 160, 30, 540, 160, 500);
  topGlow.addColorStop(0, "rgba(251, 191, 36, 0.22)");
  topGlow.addColorStop(0.5, "rgba(244, 63, 94, 0.1)");
  topGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, 1080, 600);

  const heroPhotoGlow = ctx.createRadialGradient(540, 445, 60, 540, 445, 380);
  heroPhotoGlow.addColorStop(0, "rgba(245, 158, 11, 0.28)");
  heroPhotoGlow.addColorStop(0.5, "rgba(225, 29, 72, 0.12)");
  heroPhotoGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = heroPhotoGlow;
  ctx.fillRect(60, 150, 960, 600);

  const bottomGlow = ctx.createRadialGradient(540, 1100, 40, 540, 1100, 460);
  bottomGlow.addColorStop(0, "rgba(254, 215, 170, 0.32)");
  bottomGlow.addColorStop(0.6, "rgba(254, 205, 211, 0.18)");
  bottomGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 800, 1080, 550);

  // 3. Double Luxury Borders with Corner Jewels (Polished Royal Gold & Ruby)
  ctx.save();
  const goldBorderGrad = ctx.createLinearGradient(0, 0, 1080, 1350);
  goldBorderGrad.addColorStop(0, "#d97706");
  goldBorderGrad.addColorStop(0.3, "#f59e0b");
  goldBorderGrad.addColorStop(0.7, "#b45309");
  goldBorderGrad.addColorStop(1, "#d97706");

  ctx.strokeStyle = goldBorderGrad;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.roundRect(38, 38, 1004, 1274, 38);
  ctx.stroke();

  ctx.strokeStyle = "rgba(225, 29, 72, 0.4)";
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
    ctx.fillStyle = "#d97706";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 4. Vibrant Celebratory Confetti & Sparkles
  const sparkles = [
    { x: 110, y: 130, r: 22, color: "#d97706", char: "★" },
    { x: 970, y: 135, r: 22, color: "#dc2626", char: "★" },
    { x: 140, y: 280, r: 24, color: "#0284c7", char: "✦" },
    { x: 940, y: 290, r: 24, color: "#d97706", char: "✦" },
    { x: 200, y: 180, r: 18, color: "#db2777", char: "✧" },
    { x: 880, y: 190, r: 18, color: "#059669", char: "✧" },
    { x: 90, y: 490, r: 22, color: "#d97706", char: "★" },
    { x: 990, y: 500, r: 22, color: "#e11d48", char: "★" },
    { x: 130, y: 690, r: 22, color: "#0284c7", char: "✦" },
    { x: 950, y: 700, r: 22, color: "#d97706", char: "✦" },
    { x: 120, y: 1230, r: 18, color: "#059669", char: "★" },
    { x: 960, y: 1235, r: 18, color: "#d97706", char: "★" },
  ];
  sparkles.forEach((s) => {
    ctx.save();
    ctx.font = `${s.r}px sans-serif`;
    ctx.fillStyle = s.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 8;
    ctx.fillText(s.char, s.x, s.y);
    ctx.restore();
  });

  const confetti = [
    { x: 180, y: 130, r: 6, color: "#d97706" },
    { x: 900, y: 140, r: 7, color: "#dc2626" },
    { x: 260, y: 350, r: 5, color: "#0284c7" },
    { x: 820, y: 360, r: 6, color: "#db2777" },
    { x: 110, y: 610, r: 6, color: "#059669" },
    { x: 970, y: 620, r: 6, color: "#d97706" },
    { x: 180, y: 830, r: 6, color: "#dc2626" },
    { x: 900, y: 840, r: 6, color: "#0284c7" },
    { x: 140, y: 1140, r: 5, color: "#d97706" },
    { x: 940, y: 1145, r: 6, color: "#7c3aed" },
  ];
  confetti.forEach((c) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fillStyle = c.color;
    ctx.shadowColor = c.color;
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.restore();
  });

  // 5. Header: Academy Name & Badge (Bright & Prestigious)
  drawBadge(
    "🥋 أكاديمية RE_ACTION للكاراتيه 🥋",
    540,
    90,
    390,
    44,
    "#ffffff",
    "#991b1b",
    "#f59e0b",
    "800 20px Cairo, sans-serif",
    { color: "rgba(217, 119, 6, 0.2)", blur: 10, y: 3 }
  );

  // 6. Main Celebration Title (Rich Ruby Red & Royal Gold)
  drawCenter(
    "🎉 عـيـد مـيـلاد سـعـيـد 🎉",
    540,
    168,
    "900 54px Cairo, sans-serif",
    "#be123c",
    { color: "rgba(190, 18, 60, 0.25)", blur: 14, y: 3 }
  );

  drawCenter(
    "★ HAPPY BIRTHDAY CHAMPION ★",
    540,
    214,
    "800 19px Cairo, sans-serif",
    "#b45309",
    { color: "rgba(180, 83, 9, 0.2)", blur: 6, y: 2 }
  );

  // 7. HERO PLAYER PHOTO (Large, Prominent & Surrounded by Joyful Balloons)
  const avatarX = 540;
  const avatarY = 445;
  const avatarRadius = 185;

  // Birthday Balloons around the Photo
  const drawBalloon = (bx, by, color, angle = 0) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((angle * Math.PI) / 180);

    // Balloon body
    ctx.beginPath();
    ctx.ellipse(0, 0, 32, 42, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();

    // Balloon highlight sheen
    ctx.beginPath();
    ctx.ellipse(-10, -12, 9, 15, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fill();

    // Balloon knot
    ctx.beginPath();
    ctx.moveTo(-5, 42);
    ctx.lineTo(5, 42);
    ctx.lineTo(0, 48);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Balloon curly string
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.bezierCurveTo(10, 70, -10, 95, 5, 120);
    ctx.strokeStyle = "rgba(100, 116, 139, 0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  // Left balloons
  drawBalloon(avatarX - avatarRadius - 65, avatarY - 40, "#dc2626", -12);
  drawBalloon(avatarX - avatarRadius - 105, avatarY + 30, "#f59e0b", -22);

  // Right balloons
  drawBalloon(avatarX + avatarRadius + 65, avatarY - 40, "#0284c7", 12);
  drawBalloon(avatarX + avatarRadius + 105, avatarY + 30, "#db2777", 22);

  // Floating Birthday Candles above the Hero Photo
  const candleY = avatarY - avatarRadius - 28;
  const drawCandle = (cx, cy) => {
    ctx.save();
    // Candle body
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy, 10, 24, 3);
    ctx.fill();
    // Wick
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 6);
    ctx.stroke();
    // Flame
    ctx.fillStyle = "#f97316";
    ctx.shadowColor = "#f59e0b";
    ctx.shadowBlur = 14;
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
  avatarRing.addColorStop(0, "#f59e0b");
  avatarRing.addColorStop(0.3, "#dc2626");
  avatarRing.addColorStop(0.7, "#e11d48");
  avatarRing.addColorStop(1, "#d97706");

  // Outer Glowing Ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 10, 0, Math.PI * 2);
  ctx.strokeStyle = avatarRing;
  ctx.lineWidth = 7;
  ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
  ctx.shadowBlur = 20;
  ctx.stroke();

  // Inner White Divider Ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
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
    ctx.save();
    const gradDef = ctx.createLinearGradient(
      avatarX - avatarRadius,
      avatarY - avatarRadius,
      avatarX + avatarRadius,
      avatarY + avatarRadius
    );
    gradDef.addColorStop(0, "#dc2626");
    gradDef.addColorStop(0.6, "#be123c");
    gradDef.addColorStop(1, "#991b1b");
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
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 10;
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
    "28px sans-serif",
    { color: "rgba(217, 119, 6, 0.3)", blur: 8, y: 2 }
  );

  // 8. Player Name (Ultra-Crisp, High Contrast Midnight Charcoal)
  drawCenter(
    player.name,
    540,
    695,
    "900 50px Cairo, sans-serif",
    "#0f172a",
    { color: "rgba(0,0,0,0.12)", blur: 6, y: 2 }
  );

  // 9. Badges: Age Celebration + Belt + Level + Branch
  drawBadge(
    `🎂 كبرت سنة وبقيت ${turningAge} سنين! 🥳🎈`,
    540,
    755,
    470,
    50,
    "#e11d48",
    "#ffffff",
    "#fde047",
    "900 23px Cairo, sans-serif",
    { color: "rgba(225, 29, 72, 0.3)", blur: 10, y: 3 }
  );

  const beltColorHex = beltStyle.hex || "#f8fafc";
  const isLightBelt =
    beltColorHex === "#ffffff" ||
    beltColorHex === "#f8fafc" ||
    beltColorHex === "#fef08a";
  const beltTextColor = isLightBelt ? "#0f172a" : "#ffffff";
  const beltBorder = isLightBelt
    ? "rgba(0, 0, 0, 0.2)"
    : "rgba(255, 255, 255, 0.4)";

  drawBadge(
    `🥋 ${player.belt || "حزام أبيض"}`,
    340,
    818,
    210,
    42,
    beltColorHex,
    beltTextColor,
    beltBorder,
    "800 18px Cairo, sans-serif",
    { color: "rgba(0,0,0,0.08)", blur: 6, y: 2 }
  );

  drawBadge(
    `⭐ مستوى ${player.level || "A"}`,
    540,
    818,
    140,
    42,
    "#fef3c7",
    "#92400e",
    "#f59e0b",
    "800 18px Cairo, sans-serif",
    { color: "rgba(217, 119, 6, 0.15)", blur: 6, y: 2 }
  );

  drawBadge(
    `🏢 ${player.branch || "الفرع الرئيسي"}`,
    720,
    818,
    180,
    42,
    "#f1f5f9",
    "#1e293b",
    "#cbd5e1",
    "700 17px Cairo, sans-serif",
    { color: "rgba(0,0,0,0.08)", blur: 6, y: 2 }
  );

  // 10. WARM, FRIENDLY CELEBRATION MESSAGE CARD
  ctx.save();
  const boxX = 75;
  const boxY = 875;
  const boxW = 930;
  const boxH = 375;

  // Box Card Background with soft drop shadow
  ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.strokeStyle = "rgba(217, 119, 6, 0.45)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawBadge(
    "💌 تهنئة من القلب لبطلنا الغالي",
    540,
    boxY + 36,
    360,
    38,
    "#fff1f2",
    "#9f1239",
    "#fca5a5",
    "800 18px Cairo, sans-serif"
  );

  // Warm, young, energetic celebration lines
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
    let font = "700 23px Cairo, sans-serif";
    let color = "#1e293b";

    if (index === 0) {
      color = "#0f172a";
      font = "700 23px Cairo, sans-serif";
    } else if (index === 1) {
      color = "#be123c"; // Hero Ruby
      font = "900 26px Cairo, sans-serif";
    } else if (index === 2) {
      color = "#b45309"; // Warm Gold
      font = "900 25px Cairo, sans-serif";
    } else if (index === 3) {
      color = "#1e293b";
      font = "700 23px Cairo, sans-serif";
    } else if (index === 4) {
      color = "#047857"; // Emerald Winner Green
      font = "800 23px Cairo, sans-serif";
    } else if (index === 5) {
      color = "#9f1239";
      font = "800 22px Cairo, sans-serif";
    }

    drawCenter(line, 540, textY, font, color, {
      color: "rgba(0,0,0,0.06)",
      blur: 4,
      y: 1,
    });
    textY += 46;
  });
  ctx.restore();

  // 11. Footer
  ctx.save();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.08)";
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
    "#64748b"
  );
  ctx.restore();

  return canvas;
}

/**
 * Shares the Birthday Card directly as an image file using Web Share API
 * Enables sharing directly to WhatsApp, Status, Telegram, etc. as an actual photo
 */
export async function shareBirthdayCard(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري تجهيز كارت عيد الميلاد للمشاركة...");

  try {
    const canvas = await generateBirthdayCardCanvas(player, captainName);
    if (!canvas) throw new Error("Canvas generation failed");

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) throw new Error("Blob creation failed");

    const fileName = `كارت_عيد_ميلاد_${player.name.replace(/\s+/g, "_")}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    // Mark player's birthday as congratulated
    markBirthdayCongratulated(player._id);

    // 1. Try native Web Share API with image file
    if (
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      await navigator.share({
        files: [file],
        title: `كارت عيد ميلاد ${player.name}`,
      });
      if (onNotice) onNotice("✓ تم مشاركة كارت التهنئة كصورة بنجاح!");
      return;
    }

    // 2. Fallback if navigator.share with files is not supported (e.g. desktop PC)
    let copied = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.write) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        copied = true;
      } catch (_) {}
    }

    // Auto-save / download
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2500);

    const phone =
      player.guardianPhone ||
      player.parentPhone ||
      player.guardianMobile ||
      player.mobile ||
      player.phone ||
      "";
    const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";
    if (cleanPhone) {
      openWhatsAppDirect(cleanPhone);
      if (onNotice) {
        onNotice(
          copied
            ? `✓ تم فتح شات ولي الأمر (${cleanPhone}) ونسخ الكارت للحافظة! اضغط لصق لإرسال الكارت 🖼️`
            : "✓ تم فتح شات ولي الأمر وحفظ كارت التهنئة بجهازك!"
        );
      }
    } else if (onNotice) {
      onNotice(
        copied
          ? "✓ تم نسخ كارت التهنئة للحافظة وحفظه بجهازك!"
          : "✓ تم حفظ كارت التهنئة بجهازك!"
      );
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Share birthday card error:", err);
      if (onNotice) onNotice("❌ حدث خطأ أثناء مشاركة الكارت");
    }
  } finally {
    if (onProgress) setTimeout(() => onProgress(false), 800);
  }
}

/**
 * Sends the Birthday Card directly to the player's WhatsApp chat
 * Automatically opens the chat registered in the player profile
 * Copies the card IMAGE to clipboard and downloads it so it is sent as a CARD (image), NOT text!
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

    // 1. Copy card image directly to clipboard
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

    // 2. Auto-save / download card image to device
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

    // 3. Open WhatsApp chat registered in the player's profile WITHOUT text
    // (so the chat opens cleanly and the coach can paste the card image directly!)
    if (cleanPhone) {
      openWhatsAppDirect(cleanPhone);
      if (onNotice) {
        onNotice(
          copied
            ? `✓ تم فتح شات ولي الأمر (${cleanPhone}) ونسخ الكارت للحافظة! اضغط لصق (Paste) لإرسال الكارت كصورة 🖼️`
            : `✓ تم فتح شات ولي الأمر (${cleanPhone}) وحفظ الكارت بجهازك لإرساله فوراً 🖼️`
        );
      }
    } else {
      // If no phone number is registered in profile, offer native share
      const file = new File([blob], fileName, { type: "image/png" });
      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `كارت عيد ميلاد ${player.name}`,
        });
      } else {
        openWhatsAppDirect("");
      }
      if (onNotice) {
        onNotice("⚠️ لا يوجد هاتف مسجل ببروفايل اللاعب! تم نسخ الكارت وحفظه بجهازك 🖼️");
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Birthday card error:", err);
      if (onNotice) onNotice("❌ حدث خطأ أثناء تجهيز كارت عيد الميلاد");
    }
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
