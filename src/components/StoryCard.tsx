import React from "react";
import { Clock, Tag, Sparkles, Wifi } from "lucide-react";
import { Story } from "../types";
import { motion } from "motion/react";
import { Language, getTranslation } from "../lib/translations";

interface StoryCardProps {
  key?: React.Key | string;
  story: Story;
  onSelect: (story: Story) => void;
  isOfflineAvailable?: boolean;
  language?: Language;
}

export default function StoryCard({ story, onSelect, isOfflineAvailable, language = "en" }: StoryCardProps) {
  // Safe color coding for age groups
  const ageGroupDetails = {
    "4-6": { text: `${getTranslation("age", language)} 4-6`, bg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40" },
    "7-9": { text: `${getTranslation("age", language)} 7-9`, bg: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40" },
    "10-12": { text: `${getTranslation("age", language)} 10-12`, bg: "bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200/50 dark:border-sky-800/40" },
    "all": { text: getTranslation("allKids", language), bg: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200/50 dark:border-purple-800/40" },
  };

  const currentAge = ageGroupDetails[story.ageGroup] || ageGroupDetails["all"];

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      onClick={() => onSelect(story)}
      className="group relative flex flex-col h-full bg-white dark:bg-slate-850 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 cursor-pointer"
      id={`story-card-${story.id}`}
    >
      {/* Featured / AI / Offline Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex gap-1 flex-wrap">
        {story.isFeatured && (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500 text-white shadow-xs flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {getTranslation("featured", language)}
          </span>
        )}
        {story.id.startsWith("ai-") && (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-600 text-white shadow-xs flex items-center gap-1">
            ✨ {getTranslation("aiStory", language)}
          </span>
        )}
        {isOfflineAvailable && (
          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-xs flex items-center gap-1" title="Available offline">
            <Wifi className="w-3 h-3 text-emerald-100" /> {getTranslation("offline", language)}
          </span>
        )}
      </div>

      {/* Age Group Badge */}
      <span className={`absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-lg text-[10px] font-semibold backdrop-blur-xs ${currentAge.bg}`}>
        {currentAge.text}
      </span>

      {/* Cover Image Container */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0">
        <img
          src={story.coverImage}
          alt={story.titleEn}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300 ease-out"
          id={`story-card-img-${story.id}`}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-200" />
      </div>

      {/* Card Body */}
      <div className="flex flex-col flex-1 p-3.5 sm:p-4 justify-between gap-3">
        <div className="space-y-2">
          {/* Category & Reading Time */}
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 truncate font-semibold">
              <Tag className="w-3 h-3 shrink-0" />
              {story.category}
            </span>
            <span className="flex items-center gap-1 shrink-0 font-sans">
              <Clock className="w-3 h-3 shrink-0" />
              {story.readingTime} {getTranslation("minutes", language)}
            </span>
          </div>

          {/* Title */}
          {language === "ur" || language === "ar" ? (
            <div className="space-y-0.5">
              {story.titleUr && (
                <h3 className="text-base sm:text-lg font-urdu font-bold text-right text-emerald-700 dark:text-emerald-400 line-clamp-1 leading-relaxed" dir="rtl">
                  {story.titleUr}
                </h3>
              )}
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                {story.titleEn}
              </h4>
            </div>
          ) : (
            <div className="space-y-0.5">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                {story.titleEn}
              </h3>
              {story.titleUr && (
                <h4 className="text-xs font-urdu font-semibold text-right text-emerald-700 dark:text-emerald-400 line-clamp-1 leading-relaxed" dir="rtl">
                  {story.titleUr}
                </h4>
              )}
            </div>
          )}

          {/* Description */}
          <p className={`text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed ${
            language === "ur" && story.shortDescriptionUr ? "font-urdu text-right" : ""
          }`} dir={language === "ur" ? "rtl" : "ltr"}>
            {language === "ur" && story.shortDescriptionUr ? story.shortDescriptionUr : story.shortDescriptionEn}
          </p>
        </div>

        {/* Read Button */}
        <div className="pt-2 mt-auto">
          <div className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5">
            <span>{getTranslation("readStory", language)}</span>
            <span className="text-xs">&rarr;</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
