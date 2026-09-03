import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Ably from "ably";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Ably nicht konfiguriert" }, { status: 503 });
  }

  const userId = (session.user as any).id;
  const client = new Ably.Realtime({ key: apiKey });

  try {
    const tokenRequest = await client.auth.createTokenRequest({
      capability: { "*": ["publish", "subscribe", "presence"] },
      clientId: userId,
    });

    return NextResponse.json(tokenRequest);
  } catch (error) {
    return NextResponse.json({ error: "Token-Generierung fehlgeschlagen" }, { status: 500 });
  }
}
