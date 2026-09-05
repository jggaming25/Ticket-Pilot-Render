import { Resend } from "resend";

function getResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (
    !apiKey ||
    !apiKey.startsWith("re_") ||
    apiKey.startsWith("re_your_key") ||
    apiKey.startsWith("re_123")
  ) {
    return null;
  }
  try {
    return new Resend(apiKey);
  } catch {
    return null;
  }
}

function getEmailJS() {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (serviceId && templateId && publicKey) {
    return { serviceId, templateId, publicKey, privateKey };
  }
  return null;
}

async function sendViaEmailJS(params: {
  serviceId: string;
  templateId: string;
  publicKey: string;
  privateKey?: string;
  toEmail: string;
  subject: string;
  html: string;
}) {
  const body: Record<string, unknown> = {
    service_id: params.serviceId,
    template_id: params.templateId,
    user_id: params.publicKey,
    template_params: {
      to_email: params.toEmail,
      subject: params.subject,
      html_content: params.html,
    },
  };
  if (params.privateKey) {
    body.accessToken = params.privateKey;
  }

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const respBody = await res.text().catch(() => "");
    throw new Error(`EmailJS ${res.status}: ${respBody}`);
  }
  return true;
}

async function sendRaw(toEmail: string, subject: string, html: string) {
  // 1. Bevorzugt: EmailJS (funktioniert ohne eigene Domain)
  const emailjs = getEmailJS();
  if (emailjs) {
    try {
      await sendViaEmailJS({
        serviceId: emailjs.serviceId,
        templateId: emailjs.templateId,
        publicKey: emailjs.publicKey,
        privateKey: emailjs.privateKey,
        toEmail,
        subject,
        html,
      });
      return { success: true, provider: "emailjs" };
    } catch (error) {
      console.error("EmailJS send error:", error);
      return { success: false, error };
    }
  }

  // 2. Fallback: Resend (benoetigt eine verifizierte Domain fuer echte Empfaenger)
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Kein Email-Anbieter konfiguriert - Email wird uebersprungen");
      return { success: true, skipped: true };
    }
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Ticket Pilot <onboarding@resend.dev>",
      to: toEmail,
      subject,
      html,
    });
    return { success: true, provider: "resend" };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}

export function buildStyledHtml(opts: {
  kicker?: string;
  title: string;
  paragraphs: string[];
  buttonLabel?: string;
  buttonUrl?: string;
  footer?: string;
}) {
  const { kicker, title, paragraphs, buttonLabel, buttonUrl, footer } = opts;
  const escapedUrl = buttonUrl
    ? buttonUrl.replace(/&/g, "&amp;").replace(/"/g, "&quot;")
    : "";

  return `<!DOCTYPE html>
<html lang="de" style="margin:0;padding:0;">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#0b0d1d;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0d1d;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
          <tr>
            <td style="font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;padding:0 4px 24px 4px;">
              <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">Ticket&nbsp;Pilot</span>
            </td>
          </tr>
          <tr>
            <td style="background:linear-gradient(135deg,#4338ca 0%,#6366f1 55%,#818cf8 100%);border-radius:20px;padding:1px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:rgba(11,13,29,0.92);border-radius:20px;padding:36px 32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${
                        kicker
                          ? `<tr><td style="font-size:11px;line-height:16px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#818cf8;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;padding-bottom:10px;">${kicker}</td></tr>`
                          : ""
                      }
                      <tr>
                        <td style="font-size:22px;line-height:30px;font-weight:700;color:#ffffff;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;padding-bottom:12px;">
                          ${title}
                        </td>
                      </tr>
                      ${paragraphs
                        .map(
                          (p) => `<tr>
                        <td style="font-size:15px;line-height:23px;color:#9aa1c9;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;padding-bottom:16px;">
                          ${p}
                        </td>
                      </tr>`
                        )
                        .join("")}
                      ${
                        buttonLabel && escapedUrl
                          ? `<tr>
                        <td align="center" style="padding-top:8px;padding-bottom:24px;">
                          <a href="${escapedUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#6366f1 50%,#818cf8 100%);color:#ffffff;font-size:15px;font-weight:600;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;text-decoration:none;padding:14px 32px;border-radius:12px;box-shadow:0 8px 24px rgba(99,102,241,0.4);">
                            ${buttonLabel}
                          </a>
                        </td>
                      </tr>`
                          : ""
                      }
                      <tr>
                        <td style="border-top:1px solid rgba(255,255,255,0.08);padding-top:20px;font-size:12.5px;line-height:19px;color:#6b7296;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
                          ${
                            footer ||
                            "Diese E-Mail wurde automatisch von Ticket Pilot erstellt."
                          }
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;font-size:11px;line-height:17px;color:#4a5078;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;text-align:center;">
              Ticket&nbsp;Pilot &mdash; Support-System
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  type: "register" | "login",
  baseUrlOverride?: string
) {
  const baseUrl = baseUrlOverride || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/verify-email?token=${token}&type=${type}`;

  const subject =
    type === "register"
      ? "Ticket Pilot - Email bestätigen"
      : "Ticket Pilot - Login-Bestätigung";

  const html =
    type === "register"
      ? buildStyledHtml({
          kicker: "Registrierung",
          title: "Willkommen bei Ticket Pilot!",
          paragraphs: [
            "Vielen Dank für deine Registrierung. Bitte bestätige deine E-Mail-Adresse, um dein Konto zu aktivieren.",
            "Der Link ist 24 Stunden gültig.",
          ],
          buttonLabel: "E-Mail bestätigen",
          buttonUrl: verifyUrl,
          footer:
            "Falls du dich nicht auf Ticket Pilot registriert hast, kannst du diese E-Mail einfach ignorieren.",
        })
      : buildStyledHtml({
          kicker: "Sicherheit",
          title: "Login-Bestätigung",
          paragraphs: [
            "Jemand hat versucht, sich mit deinem Konto anzumelden. Bestätige den Login, um fortzufahren.",
          ],
          buttonLabel: "Login bestätigen",
          buttonUrl: verifyUrl,
          footer:
            "Falls du das nicht warst, solltest du sofort dein Passwort ändern.",
        });

  return sendRaw(email, subject, html);
}

export async function sendCommentNotice(params: {
  toEmail: string;
  ticketLabel: string;
  ticketUrl: string;
  authorName: string;
  comment: string;
  isBcc?: boolean;
}) {
  const { toEmail, ticketLabel, ticketUrl, authorName, comment, isBcc } = params;
  const subject = `[${ticketLabel}] ${authorName} hat kommentiert`;

  const html = buildStyledHtml({
    kicker: isBcc ? "Ticket-Update (BCC)" : "Ticket-Update (CC)",
    title: `Neuer Kommentar zu ${ticketLabel}`,
    paragraphs: [
      `${authorName} hat zum Ticket <strong>${ticketLabel}</strong> einen Kommentar hinzugefügt:`,
      `<span style="color:#c7d2fe;background:rgba(99,102,241,0.12);display:block;padding:14px 16px;border-radius:10px;font-size:14px;line-height:21px;">${comment.replace(
        /</g,
        "&lt;"
      ).replace(/\n/g, "<br>")}</span>`,
      "Öffne das Ticket in Ticket Pilot, um zu antworten.",
    ],
    buttonLabel: "Ticket öffnen",
    buttonUrl: ticketUrl,
    footer: `Du erhältst diese E-Mail, weil du beim Kommentar in CC${isBcc ? "/BCC" : ""} standst.`,
  });

  return sendRaw(toEmail, subject, html);
}

export async function sendPasswordReset(email: string, password: string) {
  const subject = "Ticket Pilot - Neues Passwort";

  const html = buildStyledHtml({
    kicker: "Passwort zurückgesetzt",
    title: "Dein neues Passwort",
    paragraphs: [
      "Es wurde ein neues Passwort für dein Ticket Pilot Konto erstellt:",
      `<span style="color:#c7d2fe;background:rgba(99,102,241,0.12);display:block;padding:14px 16px;border-radius:10px;font-size:16px;letter-spacing:1px;text-align:center;font-family:ui-monospace,monospace;">${password}</span>`,
      "Melde dich damit an und ändere dein Passwort anschließend in den Einstellungen.",
    ],
    buttonLabel: "Zum Login",
    buttonUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`,
    footer:
      "Falls du kein neues Passwort angefordert hast, wende dich bitte an deinen Administrator.",
  });

  return sendRaw(email, subject, html);
}