"use client";

import React, { useState } from "react";
import { Icons } from "@/components/ui/Icons";
import type { StoredChatSession } from "@/lib/advisorHistory";
import type { Language } from "@/lib/types";

interface AdvisorHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: StoredChatSession[];
  activeSessionId: string;
  onSelectSession: (session: StoredChatSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  language: Language;
}

const TEXTS = {
  en: {
    title: "Advisor Chat History",
    subtitle: "Your previous advisory conversations and diagnoses discussions",
    empty: "No previous chat history found.",
    emptySub: "Start asking questions to build your advisory history.",
    clearAll: "Clear All History",
    confirmClear: "Are you sure you want to delete all chat history?",
    active: "Active Now",
    messages: "messages",
    resumeChat: "Resume Chat",
    close: "Close",
    delete: "Delete",
    allCrops: "All Crops",
  },
  ur: {
    title: "سابقہ زرعی مشاورتی گفتگو",
    subtitle: "آپ کے پچھلے سوالات، جوابات اور زرعی رہنمائی کا ریکارڈ",
    empty: "کوئی سابقہ چیٹ ہسٹری موجود نہیں ہے۔",
    emptySub: "نیا سوال پوچھیں تاکہ آپ کا ریکارڈ محفوظ ہو سکے۔",
    clearAll: "تمام ہسٹری صاف کریں",
    confirmClear: "کیا آپ واقعی تمام سابقہ چیٹ ڈیلیٹ کرنا چاہتے ہیں؟",
    active: "موجودہ فعال چیٹ",
    messages: "پیغامات",
    resumeChat: "گفتگو جاری رکھیں",
    close: "بند کریں",
    delete: "ڈیلیٹ کریں",
    allCrops: "تمام فصلیں",
  },
  sd: {
    title: "اڳوڻي زرعي صلاحڪاري هسٽري",
    subtitle: "اوھان جا پراڻا سوال ۽ زرعي هدايتن جو رڪارڊ",
    empty: "ڪابه اڳوڻي چيٽ هسٽري ناهي ملي.",
    emptySub: "نئون سوال پڇو ته جيئن رڪارڊ محفوظ ٿئي.",
    clearAll: "سڀ هسٽري ختم ڪريو",
    confirmClear: "ڇا اوهان واقعي سڀ چيٽ هسٽري ختم ڪرڻ چاهيو ٿا؟",
    active: "موجوده چيٽ",
    messages: "پيغام",
    resumeChat: "ڳالهه ٻولهه جاري رکو",
    close: "بند ڪريو",
    delete: "ختم ڪريو",
    allCrops: "سڀ فصل",
  },
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString();
}

export const AdvisorHistoryModal: React.FC<AdvisorHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onClearAll,
  language = "en",
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const t = TEXTS[language] || TEXTS.en;
  const isRtl = language === "ur" || language === "sd";

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 animate-fade-in">
      <div
        className="relative w-full max-w-xl bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800/80 bg-gray-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-950 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Icons.Dashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-100">{t.title}</h3>
              <p className="text-[11px] text-gray-400">{t.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {sessions.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 text-gray-500 flex items-center justify-center mx-auto">
                <Icons.Message className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-gray-300">{t.empty}</p>
              <p className="text-xs text-gray-500 max-w-xs mx-auto">{t.emptySub}</p>
            </div>
          ) : (
            sessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const userMessages = sess.messages.filter((m) => m.sender === "user");
              const lastMessage = sess.messages[sess.messages.length - 1];

              return (
                <div
                  key={sess.id}
                  className={`group relative p-4 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-emerald-950/40 border-emerald-600/80 shadow-md shadow-emerald-950/30"
                      : "bg-gray-900/70 hover:bg-gray-900 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      onClick={() => {
                        onSelectSession(sess);
                        onClose();
                      }}
                      className="flex-1 cursor-pointer space-y-1.5"
                    >
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-2 text-[10px]">
                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black font-extrabold uppercase tracking-wider text-[9px]">
                            {t.active}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-gray-800 text-emerald-400 font-semibold uppercase">
                          {sess.crop || t.allCrops}
                        </span>
                        <span className="text-gray-500 uppercase font-mono">
                          {sess.language}
                        </span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-400 font-medium">
                          {formatRelativeTime(sess.updatedAt || sess.createdAt)}
                        </span>
                        <span className="text-gray-500">·</span>
                        <span className="text-gray-400">
                          {userMessages.length} {t.messages}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-sm font-bold text-gray-100 group-hover:text-emerald-300 transition-colors line-clamp-1">
                        {sess.title || "Agricultural Advice Inquiry"}
                      </h4>

                      {/* Last Message Snippet */}
                      {lastMessage && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {lastMessage.text}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 pt-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(sess.id);
                        }}
                        className="p-2 rounded-xl text-gray-500 hover:text-red-400 hover:bg-red-950/60 transition-colors cursor-pointer"
                        title={t.delete}
                        aria-label={t.delete}
                      >
                        <Icons.AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {sessions.length > 0 && (
          <div className="p-4 bg-gray-900/90 border-t border-gray-800/80 flex items-center justify-between gap-3">
            {!confirmClear ? (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors cursor-pointer font-medium"
              >
                {t.clearAll}
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300 font-medium">{t.confirmClear}</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-900 hover:bg-red-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Yes, Clear
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
