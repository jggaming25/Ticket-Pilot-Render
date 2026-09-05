import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers, groupSettings, categories, tickets } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { generateSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const all = req.nextUrl.searchParams.get("all") === "true";

  // Zählungen ohne N+1: eine Query pro Tabelle, aufgeteilt per GROUP BY
  const memberCountRows = await db
    .select({ groupId: groupMembers.groupId, count: count() })
    .from(groupMembers)
    .groupBy(groupMembers.groupId);

  const openTicketCountRows = await db
    .select({ groupId: tickets.groupId, count: count() })
    .from(tickets)
    .where(eq(tickets.status, "open"))
    .groupBy(tickets.groupId);

  const ticketCountRows = await db
    .select({ groupId: tickets.groupId, count: count() })
    .from(tickets)
    .groupBy(tickets.groupId);

  const memberCountMap = new Map(
    memberCountRows.map((r) => [r.groupId, r.count])
  );
  const openTicketCountMap = new Map(
    openTicketCountRows.map((r) => [r.groupId, r.count])
  );
  const ticketCountMap = new Map(
    ticketCountRows.map((r) => [r.groupId, r.count])
  );

  let result: any[];

  if (all) {
    // Alle existierenden Gruppen (für die Ticket-Erstellung), ohne Mitgliedschafts-Check
    const allGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        slug: groups.slug,
        description: groups.description,
      })
      .from(groups)
      .orderBy(groups.name);

    const membershipRows = await db
      .select({
        groupId: groupMembers.groupId,
        role: groupMembers.role,
        canManageSettings: groupMembers.canManageSettings,
      })
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));

    const membershipMap = new Map(
      membershipRows.map((m) => [m.groupId, m])
    );

    result = allGroups.map((g) => {
      const membership = membershipMap.get(g.id);
      return {
        ...g,
        role: membership?.role || null,
        canManageSettings: membership?.canManageSettings || false,
        memberCount: memberCountMap.get(g.id) || 0,
        ticketCount: ticketCountMap.get(g.id) || 0,
      };
    });
  } else {
    const userGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        slug: groups.slug,
        description: groups.description,
        role: groupMembers.role,
        canManageSettings: groupMembers.canManageSettings,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.userId, userId));

    result = userGroups.map((g) => ({
      ...g,
      memberCount: memberCountMap.get(g.id) || 0,
      ticketCount: ticketCountMap.get(g.id) || 0,
    }));
  }

  return NextResponse.json({
    groups: result.map((g) => ({
      ...g,
      openTicketCount: openTicketCountMap.get(g.id) || 0,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { name, description } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Gruppenname ist erforderlich" },
      { status: 400 }
    );
  }

  const slug = generateSlug(name);
  const groupId = crypto.randomUUID();

  await db.insert(groups).values({
    id: groupId,
    name: name.trim(),
    slug,
    description: description || null,
    ownerId: userId,
  });

  await db.insert(groupMembers).values({
    groupId,
    userId,
    role: "owner",
    canManageSettings: true,
  });

  await db.insert(groupSettings).values({
    groupId,
    canCloseTickets: true,
    canClaimTickets: true,
    canCommentTickets: true,
    requireEmailVerification: false,
  });

  const defaultCategories = ["Support", "Bug", "Feature", "Allgemein"];
  const colors = ["#3b82f6", "#ef4444", "#22c55e", "#a855f7"];
  for (let i = 0; i < defaultCategories.length; i++) {
    await db.insert(categories).values({
      groupId,
      name: defaultCategories[i],
      color: colors[i],
      order: i,
    });
  }

  return NextResponse.json({ group: { id: groupId, slug } });
}