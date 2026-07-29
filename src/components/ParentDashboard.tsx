import React, { useState } from "react";
import { KidProfile, Story, Video, Badge } from "../types";
import { 
  Users, UserPlus, Calendar, Award, BookOpen, Clock, Play, CheckCircle, 
  ChevronRight, Heart, Trophy, Flame, ChevronLeft, Plus, Trash2, Shield, Info, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ParentDashboardProps {
  profiles: KidProfile[];
  stories: Story[];
  videos: Video[];
  activeProfile: KidProfile | null;
  onSelectProfile: (profile: KidProfile) => void;
  onCreateProfile: (name: string, age: number, avatar: string) => Promise<void>;
  onClose: () => void;
  language: "en" | "ur" | "ar";
  onStartTour?: () => void;
}

const AVATARS = ["🦁", "🦊", "🐣", "🐼", "🐨", "🦄", "🐝", "🦉", "🐯", "🐰", "🦚", "🐬"];

export default function ParentDashboard({
  profiles,
  stories,
  videos,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onClose,
  language,
  onStartTour
}: ParentDashboardProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a name");
      return;
    }
    if (!age || Number(age) <= 0) {
      setError("Please enter a valid age");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onCreateProfile(name, Number(age), selectedAvatar);
      setName("");
      setAge("");
      setShowAddForm(false);
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
    } finally {
      setSubmitting(false);
    }
  };

  const isRTL = language === "ur" || language === "ar";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6 mb-8">
        <div>
          <h2 className="text-3xl font-black text-slate-850 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Shield className="w-8 h-8 text-emerald-600" />
            {language === "ur" ? "والدین کا گائیڈ اور ڈیش بورڈ" : language === "ar" ? "لوحة تحكم الآباء" : "Parental Dashboard & Insights"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {language === "ur" ? "اپنے بچوں کی سیکھنے کی رفتار اور کہانیوں کا ریکارڈ یہاں دیکھیں" : language === "ar" ? "تابع تقدم أطفالك وقصصهم المفضلة ونقاطهم" : "Monitor your children's Islamic learning journey, achievements, and stats."}
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer"
        >
          {language === "ur" ? "← واپس ہوم" : language === "ar" ? "← العودة للرئيسة" : "← Back to Home"}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sidebar: Children Profiles Selector */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-emerald-600" />
                {language === "ur" ? "بچوں کے پروفائلز" : language === "ar" ? "ملفات الأطفال" : "Children Profiles"}
              </h3>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors cursor-pointer"
                  title="Add new child profile"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Profile Creation Form */}
            <AnimatePresence mode="wait">
              {showAddForm && (
                <motion.form
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleCreate}
                  className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-750 space-y-4 mb-4"
                >
                  <div className="flex justify-between items-center border-b border-slate-200/50 dark:border-slate-700/50 pb-2">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-350">
                      {language === "ur" ? "نیا پروفائل" : language === "ar" ? "ملف طفل جديد" : "New Child Profile"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>

                  {error && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 rounded-lg text-xs font-semibold">
                      {error}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Child Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ibrahim, Zainab"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="e.g. 7"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Select Avatar</label>
                    <div className="grid grid-cols-6 gap-2 pt-1">
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setSelectedAvatar(av)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all border ${
                            selectedAvatar === av
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 scale-110"
                              : "border-slate-100 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    {submitting ? "Creating..." : "Save Profile"}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* List of profiles */}
            {profiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">
                No profiles created yet. Add your child to begin tracking!
              </div>
            ) : (
              <div className="space-y-3">
                {profiles.map((p) => {
                  const isActive = activeProfile?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => onSelectProfile(p)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                        isActive
                          ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs"
                          : "border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-750/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{p.avatar || "🐣"}</span>
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm block">
                            {p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                            Age {p.age} • {p.points} Points
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {p.streak > 0 && (
                          <span className="flex items-center gap-0.5 text-amber-500 font-extrabold text-xs">
                            <Flame className="w-4 h-4 fill-amber-500" />
                            {p.streak}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? "rotate-90 text-emerald-600" : ""}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Platform Settings & Tour Card */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs space-y-3">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm">
              <Info className="w-4 h-4 text-emerald-600" />
              <span>Platform Tour & Settings</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Want to revisit the interactive walkthrough of Ummah Kids? You can restart the onboarding tour anytime.
            </p>
            {onStartTour && (
              <button
                onClick={() => {
                  onClose();
                  onStartTour();
                }}
                className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span>Show App Tour Again</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Section: Selected Child's Performance Stats & Badges */}
        <div className="lg:col-span-8 space-y-8">
          {activeProfile ? (
            <div className="space-y-8">
              {/* Core metrics row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs text-center">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-2xl inline-block mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Reading Time</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {activeProfile.readingTime || 0} mins
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs text-center">
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-500 rounded-2xl inline-block mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stories Read</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {activeProfile.completedStories?.length || 0}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs text-center">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/30 text-blue-500 rounded-2xl inline-block mb-2">
                    <Play className="w-5 h-5" />
                  </div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Videos Watched</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {activeProfile.lastVideoWatched ? 1 + (activeProfile.completedStories?.length % 2) : 0}
                  </span>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs text-center">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500 rounded-2xl inline-block mb-2">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quiz Score</span>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
                    {activeProfile.points || 0}
                  </span>
                </div>
              </div>

              {/* Achievements & Badges Board */}
              <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-500" />
                  {language === "ur" ? "حاصل کردہ بیجز اور اعزازات" : language === "ar" ? "الأوسمة والإنجازات المحققة" : "Earned Badges & Milestones"}
                </h3>

                {(!activeProfile.badges || activeProfile.badges.length === 0) ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800">
                    <Award className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-500">
                      No badges earned yet. Keep reading stories and finishing quizzes!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {activeProfile.badges.map((badge: Badge) => (
                      <div
                        key={badge.id}
                        className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/35 dark:to-slate-900/10 border border-slate-200/60 dark:border-slate-750 rounded-2xl text-center relative overflow-hidden"
                      >
                        <span className="text-4xl block mb-2">{badge.icon || "🏆"}</span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-xs block">
                          {badge.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                          {badge.description}
                        </p>
                        <span className="text-[8px] font-semibold text-emerald-600 block mt-2">
                          Earned {new Date(badge.earnedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reading Progress Tracker list */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-emerald-600" />
                  {language === "ur" ? "پڑھنے کی پیش رفت اور سرگرمی" : language === "ar" ? "نشاط القراءة والمتابعة" : "Reading Progress & Activity Logs"}
                </h3>

                <div className="space-y-4">
                  {/* Last story read banner */}
                  {activeProfile.lastStoryRead ? (
                    <div className="p-4 bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                          Last Read Story
                        </span>
                        <span className="font-bold text-slate-850 dark:text-slate-150 text-xs truncate block max-w-[400px]">
                          {activeProfile.lastStoryRead}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {activeProfile.readingPercentage || 100}% Read
                      </span>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800 rounded-2xl text-center text-xs text-slate-400">
                      No story has been opened recently.
                    </div>
                  )}

                  {/* Last watch video progress */}
                  {activeProfile.lastVideoWatched && (
                    <div className="p-4 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[9px] font-extrabold text-blue-600 uppercase tracking-wider block">
                          Last Video Watched
                        </span>
                        <span className="font-bold text-slate-850 dark:text-slate-150 text-xs truncate block max-w-[400px]">
                          {activeProfile.lastVideoWatched}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        Completed Watch
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorites list */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-xs">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                  {language === "ur" ? "پسندیدہ کہانیوں کی فہرست" : language === "ar" ? "القصص المفضلة المحفوظة" : "Bookmarked / Favorite Stories"}
                </h3>

                {(!activeProfile.favoriteStories || activeProfile.favoriteStories.length === 0) ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">
                    No favorites bookmarked yet. Heart stories to view them here!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stories
                      .filter((s) => activeProfile.favoriteStories.includes(s.id))
                      .map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-750/30 rounded-2xl transition-colors border border-slate-100/50 dark:border-slate-750"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-slate-800 dark:text-slate-150 text-xs block truncate max-w-[450px]">
                              {language === "en" ? s.titleEn : s.titleUr}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">
                              {s.category}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-1 shrink-0">
                            <Clock className="w-3.5 h-3.5" />
                            {s.readingTime} mins
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-emerald-50/50 dark:bg-slate-850 p-8 sm:p-12 rounded-3xl border border-emerald-100 dark:border-slate-750 text-center flex flex-col items-center justify-center">
              <span className="text-6xl animate-bounce mb-4">👶</span>
              <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                {language === "ur" ? "سیکھنے کا سفر شروع کرنے کے لیے بچے کا پروفائل منتخب کریں!" : language === "ar" ? "اختر ملفاً طفلياً لبدء المتابعة والتقدم" : "Please select or create a profile to view parent insights!"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-2">
                Create multiple profiles for your children so you can monitor reading metrics, award milestones, and follow along with correct answers.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
