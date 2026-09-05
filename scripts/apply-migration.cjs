const { createClient } = require("@libsql/client");
const { loadEnv } = require("./load-env.cjs");
loadEnv();

const url = process.env.TURSO_DATABASE_URL || "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io";
const token = process.env.TURSO_AUTH_TOKEN;
if (!token) {
  console.error("TURSO_AUTH_TOKEN fehlt - bitte in .env eintragen oder als Umgebungsvariable setzen.");
  process.exit(1);
}

const client = createClient({ url, authToken: token });

const MIGRATIONS = [
  {
    name: "add users.role",
    sql: `ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`,
  },
  {
    name: "add users.banned",
    sql: `ALTER TABLE users ADD COLUMN banned INTEGER DEFAULT 0`,
  },
  {
    name: "add users.ban_reason",
    sql: `ALTER TABLE users ADD COLUMN ban_reason TEXT`,
  },
  {
    name: "add users.banned_until",
    sql: `ALTER TABLE users ADD COLUMN banned_until INTEGER`,
  },
  {
    name: "add users.delete_at",
    sql: `ALTER TABLE users ADD COLUMN delete_at INTEGER`,
  },
];

async function run() {
  // get current users columns
  const colsRes = await client.execute("PRAGMA table_info(users)");
  const existingCols = colsRes.rows.map((r) => r.name);
  console.log("users columns:", existingCols.join(", "));

  for (const m of MIGRATIONS) {
    const colName = m.sql.match(/ADD COLUMN (\w+)/)?.[1];
    if (colName && existingCols.includes(colName)) {
      console.log(`SKIP ${m.name} (exists)`);
      continue;
    }
    try {
      await client.execute(m.sql);
      console.log(`OK ${m.name}`);
    } catch (e) {
      console.error(`FAIL ${m.name}: ${e.message}`);
    }
  }

  // create site_announcements if missing
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='site_announcements'");
  if (tables.rows.length === 0) {
    await client.execute(`
      CREATE TABLE site_announcements (
        id TEXT PRIMARY KEY NOT NULL,
        message TEXT NOT NULL,
        color TEXT DEFAULT '#ef4444' NOT NULL,
        active INTEGER DEFAULT 1 NOT NULL,
        created_by_id TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (created_by_id) REFERENCES users(id)
      )
    `);
    console.log("OK create site_announcements");
  } else {
    console.log("SKIP site_announcements (exists)");
  }

  // cleanup: delete test/unverified users (only the known test one)
  const unverified = await client.execute("SELECT id, email FROM users WHERE email_verified IS NULL");
  console.log("unverified users:", JSON.stringify(unverified.rows));
  const res = await client.execute("DELETE FROM users WHERE email_verified IS NULL");
  console.log("deleted unverified users:", JSON.stringify(res));

  const finalUsers = await client.execute("SELECT id, name, email, role, banned FROM users");
  console.log("remaining users:", JSON.stringify(finalUsers.rows));

  // final check
  const newCols = await client.execute("PRAGMA table_info(users)");
  console.log("final users columns:", newCols.rows.map((r) => r.name).join(", "));
}

run().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});