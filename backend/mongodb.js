var _a;
import { MongoClient } from "mongodb";
const uri = process.env.MONGODB_URI;
if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
}
const options = {
    appName: "cap-yasser",
    tls: true,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
};
const client = new MongoClient(uri, options);
const clientPromise = (_a = global._mongoClientPromise) !== null && _a !== void 0 ? _a : client.connect();
global._mongoClientPromise = clientPromise;
export default clientPromise;
