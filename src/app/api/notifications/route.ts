import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const result = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(notifications.createdAt)
    .limit(30);

  const list = [...result].reverse();
  const unread = list.filter((n) => !n.read).length;

  return NextResponse.json({ notifications: list, unread });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json().catch(() => ({}));
  const id = body?.id as string | undefined;

  if (id) {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id as any));
  } else {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId as any));
  }

  return NextResponse.json({ success: true });
}