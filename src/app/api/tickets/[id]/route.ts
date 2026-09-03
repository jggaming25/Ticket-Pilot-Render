import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, categories, users, ticketHistory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const result = await db
    .select({
      id: tickets.id,
      ticketNumber: tickets.ticketNumber,
      subject: tickets.subject,
      description: tickets.description,
      status: tickets.status,
      priority: tickets.priority,
      dueDate: tickets.dueDate,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      discordUsername: tickets.discordUsername,
      robloxUsername: tickets.robloxUsername,
      createdById: tickets.createdById,
      claimedById: tickets.claimedById,
      category: {
        id: categories.id,
        name: categories.name,
        color: categories.color,
      },
    })
    .from(tickets)
    .leftJoin(categories, eq(tickets.categoryId, categories.id))
    .where(eq(tickets.id, params.id as any))
    .limit(1);

  const ticket = result[0];
  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket nicht gefunden" },
      { status: 404 }
    );
  }

  const creatorRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(users)
    .where(eq(users.id, ticket.createdById))
    .limit(1);

  let claimer = null;
  if (ticket.claimedById) {
    const claimerRows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(users)
      .where(eq(users.id, ticket.claimedById))
      .limit(1);
    claimer = claimerRows[0] || null;
  }

  let history: any[] = [];
  const url = new URL(req.url);
  if (url.searchParams.get("includeHistory") === "true") {
    history = await db
      .select({
        id: ticketHistory.id,
        action: ticketHistory.action,
        details: ticketHistory.details,
        createdAt: ticketHistory.createdAt,
        user: { name: users.name },
      })
      .from(ticketHistory)
      .innerJoin(users, eq(ticketHistory.userId, users.id))
      .where(eq(ticketHistory.ticketId, params.id as any));
  }

  return NextResponse.json({
    ticket: { ...ticket, createdBy: creatorRows[0], claimedBy: claimer },
    history,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

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

  if (ticket.claimedById !== userId && ticket.createdById !== userId) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (body.status && body.status !== ticket.status) {
    updates.status = body.status;
    await db.insert(ticketHistory).values({
      ticketId: params.id,
      userId,
      action: "status_changed",
      details: `${ticket.status} → ${body.status}`,
    });
  }

  if (body.description) {
    updates.description = body.description;
  }

  await db.update(tickets).set(updates).where(eq(tickets.id, params.id as any));

  return NextResponse.json({ success: true });
}
