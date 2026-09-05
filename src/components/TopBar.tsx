"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { AnnouncementBar } from "./AnnouncementBar";
import { playTabClick } from "@/lib/clickSound";
import {
  Ticket,
  LogOut,
  Settings,
  Users,
  Shield,
  Bell,
  Inbox,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef } from "react";

interface NotificationItem {
  id: string;
  ticketId: string | null;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  ticketEmail: string | null;
}

export function TopBar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isAdmin = (session?.user as any)?.role === "admin";

  const fetchNotifications = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnread(data.unread || 0);
      }
    } catch {
      // still
    }
  }, [session]);

  useEffect(() => {
    if (!session) {
      setNotifications([]);
      setUnread(0);
      return;
    }
    fetchNotifications();
    timerRef.current = setInterval(() => {
      // Nur pollieren, wenn der Tab sichtbar ist (reduziert Serveranfragen)
      if (document.visibilityState === "visible") fetchNotifications();
    }, 15000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchNotifications();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [session, fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnread(0);
  };

  const tabs = [
    { href: "/groups", label: "Gruppen", icon: Users },
    { href: "/meine-tickets", label: "Meine Tickets", icon: Ticket },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Ticket className="h-6 w-6 text-brand-500" />
            <span>Ticket Pilot</span>
          </Link>

          <nav className="flex items-center gap-3">
            <ThemeToggle />

            {session ? (
              <>
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      setMenuOpen(false);
                    }}
                    className="relative flex items-center justify-center h-9 w-9 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors"
                    aria-label="Benachrichtigungen"
                  >
                    <Bell className="h-5 w-5" />
                    {unread > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {unread}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setNotifOpen(false)}
                      />
                      <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-card p-3 shadow-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">
                            Benachrichtigungen
                          </span>
                          {unread > 0 && (
                            <button
                              onClick={markAllRead}
                              className="text-xs text-brand-500 hover:text-brand-600"
                            >
                              Alle als gelesen
                            </button>
                          )}
                        </div>
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            <Inbox className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            Keine Benachrichtigungen
                          </div>
                        ) : (
                          <div className="max-h-80 overflow-y-auto space-y-1">
                            {notifications.map((n) => (
                              <Link
                                key={n.id}
                                href={
                                  n.ticketId
                                    ? `/dashboard/ticket/${n.ticketId}`
                                    : "/meine-tickets"
                                }
                                onClick={() => setNotifOpen(false)}
                                className={`block rounded-lg px-3 py-2 hover:bg-secondary transition-colors ${
                                  !n.read ? "bg-secondary/40" : ""
                                }`}
                              >
                                <div className="text-sm font-medium flex items-center gap-1.5">
                                  {!n.read && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{n.title}</span>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {n.message}
                                </p>
                                {n.ticketEmail && (
                                  <p className="text-xs text-brand-500/90 truncate mt-0.5">
                                    {n.ticketEmail}
                                  </p>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setMenuOpen(!menuOpen);
                      setNotifOpen(false);
                    }}
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
                          href="/settings"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                        >
                          <Settings className="h-4 w-4" />
                          Einstellungen
                        </Link>
                        {isAdmin && (
                          <Link
                            href="/admin"
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-secondary transition-colors"
                          >
                            <Shield className="h-4 w-4" />
                            Admin-Dashboard
                          </Link>
                        )}
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
              </>
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

        {session && (
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {tabs.map((tab) => {
              const active =
                pathname === tab.href || pathname.startsWith(tab.href + "/");
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  onClick={playTabClick}
                  className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? "text-brand-500 border-brand-500"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </header>
      <AnnouncementBar />
    </>
  );
}