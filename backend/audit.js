import clientPromise from "./mongodb";

/**
 * Records an administrative or security audit log in the database.
 * Preserves full history of important actions like academy suspension, reactivation,
 * subscription extensions, and status changes.
 */
export async function recordAuditLog({
  action,
  targetAcademyId,
  targetAcademyName,
  adminEmail,
  adminId,
  details = {},
}) {
  try {
    const client = await clientPromise;
    const auditLogs = client.db(process.env.MONGODB_DB).collection("audit_logs");

    const logEntry = {
      action,
      targetAcademyId: targetAcademyId ? targetAcademyId.toString() : null,
      targetAcademyName: targetAcademyName || "غير محدد",
      adminEmail: adminEmail || "نظام المنصة",
      adminId: adminId ? adminId.toString() : null,
      details,
      createdAt: new Date(),
    };

    await auditLogs.insertOne(logEntry);
    return logEntry;
  } catch (error) {
    console.error("Failed to record audit log:", error);
    return null;
  }
}
