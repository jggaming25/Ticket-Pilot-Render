const { createClient } = require("@libsql/client");
const c = createClient({
  url: "libsql://ticketpilot2-jggaming25.aws-eu-west-1.turso.io",
  authToken: "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODg1NDEwMDIsImlkIjoiMDFhMDZkNTktYjIwMS03Y2Y1LTk2N2EtMjZhYWU3MGQ4Y2ZiIiwia2lkIjoiVHhsXzAyd2pYbTJ3RzFrUURUeEl2aFl3UmJiaG9aWHdZb3FuVDF0WS1qdyIsInJpZCI6IjliMTU5YjNhLWVjMGYtNDc3MC1hNDdhLTNkMjIwNTJlNDYyZSJ9.SGfUwBj5Co0sLHwqCbCvUY4lLZ_VkLGXIdmB9Wse07MeEZfEk1YhxXv2R6fp0w5vdyNBgtMbZfBp1WWkcdPRDQ",
});
async function main() {
  try {
    const r = await c.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name");
    console.log("DB OK - Tabellen:", r.rows.map((x) => x.name).join(", "));
  } catch (e) {
    console.log("DB ERR:", e.message);
  }
  process.exit(0);
}
main();