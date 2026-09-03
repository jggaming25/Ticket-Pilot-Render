import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { groupSettings, groupMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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

  if (
    !membership ||
    (membership.role !== "owner" && membership.role !== "admin")
  ) {
    return NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 });
  }

  await db
    .update(groupSettings)
    .set(body)
    .where(eq(groupSettings.groupId, params.id as any));

  return NextResponse.json({ success: true });
}
