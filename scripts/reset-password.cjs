const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
const { loadEnv } = require("./load-env.cjs");
loadEnv();

const url = process.env.TURSO_DATABASE_URL || "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io";
const token = process.env.TURSO_AUTH_TOKEN;
if (!token) {
  console.error("TURSO_AUTH_TOKEN fehlt - bitte in .env eintragen oder als Umgebungsvariable setzen.");
  process.exit(1);
}

const email = process.argv[2];
const newPassword = process.argv[3];
if (!email || !newPassword) {
  console.error("Nutzung: node scripts/reset-password.cjs <email> <neues-passwort>");
  process.exit(1);
}
if (newPassword.length < 8) {
  console.error("Passwort muss mindestens 8 Zeichen haben.");
  process.exit(1);
}

const c = createClient({ url, authToken: token });

async function run() {
  const found = await c.execute("SELECT id, email FROM users WHERE email = ?", [email]);
  if (found.rows.length === 0) {
    console.error(`Kein Nutzer mit Email '${email}' gefunden.`);
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await c.execute("UPDATE users SET password_hash = ? WHERE email = ?", [hash, email]);

  console.log(`Passwort für ${email} wurde zurückgesetzt.`);
}

run().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});