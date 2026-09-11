import fs from "fs";
import path from "path";
import { ObjectId } from "mongodb";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "local_db.json");

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      branches: [],
      players: [],
      events: [],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

function loadData() {
  try {
    ensureDbFile();
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
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
  } catch (err) {
    console.error("Failed to read local_db.json, using in-memory store", err);
    return { users: [], branches: [], players: [], events: [] };
  }
}

function saveData(data) {
  try {
    ensureDbFile();
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write to local_db.json", err);
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
          };
        },
      };
    },
  };
}
