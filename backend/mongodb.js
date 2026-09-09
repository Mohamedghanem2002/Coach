import { MongoClient } from "mongodb";
import { getLocalDbClient } from "./localdb";

const uri = process.env.MONGODB_URI;

let clientPromise;

if (uri && uri.startsWith("mongodb")) {
  const options = {
    appName: "cap-yasser",
    tls: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  };

  const client = new MongoClient(uri, options);

  if (global._mongoClientPromise) {
    clientPromise = global._mongoClientPromise;
  } else {
    clientPromise = client.connect().then(async (connectedClient) => {
      if (process.env.MONGODB_DB) {
        const db = connectedClient.db(process.env.MONGODB_DB);

        await Promise.all([
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
        ]);
      }

      return connectedClient;
    });

    global._mongoClientPromise = clientPromise;
  }
} else {
  // Local persistent JSON storage fallback
  clientPromise = Promise.resolve(getLocalDbClient());
}

export default clientPromise;