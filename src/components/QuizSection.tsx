import { useState } from "react";
import { CheckCircle2, XCircle, Award, RotateCcw, AlertCircle, HelpCircle } from "lucide-react";
import { QuizQuestion } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface QuizSectionProps {
  quiz: QuizQuestion[];
  onComplete: (score: number) => void;
}

export default function QuizSection({ quiz, onComplete }: QuizSectionProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);

  if (!quiz || quiz.length === 0) {
    return (
      <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl text-center">
        <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">No quiz available for this story.</p>
      </div>
    );
  }

  const currentQuestion = quiz[currentQuestionIdx];

  const handleOptionClick = (optionIdx: number) => {
    if (answered) return;
    setSelectedOptionIdx(optionIdx);
    setAnswered(true);

    if (optionIdx === currentQuestion.answerIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestionIdx + 1 < quiz.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
      setSelectedOptionIdx(null);
      setAnswered(false);
    } else {
      setShowResults(true);
      onComplete(score);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIdx(0);
    setSelectedOptionIdx(null);
    setAnswered(false);
    setScore(0);
    setShowResults(false);
  };

  const getBadgeName = (score: number) => {
    const ratio = score / quiz.length;
    if (ratio === 1) return { name: "Faith Star • سلیمان کا تاج", desc: "Mashallah! You answered everything perfectly!", color: "from-amber-400 to-yellow-600" };
    if (ratio >= 0.6) return { name: "Wise Explorer • عقل مند مسافر", desc: "Wonderful! You learned the story well!", color: "from-emerald-400 to-teal-600" };
    return { name: "Sincere Learner • سچا طالب علم", desc: "Good try! Read the story again to find all answers.", color: "from-blue-400 to-indigo-600" };
  };

  const badge = getBadgeName(score);

  return (
    <div className="bg-emerald-50/50 dark:bg-slate-800/50 border border-emerald-100 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-xs" id="quiz-wrapper">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="question-container"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {/* Quiz Header Progress */}
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500 text-white text-xs">Quiz</span>
                  Test Your Knowledge!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">کہانی کا کوئز لیں</p>
              </div>
              <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1 rounded-xl">
                Question {currentQuestionIdx + 1} of {quiz.length}
              </span>
            </div>

            {/* Question Text */}
            <div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 leading-snug">
                {currentQuestion.question}
              </h4>
            </div>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="quiz-options">
              {currentQuestion.options.map((option, idx) => {
                let btnStyles = "border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 hover:border-emerald-300";
                let icon = null;

                if (answered) {
                  const isCorrect = idx === currentQuestion.answerIndex;
                  const isSelected = idx === selectedOptionIdx;

                  if (isCorrect) {
                    btnStyles = "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-semibold";
                    icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
                  } else if (isSelected) {
                    btnStyles = "bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-400";
                    icon = <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
                  } else {
                    btnStyles = "opacity-50 border-slate-200 dark:border-slate-700";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={answered}
                    onClick={() => handleOptionClick(idx)}
                    className={`p-4 rounded-2xl border-2 text-left text-sm font-medium transition-all duration-200 flex items-center justify-between gap-3 ${btnStyles}`}
                    id={`quiz-option-${idx}`}
                  >
                    <span>{option}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explanations & Next Button */}
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl space-y-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="text-sm font-bold text-slate-800 dark:text-slate-100">Explanation:</h5>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors"
                    id="quiz-next-btn"
                  >
                    {currentQuestionIdx + 1 === quiz.length ? "Finish Quiz • ختم" : "Next Question • اگلا"}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="results-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-6 space-y-6"
          >
            {/* Badge Icon */}
            <div className="inline-flex relative">
              <div className="absolute inset-0 bg-radial from-amber-200/50 to-transparent blur-xl" />
              <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${badge.color} text-white flex items-center justify-center shadow-lg`}>
                <Award className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            {/* Header Result */}
            <div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                Quiz Completed!
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">آپ کا نتیجہ</p>
            </div>

            {/* Scores */}
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 inline-block px-8 py-4 rounded-3xl shadow-xs">
              <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {score} / {quiz.length}
              </div>
              <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
                Correct Answers
              </div>
            </div>

            {/* Achievement Badge details */}
            <div className="max-w-md mx-auto space-y-1 bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 px-6 py-4 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Earned Badge
              </span>
              <h4 className="text-lg font-bold text-amber-800 dark:text-amber-400">
                {badge.name}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                {badge.desc}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                id="quiz-retry-btn"
              >
                <RotateCcw className="w-4 h-4" /> Try Again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
