import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Sparkles, ChevronRight, ChevronLeft, X, Check, BookOpen, 
  HelpCircle, Compass, Star, Award, Heart, Search, Globe, 
  Video, ShieldCheck, CheckCircle2, RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export interface TourStep {
  id: string;
  targetSelector: string | null;
  viewName?: string;
  title: string;
  subtitle?: string;
  description: string;
  bullets?: string[];
  icon: React.ElementType;
  accentColor: string; // Tailwind class like "from-emerald-500 to-teal-600"
  badgeText: string;
  positionPreference?: "bottom" | "top" | "left" | "right" | "center";
}

interface OnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: string) => void;
  language?: "en" | "ur" | "ar";
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    targetSelector: "#logo-container",
    viewName: "home",
    title: "Welcome to Ummah Kids",
    subtitle: "by Inaamullah",
    description: "Discover authentic Islamic stories, Quran, Hadith, Duas, and educational content for children in a safe, fun, and interactive environment.",
    bullets: [
      "Authentic content based on Quran & Sahih Hadith",
      "Kid-friendly audio narration & multi-language support",
      "Interactive quizzes, badges, and progress tracking"
    ],
    icon: Sparkles,
    accentColor: "from-emerald-500 to-amber-500",
    badgeText: "Step 1 of 10",
    positionPreference: "bottom"
  },
  {
    id: "stories",
    targetSelector: "#nav-stories",
    viewName: "stories",
    title: "Islamic Stories for Kids",
    subtitle: "Prophets, Sahaba & Moral Tales",
    description: "Children can read and listen to beautiful authentic stories about the Prophets of Allah, Quranic miracles, courageous companions, and noble Islamic morals.",
    bullets: [
      "Full audio playback with sentence highlighting",
      "Moral lessons & interactive comprehension quizzes",
      "Age-based filtering and Prophet story index"
    ],
    icon: BookOpen,
    accentColor: "from-amber-500 to-orange-500",
    badgeText: "Step 2 of 10",
    positionPreference: "bottom"
  },
  {
    id: "quran",
    targetSelector: "#nav-learn",
    viewName: "quran",
    title: "Noble Quran Reader",
    subtitle: "Read & Listen to Surahs",
    description: "Read, listen, and memorize the Holy Quran with crystal-clear audio recitation, word translation, and verse bookmarks.",
    bullets: [
      "Choose your favorite World-Renowned Reciter",
      "Auto Play verse-by-verse recitation",
      "Instant bookmarking for daily revision",
      "Side-by-side English & Urdu translations"
    ],
    icon: Star,
    accentColor: "from-emerald-600 to-teal-500",
    badgeText: "Step 3 of 10",
    positionPreference: "bottom"
  },
  {
    id: "teacher",
    targetSelector: "#nav-teacher",
    viewName: "teacher",
    title: "Islamic AI Teacher",
    subtitle: "Ask Any Question About Islam",
    description: "Children and parents can ask questions about Islamic teachings, Salah, Prophets, or manners and receive clear, gentle answers.",
    bullets: [
      "Grounded in authentic Quran & Sahih Hadith sources",
      "Child-safe language and friendly explanations",
      "Voice conversation & audio response mode"
    ],
    icon: HelpCircle,
    accentColor: "from-indigo-500 to-purple-600",
    badgeText: "Step 4 of 10",
    positionPreference: "bottom"
  },
  {
    id: "learn",
    targetSelector: "#nav-learn",
    viewName: "salah",
    title: "Learn Salah, Duas & Hadith",
    subtitle: "Step-by-Step Interactive Guides",
    description: "Master daily Islamic practices with our step-by-step Salah guide, authentic daily supplications (Duas), and short kid-friendly Hadiths.",
    bullets: [
      "Step-by-step Salah posture & recitation guide",
      "Daily Masnoon Duas with audio pronunciation",
      "Printable worksheets & interactive coloring studio"
    ],
    icon: Compass,
    accentColor: "from-teal-500 to-emerald-600",
    badgeText: "Step 5 of 10",
    positionPreference: "bottom"
  },
  {
    id: "videos",
    targetSelector: "#nav-videos",
    viewName: "videos",
    title: "Islamic Educational Videos",
    subtitle: "Vetted & Safe Animated Series",
    description: "Watch high-quality Islamic animated videos and series carefully curated for children's moral and spiritual development.",
    bullets: [
      "Curated by categories: Prophet Stories, Manners & Seerah",
      "Safe ad-free video player for peace of mind",
      "Interactive video notes and series playlist"
    ],
    icon: Video,
    accentColor: "from-rose-500 to-amber-500",
    badgeText: "Step 6 of 10",
    positionPreference: "bottom"
  },
  {
    id: "bookmarks",
    targetSelector: "#header-bookmark-btn",
    viewName: "bookmarks",
    title: "Your Personal Bookmarks",
    subtitle: "Save Favorite Content",
    description: "Save your favorite stories, Quranic Ayahs, Duas, and Hadiths with one tap to quickly revisit them offline or online.",
    bullets: [
      "One-click bookmarking across all app sections",
      "Offline caching for reading without internet",
      "Organized library view for quick study"
    ],
    icon: Heart,
    accentColor: "from-rose-500 to-pink-600",
    badgeText: "Step 7 of 10",
    positionPreference: "bottom"
  },
  {
    id: "search",
    targetSelector: "#search-toggle-btn",
    viewName: "home",
    title: "Universal Smart Search",
    subtitle: "Find Anything Instantly",
    description: "Search by Prophet name, Surah number, story title, moral value, or keyword in both English and Urdu (اردو).",
    bullets: [
      "Supports English and Urdu text search",
      "Instant filtering across stories, Duas & Hadith",
      "Prophet and age-level filter shortcuts"
    ],
    icon: Search,
    accentColor: "from-blue-500 to-indigo-600",
    badgeText: "Step 8 of 10",
    positionPreference: "bottom"
  },
  {
    id: "language",
    targetSelector: "#language-toggle-btn",
    viewName: "home",
    title: "Multi-Language Switching",
    subtitle: "English, Urdu & Arabic",
    description: "Easily switch the entire application between English, Urdu (اردو), and Arabic (العربية) at any time.",
    bullets: [
      "Full RTL (Right-To-Left) layout support",
      "Urdu fonts (Nastaliq style) for easy reading",
      "Authentic Arabic text with Tajweed-friendly script"
    ],
    icon: Globe,
    accentColor: "from-emerald-500 to-teal-600",
    badgeText: "Step 9 of 10",
    positionPreference: "bottom"
  },
  {
    id: "finish",
    targetSelector: null,
    viewName: "home",
    title: "You're Ready to Explore!",
    subtitle: "Bismillah & Welcome Aboard",
    description: "May your journey in learning authentic Islamic knowledge, reading stories, and earning rewards be filled with barakah and joy!",
    bullets: [
      "Read daily stories & earn golden badges",
      "Track points on your Kid Profile dashboard",
      "Restart this tour anytime from the Settings menu"
    ],
    icon: Award,
    accentColor: "from-amber-400 via-emerald-500 to-teal-600",
    badgeText: "Step 10 of 10",
    positionPreference: "center"
  }
];

export default function OnboardingTour({
  isOpen,
  onClose,
  onNavigate,
  language = "en"
}: OnboardingTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Measure and update target element rect
  const updateTargetRect = useCallback(() => {
    if (!step || !step.targetSelector) {
      setTargetRect(null);
      return;
    }

    const el = document.querySelector(step.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      // Fallback if element not rendered on page
      setTargetRect(null);
    }
  }, [step]);

  // Navigate view and re-measure target element when step changes
  useEffect(() => {
    if (!isOpen || !step) return;

    if (step.viewName) {
      onNavigate(step.viewName);
    }

    // Scroll element into view if present
    const timer = setTimeout(() => {
      if (step.targetSelector) {
        const el = document.querySelector(step.targetSelector);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
        }
      }
      updateTargetRect();
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, currentStepIndex, step, onNavigate, updateTargetRect]);

  // Handle window scroll & resize events
  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => updateTargetRect();
    const handleScroll = () => updateTargetRect();

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, updateTargetRect]);

  // Next / Prev step navigation handlers
  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    try {
      localStorage.setItem("islamic_kids_tour_completed", "true");
    } catch (e) {
      console.warn("Could not save tour completion to localStorage", e);
    }
    onClose();
  };

  // Keyboard accessibility listeners (ESC, Right, Left, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleSkip();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen || !step) return null;

  // Calculate Tooltip position smoothly to fit within viewport
  let tooltipStyle: React.CSSProperties = {};
  const isCenter = !targetRect || step.positionPreference === "center";

  if (isCenter) {
    tooltipStyle = {
      position: "fixed",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      zIndex: 9999,
      maxWidth: "calc(100vw - 32px)",
      width: "480px"
    };
  } else if (targetRect) {
    const padding = 12;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const tooltipWidth = Math.min(420, viewportWidth - 32);

    let top = targetRect.bottom + padding;
    let left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;

    // Flip to top if not enough space below
    if (top + 260 > viewportHeight) {
      top = Math.max(16, targetRect.top - 260 - padding);
    }

    // Clamp horizontal positioning inside screen
    left = Math.max(16, Math.min(left, viewportWidth - tooltipWidth - 16));

    tooltipStyle = {
      position: "fixed",
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 9999
    };
  }

  const StepIcon = step.icon;
  const isLastStep = currentStepIndex === TOUR_STEPS.length - 1;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9990] overflow-hidden select-none font-sans" role="dialog" aria-modal="true">
        
        {/* Darkened Dimmed Backdrop with Spotlight Cutout */}
        <svg className="absolute inset-0 w-full h-full pointer-events-auto">
          <defs>
            <mask id="tour-spotlight-mask">
              {/* White background renders mask visible */}
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {/* Black cutout creates transparent spotlight over target */}
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(15, 23, 42, 0.82)"
            mask="url(#tour-spotlight-mask)"
            onClick={handleSkip}
          />
        </svg>

        {/* Animated Spotlight Glowing Ring over Target Element */}
        {targetRect && (
          <motion.div
            initial={false}
            animate={{
              x: targetRect.left - 8,
              y: targetRect.top - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
            className="fixed pointer-events-none z-[9995] rounded-2xl border-2 border-emerald-400 shadow-[0_0_25px_rgba(52,211,153,0.7)]"
          >
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </motion.div>
        )}

        {/* Tooltip Card */}
        <motion.div
          key={step.id}
          ref={tooltipRef}
          initial={{ opacity: 0, scale: 0.92, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          style={tooltipStyle}
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl z-[9999] pointer-events-auto flex flex-col gap-4 text-left"
        >
          {/* Header Row: Progress Bar & Badge & Close */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {step.badgeText}
              </span>

              <button
                onClick={handleSkip}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                title="Skip Tour (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Visual Step Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${((currentStepIndex + 1) / TOUR_STEPS.length) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full"
              />
            </div>
          </div>

          {/* Body Content */}
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${step.accentColor} flex items-center justify-center text-white shadow-md shrink-0 mt-0.5`}>
              <StepIcon className="w-6 h-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-black text-slate-850 dark:text-slate-100 leading-snug">
                {step.title}
              </h3>
              {step.subtitle && (
                <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {step.subtitle}
                </p>
              )}
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {step.description}
              </p>

              {/* Bullet list */}
              {step.bullets && step.bullets.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {step.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Footer Controls Row */}
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3.5 mt-1">
            <button
              onClick={handleSkip}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer px-2 py-1"
            >
              Skip Tour
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-200 dark:shadow-none transition-all cursor-pointer transform active:scale-95"
              >
                <span>{isLastStep ? "Start Exploring" : "Next"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
