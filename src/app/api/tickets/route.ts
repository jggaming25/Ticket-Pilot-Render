import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, groupMembers, categories, attachments } from "@/lib/db/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);

  const statusFilter = searchParams.get("status") || "all";
  const priorityFilter = searchParams.get("priority") || "all";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const groupId = searchParams.get("groupId");
  const mineOnly = searchParams.get("mine") === "true";

  const userGroups = await db
    .select({ groupId: groupMembers.groupId })
    .from(groupMembers)
    .where(eq(groupMembers.userId, userId));

  const groupIds = userGroups.map((g) => g.groupId);

  if (groupIds.length === 0) {
    return NextResponse.json({ tickets: [] });
  }

  const orderFn = sortOrder === "asc" ? asc : desc;
  let orderColumn;
  switch (sortBy) {
    case "dueDate":
      orderColumn = tickets.dueDate;
      break;
    case "ticketNumber":
      orderColumn = tickets.ticketNumber;
      break;
    default:
      orderColumn = tickets.createdAt;
  }

  const conditions = [
    sql`${tickets.groupId} IN (${sql.join(
      groupIds.map((id) => sql`${id}`),
      sql`, `
    )})`,
  ];

  if (statusFilter !== "all") {
    conditions.push(eq(tickets.status, statusFilter as any));
  }
  if (priorityFilter !== "all") {
    conditions.push(eq(tickets.priority, priorityFilter as any));
  }
  if (groupId) {
    conditions.push(eq(tickets.groupId, groupId as any));
  }
  if (mineOnly) {
    conditions.push(eq(tickets.createdById, userId));
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
    .where(and(...conditions))
    .orderBy(orderFn(orderColumn));

  return NextResponse.json({ tickets: result });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();
  const {
    description,
    priority,
    groupId,
    categoryId,
    discordUsername,
    robloxUsername,
    dueDate,
    attachments: attachmentFiles,
  } = body;

  if (!description || !groupId || !categoryId) {
    return NextResponse.json(
      { error: "Beschreibung, Gruppe und Kategorie sind erforderlich" },
      { status: 400 }
    );
  }

  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.userId, userId), eq(groupMembers.groupId, groupId))
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json(
      { error: "Kein Mitglied dieser Gruppe" },
      { status: 403 }
    );
  }

  const lastTickets = await db
    .select({ ticketNumber: tickets.ticketNumber })
    .from(tickets)
    .where(eq(tickets.groupId, groupId))
    .orderBy(desc(tickets.ticketNumber))
    .limit(1);

  const nextNumber = (lastTickets[0]?.ticketNumber || 0) + 1;

  const cat = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);

  const userName = session.user?.name || "User";
  const subject = `TP-${String(nextNumber).padStart(4, "0")} - ${
    cat[0]?.name || "Ticket"
  } - ${userName}`;

  const ticketId = crypto.randomUUID();

  await db.insert(tickets).values({
    id: ticketId,
    ticketNumber: nextNumber,
    subject,
    description,
    status: "open",
    priority: priority || "medium",
    groupId,
    categoryId,
    createdById: userId,
    discordUsername: discordUsername || null,
    robloxUsername: robloxUsername || null,
    dueDate: dueDate ? new Date(dueDate) : null,
  });

  if (Array.isArray(attachmentFiles)) {
    for (const file of attachmentFiles) {
      if (!file?.name || !file?.data) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      await db.insert(attachments).values({
        ticketId,
        uploadedById: userId,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size || 0,
        data: file.data,
      });
    }
  }

  return NextResponse.json({ ticket: { id: ticketId, subject } });
}
