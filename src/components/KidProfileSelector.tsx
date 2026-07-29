import React from "react";
import { KidProfile } from "../types";
import { motion } from "motion/react";
import { Flame, Award, Shield, UserPlus, Sparkles } from "lucide-react";

interface KidProfileSelectorProps {
  profiles: KidProfile[];
  activeProfile: KidProfile | null;
  onSelectProfile: (profile: KidProfile) => void;
  onOpenParentDashboard: () => void;
  language: "en" | "ur" | "ar";
}

export default function KidProfileSelector({
  profiles,
  activeProfile,
  onSelectProfile,
  onOpenParentDashboard,
  language
}: KidProfileSelectorProps) {
  const isRTL = language === "ur" || language === "ar";

  return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center" dir={isRTL ? "rtl" : "ltr"}>
      {/* Platform Welcome Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mb-12"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          {language === "ur" ? "خوش آمدید" : language === "ar" ? "مرحباً بكم" : "Welcome Back"}
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-slate-850 dark:text-slate-100 tracking-tight leading-none">
          {language === "ur" ? "کون سیکھنے کے لئے تیار ہے؟" : language === "ar" ? "من المستعد للتعلم اليوم؟" : "Who is learning today?"}
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          {language === "ur" ? "کہانیاں پڑھنے، کوئز حل کرنے اور خوبصورت اسلامی بیجز حاصل کرنے کے لیے اپنا پروفائل منتخب کریں!" 
          : language === "ar" ? "اختر ملفك الشخصي لقراءة القصص وحل الاختبارات وكسب الأوسمة!" 
          : "Select your profile to start reading beautiful stories, solving quizzes, and earning badges!"}
        </p>
      </motion.div>

      {/* Grid of Profiles */}
      {profiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 max-w-md mx-auto space-y-6 shadow-xs">
          <span className="text-5xl block animate-bounce">🐣</span>
          <p className="text-xs font-bold text-slate-500 leading-relaxed">
            No profiles have been created yet. Parents can create custom profiles for each child in the Parent Dashboard.
          </p>
          <button
            onClick={onOpenParentDashboard}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Create First Child Profile
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-12">
          {profiles.map((p, idx) => {
            const isSelected = activeProfile?.id === p.id;
            return (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 100 }}
                onClick={() => onSelectProfile(p)}
                className={`relative p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 text-center cursor-pointer transition-all hover:shadow-lg ${
                  isSelected
                    ? "border-emerald-500 ring-4 ring-emerald-500/15"
                    : "border-slate-100 dark:border-slate-700/80 hover:border-emerald-300"
                }`}
              >
                {/* Avatar */}
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-5xl mx-auto mb-4 border border-slate-100 dark:border-slate-800">
                  {p.avatar || "🐣"}
                </div>

                {/* Info */}
                <span className="block font-black text-slate-800 dark:text-slate-100 text-lg">
                  {p.name}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest block mt-0.5">
                  Age {p.age}
                </span>

                {/* Score */}
                <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-extrabold">
                  <Award className="w-3.5 h-3.5 fill-amber-500/20" />
                  {p.points} Points
                </span>

                {/* Streak */}
                {p.streak > 0 && (
                  <span className="absolute top-3 right-3 flex items-center gap-0.5 px-1.5 py-0.5 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black">
                    <Flame className="w-3.5 h-3.5 fill-rose-500/20 animate-pulse" />
                    {p.streak}
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}

      {/* Parental control shortcut */}
      {profiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-12"
        >
          <button
            onClick={onOpenParentDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/85 border border-slate-200/50 dark:border-slate-750 text-slate-600 dark:text-slate-250 rounded-2xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Shield className="w-4 h-4 text-emerald-600" />
            {language === "ur" ? "والدین کا گائیڈ اور کنٹرول" : language === "ar" ? "لوحة الآباء والإشراف" : "Parental Guide & Control Dashboard"}
          </button>
        </motion.div>
      )}
    </div>
  );
}
