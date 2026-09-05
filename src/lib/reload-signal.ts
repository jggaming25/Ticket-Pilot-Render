import { db } from "@/lib/db";
import { systemState } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Ablaufzeit eines Reload-Befehls: Nach dieser Zeit wird ein Befehl ignoriert,
// damit (auch für neu geöffnete Tabs) nichts mehr neu geladen wird.
const RELOAD_TTL_MS = 60_000;

const KEY = "reload_tick";

export async function bumpReloadTick(): Promise<number> {
  const rows = await db
    .select({ value: systemState.value })
    .from(systemState)
    .where(eq(systemState.key, KEY));
  const count = Number(rows[0]?.value) || 0;
  const next = count + 1;

  await db
    .insert(systemState)
    .values({ key: KEY, value: String(next), updatedAt: new Date() })
    .onConflictDoUpdate({
      target: systemState.key,
      set: { value: String(next), updatedAt: new Date() },
    });

  return next;
}

export async function getReloadTick(): Promise<number> {
  const rows = await db
    .select({ value: systemState.value, updatedAt: systemState.updatedAt })
    .from(systemState)
    .where(eq(systemState.key, KEY));
  if (rows.length === 0) return 0;

  const row = rows[0];
  const updatedAt = row.updatedAt instanceof Date ? row.updatedAt.getTime() : Number(row.updatedAt);
  if (Date.now() - updatedAt > RELOAD_TTL_MS) return 0;

  return Number(row.value) || 0;
}