import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// In production: Cloudflare D1 via REST API
// In development: local SQLite file
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || "file:./dev.db",
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(client, { schema });
