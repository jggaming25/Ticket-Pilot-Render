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
  Paperclip,
  ShieldCheck,
  Send,
  FileDown,
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
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
    uploadedBy: { name: string } | null;
  }>;
  canCloseTickets: boolean;
  myRole: string | null;
  isOwnerOrAdmin: boolean;
}

interface Comment {
  id: string;
  content: string;
  cc: string | null;
  bcc: string | null;
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

const HISTORY_LABELS: Record<string, string> = {
  created: "hat Ticket erstellt",
  claimed: "hat Ticket übernommen",
  unclaimed: "hat Ticket zur Bearbeitung freigegeben",
  commented: "hat kommentiert",
  status_changed: "hat Status geändert",
  edited: "hat bearbeitet",
  ready_to_close: "hat Ticket zum Schließen freigegeben",
  closed: "hat Ticket geschlossen",
};

export default function TicketDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [newComment, setNewComment] = useState("");
  const [ccEmails, setCcEmails] = useState("");
  const [bccEmails, setBccEmails] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"comments" | "history">("comments");
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session && ticketId) {
      fetchTicket();
      fetchComments();
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setActionError("");
    const res = await fetch(`/api/tickets/${ticketId}/claim`, { method: "POST" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Fehler");
    }
    fetchTicket();
    fetchHistory();
  };

  const handleRelease = async () => {
    setActionError("");
    const res = await fetch(`/api/tickets/${ticketId}/claim`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Fehler");
    }
    fetchTicket();
    fetchHistory();
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionError("");
    const res = await fetch(`/api/tickets/${ticketId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Fehler");
      fetchTicket();
      return;
    }
    fetchTicket();
    fetchHistory();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommentLoading(true);
    setActionError("");
    const res = await fetch(`/api/tickets/${ticketId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: newComment,
        cc: ccEmails,
        bcc: bccEmails,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setActionError(data.error || "Fehler");
    } else {
      setNewComment("");
      setCcEmails("");
      setBccEmails("");
    }
    setCommentLoading(false);
    fetchComments();
  };

  const userId = (session?.user as any)?.id;
  const isCreator = ticket?.createdById === userId;
  const isClaimer = ticket?.claimedById === userId;
  const isOwnerOrAdmin = ticket?.isOwnerOrAdmin || false;

  const canComment = isClaimer || isCreator || isOwnerOrAdmin;
  const canEditStatus = isClaimer || isCreator || isOwnerOrAdmin;
  const canCloseFromSelect = isOwnerOrAdmin || ticket?.canCloseTickets;
  const showReleaseForClose =
    ticket &&
    canEditStatus &&
    !isOwnerOrAdmin &&
    !ticket.canCloseTickets &&
    ticket.status !== "closed" &&
    ticket.status !== "ready_to_close";

  const showCloseReadyButton =
    ticket && isOwnerOrAdmin && ticket.status === "ready_to_close";

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

  const isClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu den Tickets
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
            {isOwnerOrAdmin && (
              <span className="flex items-center gap-1 text-brand-500">
                <ShieldCheck className="h-4 w-4" />
                Inhaber
              </span>
            )}
          </div>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm font-medium mb-2">
                <Paperclip className="h-4 w-4" />
                Anhänge ({ticket.attachments.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={`/api/tickets/${ticket.id}/attachments/${att.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/50 px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
                  >
                    <FileDown className="h-3.5 w-3.5 text-brand-500" />
                    <span className="max-w-40 truncate">{att.filename}</span>
                    <span className="text-muted-foreground">
                      ({(att.size / 1024).toFixed(1)} KB)
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
            {!ticket.claimedBy && !isClosed && (
              <button
                onClick={handleClaim}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
              >
                <Hand className="h-4 w-4" />
                Ticket übernehmen
              </button>
            )}
            {isClaimer && !isClosed && (
              <button
                onClick={handleRelease}
                className="inline-flex items-center gap-2 rounded-lg bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Zur Bearbeitung freigeben
              </button>
            )}

            {showReleaseForClose && (
              <button
                onClick={() => handleStatusChange("ready_to_close")}
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Für Schließen freigeben
              </button>
            )}

            {showCloseReadyButton && (
              <button
                onClick={() => handleStatusChange("closed")}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Ticket schließen
              </button>
            )}

            {canEditStatus && !isClosed && (
              <select
                value={ticket.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="open">Offen</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="waiting">Wartend</option>
                <option value="resolved">Gelöst</option>
                {canCloseFromSelect && (
                  <option value="closed">Geschlossen</option>
                )}
              </select>
            )}
          </div>

          {actionError && (
            <div className="mt-3 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
              {actionError}
            </div>
          )}
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-medium">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTime(comment.createdAt)}
                        </span>
                        {comment.cc && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            CC: {comment.cc}
                          </span>
                        )}
                        {comment.bcc && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                            BCC: {comment.bcc}
                          </span>
                        )}
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {canComment && !isClosed ? (
              <form onSubmit={handleComment} className="space-y-3">
                <div className="flex gap-2">
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
                    className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                    Senden
                  </button>
                </div>
                {(isClaimer || isOwnerOrAdmin) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={ccEmails}
                      onChange={(e) => setCcEmails(e.target.value)}
                      placeholder="CC-E-Mails (kommagetrennt)"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      value={bccEmails}
                      onChange={(e) => setBccEmails(e.target.value)}
                      placeholder="BCC-E-Mails (kommagetrennt)"
                      className="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}
              </form>
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">
                {isClosed
                  ? "Das Ticket ist geschlossen."
                  : "Nur der Bearbeiter oder der Gruppeninhaber kann kommentieren."}
              </p>
            )}
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
                      {HISTORY_LABELS[entry.action] || entry.action}
                      {entry.action === "status_changed" && entry.details
                        ? `: ${entry.details}`
                        : ""}
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