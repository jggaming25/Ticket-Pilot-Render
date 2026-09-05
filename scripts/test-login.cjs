const { createClient } = require("@libsql/client");
const bcrypt = require("bcryptjs");
const { loadEnv } = require("./load-env.cjs");
loadEnv();

const email = process.argv[2];
const password = process.argv[3];
if (!email || !password) {
  console.error("Nutzung: node scripts/test-login.cjs <email> <passwort>");
  process.exit(1);
}

async function run() {
  const c = createClient({
    url: process.env.TURSO_DATABASE_URL || "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const r = await c.execute(
    "SELECT id, email, password_hash, email_verified, banned, banned_until, role FROM users WHERE email = ?",
    [email]
  );
  const u = r.rows[0];
  if (!u) {
    console.log("KEIN NUTZER MIT DIESER EMAIL GEFUNDEN");
    process.exit(1);
  }

  const pwOk = await bcrypt.compare(password, u.password_hash);
  const verified = u.email_verified != null;

  console.log(`Nutzer gefunden:    ${u.email} (${u.id})`);
  console.log(`passwort stimmt:    ${pwOk}`);
  console.log(`email verifiziert:  ${verified}`);
  console.log(`banned:             ${u.banned}  (until: ${u.banned_until})`);
  console.log(`rolle:              ${u.role}`);

  if (pwOk && verified && !u.banned) {
    console.log("\nERGEBNIS: Login sollte funktionieren - alle Pruefungen bestanden.");
  } else {
    console.log("\nERGEBNIS: Login wuerde abgelehnt -> Grund siehe oben.");
  }
}

run().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});