import {
  formatWhatsAppPhone,
  calculateAge,
  openWhatsAppDirect,
  markWelcomeCardHandled,
  isNewPlayer,
  isWelcomeCardVisible,
} from "./dashboard-utils";
import { copyBlobToClipboard } from "./birthday-card-utils";

export {
  formatWhatsAppPhone,
  copyBlobToClipboard,
  openWhatsAppDirect,
  markWelcomeCardHandled,
  isNewPlayer,
  isWelcomeCardVisible,
};

/**
 * Generates an ultra-luxurious, official Karate Welcome Card Canvas
 * Featuring a large, prominent athlete photo portrait (290px diameter),
 * punchy and concise celebratory wording, and official Re_action PRO sports franchise branding.
 * Dimensions: 1080 x 1920 (Standard 9:16 portrait)
 */
export async function generateWelcomeCardCanvas(
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
      // Continue even if fonts take longer
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const currentAge = calculateAge(player.dateOfBirth) ?? player.age ?? 0;
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

  // Helper text drawing functions
  const drawRight = (text, x, y, font, color) => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "right";
    context.direction = "rtl";
    context.fillText(text, x, y);
  };

  const drawLeft = (text, x, y, font, color) => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "left";
    context.direction = "rtl";
    context.fillText(text, x, y);
  };

  const drawCenter = (text, x, y, font, color) => {
    context.font = font;
    context.fillStyle = color;
    context.textAlign = "center";
    context.direction = "rtl";
    context.fillText(text, x, y);
  };

  // 1. Outer Frame: Deep Obsidian Slate (#090d16)
  context.fillStyle = "#090d16";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Main Card Surface (Pure White with 44px rounded corners)
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, canvas.height - 72, 44);
  context.fill();

  // 3. Top Header Banner (Imperial Crimson & Ruby Red gradient)
  const gradHeader = context.createLinearGradient(0, 36, canvas.width, 210);
  gradHeader.addColorStop(0, "#dc2626");
  gradHeader.addColorStop(0.5, "#b91c1c");
  gradHeader.addColorStop(1, "#881337");
  context.fillStyle = gradHeader;
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, 174, [44, 44, 0, 0]);
  context.fill();

  // Gold decorative trim line under header
  context.fillStyle = "#f59e0b";
  context.fillRect(36, 210, canvas.width - 72, 4);

  // Embellishment badge on the left (Dynamic Academy Brand)
  const badgeText = academyName || "Re_action DOJO";
  context.font = "900 20px Cairo, sans-serif";
  const badgeTextWidth = context.measureText(badgeText).width;
  const badgeWidth = Math.max(160, Math.min(320, badgeTextWidth + 36));
  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  context.beginPath();
  context.roundRect(72, 60, badgeWidth, 50, 16);
  context.fill();
  drawCenter(badgeText, 72 + badgeWidth / 2, 92, "900 20px Cairo, sans-serif", "#ffffff");

  // Header Title & Captain subtitle
  drawRight(
    "بطاقة ترحيب بالبطل 🥋",
    canvas.width - 80,
    98,
    "900 42px Cairo, sans-serif",
    "#ffffff"
  );
  drawRight(
    `إشراف وتدريب الكابتن: ${captainName}`,
    canvas.width - 80,
    154,
    "700 24px Cairo, sans-serif",
    "#fecaca"
  );

  // 4. Hero Athlete Showcase (Huge Center Stage - occupying half the card!)
  const heroBoxY = 230;
  const heroBoxHeight = 880;
  const heroGrad = context.createLinearGradient(72, heroBoxY, 72, heroBoxY + heroBoxHeight);
  heroGrad.addColorStop(0, "#ffffff");
  heroGrad.addColorStop(1, "#f8fafc");
  context.fillStyle = heroGrad;
  context.beginPath();
  context.roundRect(72, heroBoxY, canvas.width - 144, heroBoxHeight, 36);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2.5;
  context.stroke();

  // 5. Massive Centered Athlete Portrait (Radius: 300px, Diameter: 600px! Takes ~half the card!)
  const photoCenterX = 540;
  const photoCenterY = 570;
  const photoRadius = 300;

  // Set high quality image smoothing
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  let photoDrawn = false;
  if (player.photo) {
    const photo = await new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 3000);
      image.src = player.photo;
    });

    if (photo && (photo.naturalWidth || photo.width) && (photo.naturalHeight || photo.height)) {
      const pw = photo.naturalWidth || photo.width;
      const ph = photo.naturalHeight || photo.height;

      // Soft outer ambient glow ring
      context.beginPath();
      context.arc(photoCenterX, photoCenterY, photoRadius + 14, 0, Math.PI * 2);
      context.strokeStyle = "rgba(220, 38, 38, 0.22)";
      context.lineWidth = 14;
      context.stroke();

      // Gold decorative champion ring
      context.beginPath();
      context.arc(photoCenterX, photoCenterY, photoRadius + 5, 0, Math.PI * 2);
      context.strokeStyle = "#f59e0b";
      context.lineWidth = 5;
      context.stroke();

      // Center-crop (object-fit: cover) to preserve aspect ratio with zero stretching
      const minDim = Math.min(pw, ph);
      const sx = (pw - minDim) / 2;
      const sy = (ph - minDim) / 2;

      context.save();
      context.beginPath();
      context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        photo,
        sx,
        sy,
        minDim,
        minDim,
        photoCenterX - photoRadius,
        photoCenterY - photoRadius,
        photoRadius * 2,
        photoRadius * 2
      );
      context.restore();

      // Bold Crimson border ring
      context.beginPath();
      context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      context.strokeStyle = "#dc2626";
      context.lineWidth = 8;
      context.stroke();
      photoDrawn = true;
    }
  }

  if (!photoDrawn) {
    // Soft outer ambient glow ring
    context.beginPath();
    context.arc(photoCenterX, photoCenterY, photoRadius + 14, 0, Math.PI * 2);
    context.strokeStyle = "rgba(220, 38, 38, 0.22)";
    context.lineWidth = 14;
    context.stroke();

    context.beginPath();
    context.arc(photoCenterX, photoCenterY, photoRadius + 5, 0, Math.PI * 2);
    context.strokeStyle = "#f59e0b";
    context.lineWidth = 5;
    context.stroke();

    const avatarGrad = context.createRadialGradient(
      photoCenterX - 70,
      photoCenterY - 70,
      35,
      photoCenterX,
      photoCenterY,
      photoRadius
    );
    avatarGrad.addColorStop(0, "#f87171");
    avatarGrad.addColorStop(0.4, "#dc2626");
    avatarGrad.addColorStop(1, "#881337");
    context.fillStyle = avatarGrad;
    context.beginPath();
    context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
    context.strokeStyle = "#dc2626";
    context.lineWidth = 8;
    context.stroke();

    drawCenter(
      player.name ? player.name.charAt(0) : "ك",
      photoCenterX,
      photoCenterY + 80,
      "900 240px Cairo, sans-serif",
      "#ffffff"
    );
  }

  // Floating Belt Badge overlapping bottom edge of the photo
  const beltPillY = 845;
  const beltPillW = 340;
  const beltPillH = 54;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(photoCenterX - beltPillW / 2, beltPillY, beltPillW, beltPillH, 27);
  context.fill();
  context.strokeStyle = "#dc2626";
  context.lineWidth = 3;
  context.stroke();
  drawCenter(
    `🥋 حزام ${player.belt || "أبيض"}  •  مستوى ${player.level || "A"}`,
    photoCenterX,
    beltPillY + 37,
    "900 24px Cairo, sans-serif",
    "#991b1b"
  );

  // Athlete Name (Large, prominent & centered)
  drawCenter(
    `البطل / ${player.name}`,
    photoCenterX,
    950,
    "900 52px Cairo, sans-serif",
    "#0f172a"
  );

  // Athlete Info Chips Row (Centered and crisp)
  const chipsY = 1005;
  const chipH = 48;
  const chip1Text = `🏢 ${player.branch || "الفرع الرئيسي"}`;
  const chip2Text = `🎂 ${currentAge} سنة`;
  const chip3Text = `📅 انضمام: ${joinDate}`;

  const badges = [
    { text: chip1Text, bg: "#f1f5f9", stroke: "#cbd5e1", color: "#1e293b", w: 230, x: 775 },
    { text: chip2Text, bg: "#fef2f2", stroke: "#fecaca", color: "#991b1b", w: 180, x: 540 },
    { text: chip3Text, bg: "#ecfdf5", stroke: "#a7f3d0", color: "#065f46", w: 260, x: 275 },
  ];

  for (const b of badges) {
    context.fillStyle = b.bg;
    context.beginPath();
    context.roundRect(b.x - b.w / 2, chipsY, b.w, chipH, 14);
    context.fill();
    context.strokeStyle = b.stroke;
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter(b.text, b.x, chipsY + 32, "800 21px Cairo, sans-serif", b.color);
  }

  // 6. Celebratory Welcome Card
  const welcomeBoxY = 1135;
  const welcomeGrad = context.createLinearGradient(72, welcomeBoxY, canvas.width - 72, welcomeBoxY + 175);
  welcomeGrad.addColorStop(0, "#f0fdf4");
  welcomeGrad.addColorStop(1, "#ecfdf5");
  context.fillStyle = welcomeGrad;
  context.beginPath();
  context.roundRect(72, welcomeBoxY, canvas.width - 144, 175, 26);
  context.fill();
  context.strokeStyle = "#86efac";
  context.lineWidth = 2.5;
  context.stroke();

  drawCenter("🌟 أهلاً وسهلاً بك في أسرة وعائلة الأكاديمية 🥋", photoCenterX, welcomeBoxY + 48, "900 32px Cairo, sans-serif", "#065f46");
  drawCenter("يسعدنا انضمام بطلنا الواعد لمسيرة التدريب وصناعة الأبطال الرياضية", photoCenterX, welcomeBoxY + 100, "800 24px Cairo, sans-serif", "#047857");
  drawCenter("خطوتك الأولى نحو القوة، الانضباط، ومنصات التتويج العالمية 🏆🥇", photoCenterX, welcomeBoxY + 145, "800 22px Cairo, sans-serif", "#065f46");

  // 7. Core Training Pillars (2 High-Impact Streamlined Cards)
  const pillarList = [
    {
      title: "🥋 تدريب كاراتيه احترافي معتمد (كاتا وكوميتيه)",
      sub: "تأسيس فني وبدني متقدم وفق أعلى معايير الاتحاد الدولي",
      badge: "معتمد دولياً ✓",
      bg: "#f8fafc",
      border: "#e2e8f0",
      badgeBg: "#f0fdf4",
      badgeBorder: "#86efac",
      badgeColor: "#047857",
      titleColor: "#0f172a",
    },
    {
      title: "🥇 تدرج الأحزمة الرسمية وبناء الشخصية والانضباط",
      sub: "تنمية الثقة بالنفس، التركيز الذهني، والتأهيل للبطولات",
      badge: "طريق البطولة ✓",
      bg: "#fffbeb",
      border: "#fde68a",
      badgeBg: "#fef3c7",
      badgeBorder: "#fcd34d",
      badgeColor: "#92400e",
      titleColor: "#92400e",
    },
  ];

  let pY = 1330;
  for (const item of pillarList) {
    context.fillStyle = item.bg;
    context.beginPath();
    context.roundRect(72, pY, canvas.width - 144, 96, 20);
    context.fill();
    context.strokeStyle = item.border;
    context.lineWidth = 2;
    context.stroke();

    drawRight(item.title, canvas.width - 100, pY + 40, "900 24px Cairo, sans-serif", item.titleColor);
    drawRight(item.sub, canvas.width - 100, pY + 74, "600 19px Cairo, sans-serif", "#64748b");

    context.fillStyle = item.badgeBg;
    context.beginPath();
    context.roundRect(96, pY + 26, 170, 44, 12);
    context.fill();
    context.strokeStyle = item.badgeBorder;
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter(item.badge, 96 + 85, pY + 55, "900 20px Cairo, sans-serif", item.badgeColor);

    pY += 114;
  }

  // 8. Captain Signature Banner
  const capBoxY = 1580;
  context.fillStyle = "#f8fafc";
  context.beginPath();
  context.roundRect(72, capBoxY, canvas.width - 144, 120, 24);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2;
  context.stroke();

  drawCenter(
    "مع أطيب تمنياتنا لك بمسيرة رياضية حافلة بالبطولات والإنجازات 🏆",
    photoCenterX,
    capBoxY + 48,
    "800 24px Cairo, sans-serif",
    "#0f172a"
  );
  drawCenter(
    `الكابتن / ${captainName}  •  ${academyName || "أكاديمية الكاراتيه"} ❤️`,
    photoCenterX,
    capBoxY + 92,
    "900 24px Cairo, sans-serif",
    "#dc2626"
  );

  // 9. Official Card Footer
  context.fillStyle = "#e2e8f0";
  context.fillRect(72, 1725, canvas.width - 144, 2);

  drawRight(
    `تم استخراج بطاقة الترحيب رسميًا من ${academyName || "الأكاديمية"}  •  ${new Date().toLocaleDateString("ar-EG")}`,
    canvas.width - 80,
    1775,
    "600 22px Cairo, sans-serif",
    "#94a3b8"
  );

  drawLeft(
    `${academyName || "أكاديمية الكاراتيه والرياضات القتالية"} 🥋`,
    80,
    1775,
    "800 22px Cairo, sans-serif",
    "#b91c1c"
  );

  return canvas;
}
