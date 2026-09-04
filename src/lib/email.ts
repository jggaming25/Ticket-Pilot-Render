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

export async function sendVerificationEmail(
  email: string,
  token: string,
  type: "register" | "login"
) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
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

  try {
    const resend = getResend();
    if (!resend) {
      console.warn("Resend not configured - skipping email");
      return { success: true, skipped: true };
    }
    await resend.emails.send({
      from: process.env.EMAIL_FROM || "Ticket Pilot <onboarding@resend.dev>",
      to: email,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email send error:", error);
    return { success: false, error };
  }
}
