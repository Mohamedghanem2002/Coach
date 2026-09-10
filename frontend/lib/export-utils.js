import { paymentStatusFor } from "./dashboard-utils";

/**
 * Escapes a cell value for standard CSV format
 */
function escapeCSV(value) {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports a list of players to CSV with UTF-8 BOM for full Arabic character support in Excel
 */
export function exportPlayersToCSV(
  players = [],
  paymentMonth = "",
  customFilename = ""
) {
  if (!players || !players.length) return false;

  const headers = [
    "اسم اللاعب",
    "الفرع / الصالة",
    "العمر",
    "تاريخ الميلاد",
    "هاتف ولي الأمر",
    `اشتراك شهر (${paymentMonth || "الحالي"})`,
    "مرات الحضور",
    "إجمالي الحصص",
    "نسبة الحضور %",
    "تاريخ التسجيل",
  ];

  const rows = players.map((player) => {
    const guardianPhone =
      player.guardianPhone ||
      player.parentPhone ||
      player.guardianMobile ||
      player.mobile ||
      player.phone ||
      "-";

    const attendance = Array.isArray(player.attendance) ? player.attendance : [];
    const presentCount = attendance.filter((a) => a.status === "present").length;
    const totalAttendance = attendance.length;
    const attendanceRate = totalAttendance
      ? Math.round((presentCount / totalAttendance) * 100)
      : 0;

    const paymentStatus = paymentStatusFor(player, paymentMonth);
    const paymentLabel = paymentStatus === "paid" ? "مدفوع ✓" : "لم يدفع";

    const regDate = player.createdAt
      ? new Date(player.createdAt).toLocaleDateString("ar-EG")
      : "-";

    return [
      escapeCSV(player.name),
      escapeCSV(player.branch),
      escapeCSV(player.age ? `${player.age} سنة` : "-"),
      escapeCSV(player.dateOfBirth || "-"),
      escapeCSV(guardianPhone),
      escapeCSV(paymentLabel),
      escapeCSV(presentCount),
      escapeCSV(totalAttendance),
      escapeCSV(`${attendanceRate}%`),
      escapeCSV(regDate),
    ].join(",");
  });

  // Prepend UTF-8 BOM (\uFEFF) to ensure Microsoft Excel displays Arabic text properly
  const csvContent = "\uFEFF" + [headers.map(escapeCSV).join(","), ...rows].join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename =
    customFilename || `كشف_لاعبي_الأكاديمية_${dateStr}.csv`;

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
}
