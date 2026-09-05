import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, groupMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { canManageGroupSettings } from "@/lib/group-permissions";

const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

async function requireManager(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      error: NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 }),
      response: null as NextResponse | null,
    };
  }

  const userId = (session.user as any).id;
  const membershipRows = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.userId, userId), eq(groupMembers.groupId, groupId))
    )
    .limit(1);
  const membership = membershipRows[0];

  if (!membership || !canManageGroupSettings(membership)) {
    return {
      error: NextResponse.json({ error: "Keine Berechtigung" }, { status: 403 }),
      response: null as NextResponse | null,
    };
  }

  return { error: null as NextResponse | null, response: null as NextResponse | null };
}

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
  const { error } = await requireManager(params.id);
  if (error) return error;

  const { name, color, priority } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Name ist erforderlich" },
      { status: 400 }
    );
  }

  const priorityValue = VALID_PRIORITIES.includes(priority) ? priority : "medium";

  const row = await db
    .insert(categories)
    .values({
      groupId: params.id,
      name: name.trim(),
      color: color || "#6366f1",
      priority: priorityValue,
    })
    .returning();

  return NextResponse.json({ success: true, category: row[0] });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireManager(params.id);
  if (error) return error;

  const { categoryId, name, color, priority } = await req.json();

  if (!categoryId) {
    return NextResponse.json(
      { error: "Kategorie fehlt" },
      { status: 400 }
    );
  }

  const update: Record<string, unknown> = {};
  if (typeof name === "string" && name.trim()) update.name = name.trim();
  if (typeof color === "string") update.color = color;
  if (VALID_PRIORITIES.includes(priority)) update.priority = priority;

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Keine gültigen Felder" },
      { status: 400 }
    );
  }

  const row = await db
    .update(categories)
    .set(update)
    .where(eq(categories.id, categoryId))
    .returning();

  return NextResponse.json({ success: true, category: row[0] });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { error } = await requireManager(params.id);
  if (error) return error;

  const { categoryId } = await req.json();

  await db.delete(categories).where(eq(categories.id, categoryId));

  return NextResponse.json({ success: true });
}