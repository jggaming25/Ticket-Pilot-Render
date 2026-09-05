"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { Users, Plus } from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: string | null;
  canManageSettings: boolean;
  memberCount: number;
  ticketCount: number;
}

export default function GroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<GroupData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/groups")
        .then((r) => r.json())
        .then((d) => {
          setGroups(d.groups || []);
          setLoading(false);
        });
    }
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Meine Gruppen</h1>
          <Link
            href="/groups/create"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Gruppe gründen
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine Gruppen</h3>
            <p className="text-muted-foreground mb-4">
              Erstelle deine erste Gruppe um Tickets zu verwalten.
            </p>
            <Link
              href="/groups/create"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Gruppe gründen
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {groups.map((group) => (
              <Link
                key={group.id}
                href={`/tickets?groupId=${group.id}`}
                className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 hover:shadow-lg hover:border-brand-500/50 transition-all"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-brand-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.memberCount} Mitarbeiter · {group.ticketCount}{" "}
                      Tickets ·{" "}
                      {group.role === "owner"
                        ? "Inhaber"
                        : group.role === "admin"
                        ? "Admin"
                        : "Mitarbeiter"}
                    </p>
                    {group.canManageSettings && (
                      <p className="text-xs text-brand-500 mt-0.5">
                        Du kannst die Einstellungen verwalten
                      </p>
                    )}
                  </div>
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-muted-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
