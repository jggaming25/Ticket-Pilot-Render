import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupSettings, groupMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canManageGroupSettings } from "@/lib/group-permissions";

const BOOLEAN_KEYS = [
  "canCloseTickets",
  "canClaimTickets",
  "canCommentTickets",
  "requireEmailVerification",
] as const;

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

  if (!membership || !canManageGroupSettings(membership)) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  const update: Record<string, unknown> = {};

  for (const key of BOOLEAN_KEYS) {
    if (typeof body[key] === "boolean") {
      update[key] = body[key];
    }
  }

  if (typeof body.nextActions === "string") {
    update.nextActions = body.nextActions;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Keine gültigen Felder" },
      { status: 400 }
    );
  }

  await db
    .update(groupSettings)
    .set(update)
    .where(eq(groupSettings.groupId, params.id as any));

  return NextResponse.json({ success: true });
}