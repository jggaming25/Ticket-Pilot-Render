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
  // Kommentar CC/BCC (SQLite ALTER ADD COLUMN fuer neueste Zeilen)
  "ALTER TABLE ticket_comments ADD COLUMN cc TEXT",
  "ALTER TABLE ticket_comments ADD COLUMN bcc TEXT",
  // Datei-Anhaenge
  `CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id TEXT REFERENCES ticket_comments(id) ON DELETE CASCADE,
    uploaded_by_id TEXT NOT NULL REFERENCES users(id),
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  )`,
  "CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read)",
  "CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id)",
];

async function run() {
  for (const sql of statements) {
    try {
      await c.execute(sql);
      console.log("OK  ", sql.slice(0, 80));
    } catch (e) {
      const msg = String(e.message || e);
      // Spalte existiert bereits / bereits angelegt -> ignorieren
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