"use client";

import { useState, useRef, useEffect, Suspense, KeyboardEvent } from "react";
import Link from "next/link";
import { sendAdvisorMessage, ApiError } from "@/lib/api";
import { LANGUAGES } from "@/lib/constants";
import { Icons } from "@/components/ui/Icons";
import { MarkdownText } from "@/components/ui/MarkdownText";
import { AdvisorSidebar } from "./AdvisorSidebar";
import {
  getStoredChatSessions,
  saveChatSession,
  deleteChatSession,
  updateChatSessionTitle,
  clearAllChatSessions,
  generateChatTitle,
  type StoredChatSession,
  type Message,
} from "@/lib/advisorHistory";
import type { Language, AnalyzeResponse, DiagnosisContext, CropType } from "@/lib/types";

const CROPS: { value: CropType; label: string; emoji: string }[] = [
  { value: "wheat", label: "Wheat", emoji: "🌾" },
  { value: "cotton", label: "Cotton", emoji: "🌿" },
  { value: "rice", label: "Rice", emoji: "🌱" },
  { value: "sugarcane", label: "Sugarcane", emoji: "🎋" },
];

const QUICK_QUESTIONS: Record<Language, string[]> = {
  en: [
    "What are the symptoms and prevention of wheat rust?",
    "How can I manage cotton leaf curl disease (CLCuD)?",
    "What are favourable conditions for rice blast?",
    "How do I prevent red rot in sugarcane?",
  ],
  ur: [
    "گندم میں کنگی کی علامات اور بچاؤ کے طریقے بتائیں۔",
    "کپاس کے پتہ مروڑ وائرس کا تدارک کیسے ممکن ہے؟",
    "دھان کے بلاسٹ سے بچاؤ کے لیے کیا تدابیر ہیں؟",
    "کماد میں رتہ روگ کی علامات کیا ہیں؟",
  ],
  sd: [
    "ڪڻڪ ۾ رتي جي بيماري ۽ بچاءَ جا طريقا ڇا آهن؟",
    "ڪپهه جي پن وڪوڙ وائرس جو تدارڪ ڪيئن ڪجي؟",
    "سارين جي بلاسٽ کان بچاءَ لاءِ ڇا ڪرڻ گهرجي؟",
    "ڪمند ۾ رتاروگ جون علامتون ڇا آهن؟",
  ],
};

function getInitialDiagnosisContext(): DiagnosisContext | null {
  if (typeof window === "undefined") return null;
  try {
    const storedResult = sessionStorage.getItem("agri_analysis_result");
    if (storedResult) {
      const parsed: AnalyzeResponse = JSON.parse(storedResult);
      if (parsed && parsed.diagnosis) {
        return {
          disease: parsed.diagnosis.disease,
          crop: parsed.diagnosis.crop || sessionStorage.getItem("agri_analysis_crop") || undefined,
          confidence: parsed.diagnosis.confidence,
          severity_tier: parsed.severity?.tier,
          affected_percentage: parsed.severity?.affected_percentage,
        };
      }
    }
  } catch {
    // Ignore parse error
  }
  return null;
}

function AdvisorContent() {
  const [language, setLanguage] = useState<Language>("en");
  const [selectedCrop, setSelectedCrop] = useState<CropType | "all">("all");
  const [sessionId, setSessionId] = useState<string>("");
  const [currentTitle, setCurrentTitle] = useState<string>("New Conversation");
  const [diagnosisContext, setDiagnosisContext] = useState<DiagnosisContext | null>(null);
  const [showContextCard, setShowContextCard] = useState<boolean>(true);

  // ChatGPT/Gemini Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [savedSessions, setSavedSessions] = useState<StoredChatSession[]>([]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "advisor",
      text: "Assalam-o-Alaikum! I am your CropDoctor AI Agricultural Advisor. Grounded in verified extension research, I can answer your questions about crop diseases, pest identification, cultural prevention, and field care.",
      timestamp: "Just now",
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize sessionId, history & diagnosisContext client-side after mount
    setSessionId(`sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
    setSavedSessions(getStoredChatSessions());
    const initialContext = getInitialDiagnosisContext();
    if (initialContext) {
      setDiagnosisContext(initialContext);
    }
    // Set sidebar open on desktop, closed on mobile by default
    if (typeof window !== "undefined") {
      setIsSidebarOpen(window.innerWidth >= 1024);
    }
  }, []);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Ensure the page starts scrolled at the top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    // Only scroll the internal chat container when user sends/receives messages, NOT on initial page load
    if (messages.length > 1 || isLoading) {
      scrollToBottom("smooth");
    }
  }, [messages, isLoading]);

  const persistSession = (
    updatedMessages: Message[],
    customCrop?: CropType | "all",
    customLang?: Language,
    customTitle?: string
  ) => {
    const userMessages = updatedMessages.filter((m) => m.sender === "user");
    if (userMessages.length === 0) return;

    const titleToSave =
      customTitle ||
      (currentTitle && currentTitle !== "New Conversation"
        ? currentTitle
        : generateChatTitle(userMessages[0].text));

    setCurrentTitle(titleToSave);

    const sessionObj: StoredChatSession = {
      id: sessionId,
      title: titleToSave,
      crop: customCrop ?? selectedCrop,
      language: customLang ?? language,
      messages: updatedMessages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveChatSession(sessionObj);
    setSavedSessions(getStoredChatSessions());
  };

  const handleResetSession = () => {
    const newId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSessionId(newId);
    setCurrentTitle("New Conversation");
    setError(null);
    setMessages([
      {
        id: `welcome_${Date.now()}`,
        sender: "advisor",
        text:
          language === "ur"
            ? "السلام علیکم! میں کراپ ڈاکٹر AI زرعی مشیر ہوں۔ تصدیق شدہ زرعی مواد کی بنیاد پر، میں فصلوں کی بیماریوں، کیڑوں کی شناخت اور نگہداشت کے بارے میں آپ کی رہنمائی کے لیے حاضر ہوں۔"
            : language === "sd"
            ? "اسلام عليڪم! مان ڪراپ ڊاڪٽر AI زرعي صلاحڪار آهيان. تصديق ٿيل معلومات جي بنياد تي، مان فصلن جي بيمارين ۽ جيتن بابت اوهان جي رهنمائي لاءِ تيار آهيان."
            : "Assalam-o-Alaikum! I am your CropDoctor AI Agricultural Advisor. Grounded in verified extension research, I can answer your questions about crop diseases, pest identification, cultural prevention, and field care.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  const handleSelectSession = (sess: StoredChatSession) => {
    setSessionId(sess.id);
    setCurrentTitle(sess.title);
    setMessages(sess.messages);
    setLanguage(sess.language);
    setSelectedCrop(sess.crop);
    setError(null);
    // Close sidebar on mobile after selecting
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleDeleteSession = (id: string) => {
    const updated = deleteChatSession(id);
    setSavedSessions(updated);
    if (sessionId === id) {
      handleResetSession();
    }
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    const updated = updateChatSessionTitle(id, newTitle);
    setSavedSessions(updated);
    if (sessionId === id) {
      setCurrentTitle(newTitle);
    }
  };

  const handleClearAllHistory = () => {
    clearAllChatSessions();
    setSavedSessions([]);
    handleResetSession();
  };

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : inputMessage).trim();
    if (!messageText || isLoading) return;

    setError(null);
    setInputMessage("");

    const userMsgId = `user_${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessagesWithUser = [...messages, userMessage];
    setMessages(newMessagesWithUser);
    persistSession(newMessagesWithUser);
    setIsLoading(true);

    try {
      const response = await sendAdvisorMessage({
        message: messageText,
        language,
        session_id: sessionId,
        crop: selectedCrop !== "all" ? selectedCrop : (diagnosisContext?.crop as CropType) || undefined,
        diagnosis_context: diagnosisContext || undefined,
      });

      const advisorMessage: Message = {
        id: `adv_${Date.now()}`,
        sender: "advisor",
        text: response.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: response.sources,
        retrievalScore: response.retrieval_score,
        isMock: response.is_mock,
        escalate: response.escalate,
      };

      const finalMessages = [...newMessagesWithUser, advisorMessage];
      setMessages(finalMessages);
      persistSession(finalMessages);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400 || err.status === 422) {
          setError("Your question could not be processed. Please rephrase or shorten your message.");
        } else if (err.status === 503) {
          setError(
            err.detail ||
              "AI Advisor service is temporarily unavailable. DashScope API key is unconfigured or offline."
          );
        } else {
          setError(err.detail || "Failed to receive advice. Please try again.");
        }
      } else {
        setError("Unable to connect to the advisor. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isRtl = language === "ur" || language === "sd";

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6">
      {/* Outer ChatGPT/Gemini Shell */}
      <div className="relative flex h-[calc(100vh-6rem)] min-h-[580px] max-h-[920px] rounded-3xl border border-gray-800/90 bg-gray-950/70 backdrop-blur-2xl overflow-hidden shadow-2xl">
        {/* Left History Sidebar (ChatGPT / Gemini Style) */}
        <AdvisorSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          sessions={savedSessions}
          activeSessionId={sessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleResetSession}
          onDeleteSession={handleDeleteSession}
          onRenameSession={handleRenameSession}
          onClearAll={handleClearAllHistory}
          language={language}
        />

        {/* Main Chat Panel */}
        <div
          className="flex-1 flex flex-col min-w-0 bg-gray-950/40 relative overflow-hidden"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Top Bar (ChatGPT & Gemini Style) */}
          <div className="flex items-center justify-between gap-2 px-3.5 sm:px-6 py-3 border-b border-gray-800/80 bg-gray-950/60 shrink-0">
            {/* Left: Sidebar Toggle & Active Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title={isSidebarOpen ? "Collapse sidebar" : "Expand chat history"}
                aria-label="Toggle sidebar"
              >
                <Icons.Sidebar className="w-4 h-4" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-sm font-bold text-gray-100 truncate">
                    {currentTitle || "CropDoctor Advisor"}
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-[10px] text-emerald-400 font-semibold">
                    Qwen-RAG
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Crop Filter, Language Selector & Quick New Chat */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Language Switcher */}
              <div className="flex bg-gray-900 border border-gray-800 p-0.5 rounded-xl text-xs">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => {
                      setLanguage(lang.value);
                      persistSession(messages, selectedCrop, lang.value);
                    }}
                    className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                      language === lang.value
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {lang.nativeLabel}
                  </button>
                ))}
              </div>

              {/* Quick New Chat Button */}
              <button
                type="button"
                onClick={handleResetSession}
                className="hidden sm:flex items-center gap-1.5 p-2 px-3 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
                title="Start new conversation"
              >
                <Icons.Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Crop Filter Selector Pills */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 py-2 overflow-x-auto no-scrollbar shrink-0 border-b border-gray-800/40 bg-gray-900/20">
            <span className="text-[11px] text-gray-500 font-medium mr-1 shrink-0">
              {language === "ur" ? "فصل منتخب کریں:" : language === "sd" ? "فصل چونڊيو:" : "Crop Focus:"}
            </span>
            <button
              onClick={() => {
                setSelectedCrop("all");
                persistSession(messages, "all");
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                selectedCrop === "all"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-gray-200"
              }`}
            >
              All Crops
            </button>
            {CROPS.map((c) => (
              <button
                key={c.value}
                onClick={() => {
                  setSelectedCrop(c.value);
                  persistSession(messages, c.value);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all shrink-0 flex items-center gap-1 cursor-pointer ${
                  selectedCrop === c.value
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-gray-900/80 border border-gray-800 text-gray-400 hover:text-gray-200"
                }`}
              >
                <span>{c.emoji}</span>
                <span>{c.label}</span>
              </button>
            ))}
          </div>

          {/* Scan Context Card (if coming from crop diagnose) */}
          {diagnosisContext && showContextCard && (
            <div className="mx-4 sm:mx-6 mt-3 p-3 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-200 flex items-center justify-between gap-3 shrink-0 animate-fade-in-up">
              <div className="flex items-center gap-2.5">
                <Icons.Leaf className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-300">
                    Active Scan Context: {diagnosisContext.disease || "Crop Scan"}
                    {diagnosisContext.crop && ` (${diagnosisContext.crop})`}
                  </div>
                  <div className="text-[11px] text-emerald-400/80">
                    {diagnosisContext.confidence !== undefined &&
                      `Confidence: ${(diagnosisContext.confidence * 100).toFixed(1)}%`}
                    {diagnosisContext.severity_tier &&
                      ` · Severity: ${diagnosisContext.severity_tier} (${diagnosisContext.affected_percentage}%)`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    handleSendMessage(
                      language === "ur"
                        ? `میری فصل میں ${diagnosisContext.disease} کی تشخیص ہوئی ہے۔ تصدیق شدہ زرعی رہنمائی کے مطابق مجھے کیا کرنا چاہیے؟`
                        : language === "sd"
                        ? `منهنجي فصل ۾ ${diagnosisContext.disease} جي تشخيص ٿي آهي، تصديق ٿيل زرعي رهنمائي ڇا آهي؟`
                        : `My crop was diagnosed with ${diagnosisContext.disease}. What are the verified management recommendations?`
                    )
                  }
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-2.5 py-1.5 rounded-lg text-[11px] transition-all cursor-pointer disabled:opacity-50"
                >
                  Ask About Scan
                </button>
                <button
                  onClick={() => setShowContextCard(false)}
                  className="text-gray-400 hover:text-gray-200 p-1 text-sm cursor-pointer"
                  title="Dismiss context"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Messages Area (ChatGPT / Gemini Centered Stream) */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-4"
          >
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((msg) => {
                const isUser = msg.sender === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0 shadow-md">
                        <Icons.Sparkles className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[80%] rounded-2xl p-4 space-y-2 shadow-md text-sm ${
                        isUser
                          ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-tr-none font-medium shadow-emerald-950/40"
                          : "bg-gray-900/90 border border-gray-800 text-gray-200 rounded-tl-none backdrop-blur-md"
                      }`}
                      dir={isRtl && !isUser ? "rtl" : "ltr"}
                    >
                      {!isUser && msg.escalate && (
                        <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-800/80 text-amber-200 text-xs flex items-center gap-2">
                          <Icons.AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <div className="leading-tight">
                            <span className="font-bold">Expert Referral Recommended: </span>
                            <span>Please consult your local extension officer for chemical prescription.</span>
                          </div>
                        </div>
                      )}

                      {isUser ? (
                        <div className="leading-relaxed whitespace-pre-wrap">{msg.text}</div>
                      ) : (
                        <MarkdownText content={msg.text} isRtl={isRtl} />
                      )}

                      {!isUser && msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 mt-2 border-t border-gray-800/80 text-xs">
                          <div className="text-[11px] font-semibold text-gray-400 mb-1 flex items-center gap-1.5">
                            <Icons.BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Verified Sources:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.sources.map((s, idx) => {
                              const title = typeof s === "string" ? s : s.title || s.source;
                              const sourceOrg = typeof s === "string" ? "Extension" : s.source;
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-950 border border-gray-800 text-[10px] text-gray-300"
                                  title={`${title} (${sourceOrg})`}
                                >
                                  <Icons.CheckCircle className="w-3 h-3 text-emerald-400" />
                                  <span className="truncate max-w-[200px]">{title}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div
                        className={`text-[10px] flex items-center gap-1.5 pt-1 ${
                          isUser ? "text-emerald-200" : "text-gray-500"
                        } ${isRtl && !isUser ? "justify-start" : "justify-end"}`}
                      >
                        {msg.retrievalScore !== undefined && msg.retrievalScore > 0 && (
                          <span className="text-emerald-500/80 font-mono">
                            relevance: {(msg.retrievalScore * 100).toFixed(0)}%
                          </span>
                        )}
                        <span>{msg.timestamp}</span>
                      </div>
                    </div>

                    {isUser && (
                      <div className="w-8 h-8 rounded-xl bg-emerald-800 border border-emerald-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-md">
                        U
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-start gap-3 justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shrink-0">
                    <Icons.Sparkles className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-900/90 border border-gray-800 text-gray-400 rounded-2xl rounded-tl-none p-4 text-xs flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>Searching extension knowledge base &amp; reasoning...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Bottom Floating Input Section (ChatGPT / Gemini Style) */}
          <div className="px-3 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-gray-950 via-gray-950/90 to-transparent shrink-0">
            <div className="max-w-3xl mx-auto space-y-2">
              {/* Quick Questions Chips */}
              <div className="overflow-x-auto no-scrollbar pb-1">
                <div className="flex items-center gap-1.5 min-w-max">
                  <span className="text-[11px] text-gray-500 font-medium mr-0.5">Suggestions:</span>
                  {QUICK_QUESTIONS[language].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q)}
                      disabled={isLoading}
                      className="px-2.5 py-1 rounded-xl bg-gray-900/90 hover:bg-gray-800 border border-gray-800 hover:border-emerald-600/60 text-[11px] text-gray-300 hover:text-emerald-300 transition-all disabled:opacity-50 cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-2 animate-fade-in-up">
                  <div className="flex items-center gap-2">
                    <Icons.AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{error}</span>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-rose-300 hover:text-white p-1 text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Floating Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-end gap-2 bg-gray-900/95 border border-gray-800 focus-within:border-emerald-500/90 rounded-2xl p-2.5 transition-all shadow-xl shadow-black/40"
              >
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    language === "ur"
                      ? "اپنی فصل، علامات یا بچاؤ کے بارے میں سوال پوچھیں..."
                      : language === "sd"
                      ? "پنهنجي فصل، بيمارين يا سنڀال بابت سوال پڇو..."
                      : "Ask CropDoctor AI about plant diseases, pests, symptoms, or sprays..."
                  }
                  dir={isRtl ? "rtl" : "ltr"}
                  className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-gray-100 placeholder-gray-500 focus:ring-0 focus:outline-none resize-none max-h-28 px-2 py-1 leading-relaxed"
                />

                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 shadow-md shadow-emerald-950/50 active:scale-95"
                  title="Send Question"
                >
                  <Icons.Send className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
                </button>
              </form>

              {/* Footnote */}
              <div className="flex items-center justify-between text-[10px] text-gray-500 px-2">
                <span>Grounded in verified extension research. Not a substitute for lab diagnosis.</span>
                <Link href="/expert" className="text-emerald-400 hover:underline">
                  Consult Agronomist →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdvisorClient() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh] text-gray-400 text-sm">
          Loading Advisor...
        </div>
      }
    >
      <AdvisorContent />
    </Suspense>
  );
}
