import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groups, groupMembers, groupSettings, categories } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { generateSlug } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const userGroups = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      description: groups.description,
      role: groupMembers.role,
    })
    .from(groups)
    .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
    .where(eq(groupMembers.userId, userId));

  const groupsWithCounts = await Promise.all(
    userGroups.map(async (g) => {
      const memberCounts = await db
        .select({ count: count() })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, g.id));
      return { ...g, memberCount: memberCounts[0]?.count || 0, ticketCount: 0 };
    })
  );

  return NextResponse.json({ groups: groupsWithCounts });
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
