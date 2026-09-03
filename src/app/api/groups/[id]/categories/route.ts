import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, groupMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.groupId, params.id as any));

  return NextResponse.json({ categories: cats });
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
  const { name, color } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 }
    );
  }

  const membershipRows = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.groupId, params.id as any)
      )
    )
    .limit(1);
  const membership = membershipRows[0];

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db.insert(categories).values({
    groupId: params.id,
    name: name.trim(),
    color: color || "#6366f1",
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
  const { categoryId } = await req.json();

  const membershipRows = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.groupId, params.id as any)
      )
    )
    .limit(1);
  const membership = membershipRows[0];

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db.delete(categories).where(eq(categories.id, categoryId));

  return NextResponse.json({ success: true });
}
