import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  groups,
  groupMembers,
  groupSettings,
  categories,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const groupRows = await db
    .select()
    .from(groups)
    .where(eq(groups.id, params.id as any))
    .limit(1);
  const groupData = groupRows[0];

  if (!groupData) {
    return NextResponse.json(
      { error: "Gruppe nicht gefunden" },
      { status: 404 }
    );
  }

  // Mitglieder per JOIN laden (kein N+1)
  const members = await db
    .select({
      id: groupMembers.id,
      role: groupMembers.role,
      canManageSettings: groupMembers.canManageSettings,
      userId: groupMembers.userId,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      },
    })
    .from(groupMembers)
    .innerJoin(users, eq(groupMembers.userId, users.id))
    .where(eq(groupMembers.groupId, params.id as any));

  const settingsRows = await db
    .select()
    .from(groupSettings)
    .where(eq(groupSettings.groupId, params.id as any))
    .limit(1);

  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.groupId, params.id as any));

  return NextResponse.json({
    group: {
      ...groupData,
      members,
      settings: settingsRows[0] || null,
      categories: cats,
    },
  });
}