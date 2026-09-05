import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendPasswordReset } from "@/lib/email";

export const runtime = "nodejs";

function generatePassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(24);
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += alphabet[bytes[i] % alphabet.length];
  }
  return password;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawEmail = typeof body.email === "string" ? body.email : "";
    const email = rawEmail.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { error: "Bitte gib eine gültige E-Mail-Adresse ein." },
        { status: 400 }
      );
    }

    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    const user = result[0];

    // Kein Konto gefunden -> trotzdem "ok" antworten, damit keine
    // E-Mail-Adressen ausgespäht werden können.
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    const newPassword = generatePassword();

    const mailResult = await sendPasswordReset(email, newPassword);
    if (!mailResult.success) {
      return NextResponse.json(
        { error: "Die E-Mail konnte nicht gesendet werden. Bitte versuche es später erneut." },
        { status: 500 }
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash, emailVerified: new Date() })
      .where(eq(users.id, user.id));

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Interner Fehler." },
      { status: 500 }
    );
  }
}