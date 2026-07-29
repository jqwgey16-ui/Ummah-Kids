import React, { useState, useRef, useEffect } from "react";
import { 
  MessageSquare, Send, Sparkles, User, Star, ArrowLeft, RefreshCw, Volume2, 
  ShieldCheck, HelpCircle, ExternalLink, BookOpen, BookMarked, CheckCircle2, 
  HeartHandshake, Compass, Award, GraduationCap, Info, Lightbulb, Link as LinkIcon,
  ChevronDown, ChevronUp, Copy, Check, RotateCcw, Wifi, WifiOff, Sidebar
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KidProfile } from "../types";
import { Language, getTranslation } from "../lib/translations";

export interface QuranEvidenceItem {
  arabic: string;
  translationEn: string;
  translationUr: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  link: string;
  explanation: string;
}

export interface HadithCardItem {
  arabic: string;
  translationUr: string;
  translationEn: string;
  bookName: string;
  hadithNumber: string;
  authenticity: string;
  narrator: string;
  chapterName: string;
  shortExplanation: string;
  mainLesson: string;
  practicalLessonKids: string;
  link: string;
  scholarGrading?: string;
  shortContext?: string;
}

export interface TeacherResearchResponse {
  isIslamicQuestion?: boolean;
  nonIslamicGuideMessage?: string;
  title?: string;
  titleUrdu?: string;
  answerSummary?: string;
  quranEvidence?: QuranEvidenceItem[];
  hadithCards?: HadithCardItem[];
  sahabahAndScholarsExplanation?: string;
  importantNotes?: string[];
  difficultWordExplanations?: Array<{ word: string; meaning: string }>;
  practicalLessonsForChildren?: string[];
  practicalLessonsForParents?: string[];
  relatedKnowledge?: {
    quranVerses?: Array<{ title: string; link: string }>;
    hadiths?: Array<{ title: string; link: string }>;
    prophets?: string[];
    moralStories?: string[];
    dailyDuas?: string[];
  };
  references?: Array<{
    book: string;
    chapter: string;
    numberOrAyah: string;
    authenticity: string;
    scholarGrading?: string;
    shortContext?: string;
    link: string;
  }>;
}

interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  parsedResponse?: TeacherResearchResponse | null;
  isStreaming?: boolean;
}

interface AiTeacherProps {
  activeProfile: KidProfile | null;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  language?: Language;
}

const STORAGE_KEY = "ummah_kids_ai_teacher_chat_v3";

function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/[`#*_>~]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseTeacherResponse(rawContent: string): TeacherResearchResponse | null {
  if (!rawContent) return null;
  try {
    let clean = rawContent.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    }
    const jsonStart = clean.indexOf("{");
    const jsonEnd = clean.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd !== -1) {
      clean = clean.substring(jsonStart, jsonEnd + 1);
    }
    const parsed = JSON.parse(clean);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as TeacherResearchResponse;
    }
  } catch (e) {
    // If not valid JSON, return null for human text renderer
  }
  return null;
}

export default function AiTeacher({ activeProfile, onAddPoints, onNavigateHome, language = "en" }: AiTeacherProps) {
  const initialWelcome: Message = {
    id: "welcome-msg",
    role: "model",
    content: "Assalamu Alaikum! Welcome to Ummah Kids! I am your AI Islamic Research Assistant & Teacher. 🌟 I am here to help children, parents, and teachers explore authentic knowledge from the Holy Quran and Sahih Sunnah with verified references. Ask me any question about Islam!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    parsedResponse: null
  };

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not load saved chat history:", e);
    }
    return [initialWelcome];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isUserAtBottomRef = useRef<boolean>(true);
  const [showScrollButton, setShowScrollButton] = useState<boolean>(false);

  const suggestedQuestions = [
    { text: "Why do Muslims fast during the month of Ramadan?", label: "Ramadan & Fasting 🌙" },
    { text: "Tell me about the patience of Prophet Ibrahim (AS)", label: "Prophet Ibrahim (AS) 🐫" },
    { text: "What is the importance of being truthful in Islam?", label: "Honesty & Morals ✨" },
    { text: "How did Prophet Muhammad ﷺ treat animals and nature?", label: "Seerah & Mercy 🐾" },
    { text: "How do I perform Wudu correctly step by step?", label: "Wudu & Purification 💧" },
    { text: "What are the five pillars of Islam explained simply?", label: "Pillars of Islam 🕌" }
  ];

  const loadingSteps = [
    "Teacher Inaamullah is researching your question...",
    "Searching authentic Qur'an verses...",
    "Checking Sahih Bukhari & Sahih Muslim...",
    "Preparing comprehensive answer..."
  ];

  // Save to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save chat to localStorage:", e);
    }
  }, [messages]);

  // Focus input automatically on mount and whenever loading finishes
  useEffect(() => {
    textareaRef.current?.focus();
  }, [loading]);

  // Auto-resize textarea height smoothly
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
    }
  }, [input]);

  // Cycle loading status text
  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 1800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const focusInput = () => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 120;
    isUserAtBottomRef.current = isAtBottom;
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = (smooth = true) => {
    if (!chatContainerRef.current) return;
    const container = chatContainerRef.current;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "auto"
      });
      isUserAtBottomRef.current = true;
      setShowScrollButton(false);
    });
  };

  // Scroll to bottom when messages update if user was near bottom
  useEffect(() => {
    if (isUserAtBottomRef.current) {
      scrollToBottom(true);
    }
  }, [messages, loading]);

  // Fetch from backend with Auto-Retry logic
  const fetchWithRetry = async (text: string, history: any[], maxRetries = 3): Promise<any> => {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        if (attempt > 0) {
          setRetryStatus(`Reconnecting & Retrying (Attempt ${attempt}/${maxRetries})...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }

        const res = await fetch("/api/teacher/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, history })
        });

        if (res.ok) {
          setRetryStatus(null);
          return await res.json();
        } else if (res.status === 429) {
          attempt++;
          if (attempt >= maxRetries) {
            const errData = await res.json();
            return { reply: errData.reply || "API rate limit reached. Please wait a moment." };
          }
        } else {
          attempt++;
        }
      } catch (err) {
        attempt++;
        if (attempt >= maxRetries) throw err;
      }
    }
    throw new Error("Failed after retries");
  };

  // Simulate token-by-token streaming for buttery smooth ChatGPT experience
  const streamResponse = async (fullReply: string, msgId: string) => {
    const parsed = parseTeacherResponse(fullReply);
    
    // Create streaming placeholder message
    setMessages(prev => [
      ...prev,
      {
        id: msgId,
        role: "model",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        parsedResponse: null,
        isStreaming: true
      }
    ]);

    // Stream text in small chunks
    const chunkSize = 12;
    let currIdx = 0;

    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        currIdx += chunkSize;
        if (currIdx >= fullReply.length) {
          clearInterval(interval);
          setMessages(prev => prev.map(m => m.id === msgId ? {
            ...m,
            content: fullReply,
            parsedResponse: parsed,
            isStreaming: false
          } : m));
          if (isUserAtBottomRef.current) scrollToBottom(true);
          resolve();
        } else {
          const chunk = fullReply.substring(0, currIdx);
          setMessages(prev => prev.map(m => m.id === msgId ? {
            ...m,
            content: chunk,
            parsedResponse: parseTeacherResponse(chunk),
            isStreaming: true
          } : m));
          if (isUserAtBottomRef.current) scrollToBottom(true);
        }
      }, 16);
    });
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsgId = `user-${Date.now()}`;
    const userMessage: Message = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    isUserAtBottomRef.current = true;

    // Immediately refocus input
    focusInput();

    // Scroll chat container
    setTimeout(() => scrollToBottom(true), 30);

    try {
      const history = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const data = await fetchWithRetry(textToSend, history, 3);
      setLoading(false);

      if (data && data.reply) {
        const modelMsgId = `model-${Date.now()}`;
        await streamResponse(data.reply, modelMsgId);
        onAddPoints(5);
      }
    } catch (error) {
      console.error("AI Teacher Error:", error);
      setLoading(false);
      setMessages(prev => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "model",
          content: "Assalamu Alaikum! I seem to have lost connection to my research library for a second. Please ask your question again, Insha'Allah! 😊",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          parsedResponse: null,
          isStreaming: false
        }
      ]);
    } finally {
      setLoading(false);
      setRetryStatus(null);
      focusInput();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !loading) {
        handleSend(input);
      }
    }
  };

  const handleResetChat = () => {
    setMessages([initialWelcome]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    focusInput();
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const speechText = stripMarkdown(text)
        .replace(/ﷺ/g, "Peace be upon him")
        .replace(/\(AS\)/g, "Peace be upon him")
        .replace(/\(RA\)/g, "May Allah be pleased with him");
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="w-full max-w-[1440px] mx-auto px-1 sm:px-4 py-2 sm:py-4 font-sans text-slate-800 dark:text-slate-100" id="ai-teacher-root">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3 sm:mb-4 px-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Home
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="lg:hidden flex items-center gap-1 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs cursor-pointer"
          >
            <Sidebar className="w-4 h-4" /> Topics
          </button>
        </div>

        <div className="text-center sm:text-right">
          <h1 className="text-lg sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 flex items-center gap-2 justify-center sm:justify-end">
            <GraduationCap className="w-6 h-6 text-amber-500 shrink-0" />
            AI Islamic Research Assistant
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-sans">
            Authentic Knowledge from Quran & Sahih Sunnah • مستند اسلامی تحقیقی معاون
          </p>
        </div>
      </div>

      {/* Main ChatGPT Interface Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        
        {/* Left Side Explorer Bar (Collapsible on Mobile) */}
        <div className={`lg:col-span-3 space-y-3 ${showSidebar ? "block" : "hidden lg:block"}`}>
          {/* Authentic Research Badge */}
          <div className="bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-amber-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 rounded-3xl border border-emerald-500/20 text-center space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-xl mx-auto shadow-md">
              🕌
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-300">Authentic Research Standards</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed font-sans">
                Quran ➔ Sahih Hadith ➔ Sahabah ➔ Classical Scholars
              </p>
            </div>
            <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Verified Sources Only
            </div>
          </div>

          {/* Quick Questions Chips */}
          <div className="bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-200/60 dark:border-slate-700/60 space-y-2.5 shadow-xs">
            <h4 className="text-xs font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" /> Explore Islamic Topics
            </h4>
            <div className="flex flex-col gap-1.5">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    handleSend(q.text);
                    focusInput();
                  }}
                  disabled={loading}
                  className="w-full text-left p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-slate-200/50 dark:border-slate-700/80 hover:border-emerald-400 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all flex items-center justify-between group cursor-pointer disabled:opacity-50"
                >
                  <span className="line-clamp-2">{q.label}</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-black group-hover:translate-x-1 transition-transform ml-1 shrink-0">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ChatGPT Chat Canvas (Full width, Desktop 9 columns) */}
        <div className="lg:col-span-9 flex flex-col h-[calc(100vh-130px)] min-h-[580px] max-h-[860px] w-full bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/70 dark:border-slate-700/80 shadow-md overflow-hidden relative">
          
          {/* Header Status Bar */}
          <div className="px-4 py-3 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-100 dark:border-slate-700/60 flex items-center justify-between shrink-0 z-10 backdrop-blur-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white text-lg shadow-sm shrink-0">
                👨‍🏫
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                  Teacher Inaamullah <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider">Authentic AI</span>
                </h4>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Active Assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {retryStatus && (
                <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full animate-pulse border border-amber-500/20">
                  {retryStatus}
                </span>
              )}
              {messages.length > 1 && (
                <button
                  onClick={handleResetChat}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-750 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                  title="Clear conversation and start fresh"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              )}
              {activeProfile && (
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-full text-[10px] font-black border border-amber-500/20 shrink-0">
                  🌟 {activeProfile.name}
                </div>
              )}
            </div>
          </div>

          {/* Conversation Messages List (Internal scrolling only) */}
          <div
            ref={chatContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-6 min-h-0 bg-slate-50/30 dark:bg-slate-900/10 scroll-smooth"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 w-full ${m.role === "user" ? "ml-auto flex-row-reverse max-w-[90%] sm:max-w-[80%]" : "mr-auto w-full"}`}
              >
                {/* Avatar Icon */}
                <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 text-sm sm:text-base shadow-xs ${m.role === "user" ? "bg-amber-400 text-slate-900 font-bold" : "bg-emerald-600 text-white"}`}>
                  {m.role === "user" ? "🧒" : "🕌"}
                </div>

                {/* Message Bubble Content */}
                <div className="flex-1 space-y-1 min-w-0">
                  {m.role === "user" ? (
                    <div className="p-3.5 sm:p-4 rounded-3xl bg-amber-400 text-slate-950 font-semibold text-[15px] sm:text-[16px] leading-relaxed rounded-tr-none shadow-2xs whitespace-pre-wrap">
                      {m.content}
                    </div>
                  ) : (
                    /* Model Response Container */
                    <ModelResearchCard 
                      rawContent={m.content} 
                      parsed={m.parsedResponse || parseTeacherResponse(m.content)}
                      isStreaming={m.isStreaming}
                    />
                  )}

                  {/* Timestamp & Text-to-speech Controls */}
                  <div className={`flex items-center gap-2 text-[10px] font-bold text-slate-400 mt-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <span>{m.timestamp}</span>
                    {m.role === "model" && !m.isStreaming && (
                      <button
                        onClick={() => speakText(m.parsedResponse?.answerSummary || m.content)}
                        className="text-emerald-600 hover:text-emerald-500 p-1 rounded-md hover:bg-emerald-500/10 transition-colors cursor-pointer"
                        title="Listen to summary"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Researching / Loading Animation */}
            {loading && (
              <div className="flex gap-3 mr-auto w-full">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-sm sm:text-base shrink-0 shadow-xs">
                  🕌
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/80 p-4 sm:p-5 rounded-3xl rounded-tl-none shadow-xs space-y-2 flex-1 max-w-xl">
                  <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4 animate-spin text-amber-500 shrink-0" />
                    <span>{loadingSteps[loadingStep]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Floating Scroll to Bottom Button */}
          {showScrollButton && (
            <button
              type="button"
              onClick={() => scrollToBottom(true)}
              className="absolute bottom-20 right-5 z-20 px-3 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg border border-emerald-400 transition-all flex items-center gap-1.5 text-xs font-bold animate-bounce cursor-pointer"
            >
              <ChevronDown className="w-4 h-4" />
              <span>Latest answer</span>
            </button>
          )}

          {/* ChatGPT Style Sticky Bottom Dock */}
          <div className="p-3 sm:p-4 bg-white/95 dark:bg-slate-850/95 border-t border-slate-200/80 dark:border-slate-700/80 backdrop-blur-md sticky bottom-0 z-30 shadow-lg shrink-0 flex flex-col gap-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim() && !loading) {
                  handleSend(input);
                }
              }}
              className="flex gap-2 sm:gap-3 items-end"
            >
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  placeholder={
                    language === "ur" 
                      ? "اسلام کے بارے میں کوئی بھی سوال پوچھیں..." 
                      : language === "ar" 
                      ? "اسأل أي سؤال عن الإسلام..." 
                      : "Ask anything about Islam... (e.g. 'Why do we pray Salah?')"
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-[15px] sm:text-[16px] text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans resize-none max-h-36 leading-relaxed shadow-inner transition-all"
                  id="ai-teacher-input"
                />
              </div>
              <button
                type="submit"
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:opacity-40 text-white rounded-2xl shadow-md transition-all active:scale-95 shrink-0 cursor-pointer flex items-center justify-center min-w-[48px] min-h-[48px]"
                disabled={!input.trim() || loading}
                id="ai-teacher-send"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 px-1 font-sans">
              <span>Press <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[9px] text-slate-600 dark:text-slate-300">Enter</kbd> to send • <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[9px] text-slate-600 dark:text-slate-300">Shift + Enter</kbd> for new line</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   CONVERSATIONAL TEXT RENDERER & COLLAPSIBLE MODEL RESEARCH CARDS
   ========================================================================== */

function renderFormattedTextWithLinks(text: string) {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      let label = "Reference Link";
      if (part.includes("quran.com")) {
        label = "Quran Verse Link 📖";
      } else if (part.includes("sunnah.com")) {
        label = "Sunnah Hadith Link 📚";
      }
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-extrabold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-xl text-xs sm:text-sm transition-all my-0.5 mx-1 border border-emerald-500/20"
        >
          <span>{label}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      );
    }
    return part;
  });
}

function ConversationalTextRenderer({ content }: { content: string }) {
  const cleanContent = stripMarkdown(content);
  const blocks = cleanContent.split("\n").map(b => b.trim()).filter(Boolean);

  return (
    <div className="space-y-4 font-sans text-slate-800 dark:text-slate-100 text-[16px] sm:text-[17px] leading-[1.75]">
      {blocks.map((block, idx) => {
        const isHeading =
          /^(📖|🌸|📚|🔗|⭐)?\s*(Answer|Easy Explanation|Simple Explanation|Explanation for Children|Proof|Quran Proof|Hadith Proof|Reference|Authentic Source|Important Lesson|Key Lesson|Method|Wisdom|Common Mistakes|Islamic Ruling|Practical Example|Lessons for Life|Lessons|Authentic Story|Short Introduction|Differing Opinions|Source References|Note|Important Note):?/i.test(block) ||
          (block.endsWith(":") && block.length < 70 && !block.includes("http") && !block.includes("quran.com") && !block.includes("sunnah.com"));

        if (isHeading) {
          return (
            <div key={idx} className="pt-4 pb-1 border-b border-emerald-500/15">
              <h3 className="text-[15px] sm:text-[16px] font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                {block.replace(/:$/, "")}
              </h3>
            </div>
          );
        }

        const hasArabicChar = /[\u0600-\u06FF]/.test(block);
        const isUrduLine =
          block.toLowerCase().includes("urdu") ||
          block.startsWith("اردو") ||
          block.startsWith("ترجمہ") ||
          (hasArabicChar && !/[\u064B-\u0652]/.test(block) && block.length > 20);

        const isArabicVerse = hasArabicChar && !isUrduLine;

        if (isArabicVerse) {
          return (
            <div key={idx} className="bg-emerald-50/70 dark:bg-emerald-950/40 p-5 sm:p-8 rounded-3xl border border-emerald-500/30 my-3 shadow-inner text-center">
              <p className="font-arabic text-[28px] sm:text-[34px] text-emerald-900 dark:text-emerald-200 leading-[2.2] dir-rtl">
                {block}
              </p>
            </div>
          );
        }

        if (isUrduLine && hasArabicChar) {
          return (
            <div key={idx} className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 my-2">
              <p className="font-urdu text-[18px] sm:text-[21px] text-slate-800 dark:text-slate-200 text-right leading-[1.8] dir-rtl">
                {block}
              </p>
            </div>
          );
        }

        return (
          <p key={idx} className="leading-[1.75]">
            {renderFormattedTextWithLinks(block)}
          </p>
        );
      })}
    </div>
  );
}

interface ModelResearchCardProps {
  rawContent: string;
  parsed: TeacherResearchResponse | null;
  isStreaming?: boolean;
}

function ModelResearchCard({ rawContent, parsed, isStreaming }: ModelResearchCardProps) {
  // Collapsible section state
  const [openQuran, setOpenQuran] = useState(true);
  const [openHadith, setOpenHadith] = useState(true);
  const [openScholars, setOpenScholars] = useState(true);
  const [openLessons, setOpenLessons] = useState(true);
  const [openReferences, setOpenReferences] = useState(true);

  if (isStreaming || !parsed || (typeof parsed === "object" && !parsed.title && !parsed.answerSummary && !parsed.nonIslamicGuideMessage)) {
    return (
      <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-4 sm:p-6 rounded-3xl rounded-tl-none border border-slate-200/60 dark:border-slate-700/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/60 pb-2">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <GraduationCap className="w-4 h-4 text-amber-500" /> Teacher Inaamullah
          </div>
          {isStreaming && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Typing...
            </span>
          )}
        </div>
        <ConversationalTextRenderer content={rawContent} />
        {isStreaming && (
          <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse ml-1" />
        )}
      </div>
    );
  }

  // Non-Islamic question boundary
  if (parsed.isIslamicQuestion === false || parsed.nonIslamicGuideMessage) {
    return (
      <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/30 p-5 rounded-3xl rounded-tl-none space-y-3">
        <div className="flex items-center gap-2 text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-amber-600" /> Islamic Research Boundary
        </div>
        <p className="text-[15px] sm:text-[16px] text-slate-800 dark:text-slate-100 font-sans leading-relaxed">
          {stripMarkdown(parsed.nonIslamicGuideMessage || "I am your AI Islamic Teacher, and I can only answer questions about Islam, the Quran, the Prophets, and good Islamic manners. Let's talk about something beautiful in Islam instead!")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 p-4 sm:p-6 rounded-3xl rounded-tl-none border border-slate-200/70 dark:border-slate-700/80 shadow-xs space-y-5">
      
      {/* 1. Research Header Title */}
      <div className="border-b border-slate-100 dark:border-slate-700/60 pb-4 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Authentic Research Findings
          </span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Verified Sources Hierarchy
          </span>
        </div>

        {parsed.title && (
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
            {stripMarkdown(parsed.title)}
          </h2>
        )}

        {parsed.titleUrdu && (
          <h3 className="text-lg sm:text-xl font-urdu font-bold text-emerald-700 dark:text-emerald-400 leading-normal text-right" dir="rtl">
            {stripMarkdown(parsed.titleUrdu)}
          </h3>
        )}
      </div>

      {/* 2. Answer Summary Section */}
      {parsed.answerSummary && (
        <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 sm:p-5 rounded-2xl border border-emerald-500/20 space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Summary Answer
          </h4>
          <p className="text-[16px] sm:text-[17px] text-slate-800 dark:text-slate-100 font-sans leading-[1.75]">
            {stripMarkdown(parsed.answerSummary)}
          </p>
        </div>
      )}

      {/* 3. COLLAPSIBLE CARD #1: EVIDENCE FROM THE HOLY QURAN */}
      {parsed.quranEvidence && parsed.quranEvidence.length > 0 && (
        <div className="border border-emerald-500/25 rounded-2xl overflow-hidden bg-emerald-50/40 dark:bg-emerald-950/20">
          <button
            onClick={() => setOpenQuran(!openQuran)}
            className="w-full p-3.5 sm:p-4 bg-emerald-500/10 dark:bg-emerald-950/40 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-emerald-500/15"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">1</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <BookMarked className="w-4 h-4 text-emerald-600" /> Evidence from the Holy Quran ({parsed.quranEvidence.length})
              </h3>
            </div>
            {openQuran ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5 text-emerald-700" />}
          </button>

          {openQuran && (
            <div className="p-4 space-y-4 border-t border-emerald-500/20">
              {parsed.quranEvidence.map((q, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-emerald-500/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/15 pb-2">
                    <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      📖 {q.surahName} ({q.surahNumber}:{q.ayahNumber})
                    </span>
                    <a
                      href={q.link || `https://quran.com/${q.surahNumber}/${q.ayahNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:underline bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20 transition-all hover:scale-105"
                    >
                      Open Verse <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Large Centered Arabic Mushaf Script */}
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-5 sm:p-8 rounded-2xl border border-emerald-500/30 text-center shadow-inner">
                    <p className="font-arabic text-[28px] sm:text-[36px] text-emerald-900 dark:text-emerald-200 leading-[2.2] dir-rtl">
                      {q.arabic}
                    </p>
                  </div>

                  {/* Urdu Translation */}
                  {q.translationUr && (
                    <p className="font-urdu text-[18px] sm:text-[21px] text-slate-800 dark:text-slate-200 text-right leading-[1.8] dir-rtl border-t border-emerald-200/50 dark:border-emerald-800/40 pt-2">
                      {q.translationUr}
                    </p>
                  )}

                  {/* English Translation */}
                  {q.translationEn && (
                    <p className="text-[15px] sm:text-[16px] font-sans text-slate-700 dark:text-slate-300 italic leading-relaxed pt-1">
                      "{stripMarkdown(q.translationEn)}"
                    </p>
                  )}

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans border border-emerald-100 dark:border-slate-700">
                      <span className="font-black text-emerald-700 dark:text-emerald-400 mr-1">Explanation:</span>
                      {stripMarkdown(q.explanation)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. COLLAPSIBLE CARD #2: AUTHENTIC SAHIH HADITH CARDS */}
      {parsed.hadithCards && parsed.hadithCards.length > 0 && (
        <div className="border border-teal-500/25 rounded-2xl overflow-hidden bg-teal-50/40 dark:bg-teal-950/20">
          <button
            onClick={() => setOpenHadith(!openHadith)}
            className="w-full p-3.5 sm:p-4 bg-teal-500/10 dark:bg-teal-950/40 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-teal-500/15"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center text-xs font-black">2</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <ScrollTextIcon /> Authentic Sahih Hadith Evidence ({parsed.hadithCards.length})
              </h3>
            </div>
            {openHadith ? <ChevronUp className="w-5 h-5 text-teal-700" /> : <ChevronDown className="w-5 h-5 text-teal-700" />}
          </button>

          {openHadith && (
            <div className="p-4 space-y-4 border-t border-teal-500/20">
              {parsed.hadithCards.map((h, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3.5 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20">
                        📜 {h.bookName}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        Hadith #{h.hadithNumber}
                      </span>
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                        {h.authenticity || "Sahih"}
                      </span>
                    </div>

                    {h.link && (
                      <a
                        href={h.link || "https://sunnah.com/"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-extrabold text-teal-700 dark:text-teal-300 hover:underline bg-teal-500/10 px-2.5 py-1 rounded-xl border border-teal-500/20 transition-all hover:scale-105"
                      >
                        Open Sunnah Reference <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {h.narrator && (
                    <div className="text-xs font-black text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Narrator: <strong className="text-emerald-800 dark:text-emerald-300">{h.narrator}</strong></span>
                      {h.chapterName && <span className="text-slate-400 font-normal">• Chapter: {h.chapterName}</span>}
                    </div>
                  )}

                  {h.arabic && (
                    <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 sm:p-6 rounded-2xl border border-emerald-500/30 text-center shadow-inner">
                      <p className="font-arabic text-[26px] sm:text-[32px] text-emerald-900 dark:text-emerald-200 leading-[2.2] dir-rtl">
                        {h.arabic}
                      </p>
                    </div>
                  )}

                  {h.translationUr && (
                    <p className="font-urdu text-[18px] sm:text-[21px] text-slate-800 dark:text-slate-200 text-right leading-[1.8] dir-rtl border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
                      {h.translationUr}
                    </p>
                  )}

                  {h.translationEn && (
                    <p className="text-[15px] sm:text-[16px] font-sans text-slate-700 dark:text-slate-300 leading-relaxed italic">
                      "{stripMarkdown(h.translationEn)}"
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {h.mainLesson && (
                      <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200/60 dark:border-slate-700 text-xs sm:text-sm font-sans space-y-1">
                        <span className="font-black text-teal-700 dark:text-teal-400 flex items-center gap-1">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Main Lesson
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{stripMarkdown(h.mainLesson)}</p>
                      </div>
                    )}

                    {h.practicalLessonKids && (
                      <div className="bg-amber-500/5 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-500/20 text-xs sm:text-sm font-sans space-y-1">
                        <span className="font-black text-amber-800 dark:text-amber-300 flex items-center gap-1">
                          🌟 Lesson for Kids
                        </span>
                        <p className="text-slate-700 dark:text-slate-300">{stripMarkdown(h.practicalLessonKids)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. COLLAPSIBLE CARD #3: SAHABAH & SCHOLARS EXPLANATION */}
      {parsed.sahabahAndScholarsExplanation && (
        <div className="border border-indigo-500/25 rounded-2xl overflow-hidden bg-indigo-50/30 dark:bg-indigo-950/20">
          <button
            onClick={() => setOpenScholars(!openScholars)}
            className="w-full p-3.5 sm:p-4 bg-indigo-500/10 dark:bg-indigo-950/40 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-indigo-500/15"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">3</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-indigo-600" /> Explanation of Sahabah & Classical Scholars
              </h3>
            </div>
            {openScholars ? <ChevronUp className="w-5 h-5 text-indigo-700" /> : <ChevronDown className="w-5 h-5 text-indigo-700" />}
          </button>

          {openScholars && (
            <div className="p-4 sm:p-5 border-t border-indigo-500/20 text-[15px] sm:text-[16px] text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
              {stripMarkdown(parsed.sahabahAndScholarsExplanation)}
            </div>
          )}
        </div>
      )}

      {/* 6. COLLAPSIBLE CARD #4: PRACTICAL LIFE LESSONS */}
      {((parsed.practicalLessonsForChildren && parsed.practicalLessonsForChildren.length > 0) ||
        (parsed.practicalLessonsForParents && parsed.practicalLessonsForParents.length > 0)) && (
        <div className="border border-emerald-500/25 rounded-2xl overflow-hidden bg-emerald-50/30 dark:bg-emerald-950/20">
          <button
            onClick={() => setOpenLessons(!openLessons)}
            className="w-full p-3.5 sm:p-4 bg-emerald-500/10 dark:bg-emerald-950/40 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-emerald-500/15"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs font-black">4</span>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" /> Practical Life Lessons & Action Steps
              </h3>
            </div>
            {openLessons ? <ChevronUp className="w-5 h-5 text-emerald-700" /> : <ChevronDown className="w-5 h-5 text-emerald-700" />}
          </button>

          {openLessons && (
            <div className="p-4 sm:p-5 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parsed.practicalLessonsForChildren && parsed.practicalLessonsForChildren.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-emerald-500/20 space-y-2">
                  <h4 className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                    🧒 For Children
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
                    {parsed.practicalLessonsForChildren.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold mt-0.5">✓</span>
                        <span>{stripMarkdown(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {parsed.practicalLessonsForParents && parsed.practicalLessonsForParents.length > 0 && (
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-blue-500/20 space-y-2">
                  <h4 className="text-xs font-black text-blue-800 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
                    👨‍👩‍👧 For Parents & Teachers
                  </h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans">
                    {parsed.practicalLessonsForParents.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-600 font-bold mt-0.5">▪</span>
                        <span>{stripMarkdown(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 7. COLLAPSIBLE CARD #5: REFERENCES & CITATIONS */}
      {parsed.references && parsed.references.length > 0 && (
        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50 dark:bg-slate-900/40">
          <button
            onClick={() => setOpenReferences(!openReferences)}
            className="w-full p-3.5 sm:p-4 bg-slate-100 dark:bg-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors hover:bg-slate-200/80"
          >
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Source Citations & Verified References ({parsed.references.length})
              </h4>
            </div>
            {openReferences ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
          </button>

          {openReferences && (
            <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
              {parsed.references.map((ref, idx) => (
                <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 text-xs sm:text-sm font-sans flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mr-2">{ref.book}</span>
                    <span className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs mr-2">Chapter: {ref.chapter}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] sm:text-xs mr-2">{ref.numberOrAyah}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase">{ref.authenticity}</span>
                  </div>

                  <a
                    href={ref.link || "https://quran.com"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                  >
                    Verify Source <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScrollTextIcon() {
  return (
    <svg className="w-4 h-4 text-teal-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h3" />
      <path d="M19 17V5a2 2 0 0 0-2-2H4" />
    </svg>
  );
}
