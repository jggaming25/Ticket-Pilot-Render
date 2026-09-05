import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  tickets,
  ticketHistory,
  groups,
  groupMembers,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotificationsForMany } from "@/lib/notify";

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

  // Benachrichtigungen an Ersteller + Gruppeninhaber/Admins
  const groupResult = await db
    .select({ ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.id, ticket.groupId))
    .limit(1);
  const adminRows = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, ticket.groupId),
        eq(groupMembers.role, "admin")
      )
    );

  await createNotificationsForMany({
    userIds: [ticket.createdById, ...(groupResult[0]?.ownerId ? [groupResult[0].ownerId] : []), ...adminRows.map((a) => a.userId)],
    excludeUserId: userId,
    ticketId: ticket.id,
    type: "claim",
    title: `Ticket TP-${String(ticket.ticketNumber).padStart(4, "0")} übernommen`,
    message: `${session.user?.name || "Jemand"} hat das Ticket übernommen.`,
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
      { error: "Nur der Bearbeiter kann das Ticket freigeben" },
      { status: 403 }
    );
  }

  await db
    .update(tickets)
    .set({ claimedById: null, status: "open", updatedAt: new Date() })
    .where(eq(tickets.id, params.id as any));

  await db.insert(ticketHistory).values({
    ticketId: params.id,
    userId,
    action: "unclaimed",
  });

  return NextResponse.json({ success: true });
}
