import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";
import clientPromise from "./mongodb.js";

const DATA_DIR = path.join(process.cwd(), ".data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const CLOUD_DIR = path.join(DATA_DIR, "cloud_backups");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
    if (!fs.existsSync(CLOUD_DIR)) fs.mkdirSync(CLOUD_DIR, { recursive: true });
  } catch {
    // Read-only filesystem in serverless environments (e.g. Vercel) - safe to ignore
  }
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

/**
 * Returns available cloud snapshots and local snapshots.
 * Primary source is MongoDB `cloud_snapshots` collection (works on Vercel / Cloud).
 * Secondary source is local JSON files on disk if readable.
 */
export async function getAvailableSnapshots(ownerId) {
  const list = [];
  const seenTimestamps = new Set();

  // 1. Fetch Cloud Backups from MongoDB database (Primary & Persistent everywhere, including Vercel)
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);
    const dbSnapshots = await db
      .collection("cloud_snapshots")
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .toArray();

    for (const doc of dbSnapshots) {
      const dateObj = doc.createdAt
        ? new Date(doc.createdAt)
        : new Date(doc.exportedAt || Date.now());

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

      const playersCount =
        doc.stats?.playersCount ?? (Array.isArray(doc.data?.players) ? doc.data.players.length : 0);
      const branchesCount =
        doc.stats?.branchesCount ?? (Array.isArray(doc.data?.branches) ? doc.data.branches.length : 0);
      const eventsCount =
        doc.stats?.eventsCount ?? (Array.isArray(doc.data?.events) ? doc.data.events.length : 0);
      const sizeKb = Math.max(1, Math.round(JSON.stringify(doc.data || {}).length / 1024));

      list.push({
        id: `db:${doc._id.toString()}`,
        filename: doc.filename || `${doc._id.toString()}.json`,
        source: "cloud_backup",
        title: doc.title || "نسخة سحابية محفوظة (Gmail / Cloud)",
        date: arabicDate,
        time: arabicTime,
        timestamp: dateObj.getTime(),
        playersCount,
        branchesCount,
        eventsCount,
        sizeKb,
      });
      seenTimestamps.add(dateObj.getTime());
    }
  } catch (dbErr) {
    console.warn("Could not load snapshots from database collection:", dbErr?.message);
  }

  // 2. Scan Cloud directory files on disk (if available in local development)
  try {
    if (fs.existsSync(CLOUD_DIR)) {
      const cloudFiles = fs.readdirSync(CLOUD_DIR).filter((f) => f.endsWith(".json"));
      for (const f of cloudFiles) {
        try {
          const fullPath = path.join(CLOUD_DIR, f);
          const stats = fs.statSync(fullPath);
          const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          const data = content?.data || content;

          const dateObj = content.exportedAt ? new Date(content.exportedAt) : stats.mtime;
          if (seenTimestamps.has(dateObj.getTime())) continue;

          const players = Array.isArray(data.players)
            ? data.players.filter((p) => !ownerId || !p.ownerId || p.ownerId === ownerId)
            : [];
          const branches = Array.isArray(data.branches)
            ? data.branches.filter((b) => !ownerId || !b.ownerId || b.ownerId === ownerId)
            : [];
          const events = Array.isArray(data.events)
            ? data.events.filter((e) => !ownerId || !e.ownerId || e.ownerId === ownerId)
            : [];

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
          seenTimestamps.add(dateObj.getTime());
        } catch {}
      }
    }
  } catch {}

  // 3. Scan Automatic Local Snapshots on disk (if available)
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      const backupFiles = fs.readdirSync(BACKUP_DIR).filter((f) => f.endsWith(".json"));
      for (const f of backupFiles) {
        try {
          const fullPath = path.join(BACKUP_DIR, f);
          const stats = fs.statSync(fullPath);
          const content = JSON.parse(fs.readFileSync(fullPath, "utf-8"));
          const dateObj = stats.mtime;
          if (seenTimestamps.has(dateObj.getTime())) continue;

          const players = Array.isArray(content.players)
            ? content.players.filter((p) => !ownerId || !p.ownerId || p.ownerId === ownerId)
            : [];
          const branches = Array.isArray(content.branches)
            ? content.branches.filter((b) => !ownerId || !b.ownerId || b.ownerId === ownerId)
            : [];
          const events = Array.isArray(content.events)
            ? content.events.filter((e) => !ownerId || !e.ownerId || e.ownerId === ownerId)
            : [];

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
        } catch {}
      }
    }
  } catch {}

  // Sort descending (newest first)
  list.sort((a, b) => b.timestamp - a.timestamp);

  // Mark the latest
  if (list.length > 0) {
    list[0].isLatest = true;
  }

  return list;
}

/**
 * Restores a snapshot by ID for the current owner.
 * Supports:
 * - `db:<id>` (from MongoDB cloud_snapshots collection)
 * - `latest` (picks newest snapshot)
 * - `cloud:<filename>` or `local:<filename>` (from disk or DB match)
 */
export async function restoreSnapshotById(snapshotId, ownerId) {
  const client = await clientPromise;
  const db = client.db(process.env.MONGODB_DB);

  let backupData = null;

  // Case A: From DB snapshot
  if (snapshotId.startsWith("db:")) {
    const rawId = snapshotId.replace("db:", "");
    let queryId;
    try {
      queryId = new ObjectId(rawId);
    } catch {
      queryId = rawId;
    }
    const doc = await db.collection("cloud_snapshots").findOne({
      _id: queryId,
      ownerId,
    });
    if (!doc) {
      throw new Error("النسخة السحابية المطلوبة غير موجودة في قاعدة البيانات");
    }
    backupData = doc.data;
  }
  // Case B: "latest"
  else if (snapshotId === "latest") {
    // Try latest from DB first
    const latestDoc = await db
      .collection("cloud_snapshots")
      .findOne({ ownerId }, { sort: { createdAt: -1 } });

    if (latestDoc && latestDoc.data) {
      backupData = latestDoc.data;
    } else {
      // Try from available snapshots list
      const snapshots = await getAvailableSnapshots(ownerId);
      if (snapshots.length === 0) {
        throw new Error("لا توجد نسخ احتياطية محفوظة للاسترجاع");
      }
      return restoreSnapshotById(snapshots[0].id, ownerId);
    }
  }
  // Case C: From local file or cloud file
  else {
    let targetPath = null;
    if (snapshotId.startsWith("cloud:")) {
      const filename = snapshotId.replace("cloud:", "");
      targetPath = path.join(CLOUD_DIR, filename);
    } else if (snapshotId.startsWith("local:")) {
      const filename = snapshotId.replace("local:", "");
      targetPath = path.join(BACKUP_DIR, filename);
    }

    if (targetPath && fs.existsSync(targetPath)) {
      const raw = fs.readFileSync(targetPath, "utf-8");
      const parsed = JSON.parse(raw);
      backupData = parsed?.data || parsed;
    } else {
      // If file not on disk (e.g. Vercel environment), check if a snapshot in DB matches the filename
      const cleanFilename = snapshotId.replace(/^(cloud|local):/, "");
      const doc = await db.collection("cloud_snapshots").findOne({
        ownerId,
        $or: [
          { filename: cleanFilename },
          { _id: ObjectId.isValid(cleanFilename) ? new ObjectId(cleanFilename) : null },
        ],
      });
      if (doc && doc.data) {
        backupData = doc.data;
      } else {
        throw new Error("ملف النسخة الاحتياطية غير موجود");
      }
    }
  }

  if (!backupData) {
    throw new Error("بيانات النسخة الاحتياطية غير صالحة");
  }

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

  // Filter for ownerId
  const targetPlayers = players.filter((p) => !ownerId || !p.ownerId || p.ownerId === ownerId);
  const targetBranches = branches.filter((b) => !ownerId || !b.ownerId || b.ownerId === ownerId);
  const targetEvents = events.filter((e) => !ownerId || !e.ownerId || e.ownerId === ownerId);

  if (!targetPlayers.length && !targetBranches.length && !targetEvents.length) {
    throw new Error("هذه النسخة لا تحتوي على بيانات مسجلة لهذا الحساب");
  }

  const safeBranches = targetBranches.map((b) => sanitizeDoc(b, ownerId));
  const safePlayers = targetPlayers.map((p) => sanitizeDoc(p, ownerId));
  const safeEvents = targetEvents.map((e) => sanitizeDoc(e, ownerId));

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

/**
 * Creates an instant cloud snapshot without requiring any passwords.
 * Saves directly into MongoDB `cloud_snapshots` collection (works on Vercel).
 * Also writes local mirror file if filesystem is writable.
 */
export async function createCloudSnapshot(ownerId, userEmail = "") {
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
    _id: new ObjectId(),
    system: "Re_action DOJO",
    version: "1.0",
    type: "cloud_backup",
    exportedAt: now.toISOString(),
    createdAt: now,
    ownerId,
    userEmail: userEmail || "mg0447837@gmail.com",
    title: "نسخة سحابية محفوظة (Gmail / Cloud)",
    filename,
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

  // 1. Primary Persistent Storage: Save to database collection `cloud_snapshots`
  await db.collection("cloud_snapshots").insertOne(backupPayload);

  // Prune older snapshots in DB (keep last 30)
  try {
    const allDbSnapshots = await db
      .collection("cloud_snapshots")
      .find({ ownerId })
      .sort({ createdAt: -1 })
      .toArray();

    if (allDbSnapshots.length > 30) {
      const oldIds = allDbSnapshots.slice(30).map((s) => s._id);
      await db.collection("cloud_snapshots").deleteMany({ _id: { $in: oldIds } });
    }
  } catch (pruneErr) {
    console.warn("DB snapshot prune notice:", pruneErr?.message);
  }

  // 2. Secondary local file backup (if filesystem is writable, e.g. local dev)
  try {
    ensureDirs();
    if (fs.existsSync(CLOUD_DIR)) {
      const fullPath = path.join(CLOUD_DIR, filename);
      fs.writeFileSync(fullPath, JSON.stringify(backupPayload, null, 2), "utf-8");

      const files = fs
        .readdirSync(CLOUD_DIR)
        .filter((f) => f.endsWith(".json"))
        .sort();
      if (files.length > 30) {
        files.slice(0, files.length - 30).forEach((oldFile) => {
          try {
            fs.unlinkSync(path.join(CLOUD_DIR, oldFile));
          } catch {}
        });
      }
    }
  } catch {
    // Normal in serverless read-only environment (e.g. Vercel)
  }

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
