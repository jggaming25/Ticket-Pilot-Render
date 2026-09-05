import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Nicht autorisiert" },
        { status: 401 }
      ),
    };
  }
  if (!isAdminUser(session.user as any)) {
    return {
      session,
      error: NextResponse.json(
        { error: "Keine Admin-Berechtigung" },
        { status: 403 }
      ),
    };
  }
  return { session, error: null };
}