import React, { useState, useEffect } from "react";
import { Star, ArrowLeft, Heart, CheckCircle2, Volume2, ShieldCheck, Gamepad2, Trophy, RefreshCw, StarOff } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KidProfile } from "../types";
import { Language, getTranslation } from "../lib/translations";

interface GamesSectionProps {
  activeProfile: KidProfile | null;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  language?: Language;
}

interface TriviaQuestion {
  question: string;
  options: string[];
  correctIdx: number;
  explanation: string;
}

const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    question: "What is the name of our Holy Book?",
    options: ["Torah", "Zabur", "Quran", "Injeel"],
    correctIdx: 2,
    explanation: "The Quran is the final holy book revealed to Prophet Muhammad ﷺ as guidance for all of mankind!"
  },
  {
    question: "How many times do Muslims pray daily?",
    options: ["3", "5", "7", "10"],
    correctIdx: 1,
    explanation: "Muslims perform Salah five times daily to remember Allah, express gratitude, and keep their hearts pure!"
  },
  {
    question: "Which Prophet built the Ark (the giant boat)?",
    options: ["Prophet Yusuf (AS)", "Prophet Nuh (AS)", "Prophet Musa (AS)", "Prophet Isa (AS)"],
    correctIdx: 1,
    explanation: "Prophet Nuh (AS) built the Ark by Allah's command to save the believers and pairs of all animals from the great flood!"
  },
  {
    question: "In which month do Muslims fast?",
    options: ["Dhul Hijjah", "Ramadan", "Muharram", "Shaban"],
    correctIdx: 1,
    explanation: "Ramadan is the blessed month of fasting, during which we learn self-control, help the poor, and read the Holy Quran!"
  }
];

interface SalahCard {
  id: string;
  name: string;
  arabic: string;
  visual: string;
}

const INITIAL_SALAH_CARDS: SalahCard[] = [
  { id: "1", name: "Takbeer (Start)", arabic: "تکبیر", visual: "🙌" },
  { id: "2", name: "Qiyam (Stand)", arabic: "قیام", visual: "🧍" },
  { id: "3", name: "Ruku (Bow)", arabic: "رکوع", visual: "🙇" },
  { id: "4", name: "Sujud (Prostrate)", arabic: "سجدہ", visual: "🧎" },
  { id: "5", name: "Tasleem (End)", arabic: "سلام", visual: "👋" }
];

export default function GamesSection({ activeProfile, onAddPoints, onNavigateHome }: GamesSectionProps) {
  const [activeGame, setActiveGame] = useState<"none" | "trivia" | "organizer">("none");

  // Trivia state
  const [triviaIdx, setTriviaIdx] = useState(0);
  const [selectedTriviaOpt, setSelectedTriviaOpt] = useState<number | null>(null);
  const [triviaAnswered, setTriviaAnswered] = useState(false);
  const [triviaScore, setTriviaScore] = useState(0);

  // Organizer state
  const [organizerCards, setOrganizerCards] = useState<SalahCard[]>([]);
  const [organizerFinished, setOrganizerFinished] = useState(false);
  const [organizerFeedback, setOrganizerFeedback] = useState<"none" | "success" | "error">("none");

  // Initialize organizer cards (scrambled)
  const initOrganizer = () => {
    const scrambled = [...INITIAL_SALAH_CARDS].sort(() => Math.random() - 0.5);
    setOrganizerCards(scrambled);
    setOrganizerFinished(false);
    setOrganizerFeedback("none");
  };

  const handleSelectGame = (game: "none" | "trivia" | "organizer") => {
    setActiveGame(game);
    if (game === "trivia") {
      setTriviaIdx(0);
      setSelectedTriviaOpt(null);
      setTriviaAnswered(false);
      setTriviaScore(0);
    } else if (game === "organizer") {
      initOrganizer();
    }
  };

  // Trivia next question handler
  const handleTriviaAnswer = (idx: number) => {
    if (triviaAnswered) return;
    setSelectedTriviaOpt(idx);
    setTriviaAnswered(true);

    if (idx === TRIVIA_QUESTIONS[triviaIdx].correctIdx) {
      setTriviaScore(prev => prev + 1);
      onAddPoints(15); // points for each correct trivia answer
    }
  };

  const handleNextTrivia = () => {
    if (triviaIdx < TRIVIA_QUESTIONS.length - 1) {
      setTriviaIdx(prev => prev + 1);
      setSelectedTriviaOpt(null);
      setTriviaAnswered(false);
    } else {
      // Game over
      onAddPoints(30); // bonus completion points
    }
  };

  // Organizer: Shift Card Up / Down to order
  const moveCard = (index: number, direction: "up" | "down") => {
    if (organizerFinished) return;
    const newCards = [...organizerCards];
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newCards.length) return;

    // Swap
    const temp = newCards[index];
    newCards[index] = newCards[targetIdx];
    newCards[targetIdx] = temp;
    setOrganizerCards(newCards);
  };

  const checkOrganizerOrder = () => {
    const isCorrect = organizerCards.every((card, idx) => card.id === INITIAL_SALAH_CARDS[idx].id);
    if (isCorrect) {
      setOrganizerFeedback("success");
      setOrganizerFinished(true);
      onAddPoints(50); // Big point award for mastering Salah order!
    } else {
      setOrganizerFeedback("error");
      setTimeout(() => setOrganizerFeedback("none"), 1500); // clear error message after some time
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6" id="games-section-root">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
        <button
          onClick={activeGame !== "none" ? () => setActiveGame("none") : onNavigateHome}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors self-start"
        >
          <ArrowLeft className="w-4 h-4" /> {activeGame !== "none" ? "Back to Games" : "Back to Home"}
        </button>
        <div className="text-center sm:text-right">
          <h1 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 justify-center sm:justify-end">
            <Gamepad2 className="w-6 h-6 text-emerald-500 animate-bounce" />
            Islamic Games
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Fun educational games to test your knowledge and learn the order of prayers! • تعلیمی کھیل
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeGame === "none" && (
          <motion.div
            key="games-menu"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            {/* Trivia Game Card */}
            <div
              onClick={() => handleSelectGame("trivia")}
              className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/20 dark:to-purple-950/20 p-8 rounded-3xl border border-indigo-500/10 hover:border-indigo-400 cursor-pointer transition-all hover:shadow-md text-center space-y-4 group"
            >
              <div className="w-16 h-16 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm group-hover:scale-105 transition-transform">
                ❓
              </div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-100">
                Ummah Kids Trivia Match
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Test your knowledge about the Quran, Prophets, and beautiful Islamic pillars! Earn +15 points per question!
              </p>
              <button className="px-5 py-2.5 bg-indigo-500 text-white text-xs font-black rounded-xl shadow-md">
                Start Playing &rarr;
              </button>
            </div>

            {/* Salah Organizer Game Card */}
            <div
              onClick={() => handleSelectGame("organizer")}
              className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 dark:from-emerald-950/20 dark:to-teal-950/20 p-8 rounded-3xl border border-emerald-500/10 hover:border-emerald-400 cursor-pointer transition-all hover:shadow-md text-center space-y-4 group"
            >
              <div className="w-16 h-16 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mx-auto text-3xl shadow-sm group-hover:scale-105 transition-transform">
                🕌
              </div>
              <h2 className="text-lg font-black text-slate-850 dark:text-slate-100">
                Salah Step Organizer
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Oh no! The steps of Salah got all scrambled! Can you arrange them in the perfect order from start to end? Earn +50 points!
              </p>
              <button className="px-5 py-2.5 bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md">
                Start Playing &rarr;
              </button>
            </div>
          </motion.div>
        )}

        {/* Trivia Game Screen */}
        {activeGame === "trivia" && (
          <motion.div
            key="trivia-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Trivia HUD */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-3xl flex justify-between items-center shadow-md">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-100">
                  Ummah Kids Trivia Match
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  Question {triviaIdx + 1} of {TRIVIA_QUESTIONS.length}
                </h3>
              </div>
              <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-1.5 border border-white/15">
                <Trophy className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-black">Score: {triviaScore}</span>
              </div>
            </div>

            {/* Question Panel */}
            <div className="bg-white dark:bg-slate-850 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
              <h3 className="text-base sm:text-lg font-black text-slate-850 dark:text-slate-100 text-center">
                {TRIVIA_QUESTIONS[triviaIdx].question}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRIVIA_QUESTIONS[triviaIdx].options.map((opt, idx) => {
                  const isSelected = selectedTriviaOpt === idx;
                  const showCorrect = triviaAnswered && idx === TRIVIA_QUESTIONS[triviaIdx].correctIdx;
                  const showWrong = triviaAnswered && isSelected && idx !== TRIVIA_QUESTIONS[triviaIdx].correctIdx;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleTriviaAnswer(idx)}
                      disabled={triviaAnswered}
                      className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold text-center transition-all ${
                        showCorrect
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 shadow-2xs"
                          : showWrong
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400"
                          : isSelected
                          ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
                          : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border-slate-200/40 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {/* Trivia feedback/explanation */}
              {triviaAnswered && (
                <div className="p-5 bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/10 rounded-2xl space-y-2">
                  <h4 className="text-xs font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    📖 Wisdom Tidbit
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-medium">
                    {TRIVIA_QUESTIONS[triviaIdx].explanation}
                  </p>
                </div>
              )}

              {/* Actions panel */}
              {triviaAnswered && (
                <div className="flex justify-end pt-4 border-t border-slate-50 dark:border-slate-800/60">
                  <button
                    onClick={handleNextTrivia}
                    className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-extrabold text-xs shadow-md transition-all active:scale-95"
                  >
                    {triviaIdx === TRIVIA_QUESTIONS.length - 1 ? "Finish Quiz!" : "Next Question &rarr;"}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Salah Step Organizer Game Screen */}
        {activeGame === "organizer" && (
          <motion.div
            key="organizer-screen"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-3xl flex justify-between items-center shadow-md">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-100">
                  Salah Step Organizer
                </span>
                <h3 className="text-base font-extrabold mt-1">
                  Put the steps in the correct order! (Top to Bottom)
                </h3>
              </div>
              <button
                onClick={initOrganizer}
                className="bg-white/10 p-2.5 hover:bg-white/15 rounded-xl border border-white/15"
                title="Restart Scramble"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* List of cards */}
            <div className="space-y-3">
              {organizerCards.map((card, index) => (
                <div
                  key={card.id}
                  className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{card.visual}</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-850 dark:text-slate-100">
                        {card.name}
                      </h4>
                      <span className="text-[10px] font-urdu font-medium text-slate-400">
                        {card.arabic}
                      </span>
                    </div>
                  </div>

                  {/* Reordering controls */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => moveCard(index, "up")}
                      disabled={index === 0 || organizerFinished}
                      className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-750 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveCard(index, "down")}
                      disabled={index === organizerCards.length - 1 || organizerFinished}
                      className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-slate-750 border border-slate-100 dark:border-slate-750 font-bold text-xs flex items-center justify-center cursor-pointer transition-colors"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Feedback message overlay */}
            {organizerFeedback === "success" && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-2xl text-center text-xs sm:text-sm font-black flex items-center justify-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                Mashallah! You sorted all Salah steps in perfect order! Earned +50 Faith Points! 🏆
              </div>
            )}
            {organizerFeedback === "error" && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 rounded-2xl text-center text-xs sm:text-sm font-black">
                Almost there! Keep trying to get the correct chronological order! 😊
              </div>
            )}

            {/* Footer checking button */}
            {!organizerFinished && (
              <button
                onClick={checkOrganizerOrder}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs tracking-wider uppercase rounded-2xl shadow-md transition-all active:scale-95"
              >
                Check My Order!
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
