"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { Ticket, LogOut, Settings, LayoutDashboard, Users } from "lucide-react";
import { useState } from "react";

export function TopBar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Ticket className="h-6 w-6 text-brand-500" />
          <span>Ticket Pilot</span>
        </Link>

        <nav className="flex items-center gap-3">
          <ThemeToggle />

          {session ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                {session.user?.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white font-bold">
                    {session.user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                )}
                <span className="hidden sm:inline">
                  {session.user?.name || "User"}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-card p-2 shadow-xl">
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      {session.user?.email}
                    </div>
                    <hr className="my-1 border-border" />
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      href="/groups"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <Users className="h-4 w-4" />
                      Meine Gruppen
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4" />
                      Einstellungen
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Abmelden
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="rounded-lg bg-secondary/50 px-4 py-2 text-sm font-medium hover:bg-secondary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                Registrieren
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
