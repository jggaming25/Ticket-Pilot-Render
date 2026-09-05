import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { lte } from "drizzle-orm";

export const maxDuration = 10;

export async function GET() {
  try {
    await db.delete(users).where(lte(users.deleteAt, new Date()));
  } catch {
    // ignorieren - Ping soll nie fehlschlagen
  }
  return NextResponse.json({ ok: true, time: Date.now() });
}