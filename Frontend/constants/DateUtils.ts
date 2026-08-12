/**
 * Date & Time Utilities for AntiSocial Story & Activity Timestamps.
 *
 * Ensures all UTC ISO strings from the backend are accurately parsed
 * and displayed in the user's local device timezone without offset errors.
 */

/**
 * Formats a UTC timestamp into human-readable relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
export function formatTimeAgo(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "Just now";

  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "Just now";

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());

  // Less than 45 seconds -> "Just now"
  if (diffMs < 45000) {
    return "Just now";
  }

  const mins = Math.floor(diffMs / (1000 * 60));
  if (mins < 60) {
    return `${mins}m ago`;
  }

  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days === 1) {
    return "Yesterday";
  }
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Formats a UTC timestamp to the user's exact local time (e.g., "14:31" or "2:31 PM")
 */
export function formatLocalTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "";

  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Formats story viewer timestamp with intelligent relative/local time
 */
export function formatViewerTime(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "Just now";

  const date = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  if (isNaN(date.getTime())) return "Just now";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  if (diffMs < 60000) {
    return "Just now";
  }
  if (diffMs < 3600000) {
    const mins = Math.floor(diffMs / 60000);
    return `${mins}m ago`;
  }

  const timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isToday = now.toDateString() === date.toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = yesterday.toDateString() === date.toDateString();

  if (isToday) {
    return `Today at ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday at ${timeStr}`;
  }

  return `${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })} at ${timeStr}`;
}

/**
 * Checks if a story is expired based on its 24-hour expires_at timestamp
 */
export function isStoryExpired(expiresAt: string | Date | null | undefined): boolean {
  if (!expiresAt) return false;
  const exp = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  if (isNaN(exp.getTime())) return false;
  return exp.getTime() <= Date.now();
}
