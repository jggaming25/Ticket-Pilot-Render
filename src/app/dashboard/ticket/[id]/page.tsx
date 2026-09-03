"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import { formatDateTime, getStatusLabel, getPriorityLabel, getStatusColor } from "@/lib/utils";
import {
  ArrowLeft,
  Clock,
  User,
  Tag,
  MessageSquare,
  History,
  CheckCircle,
  XCircle,
  Hand,
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
  updatedAt: string;
  discordUsername: string | null;
  robloxUsername: string | null;
  createdById: string;
  claimedById: string | null;
  category: { id: string; name: string; color: string } | null;
  createdBy: { id: string; name: string; image: string | null } | null;
  claimedBy: { id: string; name: string; image: string | null } | null;
  group: { id: string; name: string } | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string; image: string | null };
}

interface HistoryEntry {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user: { name: string };
}

export default function TicketDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session && ticketId) {
      fetchTicket();
      fetchComments();
      fetchHistory();
    }
  }, [session, ticketId]);

  const fetchTicket = async () => {
    const res = await fetch(`/api/tickets/${ticketId}`);
    if (res.ok) {
      const data = await res.json();
      setTicket(data.ticket);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/tickets/${ticketId}/comments`);
    if (res.ok) {
      const data = await res.json();
      setComments(data.comments || []);
    }
  };

  const fetchHistory = async () => {
    const res = await fetch(`/api/tickets/${ticketId}?includeHistory=true`);
    if (res.ok) {
      const data = await res.json();
      setHistory(data.history || []);
    }
  };

  const handleClaim = async () => {
    await fetch(`/api/tickets/${ticketId}/claim`, { method: "POST" });
    fetchTicket();
    fetchHistory();
  };

  const handleUnclaim = async () => {
    await fetch(`/api/tickets/${ticketId}/claim`, { method: "DELETE" });
    fetchTicket();
    fetchHistory();
  };

  const handleStatusChange = async (newStatus: string) => {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTicket();
    fetchHistory();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newComment }),
    });
    setNewComment("");
    fetchComments();
    setCommentLoading(false);
  };

  const userId = (session?.user as any)?.id;
  const isCreator = ticket?.createdById === userId;
  const isClaimer = ticket?.claimedById === userId;
  const canEdit = isClaimer || isCreator;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <p>Ticket nicht gefunden</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </Link>

        {/* Ticket Header */}
        <div className="rounded-2xl border border-border bg-card p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
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
              <h1 className="text-xl font-bold mb-2">{ticket.subject}</h1>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <span
                className={`text-xs px-3 py-1.5 rounded-full font-medium text-center ${getStatusColor(ticket.status)}`}
              >
                {getStatusLabel(ticket.status)}
              </span>
              <span className="text-xs px-3 py-1.5 rounded-full bg-secondary text-center">
                {getPriorityLabel(ticket.priority)}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Erstellt von {ticket.createdBy?.name || "Unbekannt"}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {formatDateTime(ticket.createdAt)}
            </span>
            {ticket.dueDate && (
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                Fällig: {formatDateTime(ticket.dueDate)}
              </span>
            )}
            {ticket.claimedBy && (
              <span className="flex items-center gap-1">
                <Hand className="h-4 w-4" />
                Bearbeiter: {ticket.claimedBy.name}
              </span>
            )}
            {ticket.discordUsername && (
              <span>DC: {ticket.discordUsername}</span>
            )}
            {ticket.robloxUsername && (
              <span>Roblox: {ticket.robloxUsername}</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
            {!ticket.claimedBy ? (
              <button
                onClick={handleClaim}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                <Hand className="h-4 w-4" />
                Ticket übernehmen
              </button>
            ) : isClaimer ? (
              <button
                onClick={handleUnclaim}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Abgeben
              </button>
            ) : null}

            {canEdit && ticket.status !== "closed" && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="waiting">Wartend</option>
                <option value="resolved">Gelöst</option>
                <option value="closed">Geschlossen</option>
              </select>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("comments")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "comments"
                ? "bg-card shadow-sm"
                : "hover:bg-secondary"
            }`}
          >
            <MessageSquare className="h-4 w-4 inline mr-2" />
            Kommentare ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "history"
                ? "bg-card shadow-sm"
                : "hover:bg-secondary"
            }`}
          >
            <History className="h-4 w-4 inline mr-2" />
            Historie ({history.length})
          </button>
        </div>

        {/* Comments */}
        {activeTab === "comments" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            {comments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Kommentare
              </p>
            ) : (
              <div className="space-y-4 mb-6">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="flex gap-3 p-3 rounded-lg bg-secondary/30"
                  >
                    <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white font-bold flex-shrink-0">
                      {comment.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Kommentar schreiben..."
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={commentLoading || !newComment.trim()}
                className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                Senden
              </button>
            </form>
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Keine Historie vorhanden
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-3 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />
                    <span className="text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </span>
                    <span className="font-medium">{entry.user.name}</span>
                    <span className="text-muted-foreground">
                      {entry.action === "created" && "hat Ticket erstellt"}
                      {entry.action === "claimed" && "hat Ticket übernommen"}
                      {entry.action === "unclaimed" && "hat Ticket abgegeben"}
                      {entry.action === "status_changed" && `Status geändert${entry.details ? `: ${entry.details}` : ""}`}
                      {entry.action === "commented" && "hat kommentiert"}
                      {entry.action === "edited" && "hat bearbeitet"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
