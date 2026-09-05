"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { formatDate, getStatusLabel, getPriorityLabel, getStatusColor } from "@/lib/utils";
import {
  Plus,
  Ticket,
  Users,
  Clock,
  ArrowRight,
} from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: number;
  subject: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  createdById: string;
  claimedById: string | null;
  category: { name: string; color: string } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);

  const userId = (session?.user as any)?.id;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetch("/api/tickets")
        .then((r) => r.json())
        .then((d) => {
          setTickets(d.tickets || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [session]);

  const myTickets = tickets.filter(
    (t) => t.createdById === userId || t.claimedById === userId
  );
  const assignedToMe = myTickets.filter((t) => {
    if (t.claimedById !== userId) return false;
    return !["closed", "resolved"].includes(t.status);
  });
  const createdByMe = myTickets.filter((t) => t.createdById === userId && !["closed"].includes(t.status));

  const allOpen = tickets.filter((t) => !["closed", "resolved"].includes(t.status)).length;

  if (status === "loading") {
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold">
            Hallo, {session?.user?.name || "willkommen"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hier hast du deine Tickets im Blick und kannst sie bearbeiten.
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Offene Tickets" value={allOpen} color="text-blue-500" />
          <StatCard label="Mir zugewiesen" value={assignedToMe.length} color="text-yellow-500" />
          <StatCard label="Von mir erstellt" value={createdByMe.length} color="text-green-500" />
          <StatCard label="Alle Tickets" value={tickets.length} color="text-brand-500" />
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <QuickLink
            href="/tickets"
            icon={<Ticket className="h-5 w-5 text-brand-500" />}
            title="Tickets verwalten"
            subtitle="Alle Tickets ansehen, filtern und bearbeiten"
          />
          <QuickLink
            href="/dashboard/create"
            icon={<Plus className="h-5 w-5 text-brand-500" />}
            title="Ticket erstellen"
            subtitle="Neues Ticket mit Anhängen anlegen"
          />
          <QuickLink
            href="/groups"
            icon={<Users className="h-5 w-5 text-brand-500" />}
            title="Meine Gruppen"
            subtitle="Gruppen, Mitarbeiter und Einstellungen"
          />
        </div>

        {/* My tickets */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Meine Tickets</h2>
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1 text-sm text-brand-500 hover:text-brand-600"
          >
            Alle ansehen <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : myTickets.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Noch keine eigenen Tickets</h3>
            <p className="text-muted-foreground mb-4">
              Tickets, die du erstellt oder übernommen hast, erscheinen hier.
            </p>
            <Link
              href="/tickets"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Ticket className="h-4 w-4" />
              Zu den Tickets
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {myTickets.slice(0, 8).map((ticket) => (
              <Link
                key={ticket.id}
                href={`/dashboard/ticket/${ticket.id}`}
                className={`ticket-card block rounded-xl border border-border bg-card p-4 border-l-4 priority-${ticket.priority}`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">
                        TP-{String(ticket.ticketNumber).padStart(4, "0")}
                      </span>
                      {ticket.category && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: ticket.category.color + "20",
                            color: ticket.category.color,
                          }}
                        >
                          {ticket.category.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold truncate">{ticket.subject}</h3>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {ticket.dueDate && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(ticket.dueDate)}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(ticket.status)}`}
                    >
                      {getStatusLabel(ticket.status)}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-secondary">
                      {getPriorityLabel(ticket.priority)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 hover:shadow-lg hover:border-brand-500/50 transition-all"
    >
      <div className="h-10 w-10 rounded-lg bg-brand-500/10 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
    </Link>
  );
}