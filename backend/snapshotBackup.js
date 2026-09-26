import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb.js";

const DATA_DIR = path.join(process.cwd(), ".data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const CLOUD_DIR = path.join(DATA_DIR, "cloud_backups");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(CLOUD_DIR)) fs.mkdirSync(CLOUD_DIR, { recursive: true });
}

function sanitizeDoc(doc, ownerId) {
  const sanitized = { ...doc, ownerId };
  if (sanitized._id) {
    try {
      if (typeof sanitized._id === "string" && sanitized._id.length === 24) {
        sanitized._id = new ObjectId(sanitized._id);
      } else if (typeof sanitized._id === "object" && sanitized._id.$oid) {
        sanitized._id = new ObjectId(sanitized._id.$oid);
      } else if (!(sanitized._id instanceof ObjectId)) {
        sanitized._id = new ObjectId();
      }
    } catch {
      sanitized._id = new ObjectId();
    }
  } else {
    sanitized._id = new ObjectId();
  }
  return sanitized;
}

export function getAvailableSnapshots(ownerId) {
  ensureDirs();
  const list = [];

  // 1. Scan Cloud backups
  if (fs.existsSync(CLOUD_DIR)) {
    const cloudFiles = fs.readdirSync(CLOUD_DIR).filter((f) => f.endsWith(".json"));
    for (const f of cloudFiles) {
      try {
        const fullPath = path.join(CLOUD_DIR, f);
        const stats = fs.statSync(fullPath);
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
        const data = content?.data || content;

        const players = Array.isArray(data.players)
          ? data.players.filter((p) => !ownerId || !p.ownerId || p.ownerId === ownerId)
          : [];
        const branches = Array.isArray(data.branches)
          ? data.branches.filter((b) => !ownerId || !b.ownerId || b.ownerId === ownerId)
          : [];
        const events = Array.isArray(data.events)
          ? data.events.filter((e) => !ownerId || !e.ownerId || e.ownerId === ownerId)
          : [];

        const dateObj = content.exportedAt ? new Date(content.exportedAt) : stats.mtime;
        const arabicDate = new Intl.DateTimeFormat("ar-EG", {
          timeZone: "Africa/Cairo",
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(dateObj);

        const arabicTime = new Intl.DateTimeFormat("ar-EG", {
          timeZone: "Africa/Cairo",
          hour: "2-digit",
          minute: "2-digit",
        }).format(dateObj);

        list.push({
          id: `cloud:${f}`,
          filename: f,
          source: "cloud_backup",
          title: "نسخة سحابية محفوظة (Gmail / Cloud)",
          date: arabicDate,
          time: arabicTime,
          timestamp: dateObj.getTime(),
          playersCount: players.length,
          branchesCount: branches.length,
          eventsCount: events.length,
          sizeKb: Math.max(1, Math.round(stats.size / 1024)),
        });
      } catch (err) {
        console.warn("Could not parse cloud backup:", f, err?.message);
      }
    }
  }

  // 2. Scan Automatic Local Snapshots
  if (fs.existsSync(BACKUP_DIR)) {
    const backupFiles = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"));
    for (const f of backupFiles) {
      try {
        const fullPath = path.join(BACKUP_DIR, f);
        const stats = fs.statSync(fullPath);
        const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));

        const players = Array.isArray(content.players)
          ? content.players.filter((p) => !ownerId || !p.ownerId || p.ownerId === ownerId)
          : [];
        const branches = Array.isArray(content.branches)
          ? content.branches.filter((b) => !ownerId || !b.ownerId || b.ownerId === ownerId)
          : [];
        const events = Array.isArray(content.events)
          ? content.events.filter((e) => !ownerId || !e.ownerId || e.ownerId === ownerId)
          : [];

        const dateObj = stats.mtime;
        const arabicDate = new Intl.DateTimeFormat("ar-EG", {
          timeZone: "Africa/Cairo",
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(dateObj);

        const arabicTime = new Intl.DateTimeFormat("ar-EG", {
          timeZone: "Africa/Cairo",
          hour: "2-digit",
          minute: "2-digit",
        }).format(dateObj);

        list.push({
          id: `local:${f}`,
          filename: f,
          source: "auto_snapshot",
          title: "نسخة تلقائية لنظام الدوجو (Snapshot)",
          date: arabicDate,
          time: arabicTime,
          timestamp: dateObj.getTime(),
          playersCount: players.length,
          branchesCount: branches.length,
          eventsCount: events.length,
          sizeKb: Math.max(1, Math.round(stats.size / 1024)),
        });
      } catch (err) {
        console.warn("Could not parse snapshot file:", f, err?.message);
      }
    }
  }

  // Sort descending (newest first)
  list.sort((a, b) => b.timestamp - a.timestamp);

  // Mark the latest
  if (list.length > 0) {
    list[0].isLatest = true;
  }

  return list;
}

export async function restoreSnapshotById(snapshotId, ownerId) {
  ensureDirs();
  let targetPath = null;

  if (snapshotId.startsWith("cloud:")) {
    const filename = snapshotId.replace("cloud:", "");
    targetPath = path.join(CLOUD_DIR, filename);
  } else if (snapshotId.startsWith("local:")) {
    const filename = snapshotId.replace("local:", "");
    targetPath = path.join(BACKUP_DIR, filename);
  } else {
    // Try latest available
    const snapshots = getAvailableSnapshots(ownerId);
    if (snapshots.length === 0) {
      throw new Error("لا توجد نسخ احتياطية محفوظة للاسترجاع");
    }
    return restoreSnapshotById(snapshots[0].id, ownerId);
  }

  if (!fs.existsSync(targetPath)) {
    throw new Error("ملف النسخة الاحتياطية غير موجود على الخادم");
  }

  const raw = fs.readFileSync(targetPath, "utf-8");
  const parsed = JSON.parse(raw);
  const backupData = parsed?.data || parsed;

  let players = [];
  let branches = [];
  let events = [];

  if (Array.isArray(backupData)) {
    players = backupData;
  } else if (backupData && typeof backupData === "object") {
    players = Array.isArray(backupData.players) ? backupData.players : [];
    branches = Array.isArray(backupData.branches) ? backupData.branches : [];
    events = Array.isArray(backupData.events) ? backupData.events : [];
  }

  // Filter if from full multitenant dump
  const targetPlayers = players.filter((p) => !ownerId || !p.ownerId || p.ownerId === ownerId);
  const targetBranches = branches.filter((b) => !ownerId || !b.ownerId || b.ownerId === ownerId);
  const targetEvents = events.filter((e) => !ownerId || !e.ownerId || e.ownerId === ownerId);

  if (!targetPlayers.length && !targetBranches.length && !targetEvents.length) {
    throw new Error("هذه النسخة لا تحتوي على بيانات مسجلة لهذا الحساب");
  }

  const safeBranches = targetBranches.map((b) => sanitizeDoc(b, ownerId));
  const safePlayers = targetPlayers.map((p) => sanitizeDoc(p, ownerId));
  const safeEvents = targetEvents.map((e) => sanitizeDoc(e, ownerId));

  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  // 1. Delete existing records for this owner
  const pCol = db.collection("players");
  const bCol = db.collection("branches");
  const eCol = db.collection("events");

  if (typeof pCol.deleteMany === "function") {
    await pCol.deleteMany({ ownerId });
  } else {
    const existing = await pCol.find({ ownerId }).toArray();
    for (const doc of existing) await pCol.deleteOne({ _id: doc._id, ownerId });
  }

  if (typeof bCol.deleteMany === "function") {
    await bCol.deleteMany({ ownerId });
  } else {
    const existing = await bCol.find({ ownerId }).toArray();
    for (const doc of existing) await bCol.deleteOne({ _id: doc._id, ownerId });
  }

  if (typeof eCol.deleteMany === "function") {
    await eCol.deleteMany({ ownerId });
  } else {
    const existing = await eCol.find({ ownerId }).toArray();
    for (const doc of existing) await eCol.deleteOne({ _id: doc._id, ownerId });
  }

  // 2. Insert restored items
  if (safeBranches.length > 0) {
    if (typeof bCol.insertMany === "function") await bCol.insertMany(safeBranches);
    else for (const b of safeBranches) await bCol.insertOne(b);
  }

  if (safePlayers.length > 0) {
    if (typeof pCol.insertMany === "function") await pCol.insertMany(safePlayers);
    else for (const p of safePlayers) await pCol.insertOne(p);
  }

  if (safeEvents.length > 0) {
    if (typeof eCol.insertMany === "function") await eCol.insertMany(safeEvents);
    else for (const e of safeEvents) await eCol.insertOne(e);
  }

  return {
    success: true,
    message: "تم استرجاع النسخة بنجاح!",
    stats: {
      playersRestored: safePlayers.length,
      branchesRestored: safeBranches.length,
      eventsRestored: safeEvents.length,
    },
  };
}

export async function createCloudSnapshot(ownerId, userEmail = "") {
  ensureDirs();
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  const [players, branches, events] = await Promise.all([
    db.collection("players").find({ ownerId }).toArray(),
    db.collection("branches").find({ ownerId }).toArray(),
    db.collection("events").find({ ownerId }).toArray(),
  ]);

  const now = new Date();
  const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(now);
  const timeStr = `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
  const filename = `reaction_dojo_cloud_${dateStr}_${timeStr}.json`;

  const backupPayload = {
    system: "Re_action DOJO",
    version: "1.0",
    type: "cloud_backup",
    exportedAt: now.toISOString(),
    ownerId,
    userEmail: userEmail || "mg0447837@gmail.com",
    stats: {
      playersCount: players.length,
      branchesCount: branches.length,
      eventsCount: events.length,
    },
    data: {
      branches,
      players,
      events,
    },
  };

  const fullPath = path.join(CLOUD_DIR, filename);
  fs.writeFileSync(fullPath, JSON.stringify(backupPayload, null, 2), "utf-8");

  // Keep at most 30 recent cloud backups, prune older
  try {
    const files = fs
      .readdirSync(CLOUD_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort();
    if (files.length > 30) {
      files.slice(0, files.length - 30).forEach((oldFile) => {
        try { fs.unlinkSync(path.join(CLOUD_DIR, oldFile)); } catch {}
      });
    }
  } catch {}

  return {
    success: true,
    message: "تم حفظ النسخة السحابية بنجاح!",
    filename,
    stats: {
      playersCount: players.length,
      branchesCount: branches.length,
      eventsCount: events.length,
    },
  };
}

