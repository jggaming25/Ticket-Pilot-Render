import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, ticketHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const ticketRows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, params.id as any))
    .limit(1);
  const ticket = ticketRows[0];

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket nicht gefunden" },
      { status: 404 }
    );
  }

  if (ticket.claimedById) {
    return NextResponse.json(
      { error: "Ticket ist bereits beansprucht" },
      { status: 400 }
    );
  }

  await db
    .update(tickets)
    .set({ claimedById: userId, updatedAt: new Date() })
    .where(eq(tickets.id, params.id as any));

  await db.insert(ticketHistory).values({
    ticketId: params.id,
    userId,
    action: "claimed",
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const ticketRows = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, params.id as any))
    .limit(1);
  const ticket = ticketRows[0];

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket nicht gefunden" },
      { status: 404 }
    );
  }

  if (ticket.claimedById !== userId) {
    return NextResponse.json(
      { error: "Nur der Bearbeiter kann das Ticket abgeben" },
      { status: 403 }
    );
  }

  await db
    .update(tickets)
    .set({ claimedById: null, updatedAt: new Date() })
    .where(eq(tickets.id, params.id as any));

  await db.insert(ticketHistory).values({
    ticketId: params.id,
    userId,
    action: "unclaimed",
  });

  return NextResponse.json({ success: true });
}
