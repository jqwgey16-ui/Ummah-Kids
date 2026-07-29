import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, Heart, CheckCircle2, ShieldCheck, 
  Search, Sparkles, BookOpen, Clock, Lightbulb, Star
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KidProfile } from "../types";
import { DUA_ITEMS, DuaItem } from "../data/duasData";

import { Language, getTranslation } from "../lib/translations";

interface DuaSectionProps {
  activeProfile: KidProfile | null;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  language?: Language;
}

export default function DuaSection({ activeProfile, onAddPoints, onNavigateHome, language = "en" }: DuaSectionProps) {
  const [duasSequenceList, setDuasSequenceList] = useState<DuaItem[]>(DUA_ITEMS);

  useEffect(() => {
    fetch("/api/duas")
      .then((res) => res.json())
      .then((data) => {
        const rawList = Array.isArray(data) ? data : (data && Array.isArray(data.duas) ? data.duas : []);
        if (rawList.length > 0) {
          const mapped: DuaItem[] = rawList.map((item: any) => ({
            id: item.id,
            titleEn: item.titleEn,
            titleUr: item.titleUr || "",
            category: item.category || "daily",
            categoryLabelEn: item.categoryLabelEn || item.category || "Daily Dua",
            categoryLabelUr: item.categoryLabelUr || "روزمرہ دعائیں",
            arabicText: item.arabicText,
            transliteration: item.transliteration || "",
            translationEn: item.translationEn,
            translationUr: item.translationUr || "",
            referenceEn: item.reference || item.referenceEn || "Hisn al-Muslim",
            referenceUr: item.referenceUr || "حصن المسلم",
            childExplanationEn: item.benefitsEn || item.childExplanationEn || "",
            childExplanationUr: item.benefitsUr || item.childExplanationUr || "",
            whenToReadEn: item.explanationEn || item.whenToReadEn || "",
            whenToReadUr: item.explanationUr || item.whenToReadUr || "",
            iconEmoji: item.iconEmoji || "🤲"
          }));
          setDuasSequenceList(mapped);
        }
      })
      .catch((err) => {
        console.warn("Using fallback static Dua items:", err);
      });
  }, []);

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Favorites & Recited Today state
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("dua_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const [recitedToday, setRecitedToday] = useState<string[]>(() => {
    const saved = localStorage.getItem("duas_recited_today");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(f => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("dua_favorites", JSON.stringify(updated));
  };

  const toggleRecited = (id: string) => {
    let updated: string[];
    if (recitedToday.includes(id)) {
      updated = recitedToday.filter(r => r !== id);
    } else {
      updated = [...recitedToday, id];
      onAddPoints(10); // Award 10 points for reciting a dua
    }
    setRecitedToday(updated);
    localStorage.setItem("duas_recited_today", JSON.stringify(updated));
  };

  // Filter Duas
  const filteredDuas = duasSequenceList.filter(dua => {
    const matchesCategory = activeCategory === "all" || 
      (activeCategory === "favorites" && favorites.includes(dua.id)) ||
      dua.category === activeCategory;

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      dua.titleEn.toLowerCase().includes(query) ||
      dua.titleUr.includes(query) ||
      dua.arabicText.includes(query) ||
      dua.translationEn.toLowerCase().includes(query) ||
      dua.translationUr.includes(query);

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-slate-50 to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-8 pb-24 transition-colors duration-300">
      
      {/* Top Header */}
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={onNavigateHome}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-amber-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Daily Remembrance 🤲
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" /> Authentic References
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              Daily Duas for Kids
            </h1>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Dua by title, English, or Urdu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="max-w-5xl mx-auto mb-8 overflow-x-auto pb-2 custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {[
            { id: "all", label: "All Duas", emoji: "✨" },
            { id: "eat", label: "Eating & Drinking", emoji: "🍎" },
            { id: "sleep", label: "Sleeping & Waking", emoji: "🌙" },
            { id: "protection", label: "Protection & Safety", emoji: "🛡️" },
            { id: "parents", label: "Parents & Family", emoji: "💖" },
            { id: "knowledge", label: "Knowledge & Study", emoji: "📚" },
            { id: "mosque", label: "Mosque & Worship", emoji: "🕌" },
            { id: "daily", label: "Daily Life & Manners", emoji: "🏡" },
            { id: "favorites", label: `Favorites (${favorites.length})`, emoji: "❤️" },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all ${
                activeCategory === cat.id
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105"
                  : "bg-white/90 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.emoji}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Duas Display Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {filteredDuas.map(dua => {
            const isFav = favorites.includes(dua.id);
            const isRecited = recitedToday.includes(dua.id);

            return (
              <motion.div
                key={dua.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-lg shadow-amber-950/5 hover:shadow-xl transition-all relative overflow-hidden flex flex-col justify-between"
              >
                {/* Decorative Top Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-emerald-400 to-teal-400" />

                <div>
                  {/* Title Bar & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-emerald-400 text-slate-950 font-bold text-2xl flex items-center justify-center shadow-md shrink-0">
                        {dua.iconEmoji || "🤲"}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {dua.categoryLabelEn}
                        </span>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">
                          {dua.titleEn}
                        </h3>
                        <p className="font-urdu text-base font-bold text-emerald-600 dark:text-emerald-400 dir-rtl">
                          {dua.titleUr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleFavorite(dua.id)}
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
                        onClick={() => toggleRecited(dua.id)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isRecited
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-sm"
                            : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isRecited ? "Recited!" : "Recite"}
                      </button>
                    </div>
                  </div>

                  {/* Large Arabic Box */}
                  <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-slate-900 text-slate-900 dark:text-white border border-amber-200 dark:border-amber-500/20 mb-4 space-y-2 relative overflow-hidden">
                    <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-400 font-semibold border-b border-amber-200 dark:border-slate-800 pb-1.5">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Authentic Supplication
                      </span>
                      <span>متنِ دعا</span>
                    </div>

                    <p className="font-arabic text-2xl sm:text-3xl text-slate-900 dark:text-emerald-300 text-center leading-relaxed dir-rtl py-1">
                      {dua.arabicText}
                    </p>

                    {dua.transliteration && (
                      <p className="text-center text-xs text-slate-600 dark:text-slate-300 italic pt-1 border-t border-amber-200 dark:border-slate-800/80 font-sans">
                        "{dua.transliteration}"
                      </p>
                    )}
                  </div>

                  {/* Translations */}
                  <div className="space-y-2 mb-4 text-xs sm:text-sm">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800">
                      <strong className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">
                        English Translation:
                      </strong>
                      <p className="text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
                        {dua.translationEn}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-right">
                      <strong className="text-amber-600 dark:text-amber-400 font-bold block mb-0.5">
                        اردو ترجمہ:
                      </strong>
                      <p className="font-urdu text-base text-slate-700 dark:text-slate-200 leading-relaxed dir-rtl font-medium">
                        {dua.translationUr}
                      </p>
                    </div>
                  </div>

                  {/* Child Explanation & When to Read */}
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50">
                      <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 mb-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Lesson for Children:
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {dua.childExplanationEn}
                      </p>
                      <p className="font-urdu text-slate-700 dark:text-slate-300 text-right dir-rtl font-medium pt-1 border-t border-amber-200/40 dark:border-amber-800/40 mt-1">
                        {dua.childExplanationUr}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 flex items-start gap-2 text-teal-900 dark:text-teal-200">
                      <Clock className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">When to read:</p>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">{dua.whenToReadEn}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Reference */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800 mt-4 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" /> {dua.referenceEn}
                  </span>
                  <span className="font-urdu dir-rtl">
                    {dua.referenceUr}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredDuas.length === 0 && (
        <div className="max-w-md mx-auto text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <p className="text-4xl mb-3">🤲</p>
          <h3 className="font-bold text-lg text-slate-900 dark:text-white">No Duas Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try searching for a different word or selecting another category.
          </p>
        </div>
      )}
    </div>
  );
}
