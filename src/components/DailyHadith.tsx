import { useEffect, useState } from "react";
import {
  MessageSquareQuote,
  Shuffle,
  Volume2,
  VolumeX,
  Bookmark,
  Check,
  Copy,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { HadithItem } from "../data/hadithData";

interface DailyHadithProps {
  onNavigateToHadiths?: () => void;
  className?: string;
}

export default function DailyHadith({ onNavigateToHadiths, className = "" }: DailyHadithProps) {
  const [hadith, setHadith] = useState<HadithItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isRandomPick, setIsRandomPick] = useState(false);

  // Load Hadith from DB
  const fetchHadith = async (random: boolean = false) => {
    setLoading(true);
    setIsSpinning(true);
    try {
      const url = random ? "/api/daily-hadith?random=true" : "/api/daily-hadith";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.hadith) {
        setHadith(data.hadith);
        setTotalCount(data.totalCount || 10);
        setIsRandomPick(data.isRandom || random);
        
        // Check local storage bookmarks
        try {
          const saved = localStorage.getItem("bookmarked_hadiths");
          if (saved) {
            const ids: string[] = JSON.parse(saved);
            setIsBookmarked(ids.includes(data.hadith.id));
          } else {
            setIsBookmarked(false);
          }
        } catch (e) {
          setIsBookmarked(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch daily hadith from database:", err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsSpinning(false), 500);
    }
  };

  useEffect(() => {
    fetchHadith(false);
  }, []);

  const handleShuffle = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    fetchHadith(true);
  };

  const handleCopy = () => {
    if (!hadith) return;
    const textToCopy = `🌸 Hadith of the Day • حدیثِ رسول ﷺ\n\n` +
      ` Arabic: ${hadith.arabicText}\n\n` +
      ` English: ${hadith.translationEn}\n\n` +
      ` Urdu: ${hadith.translationUr}\n\n` +
      ` Reference: ${hadith.sourceEn}\n` +
      `⭐ Lesson: ${hadith.moralLessonEn}\n\n` +
      `Learn more at Ummah Kids!`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleBookmark = () => {
    if (!hadith) return;
    try {
      const saved = localStorage.getItem("bookmarked_hadiths");
      let ids: string[] = saved ? JSON.parse(saved) : [];
      if (ids.includes(hadith.id)) {
        ids = ids.filter((i) => i !== hadith.id);
        setIsBookmarked(false);
      } else {
        ids.push(hadith.id);
        setIsBookmarked(true);
      }
      localStorage.setItem("bookmarked_hadiths", JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSpeech = () => {
    if (!hadith || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${hadith.titleEn}. ${hadith.translationEn}. Moral lesson: ${hadith.moralLessonEn}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div id="daily-hadith-component" className={`w-full ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative bg-white dark:bg-slate-900 text-slate-800 dark:text-white rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl border border-slate-200 dark:border-emerald-500/20 transition-colors duration-300"
      >
        {/* Background Decorative Motif */}
        <div className="absolute right-0 top-0 -translate-y-8 translate-x-8 opacity-5 dark:opacity-10 font-bold select-none text-9xl font-urdu text-amber-500 dark:text-amber-300 pointer-events-none">
          حديث
        </div>
        <div className="absolute left-0 bottom-0 translate-y-12 -translate-x-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-200 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center text-slate-950 font-bold text-lg shadow-md shrink-0">
              {hadith?.iconEmoji || "🌸"}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-widest flex items-center gap-1">
                  <MessageSquareQuote className="w-4 h-4 text-amber-500" />
                  Daily Hadith • حدیثِ دن
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-400/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Sahih Authentic Database
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-300 font-medium mt-0.5">
                {isRandomPick ? "Randomly Selected Hadith" : `Hadith of the Day • ${formattedDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Random Pick Shuffle Button */}
            <button
              onClick={handleShuffle}
              disabled={loading}
              title="Pick a random authentic Hadith from database"
              id="shuffle-daily-hadith-btn"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-slate-950 dark:bg-white/10 dark:hover:bg-amber-500 dark:hover:text-slate-950 text-slate-800 dark:text-amber-300 border border-slate-200 dark:border-white/15 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Shuffle className={`w-3.5 h-3.5 ${isSpinning ? "animate-spin" : ""}`} />
              <span>Random Hadith</span>
            </button>

            {onNavigateToHadiths && (
              <button
                onClick={onNavigateToHadiths}
                id="view-all-hadiths-btn"
                className="px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/30 hover:bg-emerald-600 text-emerald-800 dark:text-emerald-200 hover:text-white border border-emerald-300 dark:border-emerald-400/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>All ({totalCount || 10})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-emerald-700 dark:text-emerald-200 font-medium">Fetching authentic Hadith from database...</p>
            </motion.div>
          ) : hadith ? (
            <motion.div
              key={hadith.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="relative z-10 pt-6 space-y-6"
            >
              {/* Category & Title */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-400/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-400/20">
                  {hadith.titleEn}
                </span>
                <span className="text-sm font-urdu font-extrabold text-amber-700 dark:text-amber-300">
                  {hadith.titleUr}
                </span>
              </div>

              {/* Arabic Text Card */}
              <div className="bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-center space-y-3 shadow-inner">
                <p className="text-2xl sm:text-3xl font-urdu font-bold text-slate-900 dark:text-emerald-100 leading-[2.4] select-text">
                  {hadith.arabicText}
                </p>
                {hadith.transliteration && (
                  <p className="text-xs text-slate-600 dark:text-emerald-300/80 italic font-sans tracking-wide">
                    "{hadith.transliteration}"
                  </p>
                )}
              </div>

              {/* Translations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English Translation */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    English Translation
                  </div>
                  <p className="text-sm sm:text-base text-slate-800 dark:text-slate-100 font-medium leading-relaxed select-text">
                    "{hadith.translationEn}"
                  </p>
                </div>

                {/* Urdu Translation */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 sm:p-5 space-y-2 text-right">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center justify-end gap-1 dir-rtl">
                    اردو ترجمہ
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-lg sm:text-xl font-urdu font-medium text-slate-800 dark:text-slate-100 leading-relaxed select-text">
                    "{hadith.translationUr}"
                  </p>
                </div>
              </div>

              {/* Moral Lesson & Practical Example */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Moral Lesson */}
                <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-400/20 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    ⭐ Key Lesson for Kids
                  </div>
                  <p className="text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-medium">
                    {hadith.moralLessonEn}
                  </p>
                  {hadith.moralLessonUr && (
                    <p className="text-sm font-urdu text-amber-900 dark:text-amber-200/90 text-right mt-1">
                      {hadith.moralLessonUr}
                    </p>
                  )}
                </div>

                {/* Practical Example */}
                <div className="bg-teal-50 dark:bg-teal-500/10 border border-teal-200 dark:border-teal-400/20 rounded-2xl p-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800 dark:text-teal-300">
                    <Lightbulb className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    💡 How to Practice Today
                  </div>
                  <p className="text-xs text-teal-950 dark:text-teal-100 leading-relaxed font-medium">
                    {hadith.practicalExampleEn}
                  </p>
                  {hadith.practicalExampleUr && (
                    <p className="text-sm font-urdu text-teal-900 dark:text-teal-200/90 text-right mt-1">
                      {hadith.practicalExampleUr}
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Info Bar & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-white/10 text-xs">
                {/* Reference Source */}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="font-bold text-amber-700 dark:text-amber-400">Reference:</span>
                  <span className="font-mono bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-[11px] text-slate-800 dark:text-slate-200">
                    {hadith.sourceEn}
                  </span>
                </div>

                {/* Interactive Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Listen Audio */}
                  {"speechSynthesis" in window && (
                    <button
                      onClick={handleSpeech}
                      id="listen-daily-hadith-btn"
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSpeaking
                          ? "bg-amber-500 text-slate-950 border-amber-400 animate-pulse"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-white dark:border-white/15"
                      }`}
                    >
                      {isSpeaking ? (
                        <>
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Listen</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Bookmark Button */}
                  <button
                    onClick={handleToggleBookmark}
                    id="bookmark-daily-hadith-btn"
                    title={isBookmarked ? "Remove Bookmark" : "Bookmark Hadith"}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isBookmarked
                        ? "bg-amber-500 text-slate-950 border-amber-400"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:border-white/15"
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
                  </button>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopy}
                    id="copy-daily-hadith-btn"
                    title="Copy Hadith Text"
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-white/10 dark:hover:bg-white/20 dark:text-slate-300 dark:border-white/15 transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm">
              Unable to load daily Hadith. Please check back shortly.
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
