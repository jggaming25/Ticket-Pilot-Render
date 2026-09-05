import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupMembers, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { isOwnerOrAdmin } from "@/lib/group-permissions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { email } = await req.json();

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

  if (!membership || !isOwnerOrAdmin(membership)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const targetRows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  const targetUser = targetRows[0];

  if (!targetUser) {
    return NextResponse.json(
      { error: "Kein Benutzer mit dieser Email gefunden" },
      { status: 404 }
    );
  }

  const existingRows = await db
    .select()
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, targetUser.id),
        eq(groupMembers.groupId, params.id as any)
      )
    )
    .limit(1);

  if (existingRows.length > 0) {
    return NextResponse.json(
      { error: "Benutzer ist bereits Mitglied" },
      { status: 400 }
    );
  }

  await db.insert(groupMembers).values({
    groupId: params.id,
    userId: targetUser.id,
    role: "member",
  });

  return NextResponse.json({ success: true });
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
  const { memberId, canManageSettings } = await req.json();

  if (!memberId || typeof canManageSettings !== "boolean") {
    return NextResponse.json(
      { error: "Ungültige Anfrage" },
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

  if (!membership || !isOwnerOrAdmin(membership)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db
    .update(groupMembers)
    .set({ canManageSettings })
    .where(eq(groupMembers.id, memberId));

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
  const { memberId } = await req.json();

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

  if (!membership || !isOwnerOrAdmin(membership)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db.delete(groupMembers).where(eq(groupMembers.id, memberId));

  return NextResponse.json({ success: true });
}
