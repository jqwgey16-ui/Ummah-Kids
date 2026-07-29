import React from "react";
import { 
  ArrowLeft, ChevronRight, Home, BookOpen, Heart, Video, 
  Sparkles, Award, User, ShieldCheck, Search, HelpCircle, 
  BookMarked, Compass, Settings, Flame, Layers
} from "lucide-react";
import { motion } from "motion/react";
import { Language, getTranslation } from "../lib/translations";
import { Story } from "../types";

export interface BreadcrumbItem {
  label: string;
  labelUr?: string;
  view?: string;
  action?: () => void;
  active?: boolean;
}

interface NavigationHeaderProps {
  currentView: string;
  selectedStory?: Story | null;
  language?: Language;
  searchQuery?: string;
  activeSubTitle?: string; // Optional nested item e.g. "Surah Al-Fatihah", "Kindness", etc.
  onNavigate: (view: string) => void;
  onCustomBack?: () => void;
  actionButtons?: React.ReactNode;
}

export default function NavigationHeader({
  currentView,
  selectedStory,
  language = "en",
  searchQuery = "",
  activeSubTitle,
  onNavigate,
  onCustomBack,
  actionButtons
}: NavigationHeaderProps) {
  // Do not render navigation header on root home page unless search is active
  if (currentView === "home" && !searchQuery) {
    return null;
  }

  const isRTL = language === "ur" || language === "ar";

  // Handle Back Click logic
  const handleBack = () => {
    if (onCustomBack) {
      onCustomBack();
      return;
    }

    // Check if browser history has state
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      // Fallback timer check in case window.history.back() didn't change view
      setTimeout(() => {
        if (window.location.hash === `#${currentView}`) {
          if (currentView.startsWith("story:")) {
            onNavigate("stories");
          } else {
            onNavigate("home");
          }
        }
      }, 100);
    } else {
      // Safe fallback to Home or parent view
      if (currentView.startsWith("story:")) {
        onNavigate("stories");
      } else {
        onNavigate("home");
      }
    }
  };

  // Build breadcrumbs hierarchy based on view
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: getTranslation("home", language),
        view: "home"
      }
    ];

    if (currentView === "stories") {
      items.push({
        label: getTranslation("allStories", language),
        active: !searchQuery
      });
      if (searchQuery) {
        items.push({
          label: `${getTranslation("searchResults", language)}: "${searchQuery}"`,
          active: true
        });
      }
    } else if (selectedStory && currentView.startsWith("story:")) {
      items.push({
        label: getTranslation("allStories", language),
        view: "stories"
      });
      if (selectedStory.prophetName) {
        items.push({
          label: selectedStory.prophetName,
          view: "stories"
        });
      }
      const storyTitle = language === "ur" ? (selectedStory.titleUr || selectedStory.titleEn) : language === "ar" ? (selectedStory.titleAr || selectedStory.titleEn) : selectedStory.titleEn;
      items.push({
        label: storyTitle,
        active: true
      });
    } else if (currentView === "quran") {
      items.push({
        label: getTranslation("quranReader", language),
        active: !activeSubTitle,
        view: activeSubTitle ? "quran" : undefined
      });
      if (activeSubTitle) {
        items.push({
          label: activeSubTitle,
          active: true
        });
      }
    } else if (currentView === "teacher") {
      items.push({
        label: getTranslation("aiTeacher", language),
        active: true
      });
    } else if (currentView === "salah") {
      items.push({
        label: getTranslation("salahGuide", language),
        active: !activeSubTitle,
        view: activeSubTitle ? "salah" : undefined
      });
      if (activeSubTitle) {
        items.push({
          label: activeSubTitle,
          active: true
        });
      }
    } else if (currentView === "duas") {
      items.push({
        label: getTranslation("dailyDuas", language),
        active: !activeSubTitle,
        view: activeSubTitle ? "duas" : undefined
      });
      if (activeSubTitle) {
        items.push({
          label: activeSubTitle,
          active: true
        });
      }
    } else if (currentView === "hadiths") {
      items.push({
        label: getTranslation("hadithSection", language),
        active: !activeSubTitle,
        view: activeSubTitle ? "hadiths" : undefined
      });
      if (activeSubTitle) {
        items.push({
          label: activeSubTitle,
          active: true
        });
      }
    } else if (currentView === "videos") {
      items.push({
        label: getTranslation("islamicVideos", language),
        active: !activeSubTitle,
        view: activeSubTitle ? "videos" : undefined
      });
      if (activeSubTitle) {
        items.push({
          label: activeSubTitle,
          active: true
        });
      }
    } else if (currentView === "bookmarks") {
      items.push({
        label: getTranslation("myBookmarks", language),
        active: true
      });
    } else if (currentView === "parent-dashboard") {
      items.push({
        label: getTranslation("parentDashboard", language),
        active: true
      });
    } else if (currentView === "admin") {
      items.push({
        label: getTranslation("adminTitle", language),
        active: true
      });
    } else if (currentView === "kids-profiles") {
      items.push({
        label: getTranslation("kidsProfiles", language),
        active: true
      });
    } else if (currentView === "generator") {
      items.push({
        label: getTranslation("aiStoryTeller", language),
        active: true
      });
    } else if (currentView === "about") {
      items.push({
        label: getTranslation("aboutContact", language),
        active: true
      });
    } else if (currentView === "games") {
      items.push({
        label: getTranslation("games", language),
        active: true
      });
    } else if (currentView === "scholar") {
      items.push({
        label: getTranslation("askScholar", language),
        active: true
      });
    } else {
      items.push({
        label: currentView.toUpperCase(),
        active: true
      });
    }

    return items;
  };

  const breadcrumbs = getBreadcrumbs();

  // Get Page Title & Icon
  const getPageTitleInfo = () => {
    if (selectedStory && currentView.startsWith("story:")) {
      const storyTitle = language === "ur" ? (selectedStory.titleUr || selectedStory.titleEn) : language === "ar" ? (selectedStory.titleAr || selectedStory.titleEn) : selectedStory.titleEn;
      return {
        title: storyTitle,
        subtitle: selectedStory.prophetName ? `Prophet ${selectedStory.prophetName} (AS)` : selectedStory.category
      };
    }
    switch (currentView) {
      case "quran": return { title: getTranslation("quranTitle", language), subtitle: getTranslation("quranSubtitle", language) };
      case "stories": return { title: getTranslation("allStories", language), subtitle: searchQuery ? `${getTranslation("searchResults", language)}: "${searchQuery}"` : getTranslation("browseByProphets", language) };
      case "teacher": return { title: getTranslation("teacherTitle", language), subtitle: getTranslation("teacherSubtitle", language) };
      case "salah": return { title: getTranslation("salahTitle", language), subtitle: getTranslation("salahSubtitle", language) };
      case "duas": return { title: getTranslation("duasTitle", language), subtitle: getTranslation("duasSubtitle", language) };
      case "hadiths": return { title: getTranslation("hadithTitle", language), subtitle: getTranslation("hadithSubtitle", language) };
      case "videos": return { title: getTranslation("videosTitle", language), subtitle: getTranslation("videosSubtitle", language) };
      case "bookmarks": return { title: getTranslation("myBookmarks", language), subtitle: getTranslation("favoriteStories", language) };
      case "parent-dashboard": return { title: getTranslation("parentDashboard", language), subtitle: getTranslation("parentControlSuite", language) };
      case "admin": return { title: getTranslation("adminTitle", language), subtitle: getTranslation("adminSubtitle", language) };
      case "kids-profiles": return { title: getTranslation("kidsProfiles", language), subtitle: getTranslation("selectProfile", language) };
      case "generator": return { title: getTranslation("aiStoryTeller", language), subtitle: getTranslation("askAiStoryteller", language) };
      case "about": return { title: getTranslation("aboutContact", language), subtitle: getTranslation("aboutUs", language) };
      case "games": return { title: getTranslation("gamesTitle", language), subtitle: getTranslation("gamesSubtitle", language) };
      case "scholar": return { title: getTranslation("scholarTitle", language), subtitle: getTranslation("scholarSubtitle", language) };
      default: return { title: getTranslation("appName", language), subtitle: getTranslation("tagline", language) };
    }
  };

  const titleInfo = getPageTitleInfo();

  return (
    <motion.nav
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="sticky top-14 sm:top-20 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 shadow-2xs transition-all print:hidden"
      aria-label="Navigation Header Bar"
      id="site-navigation-header"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left Side: Back Button & Breadcrumbs Navigation */}
          <div className="flex items-center gap-2.5 sm:gap-4 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            
            {/* Professional Back Button */}
            <button
              onClick={handleBack}
              className="group relative flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white dark:bg-slate-800 dark:hover:bg-emerald-600 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 font-bold text-xs tracking-wide transition-all duration-150 cursor-pointer active:scale-95 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 shadow-2xs"
              aria-label="Go back to previous page"
              title="Go back to previous page"
              id="global-back-nav-btn"
            >
              <ArrowLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isRTL ? "rotate-180 group-hover:translate-x-0.5" : "group-hover:-translate-x-0.5"
              }`} />
              <span>{language === "ur" ? "واپس" : "Back"}</span>
            </button>

            {/* Vertical Divider */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

            {/* Breadcrumb Trail */}
            <ol 
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap overflow-x-auto no-scrollbar"
              aria-label="Breadcrumb"
            >
              {breadcrumbs.map((item, index) => {
                const isLast = index === breadcrumbs.length - 1 || item.active;
                return (
                  <li key={index} className="flex items-center gap-1.5 shrink-0">
                    {index > 0 && (
                      <ChevronRight className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-600 shrink-0 ${isRTL ? "rotate-180" : ""}`} />
                    )}

                    {isLast ? (
                      <span 
                        className="font-extrabold text-slate-900 dark:text-emerald-400 max-w-[180px] sm:max-w-[280px] truncate"
                        aria-current="page"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          if (item.action) {
                            item.action();
                          } else if (item.view) {
                            onNavigate(item.view);
                          }
                        }}
                        className="font-semibold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 rounded px-1 py-0.5 cursor-pointer max-w-[140px] truncate"
                      >
                        {item.label}
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Right Side: Page Subtitle / Action Area */}
          <div className="hidden md:flex items-center gap-2 text-right shrink-0">
            {actionButtons ? (
              actionButtons
            ) : (
              <div className="text-right">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 max-w-[260px] truncate">
                  {titleInfo.title}
                </div>
                {titleInfo.subtitle && (
                  <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 truncate">
                    {titleInfo.subtitle}
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </motion.nav>
  );
}
