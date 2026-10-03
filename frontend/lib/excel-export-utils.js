import * as XLSX from "xlsx";
import {
  getPaymentDetailsFor,
  calculateAge,
  getPurchasesSummary,
  localDate,
} from "./dashboard-utils";

/**
 * Downloads a workbook as an .xlsx file in the browser
 */
export function saveWorkbookAs(wb, fileName) {
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const safeName = (fileName || "CoachMaster_Export").replace(/[/\\?%*:|"<>]/g, "_");
  link.download = safeName.endsWith(".xlsx") ? safeName : `${safeName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sets RTL view & calculates auto column widths for Arabic readability
 */
function formatWorksheet(ws, dataGrid) {
  // Set Right-to-Left sheet view
  ws["!views"] = [{ RTL: true }];

  // Auto-calculate column widths based on cell string lengths
  if (Array.isArray(dataGrid) && dataGrid.length > 0) {
    const colCount = Math.max(...dataGrid.map((row) => (Array.isArray(row) ? row.length : 0)));
    const colWidths = [];

    for (let c = 0; c < colCount; c++) {
      let maxLen = 8;
      for (let r = 0; r < dataGrid.length; r++) {
        const val = dataGrid[r]?.[c];
        if (val !== undefined && val !== null) {
          const str = String(val);
          // Arabic characters have slightly wider visual width
          const len = str.length;
          if (len > maxLen) maxLen = len;
        }
      }
      colWidths.push({ wch: Math.min(Math.max(maxLen + 4, 10), 45) });
    }
    ws["!cols"] = colWidths;
  }
}

/**
 * Helper to translate event types into readable Arabic
 */
const EVENT_TYPE_AR = {
  tournament: "بطولة رسمية",
  belt_exam: "اختبار حزام",
  training_camp: "معسكر تدريبي",
  medical_check: "كشف طبي",
  seminar: "ندوة / ورشة عمل",
  trip: "رحلة / نشاط ترفيهي",
  other: "أخرى",
};

/**
 * Helper to translate event statuses into readable Arabic
 */
const EVENT_STATUS_AR = {
  upcoming: "قادمة",
  ongoing: "جارية الآن",
  completed: "منتهية",
  cancelled: "ملغاة",
};

/**
 * 1. Export Players Data with optional branch, belt, and status filters
 */
export function exportPlayersToExcel({
  players = [],
  branches = [],
  paymentMonth = "",
  academyName = "CoachMaster",
  captainName = "",
  branchFilter = "all",
  statusFilter = "all",
  beltFilter = "all",
}) {
  const currentMonth = paymentMonth || localDate().slice(0, 7);

  // Filter players based on options
  const filtered = players.filter((p) => {
    if (branchFilter !== "all" && p.branch !== branchFilter) return false;
    if (beltFilter !== "all" && p.belt !== beltFilter) return false;

    if (statusFilter !== "all") {
      const payDetails = getPaymentDetailsFor(p, currentMonth);
      if (statusFilter === "paid" && payDetails.status !== "paid") return false;
      if (statusFilter === "unpaid" && payDetails.status !== "unpaid") return false;
      if (statusFilter === "partially_paid" && payDetails.status !== "partially_paid") return false;
      if (statusFilter === "has_debt") {
        const debt = getPurchasesSummary(p).remainingAmount;
        if (debt <= 0) return false;
      }
      if (statusFilter === "frozen" && !p.isFrozen) return false;
    }
    return true;
  });

  const wb = XLSX.utils.book_new();

  // ━━━━ Sheet 1: كشف بيانات الأبطال ━━━━
  const headers = [
    "م",
    "اسم اللاعب",
    "كود اللاعب",
    "الصالة / الفرع",
    "الحزام الحالي",
    "تاريخ الميلاد",
    "العمر (سنة)",
    "رقم هاتف اللاعب",
    "رقم ولي الأمر",
    "تاريخ بدء الاشتراك",
    "تاريخ نهاية الاشتراك",
    "قيمة الاشتراك الشهري (ج.م)",
    "المدفوع لهذا الشهر (ج.م)",
    "المتبقي لهذا الشهر (ج.م)",
    "حالة السداد",
    "مديونية المشتريات (ج.م)",
    "إجمالي الحصص المحضورة",
    "حالة الحساب",
    "ملاحظات",
  ];

  let totalFees = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let totalPurchasesDebt = 0;

  const rows = filtered.map((p, idx) => {
    const payDetails = getPaymentDetailsFor(p, currentMonth);
    const purchases = getPurchasesSummary(p);
    const age = calculateAge(p.dateOfBirth);
    const attendedCount = Array.isArray(p.attendance)
      ? p.attendance.filter((a) => a.status === "present").length
      : 0;

    totalFees += payDetails.totalAmount || 0;
    totalPaid += payDetails.paidAmount || 0;
    totalRemaining += payDetails.remainingAmount || 0;
    totalPurchasesDebt += purchases.remainingAmount || 0;

    const statusArabic =
      payDetails.status === "paid"
        ? "مسدد بالكامل"
        : payDetails.status === "partially_paid"
        ? "سداد جزئي"
        : "غير مسدد";

    const accountStatusArabic = p.isFrozen
      ? "اشتراك مجمد"
      : p.status === "inactive"
      ? "غير نشط"
      : "نشط";

    return [
      idx + 1,
      p.name || "",
      p.code || p.playerCode || "",
      p.branch || "غير محدد",
      p.belt || "أبيض",
      p.dateOfBirth || "",
      age !== null ? age : "",
      p.phone || "",
      p.parentPhone || "",
      p.subscriptionStartDate || p.joinDate || "",
      p.subscriptionEndDate || "",
      payDetails.totalAmount || 0,
      payDetails.paidAmount || 0,
      payDetails.remainingAmount || 0,
      statusArabic,
      purchases.remainingAmount || 0,
      attendedCount,
      accountStatusArabic,
      p.notes || "",
    ];
  });

  // Totals summary row
  const totalsRow = [
    "الإجمالي",
    `عدد الأبطال: ${filtered.length}`,
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    totalFees,
    totalPaid,
    totalRemaining,
    "",
    totalPurchasesDebt,
    "",
    "",
    "",
  ];

  const sheet1Data = [
    [`تقرير بيانات أبطال: ${academyName} - شهر ${currentMonth}`],
    [`تاريخ التصدير: ${localDate()} | الكابتن: ${captainName || "كابتن الأكاديمية"}`],
    [],
    headers,
    ...rows,
    [],
    totalsRow,
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  formatWorksheet(ws1, sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, "بيانات الأبطال");

  // ━━━━ Sheet 2: ملخص الصالات والأحزمة ━━━━
  const branchSummaryHeaders = [
    "الصالة / الفرع",
    "إجمالي اللاعبين",
    "المسددين",
    "غير المسددين",
    "إجمالي الاشتراكات",
    "المحصل (ج.م)",
    "المتبقي (ج.م)",
  ];

  const branchList = branches.length > 0 ? branches.map((b) => b.name) : [...new Set(players.map((p) => p.branch).filter(Boolean))];
  const branchSummaryRows = branchList.map((branchName) => {
    const branchPlayers = players.filter((p) => p.branch === branchName);
    let bTotal = 0;
    let bPaid = 0;
    let bRemaining = 0;
    let bPaidCount = 0;
    let bUnpaidCount = 0;

    branchPlayers.forEach((p) => {
      const pay = getPaymentDetailsFor(p, currentMonth);
      bTotal += pay.totalAmount || 0;
      bPaid += pay.paidAmount || 0;
      bRemaining += pay.remainingAmount || 0;
      if (pay.status === "paid") bPaidCount++;
      else bUnpaidCount++;
    });

    return [
      branchName,
      branchPlayers.length,
      bPaidCount,
      bUnpaidCount,
      bTotal,
      bPaid,
      bRemaining,
    ];
  });

  const sheet2Data = [
    [`ملخص إحصائيات الفروع لشهر ${currentMonth}`],
    [],
    branchSummaryHeaders,
    ...branchSummaryRows,
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  formatWorksheet(ws2, sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, "ملخص الفروع");

  // Generate file name
  const branchTag = branchFilter !== "all" ? `_صالة_${branchFilter}` : "";
  const fileName = `أبطال_${academyName}${branchTag}_${currentMonth}.xlsx`;
  saveWorkbookAs(wb, fileName);
}

/**
 * 2. Export a single specific Event with full participants breakdown & financial audit
 */
export function exportEventToExcel({
  event,
  academyName = "CoachMaster",
  captainName = "",
}) {
  if (!event) return;

  const participants = Array.isArray(event.participants) ? event.participants : [];
  const wb = XLSX.utils.book_new();

  // ━━━━ Sheet 1: كشف المشتركين ━━━━
  const headers = [
    "م",
    "اسم اللاعب",
    "الصالة / الفرع",
    "الحزام",
    "رقم ولي الأمر",
    "هاتف اللاعب",
    "رسوم الاشتراك (ج.م)",
    "المبلغ المدفوع (ج.م)",
    "المبلغ المتبقي (ج.م)",
    "حالة السداد",
    "حضور الفعالية",
    "ملاحظات",
  ];

  let totalExpected = 0;
  let totalPaid = 0;
  let totalRemaining = 0;
  let totalAttended = 0;

  const rows = participants.map((p, idx) => {
    const fee = Number(p.totalAmount ?? event.fee ?? 100);
    const paid = Number(p.paidAmount ?? 0);
    const remaining = Number(p.remainingAmount ?? Math.max(0, fee - paid));
    const attended = Boolean(p.attended);

    totalExpected += fee;
    totalPaid += paid;
    totalRemaining += remaining;
    if (attended) totalAttended++;

    const statusArabic =
      p.paymentStatus === "paid" || paid >= fee
        ? "مدفوع بالكامل"
        : paid > 0
        ? "دفع جزئي"
        : "لم يدفع";

    return [
      idx + 1,
      p.name || "",
      p.branch || "غير محدد",
      p.belt || "أبيض",
      p.parentPhone || "",
      p.phone || "",
      fee,
      paid,
      remaining,
      statusArabic,
      attended ? "حاضر" : "غائب",
      p.notes || "",
    ];
  });

  const totalsRow = [
    "الإجمالي",
    `المشتركين: ${participants.length}`,
    "",
    "",
    "",
    "",
    totalExpected,
    totalPaid,
    totalRemaining,
    `حاضر: ${totalAttended} / غائب: ${participants.length - totalAttended}`,
    "",
    "",
  ];

  const sheet1Data = [
    [`كشف مشتركي فعالية: ${event.title || "الفعالية"} - ${academyName}`],
    [
      `التاريخ: ${event.date || "غير محدد"} ${event.time ? `(${event.time})` : ""} | المكان: ${event.location || "غير محدد"} | رسوم الفرد: ${event.fee || 0} ج.م`,
    ],
    [],
    headers,
    ...rows,
    [],
    totalsRow,
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  formatWorksheet(ws1, sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, "كشف المشتركين");

  // ━━━━ Sheet 2: بطاقة ملخص الفعالية ━━━━
  const summaryData = [
    ["بطاقة ملخص الفعالية والحسابات الختامية"],
    [],
    ["البيان", "القيمة"],
    ["اسم الفعالية / البطولة", event.title || ""],
    ["نوع الفعالية", EVENT_TYPE_AR[event.type] || event.type || "أخرى"],
    ["تاريخ الفعالية", event.date || ""],
    ["توقيت الفعالية", event.time || "غير محدد"],
    ["مكان الإقامة", event.location || "غير محدد"],
    ["رسوم الاشتراك المقررة للفرد", `${event.fee || 0} ج.م`],
    ["حالة الفعالية", EVENT_STATUS_AR[event.status] || event.status || "قادمة"],
    ["إجمالي عدد المشتركين المسجلين", participants.length],
    ["عدد اللاعبين الحاضرين", totalAttended],
    ["عدد اللاعبين الغائبين", participants.length - totalAttended],
    [
      "نسبة الحضور الفعلية",
      participants.length > 0
        ? `${Math.round((totalAttended / participants.length) * 100)}%`
        : "0%",
    ],
    ["إجمالي الإيرادات المتوقعة", `${totalExpected} ج.م`],
    ["إجمالي المبالغ المحصلة", `${totalPaid} ج.م`],
    ["إجمالي المبالغ المتبقية", `${totalRemaining} ج.م`],
    ["ملاحظات الفعالية", event.notes || "لا توجد ملاحظات"],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  formatWorksheet(ws2, summaryData);
  XLSX.utils.book_append_sheet(wb, ws2, "ملخص الفعالية والحسابات");

  const fileName = `مشتركو_${event.title || "فعالية"}_${event.date || localDate()}.xlsx`;
  saveWorkbookAs(wb, fileName);
}

/**
 * 3. Export all Events with participants and financial totals
 */
export function exportAllEventsToExcel({
  events = [],
  academyName = "CoachMaster",
  captainName = "",
}) {
  const wb = XLSX.utils.book_new();

  // ━━━━ Sheet 1: سجل كافة الفعاليات ━━━━
  const eventsHeaders = [
    "م",
    "اسم الفعالية / البطولة",
    "نوع الفعالية",
    "التاريخ",
    "التوقيت",
    "المكان",
    "رسوم الفرد (ج.م)",
    "الحالة",
    "عدد المشتركين",
    "الحاضرون",
    "الغائبون",
    "إجمالي الإيراد المتوقع (ج.م)",
    "المحصل (ج.م)",
    "المتبقي (ج.م)",
    "ملاحظات",
  ];

  let grandExpected = 0;
  let grandPaid = 0;
  let grandRemaining = 0;
  let grandParticipants = 0;

  const eventsRows = events.map((ev, idx) => {
    const parts = Array.isArray(ev.participants) ? ev.participants : [];
    const totalRev = parts.reduce(
      (s, p) => s + Number(p.totalAmount ?? ev.fee ?? 100),
      0
    );
    const paidRev = parts.reduce((s, p) => s + Number(p.paidAmount ?? 0), 0);
    const remRev = Math.max(0, totalRev - paidRev);
    const attended = parts.filter((p) => p.attended).length;

    grandExpected += totalRev;
    grandPaid += paidRev;
    grandRemaining += remRev;
    grandParticipants += parts.length;

    return [
      idx + 1,
      ev.title || "",
      EVENT_TYPE_AR[ev.type] || ev.type || "أخرى",
      ev.date || "",
      ev.time || "",
      ev.location || "غير محدد",
      ev.fee || 0,
      EVENT_STATUS_AR[ev.status] || ev.status || "قادمة",
      parts.length,
      attended,
      parts.length - attended,
      totalRev,
      paidRev,
      remRev,
      ev.notes || "",
    ];
  });

  const totalsRow = [
    "الإجمالي العام",
    `عدد الفعاليات: ${events.length}`,
    "",
    "",
    "",
    "",
    "",
    "",
    grandParticipants,
    "",
    "",
    grandExpected,
    grandPaid,
    grandRemaining,
    "",
  ];

  const sheet1Data = [
    [`سجل كافة فعاليات وبطولات: ${academyName}`],
    [`تاريخ التقرير: ${localDate()} | الكابتن: ${captainName || "كابتن الأكاديمية"}`],
    [],
    eventsHeaders,
    ...eventsRows,
    [],
    totalsRow,
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  formatWorksheet(ws1, sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, "سجل الفعاليات");

  // ━━━━ Sheet 2: كافة المشتركين في جميع الفعاليات ━━━━
  const allParticipantsHeaders = [
    "اسم الفعالية",
    "تاريخ الفعالية",
    "اسم اللاعب",
    "الصالة / الفرع",
    "الحزام",
    "هاتف ولي الأمر",
    "هاتف اللاعب",
    "رسوم الفعالية (ج.م)",
    "المبلغ المدفوع (ج.م)",
    "المبلغ المتبقي (ج.م)",
    "حالة السداد",
    "حضور الفعالية",
    "ملاحظات",
  ];

  const allParticipantsRows = [];
  events.forEach((ev) => {
    const parts = Array.isArray(ev.participants) ? ev.participants : [];
    parts.forEach((p) => {
      const fee = Number(p.totalAmount ?? ev.fee ?? 100);
      const paid = Number(p.paidAmount ?? 0);
      const remaining = Number(p.remainingAmount ?? Math.max(0, fee - paid));
      const attended = Boolean(p.attended);

      const statusArabic =
        p.paymentStatus === "paid" || paid >= fee
          ? "مدفوع بالكامل"
          : paid > 0
          ? "دفع جزئي"
          : "لم يدفع";

      allParticipantsRows.push([
        ev.title || "",
        ev.date || "",
        p.name || "",
        p.branch || "غير محدد",
        p.belt || "أبيض",
        p.parentPhone || "",
        p.phone || "",
        fee,
        paid,
        remaining,
        statusArabic,
        attended ? "حاضر" : "غائب",
        p.notes || "",
      ]);
    });
  });

  const sheet2Data = [
    [`كشف كافة المشتركين في بطولات وفعاليات ${academyName}`],
    [],
    allParticipantsHeaders,
    ...allParticipantsRows,
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  formatWorksheet(ws2, sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, "كافة المشتركين");

  const fileName = `كافة_فعاليات_${academyName}_${localDate()}.xlsx`;
  saveWorkbookAs(wb, fileName);
}

/**
 * 4. Export Master Academy Report (All-in-one Multi-sheet workbook)
 */
export function exportFullMasterReportToExcel({
  players = [],
  events = [],
  branches = [],
  paymentMonth = "",
  academyName = "CoachMaster",
  captainName = "",
}) {
  const currentMonth = paymentMonth || localDate().slice(0, 7);
  const wb = XLSX.utils.book_new();

  // 1. Players Sheet
  const playerHeaders = [
    "م",
    "اسم اللاعب",
    "كود اللاعب",
    "الصالة / الفرع",
    "الحزام",
    "تاريخ الميلاد",
    "العمر",
    "رقم الهاتف",
    "هاتف ولي الأمر",
    "الاشتراك الشهري",
    "المدفوع",
    "المتبقي",
    "حالة السداد",
    "مديونية المشتريات",
  ];

  const playerRows = players.map((p, idx) => {
    const pay = getPaymentDetailsFor(p, currentMonth);
    const purchases = getPurchasesSummary(p);
    const age = calculateAge(p.dateOfBirth);
    return [
      idx + 1,
      p.name || "",
      p.code || "",
      p.branch || "غير محدد",
      p.belt || "أبيض",
      p.dateOfBirth || "",
      age !== null ? age : "",
      p.phone || "",
      p.parentPhone || "",
      pay.totalAmount || 0,
      pay.paidAmount || 0,
      pay.remainingAmount || 0,
      pay.status === "paid" ? "مسدد" : pay.status === "partially_paid" ? "جزئي" : "غير مسدد",
      purchases.remainingAmount || 0,
    ];
  });

  const wsPlayers = XLSX.utils.aoa_to_sheet([
    [`أبطال أكاديمية ${academyName} - كشف شهر ${currentMonth}`],
    [],
    playerHeaders,
    ...playerRows,
  ]);
  formatWorksheet(wsPlayers, [playerHeaders, ...playerRows]);
  XLSX.utils.book_append_sheet(wb, wsPlayers, "أبطال الأكاديمية");

  // 2. Events Sheet
  const eventHeaders = [
    "م",
    "اسم الفعالية",
    "النوع",
    "التاريخ",
    "المكان",
    "رسوم الفرد",
    "المشتركين",
    "الإيراد المتوقع",
    "المحصل",
    "المتبقي",
  ];

  const eventRows = events.map((ev, idx) => {
    const parts = Array.isArray(ev.participants) ? ev.participants : [];
    const totalRev = parts.reduce((s, p) => s + Number(p.totalAmount ?? ev.fee ?? 100), 0);
    const paidRev = parts.reduce((s, p) => s + Number(p.paidAmount ?? 0), 0);
    return [
      idx + 1,
      ev.title || "",
      EVENT_TYPE_AR[ev.type] || ev.type || "أخرى",
      ev.date || "",
      ev.location || "غير محدد",
      ev.fee || 0,
      parts.length,
      totalRev,
      paidRev,
      Math.max(0, totalRev - paidRev),
    ];
  });

  const wsEvents = XLSX.utils.aoa_to_sheet([
    [`سجل فعاليات وبطولات ${academyName}`],
    [],
    eventHeaders,
    ...eventRows,
  ]);
  formatWorksheet(wsEvents, [eventHeaders, ...eventRows]);
  XLSX.utils.book_append_sheet(wb, wsEvents, "سجل الفعاليات");

  // 3. Branches Sheet
  const branchHeaders = [
    "الصالة / الفرع",
    "عدد اللاعبين",
    "المسددين",
    "غير المسددين",
    "إجمالي الاشتراكات",
    "المحصل",
    "المتبقي",
  ];

  const branchList = branches.length > 0 ? branches.map((b) => b.name) : [...new Set(players.map((p) => p.branch).filter(Boolean))];
  const branchRows = branchList.map((branchName) => {
    const bPlayers = players.filter((p) => p.branch === branchName);
    let total = 0, paid = 0, rem = 0, pCount = 0, uCount = 0;
    bPlayers.forEach((p) => {
      const pay = getPaymentDetailsFor(p, currentMonth);
      total += pay.totalAmount || 0;
      paid += pay.paidAmount || 0;
      rem += pay.remainingAmount || 0;
      if (pay.status === "paid") pCount++;
      else uCount++;
    });
    return [branchName, bPlayers.length, pCount, uCount, total, paid, rem];
  });

  const wsBranches = XLSX.utils.aoa_to_sheet([
    [`إحصائيات الصالات والفروع - ${academyName}`],
    [],
    branchHeaders,
    ...branchRows,
  ]);
  formatWorksheet(wsBranches, [branchHeaders, ...branchRows]);
  XLSX.utils.book_append_sheet(wb, wsBranches, "إحصائيات الفروع");

  const fileName = `تقرير_شامل_${academyName}_${currentMonth}.xlsx`;
  saveWorkbookAs(wb, fileName);
}
