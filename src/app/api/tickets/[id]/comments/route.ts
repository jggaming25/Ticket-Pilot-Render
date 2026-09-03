import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ticketComments, ticketHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const comments = await db
    .select({
      id: ticketComments.id,
      content: ticketComments.content,
      createdAt: ticketComments.createdAt,
      user: {
        id: users.id,
        name: users.name,
        image: users.image,
      },
    })
    .from(ticketComments)
    .innerJoin(users, eq(ticketComments.userId, users.id))
    .where(eq(ticketComments.ticketId, params.id as any));

  return NextResponse.json({ comments });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Kommentar darf nicht leer sein" },
      { status: 400 }
    );
  }

  await db.insert(ticketComments).values({
    ticketId: params.id,
    userId,
    content: content.trim(),
  });

  await db.insert(ticketHistory).values({
    ticketId: params.id,
    userId,
    action: "commented",
  });

  return NextResponse.json({ success: true });
}
