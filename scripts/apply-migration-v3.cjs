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
  "ALTER TABLE group_members ADD COLUMN can_manage_settings INTEGER NOT NULL DEFAULT 0",
  "ALTER TABLE categories ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'",
  "ALTER TABLE tickets ADD COLUMN email TEXT",
  "ALTER TABLE tickets ADD COLUMN next_action TEXT",
  "ALTER TABLE group_settings ADD COLUMN next_actions TEXT NOT NULL DEFAULT '[]'",
  "ALTER TABLE users ADD COLUMN sound_enabled INTEGER NOT NULL DEFAULT 1",
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