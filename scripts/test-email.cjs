const { loadEnv } = require("./load-env.cjs");
loadEnv();

const SERVICE_ID = process.env.EMAILJS_SERVICE_ID;
const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY;
const PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY;
const TO = process.argv[2] || process.env.EMAILJS_TEST_TO || "janngenzmann@gmail.com";
const BASE = process.env.NEXTAUTH_URL || "https://ticket-pilot-mn25.onrender.com";

if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
  console.error("Fehlen in .env: EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY");
  process.exit(1);
}

const verifyUrl = `${BASE}/verify-email?token=TESTTOKEN123&type=register`;
const html = `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;"><h1 style="color:#4f46e5;">Ticket Pilot - EmailJS Test</h1><p>Wenn diese Mail ankam, funktioniert der Email-Versand.</p><a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;text-decoration:none;border-radius:8px;">Test-Link</a></div>`;

async function main() {
  console.log(`Sende Testmail an ${TO} ...`);
  const body = {
    service_id: SERVICE_ID,
    template_id: TEMPLATE_ID,
    user_id: PUBLIC_KEY,
    template_params: {
      to_email: TO,
      subject: "Ticket Pilot - EmailJS Test",
      html_content: html,
      verify_url: verifyUrl,
    },
  };
  if (PRIVATE_KEY) body.accessToken = PRIVATE_KEY;

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  console.log("Status:", res.status);
  const respBody = await res.text().catch(() => "");
  console.log("Antwort:", respBody || "(keine)");

  if (res.ok) {
    console.log("SUCCESS: Mail sollte angekommen sein.");
    process.exit(0);
  } else {
    console.error("FEHLER - siehe Meldung oben.");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("FATAL", e.message || e);
  process.exit(1);
});