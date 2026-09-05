import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";

export async function createNotification(params: {
  userId: string;
  ticketId?: string | null;
  type: string;
  title: string;
  message: string;
}) {
  try {
    await db.insert(notifications).values({
      userId: params.userId,
      ticketId: params.ticketId || null,
      type: params.type,
      title: params.title,
      message: params.message,
    });
  } catch (e) {
    console.error("Notification insert fehlgeschlagen:", e);
  }
}

export async function createNotificationsForMany(params: {
  userIds: string[];
  excludeUserId?: string;
  ticketId?: string | null;
  type: string;
  title: string;
  message: string;
}) {
  const unique = Array.from(
    new Set(params.userIds.filter((id) => id && id !== params.excludeUserId))
  );
  for (const uid of unique) {
    await createNotification({ ...params, userId: uid });
  }
}

export async function findUserIdsByEmails(emails: string[]): Promise<
  Record<string, string>
> {
  const clean = Array.from(
    new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))
  );
  if (clean.length === 0) return {};

  const result = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(inArray(users.email, clean as any));

  return Object.fromEntries(result.map((r) => [r.email.toLowerCase(), r.id]));
}