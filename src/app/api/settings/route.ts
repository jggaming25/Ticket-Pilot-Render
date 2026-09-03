import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const userRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      discordUsername: users.discordId,
      robloxUsername: users.robloxUsername,
      theme: users.theme,
      loginVerificationEnabled: users.loginVerificationEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return NextResponse.json({ user: userRows[0] || null });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body = await req.json();

  const updates: Record<string, any> = { updatedAt: new Date() };

  if (body.name !== undefined) updates.name = body.name;
  if (body.discordUsername !== undefined)
    updates.discordId = body.discordUsername;
  if (body.robloxUsername !== undefined)
    updates.robloxUsername = body.robloxUsername;
  if (body.theme !== undefined) updates.theme = body.theme;
  if (body.loginVerificationEnabled !== undefined)
    updates.loginVerificationEnabled = body.loginVerificationEnabled;

  if (body.currentPassword && body.newPassword) {
    const userRows = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    const user = userRows[0];

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: "Kein Passwort gesetzt" },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(body.currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: "Falsches Passwort" },
        { status: 400 }
      );
    }

    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      );
    }

    updates.passwordHash = await bcrypt.hash(body.newPassword, 12);
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
