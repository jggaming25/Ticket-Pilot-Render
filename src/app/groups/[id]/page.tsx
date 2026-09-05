"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  Users,
  Settings,
  Plus,
  Trash2,
  Shield,
  Tag,
  UserPlus,
} from "lucide-react";

interface GroupData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  members: Array<{
    id: string;
    role: string;
    user: { id: string; name: string; email: string; image: string | null };
  }>;
  settings: {
    canCloseTickets: boolean;
    canClaimTickets: boolean;
    canCommentTickets: boolean;
    requireEmailVerification: boolean;
  } | null;
  categories: Array<{ id: string; name: string; color: string | null }>;
}

export default function GroupDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"members" | "settings" | "categories">("members");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("#6366f1");
  const [inviteError, setInviteError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (session && groupId) fetchGroup();
  }, [session, groupId]);

  const fetchGroup = async () => {
    const res = await fetch(`/api/groups/${groupId}`);
    if (res.ok) {
      const data = await res.json();
      setGroup(data.group);
    }
    setLoading(false);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newMemberEmail }),
    });
    const data = await res.json();
    if (!res.ok) {
      setInviteError(data.error);
    } else {
      setNewMemberEmail("");
      fetchGroup();
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    await fetch(`/api/groups/${groupId}/members`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId }),
    });
    fetchGroup();
  };

  const handleUpdateSettings = async (key: string, value: boolean) => {
    await fetch(`/api/groups/${groupId}/settings`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    fetchGroup();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setCategoryError("");
    const res = await fetch(`/api/groups/${groupId}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName, color: newCategoryColor }),
    });
    const data = await res.json();
    if (!res.ok) {
      setCategoryError(data.error);
    } else {
      setNewCategoryName("");
      fetchGroup();
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    await fetch(`/api/groups/${groupId}/categories`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: catId }),
    });
    fetchGroup();
  };

  const userId = (session?.user as any)?.id;
  const isOwner = group?.ownerId === userId;
  const isAdmin =
    group?.members?.some((m) => m.user.id === userId && m.role === "owner") ||
    group?.members?.some((m) => m.user.id === userId && m.role === "admin");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex flex-col">
        <TopBar />
        <main className="flex-1 flex items-center justify-center">
          <p>Gruppe nicht gefunden</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Gruppen
        </Link>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-14 w-14 rounded-xl bg-brand-500/10 flex items-center justify-center">
            <Users className="h-7 w-7 text-brand-500" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && (
              <p className="text-muted-foreground">{group.description}</p>
            )}
          </div>
          <Link
            href={`/tickets?groupId=${group.id}`}
            className="inline-flex flex-shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Bearbeiter-Dashboard
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-secondary/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab("members")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "members" ? "bg-card shadow-sm" : "hover:bg-secondary"
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Mitarbeiter
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "categories" ? "bg-card shadow-sm" : "hover:bg-secondary"
            }`}
          >
            <Tag className="h-4 w-4 inline mr-2" />
            Kategorien
          </button>
          {(isOwner || isAdmin) && (
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "settings" ? "bg-card shadow-sm" : "hover:bg-secondary"
              }`}
            >
              <Settings className="h-4 w-4 inline mr-2" />
              Einstellungen
            </button>
          )}
        </div>

        {/* Members Tab */}
        {activeTab === "members" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            {(isOwner || isAdmin) && (
              <form onSubmit={handleAddMember} className="flex gap-2 mb-6">
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="Email des Mitarbeiters"
                  required
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  Hinzufügen
                </button>
              </form>
            )}

            {inviteError && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
                {inviteError}
              </div>
            )}

            <div className="space-y-3">
              {group.members?.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-brand-500 flex items-center justify-center text-xs text-white font-bold">
                      {member.user.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{member.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.user.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary capitalize">
                      {member.role === "owner"
                        ? "Inhaber"
                        : member.role === "admin"
                        ? "Admin"
                        : "Mitarbeiter"}
                    </span>
                    {member.user.id !== userId && (isOwner || isAdmin) && (
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div className="rounded-2xl border border-border bg-card p-6">
            {(isOwner || isAdmin) && (
              <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Kategorie-Name"
                  required
                  className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  type="color"
                  value={newCategoryColor}
                  onChange={(e) => setNewCategoryColor(e.target.value)}
                  className="h-10 w-10 rounded-lg border border-input cursor-pointer"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            )}

            {categoryError && (
              <div className="mb-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
                {categoryError}
              </div>
            )}

            <div className="space-y-2">
              {group.categories?.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: cat.color || "#6366f1" }}
                    />
                    <span className="text-sm font-medium">{cat.name}</span>
                  </div>
                  {(isOwner || isAdmin) && (
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && group.settings && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <SettingToggle
              label="Mitarbeiter dürfen Tickets schließen"
              checked={group.settings.canCloseTickets}
              onChange={(v) => handleUpdateSettings("canCloseTickets", v)}
            />
            <SettingToggle
              label="Mitarbeiter dürfen Tickets übernehmen"
              checked={group.settings.canClaimTickets}
              onChange={(v) => handleUpdateSettings("canClaimTickets", v)}
            />
            <SettingToggle
              label="Mitarbeiter dürfen kommentieren"
              checked={group.settings.canCommentTickets}
              onChange={(v) => handleUpdateSettings("canCommentTickets", v)}
            />
            <SettingToggle
              label="Email-Bestätigung erforderlich"
              checked={group.settings.requireEmailVerification}
              onChange={(v) =>
                handleUpdateSettings("requireEmailVerification", v)
              }
            />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

function SettingToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
      <span className="text-sm font-medium">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? "bg-brand-500" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
