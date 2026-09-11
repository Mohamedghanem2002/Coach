import { MongoClient } from "mongodb";
import { getLocalDbClient } from "./localdb";

const uri = process.env.MONGODB_URI;

function getConnectedClient() {
  if (!uri || !uri.startsWith("mongodb")) {
    return Promise.resolve(getLocalDbClient());
  }

  if (global._mongoClientPromise) {
    return global._mongoClientPromise;
  }

  const options = {
    appName: "cap-yasser",
    tls: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  };

  const client = new MongoClient(uri, options);

  global._mongoClientPromise = client
    .connect()
    .then(async (connectedClient) => {
      try {
        if (process.env.MONGODB_DB) {
          const db = connectedClient.db(process.env.MONGODB_DB);

          await Promise.allSettled([
            db.collection("players").createIndex({
              ownerId: 1,
              createdAt: -1,
            }),
            db.collection("players").createIndex({
              ownerId: 1,
              branch: 1,
            }),
            db.collection("branches").createIndex({
              ownerId: 1,
              createdAt: 1,
            }),
            db.collection("events").createIndex({
              ownerId: 1,
              date: -1,
            }),
          ]);
        }
      } catch (err) {
        console.warn("MongoDB index creation non-critical error:", err?.message);
      }

      return connectedClient;
    })
    .catch((err) => {
      global._mongoClientPromise = null;
      throw err;
    });

  return global._mongoClientPromise;
}

// Lazy thenable: Does not initiate network connections at module evaluation time
const clientPromise = {
  then(onFulfilled, onRejected) {
    return getConnectedClient().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getConnectedClient().catch(onRejected);
  },
  finally(onFinally) {
    return getConnectedClient().finally(onFinally);
  },
};

export default clientPromise;