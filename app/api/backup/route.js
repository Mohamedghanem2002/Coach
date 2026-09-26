import { NextResponse } from "next/server";
import { currentUserId } from "../../../backend/tenant";
import clientPromise from "../../../backend/mongodb";
import { ObjectId } from "mongodb";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const [players, branches, events] = await Promise.all([
      db.collection("players").find({ ownerId }).toArray(),
      db.collection("branches").find({ ownerId }).toArray(),
      db.collection("events").find({ ownerId }).toArray(),
    ]);

    const backupPayload = {
      system: "Re_action DOJO",
      version: "1.0",
      type: "full_database_backup",
      exportedAt: new Date().toISOString(),
      ownerId,
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

    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `reaction_dojo_backup_${dateStr}.json`;

    return new Response(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    console.error("Backup export error:", error);
    return NextResponse.json(
      { error: "تعذر تصدير النسخة الاحتياطية", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}

async function safeDeleteMany(collection, filter) {
  if (typeof collection.deleteMany === "function") {
    try {
      return await collection.deleteMany(filter);
    } catch (e) {
      console.warn("deleteMany fallback triggered:", e?.message);
    }
  }
  // Universal fallback for any db driver or cached in-memory client
  const docs = await collection.find(filter).toArray();
  for (const doc of docs) {
    if (doc._id) {
      await collection.deleteOne({ _id: doc._id, ownerId: filter.ownerId });
    }
  }
}

async function safeInsertMany(collection, docs) {
  if (!Array.isArray(docs) || docs.length === 0) return;
  if (typeof collection.insertMany === "function") {
    try {
      return await collection.insertMany(docs);
    } catch (e) {
      console.warn("insertMany fallback triggered:", e?.message);
    }
  }
  // Universal fallback
  for (const doc of docs) {
    await collection.insertOne(doc);
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

export async function POST(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const body = await request.json();
    const backupData = body?.data || body;

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

    if (!players.length && !branches.length && !events.length) {
      return NextResponse.json(
        { error: "ملف النسخة الاحتياطية فارغ أو لا يحتوي على بيانات صالحة" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const safeBranches = branches.map((b) => sanitizeDoc(b, ownerId));
    const safePlayers = players.map((p) => sanitizeDoc(p, ownerId));
    const safeEvents = events.map((e) => sanitizeDoc(e, ownerId));

    // 1. Delete existing records for this owner safely
    await safeDeleteMany(db.collection("players"), { ownerId });
    await safeDeleteMany(db.collection("branches"), { ownerId });
    await safeDeleteMany(db.collection("events"), { ownerId });

    // 2. Insert new records from backup safely
    if (safeBranches.length > 0) {
      await safeInsertMany(db.collection("branches"), safeBranches);
    }
    if (safePlayers.length > 0) {
      await safeInsertMany(db.collection("players"), safePlayers);
    }
    if (safeEvents.length > 0) {
      await safeInsertMany(db.collection("events"), safeEvents);
    }

    return NextResponse.json({
      success: true,
      message: "تمت استعادة النسخة الاحتياطية بنجاح",
      stats: {
        playersRestored: safePlayers.length,
        branchesRestored: safeBranches.length,
        eventsRestored: safeEvents.length,
      },
    });
  } catch (error) {
    console.error("Backup restore error:", error);
    try {
      const logDir = path.join(process.cwd(), ".data");
      if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
      fs.appendFileSync(
        path.join(logDir, "restore_error.log"),
        `[${new Date().toISOString()}] ${error?.stack || error?.message || error}\n`
      );
    } catch {}
    return NextResponse.json(
      { error: "تعذر استعادة النسخة الاحتياطية", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
