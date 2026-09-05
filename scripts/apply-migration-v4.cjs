const { createClient } = require("@libsql/client");
const { loadEnv } = require("./load-env.cjs");
loadEnv();

const url = process.env.TURSO_DATABASE_URL || "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io";
const token = process.env.TURSO_AUTH_TOKEN;
if (!token) {
  console.error("TURSO_AUTH_TOKEN fehlt - bitte in .env eintragen oder als Umgebungsvariable setzen.");
  process.exit(1);
}

const c = createClient({ url, authToken: token });

const statements = [
  `CREATE TABLE IF NOT EXISTS system_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
];

async function run() {
  for (const sql of statements) {
    try {
      await c.execute(sql);
      console.log("OK  ", sql.slice(0, 80));
    } catch (e) {
      const msg = String(e.message || e);
      if (/duplicate column|already exist/i.test(msg)) {
        console.log("SKIP", sql.slice(0, 80), "->", msg.slice(0, 60));
      } else {
        console.log("FAIL", sql.slice(0, 80), "->", msg.slice(0, 120));
      }
    }
  }
  console.log("FERTIG");
}

run().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});