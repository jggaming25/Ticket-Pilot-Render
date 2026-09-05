export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
  banned?: boolean | null;
  banReason?: string | null;
  bannedUntil?: Date | null;
  deleteAt?: Date | null;
}

export interface TicketWithRelations {
  id: string;
  ticketNumber: number;
  subject: string;
  description: string;
  status: string;
  priority: string;
  groupId: string;
  categoryId: string;
  createdById: string;
  claimedById: string | null;
  discordUsername: string | null;
  robloxUsername: string | null;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category?: { id: string; name: string; color: string | null };
  createdBy?: { id: string; name: string | null; email: string | null; image: string | null };
  claimedBy?: { id: string; name: string | null; email: string | null; image: string | null } | null;
  group?: { id: string; name: string; slug: string };
  _count?: { comments: number };
}

export interface GroupWithRelations {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
  createdAt: Date;
  owner?: { id: string; name: string | null; email: string | null; image: string | null };
  members?: Array<{
    id: string;
    role: string;
    user?: { id: string; name: string | null; email: string | null; image: string | null };
  }>;
  settings?: {
    canCloseTickets: boolean | null;
    canClaimTickets: boolean | null;
    canCommentTickets: boolean | null;
    requireEmailVerification: boolean | null;
  };
  _count?: { members: number; tickets: number };
}

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type GroupRole = "owner" | "admin" | "member";
