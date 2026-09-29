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
export function openWhatsAppDirect(cleanPhone, text = "", preOpenedWindow = null) {
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
            window.location.href = fallbackUrl;
          }
        }, 1200);
      } catch (_) {
        window.location.href = appUrl;
      }
    } else {
      // Desktop: Open WhatsApp Web directly into the contact chat
      const webUrl = `https://web.whatsapp.com/send?phone=${cleanPhone}${encodedText}`;

      if (preOpenedWindow && !preOpenedWindow.closed) {
        try {
          preOpenedWindow.location.href = webUrl;
          preOpenedWindow.focus();
          return;
        } catch (_) { }
      }

      let win = null;
      try {
        win = window.open(webUrl, "_blank", "noopener,noreferrer");
      } catch (_) { }

      if (!win || win.closed || typeof win.closed === "undefined") {
        try {
          const a = document.createElement("a");
          a.href = webUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          document.body.appendChild(a);
          a.click();
          setTimeout(() => {
            if (a.parentNode) document.body.removeChild(a);
          }, 300);
        } catch (_) {
          window.location.href = webUrl;
        }
      }
    }
  } else {
    if (isMobile) {
      window.location.href = text ? `whatsapp://send?${paramOnly}` : `whatsapp://send`;
    } else {
      const webUrl = "https://web.whatsapp.com";
      if (preOpenedWindow && !preOpenedWindow.closed) {
        try {
          preOpenedWindow.location.href = webUrl;
          preOpenedWindow.focus();
          return;
        } catch (_) { }
      }
      let win = null;
      try {
        win = window.open(webUrl, "_blank", "noopener,noreferrer");
      } catch (_) { }
      if (!win || win.closed || typeof win.closed === "undefined") {
        window.location.href = webUrl;
      }
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
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الكاراتيه"
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
  const dynamicAge = calculateAge(player.dateOfBirth) ?? player.age ?? 0;
  const turningAge = bday?.isToday ? dynamicAge : (bday?.turningAge ?? dynamicAge ?? 10);
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
  const topGlow = ctx.createRadialGradient(540, 140, 30, 540, 140, 480);
  topGlow.addColorStop(0, "rgba(251, 191, 36, 0.22)");
  topGlow.addColorStop(0.5, "rgba(244, 63, 94, 0.1)");
  topGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, 1080, 550);

  const heroPhotoGlow = ctx.createRadialGradient(540, 450, 80, 540, 450, 420);
  heroPhotoGlow.addColorStop(0, "rgba(245, 158, 11, 0.32)");
  heroPhotoGlow.addColorStop(0.5, "rgba(225, 29, 72, 0.14)");
  heroPhotoGlow.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = heroPhotoGlow;
  ctx.fillRect(40, 140, 1000, 630);

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
    { x: 110, y: 115, r: 22, color: "#d97706", char: "★" },
    { x: 970, y: 120, r: 22, color: "#dc2626", char: "★" },
    { x: 130, y: 260, r: 24, color: "#0284c7", char: "✦" },
    { x: 950, y: 270, r: 24, color: "#d97706", char: "✦" },
    { x: 200, y: 165, r: 18, color: "#db2777", char: "✧" },
    { x: 880, y: 175, r: 18, color: "#059669", char: "✧" },
    { x: 85, y: 490, r: 22, color: "#d97706", char: "★" },
    { x: 995, y: 500, r: 22, color: "#e11d48", char: "★" },
    { x: 120, y: 700, r: 22, color: "#0284c7", char: "✦" },
    { x: 960, y: 710, r: 22, color: "#d97706", char: "✦" },
    { x: 120, y: 1240, r: 18, color: "#059669", char: "★" },
    { x: 960, y: 1245, r: 18, color: "#d97706", char: "★" },
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
    { x: 180, y: 115, r: 6, color: "#d97706" },
    { x: 900, y: 125, r: 7, color: "#dc2626" },
    { x: 250, y: 320, r: 5, color: "#0284c7" },
    { x: 830, y: 330, r: 6, color: "#db2777" },
    { x: 100, y: 610, r: 6, color: "#059669" },
    { x: 980, y: 620, r: 6, color: "#d97706" },
    { x: 180, y: 835, r: 6, color: "#dc2626" },
    { x: 900, y: 845, r: 6, color: "#0284c7" },
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
  const academyBadge = `🥋 ${academyName || "أكاديمية الكاراتيه"} 🥋`;
  ctx.font = "800 19px Cairo, sans-serif";
  const badgeWidth = Math.max(340, Math.min(520, ctx.measureText(academyBadge).width + 48));
  drawBadge(
    academyBadge,
    540,
    74,
    badgeWidth,
    38,
    "#ffffff",
    "#991b1b",
    "#f59e0b",
    "800 19px Cairo, sans-serif",
    { color: "rgba(217, 119, 6, 0.2)", blur: 10, y: 3 }
  );

  // 6. Main Celebration Title (Rich Ruby Red & Royal Gold)
  drawCenter(
    "🎉 عـيـد مـيـلاد سـعـيـد 🎉",
    540,
    132,
    "900 44px Cairo, sans-serif",
    "#be123c",
    { color: "rgba(190, 18, 60, 0.25)", blur: 12, y: 3 }
  );

  drawCenter(
    "★ HAPPY BIRTHDAY CHAMPION ★",
    540,
    166,
    "800 16px Cairo, sans-serif",
    "#b45309",
    { color: "rgba(180, 83, 9, 0.2)", blur: 6, y: 2 }
  );

  // 7. HERO PLAYER PHOTO (Massive: Radius 265px, Diameter 530px - Takes ~half the card with ultra-high quality!)
  const avatarX = 540;
  const avatarY = 450;
  const avatarRadius = 265;

  // Birthday Balloons flanking the large photo
  const drawBalloon = (bx, by, color, angle = 0) => {
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate((angle * Math.PI) / 180);

    // Balloon body
    ctx.beginPath();
    ctx.ellipse(0, 0, 30, 40, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fill();

    // Balloon highlight sheen
    ctx.beginPath();
    ctx.ellipse(-9, -11, 8, 14, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.fill();

    // Balloon knot
    ctx.beginPath();
    ctx.moveTo(-5, 40);
    ctx.lineTo(5, 40);
    ctx.lineTo(0, 46);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Balloon curly string
    ctx.beginPath();
    ctx.moveTo(0, 46);
    ctx.bezierCurveTo(10, 68, -10, 92, 5, 115);
    ctx.strokeStyle = "rgba(100, 116, 139, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  // Left balloons
  drawBalloon(avatarX - avatarRadius - 55, avatarY - 30, "#dc2626", -12);
  drawBalloon(avatarX - avatarRadius - 95, avatarY + 45, "#f59e0b", -22);

  // Right balloons
  drawBalloon(avatarX + avatarRadius + 55, avatarY - 30, "#0284c7", 12);
  drawBalloon(avatarX + avatarRadius + 95, avatarY + 45, "#db2777", 22);

  // Floating Birthday Candles above the Hero Photo
  const candleY = avatarY - avatarRadius - 14;
  const drawCandle = (cx, cy) => {
    ctx.save();
    // Candle body
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.roundRect(cx - 5, cy, 10, 22, 3);
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
    ctx.ellipse(cx, cy - 10, 4.5, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef08a";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 8, 2.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawCandle(avatarX - 44, candleY);
  drawCandle(avatarX + 44, candleY);

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

  // Soft Ambient Glow
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 14, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(245, 158, 11, 0.3)";
  ctx.lineWidth = 14;
  ctx.stroke();

  // Outer Glowing Ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = avatarRing;
  ctx.lineWidth = 7;
  ctx.shadowColor = "rgba(245, 158, 11, 0.5)";
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Inner White Divider Ring
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 1, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.stroke();
  ctx.restore();

  // High quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // Draw Player Photo (Cover & Center-Cropped to preserve native high resolution)
  let photoLoaded = false;
  if (player.photo) {
    try {
      const img = await new Promise((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 3000);
        image.src = player.photo;
      });

      if (img && (img.naturalWidth || img.width) && (img.naturalHeight || img.height)) {
        const pw = img.naturalWidth || img.width;
        const ph = img.naturalHeight || img.height;
        const minDim = Math.min(pw, ph);
        const sx = (pw - minDim) / 2;
        const sy = (ph - minDim) / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(
          img,
          sx,
          sy,
          minDim,
          minDim,
          avatarX - avatarRadius,
          avatarY - avatarRadius,
          avatarRadius * 2,
          avatarRadius * 2
        );
        ctx.restore();
        photoLoaded = true;
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
    ctx.font = "900 180px Cairo, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.shadowColor = "rgba(0,0,0,0.3)";
    ctx.shadowBlur = 12;
    ctx.fillText((player.name || "ب").charAt(0), avatarX, avatarY + 12);
    ctx.restore();
  }

  // Floating Crown / Champion Badge at top of avatar
  drawBadge(
    "👑",
    avatarX,
    avatarY - avatarRadius + 4,
    50,
    50,
    "#fbbf24",
    "#78350f",
    "#ffffff",
    "26px sans-serif",
    { color: "rgba(217, 119, 6, 0.3)", blur: 8, y: 2 }
  );

  // Floating Belt Badge overlapping bottom edge of the photo
  const beltPillY = avatarY + avatarRadius - 10;
  drawBadge(
    `🥋 ${player.belt || "حزام أبيض"}  •  مستوى ${player.level || "A"}`,
    avatarX,
    beltPillY,
    340,
    46,
    "#ffffff",
    "#991b1b",
    "#e11d48",
    "800 20px Cairo, sans-serif",
    { color: "rgba(0,0,0,0.12)", blur: 8, y: 3 }
  );

  // 8. Player Name (Ultra-Crisp, High Contrast Midnight Charcoal)
  drawCenter(
    `البطل / ${player.name}`,
    540,
    782,
    "900 46px Cairo, sans-serif",
    "#0f172a",
    { color: "rgba(0,0,0,0.12)", blur: 6, y: 2 }
  );

  // 9. Badges: Age Celebration + Branch
  drawBadge(
    `🎂 كبرت سنة وبقيت ${turningAge} سنين! 🥳🎈`,
    540,
    838,
    480,
    46,
    "#e11d48",
    "#ffffff",
    "#fde047",
    "900 22px Cairo, sans-serif",
    { color: "rgba(225, 29, 72, 0.3)", blur: 10, y: 3 }
  );

  // 10. WARM, FRIENDLY CELEBRATION MESSAGE CARD
  ctx.save();
  const boxX = 75;
  const boxY = 880;
  const boxW = 930;
  const boxH = 370;

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
    boxY + 34,
    360,
    36,
    "#fff1f2",
    "#9f1239",
    "#fca5a5",
    "800 17px Cairo, sans-serif"
  );

  // Warm, young, energetic celebration lines
  const lines = [
    "🎉 النهارده يوم مش عادي، النهارده يوم مميز لبطلنا!",
    `كل سنة وإنت طيب وبألف صحة وهنا يا ${player.name} ❤️`,
    `كبرت سنة وبقيت ${turningAge} سنين كلها شجاعة وطاقة وبطولة! 🎂🥋`,
    "فخورين بيك وبكل خطوة وتمرين وتطور كبير بتعمله في الكاراتيه 🥊✨",
    "نتمنالك سنة جديدة مليانة نجاح، فرحة، ميداليات دهب وأهداف كتير! 🏆🥇🔥",
    `من أسرة ${academyName || "الأكاديمية"} والكابتن / ${captainName} ❤️`,
  ];

  let textY = boxY + 92;
  lines.forEach((line, index) => {
    let font = "700 22px Cairo, sans-serif";
    let color = "#1e293b";

    if (index === 0) {
      color = "#0f172a";
      font = "700 22px Cairo, sans-serif";
    } else if (index === 1) {
      color = "#be123c"; // Hero Ruby
      font = "900 25px Cairo, sans-serif";
    } else if (index === 2) {
      color = "#b45309"; // Warm Gold
      font = "900 24px Cairo, sans-serif";
    } else if (index === 3) {
      color = "#1e293b";
      font = "700 22px Cairo, sans-serif";
    } else if (index === 4) {
      color = "#047857"; // Emerald Winner Green
      font = "800 22px Cairo, sans-serif";
    } else if (index === 5) {
      color = "#9f1239";
      font = "800 21px Cairo, sans-serif";
    }

    drawCenter(line, 540, textY, font, color, {
      color: "rgba(0,0,0,0.06)",
      blur: 4,
      y: 1,
    });
    textY += 44;
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
    `كارت تهنئة رسمي من ${academyName || "الأكاديمية"}  •  ${new Date().getFullYear()}`,
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
  const { onProgress, onNotice, academyName = "أكاديمية الكاراتيه" } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري تجهيز كارت عيد الميلاد للمشاركة...");

  try {
    const canvas = await generateBirthdayCardCanvas(player, captainName, academyName);
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
      } catch (_) { }
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

export async function copyBlobToClipboard(blob) {
  if (!blob) return false;
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
    return false;
  }
  try {
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch (err) {
    console.warn("Clipboard write failed:", err);
    return false;
  }
}

/**
 * Sends the Birthday Card directly to the player's WhatsApp chat
 * Automatically opens the chat registered in the player profile
 * Copies the card IMAGE to clipboard, reusing existingBlob if available!
 */
export async function sendBirthdayCardViaWhatsApp(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice, existingBlob, academyName = "أكاديمية الكاراتيه" } = options;

  if (onProgress) onProgress(true);

  try {
    let blob = existingBlob;
    if (!blob) {
      if (onNotice) onNotice("⏳ جاري تجهيز كارت عيد الميلاد...");
      const canvas = await generateBirthdayCardCanvas(player, captainName, academyName);
      if (!canvas) {
        if (onNotice) onNotice("❌ تعذر إنشاء كارت عيد الميلاد");
        return;
      }
      blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    }

    if (!blob) {
      if (onNotice) onNotice("❌ تعذر تجهيز صورة الكارت");
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
    const fileName = `كارت_عيد_ميلاد_${(player?.name || "اللاعب").replace(/\s+/g, "_")}.png`;

    // 1. Mark player's birthday as congratulated immediately
    markBirthdayCongratulated(player._id);

    // 2. Fast copy card image directly to clipboard
    const copied = await copyBlobToClipboard(blob);

    // 3. Fallback auto-save if clipboard is not supported
    if (!copied) {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 2500);
      } catch (_) { }
    }

    // 4. Open WhatsApp directly (to player's chat or general selection)
    openWhatsAppDirect(cleanPhone);

    if (cleanPhone) {
      if (onNotice) {
        onNotice(
          copied
            ? `✓ تم فتح محادثة ولي الأمر (${cleanPhone}) ونسخ الكارت للحافظة! الصق الصورة (Paste) ثم أرسلها 🥋`
            : `✓ تم فتح محادثة ولي الأمر (${cleanPhone}) وحفظ الكارت بجهازك لإرساله فوراً 🥋`
        );
      }
    } else {
      if (onNotice) {
        onNotice(
          copied
            ? "✓ تم نسخ الكارت للحافظة وفتح واتساب! اختر المحادثة المطلوبة ثم الصق الصورة (Paste)"
            : "✓ تم حفظ الكارت بجهازك وفتح واتساب! اختر المحادثة المطلوبة لإرساله"
        );
      }
    }
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Birthday card error:", err);
      if (onNotice) onNotice("❌ حدث خطأ أثناء تجهيز كارت عيد الميلاد");
    }
  } finally {
    if (onProgress) setTimeout(() => onProgress(false), 800);
  }
}

/**
 * Downloads the high-resolution Birthday Card PNG directly, reusing existingBlob if available
 */
export async function downloadBirthdayCard(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice, existingBlob, academyName = "أكاديمية الكاراتيه" } = options;
  if (onProgress) onProgress(true);

  try {
    let blob = existingBlob;
    if (!blob) {
      if (onNotice) onNotice("⏳ جاري إنشاء وتحميل كارت عيد الميلاد...");
      const canvas = await generateBirthdayCardCanvas(player, captainName, academyName);
      if (!canvas) {
        if (onNotice) onNotice("❌ تعذر إنشاء كارت عيد الميلاد");
        return;
      }
      blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    }

    if (!blob) {
      if (onNotice) onNotice("❌ تعذر إنشاء صورة الكارت");
      return;
    }

    const fileName = `كارت_عيد_ميلاد_${(player?.name || "اللاعب").replace(/\s+/g, "_")}.png`;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 2500);
    if (onNotice) onNotice("✓ تم حفظ وتحميل كارت عيد الميلاد بجهازك بنجاح!");
  } catch (err) {
    console.error("Download birthday card error:", err);
    if (onNotice) onNotice("❌ حدث خطأ أثناء تحميل الكارت");
  } finally {
    if (onProgress) setTimeout(() => onProgress(false), 500);
  }
}

