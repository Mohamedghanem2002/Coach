import {
  getBirthdayInfo,
  getBeltStyle,
  formatWhatsAppPhone,
  markBirthdayCongratulated,
} from "./dashboard-utils";

/**
 * Open WhatsApp reliably across desktop and mobile without popup blocking
 */
export function openWhatsAppDirect(cleanPhone, text = "", options = {}) {
  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  const encodedText = text ? `&text=${encodeURIComponent(text)}` : "";
  const paramOnly = text ? `text=${encodeURIComponent(text)}` : "";

  if (isMobile) {
    // Official WhatsApp Universal Link: Direct app handoff on Android / iOS
    const mobileUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}${encodedText}`
      : `https://api.whatsapp.com/send?${paramOnly}`;
    window.location.href = mobileUrl;
  } else {
    // Desktop: WhatsApp Web direct URL
    const webUrl = cleanPhone
      ? `https://web.whatsapp.com/send?phone=${cleanPhone}${encodedText}`
      : `https://web.whatsapp.com/send?${paramOnly}`;

    if (options.targetWindow && !options.targetWindow.closed) {
      options.targetWindow.location.href = webUrl;
      try {
        options.targetWindow.focus();
      } catch (_) {}
    } else {
      // Direct opening without popup blocker delay
      const win = window.open(webUrl, "_blank", "noopener,noreferrer");
      if (!win) {
        window.location.href = webUrl;
      }
    }
  }
}

/**
 * Generates an ultra-luxurious, festive Birthday Greeting Card Canvas
 * Dimensions: 1080 x 1350 (Standard 4:5 portrait)
 */
export async function generateBirthdayCardCanvas(player, captainName = "كابتن الأكاديمية") {
  if (typeof document === "undefined") return null;
  if (document.fonts && document.fonts.status !== "loaded") {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 150)),
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

  const bday = getBirthdayInfo(player) || { turningAge: player.age || 10 };
  const turningAge = bday.turningAge || player.age || 10;
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

  // 1. Deep luxury celebratory gradient background
  const bg = ctx.createLinearGradient(0, 0, 1080, 1350);
  bg.addColorStop(0, "#080c18");
  bg.addColorStop(0.3, "#150d2e");
  bg.addColorStop(0.65, "#2a0845");
  bg.addColorStop(1, "#090514");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Glowing Celebration Radial Highlights
  const topGlow = ctx.createRadialGradient(540, 180, 20, 540, 180, 450);
  topGlow.addColorStop(0, "rgba(251, 191, 36, 0.22)");
  topGlow.addColorStop(0.6, "rgba(244, 63, 94, 0.1)");
  topGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, 1080, 600);

  const centerGlow = ctx.createRadialGradient(540, 410, 40, 540, 410, 320);
  centerGlow.addColorStop(0, "rgba(244, 63, 94, 0.25)");
  centerGlow.addColorStop(0.5, "rgba(245, 158, 11, 0.12)");
  centerGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = centerGlow;
  ctx.fillRect(0, 200, 1080, 500);

  const bottomGlow = ctx.createRadialGradient(540, 950, 40, 540, 950, 400);
  bottomGlow.addColorStop(0, "rgba(245, 158, 11, 0.12)");
  bottomGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = bottomGlow;
  ctx.fillRect(0, 700, 1080, 650);

  // 3. Festive Confetti & Sparkles
  const sparkles = [
    { x: 120, y: 140, r: 18, color: "#fbbf24", char: "★" },
    { x: 960, y: 150, r: 20, color: "#f43f5e", char: "★" },
    { x: 160, y: 340, r: 22, color: "#38bdf8", char: "✦" },
    { x: 920, y: 350, r: 24, color: "#fbbf24", char: "✦" },
    { x: 220, y: 220, r: 14, color: "#f472b6", char: "✧" },
    { x: 860, y: 230, r: 16, color: "#34d399", char: "✧" },
    { x: 100, y: 550, r: 18, color: "#fbbf24", char: "★" },
    { x: 980, y: 560, r: 18, color: "#a855f7", char: "★" },
    { x: 140, y: 780, r: 16, color: "#f43f5e", char: "✦" },
    { x: 940, y: 790, r: 16, color: "#38bdf8", char: "✦" },
    { x: 110, y: 1100, r: 15, color: "#34d399", char: "★" },
    { x: 970, y: 1110, r: 15, color: "#fbbf24", char: "★" },
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
    { x: 180, y: 180, r: 6, color: "#fbbf24" },
    { x: 890, y: 180, r: 7, color: "#f43f5e" },
    { x: 250, y: 400, r: 5, color: "#38bdf8" },
    { x: 830, y: 420, r: 6, color: "#a855f7" },
    { x: 130, y: 680, r: 5, color: "#34d399" },
    { x: 950, y: 670, r: 6, color: "#fbbf24" },
    { x: 200, y: 920, r: 7, color: "#f43f5e" },
    { x: 880, y: 930, r: 5, color: "#38bdf8" },
    { x: 160, y: 1220, r: 6, color: "#fbbf24" },
    { x: 920, y: 1210, r: 7, color: "#a855f7" },
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

  // 4. Double Golden Borders with Corner Accents
  ctx.save();
  ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(40, 40, 1000, 1270, 36);
  ctx.stroke();

  ctx.strokeStyle = "rgba(251, 191, 36, 0.2)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(52, 52, 976, 1246, 28);
  ctx.stroke();

  const corners = [
    { x: 62, y: 62 },
    { x: 1018, y: 62 },
    { x: 62, y: 1288 },
    { x: 1018, y: 1288 },
  ];
  corners.forEach((pt) => {
    ctx.fillStyle = "#fbbf24";
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 5. Header: Academy Name & Badge
  drawBadge(
    "🥋 أكاديمية RE_ACTION للكاراتيه 🥋",
    540,
    95,
    380,
    42,
    "rgba(255, 255, 255, 0.08)",
    "#fde68a",
    "rgba(245, 158, 11, 0.5)",
    "800 18px Cairo, sans-serif"
  );

  // 6. Main Celebration Title
  drawCenter(
    "🎉 عـيـد مـيـلاد سـعـيـد 🎉",
    540,
    175,
    "900 52px Cairo, sans-serif",
    "#ffffff",
    { color: "rgba(245, 158, 11, 0.6)", blur: 20, y: 4 }
  );

  drawCenter(
    "★ HAPPY BIRTHDAY CHAMPION ★",
    540,
    222,
    "800 18px Cairo, sans-serif",
    "#fbbf24",
    { color: "rgba(251, 191, 36, 0.4)", blur: 10, y: 2 }
  );

  // 7. Player Avatar (Center = 540, 395)
  const avatarX = 540;
  const avatarY = 395;
  const avatarRadius = 110;

  ctx.save();
  const avatarRing = ctx.createLinearGradient(
    avatarX - 120,
    avatarY - 120,
    avatarX + 120,
    avatarY + 120
  );
  avatarRing.addColorStop(0, "#fbbf24");
  avatarRing.addColorStop(0.5, "#f43f5e");
  avatarRing.addColorStop(1, "#d97706");

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 9, 0, Math.PI * 2);
  ctx.strokeStyle = avatarRing;
  ctx.lineWidth = 6;
  ctx.shadowColor = "rgba(244, 63, 94, 0.6)";
  ctx.shadowBlur = 20;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Draw Photo or Champion Default
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
        setTimeout(resolve, 250);
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
      avatarX - 100,
      avatarY - 100,
      avatarX + 100,
      avatarY + 100
    );
    gradDef.addColorStop(0, "#f43f5e");
    gradDef.addColorStop(1, "#f59e0b");
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradDef;
    ctx.fill();

    ctx.font = "900 80px Cairo, sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.direction = "rtl";
    ctx.fillText((player.name || "ب").charAt(0), avatarX, avatarY);
    ctx.restore();
  }

  // Floating celebration badge on avatar (Crown / Party)
  drawBadge(
    "👑",
    avatarX,
    avatarY - avatarRadius - 8,
    48,
    48,
    "#fbbf24",
    "#78350f",
    "#ffffff",
    "24px sans-serif"
  );

  // 8. Player Name
  drawCenter(
    player.name,
    540,
    550,
    "900 42px Cairo, sans-serif",
    "#ffffff",
    { color: "rgba(0,0,0,0.8)", blur: 14, y: 3 }
  );

  // 9. Badges: Age Celebration + Belt + Level + Branch
  drawBadge(
    `🎂 يُتم اليوم ${turningAge} سنوات من التألق 🥳`,
    540,
    608,
    440,
    46,
    "rgba(225, 29, 72, 0.95)",
    "#ffffff",
    "rgba(255, 255, 255, 0.35)",
    "900 21px Cairo, sans-serif"
  );

  const beltColorHex = beltStyle.hex || "#f8fafc";
  const beltTextColor =
    beltStyle.hex === "#0f172a" || beltStyle.hex === "#881337"
      ? "#ffffff"
      : "#1e293b";

  drawBadge(
    `🥋 ${player.belt || "حزام أبيض"}`,
    340,
    672,
    200,
    40,
    beltColorHex,
    beltTextColor,
    "rgba(255, 255, 255, 0.4)",
    "800 18px Cairo, sans-serif"
  );

  drawBadge(
    `⭐ مستوى ${player.level || "A"}`,
    540,
    672,
    140,
    40,
    "rgba(245, 158, 11, 0.9)",
    "#ffffff",
    "rgba(255, 255, 255, 0.4)",
    "800 18px Cairo, sans-serif"
  );

  drawBadge(
    `🏢 ${player.branch || "الفرع الرئيسي"}`,
    720,
    672,
    180,
    40,
    "rgba(15, 23, 42, 0.8)",
    "#e2e8f0",
    "rgba(255, 255, 255, 0.2)",
    "700 17px Cairo, sans-serif"
  );

  // 10. Congratulatory Message Box
  ctx.save();
  const boxX = 80;
  const boxY = 725;
  const boxW = 920;
  const boxH = 415;

  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 26);
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  ctx.fill();
  ctx.strokeStyle = "rgba(251, 191, 36, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawBadge(
    "💌 تهنئة خاصة من أسرة الأكاديمية",
    540,
    boxY + 36,
    340,
    38,
    "rgba(245, 158, 11, 0.2)",
    "#fef08a",
    "rgba(245, 158, 11, 0.4)",
    "800 17px Cairo, sans-serif"
  );

  const lines = [
    `تتقدم إدارة أكاديمية Re_action والكابتن / ${captainName}`,
    `بأسمى آيات التهاني والتبريكات لبطلنا الغالي المتميز`,
    `بمناسبة حلول عيد ميلاده المبارك السعيد 🎉🎂`,
    `متمنين له عاماً جديداً زاخراً بالصحة والبطولات والتفوق،`,
    `ودوام التميز والتألق في الكاراتيه والحياة 🏆🥋✨`,
    `كل عام وأنت بطلنا وفخرنا يا ${player.name}!`,
  ];

  lines.forEach((line, idx) => {
    const isHighlight = idx === 1 || idx === 5;
    const font = isHighlight
      ? "900 24px Cairo, sans-serif"
      : "700 22px Cairo, sans-serif";
    const color = isHighlight ? "#fde047" : idx === 2 ? "#fda4af" : "#f1f5f9";
    drawCenter(line, 540, boxY + 95 + idx * 52, font, color);
  });
  ctx.restore();

  // 11. Footer Section
  ctx.save();
  const divGrad = ctx.createLinearGradient(120, 1180, 960, 1180);
  divGrad.addColorStop(0, "rgba(251, 191, 36, 0)");
  divGrad.addColorStop(0.5, "rgba(251, 191, 36, 0.7)");
  divGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 1180);
  ctx.lineTo(960, 1180);
  ctx.stroke();

  drawCenter(
    "🏆 أكاديمية Re_action للكاراتيه • RE_ACTION DOJO 🥋",
    540,
    1226,
    "800 22px Cairo, sans-serif",
    "#fbbf24"
  );

  drawCenter(
    "صانعو الأبطال وقادة المستقبل • Champions Factory",
    540,
    1266,
    "600 16px Cairo, sans-serif",
    "#94a3b8"
  );
  ctx.restore();

  return canvas;
}

/**
 * Sends or Shares the Birthday Card via WhatsApp
 */
export async function sendBirthdayCardViaWhatsApp(
  player,
  captainName = "كابتن الأكاديمية",
  options = {}
) {
  const { onProgress, onNotice } = options;

  if (onProgress) onProgress(true);
  if (onNotice) onNotice("⏳ جاري تجهيز كارت عيد الميلاد المتميز...");

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // Pre-open reference window synchronously during user click gesture on desktop to prevent popup blocking
  let targetWindow = null;
  if (!isMobile && typeof window !== "undefined") {
    try {
      targetWindow = window.open("about:blank", "_blank");
      if (targetWindow) {
        targetWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head>
              <meta charset="utf-8">
              <title>جاري فتح محادثة واتساب...</title>
              <style>
                body { margin:0; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0b141a; color:#e9edef; font-family:system-ui,sans-serif; text-align:center; padding:16px; }
                .spinner { width:44px; height:44px; border:4px solid #2a3942; border-top-color:#25d366; border-radius:50%; animation:spin .7s linear infinite; margin-bottom:16px; }
                @keyframes spin { to { transform:rotate(360deg); } }
                h3 { margin:0 0 6px; font-size:18px; color:#ffffff; }
                p { margin:0; font-size:13px; color:#8696a0; }
              </style>
            </head>
            <body>
              <div class="spinner"></div>
              <h3>جاري فتح محادثة واتساب...</h3>
              <p>يتم تجهيز كارت التهنئة ونسخه للحافظة تلقائياً</p>
            </body>
          </html>
        `);
      }
    } catch (_) {}
  }

  try {
    const canvas = await generateBirthdayCardCanvas(player, captainName);
    if (!canvas) {
      if (targetWindow && !targetWindow.closed) targetWindow.close();
      if (onNotice) onNotice("❌ تعذر إنشاء كارت عيد الميلاد");
      if (onProgress) onProgress(false);
      return;
    }

    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    if (!blob) {
      if (targetWindow && !targetWindow.closed) targetWindow.close();
      if (onNotice) onNotice("❌ تعذر إنشاء صورة الكارت");
      if (onProgress) onProgress(false);
      return;
    }

    const bday = getBirthdayInfo(player);
    const turningAge = bday?.turningAge || player.age || 10;
    const phone =
      player.guardianPhone ||
      player.parentPhone ||
      player.guardianMobile ||
      player.mobile ||
      player.phone ||
      "";
    const cleanPhone = phone ? formatWhatsAppPhone(phone) : "";

    const fileName = `كارت_عيد_ميلاد_${player.name.replace(/\s+/g, "_")}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    // Mark player's birthday as congratulated so it is updated immediately
    markBirthdayCongratulated(player._id);

    const wishText = `🎉 كل عام وبطلنا الغالي *${player.name}* بألف خير وسعادة! بمناسبة عيد ميلاده المبارك وإتمامه ${turningAge} سنوات، تتمنى له أسرة الأكاديمية والكابتن *${captainName}* دوام التوفيق والبطولة! 🎂🏆🎈`;

    // 1. Native Web Share API on mobile devices attaches image file directly
    if (
      isMobile &&
      typeof navigator !== "undefined" &&
      navigator.canShare &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title: `كارت عيد ميلاد ${player.name}`,
          text: wishText,
        });
        if (onNotice)
          onNotice("✓ تم فتح المشاركة وجاهز لإرسال كارت التهنئة في واتساب!");
        return;
      } catch (shareErr) {
        if (shareErr.name === "AbortError") return;
        console.warn("Share fallback:", shareErr);
      }
    }

    // 2. Clipboard copy for desktop & fallback
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

    // 3. Open WhatsApp directly (using targetWindow on desktop to beat popup blockers)
    openWhatsAppDirect(cleanPhone, wishText, { targetWindow });

    if (onNotice) {
      onNotice(
        copied
          ? "✓ تم نسخ كارت التهنئة للحافظة وفتح واتساب! الصق الصورة (Ctrl+V أو لصق) واضغط إرسال."
          : "✓ تم فتح محادثة واتساب لإرسال تهنئة عيد الميلاد!"
      );
    }
  } catch (err) {
    if (targetWindow && !targetWindow.closed) targetWindow.close();
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
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    if (onNotice) onNotice("✓ تم تحميل كارت عيد الميلاد بجهازك بنجاح!");
  } catch (err) {
    console.error("Download birthday card error:", err);
    if (onNotice) onNotice("❌ حدث خطأ أثناء تحميل الكارت");
  } finally {
    if (onProgress) setTimeout(() => onProgress(false), 1500);
  }
}
