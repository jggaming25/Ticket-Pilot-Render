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
  Search,
  Filter,
  ChevronDown,
  Ticket,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface TicketData {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  createdAt: string;
  category: { name: string; color: string } | null;
  createdBy: { name: string; image: string | null } | null;
  claimedBy: { name: string; image: string | null } | null;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session, statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchTickets = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      status: statusFilter,
      priority: priorityFilter,
      sortBy,
      sortOrder,
    });
    const res = await fetch(`/api/tickets?${params}`);
    if (res.ok) {
      const data = await res.json();
      setTickets(data.tickets || []);
    }
    setLoading(false);
  };

  const filteredTickets = tickets.filter(
    (t) =>
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  const statusCounts = {
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    waiting: tickets.filter((t) => t.status === "waiting").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  };

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
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Ticket className="h-5 w-5 text-blue-500" />}
            label="Offen"
            value={statusCounts.open}
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-yellow-500" />}
            label="In Bearbeitung"
            value={statusCounts.in_progress}
          />
          <StatCard
            icon={<AlertCircle className="h-5 w-5 text-orange-500" />}
            label="Wartend"
            value={statusCounts.waiting}
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-500" />}
            label="Gelöst"
            value={statusCounts.resolved}
          />
        </div>

        {/* Header + Actions */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link
            href="/dashboard/create"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Neues Ticket
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tickets durchsuchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Alle Status</option>
            <option value="open">Offen</option>
            <option value="in_progress">In Bearbeitung</option>
            <option value="waiting">Wartend</option>
            <option value="resolved">Gelöst</option>
            <option value="closed">Geschlossen</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Alle Prioritäten</option>
            <option value="low">Niedrig</option>
            <option value="medium">Mittel</option>
            <option value="high">Hoch</option>
            <option value="urgent">Dringend</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split("-");
              setSortBy(s);
              setSortOrder(o);
            }}
            className="rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="createdAt-desc">Neueste zuerst</option>
            <option value="createdAt-asc">Älteste zuerst</option>
            <option value="dueDate-asc">Fälligkeit aufsteigend</option>
            <option value="dueDate-desc">Fälligkeit absteigend</option>
            <option value="ticketNumber-desc">Ticket-Nr. absteigend</option>
          </select>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Keine Tickets</h3>
            <p className="text-muted-foreground mb-4">
              {search
                ? "Keine Tickets gefunden für diese Suche."
                : "Noch keine Tickets vorhanden."}
            </p>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Erstes Ticket erstellen
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
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
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {ticket.description}
                    </p>
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
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
