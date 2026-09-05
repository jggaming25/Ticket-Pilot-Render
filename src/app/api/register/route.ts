import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { users, emailVerifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendVerificationEmail } from "@/lib/email";
import { isAdminEmail } from "@/lib/admin";

const BASE_URLS = [
  process.env.NEXTAUTH_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean) as string[];

function getBaseUrl(req: NextRequest): string {
  const fromReq = `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  for (const cand of [fromReq, ...BASE_URLS]) {
    if (cand && /^https?:\/\//.test(cand)) {
      try {
        new URL("/", cand);
        return cand;
      } catch {
        // weiter
      }
    }
  }
  return "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, Email und Passwort sind erforderlich" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 }
      );
    }

    const existing = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Diese Email ist bereits registriert" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const userId = crypto.randomUUID();
    const role = isAdminEmail(email) ? "admin" : "user";

    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash,
      role,
    });

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.insert(emailVerifications).values({
      userId,
      token,
      type: "register",
      expires,
    });

    const baseUrl = getBaseUrl(req);
    const emailResult = await sendVerificationEmail(email, token, "register", baseUrl);

    if (!emailResult.success) {
      console.error("Register: Email konnte nicht gesendet werden", emailResult.error);
      return NextResponse.json(
        {
          message:
            "Konto erstellt, aber die Bestätigungs-Email konnte nicht gesendet werden. Bitte kontaktiere uns.",
          emailFailed: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({
      message: "Registrierung erfolgreich! Bitte bestätige deine Email.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}