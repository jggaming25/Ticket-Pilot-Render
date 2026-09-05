import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, lte } from "drizzle-orm";
import { desc } from "drizzle-orm";
import { isBanActive } from "@/lib/utils";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    // Abgelaufene geplante Löschungen ausführen
    await db.delete(users).where(lte(users.deleteAt, new Date()));

    // Abgelaufene temporäre Sperren automatisch aufheben
    const expiredBans = await db
      .select({ id: users.id, bannedUntil: users.bannedUntil })
      .from(users)
      .where(and(eq(users.banned, true), lte(users.bannedUntil, new Date())));
    for (const u of expiredBans) {
      if (!u.bannedUntil) continue;
      await db
        .update(users)
        .set({ banned: false, banReason: null, bannedUntil: null })
        .where(eq(users.id, u.id));
    }

    const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        emailVerified: users.emailVerified,
        role: users.role,
        banned: users.banned,
        banReason: users.banReason,
        bannedUntil: users.bannedUntil,
        deleteAt: users.deleteAt,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const safe = rows.map((u) => ({ ...u, banned: isBanActive(u.banned, u.bannedUntil) }));

    return NextResponse.json({ users: safe });
  } catch (e) {
    console.error("Admin users GET error:", e);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await req.json();
    const action = body.action as string;
    const id = body.id as string;

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Nutzer fehlt" }, { status: 400 });
    }

    const target = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (target.length === 0) {
      return NextResponse.json(
        { error: "Nutzer nicht gefunden" },
        { status: 404 }
      );
    }

    switch (action) {
      case "ban": {
        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 300) : null;
        const restriction = body.restriction as string | undefined;
        let bannedUntil: Date | null = null;
        if (restriction === "until") {
          const until = new Date(body.until);
          if (isNaN(until.getTime())) {
            return NextResponse.json(
              { error: "Ungültiges Datum" },
              { status: 400 }
            );
          }
          bannedUntil = until;
        }
        await db
          .update(users)
          .set({ banned: true, banReason: reason, bannedUntil })
          .where(eq(users.id, id));
        return NextResponse.json({ success: true });
      }
      case "unban": {
        await db
          .update(users)
          .set({ banned: false, banReason: null, bannedUntil: null })
          .where(eq(users.id, id));
        return NextResponse.json({ success: true });
      }
      case "delete-now": {
        await db.delete(users).where(eq(users.id, id));
        return NextResponse.json({ success: true });
      }
      case "delete-at": {
        const del = new Date(body.deleteAt);
        if (isNaN(del.getTime())) {
          return NextResponse.json(
            { error: "Ungültiges Datum" },
            { status: 400 }
          );
        }
        await db
          .update(users)
          .set({ deleteAt: del })
          .where(eq(users.id, id));
        return NextResponse.json({ success: true });
      }
      case "cancel-delete": {
        await db
          .update(users)
          .set({ deleteAt: null })
          .where(eq(users.id, id));
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json(
          { error: "Unbekannte Aktion" },
          { status: 400 }
        );
    }
  } catch (e) {
    console.error("Admin users POST error:", e);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}