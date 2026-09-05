"use client";

import { useSession } from "next-auth/react";
import { isBanActive } from "@/lib/utils";

export function BanGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const user = session?.user as any;
  const banned = user && isBanActive(user.banned, user.bannedUntil);

  if (!banned) return <>{children}</>;

  const banReason = user.banReason || "Du wurdest von dieser Website gesperrt.";
  const bannedUntil = user.bannedUntil;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-500/40 bg-card p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
          <svg
            className="h-8 w-8 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636M12 8v4m0 4h.01"
            />
          </svg>
        </div>
        <h2 className="text-xl font-bold mb-2">Dein Konto ist gesperrt</h2>
        <p className="text-muted-foreground mb-2">{banReason}</p>
        {bannedUntil ? (
          <p className="text-sm text-muted-foreground mb-4">
            Gesperrt bis:{" "}
            <span className="font-medium text-foreground">
              {new Date(bannedUntil).toLocaleString("de-DE")}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">
            Gesperrt ohne Zeitlimit.
          </p>
        )}
      </div>
    </div>
  );
}