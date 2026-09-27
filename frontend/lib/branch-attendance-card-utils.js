import { openWhatsAppDirect, BELT_HEX } from "./dashboard-utils";
import { copyBlobToClipboard } from "./birthday-card-utils";

export { copyBlobToClipboard, openWhatsAppDirect };

/**
 * Formats a YYYY-MM-DD date into full Arabic text (e.g. السبت 27 سبتمبر 2026)
 */
export function formatArabicSessionDate(sessionDate) {
  if (!sessionDate) return "";
  try {
    const [y, m, d] = sessionDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (_) {
    return sessionDate;
  }
}

/**
 * Prepares professional WhatsApp message text for the parents' group
 */
export function generateAttendanceWhatsAppText({
  branchName,
  sessionDate,
  presentCount,
  absentCount,
  totalCount,
  attendanceRate,
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الكاراتيه",
}) {
  const formattedDate = formatArabicSessionDate(sessionDate);
  return (
    `📋 *كشف الحضور والغياب الرسمي - ${academyName || "أكاديمية الكاراتيه"}* 🥋\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📍 *صالة التدريب:* ${branchName}\n` +
    `📅 *تاريخ الحصة:* ${formattedDate}\n` +
    `🎖️ *إشراف وتدريب:* الكابتن / ${captainName}\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `📊 *إحصائيات الحصة:* \n` +
    `• نسبة الالتزام بالحضور: *${attendanceRate}%*\n` +
    `• الأبطال الحاضرون: *${presentCount} لاعب* 🥋\n` +
    `• الأبطال الغائبون: *${absentCount} لاعب* ⚠️\n` +
    `• إجمالي المقيدين بالصالة: *${totalCount} لاعب*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `*(مرفق صورة كارت كشف الحضور والغياب التفصيلي 👆)*\n\n` +
    `🌟 نرجو من أولياء الأمور الكرام تشجيع أبطالنا دائماً على الانضباط والالتزام بمواعيد التدريب لصناعة أبطال المستقبل 🏆`
  );
}

/**
 * Generates an ultra-luxurious, official Karate Branch Attendance & Absence Report Card Canvas
 * Exclusively focused on Attendance and Absence ("الحضور والغياب فقط")
 * Designed for sharing on parents' WhatsApp groups.
 */
export async function generateBranchAttendanceCardCanvas({
  branchName,
  sessionDate,
  players = [],
  captainName = "كابتن الأكاديمية",
  academyName = "أكاديمية الكاراتيه",
}) {
  if (typeof document === "undefined") return null;

  if (document.fonts && document.fonts.status !== "loaded") {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 200)),
      ]);
    } catch (_) {
      // Continue if font load takes long
    }
  }

  // 1. Filter players for the selected branch
  const branchPlayers =
    !branchName || branchName === "كل الصالات"
      ? [...players]
      : players.filter((p) => p.branch === branchName);

  // 2. Classify into present and absent
  const presentPlayers = branchPlayers
    .filter((p) =>
      (p.attendance || []).some(
        (a) => a.date === sessionDate && a.status === "present"
      )
    )
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

  const presentIds = new Set(presentPlayers.map((p) => String(p._id)));
  const absentPlayers = branchPlayers
    .filter((p) => !presentIds.has(String(p._id)))
    .sort((a, b) => (a.name || "").localeCompare(b.name || "", "ar"));

  const totalCount = branchPlayers.length;
  const presentCount = presentPlayers.length;
  const absentCount = absentPlayers.length;
  const attendanceRate =
    totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  const sessionDateFormatted = formatArabicSessionDate(sessionDate);

  // 3. Dynamic Height Calculation to fit all names in 2 columns
  const ITEM_HEIGHT = 50;
  const ITEM_GAP = 10;
  const ROW_PITCH = ITEM_HEIGHT + ITEM_GAP;

  const presentRows = Math.max(1, Math.ceil(presentCount / 2));
  const presentSectionHeight = 56 + presentRows * ROW_PITCH + 20;

  const absentRows = absentCount > 0 ? Math.ceil(absentCount / 2) : 1;
  const absentSectionHeight =
    absentCount > 0
      ? 56 + absentRows * ROW_PITCH + 72 + 20
      : 56 + 84 + 20; // 84px celebratory banner if 0 absent

  const fixedHeaderHeight = 240;
  const kpiStripHeight = 120;
  const footerHeight = 190;
  const marginsAndPaddings = 140;

  const calculatedHeight =
    fixedHeaderHeight +
    kpiStripHeight +
    presentSectionHeight +
    absentSectionHeight +
    footerHeight +
    marginsAndPaddings;

  const canvasWidth = 1080;
  const canvasHeight = Math.max(1360, Math.ceil(calculatedHeight));

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const context = canvas.getContext("2d");
  if (!context) return null;

  // Text helper functions
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
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  // Subtle geometric accent on background
  const bgGrad = context.createLinearGradient(0, 0, canvasWidth, canvasHeight);
  bgGrad.addColorStop(0, "rgba(220, 38, 38, 0.08)");
  bgGrad.addColorStop(0.5, "rgba(15, 23, 42, 0)");
  bgGrad.addColorStop(1, "rgba(5, 150, 105, 0.06)");
  context.fillStyle = bgGrad;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Main Card Surface (Pure White with 40px rounded corners)
  const cardX = 36;
  const cardY = 36;
  const cardW = canvasWidth - 72;
  const cardH = canvasHeight - 72;

  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(cardX, cardY, cardW, cardH, 40);
  context.fill();

  // Subtle shadow border around main card
  context.strokeStyle = "rgba(226, 232, 240, 0.9)";
  context.lineWidth = 2;
  context.stroke();

  // 3. Top Header Banner (Imperial Crimson & Deep Ruby Red gradient)
  const headerH = 196;
  const gradHeader = context.createLinearGradient(0, cardY, canvasWidth, cardY + headerH);
  gradHeader.addColorStop(0, "#dc2626");
  gradHeader.addColorStop(0.45, "#b91c1c");
  gradHeader.addColorStop(1, "#881337");
  context.fillStyle = gradHeader;
  context.beginPath();
  context.roundRect(cardX, cardY, cardW, headerH, [40, 40, 0, 0]);
  context.fill();

  // Gold decorative trim line under header
  context.fillStyle = "#f59e0b";
  context.fillRect(cardX, cardY + headerH, cardW, 4);

  // Brand Badge (Dynamic Academy Brand)
  const badgeText = `${academyName || "Re_action DOJO"} 🥋`;
  context.font = "800 20px Cairo, sans-serif";
  const badgeTextWidth = context.measureText(badgeText).width;
  const badgeWidth = Math.max(180, Math.min(320, badgeTextWidth + 36));
  context.fillStyle = "rgba(255, 255, 255, 0.16)";
  context.beginPath();
  context.roundRect(cardX + 28, cardY + 24, badgeWidth, 48, 14);
  context.fill();
  drawCenter(badgeText, cardX + 28 + badgeWidth / 2, cardY + 56, "800 20px Cairo, sans-serif", "#ffffff");

  // Header Title & Subtitle
  drawRight(
    "كشف الحضور والغياب الرسمي 📋",
    cardX + cardW - 32,
    cardY + 68,
    "900 38px Cairo, sans-serif",
    "#ffffff"
  );

  drawRight(
    `صالة: ${branchName || "كل الصالات"}  •  حصة: ${sessionDateFormatted}`,
    cardX + cardW - 32,
    cardY + 120,
    "700 24px Cairo, sans-serif",
    "#fee2e2"
  );

  drawRight(
    `إشراف وتدريب الكابتن: ${captainName}`,
    cardX + cardW - 32,
    cardY + 164,
    "700 21px Cairo, sans-serif",
    "#fef08a"
  );

  // 4. KPI Summary Strip (4 Capsules)
  const kpiY = cardY + headerH + 24;
  const kpiH = 98;
  const colGap = 14;
  const kpiColW = (cardW - 56 - colGap * 3) / 4;

  const kpis = [
    {
      label: "نسبة الحضور",
      value: `${attendanceRate}%`,
      bg: "#ecfdf5",
      border: "#a7f3d0",
      text: "#065f46",
      subText: "#047857",
    },
    {
      label: "حاضر بالحصة 🥋",
      value: `${presentCount} بطل`,
      bg: "#f0fdf4",
      border: "#bbf7d0",
      text: "#15803d",
      subText: "#166534",
    },
    {
      label: "غائب عن الحصة ⚠️",
      value: `${absentCount} بطل`,
      bg: absentCount > 0 ? "#fff1f2" : "#f0fdf4",
      border: absentCount > 0 ? "#fecdd3" : "#bbf7d0",
      text: absentCount > 0 ? "#be123c" : "#15803d",
      subText: absentCount > 0 ? "#9f1239" : "#166534",
    },
    {
      label: "إجمالي أبطال الصالة",
      value: `${totalCount} لاعب`,
      bg: "#f8fafc",
      border: "#cbd5e1",
      text: "#0f172a",
      subText: "#475569",
    },
  ];

  kpis.forEach((kpi, i) => {
    const kX = cardX + 28 + i * (kpiColW + colGap);
    context.fillStyle = kpi.bg;
    context.beginPath();
    context.roundRect(kX, kpiY, kpiColW, kpiH, 18);
    context.fill();

    context.strokeStyle = kpi.border;
    context.lineWidth = 1.5;
    context.stroke();

    drawCenter(kpi.value, kX + kpiColW / 2, kpiY + 46, "900 30px Cairo, sans-serif", kpi.text);
    drawCenter(kpi.label, kX + kpiColW / 2, kpiY + 78, "700 16px Cairo, sans-serif", kpi.subText);
  });

  // Current Y cursor
  let currentY = kpiY + kpiH + 30;

  // 5. Section 1: الأبطال الحاضرون (Present Players)
  const sectionPresentHeaderGrad = context.createLinearGradient(
    cardX + 28,
    currentY,
    cardX + cardW - 28,
    currentY
  );
  sectionPresentHeaderGrad.addColorStop(0, "#059669");
  sectionPresentHeaderGrad.addColorStop(1, "#047857");
  context.fillStyle = sectionPresentHeaderGrad;
  context.beginPath();
  context.roundRect(cardX + 28, currentY, cardW - 56, 48, 14);
  context.fill();

  drawRight(
    `🥋 الأبطال الحاضرون في الحصة (${presentCount} بطل)`,
    cardX + cardW - 48,
    currentY + 33,
    "900 22px Cairo, sans-serif",
    "#ffffff"
  );

  drawLeft(
    "ملتزمون ✓",
    cardX + 48,
    currentY + 33,
    "800 18px Cairo, sans-serif",
    "#d1fae5"
  );

  currentY += 60;

  const playerColW = (cardW - 56 - 16) / 2;

  if (presentCount === 0) {
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.roundRect(cardX + 28, currentY, cardW - 56, 56, 14);
    context.fill();
    context.strokeStyle = "#e2e8f0";
    context.stroke();
    drawCenter(
      "لم يتم تسجيل حضور لأي لاعب في هذه الحصة حتى الآن.",
      cardX + cardW / 2,
      currentY + 36,
      "700 18px Cairo, sans-serif",
      "#64748b"
    );
    currentY += 70;
  } else {
    presentPlayers.forEach((player, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const pX = cardX + 28 + col * (playerColW + 16);
      const pY = currentY + row * ROW_PITCH;

      // Card Box
      context.fillStyle = "#f0fdf4";
      context.beginPath();
      context.roundRect(pX, pY, playerColW, ITEM_HEIGHT, 14);
      context.fill();

      context.strokeStyle = "#86efac";
      context.lineWidth = 1.5;
      context.stroke();

      // Checkmark icon
      context.fillStyle = "#16a34a";
      context.beginPath();
      context.arc(pX + playerColW - 24, pY + 25, 13, 0, Math.PI * 2);
      context.fill();
      drawCenter("✓", pX + playerColW - 24, pY + 31, "900 15px Cairo, sans-serif", "#ffffff");

      // Player Name (Truncated if too long)
      const rawName = player.name || "بطل";
      const displayName = rawName.length > 24 ? rawName.slice(0, 23) + "..." : rawName;
      drawRight(
        displayName,
        pX + playerColW - 46,
        pY + 33,
        "800 20px Cairo, sans-serif",
        "#14532d"
      );

      // Belt badge on left
      const beltName = player.belt || "أبيض";
      const beltColorHex = BELT_HEX[beltName] || "#94a3b8";
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.roundRect(pX + 12, pY + 11, 105, 28, 8);
      context.fill();
      context.strokeStyle = "#bbf7d0";
      context.lineWidth = 1;
      context.stroke();

      // Belt dot
      context.fillStyle = beltColorHex;
      context.beginPath();
      context.arc(pX + 24, pY + 25, 6, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(0,0,0,0.15)";
      context.lineWidth = 0.5;
      context.stroke();

      drawCenter(
        beltName.length > 10 ? beltName.slice(0, 9) : beltName,
        pX + 68,
        pY + 31,
        "800 13px Cairo, sans-serif",
        "#166534"
      );
    });

    currentY += presentRows * ROW_PITCH + 18;
  }

  // 6. Section 2: الأبطال الغائبون (Absent Players)
  const sectionAbsentHeaderGrad = context.createLinearGradient(
    cardX + 28,
    currentY,
    cardX + cardW - 28,
    currentY
  );
  sectionAbsentHeaderGrad.addColorStop(0, "#e11d48");
  sectionAbsentHeaderGrad.addColorStop(1, "#be123c");
  context.fillStyle = sectionAbsentHeaderGrad;
  context.beginPath();
  context.roundRect(cardX + 28, currentY, cardW - 56, 48, 14);
  context.fill();

  drawRight(
    `⚠️ الأبطال الغائبون عن الحصة (${absentCount} بطل)`,
    cardX + cardW - 48,
    currentY + 33,
    "900 22px Cairo, sans-serif",
    "#ffffff"
  );

  drawLeft(
    absentCount === 0 ? "لا يوجد غياب 🏆" : "ننتظر عودتكم 🌟",
    cardX + 48,
    currentY + 33,
    "800 18px Cairo, sans-serif",
    "#ffe4e6"
  );

  currentY += 60;

  if (absentCount === 0) {
    // Celebratory 100% full attendance banner!
    context.fillStyle = "#ecfdf5";
    context.beginPath();
    context.roundRect(cardX + 28, currentY, cardW - 56, 76, 16);
    context.fill();
    context.strokeStyle = "#34d399";
    context.lineWidth = 2;
    context.stroke();

    drawCenter(
      "🏆 ما شاء الله! حضور كامل لجميع أبطال الصالة بنسبة 100% بدون أي غياب! عاش يا أبطال 🥇",
      cardX + cardW / 2,
      currentY + 46,
      "900 22px Cairo, sans-serif",
      "#065f46"
    );
    currentY += 92;
  } else {
    absentPlayers.forEach((player, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const pX = cardX + 28 + col * (playerColW + 16);
      const pY = currentY + row * ROW_PITCH;

      // Card Box
      context.fillStyle = "#fff1f2";
      context.beginPath();
      context.roundRect(pX, pY, playerColW, ITEM_HEIGHT, 14);
      context.fill();

      context.strokeStyle = "#fca5a5";
      context.lineWidth = 1.5;
      context.stroke();

      // Absent cross icon
      context.fillStyle = "#e11d48";
      context.beginPath();
      context.arc(pX + playerColW - 24, pY + 25, 13, 0, Math.PI * 2);
      context.fill();
      drawCenter("✕", pX + playerColW - 24, pY + 31, "900 14px Cairo, sans-serif", "#ffffff");

      // Player Name
      const rawName = player.name || "بطل";
      const displayName = rawName.length > 24 ? rawName.slice(0, 23) + "..." : rawName;
      drawRight(
        displayName,
        pX + playerColW - 46,
        pY + 33,
        "800 20px Cairo, sans-serif",
        "#881337"
      );

      // Belt badge on left
      const beltName = player.belt || "أبيض";
      const beltColorHex = BELT_HEX[beltName] || "#94a3b8";
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.roundRect(pX + 12, pY + 11, 105, 28, 8);
      context.fill();
      context.strokeStyle = "#fecdd3";
      context.lineWidth = 1;
      context.stroke();

      // Belt dot
      context.fillStyle = beltColorHex;
      context.beginPath();
      context.arc(pX + 24, pY + 25, 6, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(0,0,0,0.15)";
      context.lineWidth = 0.5;
      context.stroke();

      drawCenter(
        beltName.length > 10 ? beltName.slice(0, 9) : beltName,
        pX + 68,
        pY + 31,
        "800 13px Cairo, sans-serif",
        "#9f1239"
      );
    });

    currentY += absentRows * ROW_PITCH + 14;

    // Polite courteous note to parents about attendance
    context.fillStyle = "#fffbeb";
    context.beginPath();
    context.roundRect(cardX + 28, currentY, cardW - 56, 50, 12);
    context.fill();
    context.strokeStyle = "#fde68a";
    context.lineWidth = 1.5;
    context.stroke();

    drawCenter(
      "💡 تنبيه لأولياء الأمور الكرام: نرجو الحرص على تعويض الحصص لضمان الاستمرارية والجاهزية للبطولات 🌟",
      cardX + cardW / 2,
      currentY + 32,
      "700 17px Cairo, sans-serif",
      "#92400e"
    );

    currentY += 66;
  }

  // 7. Footer Section
  const footerY = Math.max(currentY + 20, cardY + cardH - 150);

  // Decorative divider line
  context.fillStyle = "#e2e8f0";
  context.fillRect(cardX + 28, footerY - 14, cardW - 56, 1.5);

  // Motivational quote
  drawCenter(
    "« الالتزام والانضباط هما الخطوة الأولى في صناعة بطل الجمهورية والدولي 🥋 »",
    cardX + cardW / 2,
    footerY + 24,
    "900 22px Cairo, sans-serif",
    "#0f172a"
  );

  // Signatures and Accreditation
  const now = new Date();
  const timeFormatted = now.toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateFormatted = now.toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  drawRight(
    `إشراف: الكابتن / ${captainName} 🥋`,
    cardX + cardW - 36,
    footerY + 68,
    "800 18px Cairo, sans-serif",
    "#334155"
  );

  drawCenter(
    `معتمد من إدارة ${academyName || "أكاديمية الكاراتيه"} للفنون القتالية 🏆`,
    cardX + cardW / 2,
    footerY + 68,
    "700 16px Cairo, sans-serif",
    "#64748b"
  );

  drawLeft(
    `توثيق: ${dateFormatted} - ${timeFormatted}`,
    cardX + 36,
    footerY + 68,
    "700 15px Cairo, sans-serif",
    "#94a3b8"
  );

  return canvas;
}
