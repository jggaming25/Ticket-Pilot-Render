import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, emailVerifications } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { getPublicBaseUrl } from "@/lib/site-url";

export async function GET(req: NextRequest) {
  const base = getPublicBaseUrl(req.nextUrl.host);
  const token = req.nextUrl.searchParams.get("token");
  const type = req.nextUrl.searchParams.get("type");

  if (!token || !type) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent("Ungültiger Link")}`, base)
    );
  }

  const results = await db
    .select()
    .from(emailVerifications)
    .where(
      and(
        eq(emailVerifications.token, token as any),
        eq(emailVerifications.type, type as any),
        gt(emailVerifications.expires, new Date())
      )
    )
    .limit(1);

  const verification = results[0];

  if (!verification) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("Link abgelaufen oder ungültig")}`,
        base
      )
    );
  }

  if (type === "register") {
    await db
      .update(users)
      .set({ emailVerified: new Date() })
      .where(eq(users.id, verification.userId));
  }

  await db
    .delete(emailVerifications)
    .where(eq(emailVerifications.id, verification.id));

  return NextResponse.redirect(
    new URL(
      `/login?success=${encodeURIComponent("Email bestätigt! Du kannst dich jetzt einloggen.")}`,
      base
    )
  );
}
