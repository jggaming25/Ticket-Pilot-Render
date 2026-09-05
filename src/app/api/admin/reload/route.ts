import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-guard";
import { bumpReloadTick } from "@/lib/reload-signal";
import Ably from "ably";

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  const tick = bumpReloadTick();

  // Zusätzlicher Echtzeit-Broadcast, falls Ably konfiguriert ist
  const apiKey = process.env.ABLY_API_KEY;
  if (apiKey) {
    try {
      const client = new Ably.Rest({ key: apiKey });
      await client.channels.get("site-control").publish("reload", { ts: tick });
    } catch {
      // Broadcast optional - Polling bleibt der zuverlässige Pfad
    }
  }

  return NextResponse.json({ success: true, tick });
}