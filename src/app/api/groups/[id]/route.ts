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

  const rawMembers = await db
    .select({
      id: groupMembers.id,
      role: groupMembers.role,
      userId: groupMembers.userId,
    })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, params.id as any));

  const enrichedMembers = await Promise.all(
    rawMembers.map(async (m) => {
      const userRows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          image: users.image,
        })
        .from(users)
        .where(eq(users.id, m.userId))
        .limit(1);
      return {
        ...m,
        user: userRows[0] || {
          id: m.userId,
          name: "",
          email: "",
          image: null,
        },
      };
    })
  );

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
      members: enrichedMembers,
      settings: settingsRows[0] || null,
      categories: cats,
    },
  });
}
