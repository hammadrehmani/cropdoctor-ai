/**
 * AgriGuard AI — Advisor Chat History Manager
 * Persists advisory conversation sessions per device in localStorage.
 */

import type { CropType, Language, SourceItem } from "./types";

export interface Message {
  id: string;
  sender: "user" | "advisor";
  text: string;
  timestamp: string;
  sources?: (SourceItem | string)[];
  retrievalScore?: number;
  isMock?: boolean;
  escalate?: boolean;
}

export interface StoredChatSession {
  id: string;
  title: string;
  crop: CropType | "all";
  language: Language;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

const HISTORY_STORAGE_KEY = "agriguard_advisor_history_v1";

export function getStoredChatSessions(): StoredChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch {
    return [];
  }
}

export function saveChatSession(session: StoredChatSession): void {
  if (typeof window === "undefined" || !session.id) return;
  // Only save if session has at least one user message
  const hasUserMessage = session.messages.some((m) => m.sender === "user");
  if (!hasUserMessage) return;

  try {
    const existing = getStoredChatSessions();
    const index = existing.findIndex((s) => s.id === session.id);

    if (index >= 0) {
      existing[index] = {
        ...session,
        updatedAt: new Date().toISOString(),
      };
    } else {
      existing.unshift({
        ...session,
        createdAt: session.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Keep up to latest 50 conversations
    const trimmed = existing.slice(0, 50);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Could not persist chat session in localStorage:", err);
  }
}

export function updateChatSessionTitle(
  sessionId: string,
  newTitle: string
): StoredChatSession[] {
  if (typeof window === "undefined" || !newTitle.trim()) return [];
  try {
    const existing = getStoredChatSessions();
    const index = existing.findIndex((s) => s.id === sessionId);
    if (index >= 0) {
      existing[index].title = newTitle.trim();
      existing[index].updatedAt = new Date().toISOString();
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(existing));
    }
    return existing;
  } catch {
    return [];
  }
}

export function generateChatTitle(firstMessage: string): string {
  if (!firstMessage) return "Agricultural Advice";
  let cleaned = firstMessage
    .trim()
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .replace(/\s+/g, " ");

  if (cleaned.length > 45) {
    cleaned = cleaned.slice(0, 42).trim() + "...";
  }
  return cleaned;
}

export function groupSessionsByDate(
  sessions: StoredChatSession[],
  lang: Language = "en"
): { group: string; sessions: StoredChatSession[] }[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const sevenDaysAgo = todayStart - 7 * 86400000;
  const thirtyDaysAgo = todayStart - 30 * 86400000;

  const labels = {
    en: {
      today: "Today",
      yesterday: "Yesterday",
      previous7: "Previous 7 Days",
      previous30: "Previous 30 Days",
      older: "Older",
    },
    ur: {
      today: "آج (Today)",
      yesterday: "کل (Yesterday)",
      previous7: "پچھلے 7 دن",
      previous30: "پچھلے 30 دن",
      older: "پرانی گفتگو",
    },
    sd: {
      today: "اڄ (Today)",
      yesterday: "ڪالهه (Yesterday)",
      previous7: "پوئين 7 ڏينهن",
      previous30: "پوئين 30 ڏينهن",
      older: "پراڻي ڳالهه ٻولهه",
    },
  }[lang] || {
    today: "Today",
    yesterday: "Yesterday",
    previous7: "Previous 7 Days",
    previous30: "Previous 30 Days",
    older: "Older",
  };

  const buckets: Record<string, StoredChatSession[]> = {
    [labels.today]: [],
    [labels.yesterday]: [],
    [labels.previous7]: [],
    [labels.previous30]: [],
    [labels.older]: [],
  };

  for (const session of sessions) {
    const time = new Date(session.updatedAt || session.createdAt).getTime();
    if (time >= todayStart) {
      buckets[labels.today].push(session);
    } else if (time >= yesterdayStart) {
      buckets[labels.yesterday].push(session);
    } else if (time >= sevenDaysAgo) {
      buckets[labels.previous7].push(session);
    } else if (time >= thirtyDaysAgo) {
      buckets[labels.previous30].push(session);
    } else {
      buckets[labels.older].push(session);
    }
  }

  return Object.entries(buckets)
    .filter(([_, list]) => list.length > 0)
    .map(([group, list]) => ({ group, sessions: list }));
}

export function deleteChatSession(sessionId: string): StoredChatSession[] {
  if (typeof window === "undefined") return [];
  try {
    const existing = getStoredChatSessions();
    const filtered = existing.filter((s) => s.id !== sessionId);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(filtered));
    return filtered;
  } catch {
    return [];
  }
}

export function clearAllChatSessions(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch {}
}

