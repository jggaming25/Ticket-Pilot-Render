import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { siteAnnouncements } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import crypto from "crypto";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const rows = await db
      .select()
      .from(siteAnnouncements)
      .orderBy(desc(siteAnnouncements.createdAt));
    return NextResponse.json({ announcements: rows });
  } catch (e) {
    console.error("Admin announcements GET error:", e);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  try {
    const { message, color } = await req.json();

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Nachricht fehlt" },
        { status: 400 }
      );
    }

    const colorHex = /^#[0-9a-fA-F]{3,8}$/.test(color || "")
      ? color
      : "#ef4444";

    const id = crypto.randomUUID();
    await db.insert(siteAnnouncements).values({
      id,
      message: message.trim(),
      color: colorHex,
      active: true,
      createdById: (session!.user as any).id,
    });

    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error("Admin announcements POST error:", e);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "ID fehlt" }, { status: 400 });
    }
    await db
      .delete(siteAnnouncements)
      .where(eq(siteAnnouncements.id, id));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Admin announcements DELETE error:", e);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}