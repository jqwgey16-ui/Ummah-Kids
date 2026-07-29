import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Brain, Sparkles, BookOpen, Send, RefreshCw, AlertCircle, CheckCircle, ShieldCheck, Award, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ScholarDeepThinkingProps {
  onAddPoints?: (points: number) => void;
}

export default function ScholarDeepThinking({ onAddPoints }: ScholarDeepThinkingProps) {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("General Islamic Ethics & Theology");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    answer: string;
    model: string;
    thinkingLevel: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/scholar/deep-reasoning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          topic,
          context,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
        if (onAddPoints) {
          onAddPoints(25); // Award 25 points for exploring deep scholarly reasoning!
        }
      } else {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate deep scholarly analysis.");
      }
    } catch (err: any) {
      console.error("[Scholar Deep Thinking Error]:", err);
      setError(err.message || "An unexpected error occurred while processing deep reasoning.");
    } finally {
      setLoading(false);
    }
  };

  const sampleComplexQueries = [
    "How does Islamic jurisprudence balance individual intent (Niyyah) with societal outcomes in ethical decision making?",
    "What is the classical scholarly breakdown of divine decree (Qadar) versus human freewill in Islamic theology?",
    "How do Quranic principles of stewardship (Khilafah) guide modern environmental conservation and ethical technology use?",
    "Explain the methodology of Hadith authentication (Usul al-Hadith) and how chain continuity (Isnad) is verified.",
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 border border-slate-200/60 dark:border-slate-700 shadow-lg space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-700 pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5" /> High Thinking Mode
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 uppercase">
              gemini-3.6-flash
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Scholarly Deep Reasoning & Complex Q&A
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Powered by Gemini 3.6 Flash with High Thinking Mode for deep multi-step theological & moral analysis.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl font-bold">
          <ShieldCheck className="w-4 h-4" /> Multi-Source Authentic Reasoning
        </div>
      </div>

      {/* Inquiry Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Topic / Scholarly Discipline
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            >
              <option value="General Islamic Ethics & Theology">General Islamic Ethics & Theology</option>
              <option value="Quranic Exegesis (Tafseer)">Quranic Exegesis (Tafseer)</option>
              <option value="Sciences of Hadith (Usul al-Hadith)">Sciences of Hadith (Usul al-Hadith)</option>
              <option value="Islamic Jurisprudence (Fiqh)">Islamic Jurisprudence (Fiqh)</option>
              <option value="Seerah & Historical Analysis">Seerah & Historical Analysis</option>
              <option value="Contemporary Family Ethics">Contemporary Family Ethics</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Additional Context / Target Audience
            </label>
            <input
              type="text"
              placeholder="e.g. For parents teaching teenagers, or academic comparative view..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Complex Query or Theological Inquiry
          </label>
          <textarea
            required
            rows={4}
            placeholder="Type your complex query for high thinking analysis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 text-xs sm:text-sm rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden leading-relaxed"
          />
        </div>

        {/* Quick sample prompt pills */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-400 block">Try complex inquiry examples:</span>
          <div className="flex flex-wrap gap-2">
            {sampleComplexQueries.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(sample)}
                className="text-[11px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-slate-900 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors text-left border border-slate-200/50 dark:border-slate-700 cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin text-amber-300" />
              Performing High Thinking Scholarly Analysis (gemini-3.6-flash)...
            </>
          ) : (
            <>
              <Brain className="w-5 h-5 text-amber-300" /> Request Deep Scholarly Analysis
            </>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* High Thinking Response Display */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 pt-6 border-t border-slate-100 dark:border-slate-700"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-indigo-100 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
              <Sparkles className="w-4 h-4 text-amber-500" /> High Thinking Analysis Generated
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                Thinking Level: {result.thinkingLevel}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                Model: {result.model}
              </span>
            </div>
          </div>

          <div className="p-6 sm:p-8 bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200/50 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-relaxed prose dark:prose-invert max-w-none">
            <ReactMarkdown>{result.answer}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
}
