import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getReloadTick } from "@/lib/reload-signal";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht autorisiert" }, { status: 401 });
  }

  const since = Number(req.nextUrl.searchParams.get("since")) || 0;
  const tick = getReloadTick();

  return NextResponse.json({ tick, reload: tick > since });
}