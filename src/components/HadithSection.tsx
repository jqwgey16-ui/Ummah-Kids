import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Heart, CheckCircle2, ShieldCheck, 
  HelpCircle, Award, Sparkles, BookOpen, Star, Lightbulb, UserCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KidProfile } from "../types";
import { HADITH_ITEMS, HadithItem } from "../data/hadithData";

import { Language, getTranslation } from "../lib/translations";

interface HadithSectionProps {
  activeProfile: KidProfile | null;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  language?: Language;
}

export default function HadithSection({ activeProfile, onAddPoints, onNavigateHome, language = "en" }: HadithSectionProps) {
  const [hadithsList, setHadithsList] = useState<HadithItem[]>(HADITH_ITEMS);

  useEffect(() => {
    fetch("/api/hadiths")
      .then((res) => res.json())
      .then((data) => {
        const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.hadiths) ? data.hadiths : []);
        if (rawList.length > 0) {
          const mapped: HadithItem[] = rawList.map((item: any) => ({
            id: item.id,
            titleEn: item.titleEn,
            titleUr: item.titleUr || "",
            category: item.category || "manners",
            categoryLabelEn: item.categoryLabelEn || item.category || "Good Manners",
            categoryLabelUr: item.categoryLabelUr || "حسنِ اخلاق",
            arabicText: item.arabicText,
            transliteration: item.transliteration || "",
            translationEn: item.translationEn,
            translationUr: item.translationUr || "",
            sourceEn: item.book ? `${item.book}${item.hadithNumber ? " #" + item.hadithNumber : ""}` : (item.sourceEn || "Sahih Collection"),
            sourceUr: item.sourceUr || "",
            moralLessonEn: item.moralLessonEn || item.explanationEn || "",
            moralLessonUr: item.moralLessonUr || item.explanationUr || "",
            practicalExampleEn: item.practicalExampleEn || "",
            practicalExampleUr: item.practicalExampleUr || "",
            quiz: item.quiz || {
              question: "What lesson do we learn from this Hadith?",
              options: [
                "Always act with good manners and sincerity",
                "Only practice in private",
                "It has no practical importance"
              ],
              answerIdx: 0,
              explanationEn: "Acting with sincerity and good character is beloved to Allah!",
              explanationUr: "اخلاص اور اچھے اخلاق کے ساتھ عمل کرنا اللہ کو پسند ہے۔"
            },
            iconEmoji: item.iconEmoji || "📚"
          }));
          setHadithsList(mapped);
        }
      })
      .catch((err) => {
        console.warn("Using fallback static Hadith items:", err);
      });
  }, []);

  // Active Quiz Modal state
  const [activeQuizHadithId, setActiveQuizHadithId] = useState<string | null>(null);
  const [selectedAnswerIdx, setSelectedAnswerIdx] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Category & Search state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Favorites & Learned State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("hadith_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const [learnedHadiths, setLearnedHadiths] = useState<string[]>(() => {
    const saved = localStorage.getItem("hadiths_learned");
    return saved ? JSON.parse(saved) : [];
  });

  const [quizScores, setQuizScores] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("hadith_quiz_scores");
    return saved ? JSON.parse(saved) : {};
  });

  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(f => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("hadith_favorites", JSON.stringify(updated));
  };

  const toggleLearned = (id: string) => {
    let updated: string[];
    if (learnedHadiths.includes(id)) {
      updated = learnedHadiths.filter(l => l !== id);
    } else {
      updated = [...learnedHadiths, id];
      onAddPoints(15); // Award 15 points for learning a Hadith
    }
    setLearnedHadiths(updated);
    localStorage.setItem("hadiths_learned", JSON.stringify(updated));
  };

  const handleOpenQuiz = (hadithId: string) => {
    setActiveQuizHadithId(hadithId);
    setSelectedAnswerIdx(null);
    setQuizSubmitted(false);
  };

  const handleSubmitQuiz = (correctIdx: number) => {
    if (selectedAnswerIdx === null) return;
    setQuizSubmitted(true);
    if (selectedAnswerIdx === correctIdx && activeQuizHadithId) {
      const updatedScores = { ...quizScores, [activeQuizHadithId]: 100 };
      setQuizScores(updatedScores);
      localStorage.setItem("hadith_quiz_scores", JSON.stringify(updatedScores));
      onAddPoints(15); // Award 15 points for correct quiz answer
    }
  };

  // Filter Ahadith
  const filteredHadiths = hadithsList.filter(hadith => {
    const matchesCategory = activeCategory === "all" || 
      (activeCategory === "favorites" && favorites.includes(hadith.id)) ||
      hadith.category === activeCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      hadith.titleEn.toLowerCase().includes(query) ||
      hadith.titleUr.includes(query) ||
      hadith.arabicText.includes(query) ||
      hadith.translationEn.toLowerCase().includes(query) ||
      hadith.translationUr.includes(query) ||
      hadith.sourceEn.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  const activeHadithForQuiz = hadithsList.find(h => h.id === activeQuizHadithId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-slate-50 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/30 text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-8 pb-24 transition-colors duration-300">
      
      {/* Top Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onNavigateHome}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800">
                Prophetic Guidance 📖
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Authentic Sahih Sources
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              Kids Hadith & Morals
            </h1>
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="max-w-5xl mx-auto mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { id: "all", label: "All Ahadith", emoji: "📚" },
            { id: "manners", label: "Good Manners", emoji: "😊" },
            { id: "kindness", label: "Kindness", emoji: "🌸" },
            { id: "cleanliness", label: "Cleanliness", emoji: "🧼" },
            { id: "truth", label: "Truthfulness", emoji: "🌟" },
            { id: "quran", label: "Quran & Faith", emoji: "📖" },
            { id: "character", label: "Good Character", emoji: "🤝" },
            { id: "favorites", label: `Favorites (${favorites.length})`, emoji: "❤️" },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105"
                  : "bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Hadith List Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHadiths.map(hadith => {
          const isFav = favorites.includes(hadith.id);
          const isLearned = learnedHadiths.includes(hadith.id);
          const hasPassedQuiz = quizScores[hadith.id] === 100;

          return (
            <motion.div
              key={hadith.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-lg shadow-indigo-950/5 hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between"
            >
              {/* Top Accent Gradient Line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-400 to-emerald-400" />

              <div>
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-400 to-emerald-400 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
                      {hadith.iconEmoji || "📚"}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {hadith.categoryLabelEn}
                      </span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                        {hadith.titleEn}
                      </h3>
                      <p className="font-urdu text-base font-bold text-emerald-600 dark:text-emerald-400 dir-rtl">
                        {hadith.titleUr}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleFavorite(hadith.id)}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isFav
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-500"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      }`}
                      title="Favorite"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    </button>

                    <button
                      onClick={() => toggleLearned(hadith.id)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                        isLearned
                          ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isLearned ? "Learned!" : "Mark Learned"}
                    </button>
                  </div>
                </div>

                {/* Arabic Hadith Box */}
                <div className="p-5 rounded-2xl bg-emerald-50/80 dark:bg-slate-900 text-slate-900 dark:text-white border border-emerald-200 dark:border-indigo-500/20 mb-4 space-y-2 relative overflow-hidden">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-indigo-300 font-semibold border-b border-emerald-200 dark:border-slate-800 pb-1.5">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Prophetic Saying (حديث مبارك)
                    </span>
                    <span>{hadith.sourceEn}</span>
                  </div>

                  <p className="font-arabic text-2xl sm:text-3xl text-emerald-900 dark:text-emerald-300 text-center leading-relaxed dir-rtl py-1">
                    {hadith.arabicText}
                  </p>

                  {hadith.transliteration && (
                    <p className="text-center text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-emerald-200 dark:border-slate-800/80 font-sans">
                      "{hadith.transliteration}"
                    </p>
                  )}
                </div>

                {/* English & Urdu Translations */}
                <div className="space-y-2 mb-4 text-xs sm:text-sm">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold block mb-0.5">
                      English Translation:
                    </strong>
                    <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                      {hadith.translationEn}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-right">
                    <strong className="text-indigo-600 dark:text-indigo-400 font-bold block mb-0.5">
                      اردو ترجمہ:
                    </strong>
                    <p className="font-urdu text-base text-slate-700 dark:text-slate-200 leading-relaxed dir-rtl font-medium">
                      {hadith.translationUr}
                    </p>
                  </div>
                </div>

                {/* Moral Lesson */}
                <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-1 text-xs mb-3">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                    🌟 Moral Lesson for Kids:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {hadith.moralLessonEn}
                  </p>
                  <p className="font-urdu text-slate-700 dark:text-slate-300 text-right dir-rtl font-medium pt-1 border-t border-indigo-200/50 dark:border-indigo-800/40">
                    {hadith.moralLessonUr}
                  </p>
                </div>

                {/* Practical Example */}
                <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-1 text-xs mb-4">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600" /> Practical Life Example:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {hadith.practicalExampleEn}
                  </p>
                  <p className="font-urdu text-slate-700 dark:text-slate-300 text-right dir-rtl font-medium pt-1 border-t border-emerald-200/50 dark:border-emerald-800/40">
                    {hadith.practicalExampleUr}
                  </p>
                </div>
              </div>

              {/* Bottom Row Source & Quiz Button */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-auto">
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> {hadith.sourceEn}
                </div>

                <button
                  onClick={() => handleOpenQuiz(hadith.id)}
                  className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                    hasPassedQuiz
                      ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                  }`}
                >
                  <HelpCircle className="w-4 h-4" />
                  {hasPassedQuiz ? "Quiz Passed! ✨" : "Take Kid Quiz (+15 XP)"}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quiz Modal */}
      {activeHadithForQuiz && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-500" /> Hadith Quick Quiz
              </h3>
              <button
                onClick={() => setActiveQuizHadithId(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <p className="font-semibold text-slate-800 dark:text-slate-200 text-base">
              {activeHadithForQuiz.quiz.question}
            </p>

            <div className="space-y-2.5">
              {activeHadithForQuiz.quiz.options.map((option, idx) => {
                const isSelected = selectedAnswerIdx === idx;
                const isCorrect = idx === activeHadithForQuiz.quiz.answerIdx;

                return (
                  <button
                    key={idx}
                    disabled={quizSubmitted}
                    onClick={() => setSelectedAnswerIdx(idx)}
                    className={`w-full p-4 rounded-2xl font-medium text-sm text-left transition-all border ${
                      quizSubmitted
                        ? isCorrect
                          ? "bg-emerald-600 text-white border-emerald-500"
                          : isSelected
                          ? "bg-rose-600 text-white border-rose-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700"
                        : isSelected
                        ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                        : "bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200/80 dark:border-slate-700"
                    }`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Explanation & Results */}
            {quizSubmitted ? (
              <div className="space-y-4 pt-2">
                <div className={`p-4 rounded-2xl text-xs sm:text-sm font-medium ${
                  selectedAnswerIdx === activeHadithForQuiz.quiz.answerIdx
                    ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                    : "bg-rose-100 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800"
                }`}>
                  {selectedAnswerIdx === activeHadithForQuiz.quiz.answerIdx
                    ? "🎉 Mashallah! Correct answer! +15 Points Earned!"
                    : "Not quite right! Review the Hadith and try again!"}
                  <p className="mt-1 text-slate-700 dark:text-slate-300 font-normal">
                    {activeHadithForQuiz.quiz.explanationEn}
                  </p>
                  <p className="font-urdu mt-1 text-slate-700 dark:text-slate-300 text-right dir-rtl font-normal">
                    {activeHadithForQuiz.quiz.explanationUr}
                  </p>
                </div>
                <button
                  onClick={() => setActiveQuizHadithId(null)}
                  className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white font-bold rounded-2xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-all"
                >
                  Close Quiz
                </button>
              </div>
            ) : (
              <button
                disabled={selectedAnswerIdx === null}
                onClick={() => handleSubmitQuiz(activeHadithForQuiz.quiz.answerIdx)}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/20 transition-all"
              >
                Submit Answer
              </button>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
