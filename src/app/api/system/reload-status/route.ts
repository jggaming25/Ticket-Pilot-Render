import { NextRequest, NextResponse } from "next/server";
import { getReloadTick } from "@/lib/reload-signal";

export async function GET(req: NextRequest) {
  const since = Number(req.nextUrl.searchParams.get("since")) || 0;
  const tick = await getReloadTick();

  return NextResponse.json({ tick, reload: tick > since });
}