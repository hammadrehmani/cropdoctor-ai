"use client";

import React, { useState, useMemo } from "react";
import { Icons } from "@/components/ui/Icons";
import {
  groupSessionsByDate,
  type StoredChatSession,
} from "@/lib/advisorHistory";
import type { Language } from "@/lib/types";

interface AdvisorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  sessions: StoredChatSession[];
  activeSessionId: string;
  onSelectSession: (session: StoredChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onClearAll: () => void;
  language: Language;
}

const TEXTS = {
  en: {
    newChat: "New Chat",
    searchPlaceholder: "Search conversations...",
    noChats: "No chats yet",
    noSearchMatches: "No matching conversations",
    clearAll: "Clear All History",
    confirmClear: "Clear all conversations?",
    rename: "Rename",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    today: "Today",
    yesterday: "Yesterday",
    previous7: "Previous 7 Days",
    previous30: "Previous 30 Days",
    older: "Older",
    chatsCount: "chats saved",
  },
  ur: {
    newChat: "نئی گفتگو (New Chat)",
    searchPlaceholder: "گفتگو تلاش کریں...",
    noChats: "کوئی سابقہ چیٹ نہیں ہے",
    noSearchMatches: "کوئی گفتگو نہیں ملی",
    clearAll: "تمام ہسٹری صاف کریں",
    confirmClear: "کیا آپ تمام چیٹ صاف کرنا چاہتے ہیں؟",
    rename: "نام تبدیل کریں",
    delete: "ڈیلیٹ کریں",
    save: "محفوظ کریں",
    cancel: "منسوخ",
    today: "آج",
    yesterday: "کل",
    previous7: "پچھلے 7 دن",
    previous30: "پچھلے 30 دن",
    older: "پرانی گفتگو",
    chatsCount: "چیٹس محفوظ",
  },
  sd: {
    newChat: "نئين چيٽ (New Chat)",
    searchPlaceholder: "ڳالهه ٻولهه ڳوليو...",
    noChats: "ڪابه چيٽ موجود ناهي",
    noSearchMatches: "ڪابه گفتگو ناهي ملي",
    clearAll: "سڀ هسٽري ختم ڪريو",
    confirmClear: "ڇا اوهان سڀ هسٽري ختم ڪرڻ چاهيو ٿا؟",
    rename: "نالو بدلايو",
    delete: "ختم ڪريو",
    save: "محفوظ ڪريو",
    cancel: "منسوخ",
    today: "اڄ",
    yesterday: "ڪالهه",
    previous7: "پوئين 7 ڏينهن",
    previous30: "پوئين 30 ڏينهن",
    older: "پراڻي ڳالهه ٻولهه",
    chatsCount: "چيٽس محفوظ",
  },
};

export const AdvisorSidebar: React.FC<AdvisorSidebarProps> = ({
  isOpen,
  onToggle,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onRenameSession,
  onClearAll,
  language = "en",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const t = TEXTS[language] || TEXTS.en;
  const isRtl = language === "ur" || language === "sd";

  // Filtered sessions
  const filteredSessions = useMemo(() => {
    if (!searchQuery.trim()) return sessions;
    const q = searchQuery.toLowerCase();
    return sessions.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.messages.some((m) => m.text.toLowerCase().includes(q))
    );
  }, [sessions, searchQuery]);

  // Group by date
  const groupedSessions = useMemo(() => {
    return groupSessionsByDate(filteredSessions, language);
  }, [filteredSessions, language]);

  const handleStartRename = (session: StoredChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveRename = (sessionId: string, e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingTitle.trim()) {
      onRenameSession(sessionId, editingTitle.trim());
    }
    setEditingId(null);
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggle}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 sm:w-80 flex flex-col transition-all duration-300 ease-in-out shadow-xl md:shadow-none shrink-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:-ml-72 md:lg:-ml-80"
        }`}
        style={{
          background: "#FAF8F5",
          borderRight: "1px solid #E5E1D8",
        }}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Top Header: New Chat & Close */}
        <div
          className="p-3.5 space-y-3 shrink-0"
          style={{ borderBottom: "1px solid #E5E1D8", background: "#FAF8F5" }}
        >
          <div className="flex items-center justify-between gap-2">
            {/* New Chat Button (Croplyx deep green) */}
            <button
              type="button"
              onClick={onNewChat}
              className="flex-1 flex items-center justify-center gap-2 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-sm transition-all cursor-pointer active:scale-98"
              style={{ background: "#1a3626" }}
            >
              <Icons.Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{t.newChat}</span>
            </button>

            {/* Close / Collapse Toggle */}
            <button
              type="button"
              onClick={onToggle}
              className="p-2.5 rounded-xl transition-colors cursor-pointer"
              style={{ background: "#F0EDE5", color: "#1a3626", border: "1px solid #E5E1D8" }}
              title="Close Sidebar"
              aria-label="Close Sidebar"
            >
              <Icons.Menu className="w-4 h-4" />
            </button>
          </div>

          {/* Search Box */}
          {sessions.length > 0 && (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full rounded-xl text-xs px-3 py-2 outline-none transition-colors"
                style={{
                  background: "#ffffff",
                  border: "1px solid #E5E1D8",
                  color: "#1E293B",
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-700 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Chat History Grouped List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4 no-scrollbar">
          {sessions.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center mx-auto"
                style={{ background: "#F0EDE5", border: "1px solid #E5E1D8", color: "#1a3626" }}
              >
                <Icons.Message className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-gray-700">{t.noChats}</p>
              <p className="text-[11px] text-gray-500">
                Ask a question to start building your chat history.
              </p>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="py-8 px-4 text-center text-xs text-gray-500">
              {t.noSearchMatches}
            </div>
          ) : (
            groupedSessions.map(({ group, sessions: groupList }) => (
              <div key={group} className="space-y-1">
                {/* Date Category Heading */}
                <div className="px-3 py-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  {group}
                </div>

                {/* Session List in this Bucket */}
                <div className="space-y-0.5">
                  {groupList.map((sess) => {
                    const isActive = sess.id === activeSessionId;
                    const isEditing = editingId === sess.id;

                    return (
                      <div
                        key={sess.id}
                        onClick={() => {
                          if (!isEditing) {
                            onSelectSession(sess);
                          }
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                          isActive
                            ? "shadow-sm font-semibold"
                            : "hover:bg-[#F0EDE5]"
                        }`}
                        style={{
                          background: isActive ? "#E8F5EE" : "transparent",
                          border: isActive ? "1px solid #BBF7D0" : "1px solid transparent",
                          color: isActive ? "#15803d" : "#374151",
                        }}
                      >
                        {isEditing ? (
                          <form
                            onSubmit={(e) => handleSaveRename(sess.id, e)}
                            className="flex items-center gap-1.5 w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              autoFocus
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              className="flex-1 bg-white border border-emerald-600 rounded-lg px-2 py-1 text-xs text-gray-800 outline-none"
                            />
                            <button
                              type="submit"
                              className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                              title={t.save}
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelRename}
                              className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
                              title={t.cancel}
                            >
                              ✕
                            </button>
                          </form>
                        ) : (
                          <>
                            {/* Title & Icon */}
                            <div className="flex items-center gap-2 truncate pr-2">
                              <Icons.Message
                                className="w-3.5 h-3.5 shrink-0 transition-colors"
                                style={{ color: isActive ? "#16A34A" : "#9CA3AF" }}
                              />
                              <span className="truncate">{sess.title}</span>
                            </div>

                            {/* Hover Actions (Rename & Delete) */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 transition-opacity">
                              {/* Rename */}
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(sess, e)}
                                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white transition-colors cursor-pointer"
                                title={t.rename}
                                aria-label={t.rename}
                              >
                                <Icons.Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteSession(sess.id);
                                }}
                                className="p-1 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                title={t.delete}
                                aria-label={t.delete}
                              >
                                <Icons.Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Stats & Clear All */}
        {sessions.length > 0 && (
          <div
            className="p-3 text-xs flex items-center justify-between gap-2 shrink-0"
            style={{ borderTop: "1px solid #E5E1D8", background: "#FAF8F5" }}
          >
            <span className="text-[11px] text-gray-500 font-mono">
              {sessions.length} {t.chatsCount}
            </span>

            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-[11px] text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
              >
                {t.clearAll}
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="text-[10px] text-gray-500 hover:text-gray-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
};
