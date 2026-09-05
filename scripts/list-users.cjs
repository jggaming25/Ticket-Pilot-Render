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
c.execute("SELECT id, name, email, email_verified, created_at FROM users ORDER BY created_at")
  .then((r) => {
    console.log("USERS:", JSON.stringify(r.rows, null, 2));
    process.exit(0);
  })
  .catch((e) => {
    console.error("ERR", e.message || e);
    process.exit(1);
  });