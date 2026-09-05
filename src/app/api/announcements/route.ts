import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { siteAnnouncements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const rows = await db
      .select({
        id: siteAnnouncements.id,
        message: siteAnnouncements.message,
        color: siteAnnouncements.color,
      })
      .from(siteAnnouncements)
      .where(eq(siteAnnouncements.active, true));

    return NextResponse.json({ announcements: rows });
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json({ announcements: [] });
  }
}