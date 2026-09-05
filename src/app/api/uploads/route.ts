import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { tickets, groupMembers, attachments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_FILES = 5;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { ticketId, files } = await req.json();

  if (!ticketId || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json(
      { error: "ticketId und Dateien sind erforderlich" },
      { status: 400 }
    );
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximal ${MAX_FILES} Dateien pro Upload` },
      { status: 400 }
    );
  }

  const ticketResult = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);
  const ticket = ticketResult[0];
  if (!ticket) {
    return NextResponse.json({ error: "Ticket nicht gefunden" }, { status: 404 });
  }

  const membership = await db
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, ticket.groupId), eq(groupMembers.userId, userId))
    )
    .limit(1);

  const canUpload =
    ticket.createdById === userId ||
    ticket.claimedById === userId ||
    membership.length > 0;

  if (!canUpload) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Hochladen" },
      { status: 403 }
    );
  }

  const inserted: { id: string; filename: string; size: number }[] = [];

  for (const file of files) {
    const name: string | undefined = file?.name;
    const data: string | undefined = file?.data;
    const mime: string = file?.type || "application/octet-stream";
    const size: number = file?.size || 0;

    if (!name || !data || data.length <= 0) continue;
    if (size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Datei "${name}" ist zu groß (max. 5 MB)` },
        { status: 400 }
      );
    }

    const id = crypto.randomUUID();
    await db.insert(attachments).values({
      id,
      ticketId,
      uploadedById: userId,
      filename: name,
      mimeType: mime,
      size,
      data,
    });
    inserted.push({ id, filename: name, size });
  }

  return NextResponse.json({ success: true, files: inserted });
}