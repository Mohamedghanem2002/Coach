import {
  formatWhatsAppPhone,
  calculateAge,
  openWhatsAppDirect,
} from "./dashboard-utils";
import { copyBlobToClipboard } from "./birthday-card-utils";

export { formatWhatsAppPhone, copyBlobToClipboard, openWhatsAppDirect };

/**
 * Generates an ultra-luxurious, official Karate Welcome Card Canvas
 * Identical in styling, colors, and branding to the Official Player Profile Card (Re_action PRO).
 * Dimensions: 1080 x 1920 (Standard 9:16 portrait)
 * Color Palette: Deep Slate Obsidian (#090d16) outer frame, Crisp Pure White (#ffffff) surface,
 * Imperial Crimson & Ruby Red gradient header (#dc2626 -> #b91c1c -> #881337),
 * Athlete Banner Box (#f8fafc), Emerald & Amber side-by-side welcome cards, and sharp typography.
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

  // Helper text drawing functions (exact match to Profile Card)
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

  // 1. Outer luxury frame (Matching Profile Card #090d16)
  context.fillStyle = "#090d16";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Main Card Surface (Pure White with 40px rounded corners)
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, canvas.height - 72, 40);
  context.fill();

  // 3. Top Header Banner (Imperial Crimson & Ruby Red gradient)
  const gradHeader = context.createLinearGradient(0, 36, canvas.width, 220);
  gradHeader.addColorStop(0, "#dc2626");
  gradHeader.addColorStop(0.5, "#b91c1c");
  gradHeader.addColorStop(1, "#881337");
  context.fillStyle = gradHeader;
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, 184, [40, 40, 0, 0]);
  context.fill();

  // Embellishment badge on the left (Re_action PRO)
  context.fillStyle = "rgba(255, 255, 255, 0.15)";
  context.beginPath();
  context.roundRect(72, 65, 160, 52, 16);
  context.fill();
  drawCenter("Re_action PRO", 152, 100, "900 22px Cairo, sans-serif", "#ffffff");

  // Header Title & Captain subtitle
  drawRight(
    "بطاقة ترحيب بالبطل الجديد 🥋",
    canvas.width - 80,
    105,
    "900 42px Cairo, sans-serif",
    "#ffffff"
  );
  drawRight(
    `إشراف وتدريب الكابتن: ${captainName}`,
    canvas.width - 80,
    160,
    "700 26px Cairo, sans-serif",
    "#fecaca"
  );

  // 4. Athlete Banner Box (#f8fafc with #e2e8f0 border)
  context.fillStyle = "#f8fafc";
  context.beginPath();
  context.roundRect(72, 245, canvas.width - 144, 295, 24);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2;
  context.stroke();

  // 5. Athlete Photo / Avatar (Enlarged and well-proportioned: Center 215, 392, Radius 115, Diameter 230px!)
  const avatarCenterX = 215;
  const avatarCenterY = 392;
  const avatarRadius = 115;

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
      context.save();
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        photo,
        avatarCenterX - avatarRadius,
        avatarCenterY - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      );
      context.restore();

      // Bold Crimson border ring
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      context.strokeStyle = "#dc2626";
      context.lineWidth = 6;
      context.stroke();
      photoDrawn = true;
    }
  }

  if (!photoDrawn) {
    const avatarGrad = context.createLinearGradient(
      avatarCenterX - avatarRadius,
      avatarCenterY - avatarRadius,
      avatarCenterX + avatarRadius,
      avatarCenterY + avatarRadius
    );
    avatarGrad.addColorStop(0, "#dc2626");
    avatarGrad.addColorStop(1, "#991b1b");
    context.fillStyle = avatarGrad;
    context.beginPath();
    context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    context.fill();

    drawCenter(
      player.name ? player.name.charAt(0) : "ك",
      avatarCenterX,
      avatarCenterY + 36,
      "900 95px Cairo, sans-serif",
      "#ffffff"
    );
  }

  // 6. Athlete Details (Exact font, colors, and line spacing as Profile Card)
  drawRight(`البطل / ${player.name}`, 940, 310, "900 42px Cairo, sans-serif", "#0f172a");
  drawRight(
    `🥋 الحزام: ${player.belt || "أبيض"}  •  المستوى: ${player.level || "A"}`,
    940,
    355,
    "800 25px Cairo, sans-serif",
    "#b91c1c"
  );
  drawRight(`🏢 الصالة: ${player.branch}`, 940, 396, "700 23px Cairo, sans-serif", "#334155");
  drawRight(`🎂 السن: ${currentAge} سنة`, 940, 436, "700 23px Cairo, sans-serif", "#334155");
  if (guardianPhone) {
    drawRight(`📞 ولي الأمر: ${guardianPhone}`, 940, 475, "700 23px Cairo, sans-serif", "#047857");
  }
  drawRight(
    `📅 تاريخ الانضمام: ${joinDate}`,
    940,
    512,
    "600 20px Cairo, sans-serif",
    "#94a3b8"
  );

  // 7. Welcome Status Cards: 2 Side-by-Side Cards (Width: 456px each, matching Profile Card y=555)
  // Card 1 (Right): عضوية رسمية جديدة
  context.fillStyle = "#f0fdf4";
  context.beginPath();
  context.roundRect(552, 555, 456, 160, 20);
  context.fill();
  context.strokeStyle = "#86efac";
  context.lineWidth = 2.5;
  context.stroke();

  drawRight("🌟 عضوية وبطاقة بطل رسمية", 552 + 456 - 22, 595, "800 23px Cairo, sans-serif", "#065f46");
  drawCenter("أهلاً بك يا بطل! 🥋", 552 + 228, 646, "900 34px Cairo, sans-serif", "#047857");
  drawCenter("تم قيد وتسجيل اللاعب بالأكاديمية بنجاح ✓", 552 + 228, 690, "700 21px Cairo, sans-serif", "#065f46");

  // Card 2 (Left): مسيرة صناعة الأبطال
  context.fillStyle = "#fffbeb";
  context.beginPath();
  context.roundRect(72, 555, 456, 160, 20);
  context.fill();
  context.strokeStyle = "#fde68a";
  context.lineWidth = 2.5;
  context.stroke();

  drawRight("🏆 مسيرة صناعة الأبطال", 72 + 456 - 22, 595, "800 23px Cairo, sans-serif", "#92400e");
  drawCenter("نحو منصات التتويج 🥇", 72 + 228, 646, "900 32px Cairo, sans-serif", "#b45309");
  drawCenter("تدريب احترافي وتأسيس بدني وبطولات", 72 + 228, 690, "700 21px Cairo, sans-serif", "#92400e");

  // 8. Academy Motto Chips (Side-by-Side Chips, matching Profile Card y=730)
  context.fillStyle = "#ecfdf5";
  context.beginPath();
  context.roundRect(552, 730, 456, 68, 16);
  context.fill();
  context.strokeStyle = "#a7f3d0";
  context.lineWidth = 1.5;
  context.stroke();
  drawCenter("✅ الشعار: عزيمة • قوة • انضباط • احترام", 552 + 228, 772, "800 22px Cairo, sans-serif", "#047857");

  context.fillStyle = "#f1f5f9";
  context.beginPath();
  context.roundRect(72, 730, 456, 68, 16);
  context.fill();
  context.strokeStyle = "#cbd5e1";
  context.lineWidth = 1.5;
  context.stroke();
  drawCenter("📋 تصنيف البطل: واعد ومؤهل للبطولات 🌟", 72 + 228, 772, "800 22px Cairo, sans-serif", "#1e293b");

  // 9. Welcome Message Card (Matching Attendance Table style in Profile Card)
  drawRight("🥋 رسالة ترحيبية من إدارة الأكاديمية", 1008, 830, "900 28px Cairo, sans-serif", "#0f172a");

  context.fillStyle = "#f8fafc";
  context.beginPath();
  context.roundRect(72, 855, 936, 175, 20);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2;
  context.stroke();

  drawCenter(
    `يسعدنا ويشرفنا انضمام البطل / ${player.name} إلى أسرة وعائلة الأكاديمية!`,
    72 + 468,
    907,
    "800 24px Cairo, sans-serif",
    "#0f172a"
  );
  drawCenter(
    "رياضة الكاراتيه ليست مجرد حركات، بل هي بناء للشخصية القيادية والانضباط العالي.",
    72 + 468,
    955,
    "700 21px Cairo, sans-serif",
    "#334155"
  );
  drawCenter(
    "نعدك بتقديم كل الدعم والرعاية لنرى بطلنا متألقاً على منصات التتويج العالمية 🏆🥇",
    72 + 468,
    1001,
    "800 22px Cairo, sans-serif",
    "#b91c1c"
  );

  // 10. Training Program Pillars (Matching Purchases List style in Profile Card)
  drawRight("🥊 مميزات التدريب والبرنامج الرياضي للأكاديمية", 1008, 1065, "900 28px Cairo, sans-serif", "#0f172a");

  const pillars = [
    {
      title: "🥋 تدريب كاتا وكوميتيه متقدم وفقاً لقواعد الاتحاد الدولي للكاراتيه (WKF)",
      badge: "معتمد دولياً ✓",
      isHighlight: true,
    },
    {
      title: "⚡ برامج إعداد بدني ولياقة حركية وتنمية سرعة رد الفعل والانضباط الذاتي",
      badge: "تأسيس بدني شامل ✓",
      isHighlight: false,
    },
    {
      title: "📜 اختبارات أحزمة دورية وشهادات رسمية ومشاركات مستمرة في البطولات",
      badge: "تدرج الأحزمة والترقي ✓",
      isHighlight: false,
    },
    {
      title: "🥇 خطة تطوير ومتابعة فنية فردية لمستوى وأداء البطل مع الكابتن",
      badge: "متابعة دورية ✓",
      isHighlight: true,
    },
  ];

  let pillarY = 1090;
  for (const item of pillars) {
    context.fillStyle = item.isHighlight ? "#f0fdf4" : "#f8fafc";
    context.beginPath();
    context.roundRect(72, pillarY, 936, 52, 14);
    context.fill();
    context.strokeStyle = item.isHighlight ? "#86efac" : "#e2e8f0";
    context.lineWidth = 1.8;
    context.stroke();

    // Right: Pillar text
    drawRight(item.title, 1008 - 20, pillarY + 34, "800 22px Cairo, sans-serif", item.isHighlight ? "#065f46" : "#1e293b");

    // Left: Badge
    drawLeft(item.badge, 72 + 20, pillarY + 34, "900 20px Cairo, sans-serif", item.isHighlight ? "#047857" : "#475569");

    pillarY += 64;
  }

  // 11. Section 3: Values & Karate Athlete Charter
  drawRight("📜 ميثاق وقيم بطل الكاراتيه بالأكاديمية", 1008, pillarY + 25, "900 28px Cairo, sans-serif", "#0f172a");
  pillarY += 50;

  const charterItems = [
    {
      title: "🥋 احترام المدرب والزملاء والالتزام التام بمواعيد الحصص والتدريبات",
      badge: "انضباط تام ✓",
      isHighlight: false,
    },
    {
      title: "⚡ الروح القتالية العالية والإصرار الدائم على تطوير المستوى وتحقيق الأفضل",
      badge: "عزيمة بطل ✓",
      isHighlight: true,
    },
    {
      title: "🛡️ استخدام مهارات الدفاع عن النفس في الخير وحماية النفس والضعفاء فقط",
      badge: "أخلاق الفرسان ✓",
      isHighlight: false,
    },
    {
      title: "🥇 الاستعداد المستمر لاختبارات الأحزمة القادمة والمنافسة في البطولات",
      badge: "طريق الذهب ✓",
      isHighlight: true,
    },
  ];

  for (const item of charterItems) {
    context.fillStyle = item.isHighlight ? "#fffbeb" : "#f8fafc";
    context.beginPath();
    context.roundRect(72, pillarY, 936, 52, 14);
    context.fill();
    context.strokeStyle = item.isHighlight ? "#fde68a" : "#e2e8f0";
    context.lineWidth = 1.8;
    context.stroke();

    drawRight(item.title, 1008 - 20, pillarY + 34, "800 22px Cairo, sans-serif", item.isHighlight ? "#92400e" : "#1e293b");
    drawLeft(item.badge, 72 + 20, pillarY + 34, "900 20px Cairo, sans-serif", item.isHighlight ? "#b45309" : "#475569");

    pillarY += 64;
  }

  // Motivational quote pill at bottom of section
  context.fillStyle = "#fef2f2";
  context.beginPath();
  context.roundRect(72, pillarY + 10, 936, 56, 16);
  context.fill();
  context.strokeStyle = "#fca5a5";
  context.lineWidth = 1.8;
  context.stroke();

  drawCenter(
    `مع تحيات أسرة الأكاديمية والكابتن / ${captainName} ❤️`,
    72 + 468,
    pillarY + 46,
    "900 23px Cairo, sans-serif",
    "#991b1b"
  );

  // 12. Footer (Exact match to Profile Card footer)
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
    "أكاديمية الكاراتيه والرياضات القتالية",
    80,
    canvas.height - 65,
    "800 22px Cairo, sans-serif",
    "#b91c1c"
  );

  return canvas;
}
