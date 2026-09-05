"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import {
  Megaphone,
  Users,
  RotateCw,
  Search,
  Ban,
  CheckCircle,
  Trash2,
  Shield,
  Plus,
  X,
  KeyRound,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Date | null;
  role: string | null;
  banned: boolean;
  banReason: string | null;
  bannedUntil: Date | null;
  deleteAt: Date | null;
  createdAt: Date | null;
  passwordSet: boolean;
}

interface Announcement {
  id: string;
  message: string;
  color: string;
  active: boolean;
  createdAt: Date;
}

type Tab = "announcements" | "users";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAdmin = (session?.user as any)?.role === "admin";

  const [tab, setTab] = useState<Tab>("announcements");

  // Meldungen
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [aMsg, setAMsg] = useState("");
  const [aColor, setAColor] = useState("#ef4444");

  // Nutzer
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [search, setSearch] = useState("");
  const [banDialogId, setBanDialogId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banType, setBanType] = useState<"forever" | "until">("forever");
  const [banUntil, setBanUntil] = useState("");
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"now" | "at">("now");
  const [deleteAt, setDeleteAt] = useState("");
  const [passDialogId, setPassDialogId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  // Reload
  const [reloadCooldown, setReloadCooldown] = useState(() => {
    // Cooldown übersteht den erzwungenen Reload dieser Seite
    if (typeof window === "undefined") return 0;
    try {
      const at = Number(
        window.localStorage.getItem("tp.reloadCommandAt") || 0
      );
      const remaining = 25 - Math.floor((Date.now() - at) / 1000);
      return at > 0 && remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  });
  const [reloadBusy, setReloadBusy] = useState(false);

  // Feedback
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !isAdmin) {
      router.push("/login");
      return;
    }
    loadData();
  }, [status, isAdmin]);

  const loadData = useCallback(async () => {
    const [aRes, uRes] = await Promise.all([
      fetch("/api/admin/announcements"),
      fetch("/api/admin/users"),
    ]);
    if (aRes.ok) {
      const d = await aRes.json();
      setAnnouncements(d.announcements || []);
    }
    if (uRes.ok) {
      const d = await uRes.json();
      setUsers(d.users || []);
    }
  }, []);

  // Cooldown-Timer für Reload-Button
  useEffect(() => {
    if (reloadCooldown <= 0) return;
    const t = setTimeout(() => setReloadCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [reloadCooldown]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(""), 4000);
  };

  const notifyAnnouncementChange = () => {
    // Leiste im selben Tab sofort aktualisieren
    window.dispatchEvent(new CustomEvent("tp:announcements-changed"));
    // andere Tabs desselben Browsers
    try {
      new BroadcastChannel("tp.announcements").postMessage("changed");
    } catch {
      // Kanal nicht verfügbar -> der Poll (30 s) holt es nach
    }
  };

  const createAnnouncement = async () => {
    if (!aMsg.trim()) return;
    const res = await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: aMsg.trim(), color: aColor }),
    });
    if (res.ok) {
      setAMsg("");
      flash("Meldung wurde veröffentlicht");
      loadData();
      notifyAnnouncementChange();
    } else {
      flash("Fehler beim Veröffentlichen");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    const res = await fetch(`/api/admin/announcements?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      flash("Meldung entfernt");
      loadData();
      notifyAnnouncementChange();
    }
  };

  const doBan = async (id: string) => {
    const body: Record<string, unknown> = {
      action: "ban",
      id,
      reason: banReason,
      restriction: banType,
    };
    if (banType === "until") body.until = new Date(banUntil).toISOString();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      flash("Nutzer gesperrt");
      setBanDialogId(null);
      setBanReason("");
      setBanType("forever");
      setBanUntil("");
      loadData();
    } else {
      flash("Fehler beim Sperren");
    }
  };

  const doUnban = async (id: string) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unban", id }),
    });
    if (res.ok) {
      flash("Nutzer entsperrt");
      loadData();
    }
  };

  const doDelete = async (id: string) => {
    const body: Record<string, unknown> = { action: "delete-now", id };
    if (deleteType === "at") {
      body.action = "delete-at";
      body.deleteAt = new Date(deleteAt).toISOString();
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      flash(deleteType === "now" ? "Nutzer sofort gelöscht" : "Löschung geplant");
      setDeleteDialogId(null);
      setDeleteType("now");
      setDeleteAt("");
      loadData();
    } else {
      flash("Fehler beim Löschen");
    }
  };

  const doCancelDelete = async (id: string) => {
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel-delete", id }),
    });
    if (res.ok) {
      flash("Geplante Löschung abgebrochen");
      loadData();
    }
  };

  const doSetPassword = async (id: string) => {
    if (newPassword.length < 8) {
      flash("Mindestens 8 Zeichen");
      return;
    }
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-password", id, password: newPassword }),
    });
    if (res.ok) {
      flash("Passwort wurde neu gesetzt");
      setPassDialogId(null);
      setNewPassword("");
      loadData();
    } else {
      const d = await res.json().catch(() => ({}));
      flash(d.error || "Fehler beim Setzen des Passworts");
    }
  };

  const doReload = async () => {
    if (reloadCooldown > 0 || reloadBusy) return;
    setReloadBusy(true);
    const res = await fetch("/api/admin/reload", { method: "POST" });
    setReloadBusy(false);
    if (res.ok) {
      setReloadCooldown(25);
      try {
        window.localStorage.setItem("tp.reloadCommandAt", String(Date.now()));
      } catch {
        // Storage nicht verfügbar -> Cooldown nur bis zum nächsten Reload
      }
      flash("Alle offenen Seiten werden neu geladen");
    } else {
      const d = await res.json().catch(() => ({}));
      flash(d.error || "Reload fehlgeschlagen");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || (status === "authenticated" && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated" || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-brand-500" />
              Admin-Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Verwaltung von Meldungen, Nutzern und Website-Reload
            </p>
          </div>
          <button
            onClick={doReload}
            disabled={reloadCooldown > 0 || reloadBusy}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
              reloadCooldown > 0 ? "bg-secondary text-foreground" : "bg-brand-600 hover:bg-brand-700"
            }`}
            title="Lädt alle geöffneten Seiten der Website neu"
          >
            <RotateCw className={`h-4 w-4 ${reloadBusy ? "animate-spin" : ""}`} />
            {reloadCooldown > 0
              ? `Reload (${reloadCooldown}s)`
              : reloadBusy
              ? "Sende..."
              : "Alle Seiten neu laden"}
          </button>
        </div>

        {notice && (
          <div className="mb-6 rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-800 dark:text-green-200">
            {notice}
          </div>
        )}

        <div className="flex gap-2 mb-8">
          <TabButton
            active={tab === "announcements"}
            onClick={() => setTab("announcements")}
            icon={<Megaphone className="h-4 w-4" />}
            label="Meldungen"
          />
          <TabButton
            active={tab === "users"}
            onClick={() => setTab("users")}
            icon={<Users className="h-4 w-4" />}
            label={`Nutzer (${users.length})`}
          />
        </div>

        {tab === "announcements" && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Neue Meldung erstellen</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Text</label>
                  <textarea
                    value={aMsg}
                    onChange={(e) => setAMsg(e.target.value)}
                    placeholder="Ankündigungstext..."
                    rows={2}
                    className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Farbe
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={aColor}
                      onChange={(e) => setAColor(e.target.value)}
                      className="h-10 w-16 cursor-pointer rounded-lg border border-input bg-background"
                    />
                    <code className="text-sm text-muted-foreground">{aColor}</code>
                  </div>
                </div>
                <button
                  onClick={createAnnouncement}
                  disabled={!aMsg.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  Veröffentlichen
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Aktive Meldungen</h2>
              {announcements.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">
                  Keine Meldungen vorhanden.
                </p>
              ) : (
                announcements.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="h-8 w-8 flex-shrink-0 rounded-lg"
                        style={{ backgroundColor: a.color }}
                      />
                      <div className="min-w-0">
                        <p className="truncate">{a.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDateTime(a.createdAt)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteAnnouncement(a.id)}
                      className="flex-shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      title="Meldung entfernen"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nutzer durchsuchen (Name oder Email)..."
                className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Keine Nutzer gefunden.
              </p>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">
                            {u.name || "Ohne Name"}
                          </p>
                          {u.role === "admin" && (
                            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-medium text-brand-500">
                              Admin
                            </span>
                          )}
                          {u.banned ? (
                            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">
                              Gesperrt
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-medium text-green-500">
                              Aktiv
                            </span>
                          )}
                          {u.deleteAt && (
                            <span className="rounded-full bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-500">
                              Löschung geplant
                            </span>
                          )}
                          {!u.emailVerified && (
                            <span className="rounded-full bg-yellow-500/15 px-2 py-0.5 text-xs font-medium text-yellow-600 dark:text-yellow-500">
                              Nicht verifiziert
                            </span>
                          )}
                          {!u.passwordSet && (
                            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Kein Passwort
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {u.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Registriert:{" "}
                          {u.createdAt ? formatDateTime(u.createdAt) : "Unbekannt"}
                        </p>
                        {u.banned && (
                          <p className="text-xs text-red-500 mt-1">
                            {u.banReason
                              ? `Grund: ${u.banReason}`
                              : "Kein Grund angegeben"}
                            {u.bannedUntil
                              ? ` · Bis: ${formatDateTime(u.bannedUntil)}`
                              : " · Ohne Zeitlimit"}
                          </p>
                        )}
                        {u.deleteAt && (
                          <p className="text-xs text-orange-500 mt-1">
                            Löschdatum: {formatDateTime(u.deleteAt)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {u.banned ? (
                          <button
                            onClick={() => doUnban(u.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Entsperren
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setBanDialogId(u.id);
                              setBanReason("");
                              setBanType("forever");
                              setBanUntil("");
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-700 transition-colors"
                          >
                            <Ban className="h-4 w-4" />
                            Sperren
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setDeleteDialogId(u.id);
                            setDeleteType("now");
                            setDeleteAt("");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          Löschen
                        </button>
                        <button
                          onClick={() => {
                            setPassDialogId(u.id);
                            setNewPassword("");
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors"
                        >
                          <KeyRound className="h-4 w-4" />
                          Passwort setzen
                        </button>
                        {u.deleteAt && (
                          <button
                            onClick={() => doCancelDelete(u.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium hover:bg-secondary/80 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Löschung abbrechen
                          </button>
                        )}
                      </div>
                    </div>

                    {banDialogId === u.id && (
                      <ModalDialog title="Nutzer sperren" onClose={() => setBanDialogId(null)}>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1.5">
                              Grund (optional)
                            </label>
                            <textarea
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              placeholder="Warum wird der Nutzer gesperrt?"
                              rows={2}
                              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`banType-${u.id}`}
                                checked={banType === "forever"}
                                onChange={() => setBanType("forever")}
                                className="accent-brand-500"
                              />
                              Ohne Zeitlimit
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`banType-${u.id}`}
                                checked={banType === "until"}
                                onChange={() => setBanType("until")}
                                className="accent-brand-500"
                              />
                              Bis zu einem Datum
                            </label>
                            {banType === "until" && (
                              <input
                                type="datetime-local"
                                value={banUntil}
                                onChange={(e) => setBanUntil(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => doBan(u.id)}
                            disabled={banType === "until" && !banUntil}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" />
                            Sperren
                          </button>
                        </div>
                      </ModalDialog>
                    )}

                    {deleteDialogId === u.id && (
                      <ModalDialog title="Nutzer löschen" onClose={() => setDeleteDialogId(null)}>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            {u.email} — möchtest du das Konto sofort oder zu einem
                            späteren Zeitpunkt löschen?
                          </p>
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`deleteType-${u.id}`}
                                checked={deleteType === "now"}
                                onChange={() => setDeleteType("now")}
                                className="accent-brand-500"
                              />
Sofort löschen
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="radio"
                                name={`deleteType-${u.id}`}
                                checked={deleteType === "at"}
                                onChange={() => setDeleteType("at")}
                                className="accent-brand-500"
                              />
                              Zu einem Zeitpunkt löschen
                            </label>
                            {deleteType === "at" && (
                              <input
                                type="datetime-local"
                                value={deleteAt}
                                onChange={(e) => setDeleteAt(e.target.value)}
                                className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            )}
                          </div>
                          <button
                            onClick={() => doDelete(u.id)}
                            disabled={deleteType === "at" && !deleteAt}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleteType === "now" ? "Sofort löschen" : "Löschung planen"}
                          </button>
                        </div>
                      </ModalDialog>
                    )}

                    {passDialogId === u.id && (
                      <ModalDialog title="Passwort neu setzen" onClose={() => setPassDialogId(null)}>
                        <div className="space-y-4">
                          <p className="text-sm text-muted-foreground">
                            Setze für {u.email || u.name} ein neues Passwort. Der
                            Nutzer kann sich anschließend damit anmelden.{" "}
                            {!u.passwordSet ? (
                              <span className="text-yellow-600 dark:text-yellow-500">
                                Dieses Konto hat noch kein Passwort – nach dem
                                Setzen ist der Login sofort möglich.
                              </span>
                            ) : (
                              <span>
                                Ein bereits existierendes Passwort wird überschrieben.
                              </span>
                            )}
                          </p>
                          <div>
                            <label className="block text-sm font-medium mb-1.5">
                              Neues Passwort (mind. 8 Zeichen)
                            </label>
                            <input
                              type="text"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                            />
                          </div>
                          <button
                            onClick={() => doSetPassword(u.id)}
                            disabled={newPassword.length < 8}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
                          >
                            <KeyRound className="h-4 w-4" />
                            Passwort speichern
                          </button>
                        </div>
                      </ModalDialog>
                    )}
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

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
        active
          ? "bg-brand-600 text-white"
          : "bg-secondary/50 hover:bg-secondary"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ModalDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}