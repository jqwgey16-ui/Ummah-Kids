import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, Award, Search, Sparkles, CheckCircle, MessageCircle, FileText, 
  Bookmark, Share2, Printer, Volume2, VolumeX, Trash2, Edit, Plus, X, 
  ChevronDown, ChevronUp, Globe, Languages, Calendar, User, ShieldCheck, 
  ArrowRight, Heart, Send, Check, RefreshCw, AlertCircle, Mic, Brain
} from "lucide-react";
import VoiceConversation from "./VoiceConversation";
import ScholarDeepThinking from "./ScholarDeepThinking";

import { Language, getTranslation } from "../lib/translations";

interface Scholar {
  id: string;
  name: string;
  title: string;
  credentials: string;
  photoUrl: string;
  bio: string;
  isVerified: boolean;
  createdAt: string;
}

interface ScholarAnswer {
  id: string;
  questionId: string;
  answerText: string;
  quranReference: string;
  hadithReference: string;
  keyLesson: string;
  actionStep: string;
  verifiedBy: string;
  scholarId?: string;
  createdAt: string;
}

interface ScholarQuestion {
  id: string;
  name: string;
  childAge: number;
  country: string;
  language: string;
  category: string;
  title: string;
  question: string;
  email?: string;
  status: "pending" | "answered" | "rejected";
  createdAt: string;
  answeredAt?: string;
  answerId?: string;
  viewCount?: number;
  bookmarkCount?: number;
  isFeatured?: boolean;
  isVerified?: boolean;
  answer?: ScholarAnswer | null;
}

interface AskScholarProps {
  activeProfile: any;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  onNavigateToView: (view: string) => void;
  adminToken?: string | null;
  language?: Language;
}

const CATEGORIES = [
  "Quran", "Prophets", "Prophet Muhammad ﷺ", "Sahaba", "Hadith", 
  "Salah", "Wudu", "Dua", "Akhlaq", "Islamic History", 
  "Ramadan", "Hajj", "General Islamic Questions"
];

const LANGUAGES = ["English", "Urdu", "Arabic"];

export default function AskScholar({
  activeProfile,
  onAddPoints,
  onNavigateHome,
  onNavigateToView,
  adminToken,
  language = "en"
}: AskScholarProps) {
  // Navigation tabs: 'ask' | 'library' | 'scholars' | 'voice-chat' | 'deep-thinking' | 'admin'
  const [activeTab, setActiveTab] = useState<"ask" | "library" | "scholars" | "voice-chat" | "deep-thinking" | "admin">("library");

  // Public Questions State
  const [questions, setQuestions] = useState<ScholarQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);

  // Scholars State
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [loadingScholars, setLoadingScholars] = useState(true);

  // Ask Scholar Form State
  const [formName, setFormName] = useState(activeProfile?.name || "");
  const [formAge, setFormAge] = useState(activeProfile?.age?.toString() || "");
  const [formCountry, setFormCountry] = useState("");
  const [formLanguage, setFormLanguage] = useState("English");
  const [formCategory, setFormCategory] = useState("Quran");
  const [formTitle, setFormTitle] = useState("");
  const [formQuestion, setFormQuestion] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // AI Response Screen after submission
  const [lastSubmissionResult, setLastSubmissionResult] = useState<{
    success: boolean;
    aiAnswered: boolean;
    question: ScholarQuestion;
    answer?: ScholarAnswer;
    message: string;
  } | null>(null);

  // Checked off action steps to award points once
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  // Speech Synth
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Admin section states
  const [adminQuestions, setAdminQuestions] = useState<ScholarQuestion[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);
  const [answeringQuestion, setAnsweringQuestion] = useState<ScholarQuestion | null>(null);
  const [manualAnswerText, setManualAnswerText] = useState("");
  const [manualQuranRef, setManualQuranRef] = useState("");
  const [manualHadithRef, setManualHadithRef] = useState("");
  const [manualLesson, setManualLesson] = useState("");
  const [manualAction, setManualAction] = useState("");
  const [manualScholarId, setManualScholarId] = useState("");

  // Load public questions, scholars and bookmarked list
  useEffect(() => {
    fetchQuestions();
    fetchScholars();
    
    // Load local bookmarks
    try {
      const saved = localStorage.getItem("scholar_bookmarks");
      if (saved) {
        setBookmarkedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync bookmarks
  const toggleBookmark = (qId: string) => {
    let updated: string[] = [];
    if (bookmarkedIds.includes(qId)) {
      updated = bookmarkedIds.filter(id => id !== qId);
    } else {
      updated = [...bookmarkedIds, qId];
      onAddPoints(5); // Reward 5 points for saving authentic knowledge!
    }
    setBookmarkedIds(updated);
    localStorage.setItem("scholar_bookmarks", JSON.stringify(updated));
  };

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/scholar/questions");
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const fetchScholars = async () => {
    setLoadingScholars(true);
    try {
      const res = await fetch("/api/scholar/scholars");
      if (res.ok) {
        const data = await res.json();
        setScholars(data);
        if (data.length > 0) {
          setManualScholarId(data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load scholars:", err);
    } finally {
      setLoadingScholars(false);
    }
  };

  // Submit form
  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formAge || !formCountry || !formTitle || !formQuestion) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/scholar/submit-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          childAge: Number(formAge),
          country: formCountry,
          language: formLanguage,
          category: formCategory,
          title: formTitle,
          question: formQuestion,
          email: formEmail
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastSubmissionResult({
          success: true,
          aiAnswered: data.aiAnswered,
          question: data.question,
          answer: data.answer,
          message: data.message
        });

        // Award 15 points for asking a beautiful Islamic question!
        onAddPoints(15);

        // Reset form input
        setFormTitle("");
        setFormQuestion("");
        
        // Refresh question library
        fetchQuestions();
      } else {
        alert("Failed to submit question. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting question. Connecting to offline queue.");
    } finally {
      setSubmitting(false);
    }
  };

  // Text-To-Speech (Read Aloud)
  const handleReadAloud = (qId: string, text: string) => {
    if (speakingId === qId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      
      // Determine language
      const q = questions.find(item => item.id === qId);
      if (q?.language?.toLowerCase() === "urdu") {
        utterance.lang = "ur-PK";
      } else if (q?.language?.toLowerCase() === "arabic") {
        utterance.lang = "ar-SA";
      } else {
        utterance.lang = "en-US";
      }

      window.speechSynthesis.speak(utterance);
      setSpeakingId(qId);
    }
  };

  // Share Q&A
  const handleShare = (qId: string) => {
    const shareUrl = `${window.location.origin}/#scholar-qa-${qId}`;
    navigator.clipboard.writeText(shareUrl);
    alert("Beautiful! Shared link copied to clipboard. Jazakallah!");
  };

  // Print Q&A
  const handlePrint = (q: ScholarQuestion) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${q.title} - Ask a Scholar</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; text-align: center; }
            .badge { background: #e0f2fe; color: #0369a1; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .question-box { background: #f8fafc; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
            .answer-box { background: #f0fdf4; border-left: 4px solid #10b981; padding: 25px; border-radius: 4px; }
            .reference { font-style: italic; color: #475569; margin-top: 15px; font-size: 14px; }
            .lessons { background: #fffbeb; border: 1px solid #fef3c7; padding: 15px; border-radius: 4px; margin-top: 20px; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <h1 style="color: #065f46; margin: 0 0 5px 0;">📖 Ask a Scholar Q&A Library</h1>
            <p style="margin: 0; font-size: 14px; color: #64748b;">Verified authentic children's learning guide</p>
          </div>
          <div class="question-box">
            <span class="badge">${q.category}</span>
            <h2 style="margin: 10px 0 5px 0;">${q.title}</h2>
            <p style="font-size: 14px; color: #64748b; margin-bottom: 15px;">Asked by ${q.name} (Age ${q.childAge}) from ${q.country}</p>
            <p style="margin: 0; font-style: italic;">"${q.question}"</p>
          </div>
          ${q.answer ? `
          <div class="answer-box">
            <h3 style="color: #065f46; margin-top: 0;">Verified Answer</h3>
            <p>${q.answer.answerText}</p>
            <div class="reference">
              <strong>Quran Reference:</strong> ${q.answer.quranReference || "Not specified"}<br/>
              <strong>Hadith Reference:</strong> ${q.answer.hadithReference || "Not specified"}
            </div>
            <div class="lessons">
              <strong style="color: #b45309;">🌟 Key Lesson:</strong>
              <p style="margin: 5px 0 0 0;">${q.answer.keyLesson}</p>
            </div>
            <div class="lessons" style="background: #ecfdf5; border-color: #d1fae5;">
              <strong style="color: #047857;">🚀 Interactive Action Step:</strong>
              <p style="margin: 5px 0 0 0;">${q.answer.actionStep}</p>
            </div>
          </div>
          ` : `<p>Pending scholar verified answer.</p>`}
          <div style="text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            © 2026 Ummah Kids • by Inaamullah. All citations are strictly verified from authentic databases.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Complete action step (reward 10 points)
  const handleActionComplete = (ansId: string) => {
    if (completedActions.includes(ansId)) return;
    setCompletedActions([...completedActions, ansId]);
    onAddPoints(20); // Big reward!
  };

  // Fetch admin questions
  const loadAdminQuestions = async () => {
    setLoadingAdmin(true);
    try {
      const res = await fetch("/api/scholar/admin/questions", {
        headers: { "Authorization": `Bearer ${adminToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAdminQuestions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Select Tab effect for admin
  useEffect(() => {
    if (activeTab === "admin" && adminToken) {
      loadAdminQuestions();
    }
  }, [activeTab, adminToken]);

  // Submit manual answer
  const handleManualAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringQuestion) return;

    // Find scholar details
    const scholarObj = scholars.find(s => s.id === manualScholarId);
    const scholarName = scholarObj ? `${scholarObj.title} ${scholarObj.name}` : "Verified Scholar Panel";

    try {
      const res = await fetch(`/api/scholar/admin/questions/${answeringQuestion.id}/answer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          answerText: manualAnswerText,
          quranReference: manualQuranRef,
          hadithReference: manualHadithRef,
          keyLesson: manualLesson,
          actionStep: manualAction,
          verifiedBy: scholarName,
          scholarId: manualScholarId
        })
      });

      if (res.ok) {
        alert("Submited scholar answer and verified!");
        setAnsweringQuestion(null);
        setManualAnswerText("");
        setManualQuranRef("");
        setManualHadithRef("");
        setManualLesson("");
        setManualAction("");
        loadAdminQuestions();
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
      alert("Error submitting answer.");
    }
  };

  // Update question status (approve / reject / delete)
  const handleAdminAction = async (qId: string, actionType: "delete" | "status", newStatus?: string) => {
    const confirmation = window.confirm(`Are you sure you want to perform this action?`);
    if (!confirmation) return;

    try {
      const res = await fetch(`/api/scholar/admin/questions/${qId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          action: actionType,
          status: newStatus
        })
      });

      if (res.ok) {
        alert("Action processed successfully.");
        loadAdminQuestions();
        fetchQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Cabin redirection helper based on categories
  const cabinLinks = {
    "Quran": { label: "Explore Quran Cabin 📖", view: "quran" },
    "Hadith": { label: "Hadith Corner 📜", view: "hadiths" },
    "Salah": { label: "Salah Cabin 🕌", view: "salah" },
    "Dua": { label: "Learn beautiful Duas 🙏", view: "duas" },
    "Prophets": { label: "Prophets Stories 📖", view: "stories" },
    "Prophet Muhammad ﷺ": { label: "Seerah Stories 📖", view: "stories" },
    "Sahaba": { label: "Sahaba Stories 📖", view: "stories" },
  };

  // Filtering public questions
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = searchQuery === "" || 
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.answer?.answerText && q.answer.answerText.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "All" || q.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10" id="ask-scholar-root">
      
      {/* Top Welcome Card */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg border border-emerald-500/10">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 opacity-10">
          <BookOpen className="w-96 h-96" />
        </div>
        
        <div className="max-w-2xl space-y-6 relative z-10">
          <span className="px-3.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 uppercase tracking-widest flex items-center gap-1.5 w-fit">
            <Award className="w-3.5 h-3.5" /> Authentic Knowledge Desk
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ask a Scholar 📖
          </h1>
          <p className="text-sm sm:text-base text-emerald-100 leading-relaxed">
            Have a question about Allah, the Prophets, beautiful moral values, or how to offer Salah/Wudu? Type your question and our AI will verify answers immediately against the authentic Quran and Sahih Hadith. 
            If the answer requires deep wisdom, we refer it to our verified qualified scholars!
          </p>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => { setActiveTab("ask"); setLastSubmissionResult(null); }}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "ask" 
                  ? "bg-white text-emerald-800 shadow-md scale-105" 
                  : "bg-emerald-500/20 text-white border border-white/20 hover:bg-emerald-500/30"
              }`}
              id="tab-ask-scholar"
            >
              <Plus className="w-4 h-4" /> Ask a Question
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "library" 
                  ? "bg-white text-emerald-800 shadow-md scale-105" 
                  : "bg-emerald-500/20 text-white border border-white/20 hover:bg-emerald-500/30"
              }`}
              id="tab-library"
            >
              <BookOpen className="w-4 h-4" /> Q&A Library
            </button>
            <button
              onClick={() => setActiveTab("voice-chat")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "voice-chat" 
                  ? "bg-amber-400 text-slate-900 shadow-md scale-105" 
                  : "bg-amber-500/20 text-amber-200 border border-amber-400/30 hover:bg-amber-500/30"
              }`}
              id="tab-voice-chat"
            >
              <Mic className="w-4 h-4 text-amber-300" /> Live Voice Companion
            </button>
            <button
              onClick={() => setActiveTab("deep-thinking")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "deep-thinking" 
                  ? "bg-indigo-500 text-white shadow-md scale-105" 
                  : "bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 hover:bg-indigo-500/30"
              }`}
              id="tab-deep-thinking"
            >
              <Brain className="w-4 h-4 text-indigo-300" /> High Thinking Analysis
            </button>
            <button
              onClick={() => setActiveTab("scholars")}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === "scholars" 
                  ? "bg-white text-emerald-800 shadow-md scale-105" 
                  : "bg-emerald-500/20 text-white border border-white/20 hover:bg-emerald-500/30"
              }`}
              id="tab-scholars"
            >
              <ShieldCheck className="w-4 h-4" /> Verified Scholars
            </button>
            {adminToken && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeTab === "admin" 
                    ? "bg-white text-emerald-800 shadow-md scale-105" 
                    : "bg-amber-500/20 text-amber-200 border border-amber-500/20 hover:bg-amber-500/30"
                }`}
                id="tab-admin"
              >
                <User className="w-4 h-4" /> Scholar Admin Panel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Rendering */}
      <AnimatePresence mode="wait">
        
        {/* Live Voice Chat Tab */}
        {activeTab === "voice-chat" && (
          <motion.div
            key="voice-chat-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <VoiceConversation />
          </motion.div>
        )}

        {/* High Thinking Tab */}
        {activeTab === "deep-thinking" && (
          <motion.div
            key="deep-thinking-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <ScholarDeepThinking onAddPoints={onAddPoints} />
          </motion.div>
        )}

        {/* Tab 1: Ask a Question Form */}
        {activeTab === "ask" && (
          <motion.div
            key="ask-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {!lastSubmissionResult ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Form column */}
                <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs">
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white mb-2">
                    Submit Your Question
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                    Our verified AI will instantly check authentic sources. If verified, you'll receive your child-friendly answer instantly!
                  </p>

                  <form onSubmit={handleSubmitQuestion} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Name / Nickname</label>
                        <input
                          type="text"
                          required
                          placeholder="Your beautiful name..."
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          id="scholar-form-name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Child's Age (Years)</label>
                        <input
                          type="number"
                          required
                          min="3"
                          max="18"
                          placeholder="Age (e.g., 8)..."
                          value={formAge}
                          onChange={(e) => setFormAge(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          id="scholar-form-age"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Country</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Pakistan, UK, Canada..."
                          value={formCountry}
                          onChange={(e) => setFormCountry(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          id="scholar-form-country"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Language</label>
                        <select
                          value={formLanguage}
                          onChange={(e) => setFormLanguage(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          id="scholar-form-lang"
                        >
                          {LANGUAGES.map(lang => (
                            <option key={lang} value={lang}>{lang}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Category</label>
                        <select
                          value={formCategory}
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          id="scholar-form-category"
                        >
                          {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Parent's Email (Optional)</label>
                        <input
                          type="email"
                          placeholder="parent@example.com..."
                          value={formEmail}
                          onChange={(e) => setFormEmail(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          id="scholar-form-email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Question Title / Summary</label>
                      <input
                        type="text"
                        required
                        placeholder="What is your question about? (e.g. 'Why do we make Wudu?')"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        id="scholar-form-title"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Detailed Question</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Ask your full question here with love and curiosity..."
                        value={formQuestion}
                        onChange={(e) => setFormQuestion(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        id="scholar-form-question"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      id="scholar-form-submit"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          AI is checking authentic sources...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Ask our Scholars & AI
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right guidelines column */}
                <div className="lg:col-span-4 bg-amber-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-amber-200/40 space-y-6">
                  <h3 className="text-md font-extrabold text-amber-800 dark:text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Child Safe Guidelines
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Welcome to the learning platform! Parents and children are encouraged to ask moral or factual questions about Islam. We have some rules:
                  </p>
                  
                  <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                    <li className="flex gap-2 items-start">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span><strong>AI First Verification:</strong> Questions are scanned automatically. Only consensus-based answers in Quran & Sahih Hadith are given instantly.</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span><strong>Verified Scholar Review:</strong> If an answer isn't direct or simple, we route it to qualified scholars immediately. No mock answers are ever generated!</span>
                    </li>
                    <li className="flex gap-2 items-start">
                      <span className="text-amber-500 mt-0.5">●</span>
                      <span><strong>Earn Learning Points:</strong> Submitting a beautiful, respectful question awards your profile **+15 points**! Completing interactive action steps earns **+20 points**!</span>
                    </li>
                  </ul>
                </div>

              </div>
            ) : (
              /* AI Response / Instant Feedback Screen */
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white dark:bg-slate-800 p-6 sm:p-10 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-lg space-y-8"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-slate-700 pb-5">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                      Submission Feedback
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Submitted on {new Date(lastSubmissionResult.question.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setLastSubmissionResult(null)}
                    className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
                  >
                    Ask Another Question
                  </button>
                </div>

                {lastSubmissionResult.aiAnswered && lastSubmissionResult.answer ? (
                  /* Answered instantly */
                  <div className="space-y-6">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          Answered Instantly by verified AI Check!
                        </h4>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Checked and verified against authentic Islamic database resources.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Your Question</span>
                        <h3 className="text-md font-bold text-slate-800 dark:text-white mt-1">{lastSubmissionResult.question.title}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 italic mt-2">"{lastSubmissionResult.question.question}"</p>
                      </div>

                      <div className="p-6 bg-emerald-50/30 dark:bg-slate-900/40 rounded-3xl border border-emerald-500/10 space-y-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest w-fit block">
                          Verified Scholar Answer
                        </span>
                        
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
                          {lastSubmissionResult.answer.answerText}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-500">📖 Quran Citation</span>
                            <p className="text-slate-700 dark:text-slate-300">{lastSubmissionResult.answer.quranReference || "Not direct, general Islamic morals"}</p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-slate-500">📜 Sahih Hadith Citation</span>
                            <p className="text-slate-700 dark:text-slate-300">{lastSubmissionResult.answer.hadithReference || "Aligns with Islamic consensus"}</p>
                          </div>
                        </div>

                        {/* Interactive Key Lesson Card */}
                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 mt-4 space-y-1">
                          <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Award className="w-4 h-4" /> Lesson for your Character
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300">
                            {lastSubmissionResult.answer.keyLesson}
                          </p>
                        </div>

                        {/* Interactive Action Step Box */}
                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 mt-4 flex justify-between items-center gap-4">
                          <div className="space-y-1">
                            <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                              🚀 Let's Try This Action Step!
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {lastSubmissionResult.answer.actionStep}
                            </p>
                          </div>
                          <button
                            onClick={() => handleActionComplete(lastSubmissionResult.answer!.id)}
                            disabled={completedActions.includes(lastSubmissionResult.answer!.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              completedActions.includes(lastSubmissionResult.answer!.id)
                                ? "bg-emerald-500 text-white"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                            }`}
                          >
                            {completedActions.includes(lastSubmissionResult.answer!.id) ? "✓ Completed!" : "Complete & Get +20!"}
                          </button>
                        </div>

                        {/* Cabin recommendations links */}
                        {cabinLinks[lastSubmissionResult.question.category as keyof typeof cabinLinks] && (
                          <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-4 mt-4 border border-slate-200/30">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-2">Related Learning Cabins</span>
                            <button
                              onClick={() => {
                                const cabin = cabinLinks[lastSubmissionResult.question.category as keyof typeof cabinLinks];
                                onNavigateToView(cabin.view);
                              }}
                              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 hover:underline"
                            >
                              {cabinLinks[lastSubmissionResult.question.category as keyof typeof cabinLinks].label} <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* AI Referred to Qualified Scholar */
                  <div className="space-y-6 text-center max-w-xl mx-auto py-6">
                    <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                      Referred to Our Verified Scholars Panel!
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      "Our AI is searching, but we want to make sure your answer is 100% correct. We have referred your question to our verified scholars!"
                    </p>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-left border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400">YOUR QUESTION</span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-white mt-1">{lastSubmissionResult.question.title}</h4>
                      <p className="text-xs text-slate-500 italic mt-1">"{lastSubmissionResult.question.question}"</p>
                    </div>
                    <button
                      onClick={() => setActiveTab("library")}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Visit Public Q&A Library
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Tab 2: Q&A Library */}
        {activeTab === "library" && (
          <motion.div
            key="library-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {/* Library filters and search */}
            <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs flex flex-col md:flex-row gap-4 items-center">
              
              {/* Search */}
              <div className="w-full md:w-1/2 relative flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Search verified Q&A (e.g. Salah, Angels, Kindness)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-0 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-0 focus:outline-hidden text-xs py-1"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-xs font-bold text-slate-400 hover:text-red-500 px-1">Clear</button>
                )}
              </div>

              {/* Category selector */}
              <div className="w-full md:w-1/2 flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 shrink-0 uppercase tracking-widest">Category:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:outline-hidden"
                >
                  <option value="All">All Categories ({questions.length})</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Questions Grid */}
            {loadingQuestions ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading verified Q&A Library...</p>
              </div>
            ) : filteredQuestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {filteredQuestions.map((q) => (
                  <motion.div
                    key={q.id}
                    layout
                    className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-700 overflow-hidden shadow-xs hover:shadow-md transition-shadow"
                  >
                    
                    {/* Header part */}
                    <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/20 flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                            📂 {q.category}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                            💬 {q.language}
                          </span>
                          {q.isVerified && (
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-amber-500" /> Verified Authentic
                            </span>
                          )}
                        </div>
                        <h3 className="text-md sm:text-lg font-extrabold text-slate-800 dark:text-white">
                          {q.title}
                        </h3>
                        <p className="text-xs text-slate-400">
                          Asked by {q.name} (Age {q.childAge}) from {q.country} • {new Date(q.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Interactive Buttons */}
                      <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto">
                        <button
                          onClick={() => handleReadAloud(q.id, q.answer?.answerText || "")}
                          className={`p-2.5 rounded-xl transition-colors cursor-pointer border ${
                            speakingId === q.id 
                              ? "bg-amber-100 dark:bg-amber-950/40 border-amber-300 text-amber-700" 
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                          title="Read Aloud"
                        >
                          {speakingId === q.id ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => toggleBookmark(q.id)}
                          className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                            bookmarkedIds.includes(q.id)
                              ? "bg-pink-100 dark:bg-pink-950/40 border-pink-200 text-pink-600"
                              : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                          title="Bookmark"
                        >
                          <Bookmark className={`w-4 h-4 ${bookmarkedIds.includes(q.id) ? "fill-current" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleShare(q.id)}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handlePrint(q)}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
                          title="Print Answer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question details and Answer rendering */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl text-slate-600 dark:text-slate-300 text-xs italic">
                        "{q.question}"
                      </div>

                      {q.answer && (
                        <div className="space-y-4 pt-2">
                          <p className="text-slate-700 dark:text-slate-200 leading-relaxed text-sm">
                            {q.answer.answerText}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/80 pt-4 text-xs">
                            <div className="space-y-1 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-150/40">
                              <span className="font-extrabold text-slate-500">📖 Quran Citation</span>
                              <p className="text-slate-700 dark:text-slate-300">{q.answer.quranReference || "Verified Islamic principles"}</p>
                            </div>
                            <div className="space-y-1 bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-xl border border-slate-150/40">
                              <span className="font-extrabold text-slate-500">📜 Sahih Hadith Citation</span>
                              <p className="text-slate-700 dark:text-slate-300">{q.answer.hadithReference || "Aligns with established Sunnah"}</p>
                            </div>
                          </div>

                          {/* Key Lesson Card */}
                          <div className="bg-amber-500/5 border border-amber-500/15 rounded-2xl p-4 mt-2 space-y-1">
                            <span className="text-xs font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                              <Award className="w-4 h-4 text-amber-500" /> Wisdom Lesson
                            </span>
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {q.answer.keyLesson}
                            </p>
                          </div>

                          {/* Interactive Action Step Box */}
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 mt-2 flex justify-between items-center gap-4">
                            <div className="space-y-1">
                              <span className="text-xs font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                                🚀 Action Step to try!
                              </span>
                              <p className="text-xs text-slate-600 dark:text-slate-300">
                                {q.answer.actionStep}
                              </p>
                            </div>
                            <button
                              onClick={() => handleActionComplete(q.answer!.id)}
                              disabled={completedActions.includes(q.answer!.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                completedActions.includes(q.answer!.id)
                                  ? "bg-emerald-500 text-white"
                                  : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:scale-105"
                              }`}
                            >
                              {completedActions.includes(q.answer!.id) ? "✓ Done!" : "Complete +20!"}
                            </button>
                          </div>

                          <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="flex items-center gap-1">
                              Verified by: <strong>{q.answer.verifiedBy}</strong>
                            </span>
                            
                            {cabinLinks[q.category as keyof typeof cabinLinks] && (
                              <button
                                onClick={() => {
                                  const cabin = cabinLinks[q.category as keyof typeof cabinLinks];
                                  onNavigateToView(cabin.view);
                                }}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                              >
                                Learn more in {q.category} Cabin →
                              </button>
                            )}
                          </div>

                        </div>
                      )}

                    </div>

                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Answered Questions Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  There are no verified answers in this category yet. Be the first to ask!
                </p>
                <button
                  onClick={() => setActiveTab("ask")}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Submit a Question
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: Verified Scholars */}
        {activeTab === "scholars" && (
          <motion.div
            key="scholars-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            {loadingScholars ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading verified Scholars...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {scholars.map((scholar) => (
                  <div
                    key={scholar.id}
                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row gap-6 items-start"
                  >
                    <img
                      src={scholar.photoUrl}
                      alt={scholar.name}
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 rounded-2xl object-cover shrink-0 border border-slate-200/40 bg-slate-100"
                    />
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                            {scholar.title} {scholar.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-0.5 shadow-2xs">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> verified
                          </span>
                        </div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                          {scholar.credentials}
                        </p>
                      </div>
                      
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {scholar.bio}
                      </p>
                      
                      <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        Verified Partner • Active Review Committee
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 4: Scholar Admin Panel */}
        {activeTab === "admin" && adminToken && (
          <motion.div
            key="admin-tab"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-8"
          >
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs space-y-4">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-500" /> Questions Moderation Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Review submitted questions, approve/reject them, or write custom manual scholar verified responses.
              </p>
            </div>

            {loadingAdmin ? (
              <div className="text-center py-20">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500">Loading admin questions...</p>
              </div>
            ) : adminQuestions.length > 0 ? (
              <div className="space-y-6">
                {adminQuestions.map((q) => (
                  <div
                    key={q.id}
                    className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs space-y-4"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/60">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-slate-800 dark:text-white">{q.title}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                            q.status === "answered" 
                              ? "bg-emerald-500/10 text-emerald-600" 
                              : q.status === "rejected"
                              ? "bg-rose-500/10 text-rose-600"
                              : "bg-amber-500/10 text-amber-600"
                          }`}>
                            {q.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          By {q.name} (Age {q.childAge}) from {q.country} • Email: {q.email || "No email"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {q.status !== "answered" && (
                          <button
                            onClick={() => {
                              setAnsweringQuestion(q);
                              setManualAnswerText(q.answer?.answerText || "");
                              setManualQuranRef(q.answer?.quranReference || "");
                              setManualHadithRef(q.answer?.hadithReference || "");
                              setManualLesson(q.answer?.keyLesson || "");
                              setManualAction(q.answer?.actionStep || "");
                            }}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1"
                          >
                            <Edit className="w-3.5 h-3.5" /> Answer / Approve
                          </button>
                        )}
                        {q.status === "pending" && (
                          <button
                            onClick={() => handleAdminAction(q.id, "status", "rejected")}
                            className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 text-xs font-bold rounded-xl cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleAdminAction(q.id, "delete")}
                          className="p-2 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-600 dark:bg-slate-900 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="text-xs space-y-2">
                      <div className="bg-slate-50 dark:bg-slate-900 p-3.5 rounded-xl">
                        <strong>Question:</strong> "{q.question}"
                      </div>
                      
                      {q.answer && (
                        <div className="bg-emerald-500/5 p-4 rounded-xl space-y-2 border border-emerald-500/10">
                          <strong>Verified Answer:</strong>
                          <p className="italic">"{q.answer.answerText}"</p>
                          <p className="text-[10px] text-slate-400">
                            Quran: {q.answer.quranReference} | Hadith: {q.answer.hadithReference} | Key Lesson: {q.answer.keyLesson} | Action Step: {q.answer.actionStep}
                          </p>
                          <p className="text-[10px] font-bold text-slate-500">Verified by: {q.answer.verifiedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                <Check className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-md font-bold text-slate-800">All caught up!</h3>
                <p className="text-xs text-slate-500 mt-1">No questions pending scholar review.</p>
              </div>
            )}

            {/* Answer Question Dialog Overlay */}
            {answeringQuestion && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xl max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-700">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Answering Question</h3>
                      <p className="text-xs text-slate-400">Asked by {answeringQuestion.name} (Age {answeringQuestion.childAge})</p>
                    </div>
                    <button onClick={() => setAnsweringQuestion(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-900">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-600 dark:text-slate-300 italic">
                    "{answeringQuestion.question}"
                  </div>

                  <form onSubmit={handleManualAnswer} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Choose Verified Scholar</label>
                      <select
                        value={manualScholarId}
                        onChange={(e) => setManualScholarId(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      >
                        {scholars.map(s => (
                          <option key={s.id} value={s.id}>{s.title} {s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Answer Text (Child-friendly language)</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Write a warm, clear and simple explanation..."
                        value={manualAnswerText}
                        onChange={(e) => setManualAnswerText(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Quran Reference</label>
                        <input
                          type="text"
                          placeholder="e.g. Surah Al-Baqarah 2:255"
                          value={manualQuranRef}
                          onChange={(e) => setManualQuranRef(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Hadith Reference (Authentic)</label>
                        <input
                          type="text"
                          placeholder="e.g. Sahih al-Bukhari 123"
                          value={manualHadithRef}
                          onChange={(e) => setManualHadithRef(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Key Character Lesson</label>
                      <input
                        type="text"
                        required
                        placeholder="Moral summary for children..."
                        value={manualLesson}
                        onChange={(e) => setManualLesson(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 dark:text-slate-300">Interactive Action Step</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Say 'Alhamdulillah' three times"
                        value={manualAction}
                        onChange={(e) => setManualAction(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
                    >
                      Publish Verified Answer
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

          </motion.div>
        )}

      </AnimatePresence>

    </div>
  );
}
