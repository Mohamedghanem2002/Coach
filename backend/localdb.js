import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "local_db.json");
const BAK_FILE = path.join(DATA_DIR, "local_db.bak.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");

function ensureDirs() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  } catch {}
}

function parseAndNormalizeData(raw) {
  const data = JSON.parse(raw);
  if (!data || typeof data !== "object") throw new Error("Invalid root data");
  if (!Array.isArray(data.users)) data.users = [];
  if (!Array.isArray(data.branches)) data.branches = [];
  if (!Array.isArray(data.players)) data.players = [];
  if (!Array.isArray(data.events)) data.events = [];
  if (!Array.isArray(data.cloud_snapshots)) data.cloud_snapshots = [];
  if (!Array.isArray(data.audit_logs)) data.audit_logs = [];

  const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase();

  // Ensure _id are ObjectId instances
  data.users.forEach((u) => {
    if (u._id && typeof u._id === "string") u._id = new ObjectId(u._id);
    if (!u.academyName) u.academyName = "Re_action DOJO";
    if (u.email && u.email.toLowerCase() === adminEmail) {
      u.role = "admin";
    } else if (!u.role) {
      u.role = "user";
    }
    if (!u.status) u.status = "active";
    if (!u.subscriptionStatus) u.subscriptionStatus = "active";
    if (!u.subscriptionPlan) u.subscriptionPlan = "standard";
    if (!u.subscriptionExpiresAt) {
      const base = u.createdAt ? new Date(u.createdAt) : new Date();
      u.subscriptionExpiresAt = new Date(base.getTime() + 60 * 24 * 60 * 60 * 1000);
    }
    if (u.subscriptionPaid === undefined) u.subscriptionPaid = true;
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
  data.cloud_snapshots.forEach((s) => {
    if (s._id && typeof s._id === "string") s._id = new ObjectId(s._id);
  });
  data.audit_logs.forEach((a) => {
    if (a._id && typeof a._id === "string") a._id = new ObjectId(a._id);
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
  const initialData = { users: [], branches: [], players: [], events: [], cloud_snapshots: [], audit_logs: [] };
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  } catch {}
  return initialData;
}

let lastBackupTimestamp = 0;
let cachedStore = null;
let lastMtime = 0;

function saveData(data) {
  try {
    ensureDirs();

    // Guard: Do not wipe existing data with empty invalid state
    if (!data || typeof data !== "object") return;
    if (!Array.isArray(data.users) || !Array.isArray(data.players)) return;

    cachedStore = data;

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
    try {
      lastMtime = fs.statSync(DB_FILE).mtimeMs;
    } catch {
      lastMtime = Date.now();
    }

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

function getStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const stats = fs.statSync(DB_FILE);
      if (cachedStore && stats.mtimeMs <= lastMtime) {
        return cachedStore;
      }
      lastMtime = stats.mtimeMs;
    }
  } catch {}
  cachedStore = loadData();
  return cachedStore;
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
              if (collectionName === "users") {
                return currentData.users.filter((u) => {
                  if (filter.role) {
                    if (typeof filter.role === "object" && filter.role.$ne) {
                      if (u.role === filter.role.$ne) return false;
                    } else if (u.role !== filter.role) return false;
                  }
                  if (filter.status && u.status !== filter.status) return false;
                  if (filter.subscriptionStatus && u.subscriptionStatus !== filter.subscriptionStatus) return false;
                  return true;
                }).length;
              }
              if (collectionName === "players") {
                return currentData.players.filter((p) => {
                  if (filter.ownerId && p.ownerId !== filter.ownerId && !matchId(p.ownerId, filter.ownerId)) return false;
                  if (filter.branch && p.branch !== filter.branch) return false;
                  return true;
                }).length;
              }
              if (collectionName === "branches") {
                return currentData.branches.filter((b) => {
                  if (filter.ownerId && b.ownerId !== filter.ownerId && !matchId(b.ownerId, filter.ownerId)) return false;
                  return true;
                }).length;
              }
              if (collectionName === "events") {
                return (currentData.events || []).filter((e) => {
                  if (filter.ownerId && e.ownerId !== filter.ownerId && !matchId(e.ownerId, filter.ownerId)) return false;
                  return true;
                }).length;
              }
              if (collectionName === "audit_logs") {
                return (currentData.audit_logs || []).filter((a) => {
                  if (filter.targetAcademyId && a.targetAcademyId !== filter.targetAcademyId && !matchId(a.targetAcademyId, filter.targetAcademyId)) return false;
                  if (filter.action && a.action !== filter.action) return false;
                  return true;
                }).length;
              }
              return 0;
            },

            async distinct(field, filter = {}) {
              if (collectionName === "players") {
                const values = currentData.players
                  .filter((p) => {
                    if (filter.ownerId && p.ownerId !== filter.ownerId && !matchId(p.ownerId, filter.ownerId)) return false;
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
                items = currentData.users.filter((u) => {
                  if (filter._id && !matchId(u._id, filter._id)) return false;
                  if (typeof filter.email === "string" && u.email?.toLowerCase() !== filter.email.toLowerCase()) return false;
                  if (filter.email && typeof filter.email === "object" && filter.email.$ne) {
                    if (u.email?.toLowerCase() === filter.email.$ne.toLowerCase()) return false;
                  }
                  if (filter.role) {
                    if (typeof filter.role === "object" && filter.role.$ne) {
                      if (u.role === filter.role.$ne) return false;
                    } else if (u.role !== filter.role) return false;
                  }
                  if (filter.status && u.status !== filter.status) return false;
                  if (filter.subscriptionStatus && u.subscriptionStatus !== filter.subscriptionStatus) return false;
                  return true;
                });
              } else if (collectionName === "branches") {
                items = currentData.branches.filter((b) => {
                  if (filter.ownerId && b.ownerId !== filter.ownerId && !matchId(b.ownerId, filter.ownerId)) return false;
                  return true;
                });

                // Pre-seed default karate branches only if coach has none AND user exists in system
                const userExists = currentData.users.some((u) => matchId(u._id, filter.ownerId));
                if (items.length === 0 && filter.ownerId && userExists) {
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
                  if (filter.ownerId && p.ownerId !== filter.ownerId && !matchId(p.ownerId, filter.ownerId)) return false;
                  if (filter._id && !matchId(p._id, filter._id)) return false;
                  return true;
                });
              } else if (collectionName === "events") {
                items = (currentData.events || []).filter((e) => {
                  if (filter.ownerId && e.ownerId !== filter.ownerId && !matchId(e.ownerId, filter.ownerId)) return false;
                  if (filter._id && !matchId(e._id, filter._id)) return false;
                  return true;
                });
              } else if (collectionName === "cloud_snapshots") {
                items = (currentData.cloud_snapshots || []).filter((s) => {
                  if (filter.ownerId && s.ownerId !== filter.ownerId && !matchId(s.ownerId, filter.ownerId)) return false;
                  if (filter._id && !matchId(s._id, filter._id)) return false;
                  return true;
                });
              } else if (collectionName === "audit_logs") {
                items = (currentData.audit_logs || []).filter((a) => {
                  if (filter.targetAcademyId && a.targetAcademyId !== filter.targetAcademyId && !matchId(a.targetAcademyId, filter.targetAcademyId)) return false;
                  if (filter.action && a.action !== filter.action) return false;
                  return true;
                });
              }

              // Create chainable cursor with sort, skip, limit, project, toArray
              const cursor = {
                _items: [...items],
                sort(sortCriteria) {
                  if (sortCriteria) {
                    if (sortCriteria.createdAt === -1) {
                      this._items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
                    } else if (sortCriteria.createdAt === 1) {
                      this._items.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
                    } else if (sortCriteria.timestamp === -1) {
                      this._items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
                    } else if (sortCriteria.timestamp === 1) {
                      this._items.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
                    } else if (sortCriteria.date === -1) {
                      this._items.sort((a, b) => new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0));
                    }
                  }
                  return this;
                },
                skip(n) {
                  if (typeof n === "number" && n > 0) {
                    this._items = this._items.slice(n);
                  }
                  return this;
                },
                limit(n) {
                  if (typeof n === "number" && n >= 0) {
                    this._items = this._items.slice(0, n);
                  }
                  return this;
                },
                project() {
                  return this;
                },
                async toArray() {
                  return [...this._items];
                },
              };

              return cursor;
            },

            async findOne(filter = {}) {
              if (collectionName === "users") {
                return (
                  currentData.users.find((u) => {
                    const uEmail = (u.email || "").toLowerCase().trim();
                    if (Array.isArray(filter.$or)) {
                      return filter.$or.some((clause) => {
                        if ("_id" in clause && (!clause._id || !matchId(u._id, clause._id))) return false;
                        if (clause.email) {
                          if (typeof clause.email === "string") {
                            return uEmail === clause.email.toLowerCase().trim();
                          }
                          if (clause.email.$regex) {
                            const reg = clause.email.$regex instanceof RegExp ? clause.email.$regex : new RegExp(clause.email.$regex, "i");
                            return reg.test(uEmail);
                          }
                        }
                        return true;
                      });
                    }
                    if (typeof filter.email === "string" && uEmail !== filter.email.toLowerCase().trim()) {
                      return false;
                    }
                    if (filter.email && typeof filter.email === "object") {
                      if (filter.email.$regex) {
                        const reg = filter.email.$regex instanceof RegExp ? filter.email.$regex : new RegExp(filter.email.$regex, "i");
                        if (!reg.test(uEmail)) return false;
                      }
                      if (filter.email.$ne && uEmail === filter.email.$ne.toLowerCase().trim()) return false;
                    }
                    if ("_id" in filter && (!filter._id || !matchId(u._id, filter._id))) return false;
                    if (filter.role && u.role !== filter.role) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "branches") {
                return (
                  currentData.branches.find((b) => {
                    if (filter.name && b.name !== filter.name) return false;
                    if (filter.ownerId && b.ownerId !== filter.ownerId && !matchId(b.ownerId, filter.ownerId)) return false;
                    if ("_id" in filter && (!filter._id || !matchId(b._id, filter._id))) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "players") {
                return (
                  currentData.players.find((p) => {
                    if (filter.ownerId && p.ownerId !== filter.ownerId && !matchId(p.ownerId, filter.ownerId)) return false;
                    if ("_id" in filter && (!filter._id || !matchId(p._id, filter._id))) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "events") {
                return (
                  (currentData.events || []).find((e) => {
                    if (filter.ownerId && e.ownerId !== filter.ownerId && !matchId(e.ownerId, filter.ownerId)) return false;
                    if ("_id" in filter && (!filter._id || !matchId(e._id, filter._id))) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "cloud_snapshots") {
                return (
                  (currentData.cloud_snapshots || []).find((s) => {
                    if (filter.ownerId && s.ownerId !== filter.ownerId && !matchId(s.ownerId, filter.ownerId)) return false;
                    if ("_id" in filter && (!filter._id || !matchId(s._id, filter._id))) return false;
                    return true;
                  }) || null
                );
              }

              if (collectionName === "audit_logs") {
                return (
                  (currentData.audit_logs || []).find((a) => {
                    if ("_id" in filter && (!filter._id || !matchId(a._id, filter._id))) return false;
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
                if (doc.email) {
                  const targetEmail = doc.email.toLowerCase().trim();
                  const exists = currentData.users.some(
                    (u) => (u.email || "").toLowerCase().trim() === targetEmail
                  );
                  if (exists) {
                    const dupErr = new Error(`E11000 duplicate key error collection: users index: email dup key: { email: "${targetEmail}" }`);
                    dupErr.code = 11000;
                    throw dupErr;
                  }
                }
                currentData.users.push(newDoc);
              } else if (collectionName === "branches") {
                currentData.branches.push(newDoc);
              } else if (collectionName === "players") {
                currentData.players.push(newDoc);
              } else if (collectionName === "events") {
                if (!Array.isArray(currentData.events)) currentData.events = [];
                currentData.events.push(newDoc);
              } else if (collectionName === "cloud_snapshots") {
                if (!Array.isArray(currentData.cloud_snapshots)) currentData.cloud_snapshots = [];
                currentData.cloud_snapshots.push(newDoc);
              } else if (collectionName === "audit_logs") {
                if (!Array.isArray(currentData.audit_logs)) currentData.audit_logs = [];
                currentData.audit_logs.push(newDoc);
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
              if (collectionName === "users") {
                const user = (currentData.users || []).find((u) => {
                  if ("_id" in filter) {
                    return Boolean(filter._id && matchId(u._id, filter._id));
                  }
                  if (filter.email) {
                    return (u.email || "").toLowerCase().trim() === filter.email.toLowerCase().trim();
                  }
                  return false;
                });
                if (user) {
                  if (update.$set) {
                    Object.assign(user, update.$set);
                  }
                  if (update.$unset) {
                    for (const k of Object.keys(update.$unset)) {
                      delete user[k];
                    }
                  }
                  saveData(currentData);
                  return { modifiedCount: 1 };
                }
              }
              return { modifiedCount: 0 };
            },

            async findOneAndUpdate(filter = {}, update = {}, _options = {}) {
              if (collectionName === "users") {
                const user = (currentData.users || []).find((u) => {
                  if ("_id" in filter) {
                    return Boolean(filter._id && matchId(u._id, filter._id));
                  }
                  if (filter.email) {
                    return u.email?.toLowerCase() === filter.email?.toLowerCase();
                  }
                  return false;
                });
                if (user) {
                  if (update.$set) {
                    Object.assign(user, update.$set);
                  }
                  saveData(currentData);
                  return { ...user };
                }
              }
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
              const list = currentData[collectionName] || [];

              const idx = list.findIndex((item) => {
                if (filter.ownerId && !matchId(item.ownerId, filter.ownerId)) return false;
                if (filter.userEmail && (item.userEmail || "").toLowerCase().trim() !== (filter.userEmail || "").toLowerCase().trim()) return false;
                if (filter.name && item.name !== filter.name) return false;
                if (filter._id && !matchId(item._id, filter._id)) return false;
                if (filter.email && (item.email || "").toLowerCase().trim() !== (filter.email || "").toLowerCase().trim()) return false;
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
              const list = currentData[collectionName] || [];
              const initialCount = list.length;
              const remaining = list.filter((item) => {
                // If filter is empty, delete all items
                if (Object.keys(filter).length === 0) return false;

                // Match against provided filters
                if (filter.ownerId && !matchId(item.ownerId, filter.ownerId)) return true;
                if (filter.userEmail && (item.userEmail || "").toLowerCase().trim() !== (filter.userEmail || "").toLowerCase().trim()) return true;
                if (filter._id && !matchId(item._id, filter._id)) return true;
                if (filter.email && (item.email || "").toLowerCase().trim() !== (filter.email || "").toLowerCase().trim()) return true;
                return false; // all filter conditions met -> delete item
              });

              const deletedCount = initialCount - remaining.length;
              currentData[collectionName] = remaining;

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
