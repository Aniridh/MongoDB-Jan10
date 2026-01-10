import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  client = new MongoClient(uri);
  await client.connect();
  return client;
}

export async function getDb(): Promise<Db> {
  if (db) {
    return db;
  }

  const client = await getClient();
  const dbName = process.env.MONGODB_DB_NAME || "visibl";
  db = client.db(dbName);
  return db;
}
