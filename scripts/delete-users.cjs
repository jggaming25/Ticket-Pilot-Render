const { createClient } = require("@libsql/client");
const { loadEnv } = require("./load-env.cjs");
loadEnv();

const url = process.env.TURSO_DATABASE_URL || "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io";
const token = process.env.TURSO_AUTH_TOKEN;
if (!token) {
  console.error("TURSO_AUTH_TOKEN fehlt - bitte in .env eintragen oder als Umgebungsvariable setzen.");
  process.exit(1);
}

const PAT = process.argv[2];
if (!PAT) {
  console.error("Nutzung: node scripts/delete-users.cjs <email-or-teil>  (oder ALLE)");
  process.exit(1);
}

const c = createClient({ url, authToken: token });

async function run() {
  const all = await c.execute("SELECT id, name, email, email_verified FROM users ORDER BY created_at");
  console.log("Nutzer vorher:", JSON.stringify(all.rows));

  let match;
  if (PAT.toLowerCase() === "alle") {
    match = all.rows;
  } else {
    match = all.rows.filter((r) => String(r.email || r.name).toLowerCase().includes(PAT.toLowerCase()));
  }
  if (match.length === 0) {
    console.log("Keine Übereinstimmung.");
    process.exit(0);
  }
  for (const u of match) {
    const res = await c.execute("DELETE FROM users WHERE id = ?", [u.id]);
    console.log(`Gelöscht: ${u.email} (${res.rowsAffected} Zeile)`);
  }
  const after = await c.execute("SELECT id, name, email FROM users");
  console.log("Nutzer danach:", JSON.stringify(after.rows));
}

run().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});