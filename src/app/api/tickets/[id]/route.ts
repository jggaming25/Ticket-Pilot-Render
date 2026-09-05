import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  tickets,
  categories,
  users,
  ticketHistory,
  groups,
  groupMembers,
  groupSettings,
  attachments,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
      email: tickets.email,
      nextAction: tickets.nextAction,
      dueDate: tickets.dueDate,
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      discordUsername: tickets.discordUsername,
      robloxUsername: tickets.robloxUsername,
      createdById: tickets.createdById,
      claimedById: tickets.claimedById,
      groupId: tickets.groupId,
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

  const attachmentRows = await db
    .select({
      id: attachments.id,
      filename: attachments.filename,
      mimeType: attachments.mimeType,
      size: attachments.size,
      createdAt: attachments.createdAt,
      uploadedBy: { name: users.name },
    })
    .from(attachments)
    .leftJoin(users, eq(attachments.uploadedById, users.id))
    .where(eq(attachments.ticketId, params.id as any));

  // Rechte-Info für die UI
  const mine = (session.user as any).id;
  const settingsRows = await db
    .select()
    .from(groupSettings)
    .where(eq(groupSettings.groupId, ticket.groupId))
    .limit(1);
  const nextActionsRaw = settingsRows[0]?.nextActions || "[]";
  let nextActions: string[] = [];
  try {
    const parsed = JSON.parse(nextActionsRaw);
    if (Array.isArray(parsed)) {
      nextActions = parsed.filter((a) => typeof a === "string");
    }
  } catch {
    nextActions = [];
  }
  const myRoleRows = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, ticket.groupId),
        eq(groupMembers.userId, mine)
      )
    )
    .limit(1);
  const groupOwnerRows = await db
    .select({ ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.id, ticket.groupId))
    .limit(1);

  const myRole = myRoleRows[0]?.role || null;
  const isOwnerOrAdmin =
    groupOwnerRows[0]?.ownerId === mine ||
    myRole === "owner" ||
    myRole === "admin" ||
    (session.user as any).role === "admin";

  return NextResponse.json({
    ticket: {
      ...ticket,
      createdBy: creatorRows[0],
      claimedBy: claimer,
      attachments: attachmentRows,
      canCloseTickets: settingsRows[0]?.canCloseTickets !== false,
      nextActions,
      myRole,
      isOwnerOrAdmin,
    },
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

  // Rollen im Kontext der Gruppe ermitteln
  const myMembership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, ticket.groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .limit(1);

  const groupResult = await db
    .select({ ownerId: groups.ownerId })
    .from(groups)
    .where(eq(groups.id, ticket.groupId))
    .limit(1);
  const group = groupResult[0];

  const isOwnerOrAdmin =
    group?.ownerId === userId ||
    myMembership[0]?.role === "owner" ||
    myMembership[0]?.role === "admin" ||
    (session.user as any).role === "admin";
  const isAssignee = ticket.claimedById === userId;
  const isCreator = ticket.createdById === userId;

  if (!isAssignee && !isCreator && !isOwnerOrAdmin) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const settingsResult = await db
    .select()
    .from(groupSettings)
    .where(eq(groupSettings.groupId, ticket.groupId))
    .limit(1);
  const canCloseTickets = settingsResult[0]?.canCloseTickets !== false;

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (body.status && body.status !== ticket.status) {
    const newStatus = body.status as string;

    // Schließen: nur Inhaber/Admins, wenn "Mitarbeiter dürfen schließen" deaktiviert ist
    if (newStatus === "closed") {
      if (!canCloseTickets && !isOwnerOrAdmin) {
        return NextResponse.json(
          { error: "Nur der Gruppeninhaber kann dieses Ticket schließen" },
          { status: 403 }
        );
      }
    }

    // Produktivstatus/Gelöst darf nur von Bearbeiter/Inhaber gesetzt werden
    if (["in_progress", "resolved"].includes(newStatus) && !isAssignee && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Nur der Bearbeiter kann diesen Status setzen" },
        { status: 403 }
      );
    }

    updates.status = newStatus;

    const historyAction =
      newStatus === "ready_to_close"
        ? "ready_to_close"
        : newStatus === "closed"
        ? "closed"
        : "status_changed";

    await db.insert(ticketHistory).values({
      ticketId: params.id,
      userId,
      action: historyAction,
      details:
        historyAction === "status_changed"
          ? `${ticket.status} → ${newStatus}`
          : null,
    });
  }

  if (body.description) {
    updates.description = body.description;
  }

  // Fälligkeitsdatum & nächste Aktion: nur durch Bearbeiter/Inhaber/Admin
  if ("dueDate" in body || "nextAction" in body) {
    if (!isAssignee && !isOwnerOrAdmin) {
      return NextResponse.json(
        { error: "Nur der Bearbeiter kann Fälligkeitsdatum oder nächste Aktion setzen" },
        { status: 403 }
      );
    }

    if ("dueDate" in body) {
      if (body.dueDate === null || body.dueDate === "") {
        updates.dueDate = null;
      } else {
        const d = new Date(body.dueDate);
        if (isNaN(d.getTime())) {
          return NextResponse.json(
            { error: "Ungültiges Datum" },
            { status: 400 }
          );
        }
        updates.dueDate = d;
      }
    }

    if ("nextAction" in body) {
      if (body.nextAction === null || body.nextAction === "") {
        updates.nextAction = null;
      } else {
        if (typeof body.nextAction !== "string") {
          return NextResponse.json(
            { error: "Ungültige nächste Aktion" },
            { status: 400 }
          );
        }
        updates.nextAction = body.nextAction.slice(0, 300);
      }
    }
  }

  await db.update(tickets).set(updates).where(eq(tickets.id, params.id as any));

  return NextResponse.json({ success: true });
}
