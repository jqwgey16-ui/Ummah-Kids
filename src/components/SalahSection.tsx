import React, { useState } from "react";
import { 
  ArrowLeft, Heart, CheckCircle2, ShieldCheck, 
  ChevronRight, ChevronLeft, Sparkles, BookOpen, 
  HelpCircle, AlertTriangle, Lightbulb, Star, Sun, Compass
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KidProfile } from "../types";
import { SALAH_STEPS, WUDU_STEPS, SalahStep } from "../data/salahData";
import { Language, getTranslation } from "../lib/translations";

interface SalahSectionProps {
  activeProfile: KidProfile | null;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  language?: Language;
}

export default function SalahSection({ activeProfile, onAddPoints, onNavigateHome, language = "en" }: SalahSectionProps) {
  const [activeTab, setActiveTab] = useState<"salah" | "wudu">("salah");
  const [currentStepIdx, setCurrentStepIdx] = useState(0);

  // Favorites & Completed State
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("salah_favorites");
    return saved ? JSON.parse(saved) : [];
  });

  const [completedSteps, setCompletedSteps] = useState<string[]>(() => {
    const saved = localStorage.getItem("salah_completed_steps");
    return saved ? JSON.parse(saved) : [];
  });

  const stepsList = activeTab === "salah" ? SALAH_STEPS : WUDU_STEPS;
  const activeStep: SalahStep = stepsList[currentStepIdx] || stepsList[0];

  const toggleFavorite = (id: string) => {
    let updated: string[];
    if (favorites.includes(id)) {
      updated = favorites.filter(f => f !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem("salah_favorites", JSON.stringify(updated));
  };

  const toggleComplete = (id: string) => {
    let updated: string[];
    if (completedSteps.includes(id)) {
      updated = completedSteps.filter(c => c !== id);
    } else {
      updated = [...completedSteps, id];
      onAddPoints(10); // Award 10 points for completing a step
    }
    setCompletedSteps(updated);
    localStorage.setItem("salah_completed_steps", JSON.stringify(updated));
  };

  const completedCountInTab = stepsList.filter(s => completedSteps.includes(s.id)).length;
  const progressPercent = Math.round((completedCountInTab / stepsList.length) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-slate-50 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-teal-950/30 text-slate-800 dark:text-slate-100 p-4 sm:p-6 md:p-8 pb-24 transition-colors duration-300">
      
      {/* Top Header */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onNavigateHome}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl shadow-sm transition-all hover:scale-105 active:scale-95"
            title="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Kid-Friendly Guide 🕌
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-teal-600 dark:text-teal-400">
                <ShieldCheck className="w-4 h-4" /> Authentic Step-by-Step
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white mt-0.5">
              Learn Salah & Wudu
            </h1>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 bg-slate-200/80 dark:bg-slate-900/90 rounded-2xl border border-slate-300 dark:border-slate-800 w-full sm:w-auto shadow-inner">
          <button
            onClick={() => { setActiveTab("salah"); setCurrentStepIdx(0); }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "salah"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            How to Pray (Salah) 🕌
          </button>
          <button
            onClick={() => { setActiveTab("wudu"); setCurrentStepIdx(0); }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === "wudu"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            Wudu Steps 💧
          </button>
        </div>
      </div>

      {/* Main Learning Grid */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Step Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-lg shadow-emerald-950/5">
            
            {/* Header & Progress Bar */}
            <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {activeTab === "salah" ? "Salah Steps List" : "Wudu Steps List"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Step {currentStepIdx + 1} of {stepsList.length}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-300 dark:border-emerald-800">
                  {progressPercent}% Done
                </span>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Step Selection List */}
            <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
              {stepsList.map((step, idx) => {
                const isActive = idx === currentStepIdx;
                const isStepCompleted = completedSteps.includes(step.id);
                const isStepFav = favorites.includes(step.id);

                return (
                  <button
                    key={step.id}
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-center justify-between gap-3 border ${
                      isActive
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/20 scale-[1.01]"
                        : "bg-slate-50/80 dark:bg-slate-800/60 hover:bg-emerald-50/60 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 shadow-sm ${
                        isActive 
                          ? "bg-white/20 text-white" 
                          : "bg-emerald-100 dark:bg-slate-700 text-emerald-800 dark:text-emerald-300"
                      }`}>
                        {step.iconEmoji || idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm truncate">{step.titleEn}</h4>
                        <p className={`font-urdu text-xs truncate dir-rtl ${isActive ? "text-emerald-100" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {step.titleUr}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isStepFav && <Heart className={`w-4 h-4 ${isActive ? "fill-white text-white" : "fill-rose-500 text-rose-500"}`} />}
                      {isStepCompleted && <CheckCircle2 className={`w-4 h-4 ${isActive ? "text-white" : "text-emerald-500"}`} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Featured Step Card Display */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-950/5 space-y-6 relative overflow-hidden"
            >
              {/* Decorative Top Accent */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

              {/* Step Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 font-bold text-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0 border border-white/20">
                    {activeStep.visualEmoji || "🕌"}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Step {currentStepIdx + 1} of {stepsList.length}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                      {activeStep.titleEn}
                    </h2>
                    <p className="font-urdu text-lg font-bold text-emerald-600 dark:text-emerald-400 dir-rtl">
                      {activeStep.titleUr}
                    </p>
                  </div>
                </div>

                {/* Actions: Favorite & Mark Learned */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFavorite(activeStep.id)}
                    className={`p-3 rounded-2xl border transition-all ${
                      favorites.includes(activeStep.id)
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-500"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    }`}
                    title="Toggle Favorite"
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(activeStep.id) ? "fill-current" : ""}`} />
                  </button>

                  <button
                    onClick={() => toggleComplete(activeStep.id)}
                    className={`px-4 py-3 rounded-2xl border font-bold text-xs flex items-center gap-2 transition-all ${
                      completedSteps.includes(activeStep.id)
                        ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/20"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {completedSteps.includes(activeStep.id) ? "Learned! (+10 XP)" : "Mark as Learned"}
                  </button>
                </div>
              </div>

              {/* Large Arabic Box */}
              {activeStep.arabicText && (
                <div className="p-6 rounded-3xl bg-emerald-50/80 dark:bg-slate-900 text-slate-900 dark:text-white border border-emerald-200 dark:border-emerald-500/30 shadow-inner space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400 font-semibold border-b border-emerald-200 dark:border-slate-800 pb-2">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Authentic Arabic Text
                    </span>
                    <span>تلاوتِ مبارکہ</span>
                  </div>

                  <p className="font-arabic text-2xl sm:text-4xl text-emerald-950 dark:text-emerald-300 text-center leading-relaxed py-2 dir-rtl">
                    {activeStep.arabicText}
                  </p>

                  {activeStep.transliteration && (
                    <p className="text-center text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic pt-2 border-t border-emerald-200 dark:border-slate-800/80 font-sans">
                      "{activeStep.transliteration}"
                    </p>
                  )}
                </div>
              )}

              {/* Translations & Explanations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* English Box */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-200/80 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" /> English Explanation
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-100 leading-relaxed font-semibold">
                    {activeStep.translationEn}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1 border-t border-emerald-200/50 dark:border-slate-700">
                    {activeStep.explanationEn}
                  </p>
                </div>

                {/* Urdu Box */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/60 border border-emerald-200/80 dark:border-slate-800 space-y-2 text-right">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    <BookOpen className="w-4 h-4" /> اردو وضاحت
                  </div>
                  <p className="font-urdu text-base sm:text-lg text-slate-800 dark:text-slate-100 leading-relaxed dir-rtl font-bold">
                    {activeStep.translationUr}
                  </p>
                  <p className="font-urdu text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed dir-rtl pt-1 border-t border-emerald-200/50 dark:border-slate-700">
                    {activeStep.explanationUr}
                  </p>
                </div>
              </div>

              {/* Benefits Section */}
              <div className="p-5 rounded-2xl bg-teal-50/80 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/50 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" /> Key Benefits & Rewards (فوائد و برکات)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <p className="text-slate-700 dark:text-slate-200 font-medium">
                    🌟 <strong>English:</strong> {activeStep.benefitsEn}
                  </p>
                  <p className="font-urdu text-slate-700 dark:text-slate-200 text-right dir-rtl font-medium">
                    🌟 <strong>اردو:</strong> {activeStep.benefitsUr}
                  </p>
                </div>
              </div>

              {/* Sunnahs & Common Mistakes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Important Sunnahs */}
                {activeStep.sunnahsEn && (
                  <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-1.5">
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> Important Sunnah
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {activeStep.sunnahsEn}
                    </p>
                    <p className="font-urdu text-xs text-slate-700 dark:text-slate-300 text-right dir-rtl font-medium pt-1 border-t border-amber-200/50 dark:border-amber-800/40">
                      {activeStep.sunnahsUr}
                    </p>
                  </div>
                )}

                {/* Common Mistakes */}
                {activeStep.commonMistakesEn && (
                  <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 space-y-1.5">
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> Common Mistake to Avoid
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {activeStep.commonMistakesEn}
                    </p>
                    <p className="font-urdu text-xs text-slate-700 dark:text-slate-300 text-right dir-rtl font-medium pt-1 border-t border-rose-200/50 dark:border-rose-800/40">
                      {activeStep.commonMistakesUr}
                    </p>
                  </div>
                )}
              </div>

              {/* Step Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-2">
                <button
                  onClick={() => setCurrentStepIdx(prev => Math.max(0, prev - 1))}
                  disabled={currentStepIdx === 0}
                  className="px-4 sm:px-5 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 sm:gap-2 transition-all min-h-[48px]"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>

                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                  Step {currentStepIdx + 1} of {stepsList.length}
                </span>

                <button
                  onClick={() => setCurrentStepIdx(prev => Math.min(stepsList.length - 1, prev + 1))}
                  disabled={currentStepIdx === stepsList.length - 1}
                  className="px-4 sm:px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 sm:gap-2 shadow-md shadow-emerald-600/20 transition-all min-h-[48px]"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
