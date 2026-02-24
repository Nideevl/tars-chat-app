// ── Time only: "11:52 PM" ─────────────────────────────────────────────────────
export function formatTimeOnly(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Date separator label ──────────────────────────────────────────────────────
// Today → "Today"
// Yesterday → "Yesterday"
// Within last 7 days → "Monday", "Tuesday", etc.
// Same year → "Feb 22"
// Different year → "Feb 22, 2023"
export function formatDateSeparator(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-US", { weekday: "long" }); // "Monday"
  }
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" }); // "Feb 22"
  }
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); // "Feb 22, 2023"
}

// ── Check if two timestamps are on different calendar days ───────────────────
export function isDifferentDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() !== db.getFullYear() ||
    da.getMonth() !== db.getMonth() ||
    da.getDate() !== db.getDate()
  );
}

// ── Sidebar preview time (kept for ConversationItem) ─────────────────────────
export function formatMessageTime(timestamp: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);

  if (diffDays === 0) return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return date.toLocaleDateString("en-US", { weekday: "short" });
  if (date.getFullYear() === now.getFullYear()) return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Full timestamp for message info (kept for any other usages) ───────────────
export function formatFullMessageTime(timestamp: number): string {
  return formatTimeOnly(timestamp);
}

// ── Last seen label: "last seen today at 6:49 pm" / "yesterday at..." / "Feb 22 at..." ──
export function formatLastSeen(timestamp: number): string {
  if (!timestamp) return "last seen recently";
  const date = new Date(timestamp);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86400000);
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }).toLowerCase();

  if (diffDays === 0) return `last seen today at ${time}`;
  if (diffDays === 1) return `last seen yesterday at ${time}`;
  if (diffDays < 7) {
    const weekday = date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    return `last seen ${weekday} at ${time}`;
  }
  if (date.getFullYear() === now.getFullYear()) {
    const d = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `last seen ${d} at ${time}`;
  }
  const d = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `last seen ${d} at ${time}`;
}