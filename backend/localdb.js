import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "local_db.json");
const BAK_FILE = path.join(DATA_DIR, "local_db.bak.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

function parseAndNormalizeData(raw) {
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("Invalid root data");
  if (!Array.isArray(data.users)) data.users = [];
  if (!Array.isArray(data.branches)) data.branches = [];
  if (!Array.isArray(data.players)) data.players = [];
  if (!Array.isArray(data.events)) data.events = [];

  // Ensure _id are ObjectId instances
  data.users.forEach((u) => {
    if (u._id && typeof u._id === "string") u._id = new ObjectId(u._id);
  });
  data.branches.forEach((b) => {
    if (b._id && typeof b._id === "string") b._id = new ObjectId(b._id);
  });
  data.players.forEach((p) => {
    if (p._id && typeof p._id === "string") p._id = new ObjectId(p._id);
  });
  data.events.forEach((e) => {
    if (e._id && typeof e._id === "string") e._id = new ObjectId(e._id);
  });

  return data;
}

function loadData() {
  ensureDirs();

  // 1. Try reading the main file
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      if (raw && raw.trim().length > 0) {
        return parseAndNormalizeData(raw);
      }
    } catch (err) {
      console.error("⚠️ Main database file corrupted or unreadable. Attempting backup recovery...", err?.message);
    }
  }

  // 2. Try shadow backup file
  if (fs.existsSync(BAK_FILE)) {
    try {
      const rawBak = fs.readFileSync(BAK_FILE, "utf-8");
      if (rawBak && rawBak.trim().length > 0) {
        const recovered = parseAndNormalizeData(rawBak);
        console.warn("✓ Successfully recovered database from shadow backup (local_db.bak.json)");
        fs.writeFileSync(DB_FILE, rawBak, "utf-8");
        return recovered;
      }
    } catch (errBak) {
      console.error("Shadow backup recovery failed:", errBak?.message);
    }
  }

  // 3. Try latest file in backups directory
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      const backupFiles = fs
        .readdirSync(BACKUP_DIR)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse();

      for (const bFile of backupFiles) {
        try {
          const rawArchive = fs.readFileSync(path.join(BACKUP_DIR, bFile), "utf-8");
          const recovered = parseAndNormalizeData(rawArchive);
          console.warn(`✓ Successfully recovered database from archive backup (${bFile})`);
          fs.writeFileSync(DB_FILE, rawArchive, "utf-8");
          return recovered;
        } catch {}
      }
    }
  } catch (errArchive) {
    console.error("Archive recovery failed:", errArchive?.message);
  }

  // 4. Clean initial state if fresh install
  const initialData = { users: [], branches: [], players: [], events: [] };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } catch {}
  return initialData;
}

let lastBackupTimestamp = 0;

function saveData(data) {
  try {
    ensureDirs();

    // Guard: Do not wipe existing data with empty invalid state
    if (!data || typeof data !== "object") return;
    if (!Array.isArray(data.users) || !Array.isArray(data.players)) return;

    const serialized = JSON.stringify(data, null, 2);
    const tmpFile = path.join(
      DATA_DIR,
      `local_db_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.tmp`
    );

    // 1. Atomic write: write to temp file first
    fs.writeFileSync(tmpFile, serialized, "utf-8");

    // 2. Update immediate shadow backup
    try {
      fs.writeFileSync(BAK_FILE, serialized, "utf-8");
    } catch {}

    // 3. Atomic rename to guarantee zero file corruption on crash/power cut
    fs.renameSync(tmpFile, DB_FILE);

    // 4. Create periodic timestamped backup snapshot (at most once every 30 minutes)
    const now = Date.now();
    if (now - lastBackupTimestamp > 30 * 60 * 1000) {
      lastBackupTimestamp = now;
      const dateStr = new Date().toISOString().slice(0, 13).replace("T", "_"); // YYYY-MM-DD_HH
      const snapshotPath = path.join(BACKUP_DIR, `snapshot_${dateStr}.json`);
      try {
        fs.writeFileSync(snapshotPath, serialized, "utf-8");

        // Keep at most 20 recent snapshots, prune older
        const files = fs
          .readdirSync(BACKUP_DIR)
          .filter((f) => f.endsWith(".json"))
          .sort();
        if (files.length > 20) {
          files.slice(0, files.length - 20).forEach((oldFile) => {
            try {
              fs.unlinkSync(path.join(BACKUP_DIR, oldFile));
            } catch {}
          });
        }
      } catch {}
    }
  } catch (err) {
    console.error("Critical error in saveData (localdb):", err);
  }
}

let store = null;
function getStore() {
  if (!store) {
    store = loadData();
  }
  return store;
}

function matchId(a, b) {
  if (!a || !b) return false;
  if (typeof b === "object" && Array.isArray(b.$in)) {
    const aStr = a.toString();
    return b.$in.some((item) => item && item.toString() === aStr);
  }
  return a.toString() === b.toString();
}

export function getLocalDbClient() {
  return {
    db(_dbName) {
      return {
        collection(collectionName) {
          const currentData = getStore();

          return {
            async createIndex() {
              return "index_ok";
            },

            async countDocuments(filter = {}) {
              if (collectionName === "players") {
                return currentData.players.filter((p) => {
                  if (filter.ownerId && p.ownerId !== filter.ownerId) return false;
                  if (filter.branch && p.branch !== filter.branch) return false;
                  return true;
                }).length;
              }
              if (collectionName === "events") {
                return (currentData.events || []).filter((e) => {
                  if (filter.ownerId && e.ownerId !== filter.ownerId) return false;
                  return true;
                }).length;
              }
              return 0;
            },

            async distinct(field, filter = {}) {
              if (collectionName === "players") {
                const values = currentData.players
                  .filter((p) => {
                    if (filter.ownerId && p.ownerId !== filter.ownerId) return false;
                    return true;
                  })
                  .map((p) => p[field])
                  .filter(Boolean);
                return Array.from(new Set(values));
              }
              return [];
            },

            find(filter = {}) {
              let items = [];
              if (collectionName === "users") {
                items = currentData.users;
              } else if (collectionName === "branches") {
                items = currentData.branches.filter((b) => {
                  if (filter.ownerId && b.ownerId !== filter.ownerId) return false;
                  return true;
                });

                // Pre-seed default karate branches if coach has none
                if (items.length === 0 && filter.ownerId) {
                  const defaultBranches = [
                    {
                      _id: new ObjectId(),
                      ownerId: filter.ownerId,
                      name: "صالة الكاتا الرئيسية",
                      createdAt: new Date(),
                    },
                    {
                      _id: new ObjectId(),
                      ownerId: filter.ownerId,
                      name: "دوجو الكوميتيه للأبطال",
                      createdAt: new Date(),
                    },
                  ];
                  currentData.branches.push(...defaultBranches);
                  saveData(currentData);
                  items = defaultBranches;
                }
              } else if (collectionName === "players") {
                items = currentData.players.filter((p) => {
                  if (filter.ownerId && p.ownerId !== filter.ownerId) return false;
                  if (filter._id && !matchId(p._id, filter._id)) return false;
                  return true;
                });
              } else if (collectionName === "events") {
                items = (currentData.events || []).filter((e) => {
                  if (filter.ownerId && e.ownerId !== filter.ownerId) return false;
                  if (filter._id && !matchId(e._id, filter._id)) return false;
                  return true;
                });
              }

              return {
                sort(sortCriteria) {
                  return {
                    async toArray() {
                      const copy = [...items];
                      if (sortCriteria?.date === -1) {
                        copy.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
                      } else if (sortCriteria?.createdAt === -1) {
                        copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                      } else if (sortCriteria?.createdAt === 1) {
                        copy.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                      }
                      return copy;
                    },
                  };
                },
                async toArray() {
                  return [...items];
                },
              };
            },

            async findOne(filter = {}) {
              if (collectionName === "users") {
                return (
                  currentData.users.find((u) => {
                    if (filter.email && u.email?.toLowerCase() !== filter.email.toLowerCase()) {
                      return false;
                    }
                    if (filter._id && !matchId(u._id, filter._id)) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "branches") {
                return (
                  currentData.branches.find((b) => {
                    if (filter.name && b.name !== filter.name) return false;
                    if (filter.ownerId && b.ownerId !== filter.ownerId) return false;
                    if (filter._id && !matchId(b._id, filter._id)) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "players") {
                return (
                  currentData.players.find((p) => {
                    if (filter.ownerId && p.ownerId !== filter.ownerId) return false;
                    if (filter._id && !matchId(p._id, filter._id)) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "events") {
                return (
                  (currentData.events || []).find((e) => {
                    if (filter.ownerId && e.ownerId !== filter.ownerId) return false;
                    if (filter._id && !matchId(e._id, filter._id)) return false;
                    return true;
                  }) || null
                );
              }

              return null;
            },

            async insertOne(doc) {
              const _id = doc._id || new ObjectId();
              const newDoc = { ...doc, _id };

              if (collectionName === "users") {
                currentData.users.push(newDoc);
              } else if (collectionName === "branches") {
                currentData.branches.push(newDoc);
              } else if (collectionName === "players") {
                currentData.players.push(newDoc);
              } else if (collectionName === "events") {
                if (!Array.isArray(currentData.events)) currentData.events = [];
                currentData.events.push(newDoc);
              }

              saveData(currentData);
              return { insertedId: _id };
            },

            async insertMany(docs = []) {
              if (!Array.isArray(docs) || docs.length === 0) {
                return { insertedCount: 0, insertedIds: {} };
              }

              const insertedIds = {};
              const processedDocs = docs.map((doc, idx) => {
                const _id = doc._id || new ObjectId();
                insertedIds[idx] = _id;
                return { ...doc, _id };
              });

              if (collectionName === "users") {
                currentData.users.push(...processedDocs);
              } else if (collectionName === "branches") {
                currentData.branches.push(...processedDocs);
              } else if (collectionName === "players") {
                currentData.players.push(...processedDocs);
              } else if (collectionName === "events") {
                if (!Array.isArray(currentData.events)) currentData.events = [];
                currentData.events.push(...processedDocs);
              }

              saveData(currentData);
              return { insertedCount: processedDocs.length, insertedIds };
            },

            async updateOne(filter = {}, update = {}) {
              if (collectionName === "players") {
                const player = currentData.players.find(
                  (p) => filter.ownerId === p.ownerId && matchId(p._id, filter._id)
                );
                if (player) {
                  if (update.$pull?.attendance) {
                    const filterDate = update.$pull.attendance.date;
                    player.attendance = (player.attendance || []).filter(
                      (a) => a.date !== filterDate
                    );
                  }
                  if (update.$set) {
                    Object.assign(player, update.$set);
                  }
                  saveData(currentData);
                  return { modifiedCount: 1 };
                }
              }
              if (collectionName === "events") {
                const ev = (currentData.events || []).find(
                  (e) => filter.ownerId === e.ownerId && matchId(e._id, filter._id)
                );
                if (ev) {
                  if (update.$set) {
                    Object.assign(ev, update.$set);
                  }
                  if (update.$push?.participants) {
                    if (!Array.isArray(ev.participants)) ev.participants = [];
                    if (update.$push.participants.$each) {
                      ev.participants.push(...update.$push.participants.$each);
                    } else {
                      ev.participants.push(update.$push.participants);
                    }
                  }
                  if (update.$pull?.participants) {
                    const removeId = update.$pull.participants.playerId;
                    ev.participants = (ev.participants || []).filter(
                      (p) => p.playerId?.toString() !== removeId?.toString()
                    );
                  }
                  saveData(currentData);
                  return { modifiedCount: 1 };
                }
              }
              return { modifiedCount: 0 };
            },

            async findOneAndUpdate(filter = {}, update = {}, _options = {}) {
              if (collectionName === "players") {
                const player = currentData.players.find(
                  (p) => filter.ownerId === p.ownerId && matchId(p._id, filter._id)
                );
                if (player) {
                  if (update.$pull?.attendance) {
                    const filterDate = update.$pull.attendance.date;
                    player.attendance = (player.attendance || []).filter(
                      (a) => a.date !== filterDate
                    );
                  }
                  if (update.$push?.attendance) {
                    if (!Array.isArray(player.attendance)) player.attendance = [];
                    player.attendance.push(update.$push.attendance);
                  }
                  if (update.$set) {
                    Object.assign(player, update.$set);
                  }
                  saveData(currentData);
                  return { ...player };
                }
              }
              return null;
            },

            async deleteOne(filter = {}) {
              let list = [];
              if (collectionName === "branches") list = currentData.branches;
              if (collectionName === "players") list = currentData.players;
              if (collectionName === "events") list = currentData.events || [];

              const idx = list.findIndex((item) => {
                if (filter.ownerId && item.ownerId !== filter.ownerId) return false;
                if (filter.name && item.name !== filter.name) return false;
                if (filter._id && !matchId(item._id, filter._id)) return false;
                return true;
              });

              if (idx !== -1) {
                list.splice(idx, 1);
                saveData(currentData);
                return { deletedCount: 1 };
              }
              return { deletedCount: 0 };
            },

            async deleteMany(filter = {}) {
              let list = [];
              if (collectionName === "branches") list = currentData.branches;
              else if (collectionName === "players") list = currentData.players;
              else if (collectionName === "events") list = currentData.events || [];
              else if (collectionName === "users") list = currentData.users;

              const initialCount = list.length;
              const remaining = list.filter((item) => {
                if (filter.ownerId && !matchId(item.ownerId, filter.ownerId)) return true;
                if (filter._id && !matchId(item._id, filter._id)) return true;
                return false; // delete item
              });

              const deletedCount = initialCount - remaining.length;
              if (collectionName === "branches") currentData.branches = remaining;
              else if (collectionName === "players") currentData.players = remaining;
              else if (collectionName === "events") currentData.events = remaining;
              else if (collectionName === "users") currentData.users = remaining;

              if (deletedCount > 0) {
                saveData(currentData);
              }
              return { deletedCount };
            },
          };
        },
      };
    },
  };
}
