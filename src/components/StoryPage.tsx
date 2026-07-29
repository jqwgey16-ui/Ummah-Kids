import { useState, useEffect, useRef, FormEvent } from "react";
import { 
  ArrowLeft, BookOpen, Clock, Heart, Share2, Printer, 
  ChevronRight, ChevronLeft, Bookmark, Sparkles, Check, CheckCircle, ListPlus,
  Type as FontIcon, AlertCircle, Quote,
  Facebook, Twitter, Send, Link, Calendar, Star, MessageSquare,
  Download, Wifi, X
} from "lucide-react";
import { Story } from "../types";
import { Language } from "../lib/translations";
import QuizSection from "./QuizSection";
import { motion, AnimatePresence } from "motion/react";
import { 
  getOfflineStoryIds, 
  saveStoryOffline, 
  deleteOfflineStory
} from "../lib/offlineDb";
import StoryBackgroundAnimation from "./StoryBackgroundAnimation";

interface StoryPageProps {
  story: Story;
  language?: Language;
  onBack: () => void;
  relatedStories: Story[];
  onSelectStory: (story: Story) => void;
  bookmarked: boolean;
  onToggleBookmark: (storyId: string) => void;
  onCompleteQuiz: (storyId: string, score: number) => void;
  onCategoryClick?: (category: string) => void;
  onProphetClick?: (prophet: string) => void;
}

// Decorative Islamic Section Divider Component
function IslamicDivider({ label }: { label?: string }) {
  return (
    <div className="py-8 flex items-center justify-center gap-4 text-emerald-600 dark:text-emerald-400 select-none print:hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-200 dark:via-emerald-800 to-emerald-500/40 flex-1 max-w-xs" />
      <div className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase bg-emerald-50/80 dark:bg-emerald-950/40 px-4 py-1.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/60 shadow-2xs">
        <span>۞</span>
        <span>✦</span>
        {label ? (
          <span className="px-1 text-slate-800 dark:text-slate-200 font-extrabold">{label}</span>
        ) : (
          <span className="text-amber-500">☪</span>
        )}
        <span>✦</span>
        <span>۞</span>
      </div>
      <div className="h-px bg-gradient-to-l from-transparent via-emerald-200 dark:via-emerald-800 to-emerald-500/40 flex-1 max-w-xs" />
    </div>
  );
}

export default function StoryPage({
  story,
  onBack,
  relatedStories,
  onSelectStory,
  bookmarked,
  onToggleBookmark,
  onCompleteQuiz,
  onCategoryClick,
  onProphetClick,
}: StoryPageProps) {
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(() => {
    const saved = localStorage.getItem("islamic_kids_font_size_offset");
    return saved ? parseInt(saved, 10) : 0;
  });
  const [readingMode, setReadingMode] = useState<"bilingual" | "english" | "urdu">("bilingual");
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showCopied, setShowCopied] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  // Offline cache states (story text & images)
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const [isCurrentlyCached, setIsCurrentlyCached] = useState(false);
  const [isCaching, setIsCaching] = useState(false);

  // Reader Feedback & Reviews state
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  // Feedback Form states
  const [feedbackName, setFeedbackName] = useState("");
  const [feedbackEmail, setFeedbackEmail] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch approved feedback
  const fetchApprovedFeedbacks = async () => {
    try {
      setFeedbacksLoading(true);
      const res = await fetch(`/api/feedback/approved?storyId=${story.id}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Error loading approved feedback:", err);
    } finally {
      setFeedbacksLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedFeedbacks();
    setFeedbackName("");
    setFeedbackEmail("");
    setFeedbackRating(5);
    setFeedbackMessage("");
    setSubmitSuccess(false);
    setSubmitError(null);
  }, [story.id]);

  // Persist font size preference
  useEffect(() => {
    localStorage.setItem("islamic_kids_font_size_offset", fontSizeOffset.toString());
  }, [fontSizeOffset]);

  // Check offline status
  useEffect(() => {
    let active = true;
    const checkCache = async () => {
      try {
        const cachedIds = await getOfflineStoryIds();
        if (active) {
          setIsCurrentlyCached(cachedIds.includes(story.id));
        }
      } catch (err) {
        console.warn("[Offline Cache] Error checking cache:", err);
      }
    };

    checkCache();

    const handleCacheUpdate = () => {
      checkCache();
    };

    window.addEventListener("offline-stories-updated", handleCacheUpdate);
    return () => {
      active = false;
      window.removeEventListener("offline-stories-updated", handleCacheUpdate);
    };
  }, [story.id]);

  // Monitor scroll for progress bar
  useEffect(() => {
    const handleScroll = () => {
      if (!pageRef.current) return;
      const totalHeight = pageRef.current.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(Math.min(100, Math.max(0, progress)));
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Save story offline handler
  const handleToggleOfflineCache = async () => {
    try {
      if (isCurrentlyCached) {
        await deleteOfflineStory(story.id);
        setIsCurrentlyCached(false);
        setShowOfflineToast(false);
      } else {
        setIsCaching(true);
        await saveStoryOffline(story);
        setIsCurrentlyCached(true);
        setShowOfflineToast(true);
        window.dispatchEvent(new CustomEvent("offline-stories-updated"));
      }
    } catch (err) {
      console.error("[Offline Cache] Error updating cache:", err);
    } finally {
      setIsCaching(false);
    }
  };

  // Auto dismiss toast
  useEffect(() => {
    if (showOfflineToast) {
      const timer = setTimeout(() => {
        setShowOfflineToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showOfflineToast]);

  const handleFeedbackSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(false);

    if (!feedbackName.trim()) {
      setSubmitError("Please provide your name.");
      return;
    }
    if (!feedbackMessage.trim() || feedbackMessage.trim().length < 5) {
      setSubmitError("Message must be at least 5 characters long.");
      return;
    }

    try {
      setFeedbackSubmitting(true);
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: feedbackName.trim(),
          email: feedbackEmail.trim() || undefined,
          storyId: story.id,
          storyTitle: story.titleEn,
          rating: feedbackRating,
          message: feedbackMessage.trim()
        })
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setFeedbackName("");
        setFeedbackEmail("");
        setFeedbackRating(5);
        setFeedbackMessage("");
        fetchApprovedFeedbacks();
      } else {
        const err = await res.json();
        setSubmitError(err.error || "Failed to submit feedback. Please try again.");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      setSubmitError("Network error. Please try again later.");
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const handleShareOnPlatform = (platform: "whatsapp" | "facebook" | "x" | "telegram" | "copy" | "native") => {
    const url = window.location.href;
    const title = `Check out this beautiful story: "${story.titleEn}" on Ummah Kids!`;
    
    if (platform === "native" && navigator.share) {
      navigator.share({ title: story.titleEn, text: title, url }).catch(err => console.warn("Error sharing:", err));
      return;
    }
    
    if (platform === "whatsapp") {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + url)}`, "_blank");
    } else if (platform === "facebook") {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "x") {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, "_blank");
    } else if (platform === "telegram") {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, "_blank");
    } else if (platform === "copy") {
      navigator.clipboard.writeText(url);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getEnFontStyle = () => {
    const baseSize = 20; // 20px
    return { fontSize: `${baseSize + fontSizeOffset}px`, lineHeight: "1.8" };
  };

  const getUrFontStyle = () => {
    const baseSize = 24; // 24px
    return { fontSize: `${baseSize + fontSizeOffset}px`, lineHeight: "2.2" };
  };

  const handleIncreaseFont = () => setFontSizeOffset(prev => Math.min(20, prev + 2));
  const handleDecreaseFont = () => setFontSizeOffset(prev => Math.max(-10, prev - 2));
  const handleResetFont = () => setFontSizeOffset(0);

  // Compute Next Story and Previous Story relative to current story
  const otherStories = relatedStories.filter(s => s.id !== story.id);
  const prevStory = otherStories.length > 0 ? otherStories[0] : null;
  const nextStory = otherStories.length > 1 ? otherStories[1] : null;

  return (
    <div ref={pageRef} className="pb-24 print:bg-white relative overflow-hidden min-h-screen" id="story-reader-view">
      {/* Category-based Framer Motion Background Animation */}
      <StoryBackgroundAnimation
        category={story.category}
        prophetName={story.prophetName}
        title={story.titleEn}
      />

      {/* SCREEN READ VIEW (HIDDEN IN PRINT) */}
      <div className="print:hidden">
        
        {/* Scroll Progress Bar */}
        <div 
          className="fixed top-0 left-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 z-50 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />

        {/* Back & Reader Controls Sticky Banner */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 py-3.5 px-4 sticky top-14 sm:top-20 z-40 transition-colors shadow-2xs">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-3 items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm transition-all cursor-pointer active:scale-95 shrink-0 self-start sm:self-center"
              id="reader-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Stories</span>
            </button>

            {/* Reader Controls */}
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
              
              {/* Language Toggle */}
              <div className="bg-slate-100 dark:bg-slate-800/80 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700 flex text-xs font-bold shadow-2xs">
                <button
                  onClick={() => setReadingMode("bilingual")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    readingMode === "bilingual"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  }`}
                >
                  Bilingual • دونوں
                </button>
                <button
                  onClick={() => setReadingMode("english")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    readingMode === "english"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => setReadingMode("urdu")}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    readingMode === "urdu"
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  }`}
                >
                  اردو
                </button>
              </div>

              {/* Text Size Controls */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700 p-1 shadow-2xs" id="story-font-size-toggle">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1.5 pr-0.5 select-none flex items-center gap-1">
                  <FontIcon className="w-3.5 h-3.5 text-emerald-500" /> Size
                </span>
                <button
                  onClick={handleDecreaseFont}
                  className="px-2 py-1 text-xs font-black rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                  title="Decrease font size"
                >
                  A-
                </button>
                <button
                  onClick={handleResetFont}
                  className={`px-2 py-1 text-[10px] font-bold rounded-lg cursor-pointer transition-all ${
                    fontSizeOffset === 0
                      ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-700"
                  }`}
                  title="Reset font size"
                >
                  Reset
                </button>
                <button
                  onClick={handleIncreaseFont}
                  className="px-2 py-1 text-xs font-black rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                  title="Increase font size"
                >
                  A+
                </button>
              </div>

              {/* Action Buttons: Bookmark, Save Offline, Print, Share */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onToggleBookmark(story.id)}
                  className={`min-h-[40px] min-w-[40px] p-2 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                    bookmarked
                      ? "bg-pink-50 border-pink-200 text-pink-600 dark:bg-pink-950/40 dark:border-pink-800"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                  title={bookmarked ? "Bookmarked" : "Add to Bookmarks"}
                  id="story-bookmark-btn"
                >
                  <Bookmark className={`w-4 h-4 ${bookmarked ? "fill-current text-pink-500" : ""}`} />
                </button>

                <button
                  onClick={handleToggleOfflineCache}
                  disabled={isCaching}
                  className={`min-h-[40px] px-3 py-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                    isCurrentlyCached
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                  title={isCurrentlyCached ? "Story saved offline" : "Save story offline"}
                  id="story-offline-cache-btn"
                >
                  {isCurrentlyCached ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="hidden sm:inline">Saved Offline</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Save Offline</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handlePrint}
                  className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center cursor-pointer"
                  title="Print story / Save PDF"
                  id="story-print-btn"
                >
                  <Printer className="w-4 h-4" />
                </button>

                {/* Share Button & Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowShareDropdown(!showShareDropdown)}
                    className="min-h-[40px] min-w-[40px] p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-1 cursor-pointer"
                    title="Share story"
                    id="story-share-btn"
                  >
                    <Share2 className="w-4 h-4" />
                    {showCopied && <span className="text-[10px] text-emerald-600 font-bold px-1 animate-fade-in">Copied!</span>}
                  </button>

                  <AnimatePresence>
                    {showShareDropdown && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowShareDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 z-50 overflow-hidden"
                        >
                          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 p-2 border-b border-slate-100 dark:border-slate-700/60 mb-1 select-none">
                            Share Story • شیئر کریں
                          </div>
                          {typeof navigator !== "undefined" && navigator.share && (
                            <button
                              onClick={() => {
                                handleShareOnPlatform("native");
                                setShowShareDropdown(false);
                              }}
                              className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              📱 System Share
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleShareOnPlatform("whatsapp");
                              setShowShareDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            🟢 WhatsApp
                          </button>
                          <button
                            onClick={() => {
                              handleShareOnPlatform("facebook");
                              setShowShareDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            🔵 Facebook
                          </button>
                          <button
                            onClick={() => {
                              handleShareOnPlatform("x");
                              setShowShareDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            ⚫ X (Twitter)
                          </button>
                          <button
                            onClick={() => {
                              handleShareOnPlatform("telegram");
                              setShowShareDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            ✈️ Telegram
                          </button>
                          <button
                            onClick={() => {
                              handleShareOnPlatform("copy");
                              setShowShareDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-slate-700/60 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-700/60 mt-1 pt-1.5"
                          >
                            🔗 Copy Story Link
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Main Reader Container */}
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700 overflow-hidden shadow-sm p-6 sm:p-10 space-y-8">
            
            {/* Breadcrumb Trail */}
            <nav className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 select-none pb-4" aria-label="Breadcrumb">
              <button 
                onClick={onBack}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                Home
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button 
                onClick={() => {
                  if (onCategoryClick) onCategoryClick(story.category);
                  else onBack();
                }}
                className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
              >
                {story.category}
              </button>
              {story.prophetName && story.prophetName.trim() !== "" && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <button 
                    onClick={() => {
                      if (onProphetClick) onProphetClick(story.prophetName!);
                      else onBack();
                    }}
                    className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                  >
                    {story.prophetName}
                  </button>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-200 truncate max-w-[180px] sm:max-w-[320px]">
                {story.titleEn}
              </span>
            </nav>

            {/* Title & Metadata Header */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-white shadow-2xs">
                  {story.category}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500 text-white flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{story.readingTime || "4"} min read</span>
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  Kids {story.ageGroup} Years
                </span>
                {story.authenticityStatus && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    ✓ {story.authenticityStatus}
                  </span>
                )}
              </div>

              <div className="border-b border-slate-100 dark:border-slate-700 pb-6">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  {story.titleEn}
                </h1>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-urdu font-extrabold text-right text-emerald-700 dark:text-emerald-400 mt-4 leading-[2.2]" dir="rtl">
                  {story.titleUr}
                </h2>

                {/* Published & Last Updated */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-4 pt-4 border-t border-slate-100/80 dark:border-slate-700/80">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    Published: <span className="text-slate-700 dark:text-slate-300">{new Date(story.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700 hidden sm:inline" />
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Last Updated: <span className="text-slate-700 dark:text-slate-300">{new Date(story.updatedAt || story.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Cover Image */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-700 shadow-inner">
              <img 
                src={story.coverImage} 
                alt={story.titleEn} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <IslamicDivider label="Story Content • کہانی" />

            {/* Story Text Content (Bilingual / English / Urdu) */}
            <div className="space-y-8">
              {readingMode === "bilingual" && (
                <div className="space-y-8" id="reading-bilingual">
                  {story.contentEn.split("\n\n").map((paraEn, idx) => {
                    const parasUr = story.contentUr.split("\n\n");
                    const paraUr = parasUr[idx] || "";
                    
                    return (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-dashed border-slate-150 dark:border-slate-700/60 pb-8 last:border-0 last:pb-0">
                        {/* English side */}
                        <div 
                          style={getEnFontStyle()}
                          className="text-slate-800 dark:text-slate-100 font-sans leading-relaxed p-2 rounded-xl"
                        >
                          {paraEn.startsWith("**") ? (
                            <div className="font-extrabold text-emerald-800 dark:text-emerald-400 py-1" style={{ fontSize: "1.1em" }}>
                              {paraEn.replace(/\*\*/g, "")}
                            </div>
                          ) : (
                            <p>{paraEn}</p>
                          )}
                        </div>

                        {/* Urdu side */}
                        <div 
                          style={getUrFontStyle()}
                          className="text-slate-800 dark:text-slate-100 font-urdu text-right leading-[2.2] select-text p-2 rounded-xl"
                          dir="rtl"
                        >
                          <p>{paraUr}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {readingMode === "english" && (
                <div className="text-slate-800 dark:text-slate-100 space-y-8 leading-relaxed font-sans" id="reading-english">
                  {story.contentEn.split("\n\n").map((para, idx) => (
                    <div 
                      key={idx}
                      style={getEnFontStyle()}
                      className="p-3 bg-slate-50/50 dark:bg-slate-850/40 rounded-2xl border border-slate-100/80 dark:border-slate-800"
                    >
                      {para.startsWith("**") ? (
                        <div className="font-extrabold text-emerald-800 dark:text-emerald-400 py-1" style={{ fontSize: "1.1em" }}>
                          {para.replace(/\*\*/g, "")}
                        </div>
                      ) : (
                        <p>{para}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {readingMode === "urdu" && (
                <div className="text-slate-800 dark:text-slate-100 space-y-8 font-urdu text-right leading-[2.2] select-text" id="reading-urdu" dir="rtl">
                  {story.contentUr.split("\n\n").map((para, idx) => (
                    <div 
                      key={idx}
                      style={getUrFontStyle()}
                      className="p-4 bg-slate-50/50 dark:bg-slate-850/40 rounded-2xl border border-slate-100/80 dark:border-slate-800"
                    >
                      <p>{para}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <IslamicDivider label="Moral Lessons • اخلاقی سبق" />

            {/* Moral Lessons Section */}
            <div className="bg-gradient-to-br from-emerald-50/60 to-teal-50/30 dark:from-slate-800/80 dark:to-slate-850/60 rounded-3xl p-6 sm:p-8 border border-emerald-100 dark:border-slate-700/80 shadow-2xs space-y-6" id="story-lessons">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* English Lessons */}
                <div className="space-y-4">
                  <h3 className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <Quote className="w-5 h-5 text-amber-500" />
                    Moral Lessons to Remember:
                  </h3>
                  <ul className="space-y-3">
                    {story.lessonsEn.map((lesson, idx) => (
                      <li key={idx} className="flex gap-3 items-start text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                        <span>{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Urdu Lessons */}
                <div className="space-y-4 text-right" dir="rtl">
                  <h3 className="text-base font-extrabold text-emerald-800 dark:text-emerald-300 flex items-center gap-2 justify-end font-urdu">
                    کہانی کا اہم اخلاقی سبق
                    <Quote className="w-5 h-5 text-amber-500 rotate-180" />
                  </h3>
                  <ul className="space-y-3">
                    {story.lessonsUr.map((lesson, idx) => (
                      <li key={idx} className="flex gap-3 items-start text-base font-urdu text-slate-800 dark:text-slate-200 leading-[2.0]">
                        <CheckCircle className="w-5 h-5 text-emerald-500 mt-1 shrink-0" />
                        <span className="flex-1">{lesson}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Authentic Islamic References Section */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200/70 dark:border-slate-700/80 space-y-4" id="story-references">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-emerald-600" />
                  Authentic Islamic References (Quran & Hadith)
                </h4>
                <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto">
                  ✓ Verified Authentic Source
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {story.references.map((ref, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-700 flex gap-3 items-center shadow-2xs">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase shrink-0">
                      {ref.type ? ref.type[0] : 'R'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                        {ref.source}
                      </h5>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        Citation: <span className="font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{ref.referenceKey}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Seerah books */}
              {story.authenticSources && story.authenticSources.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-slate-800">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                    Authentic Seerah & History Books
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {story.authenticSources.map((src, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-200/50 dark:border-emerald-900">
                        📖 {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Parent & Teacher Discussion Guide */}
            {((story.parentTeacherNoteEn && story.parentTeacherNoteEn.trim() !== "") || (story.parentTeacherNoteUr && story.parentTeacherNoteUr.trim() !== "")) && (
              <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
                  <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Parent & Teacher Discussion Guide</h4>
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Tips to talk about this story and its lessons with children</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {story.parentTeacherNoteEn && story.parentTeacherNoteEn.trim() !== "" && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider">English Discussion Guide</span>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">
                        "{story.parentTeacherNoteEn}"
                      </p>
                    </div>
                  )}
                  {story.parentTeacherNoteUr && story.parentTeacherNoteUr.trim() !== "" && (
                    <div className="space-y-1 text-right" dir="rtl">
                      <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-400 uppercase tracking-wider font-urdu">والدین اور اساتذہ کے لیے رہنمائی</span>
                      <p className="text-sm font-urdu text-slate-700 dark:text-slate-300 leading-[2.0] italic">
                        "{story.parentTeacherNoteUr}"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <IslamicDivider label="Quiz & Knowledge Check • سوال و جواب" />

            {/* Interactive Quiz Frame */}
            <div className="pt-2 print:hidden">
              <QuizSection 
                quiz={story.quiz} 
                onComplete={(score) => onCompleteQuiz(story.id, score)} 
              />
            </div>

            {/* Previous Story & Next Story Navigation Cards */}
            <div className="pt-8 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden" id="prev-next-story-nav">
              {prevStory ? (
                <button
                  onClick={() => {
                    onSelectStory(prevStory);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group flex items-center gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/80 hover:border-emerald-300 dark:border-slate-700/80 transition-all cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                    <ChevronLeft className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      ← Previous Story
                    </span>
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {prevStory.titleEn}
                    </h5>
                  </div>
                </button>
              ) : <div />}

              {nextStory && (
                <button
                  onClick={() => {
                    onSelectStory(nextStory);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="group flex items-center justify-end gap-3.5 p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/80 hover:border-emerald-300 dark:border-slate-700/80 transition-all cursor-pointer text-right shadow-2xs"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                      Next Story →
                    </span>
                    <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors">
                      {nextStory.titleEn}
                    </h5>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-2xs">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              )}
            </div>

          </div>
        </article>

        {/* Share Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 print:hidden" id="modern-share-section">
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-amber-500/10 dark:from-slate-800/80 dark:to-slate-800/40 border border-emerald-500/20 dark:border-slate-700 rounded-3xl p-6 sm:p-8 text-center space-y-6 relative overflow-hidden shadow-2xs">
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center justify-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-500" />
                Share this story • شیئر کریں
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Inspire your family, friends, and little ones by sharing the wisdom and moral of this authentic story!
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 max-w-3xl mx-auto">
              {/* WhatsApp */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShareOnPlatform("whatsapp")}
                className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group"
              >
                <span className="text-2xl mb-1">🟢</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">WhatsApp</span>
              </motion.button>

              {/* Facebook */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShareOnPlatform("facebook")}
                className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group"
              >
                <Facebook className="w-6 h-6 text-blue-600 fill-current mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Facebook</span>
              </motion.button>

              {/* X */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShareOnPlatform("x")}
                className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group"
              >
                <Twitter className="w-6 h-6 text-slate-800 dark:text-slate-200 fill-current mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">X (Twitter)</span>
              </motion.button>

              {/* Telegram */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShareOnPlatform("telegram")}
                className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group"
              >
                <Send className="w-6 h-6 text-sky-500 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Telegram</span>
              </motion.button>

              {/* Copy Link */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleShareOnPlatform("copy")}
                className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group"
              >
                <Link className="w-6 h-6 text-amber-500 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {showCopied ? "Copied!" : "Copy Link"}
                </span>
              </motion.button>

              {/* Native System Share */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                disabled={!(typeof navigator !== "undefined" && navigator.share)}
                onClick={() => handleShareOnPlatform("native")}
                className="flex flex-col items-center justify-center p-3.5 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700/50 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer group"
              >
                <Share2 className="w-6 h-6 text-purple-600 mb-1" />
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Share</span>
              </motion.button>
            </div>
          </div>
        </section>

        {/* Related Stories */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 print:hidden">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <ListPlus className="w-5 h-5 text-emerald-600" />
            More Beautiful Stories
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {relatedStories.map((relStory) => (
              <div 
                key={relStory.id}
                onClick={() => {
                  onSelectStory(relStory);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 p-4 flex gap-4 cursor-pointer hover:border-emerald-400 dark:hover:border-slate-600 transition-all hover:shadow-xs group"
              >
                <div className="w-24 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  <img 
                    src={relStory.coverImage} 
                    alt={relStory.titleEn} 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    {relStory.category}
                  </span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-emerald-600 transition-colors">
                    {relStory.titleEn}
                  </h4>
                  <p className="text-xs font-urdu text-right text-slate-500 dark:text-slate-400 mt-1 truncate" dir="rtl">
                    {relStory.titleUr}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 font-bold">
                    <Clock className="w-3 h-3 text-amber-500" />
                    <span>{relStory.readingTime || "4"} min read</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Reader Reviews & Feedback System */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 print:hidden border-t border-slate-200/80 dark:border-slate-800 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Approved Reviews List */}
            <div className="space-y-6">
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                Reader Reviews & Feedback
              </h3>

              {feedbacksLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <span className="text-xs font-bold">Loading reviews...</span>
                </div>
              ) : feedbacks.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-900/30 rounded-3xl border border-slate-200/60 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 leading-relaxed">
                    No reviews yet for this story. Be the first to share your feedback or a kid's moral lesson!
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin">
                  {feedbacks.map((fb) => (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={fb.id} 
                      className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/60 dark:border-slate-700/80 shadow-2xs"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center justify-center text-xs">
                            {fb.name[0].toUpperCase()}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{fb.name}</span>
                            <span className="text-[10px] text-slate-400">{new Date(fb.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                          </div>
                        </div>

                        <div className="flex gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < fb.rating ? "fill-amber-400" : "text-slate-200 dark:text-slate-700"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{fb.message}</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Feedback Form Card */}
            <div className="bg-slate-50 dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-2xs h-fit">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                Share Your Feedback!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                We would love to hear how your kids liked this story!
              </p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                {submitSuccess && (
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-900">
                    ✓ Thank you! Your review has been submitted and is pending administrator review.
                  </div>
                )}

                {submitError && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Your Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={feedbackName}
                      onChange={(e) => setFeedbackName(e.target.value)}
                      placeholder="e.g. Brother Ahmed"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                      Email <span className="text-[9px] text-slate-400">(Optional)</span>
                    </label>
                    <input
                      type="email"
                      value={feedbackEmail}
                      onChange={(e) => setFeedbackEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Your Rating *
                  </label>
                  <div className="flex gap-1 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setFeedbackRating(star)}
                        className="p-1 text-amber-400 hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= feedbackRating ? "fill-amber-400" : "text-slate-300 dark:text-slate-700"}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Your Review Message *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what your kids learned or liked about this story!"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={feedbackSubmitting}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Review</span>
                </button>
              </form>
            </div>
          </div>
        </section>

      </div> {/* End print:hidden */}

      {/* PRINT-ONLY BOOKLET LAYOUT */}
      <div className="hidden print:block text-slate-900 bg-white p-6 space-y-8" id="printable-booklet" style={{ color: '#000000', backgroundColor: '#ffffff' }}>
        <div className="text-center border-b-2 border-emerald-600 pb-4 mb-6">
          <div className="flex items-center justify-center gap-2 text-emerald-800 font-extrabold tracking-wider uppercase text-xs">
            <span>✨ Ummah Kids • by Inaamullah ✨</span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">
            Printed on {new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="text-center space-y-4 py-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider">
            {story.category}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
            {story.titleEn}
          </h1>
          <h1 className="text-4xl font-urdu font-bold text-emerald-800 mt-2 leading-[2.0]" dir="rtl">
            {story.titleUr}
          </h1>
        </div>

        <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
          <img src={story.coverImage} alt={story.titleEn} className="w-full h-full object-cover" />
        </div>

        <div className="space-y-6 pt-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2">
            📖 The Story • کہانی
          </h3>
          <div className="space-y-6">
            {(story.contentEn || "").split("\n\n").map((paraEn, idx) => {
              const parasUr = (story.contentUr || "").split("\n\n");
              const paraUr = parasUr[idx] || "";
              return (
                <div key={idx} className="space-y-3 pb-6 border-b border-dashed border-slate-150 last:border-0 last:pb-0 break-inside-avoid">
                  <div className="text-sm text-slate-800 leading-relaxed font-sans text-justify">
                    {paraEn}
                  </div>
                  <div className="text-base font-urdu text-right text-slate-900 leading-loose" dir="rtl">
                    {paraUr}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-slate-200 break-inside-avoid">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-800 border-b border-emerald-100 pb-2 mb-4">
            🌟 Moral Lessons • اخلاقی سبق
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">English</h4>
              <ul className="space-y-1.5">
                {(story.lessonsEn || []).map((lesson, idx) => (
                  <li key={idx} className="text-xs text-slate-700">✓ {lesson}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2 text-right" dir="rtl">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">اردو</h4>
              <ul className="space-y-1.5">
                {(story.lessonsUr || []).map((lesson, idx) => (
                  <li key={idx} className="text-sm font-urdu text-slate-800">✓ {lesson}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Offline Toast */}
      <AnimatePresence>
        {showOfflineToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-800 p-4 flex items-start gap-3 text-left overflow-hidden"
            id="offline-cache-success-toast"
          >
            <div className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 p-2 rounded-xl shrink-0">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 space-y-1">
              <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Saved Offline
              </h5>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                "{story.titleEn}" is saved offline. You can read it anytime without an internet connection!
              </p>
            </div>
            <button
              onClick={() => setShowOfflineToast(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
