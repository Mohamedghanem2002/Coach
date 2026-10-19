import {
  localDate,
  formatArabicMonth,
  getPlayerMonthAttendance,
  getPurchasesSummary,
  getPaymentDetailsFor,
  calculateAge,
  getArabicDayName,
} from "./dashboard-utils";

// Fast in-memory cache for player photo elements to prevent re-fetching and decoding delay
export const playerPhotoCache = new Map();

export async function generateProfileCardCanvas({
  player,
  branches = [],
  paymentMonth,
  reportMonth,
  captainName = "كابتن الأكاديمية",
  academyName = "CoachMaster",
  customMonth = null,
}) {
  if (!player) return null;

  const activeMonth = customMonth || reportMonth || paymentMonth || localDate().slice(0, 7);
  const monthLabel = formatArabicMonth(activeMonth);

  const guardianPhone =
    player.guardianPhone ||
    player.parentPhone ||
    player.guardianMobile ||
    player.mobile ||
    player.phone ||
    "";

  const currentAge = calculateAge(player.dateOfBirth) ?? player.age ?? 0;
  const registrationDate = player.createdAt
    ? new Date(player.createdAt).toLocaleDateString("ar-EG")
    : "";

  // Attendance strictly for activeMonth aligned with branch training days:
  const targetPlayerBranch = (branches || []).find((b) => b.name === player.branch);
  const monthAttData = getPlayerMonthAttendance(player, targetPlayerBranch, activeMonth);
  const attendanceHistory = [...monthAttData.sessions].reverse().slice(0, 5);
  const totalSessions = monthAttData.total;
  const attendedSessions = monthAttData.attended;
  const attRate = monthAttData.rate;

  const purchasesList = Array.isArray(player.purchases)
    ? [...player.purchases].reverse().slice(0, 4)
    : [];
  const pSummary = getPurchasesSummary(player);
  const unpdPurchases = (pSummary.purchases || []).filter(
    (p) => (Number(p.remainingAmount) || 0) > 0,
  );

  const targetPayment = getPaymentDetailsFor(player, activeMonth);
  const mStatus = targetPayment.status;
  const mHasConfigured = Boolean(
    targetPayment.hasConfiguredAmount ||
    (targetPayment.totalAmount !== undefined && targetPayment.totalAmount !== null && Number(targetPayment.totalAmount) > 0)
  );
  const mTotal = mHasConfigured ? Number(targetPayment.totalAmount) : 0;
  const mPaid = targetPayment.paidAmount ?? 0;
  const mRemaining = mHasConfigured ? (targetPayment.remainingAmount ?? 0) : 0;

  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) return null;

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

  // Outer luxury frame
  context.fillStyle = "#090d16";
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Main Card Surface
  context.fillStyle = "#ffffff";
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, canvas.height - 72, 40);
  context.fill();

  // Top Header Banner
  const gradHeader = context.createLinearGradient(0, 36, canvas.width, 220);
  gradHeader.addColorStop(0, "#dc2626");
  gradHeader.addColorStop(0.5, "#b91c1c");
  gradHeader.addColorStop(1, "#881337");
  context.fillStyle = gradHeader;
  context.beginPath();
  context.roundRect(36, 36, canvas.width - 72, 184, [40, 40, 0, 0]);
  context.fill();

  // Embellishment badge (Dynamic Academy Brand)
  const badgeText = academyName || "CoachMaster";
  context.font = "900 20px Cairo, sans-serif";
  const badgeTextWidth = context.measureText(badgeText).width;
  const badgeWidth = Math.max(160, Math.min(320, badgeTextWidth + 36));
  context.fillStyle = "rgba(255, 255, 255, 0.18)";
  context.beginPath();
  context.roundRect(72, 65, badgeWidth, 52, 16);
  context.fill();
  drawCenter(badgeText, 72 + badgeWidth / 2, 99, "900 20px Cairo, sans-serif", "#ffffff");

  drawRight(
    "بطاقة لاعب الكاراتيه الرسمية 🥋",
    canvas.width - 80,
    105,
    "900 42px Cairo, sans-serif",
    "#ffffff",
  );
  drawRight(
    `إشراف وتدريب الكابتن: ${captainName}`,
    canvas.width - 80,
    160,
    "700 26px Cairo, sans-serif",
    "#fecaca",
  );

  // Athlete Banner Box (Enlarged to 440px for a massive hero photo)
  context.fillStyle = "#f8fafc";
  context.beginPath();
  context.roundRect(72, 236, canvas.width - 144, 440, 26);
  context.fill();
  context.strokeStyle = "#e2e8f0";
  context.lineWidth = 2;
  context.stroke();

  // Photo / Monogram Avatar (Significantly enlarged: Center 275, 456, Radius 195, Diameter 390px)
  const avatarRadius = 195;
  const avatarCenterX = 275;
  const avatarCenterY = 456;

  let photoDrawn = false;
  if (player.photo) {
    let photo = playerPhotoCache.get(player.photo);
    if (!photo || !(photo.naturalWidth || photo.width)) {
      photo = await new Promise((resolve) => {
        const image = new Image();
        if (player.photo.startsWith("http://") || player.photo.startsWith("https://")) {
          image.crossOrigin = "anonymous";
        }
        image.onload = () => {
          playerPhotoCache.set(player.photo, image);
          resolve(image);
        };
        image.onerror = () => resolve(null);
        setTimeout(() => resolve(null), 1000);
        image.src = player.photo;
      });
    }
    if (photo && (photo.naturalWidth || photo.width) && (photo.naturalHeight || photo.height)) {
      const pw = photo.naturalWidth || photo.width;
      const ph = photo.naturalHeight || photo.height;

      // Outer soft ambient glow ring
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius + 12, 0, Math.PI * 2);
      context.strokeStyle = "rgba(220, 38, 38, 0.15)";
      context.lineWidth = 12;
      context.stroke();

      // Gold decorative champion ring
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius + 5, 0, Math.PI * 2);
      context.strokeStyle = "#f59e0b";
      context.lineWidth = 5;
      context.stroke();

      // Center-crop (object-fit: cover) to preserve aspect ratio without stretching
      const minDim = Math.min(pw, ph);
      const sx = (pw - minDim) / 2;
      const sy = (ph - minDim) / 2;

      context.save();
      context.beginPath();
      context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(
        photo,
        sx,
        sy,
        minDim,
        minDim,
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
      context.lineWidth = 7;
      context.stroke();
      photoDrawn = true;
    }
  }

  if (!photoDrawn) {
    // Soft outer ambient glow ring
    context.beginPath();
    context.arc(avatarCenterX, avatarCenterY, avatarRadius + 12, 0, Math.PI * 2);
    context.strokeStyle = "rgba(220, 38, 38, 0.15)";
    context.lineWidth = 12;
    context.stroke();

    const avatarGrad = context.createRadialGradient(
      avatarCenterX - 45,
      avatarCenterY - 45,
      25,
      avatarCenterX,
      avatarCenterY,
      avatarRadius
    );
    avatarGrad.addColorStop(0, "#ef4444");
    avatarGrad.addColorStop(0.5, "#dc2626");
    avatarGrad.addColorStop(1, "#881337");
    context.fillStyle = avatarGrad;
    context.beginPath();
    context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    context.fill();

    context.beginPath();
    context.arc(avatarCenterX, avatarCenterY, avatarRadius, 0, Math.PI * 2);
    context.strokeStyle = "#ffffff";
    context.lineWidth = 7;
    context.stroke();

    drawCenter(
      player.name ? player.name.charAt(0) : "ك",
      avatarCenterX,
      avatarCenterY + 56,
      "900 160px Cairo, sans-serif",
      "#ffffff"
    );
  }

  // Athlete Details (Evenly spaced in the right area - NO file number shown)
  drawRight(player.name, 970, 315, "900 48px Cairo, sans-serif", "#0f172a");
  drawRight(`🥋 الحزام: ${player.belt || "أبيض"}  •  المستوى: ${player.level || "A"}`, 970, 372, "800 28px Cairo, sans-serif", "#b91c1c");
  drawRight(`🏢 الصالة: ${player.branch}`, 970, 428, "700 27px Cairo, sans-serif", "#334155");
  drawRight(`🎂 السن: ${currentAge} سنة`, 970, 478, "700 27px Cairo, sans-serif", "#334155");
  if (guardianPhone) {
    drawRight(`📞 ولي الأمر: ${guardianPhone}`, 970, 528, "700 27px Cairo, sans-serif", "#047857");
  }
  drawRight(`📅 تاريخ التسجيل: ${registrationDate}`, 970, 578, "600 24px Cairo, sans-serif", "#94a3b8");

  // ─── Financial Status Section: 2 Side-by-Side Cards (Width: 456px each) ───
  // Card 1 (Right): اشتراك الشهر
  const mIsPaid = mStatus === "paid";
  const mIsPartial = mStatus === "partially_paid";
  context.fillStyle = mIsPaid ? "#f0fdf4" : mIsPartial ? "#fffbeb" : "#fef2f2";
  context.beginPath();
  context.roundRect(552, 692, 456, 155, 20);
  context.fill();
  context.strokeStyle = mIsPaid ? "#86efac" : mIsPartial ? "#fde68a" : "#fca5a5";
  context.lineWidth = 2.5;
  context.stroke();

  drawRight(`💳 اشتراك شهر ${paymentMonth}`, 552 + 456 - 22, 732, "800 23px Cairo, sans-serif", mIsPaid ? "#065f46" : mIsPartial ? "#92400e" : "#991b1b");
  const mStatusText = mIsPaid
    ? "مدفوع بالكامل ✓"
    : mIsPartial
    ? `سداد جزئي (${mPaid} ج.م)`
    : (mHasConfigured ? "غير مسدد ⚠️" : "لم يدفع ⚠️");
  drawCenter(mStatusText, 552 + 228, 781, "900 34px Cairo, sans-serif", mIsPaid ? "#047857" : mIsPartial ? "#b45309" : "#b91c1c");
  const mSubText = mIsPaid
    ? (mHasConfigured ? `سدد ${mPaid} ج.م من أصل ${mTotal} ج.م` : "تم سداد الاشتراك بالكامل ✓")
    : mIsPartial
    ? (mHasConfigured ? `فاضل عليه: ${mRemaining} ج.م (من ${mTotal})` : `سدد ${mPaid} ج.م`)
    : (mHasConfigured ? `المبلغ المطلوب: ${mTotal || mRemaining} ج.م` : "لم يدفع");
  drawCenter(mSubText, 552 + 228, 822, "700 21px Cairo, sans-serif", mIsPaid ? "#065f46" : mIsPartial ? "#b45309" : "#9f1239");

  // Card 2 (Left): المشتريات والبدل والأدوات
  const hasGearDebt = pSummary.remainingAmount > 0;
  const hasPurchases = pSummary.count > 0;
  context.fillStyle = hasGearDebt ? "#fffbeb" : hasPurchases ? "#f0fdf4" : "#f8fafc";
  context.beginPath();
  context.roundRect(72, 692, 456, 155, 20);
  context.fill();
  context.strokeStyle = hasGearDebt ? "#fde68a" : hasPurchases ? "#86efac" : "#e2e8f0";
  context.lineWidth = 2.5;
  context.stroke();

  drawRight("🥋 المشتريات والبدل والأدوات", 72 + 456 - 22, 732, "800 23px Cairo, sans-serif", hasGearDebt ? "#92400e" : hasPurchases ? "#065f46" : "#475569");
  let gearStatusText = "الحساب خالص ✓";
  let gearSubText = "لا توجد مديونية أدوات مسجلة";
  if (hasGearDebt) {
    gearStatusText = `باقي عليه: ${pSummary.remainingAmount} ج.م ⚠️`;
    if (unpdPurchases.length === 1) {
      const item = unpdPurchases[0];
      gearSubText = `${item.title}: دفع ${item.paidAmount} من ${item.totalAmount} ج.م`;
    } else {
      gearSubText = `دفع ${pSummary.paidAmount} من إجمالي ${pSummary.totalAmount} ج.م`;
    }
  } else if (hasPurchases) {
    gearStatusText = `مسددة بالكامل (${pSummary.totalAmount} ج.م) ✓`;
    gearSubText = "تم سداد كافة المستلزمات والبدل";
  }
  drawCenter(gearStatusText, 72 + 228, 781, "900 32px Cairo, sans-serif", hasGearDebt ? "#b45309" : hasPurchases ? "#047857" : "#334155");
  drawCenter(gearSubText, 72 + 228, 822, "700 21px Cairo, sans-serif", hasGearDebt ? "#92400e" : hasPurchases ? "#065f46" : "#64748b");

  // ─── Attendance Summary Chips (Side-by-Side) ───
  context.fillStyle = "#ecfdf5";
  context.beginPath();
  context.roundRect(552, 864, 456, 62, 16);
  context.fill();
  context.strokeStyle = "#a7f3d0";
  context.lineWidth = 1.5;
  context.stroke();
  drawCenter(`✅ حضور التدريبات: ${attendedSessions} من ${totalSessions} حصة مسجلة`, 552 + 228, 903, "800 22px Cairo, sans-serif", "#047857");

  context.fillStyle = "#f1f5f9";
  context.beginPath();
  context.roundRect(72, 864, 456, 62, 16);
  context.fill();
  context.strokeStyle = "#cbd5e1";
  context.lineWidth = 1.5;
  context.stroke();
  const rateNote = attRate >= 75 ? "ممتاز 🌟" : attRate >= 50 ? "جيد 👍" : "يحتاج متابعة ⚠️";
  drawCenter(`📋 نسبة الالتزام: ${attRate}% (${rateNote})`, 72 + 228, 903, "800 22px Cairo, sans-serif", "#1e293b");

  // ─── Section 1: Attendance History ───
  drawRight("🥋 آخر سجلات الحضور والغياب (التدريبات)", 1008, 960, "900 28px Cairo, sans-serif", "#0f172a");
  let y = 980;
  const attList = attendanceHistory.slice(0, 4);
  if (attList.length === 0) {
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.roundRect(72, y, 936, 44, 12);
    context.fill();
    context.strokeStyle = "#e2e8f0";
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter("لا يوجد سجل حضور مسجل بعد", 72 + 468, y + 30, "700 20px Cairo, sans-serif", "#64748b");
    y += 54;
  } else {
    for (const item of attList) {
      const isPres = item.status === "present";
      context.fillStyle = isPres ? "#f0fdf4" : "#fef2f2";
      context.beginPath();
      context.roundRect(72, y, 936, 42, 12);
      context.fill();
      context.strokeStyle = isPres ? "#bbf7d0" : "#fecaca";
      context.lineWidth = 1.5;
      context.stroke();

      const dayName = item.dayName || getArabicDayName(item.date);
      const dayLabel = dayName ? `${dayName} (${item.date})` : item.date;
      drawRight(`📅 ${dayLabel}`, 1008 - 20, y + 29, "700 22px Cairo, sans-serif", isPres ? "#166534" : "#991b1b");
      drawLeft(isPres ? "حاضر التدريب اليوم ✓" : "غائب عن الحصة ×", 72 + 20, y + 29, "800 22px Cairo, sans-serif", isPres ? "#15803d" : "#b91c1c");
      y += 50;
    }
  }

  // ─── Section 2: Active Month Financial Status ───
  y = Math.max(y + 16, 1195);
  drawRight(`💳 تفاصيل اشتراك شهر ${monthLabel}`, 1008, y, "900 28px Cairo, sans-serif", "#0f172a");
  y += 24;

  context.fillStyle = mIsPaid ? "#f0fdf4" : mIsPartial ? "#fffbeb" : "#fef2f2";
  context.beginPath();
  context.roundRect(72, y, 936, 68, 16);
  context.fill();
  context.strokeStyle = mIsPaid ? "#86efac" : mIsPartial ? "#fde68a" : "#fca5a5";
  context.lineWidth = 2;
  context.stroke();

  drawRight(
    mIsPaid
      ? `✓ تم سداد اشتراك شهر ${monthLabel} بالكامل (${mPaid} ج.م)`
      : mIsPartial
      ? `⚠️ سداد جزئي: سدد ${mPaid} ج.م  •  فاضل عليه: ${mRemaining} ج.م`
      : mHasConfigured
      ? `⚠️ لم يسدد اشتراك شهر ${monthLabel} (المبلغ المطلوب: ${mTotal || mRemaining} ج.م)`
      : `⚠️ لم يتم سداد اشتراك شهر ${monthLabel}`,
    1008 - 24,
    y + 42,
    "800 26px Cairo, sans-serif",
    mIsPaid ? "#166534" : mIsPartial ? "#92400e" : "#991b1b"
  );

  drawLeft(
    mIsPaid ? "خالص ✓" : mIsPartial ? "سداد جزئي" : "غير مدفوع",
    72 + 24,
    y + 42,
    "900 24px Cairo, sans-serif",
    mIsPaid ? "#15803d" : mIsPartial ? "#b45309" : "#b91c1c"
  );
  y += 82;

  // ─── Section 3: Gear & Purchases Details ───
  y = Math.max(y + 16, 1375);
  drawRight("🛍️ بيان المشتريات والبدل والأدوات المسجلة", 1008, y, "900 28px Cairo, sans-serif", "#0f172a");
  y += 22;
  const purchasesToShow = purchasesList.slice(0, 4);
  if (purchasesToShow.length === 0) {
    context.fillStyle = "#f0fdf4";
    context.beginPath();
    context.roundRect(72, y, 936, 50, 14);
    context.fill();
    context.strokeStyle = "#86efac";
    context.lineWidth = 1.5;
    context.stroke();
    drawCenter("لا توجد أي مستلزمات أو بدل مسجلة بحساب اللاعب (الحساب خالص بالكامل ✓)", 72 + 468, y + 33, "800 22px Cairo, sans-serif", "#047857");
    y += 62;
  } else {
    for (const p of purchasesToShow) {
      const pTot = Number(p.totalAmount) || 0;
      const pPaid = Number(p.paidAmount) || 0;
      const pRem = Math.max(0, pTot - pPaid);
      const pIsPaid = pRem === 0 && pTot > 0;

      context.fillStyle = pIsPaid ? "#f0fdf4" : "#fffbeb";
      context.beginPath();
      context.roundRect(72, y, 936, 50, 14);
      context.fill();
      context.strokeStyle = pIsPaid ? "#86efac" : "#fcd34d";
      context.lineWidth = 1.8;
      context.stroke();

      // Right side: Item name & price & delivery status
      const isDelivered = p.deliveryStatus === "received";
      const delTag = isDelivered ? "استلم ✓" : "لم يستلم ⏳";
      const titleStr = `🥋 ${p.title} (${delTag})  •  سعرها: ${pTot} ج.م`;
      drawRight(titleStr, 1008 - 20, y + 33, "800 23px Cairo, sans-serif", pIsPaid ? "#065f46" : "#78350f");

      // Left side: Paid & Remaining details
      const payStr = pIsPaid
        ? `مسددة بالكامل (${pPaid} ج.م) ✓`
        : `سدد: ${pPaid} ج.م  •  فاضل عليه: ${pRem} ج.م ⚠️`;
      drawLeft(payStr, 72 + 20, y + 33, "900 23px Cairo, sans-serif", pIsPaid ? "#047857" : "#b45309");

      y += 58;
    }

    // Summary Pill for purchases
    context.fillStyle = "#f8fafc";
    context.beginPath();
    context.roundRect(72, y, 936, 46, 12);
    context.fill();
    context.strokeStyle = "#cbd5e1";
    context.lineWidth = 1.5;
    context.stroke();

    const summaryStr = `إجمالي المشتريات: ${pSummary.totalAmount} ج.م   •   المسدد: ${pSummary.paidAmount} ج.م   •   المتبقي الإجمالي: ${pSummary.remainingAmount} ج.م`;
    drawCenter(summaryStr, 72 + 468, y + 30, "800 21px Cairo, sans-serif", pSummary.remainingAmount > 0 ? "#b45309" : "#047857");
    y += 56;
  }

  // ─── Footer ───
  context.fillStyle = "#e2e8f0";
  context.fillRect(72, canvas.height - 100, canvas.width - 144, 2);

  drawRight(
    `تم استخراج البطاقة رسميًا من ${academyName || "الأكاديمية"}  •  ${new Date().toLocaleDateString("ar-EG")}`,
    canvas.width - 80,
    canvas.height - 58,
    "600 22px Cairo, sans-serif",
    "#94a3b8",
  );

  return canvas;
}
