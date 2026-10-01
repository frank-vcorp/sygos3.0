import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type SygosDb = PostgresJsDatabase<typeof schema>;

let client: ReturnType<typeof postgres> | null = null;
let database: SygosDb | null = null;

export function getDb(): SygosDb {
  if (database) return database;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no está definida");
  }
  client = postgres(connectionString, { max: 10 });
  database = drizzle(client, { schema });
  return database;
}
