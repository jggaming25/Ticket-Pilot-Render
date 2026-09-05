export const ADMIN_EMAILS = [
  "janngenzmann@gmail.com",
  "genzmannjann@gmail.com",
  "j.genzmann@md-netz.de",
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    (a) => a.toLowerCase() === email.toLowerCase()
  );
}

export function isAdminUser(user?: { email?: string | null; role?: string | null; } | null): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  return isAdminEmail(user.email);
}