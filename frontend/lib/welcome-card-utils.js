import {
  formatWhatsAppPhone,
  calculateAge,
  openWhatsAppDirect,
} from "./dashboard-utils";
import { copyBlobToClipboard } from "./birthday-card-utils";

export { formatWhatsAppPhone, copyBlobToClipboard, openWhatsAppDirect };

/**
 * Generates an ultra-luxurious, official Karate Welcome Card Canvas
 * Featuring a large, prominent athlete photo portrait (290px diameter),
 * punchy and concise celebratory wording, and official Re_action PRO sports franchise branding.
 * Dimensions: 1080 x 1920 (Standard 9:16 portrait)
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
  const guardianPhone =
    player.guardianPhone ||
    player.parentPhone ||
    player.guardianMobile ||
    player.mobile ||
    player.phone ||
    "";
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
  const gradHeader = context.createLinearGradient(0, 36, canvas.width, 230);
  gradHeader.addColorStop(0, "#dc2626");
  gradHeader.addColorStop(0.5, "#b91c1c");
  gradHeader.addColorStop(1, "#881337");
  context.fillStyle = gradHeader;
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, 194, [44, 44, 0, 0]);
  context.fill();

  // Embellishment badge on the left (Re_action PRO)
  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  context.beginPath();
  context.roundRect(72, 68, 164, 52, 16);
  context.fill();
  drawCenter("Re_action PRO", 154, 102, "900 22px Cairo, sans-serif", "#ffffff");

  // Header Title & Captain subtitle
  drawRight(
    "بطاقة ترحيب بالبطل 🥋",
    canvas.width - 80,
    110,
    "900 44px Cairo, sans-serif",
    "#ffffff"
  );
  drawRight(
    `إشراف وتدريب الكابتن: ${captainName}`,
    canvas.width - 80,
    168,
    "700 26px Cairo, sans-serif",
    "#fecaca"
  );

  // 4. Hero Athlete Card (Large, majestic center box)
  const heroBoxY = 265;
  const heroBoxHeight = 625;
  context.fillStyle = "#f8fafc";
  context.beginPath();
  context.roundRect(72, heroBoxY, canvas.width - 144, heroBoxHeight, 32);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2.5;
  context.stroke();

  // 5. Large Centered Athlete Portrait (Radius: 145px, Diameter: 290px!)
  const photoCenterX = 540;
  const photoCenterY = 440;
  const photoRadius = 145;

  let photoDrawn = false;
  if (player.photo) {
    const photo = await new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      setTimeout(() => resolve(null), 300);
      image.src = player.photo;
    });

    if (photo) {
      // Soft outer ambient glow ring
      context.beginPath();
      context.arc(photoCenterX, photoCenterY, photoRadius + 6, 0, Math.PI * 2);
      context.strokeStyle = "rgba(220, 38, 38, 0.2)";
      context.lineWidth = 6;
      context.stroke();

      context.save();
      context.beginPath();
      context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        photo,
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
      context.lineWidth = 7;
      context.stroke();
      photoDrawn = true;
    }
  }

  if (!photoDrawn) {
    const avatarGrad = context.createRadialGradient(
      photoCenterX - 40,
      photoCenterY - 40,
      20,
      photoCenterX,
      photoCenterY,
      photoRadius
    );
    avatarGrad.addColorStop(0, "#ef4444");
    avatarGrad.addColorStop(0.6, "#dc2626");
    avatarGrad.addColorStop(1, "#881337");
    context.fillStyle = avatarGrad;
    context.beginPath();
    context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 6;
    context.stroke();

    drawCenter(
      player.name ? player.name.charAt(0) : "ك",
      photoCenterX,
      photoCenterY + 45,
      "900 120px Cairo, sans-serif",
      "#ffffff"
    );
  }

  // Floating Belt Badge directly under the photo
  const beltPillY = 595;
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(photoCenterX - 130, beltPillY, 260, 48, 24);
  context.fill();
  context.strokeStyle = "#dc2626";
  context.lineWidth = 2.5;
  context.stroke();
  drawCenter(
    `🥋 حزام ${player.belt || "أبيض"}`,
    photoCenterX,
    beltPillY + 33,
    "900 23px Cairo, sans-serif",
    "#991b1b"
  );

  // Athlete Name
  drawCenter(
    `البطل / ${player.name}`,
    photoCenterX,
    692,
    "900 48px Cairo, sans-serif",
    "#0f172a"
  );

  // Athlete Info Chips Row (Centered and crisp)
  const chipsY = 746;
  const chip1Text = `🏢 ${player.branch}`;
  const chip2Text = `🎂 ${currentAge} سنة`;
  const chip3Text = `⭐ مستوى ${player.level || "A"}`;

  // Draw 3 neat badges side-by-side
  const badges = [
    { text: chip1Text, bg: "#f1f5f9", stroke: "#cbd5e1", color: "#1e293b", w: 230, x: 260 },
    { text: chip2Text, bg: "#fef2f2", stroke: "#fecaca", color: "#991b1b", w: 180, x: 495 },
    { text: chip3Text, bg: "#ecfdf5", stroke: "#a7f3d0", color: "#065f46", w: 200, x: 710 },
  ];

  for (const b of badges) {
    context.fillStyle = b.bg;
    context.beginPath();
    context.roundRect(b.x - b.w / 2, chipsY, b.w, 46, 14);
    context.fill();
    context.strokeStyle = b.stroke;
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter(b.text, b.x, chipsY + 31, "800 21px Cairo, sans-serif", b.color);
  }

  // Join Date & Guardian Phone (Bottom row of Hero box)
  const footInfoY = 840;
  if (guardianPhone) {
    drawRight(`📞 ولي الأمر: ${guardianPhone}`, canvas.width - 110, footInfoY, "700 23px Cairo, sans-serif", "#047857");
    drawLeft(`📅 تاريخ الانضمام: ${joinDate}`, 110, footInfoY, "600 22px Cairo, sans-serif", "#64748b");
  } else {
    drawCenter(`📅 تاريخ الانضمام للأكاديمية: ${joinDate}`, photoCenterX, footInfoY, "700 23px Cairo, sans-serif", "#64748b");
  }

  // 6. Concise Welcome Celebration Card
  const welcomeBoxY = 920;
  context.fillStyle = "#f0fdf4";
  context.beginPath();
  context.roundRect(72, welcomeBoxY, canvas.width - 144, 195, 24);
  context.fill();
  context.strokeStyle = "#86efac";
  context.lineWidth = 2.5;
  context.stroke();

  drawCenter("🌟 أهلاً وسهلاً بك في أسرة وعائلة الأكاديمية 🥋", photoCenterX, welcomeBoxY + 54, "900 32px Cairo, sans-serif", "#065f46");
  drawCenter("يسعدنا انضمام بطلنا الواعد لمسيرة التدريب وصناعة الأبطال", photoCenterX, welcomeBoxY + 110, "800 24px Cairo, sans-serif", "#047857");
  drawCenter("خطوتك الأولى نحو القوة، الانضباط، ومنصات التتويج العالمية 🏆🥇", photoCenterX, welcomeBoxY + 158, "800 22px Cairo, sans-serif", "#065f46");

  // 7. Core Training Pillars (3 Punchy, Modern, Short Cards)
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
      title: "⚡ بناء الشخصية القيادية والانضباط وسرعة رد الفعل",
      sub: "تنمية الثقة بالنفس، التركيز الذهني، والروح الرياضية العالية",
      badge: "عزيمة وانضباط ✓",
      bg: "#fffbeb",
      border: "#fde68a",
      badgeBg: "#fef3c7",
      badgeBorder: "#fcd34d",
      badgeColor: "#92400e",
      titleColor: "#92400e",
    },
    {
      title: "🥇 تدرج الأحزمة الرسمية والتأهيل للمنافسة في البطولات",
      sub: "متابعة دورية مستمرة وخطة فردية لتطوير مستوى وأداء البطل",
      badge: "طريق الذهب ✓",
      bg: "#fef2f2",
      border: "#fca5a5",
      badgeBg: "#fee2e2",
      badgeBorder: "#fca5a5",
      badgeColor: "#991b1b",
      titleColor: "#991b1b",
    },
  ];

  let pY = 1145;
  for (const item of pillarList) {
    context.fillStyle = item.bg;
    context.beginPath();
    context.roundRect(72, pY, canvas.width - 144, 96, 20);
    context.fill();
    context.strokeStyle = item.border;
    context.lineWidth = 2;
    context.stroke();

    // Right: Title & Subtitle
    drawRight(item.title, canvas.width - 100, pY + 40, "900 24px Cairo, sans-serif", item.titleColor);
    drawRight(item.sub, canvas.width - 100, pY + 74, "600 19px Cairo, sans-serif", "#64748b");

    // Left: Pill Badge
    context.fillStyle = item.badgeBg;
    context.beginPath();
    context.roundRect(96, pY + 26, 170, 44, 12);
    context.fill();
    context.strokeStyle = item.badgeBorder;
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter(item.badge, 96 + 85, pY + 55, "900 20px Cairo, sans-serif", item.badgeColor);

    pY += 120;
  }

  // 8. Captain Signature Banner
  const capBoxY = 1535;
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
    capBoxY + 50,
    "800 24px Cairo, sans-serif",
    "#0f172a"
  );
  drawCenter(
    `الكابتن / ${captainName}  •  أكاديمية الكاراتيه والرياضات القتالية ❤️`,
    photoCenterX,
    capBoxY + 95,
    "900 23px Cairo, sans-serif",
    "#dc2626"
  );

  // 9. Official Card Footer (Exact match to Profile Card)
  context.fillStyle = "#e2e8f0";
  context.fillRect(72, canvas.height - 110, canvas.width - 144, 2);

  drawRight(
    `تم استخراج بطاقة الترحيب رسميًا من نظام Re_action PRO  •  ${new Date().toLocaleDateString("ar-EG")}`,
    canvas.width - 80,
    canvas.height - 65,
    "600 22px Cairo, sans-serif",
    "#94a3b8"
  );

  drawLeft(
    "أكاديمية الكاراتيه والرياضات القتالية 🥋",
    80,
    canvas.height - 65,
    "800 22px Cairo, sans-serif",
    "#b91c1c"
  );

  return canvas;
}
