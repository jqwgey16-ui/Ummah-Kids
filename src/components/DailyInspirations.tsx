import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Quote, MessageSquareQuote } from "lucide-react";
import { DailyHadith, DailyQuote } from "../types";
import { motion } from "motion/react";

export default function DailyInspirations() {
  const [hadith, setHadith] = useState<DailyHadith | null>(null);
  const [quote, setQuote] = useState<DailyQuote | null>(null);

  useEffect(() => {
    // Fetch from backend
    fetch("/api/daily")
      .then((res) => res.json())
      .then((data) => {
        setHadith(data.hadith);
        setQuote(data.quote);
      })
      .catch((err) => console.error("Error loading daily inspirations:", err));
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8" id="daily-inspiration-panels">
      {/* Daily Hadith Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-slate-800 dark:to-slate-900 border border-emerald-100/50 dark:border-slate-700 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xs"
      >
        <div className="absolute right-0 top-0 -translate-y-4 translate-x-4 opacity-[0.03] dark:opacity-[0.05] text-emerald-800 dark:text-emerald-400 font-bold select-none text-9xl font-urdu">
          حديث
        </div>

        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4">
          <MessageSquareQuote className="w-4 h-4 text-amber-500 animate-pulse" />
          Daily Hadith • حدیثِ رسول ﷺ
        </div>

        {hadith ? (
          <div className="space-y-4">
            <p className="text-xl sm:text-2xl font-urdu font-medium text-right text-slate-800 dark:text-slate-100 leading-[2.2] select-text">
              {hadith.hadithUr}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
              "{hadith.hadithEn}"
            </p>
            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 mt-2">
              Source: <span className="font-mono">{hadith.source}</span>
            </p>
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-slate-400 text-sm">
            Loading wisdom...
          </div>
        )}
      </motion.div>

      {/* Daily Quote Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
        className="relative bg-gradient-to-br from-amber-50 to-orange-50/30 dark:from-slate-805 dark:to-slate-900 border border-amber-100/40 dark:border-slate-700 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xs"
      >
        <div className="absolute right-0 top-0 -translate-y-4 translate-x-4 opacity-[0.03] dark:opacity-[0.05] text-amber-800 dark:text-amber-400 font-bold select-none text-9xl font-urdu">
          قول
        </div>

        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs uppercase tracking-widest mb-4">
          <Quote className="w-4 h-4 text-emerald-500 animate-bounce" />
          Daily Islamic Quote • سنہری بات
        </div>

        {quote ? (
          <div className="space-y-4">
            <p className="text-xl sm:text-2xl font-urdu font-medium text-right text-slate-800 dark:text-slate-100 leading-[2.2] select-text">
              {quote.quoteUr}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
              "{quote.quoteEn}"
            </p>
            <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 mt-2">
              Source: <span className="font-sans">{quote.source}</span>
            </p>
          </div>
        ) : (
          <div className="h-28 flex items-center justify-center text-slate-400 text-sm">
            Loading wisdom...
          </div>
        )}
      </motion.div>
    </div>
  );
}
