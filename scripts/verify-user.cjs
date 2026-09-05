const { createClient } = require("@libsql/client");
const { loadEnv } = require("./load-env.cjs");
loadEnv();

const url = process.env.TURSO_DATABASE_URL || "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io";
const token = process.env.TURSO_AUTH_TOKEN;
if (!token) {
  console.error("TURSO_AUTH_TOKEN fehlt - bitte in .env eintragen oder als Umgebungsvariable setzen.");
  process.exit(1);
}

const email = process.argv[2];
if (!email) {
  console.error("Nutzung: node scripts/verify-user.cjs <email>");
  process.exit(1);
}

const c = createClient({ url, authToken: token });

async function run() {
  const found = await c.execute("SELECT id, email FROM users WHERE email = ?", [email]);
  if (found.rows.length === 0) {
    console.error(`Kein Nutzer mit Email '${email}' gefunden.`);
    process.exit(1);
  }

  await c.execute(
    "UPDATE users SET email_verified = ? WHERE email = ?",
    [Math.floor(Date.now() / 1000), email]
  );

  console.log(`Email für ${email} wurde als verifiziert markiert.`);
  console.log("Login sollte jetzt funktionieren.");
}

run().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});