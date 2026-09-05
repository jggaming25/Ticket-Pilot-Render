import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | number): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function generateTicketNumber(num: number): string {
  return `TP-${String(num).padStart(4, "0")}`;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, "-")
    .replace(/^-|-$/g, "")
    .replace(/--+/g, "-");
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    open: "Offen",
    in_progress: "In Bearbeitung",
    waiting: "Wartend",
    resolved: "Gelöst",
    ready_to_close: "Zum Schließen freigegeben",
    closed: "Geschlossen",
  };
  return labels[status] || status;
}

export function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    low: "Niedrig",
    medium: "Mittel",
    high: "Hoch",
    urgent: "Dringend",
  };
  return labels[priority] || priority;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    open: "status-open",
    in_progress: "status-in-progress",
    waiting: "status-waiting",
    resolved: "status-resolved",
    ready_to_close: "status-ready-to-close",
    closed: "status-closed",
  };
  return colors[status] || "";
}

export function isBanActive(
  banned?: boolean | null,
  bannedUntil?: Date | string | null
): boolean {
  if (!banned) return false;
  if (!bannedUntil) return true;
  return new Date(bannedUntil).getTime() > Date.now();
}

export function hasDeleteAtPassed(deleteAt?: Date | string | null): boolean {
  if (!deleteAt) return false;
  return new Date(deleteAt).getTime() <= Date.now();
}
