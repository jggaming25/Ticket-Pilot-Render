import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ticketComments,
  ticketHistory,
  tickets,
  groups,
  groupMembers,
  groupSettings,
  users,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createNotificationsForMany, findUserIdsByEmails } from "@/lib/notify";
import { sendCommentNotice } from "@/lib/email";
import { getPublicBaseUrl } from "@/lib/site-url";

function parseEmails(raw?: string): string[] {
  if (!raw) return [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return Array.from(
    new Set(
      raw
        .split(/[;,]/)
        .map((e) => e.trim())
        .filter((e) => e && emailRegex.test(e))
    )
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const comments = await db
    .select({
      id: ticketComments.id,
      content: ticketComments.content,
      cc: ticketComments.cc,
      bcc: ticketComments.bcc,
      createdAt: ticketComments.createdAt,
      user: {
        id: users.id,
        name: users.name,
        image: users.image,
      },
    })
    .from(ticketComments)
    .innerJoin(users, eq(ticketComments.userId, users.id))
    .where(eq(ticketComments.ticketId, params.id as any));

  return NextResponse.json({ comments });
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
  const { content, cc, bcc } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json(
      { error: "Kommentar darf nicht leer sein" },
      { status: 400 }
    );
  }

  const ticketResult = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, params.id as any))
    .limit(1);
  const ticket = ticketResult[0];
  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket nicht gefunden" },
      { status: 404 }
    );
  }

  const groupResult = await db
    .select()
    .from(groups)
    .where(eq(groups.id, ticket.groupId))
    .limit(1);
  const group = groupResult[0];

  const settingsResult = await db
    .select()
    .from(groupSettings)
    .where(eq(groupSettings.groupId, ticket.groupId))
    .limit(1);
  const settings = settingsResult[0];
  const canCommentTickets = settings?.canCommentTickets !== false;

  const myMembership = await db
    .select({ role: groupMembers.role })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, ticket.groupId),
        eq(groupMembers.userId, userId)
      )
    )
    .limit(1);

  const isOwnerOrAdmin =
    group?.ownerId === userId ||
    myMembership[0]?.role === "owner" ||
    myMembership[0]?.role === "admin" ||
    (session.user as any).role === "admin";

  const isAssignee = ticket.claimedById === userId;
  const isCreator = ticket.createdById === userId;

  // Kommentar-Regel: nur Bearbeiter, Inhaber (+ Admins) und der Ersteller dürfen kommentieren.
  // Wenn "Mitarbeiter dürfen kommentieren" deaktiviert ist, nur Inhaber/Admin + Bearbeiter.
  const canComment =
    isAssignee || isCreator || isOwnerOrAdmin || canCommentTickets;

  if (!canComment) {
    return NextResponse.json(
      { error: "Keine Berechtigung zum Kommentieren" },
      { status: 403 }
    );
  }

  const ccList = parseEmails(cc);
  const bccList = parseEmails(bcc);

  await db.insert(ticketComments).values({
    ticketId: params.id,
    userId,
    content: content.trim(),
    cc: ccList.length ? ccList.join(", ") : null,
    bcc: bccList.length ? bccList.join(", ") : null,
  });

  await db.insert(ticketHistory).values({
    ticketId: params.id,
    userId,
    action: "commented",
  });

  // Benachrichtigungen: Bearbeiter, Ersteller, Inhaber/Admins + Nutzer aus CC (nicht der Autor)
  const ownerIds: string[] = [];
  if (group?.ownerId) ownerIds.push(group.ownerId);
  const admins = await db
    .select({ userId: groupMembers.userId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, ticket.groupId),
        eq(groupMembers.role, "admin")
      )
    );
  admins.forEach((a) => ownerIds.push(a.userId));

  const ccUserIds = await findUserIdsByEmails([...ccList, ...bccList]);

  const recipientIds = Array.from(
    new Set([
      ...(ticket.claimedById ? [ticket.claimedById] : []),
      ticket.createdById,
      ...ownerIds,
      ...Object.values(ccUserIds),
    ])
  );

  const ticketLabel = `TP-${String(ticket.ticketNumber).padStart(4, "0")}`;
  await createNotificationsForMany({
    userIds: recipientIds,
    excludeUserId: userId,
    ticketId: ticket.id,
    type: "comment",
    title: `Neuer Kommentar: ${ticketLabel}`,
    message: `${session.user?.name || "Jemand"} hat kommentiert: ${content
      .trim()
      .slice(0, 120)}`,
  });

  // E-Mails an CC/BCC-Empfaenger (extern und intern)
  const base = getPublicBaseUrl(req.nextUrl.host);
  const ticketUrl = `${base}/dashboard/ticket/${ticket.id}`;
  const authorName = session.user?.name || "Ein Nutzer";

  for (const email of ccList) {
    sendCommentNotice({
      toEmail: email,
      ticketLabel,
      ticketUrl,
      authorName,
      comment: content.trim(),
    }).catch(() => {});
  }
  for (const email of bccList) {
    sendCommentNotice({
      toEmail: email,
      ticketLabel,
      ticketUrl,
      authorName,
      comment: content.trim(),
      isBcc: true,
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}