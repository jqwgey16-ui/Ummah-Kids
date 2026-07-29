import React, { useState } from "react";
import { Sparkles, BookOpen, AlertCircle, HelpCircle, ArrowRight, Loader2, Heart, RefreshCw } from "lucide-react";
import { Story } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Language, getTranslation } from "../lib/translations";

interface AiStoryGeneratorProps {
  onStoryGenerated: (story: Story) => void;
  adminToken: string | null;
  language?: Language;
}

export default function AiStoryGenerator({ onStoryGenerated, adminToken, language = "en" }: AiStoryGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [ageGroup, setAgeGroup] = useState<"4-6" | "7-9" | "10-12">("7-9");
  const [category, setCategory] = useState("Islamic Morals");
  const [moralValue, setMoralValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loaderSteps = [
    "Opening the magical gates of history... 📖",
    "Gathering beautiful Islamic moral lessons... 🌱",
    "Translating the wisdom into pure, soft Urdu script... ✍️",
    "Creating interactive multiple-choice quiz questions... 🧠",
    "Verifying references with authentic Quran and Hadith... 🕌",
    "Applying colorful illustrated cover page... 🎨",
  ];

  const templates = [
    { title: "Honesty in Trade", moral: "Truthfulness and fairness in buying/selling", category: "Islamic Morals" },
    { title: "The Patient Ant", moral: "Patience (Sabr) and hard work", category: "Quran Stories" },
    { title: "Kindness to Neighbours", moral: "Caring for our community and friends", category: "Islamic Morals" },
    { title: "The Prophet and the Bird", moral: "Mercy to all creations of Allah", category: "Prophet Muhammad ﷺ Life" },
  ];

  const handleTemplateClick = (tpl: typeof templates[0]) => {
    setTopic(tpl.title);
    setMoralValue(tpl.moral);
    setCategory(tpl.category);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    setLoading(true);
    setLoadingStep(0);
    setError(null);

    // Increment loading message steps progressively
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loaderSteps.length);
    }, 4000);

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (adminToken) {
        headers["Authorization"] = `Bearer ${adminToken}`;
      }

      const response = await fetch("/api/generate-story", {
        method: "POST",
        headers,
        body: JSON.stringify({
          topic,
          ageGroup,
          category,
          moralValue,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Something went wrong while generating the story.");
      }

      onStoryGenerated(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to contact story teller engine.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4" id="ai-generator-panel">
      {/* Banner introduction */}
      <div className="text-center space-y-3 mb-10">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 shadow-xs border border-purple-200/50">
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-spin" />
          Infinite Magical Stories
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          AI-Powered Islamic Story Teller
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Create custom, safe, and authentic Islamic stories! Enter a topic or value, and watch as Gemini crafts a beautiful bilingual tale with lesson points, references, and a quiz.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!loading ? (
          <motion.div
            key="input-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
          >
            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-3 text-sm text-rose-800 dark:text-rose-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
                <div>
                  <h4 className="font-bold">Storyteller encountered an issue:</h4>
                  <p className="text-xs mt-1">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Story Topic */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  What should the story be about? <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Prophet Ibrahim and the little birds, or Honesty at school"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:bg-white text-sm"
                  id="generator-topic"
                />
              </div>

              {/* Moral / Focus Value */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Moral Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Sabr (Patience), Shukr (Gratitude), Helping parents, Truthfulness"
                  value={moralValue}
                  onChange={(e) => setMoralValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:bg-white text-sm"
                  id="generator-moral"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-slate-800 dark:text-slate-100 focus:outline-hidden text-sm"
                    id="generator-category"
                  >
                    <option value="Islamic Morals">Islamic Morals (اخلاقیات)</option>
                    <option value="Prophets Stories">Prophets Stories (قصص الانبیاء)</option>
                    <option value="Prophet Muhammad ﷺ Life">Prophet Muhammad ﷺ Life (سیرت النبی)</option>
                    <option value="Sahaba Stories">Sahaba Stories (قصص الصحابہ)</option>
                    <option value="Quran Stories">Quran Stories (قرآنی کہانیاں)</option>
                    <option value="Duas">Duas & Supplications (دعائیں)</option>
                  </select>
                </div>

                {/* Target Age Group */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                    Target Age Group
                  </label>
                  <div className="flex gap-2" id="generator-age-toggles">
                    {["4-6", "7-9", "10-12"].map((group) => (
                      <button
                        key={group}
                        type="button"
                        onClick={() => setAgeGroup(group as any)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          ageGroup === group
                            ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                        }`}
                      >
                        {group} Yrs
                      </button>
                    ))}
                  </div>
                </div>
              </div>
 
              {!adminToken && (
                <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/40 rounded-2xl text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-sm">
                    <AlertCircle className="w-4.5 h-4.5 text-amber-500" /> Admin Access Required
                  </p>
                  <p>
                    Custom story generation uses the Gemini API, which is restricted to verified administrators to manage costs.
                  </p>
                  <p className="font-semibold">
                    Please visit the Admin Console tab to sign in or create an administrator account.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={!adminToken}
                className={`w-full py-4 rounded-2xl text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                  adminToken
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-purple-600 hover:opacity-95 cursor-pointer"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                }`}
                id="generate-submit-btn"
              >
                <Sparkles className="w-5 h-5" /> Assemble AI Story Teller • کہانی لکھیں
              </button>
            </form>

            {/* Quick Templates */}
            <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Need inspiration? Tap a template:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="generator-templates">
                {templates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleTemplateClick(tpl)}
                    className="p-3.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20 text-left hover:border-purple-300 hover:bg-white dark:hover:bg-slate-800 transition-all flex justify-between items-center group"
                  >
                    <div>
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 transition-colors">
                        {tpl.title}
                      </h5>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {tpl.moral}
                      </p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="loading-container"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-10 shadow-xs text-center space-y-6"
          >
            <div className="relative inline-flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 animate-spin">
                <RefreshCw className="w-8 h-8" />
              </div>
              <Sparkles className="absolute -top-1.5 -right-1.5 w-6 h-6 text-amber-500 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                Crafting Your Story...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">بچوں کے لئے جادوئی کہانی لکھی جا رہی ہے</p>
            </div>

            {/* Rotating helpful messages */}
            <div className="max-w-md mx-auto bg-purple-500/10 border border-purple-200/50 dark:border-purple-800/20 py-3.5 px-5 rounded-2xl">
              <p className="text-sm font-semibold text-purple-800 dark:text-purple-300 animate-pulse">
                {loaderSteps[loadingStep]}
              </p>
            </div>

            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              This can take around 20-30 seconds as Gemini generates authentic references and the full Urdu translation.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
