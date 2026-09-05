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
  if (serviceId && templateId && publicKey) {
    return { serviceId, templateId, publicKey };
  }
  return null;
}

async function sendViaEmailJS(params: {
  serviceId: string;
  templateId: string;
  publicKey: string;
  toEmail: string;
  subject: string;
  html: string;
  verifyUrl: string;
}) {
  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: params.serviceId,
      template_id: params.templateId,
      user_id: params.publicKey,
      template_params: {
        to_email: params.toEmail,
        subject: params.subject,
        html_content: params.html,
        verify_url: params.verifyUrl,
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`EmailJS ${res.status}: ${body}`);
  }
  return true;
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
      ? `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Willkommen bei Ticket Pilot!</h1>
          <p>Vielen Dank für deine Registrierung. Bitte bestätige deine Email-Adresse:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Email bestätigen</a>
          <p style="color: #666; font-size: 14px;">Falls du dich nicht registriert hast, ignoriere diese Nachricht.</p>
        </div>`
      : `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4f46e5;">Ticket Pilot - Login-Bestätigung</h1>
          <p>Jemand hat versucht, sich mit deinem Account einzuloggen. Bitte bestätige den Login:</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Login bestätigen</a>
          <p style="color: #666; font-size: 14px;">Falls du das nicht warst, ändere sofort dein Passwort.</p>
        </div>`;

  // 1. Bevorzugt: EmailJS (funktioniert ohne eigene Domain)
  const emailjs = getEmailJS();
  if (emailjs) {
    try {
      await sendViaEmailJS({
        serviceId: emailjs.serviceId,
        templateId: emailjs.templateId,
        publicKey: emailjs.publicKey,
        toEmail: email,
        subject,
        html,
        verifyUrl,
      });
      return { success: true, provider: "emailjs" };
    } catch (error) {
      console.error("EmailJS send error:", error);
      return { success: false, error };
    }
  }

  // 2. Fallback: Resend (benoetigt verifizierte Domain fuer Empfaenger)
  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Kein Email-Anbieter konfiguriert - Email wird uebersprungen");
      return { success: true, skipped: true };
    }
    await resend.emails.send({
      from:
        process.env.EMAIL_FROM ||
        "Ticket Pilot <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });
    return { success: true, provider: "resend" };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}