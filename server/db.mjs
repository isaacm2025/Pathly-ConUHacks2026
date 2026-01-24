import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const uri = process.env.MONGO_URL;
if (!uri) {
  throw new Error("MONGO_URL is not set. Add it to server/.env");
}

const dbName = process.env.MONGO_DB_NAME || "pathly";
const client = new MongoClient(uri);
let clientPromise;

export async function connectDB() {
  if (!clientPromise) {
    clientPromise = client.connect();
  }
  await clientPromise;
  return client.db(dbName);
}
