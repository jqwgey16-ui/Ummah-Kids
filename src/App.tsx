import React, { useState, useEffect, FormEvent } from "react";
import { 
  Sparkles, Award, Bookmark, Heart, ChevronRight, BookOpen, 
  User, CheckCircle, Flame, Star, ShieldAlert, ArrowUpRight, 
  Filter, Tag, Calendar, Mail, Compass, HelpCircle, ShieldCheck,
  Clock, Search, Users
} from "lucide-react";
import { Story, UserProgress, KidProfile, Badge } from "./types";
import Header from "./components/Header";
import StoryCard from "./components/StoryCard";
import StoryPage from "./components/StoryPage";
import AiStoryGenerator from "./components/AiStoryGenerator";
import AdminPanel from "./components/AdminPanel";
import AboutContact from "./components/AboutContact";
import DailyInspirations from "./components/DailyInspirations";
import DailyHadith from "./components/DailyHadith";
import VideoSection from "./components/VideoSection";
import ParentDashboard from "./components/ParentDashboard";
import KidProfileSelector from "./components/KidProfileSelector";
import AuthModal from "./components/AuthModal";
import AiTeacher from "./components/AiTeacher";
import QuranSection from "./components/QuranSection";
import SalahSection from "./components/SalahSection";
import DuaSection from "./components/DuaSection";
import HadithSection from "./components/HadithSection";
import GamesSection from "./components/GamesSection";
import AskScholar from "./components/AskScholar";
import OnboardingTour from "./components/OnboardingTour";
import WelcomeScreen from "./components/WelcomeScreen";
import NavigationHeader from "./components/NavigationHeader";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import { translations, getTranslation, Language } from "./lib/translations";
import { motion, AnimatePresence } from "motion/react";
import { saveStoryOffline, getOfflineStoryIds, getOfflineStories } from "./lib/offlineDb";

export default function App() {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>("home");
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);

  // First-time User Onboarding Tour State
  const [tourOpen, setTourOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      const completed = localStorage.getItem("islamic_kids_tour_completed");
      if (!completed) {
        const timer = setTimeout(() => {
          setTourOpen(true);
        }, 700);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.warn("Could not read localStorage tour status", e);
    }
  }, []);

  const handleRestartTour = () => {
    try {
      localStorage.removeItem("islamic_kids_tour_completed");
    } catch (e) {}
    setTourOpen(true);
  };

  // Stories Data State
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Admin Token State
  const [adminToken, setAdminToken] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeAgeFilter, setActiveAgeFilter] = useState<string>("all");
  const [activeProphetFilter, setActiveProphetFilter] = useState<string>("all");
  const [searchField, setSearchField] = useState<string>("all"); // "all", "title", "prophet", "category", "moral"
  const [activeQuickPill, setActiveQuickPill] = useState<string>("stories");
  const [isSyncingSearch, setIsSyncingSearch] = useState<boolean>(false);

  // Background Firestore query / sync on typing
  useEffect(() => {
    if (searchQuery !== "") {
      const syncOnSearch = async () => {
        try {
          setIsSyncingSearch(true);
          const res = await fetch("/api/stories?isAdmin=true");
          if (res.ok) {
            const data = await res.json();
            setStories(data);
          }
        } catch (error) {
          console.error("Error syncing on search:", error);
        } finally {
          setIsSyncingSearch(false);
        }
      };

      const timer = setTimeout(() => {
        syncOnSearch();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  // Newsletter email
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Multi-Language State (English, Urdu, Arabic)
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("islamic_kids_language");
    return (saved as Language) || "en";
  });

  useEffect(() => {
    localStorage.setItem("islamic_kids_language", language);
    const dir = (language === "ur" || language === "ar") ? "rtl" : "ltr";
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  // User Accounts & Kids Profiles State
  const [parentUser, setParentUser] = useState<any>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [isGuest, setIsGuest] = useState<boolean>(() => {
    try {
      return localStorage.getItem("islamic_kids_guest_mode") === "true";
    } catch (e) {
      return false;
    }
  });
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [kidProfiles, setKidProfiles] = useState<KidProfile[]>([]);
  const [activeKidProfile, setActiveKidProfile] = useState<KidProfile | null>(null);

  // Load and monitor Firebase Auth state & Profiles
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthChecking(false);
      if (user) {
        setParentUser(user);
        setIsGuest(false);
        try {
          localStorage.removeItem("islamic_kids_guest_mode");
        } catch (e) {}
        try {
          const idToken = await user.getIdToken();
          const res = await fetch("/api/profiles", {
            headers: {
              Authorization: `Bearer ${idToken}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setKidProfiles(data);
            
            const savedKidId = localStorage.getItem(`active_kid_profile_${user.uid}`);
            if (savedKidId) {
              const matched = data.find((p: any) => p.id === savedKidId);
              if (matched) {
                setActiveKidProfile(matched);
              } else if (data.length > 0) {
                setActiveKidProfile(data[0]);
              }
            } else if (data.length > 0) {
              setActiveKidProfile(data[0]);
            }
          }
        } catch (err) {
          console.error("Error loading kid profiles:", err);
        }
      } else {
        setParentUser(null);
        setKidProfiles([]);
        setActiveKidProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleContinueAsGuest = () => {
    setIsGuest(true);
    try {
      localStorage.setItem("islamic_kids_guest_mode", "true");
    } catch (e) {}
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setIsGuest(false);
    try {
      localStorage.removeItem("islamic_kids_guest_mode");
    } catch (e) {}
  };

  // Save active child profile ID when changed
  const handleSelectKidProfile = (p: KidProfile) => {
    setActiveKidProfile(p);
    if (parentUser) {
      localStorage.setItem(`active_kid_profile_${parentUser.uid}`, p.id);
    }
  };

  // Create kid profile helper
  const handleCreateKidProfile = async (name: string, age: number, avatar: string) => {
    if (!parentUser) return;
    try {
      const idToken = await parentUser.getIdToken();
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({ name, age, avatar })
      });
      if (res.ok) {
        const newProfile = await res.json();
        setKidProfiles(prev => [...prev, newProfile]);
        if (!activeKidProfile) {
          setActiveKidProfile(newProfile);
        }
      } else {
        const err = await res.json();
        throw new Error(err.error || "Failed to create profile");
      }
    } catch (err) {
      console.error("Error creating kid profile:", err);
      throw err;
    }
  };

  // Helper to sync updated kid profile to server
  const syncKidProfileUpdate = async (updated: KidProfile) => {
    if (!parentUser) return;
    try {
      const idToken = await parentUser.getIdToken();
      await fetch(`/api/profiles/${updated.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error("Failed to sync profile update to server:", err);
    }
  };

  // User Progress and Gamification (Saved in LocalStorage)
  const [userProgress, setUserProgress] = useState<UserProgress>(() => {
    const saved = localStorage.getItem("islamic_kids_progress");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      completedStories: [],
      quizScores: {},
      bookmarkedStories: [],
      points: 0,
    };
  });

  // Dark/Light Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("islamic_kids_theme");
    if (saved) {
      return saved === "dark";
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Offline Stories State
  const [offlineStoryIds, setOfflineStoryIds] = useState<string[]>([]);

  // Load and subscribe to offline stories
  useEffect(() => {
    const updateOfflineStories = async () => {
      try {
        const ids = await getOfflineStoryIds();
        setOfflineStoryIds(ids);
      } catch (err) {
        console.error("Error updating offline story list:", err);
      }
    };

    updateOfflineStories();

    window.addEventListener("offline-stories-updated", updateOfflineStories);
    return () => {
      window.removeEventListener("offline-stories-updated", updateOfflineStories);
    };
  }, []);

  // Fetch stories on load
  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/stories?isAdmin=true");
      if (res.ok) {
        const data = await res.json();
        setStories(data);
      } else {
        throw new Error("Server responded with an error status.");
      }
    } catch (error) {
      console.warn("[Offline Fallback] Network request failed. Loading stories from offline cache:", error);
      try {
        const cachedStories = await getOfflineStories();
        if (cachedStories.length > 0) {
          setStories(cachedStories);
        }
      } catch (dbErr) {
        console.error("Failed to fetch stories from offline cache:", dbErr);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync custom local admin token state globally
  useEffect(() => {
    const verifyAdminToken = async () => {
      const storedToken = localStorage.getItem("admin_token");
      if (storedToken) {
        try {
          const res = await fetch("/api/admin/me", {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          });
          if (res.ok) {
            setAdminToken(storedToken);
            return;
          } else {
            localStorage.removeItem("admin_token");
          }
        } catch (err) {
          console.warn("Could not verify custom admin token in App:", err);
          localStorage.removeItem("admin_token");
        }
      }

      if (parentUser) {
        try {
          const idToken = await parentUser.getIdToken();
          const res = await fetch("/api/admin/me", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          if (res.ok) {
            setAdminToken(idToken);
            return;
          }
        } catch (err) {
          console.warn("Could not verify Firebase admin token in App:", err);
        }
      }

      setAdminToken(null);
    };

    verifyAdminToken();

    // Listen for custom authentication changes and cross-tab updates
    const handleAuthChange = () => {
      verifyAdminToken();
    };

    window.addEventListener("admin-auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("admin-auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [parentUser]);

  useEffect(() => {
    fetchStories();
  }, []);

  // Save progress to localstorage
  useEffect(() => {
    localStorage.setItem("islamic_kids_progress", JSON.stringify(userProgress));
  }, [userProgress]);

  // Apply dark class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("islamic_kids_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("islamic_kids_theme", "light");
    }
  }, [darkMode]);

  // Hash Routing Synchronization & Clean URL loading
  useEffect(() => {
    if (loading || stories.length === 0) return;

    const handleHashChange = () => {
      const hash = window.location.hash;
      console.log("[Hash Router] Hash changed to:", hash);
      if (!hash || hash === "" || hash === "#" || hash === "#home") {
        setCurrentView("home");
        setSelectedStory(null);
      } else if (hash === "#stories") {
        setCurrentView("stories");
        setSelectedStory(null);
      } else if (hash === "#bookmarks") {
        setCurrentView("bookmarks");
        setSelectedStory(null);
      } else if (hash === "#generator") {
        setCurrentView("generator");
        setSelectedStory(null);
      } else if (hash === "#about") {
        setCurrentView("about");
        setSelectedStory(null);
      } else if (hash === "#videos") {
        setCurrentView("videos");
        setSelectedStory(null);
      } else if (hash === "#admin") {
        setCurrentView("admin");
        setSelectedStory(null);
      } else if (hash === "#parent-dashboard") {
        setCurrentView("parent-dashboard");
        setSelectedStory(null);
      } else if (hash === "#kids-profiles") {
        setCurrentView("kids-profiles");
        setSelectedStory(null);
      } else if (hash === "#teacher") {
        setCurrentView("teacher");
        setSelectedStory(null);
      } else if (hash === "#quran") {
        setCurrentView("quran");
        setSelectedStory(null);
      } else if (hash === "#salah") {
        setCurrentView("salah");
        setSelectedStory(null);
      } else if (hash === "#duas") {
        setCurrentView("duas");
        setSelectedStory(null);
      } else if (hash === "#hadiths") {
        setCurrentView("hadiths");
        setSelectedStory(null);
      } else if (hash === "#games") {
        setCurrentView("games");
        setSelectedStory(null);
      } else if (hash === "#scholar") {
        setCurrentView("scholar");
        setSelectedStory(null);
      } else if (hash.startsWith("#story:")) {
        const slug = hash.replace("#story:", "");
        const matched = stories.find(s => s.slug === slug);
        if (matched) {
          setSelectedStory(matched);
          setCurrentView(`story:${slug}`);
        } else {
          setCurrentView("404");
          setSelectedStory(null);
        }
      } else {
        setCurrentView("404");
        setSelectedStory(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    
    // Run on initial story load completion
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [loading, stories]);

  // Update hash when currentView is changed programmatically
  useEffect(() => {
    if (loading) return;
    
    let expectedHash = "";
    if (currentView === "home") {
      expectedHash = "#home";
    } else if (currentView === "stories") {
      expectedHash = "#stories";
    } else if (currentView === "bookmarks") {
      expectedHash = "#bookmarks";
    } else if (currentView === "generator") {
      expectedHash = "#generator";
    } else if (currentView === "about") {
      expectedHash = "#about";
    } else if (currentView === "videos") {
      expectedHash = "#videos";
    } else if (currentView === "admin") {
      expectedHash = "#admin";
    } else if (currentView === "parent-dashboard") {
      expectedHash = "#parent-dashboard";
    } else if (currentView === "kids-profiles") {
      expectedHash = "#kids-profiles";
    } else if (currentView === "teacher") {
      expectedHash = "#teacher";
    } else if (currentView === "quran") {
      expectedHash = "#quran";
    } else if (currentView === "salah") {
      expectedHash = "#salah";
    } else if (currentView === "duas") {
      expectedHash = "#duas";
    } else if (currentView === "hadiths") {
      expectedHash = "#hadiths";
    } else if (currentView === "games") {
      expectedHash = "#games";
    } else if (currentView === "scholar") {
      expectedHash = "#scholar";
    } else if (currentView.startsWith("story:")) {
      const slug = currentView.replace("story:", "");
      expectedHash = `#story:${slug}`;
    } else if (currentView === "404") {
      expectedHash = "#404";
    }

    if (expectedHash && window.location.hash !== expectedHash) {
      window.location.hash = expectedHash;
    }
  }, [currentView, loading]);

  // Complete Dynamic SEO & Meta Tags Manager (Open Graph, Twitter, and Schema.org JSON-LD structured data)
  useEffect(() => {
    let title = "Ummah Kids - Authentic Islamic Learning for Children & Families";
    let desc = "Welcome to Ummah Kids, an authentic Islamic learning platform where children and families can explore the Quran, Prophets' Stories, Hadith, Daily Duas, Salah, Islamic Videos and an AI Islamic Teacher in a safe, beautiful and interactive environment.";
    let canonical = window.location.origin + "/#home";
    let ogImage = "https://images.unsplash.com/photo-1542856391-010fb87dcfed?auto=format&fit=crop&q=80&w=800";
    let schemaList: any[] = [];

    const origin = window.location.origin;

    if (selectedStory && currentView.startsWith("story:")) {
      title = selectedStory.seoMetaTitle || `${selectedStory.titleEn} - Ummah Kids`;
      desc = selectedStory.seoMetaDescription || selectedStory.shortDescriptionEn;
      canonical = `${origin}/#story:${selectedStory.slug}`;
      ogImage = selectedStory.coverImage;

      // Schema.org Article Schema
      schemaList.push({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": selectedStory.titleEn,
        "alternativeHeadline": selectedStory.titleUr,
        "image": selectedStory.coverImage,
        "author": {
          "@type": "Organization",
          "name": selectedStory.author || "Ummah Kids Editorial Board"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Ummah Kids",
          "logo": {
            "@type": "ImageObject",
            "url": `${origin}/assets/logo.png`
          }
        },
        "genre": selectedStory.category,
        "keywords": (selectedStory.tags || []).join(", "),
        "wordcount": selectedStory.contentEn.split(/\s+/).length,
        "url": canonical,
        "datePublished": selectedStory.createdAt || new Date().toISOString(),
        "dateModified": selectedStory.updatedAt || selectedStory.createdAt || new Date().toISOString(),
        "description": selectedStory.shortDescriptionEn,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonical
        }
      });

      // Breadcrumb Schema
      schemaList.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${origin}/#home`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Stories",
            "item": `${origin}/#stories`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": selectedStory.titleEn,
            "item": canonical
          }
        ]
      });

    } else {
      // General Pages SEO mapping
      if (currentView === "stories") {
        title = "All Islamic Stories - Ummah Kids";
        desc = "Explore our verified collection of Islamic stories about Prophets, Companions, and Islamic morals. Tailored side-by-side in Urdu & English.";
        canonical = `${origin}/#stories`;
      } else if (currentView === "bookmarks") {
        title = "My Saved Stories & Favorites - Ummah Kids";
        desc = "Your personal custom collection of saved bilingual Islamic stories to read, practice, and learn offline.";
        canonical = `${origin}/#bookmarks`;
      } else if (currentView === "generator") {
        title = "AI Story Teller - Ummah Kids";
        desc = "Generate children-safe, authentic Islamic stories based on Quran and Hadith sources with our intelligent AI storytelling bot.";
        canonical = `${origin}/#generator`;
      } else if (currentView === "about") {
        title = "About & Contact - Ummah Kids";
        desc = "Ummah Kids is an Islamic educational platform created by Inaamullah to help children and families learn authentic Islam.";
        canonical = `${origin}/#about`;
      } else if (currentView === "admin") {
        title = "Admin Management Panel - Ummah Kids";
        desc = "Authorized access dashboard to create, manage, bulk-update, and verify authentic stories.";
        canonical = `${origin}/#admin`;
      } else if (currentView === "404") {
        title = "Page Not Found (404) - Ummah Kids";
        desc = "Oops! The page you are looking for does not exist in the Ummah Kids library.";
        canonical = `${origin}/#404`;
      }

      // Default breadcrumb for root views
      schemaList.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": `${origin}/#home`
          }
        ]
      });
    }

    // Update document title
    document.title = title;

    // Helper to select and configure meta tags
    const updateMetaTag = (property: string, content: string, isName = false) => {
      const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute(isName ? "name" : "property", property);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    // Standard Tags
    updateMetaTag("description", desc, true);

    // Canonical
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.setAttribute("href", canonical);

    // Open Graph
    updateMetaTag("og:title", title);
    updateMetaTag("og:description", desc);
    updateMetaTag("og:image", ogImage);
    updateMetaTag("og:url", canonical);
    updateMetaTag("og:type", "website");

    // Twitter Cards
    updateMetaTag("twitter:card", "summary_large_image", true);
    updateMetaTag("twitter:title", title, true);
    updateMetaTag("twitter:description", desc, true);
    updateMetaTag("twitter:image", ogImage, true);

    // Structured JSON-LD Data Schema injection
    let schemaScript = document.getElementById("seo-structured-data-jsonld");
    if (!schemaScript) {
      schemaScript = document.createElement("script");
      schemaScript.setAttribute("id", "seo-structured-data-jsonld");
      schemaScript.setAttribute("type", "application/ld+json");
      document.head.appendChild(schemaScript);
    }
    schemaScript.innerHTML = JSON.stringify(schemaList);

  }, [currentView, selectedStory, loading]);

  const toggleDarkMode = () => {
    document.documentElement.classList.add("theme-transition");
    setDarkMode(prev => !prev);
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transition");
    }, 310);
  };

  const checkAndAwardBadges = (kid: KidProfile): Badge[] => {
    const badges = [...(kid.badges || [])];
    const completedCount = kid.completedStories?.length || 0;
    
    const addBadge = (id: string, name: string, desc: string, icon: string, color: string) => {
      if (!badges.some(b => b.id === id)) {
        badges.push({
          id,
          name,
          description: desc,
          icon,
          color,
          earnedAt: new Date().toISOString()
        });
      }
    };

    if (completedCount >= 1) {
      addBadge("first_story", "First Story Completion", "Congratulations! You read your first Islamic story!", "🏆", "from-emerald-400 to-teal-500");
    }
    if (completedCount >= 5) {
      addBadge("five_stories", "Wise Explorer", "Superb! You completed 5 beautiful stories.", "📚", "from-amber-400 to-orange-500");
    }
    if (completedCount >= 10) {
      addBadge("ten_stories", "Islamic Scholar Badge", "Ma Sha Allah! You completed 10 Islamic stories.", "✨", "from-purple-400 to-indigo-500");
    }
    if (kid.points >= 100) {
      addBadge("quiz_champion", "Quiz Champion", "Scored over 100 points in quizzes!", "👑", "from-rose-400 to-red-500");
    }
    return badges;
  };

  const handleSelectStory = (story: Story) => {
    setSelectedStory(story);
    setCurrentView(`story:${story.slug}`);
    
    // Track last read story
    setUserProgress(prev => ({
      ...prev,
      lastReadStoryId: story.id
    }));

    if (activeKidProfile) {
      const todayStr = new Date().toISOString().split("T")[0];
      const lastActiveStr = activeKidProfile.lastActive ? activeKidProfile.lastActive.split("T")[0] : "";
      let newStreak = activeKidProfile.streak || 0;
      
      if (lastActiveStr === "") {
        newStreak = 1;
      } else {
        const lastActiveDate = new Date(lastActiveStr);
        const todayDate = new Date(todayStr);
        const diffTime = todayDate.getTime() - lastActiveDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }
      }

      const updatedKid: KidProfile = {
        ...activeKidProfile,
        lastStoryRead: story.titleEn,
        readingTime: (activeKidProfile.readingTime || 0) + (story.readingTime || 3),
        readingPercentage: 100,
        lastActive: new Date().toISOString(),
        streak: newStreak
      };
      
      setKidProfiles(prev => prev.map(k => k.id === updatedKid.id ? updatedKid : k));
      setActiveKidProfile(updatedKid);
      syncKidProfileUpdate(updatedKid);
    }

    // Increment view count dynamically on the server
    fetch(`/api/stories/${story.id}/view`, { method: "POST" })
      .then(res => {
        if (res.ok) {
          // Increment locally in stories state to avoid waiting for fetch
          setStories(prevStories => prevStories.map(s => s.id === story.id ? { ...s, views: (s.views || 0) + 1 } : s));
        }
      })
      .catch(err => console.warn("[Views] Error tracking view:", err));

    // Save/cache previously read story to browser's IndexedDB
    saveStoryOffline(story).catch(err => {
      console.error("[Offline Cache] Error caching story on selection:", err);
    });
  };

  const handleToggleBookmark = (storyId: string) => {
    setUserProgress(prev => {
      const bookmarked = prev.bookmarkedStories.includes(storyId);
      const updated = bookmarked
        ? prev.bookmarkedStories.filter(id => id !== storyId)
        : [...prev.bookmarkedStories, storyId];
      
      return {
        ...prev,
        bookmarkedStories: updated,
        points: prev.points + (bookmarked ? -5 : 10) // +10 points for bookmarking, -5 for undoing
      };
    });

    if (activeKidProfile) {
      const isBookmarked = activeKidProfile.favoriteStories?.includes(storyId);
      const updatedFavorites = isBookmarked
        ? activeKidProfile.favoriteStories.filter(id => id !== storyId)
        : [...(activeKidProfile.favoriteStories || []), storyId];
      
      const updatedPoints = activeKidProfile.points + (isBookmarked ? -5 : 10);
      
      const updatedKid: KidProfile = {
        ...activeKidProfile,
        favoriteStories: updatedFavorites,
        points: updatedPoints
      };
      
      updatedKid.badges = checkAndAwardBadges(updatedKid);

      setKidProfiles(prev => prev.map(k => k.id === updatedKid.id ? updatedKid : k));
      setActiveKidProfile(updatedKid);
      syncKidProfileUpdate(updatedKid);
    }
  };

  const handleCompleteQuiz = (storyId: string, score: number) => {
    setUserProgress(prev => {
      const prevHighScore = prev.quizScores[storyId] || 0;
      const isNewHighScore = score > prevHighScore;
      const pointDifference = isNewHighScore ? (score - prevHighScore) * 20 : 0; // 20 points per correct answer increase

      const updatedScores = {
        ...prev.quizScores,
        [storyId]: Math.max(prevHighScore, score)
      };

      const updatedCompleted = prev.completedStories.includes(storyId)
        ? prev.completedStories
        : [...prev.completedStories, storyId];

      return {
        ...prev,
        completedStories: updatedCompleted,
        quizScores: updatedScores,
        points: prev.points + pointDifference
      };
    });

    if (activeKidProfile) {
      const prevHighScore = activeKidProfile.quizScores?.[storyId] || 0;
      const isNewHighScore = score > prevHighScore;
      const pointDifference = isNewHighScore ? (score - prevHighScore) * 20 : 0;
      
      const updatedScores = {
        ...(activeKidProfile.quizScores || {}),
        [storyId]: Math.max(prevHighScore, score)
      };
      
      const updatedCompleted = activeKidProfile.completedStories?.includes(storyId)
        ? activeKidProfile.completedStories
        : [...(activeKidProfile.completedStories || []), storyId];
        
      const updatedKid: KidProfile = {
        ...activeKidProfile,
        quizScores: updatedScores,
        completedStories: updatedCompleted,
        points: activeKidProfile.points + pointDifference
      };
      
      updatedKid.badges = checkAndAwardBadges(updatedKid);
      
      setKidProfiles(prev => prev.map(k => k.id === updatedKid.id ? updatedKid : k));
      setActiveKidProfile(updatedKid);
      syncKidProfileUpdate(updatedKid);
    }
  };

  const handleAwardPoints = (pts: number) => {
    setUserProgress(prev => ({
      ...prev,
      points: prev.points + pts
    }));

    if (activeKidProfile) {
      const updatedKid: KidProfile = {
        ...activeKidProfile,
        points: (activeKidProfile.points || 0) + pts
      };
      
      updatedKid.badges = checkAndAwardBadges(updatedKid);
      
      setKidProfiles(prev => prev.map(k => k.id === updatedKid.id ? updatedKid : k));
      setActiveKidProfile(updatedKid);
      syncKidProfileUpdate(updatedKid);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterSubscribed(true);
    setUserProgress(prev => ({ ...prev, points: prev.points + 50 })); // +50 bonus points for joining!
  };

  // Filter Categories list based on our content definition
  const categoriesList = [
    { id: "all", label: "All Stories", labelUr: "سب کہانیاں" },
    { id: "Prophets Stories", label: "Prophets Stories", labelUr: "قصص الانبیاء" },
    { id: "Prophet Muhammad ﷺ Life", label: "Prophet Muhammad ﷺ", labelUr: "سیرت النبی" },
    { id: "Sahaba Stories", label: "Sahaba Stories", labelUr: "صحابہ کرام" },
    { id: "Quran Stories", label: "Quran Stories", labelUr: "قرآنی کہانیاں" },
    { id: "Islamic Morals", label: "Moral Stories", labelUr: "اخلاقی کہانیاں" },
  ];

  // Apply filters to state stories list
  const filteredStories = stories.filter((story) => {
    const isPubliclyVisible = story.status === "published";
    if (!isPubliclyVisible) return false;

    // Category filter
    const matchesCategory = activeCategory === "all" || story.category === activeCategory;

    // Age filter
    const matchesAge = activeAgeFilter === "all" || story.ageGroup === activeAgeFilter;

    // Prophet filter
    const matchesProphet = activeProphetFilter === "all" || 
      (story.prophetName && story.prophetName.toLowerCase().includes(activeProphetFilter.toLowerCase())) ||
      (story.titleEn.toLowerCase().includes(activeProphetFilter.toLowerCase())) ||
      (story.tags.some(t => t.toLowerCase().includes(activeProphetFilter.toLowerCase())));

    if (!matchesCategory || !matchesAge || !matchesProphet) return false;

    if (searchQuery === "") return true;

    const queryLower = searchQuery.toLowerCase().trim();

    // 1. Title matches
    const matchesTitle = 
      story.titleEn.toLowerCase().includes(queryLower) ||
      story.titleUr.includes(searchQuery);

    // 2. Prophet name matches
    const matchesProphetName = story.prophetName 
      ? story.prophetName.toLowerCase().includes(queryLower) 
      : false;

    // 3. Category matches
    const matchesStoryCategory = story.category
      ? story.category.toLowerCase().includes(queryLower)
      : false;

    // 4. Moral Lesson matches (lessonsEn, lessonsUr, descriptions)
    const matchesMoralLesson = 
      (story.lessonsEn && story.lessonsEn.some(lesson => lesson.toLowerCase().includes(queryLower))) ||
      (story.lessonsUr && story.lessonsUr.some(lesson => lesson.includes(searchQuery))) ||
      story.shortDescriptionEn.toLowerCase().includes(queryLower) ||
      story.shortDescriptionUr.includes(searchQuery);

    // General fallback matches (tags, content)
    const matchesGeneral = 
      story.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
      story.contentEn.toLowerCase().includes(queryLower) ||
      story.contentUr.includes(searchQuery);

    if (searchField === "all") {
      return matchesTitle || matchesProphetName || matchesStoryCategory || matchesMoralLesson || matchesGeneral;
    } else if (searchField === "title") {
      return matchesTitle;
    } else if (searchField === "prophet") {
      return matchesProphetName;
    } else if (searchField === "category") {
      return matchesStoryCategory;
    } else if (searchField === "moral") {
      return matchesMoralLesson;
    }

    return false;
  });

  const featuredStory = stories.find(s => s.isFeatured && s.status === "published") || stories.find(s => s.status === "published");

  // Determine last read story for Resume reading banner
  const lastReadStory = userProgress.lastReadStoryId ? stories.find(s => s.id === userProgress.lastReadStoryId) : null;

  // Dynamically partition and calculate sections
  const publishedStories = stories.filter(s => s.status === "published");
  const latestStories = publishedStories.filter(s => s.id !== featuredStory?.id).slice(0, 3);
  const popularStories = publishedStories.filter(s => s.id !== featuredStory?.id && !latestStories.some(ls => ls.id === s.id)).slice(0, 3);
  const displayPopular = popularStories.length > 0 ? popularStories : publishedStories.slice(0, 3);

  const prophetsList = [
    { id: "Muhammad", nameEn: "Prophet Muhammad ﷺ", nameUr: "حضرت محمد ﷺ", emoji: "🐫", color: "from-emerald-400 to-teal-500", tag: "Prophet Muhammad" },
    { id: "Nuh", nameEn: "Prophet Nuh (AS)", nameUr: "حضرت نوح علیہ السلام", emoji: "🛶", color: "from-sky-400 to-blue-500", tag: "Noah" },
    { id: "Sulaiman", nameEn: "Prophet Sulaiman (AS)", nameUr: "حضرت سلیمان علیہ السلام", emoji: "🐜", color: "from-amber-400 to-orange-500", tag: "Sulaiman" },
    { id: "Musa", nameEn: "Prophet Musa (AS)", nameUr: "حضرت موسیٰ علیہ السلام", emoji: "⛰️", color: "from-purple-400 to-indigo-500", tag: "Musa" },
    { id: "Ibrahim", nameEn: "Prophet Ibrahim (AS)", nameUr: "حضرت ابراہیم علیہ السلام", emoji: "🔥", color: "from-rose-400 to-red-500", tag: "Ibrahim" },
  ];

  const ageGroupsList = [
    { id: "4-6", label: "Ages 4-6", labelUr: "۴ سے ۶ سال", desc: "Easy, sweet stories for young buds & early bilingual learners.", emoji: "🐣", bg: "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/20 text-emerald-850 dark:text-emerald-300 dark:border-emerald-800/30" },
    { id: "7-9", label: "Ages 7-9", labelUr: "۷ سے ۹ سال", desc: "Exciting Prophet adventures, stories of companions, and fun quizzes.", emoji: "🦊", bg: "bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20 text-amber-850 dark:text-amber-300 dark:border-amber-800/30" },
    { id: "10-12", label: "Ages 10-12", labelUr: "۱۰ سے ۱۲ سال", desc: "Inspiring moral values, Quranic references, and deep life lessons.", emoji: "🦁", bg: "bg-blue-500/10 hover:bg-blue-500/15 border-blue-500/20 text-blue-850 dark:text-blue-300 dark:border-blue-800/30" },
  ];

  const showWelcome = !authChecking && !parentUser && !isGuest;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans">
      {/* Fullscreen Welcome & Login Experience for First Visitors */}
      <AnimatePresence>
        {showWelcome && (
          <WelcomeScreen
            onContinueAsGuest={handleContinueAsGuest}
            onLoginSuccess={() => {
              setIsGuest(false);
            }}
            language={language}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Navigation Header */}
      <Header 
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedStory(null);
          if (view === "home") {
            setSearchQuery("");
            setActiveCategory("all");
            setActiveAgeFilter("all");
            setActiveProphetFilter("all");
          }
          // Scroll back to top
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        isAdmin={adminToken !== null}
        bookmarkCount={userProgress.bookmarkedStories.length}
        
        // Platform additions
        language={language}
        onLanguageChange={(lang) => {
          setLanguage(lang);
          localStorage.setItem("islamic_kids_language", lang);
        }}
        parentUser={parentUser}
        activeKidProfile={activeKidProfile}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onOpenDashboard={() => setCurrentView("parent-dashboard")}
        onOpenKidProfiles={() => setCurrentView("kids-profiles")}
        onStartTour={handleRestartTour}
      />

      {/* Sticky Navigation Header with Back Button and Breadcrumbs */}
      <NavigationHeader
        currentView={currentView}
        selectedStory={selectedStory}
        language={language}
        searchQuery={searchQuery}
        onNavigate={(view) => {
          setCurrentView(view);
          if (view === "home") {
            setSearchQuery("");
            setActiveCategory("all");
            setActiveAgeFilter("all");
            setActiveProphetFilter("all");
          }
          if (!view.startsWith("story:")) {
            setSelectedStory(null);
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onCustomBack={() => {
          if (selectedStory || currentView.startsWith("story:")) {
            setSelectedStory(null);
            setCurrentView("stories");
          } else {
            setCurrentView("home");
            setSearchQuery("");
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <main className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* Home View */}
          {currentView === "home" && (
            <motion.div
              key="home-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12 sm:space-y-16 pb-24"
            >
              {/* 1. HERO SECTION */}
              <section className="bg-white dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800 py-8 sm:py-12 transition-colors">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="max-w-3xl space-y-4 text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Assalamu Alaikum Children! السلام علیکم
                    </div>
                    
                    <div className="space-y-1.5">
                      <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight font-sans">
                        Ummah Kids <span className="text-emerald-600 dark:text-emerald-400 font-normal text-lg sm:text-xl md:text-2xl">by Inaamullah</span>
                      </h1>
                      <p className="text-xl sm:text-2xl font-urdu font-bold text-emerald-700 dark:text-emerald-400" dir="rtl">
                        امت کڈز
                      </p>
                    </div>
                    
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-sans">
                      An authentic Islamic learning platform where children and families explore the Quran, Prophets' Stories, Hadith, Daily Duas, Salah guide, and interactive AI learning tools in a serene environment.
                    </p>

                    {/* HERO BUTTONS */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        onClick={() => {
                          setCurrentView("stories");
                          setActiveCategory("all");
                        }}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        {getTranslation("startReading", language)}
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setCurrentView("quran")}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        Quran Reader
                      </button>
                      <button
                        onClick={() => setCurrentView("generator")}
                        className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        AI Storyteller
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* 2. QUICK ACCESS LEARNING CARDS */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    🎓 Learning Modules {language === "ur" ? "• اسلامی تعلیمی مرکز" : language === "ar" ? "• مركز التعلم الإسلامي" : ""}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Explore Quran, Authentic Stories, Salah, Duas, Hadith, or ask your AI Teacher!
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {/* 1. Quran for Kids */}
                  <div
                    onClick={() => {
                      setCurrentView("quran");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl cursor-pointer flex gap-3.5 items-start shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-xl flex items-center justify-center text-xl shrink-0">
                      📖
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Quran Reader</h4>
                        {language === "ur" && <span className="text-xs font-urdu text-emerald-600 dark:text-emerald-400">بچوں کا قرآن</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Read and listen to beautiful short Surahs with child-friendly English and Urdu translations.
                      </p>
                    </div>
                  </div>

                  {/* 2. Islamic Stories */}
                  <div
                    onClick={() => {
                      setCurrentView("stories");
                      setActiveCategory("all");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl cursor-pointer flex gap-3.5 items-start shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 rounded-xl flex items-center justify-center text-xl shrink-0">
                      📚
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Islamic Stories</h4>
                        {language === "ur" && <span className="text-xs font-urdu text-amber-600 dark:text-amber-400">اسلامی کہانیاں</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Authentic Prophet tales, Quran stories, Sahaba adventures, and moral lessons for kids.
                      </p>
                    </div>
                  </div>

                  {/* 3. Learn Salah */}
                  <div
                    onClick={() => {
                      setCurrentView("salah");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-sky-500/50 dark:hover:border-sky-500/50 rounded-2xl cursor-pointer flex gap-3.5 items-start shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 rounded-xl flex items-center justify-center text-xl shrink-0">
                      🕌
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Learn Salah</h4>
                        {language === "ur" && <span className="text-xs font-urdu text-sky-600 dark:text-sky-400">نماز سیکھیں</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Step-by-step visual guide to learn Wudu and how to pray Salah with recitation audios.
                      </p>
                    </div>
                  </div>

                  {/* 4. Daily Duas */}
                  <div
                    onClick={() => {
                      setCurrentView("duas");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-4 bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 rounded-2xl cursor-pointer flex gap-3.5 items-start shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 rounded-xl flex items-center justify-center text-xl shrink-0">
                      🌱
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Daily Duas</h4>
                        {language === "ur" && <span className="text-xs font-urdu text-teal-600 dark:text-teal-400">مسنون دعائیں</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Learn categorized daily duas (eating, sleeping, parents) with audio pronunciation.
                      </p>
                    </div>
                  </div>

                  {/* 5. Hadith for Kids */}
                  <div
                    onClick={() => {
                      setCurrentView("hadiths");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-5 sm:p-6 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 border border-pink-500/10 hover:border-pink-400 dark:border-pink-900/30 rounded-3xl cursor-pointer flex gap-4 items-start shadow-2xs hover:shadow-md transition-all hover:scale-101 group min-h-[100px]"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:scale-105 transition-transform shrink-0">
                      🌸
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100">Hadith for Kids</h4>
                        {language === "ur" && <span className="text-xs font-urdu font-black text-pink-600 dark:text-pink-400">بچوں کی احادیث</span>}
                        {language === "ar" && <span className="text-xs font-black text-pink-600 dark:text-pink-400">أحاديث للأطفال</span>}
                        {language === "en" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300">Prophetic Guidance</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Read simple authentic words of our Prophet ﷺ with moral lessons and quick quizzes!
                      </p>
                    </div>
                  </div>

                  {/* 6. AI Teacher */}
                  <div
                    onClick={() => {
                      setCurrentView("teacher");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-5 sm:p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border border-purple-500/10 hover:border-purple-400 dark:border-purple-900/30 rounded-3xl cursor-pointer flex gap-4 items-start shadow-2xs hover:shadow-md transition-all hover:scale-101 group min-h-[100px]"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shadow-xs group-hover:scale-105 transition-transform shrink-0">
                      🤖
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-base font-black text-slate-800 dark:text-slate-100">AI Teacher</h4>
                        {language === "ur" && <span className="text-xs font-urdu font-black text-purple-600 dark:text-purple-400">اسلامی استاد</span>}
                        {language === "ar" && <span className="text-xs font-black text-purple-600 dark:text-purple-400">المعلم الذكي</span>}
                        {language === "en" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Interactive Assistant</span>}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Ask any question about Islam, Prophets, Quran, or good manners! Verified answers.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. SEARCH BAR & QUICK ACCESS SECTION */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
                <div className="bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xs space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Search className="w-5 h-5 text-emerald-600" />
                      Search Learning Library {language === "ur" ? "• تلاش کریں" : language === "ar" ? "• ابحث هنا" : ""}
                    </h3>
                    <p className="text-xs text-slate-500">Find stories, prophets, categories, or moral lessons</p>
                  </div>

                  <div className="relative w-full bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-700" id="home-search-container">
                    <div className="flex items-center gap-2 h-[48px]">
                      <div className="pl-3 text-slate-400 shrink-0">
                        <Search className="w-5 h-5" />
                      </div>
                      <input 
                        type="text"
                        placeholder="Search story title, prophet name, category, or morals..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-transparent border-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-0 text-xs sm:text-sm h-full"
                      />
                      {isSyncingSearch && (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent mr-2 shrink-0" />
                      )}
                      {searchQuery && (
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="px-2.5 py-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* QUICK ACCESS SECTION */}
                <div className="bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-6 rounded-3xl shadow-xs space-y-3.5" id="quick-access-section">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                        Quick Access {language === "ur" ? "• تیز ترین رسائی" : language === "ar" ? "• وصول سريع" : ""}
                      </h4>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                      Direct access to educational modules
                    </span>
                  </div>

                  {/* Rounded Pill Buttons Grid/Flex Container */}
                  <div className="flex flex-wrap gap-2 sm:gap-2.5 items-center">
                    {[
                      {
                        id: "quran",
                        icon: "📖",
                        label: getTranslation("quran", language),
                        bgColor: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60",
                        action: () => {
                          setCurrentView("quran");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "stories",
                        icon: "📚",
                        label: getTranslation("stories", language),
                        bgColor: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/60",
                        action: () => {
                          setCurrentView("stories");
                          setActiveCategory("all");
                          setActiveAgeFilter("all");
                          setActiveProphetFilter("all");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "duas",
                        icon: "🤲",
                        label: getTranslation("duas", language),
                        bgColor: "bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800/60 hover:bg-teal-100 dark:hover:bg-teal-900/60",
                        action: () => {
                          setCurrentView("duas");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "salah",
                        icon: "🕌",
                        label: getTranslation("salah", language),
                        bgColor: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60",
                        action: () => {
                          setCurrentView("salah");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "hadiths",
                        icon: "📜",
                        label: getTranslation("hadith", language),
                        bgColor: "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800/60 hover:bg-pink-100 dark:hover:bg-pink-900/60",
                        action: () => {
                          setCurrentView("hadiths");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "teacher",
                        icon: "🤖",
                        label: getTranslation("aiTeacher", language),
                        bgColor: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60",
                        action: () => {
                          setCurrentView("teacher");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "videos",
                        icon: "🎥",
                        label: getTranslation("videos", language),
                        bgColor: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/60",
                        action: () => {
                          setCurrentView("videos");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                      {
                        id: "bookmarks",
                        icon: "⭐",
                        label: getTranslation("bookmarks", language),
                        bgColor: "bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/60 hover:bg-yellow-100 dark:hover:bg-yellow-900/60",
                        action: () => {
                          setCurrentView("bookmarks");
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }
                      },
                    ].map((btn) => {
                      const isActive = activeQuickPill === btn.id;
                      return (
                        <button
                          key={btn.id}
                          onClick={(e) => {
                            setActiveQuickPill(btn.id);

                            // Create ripple effect
                            const button = e.currentTarget;
                            const circle = document.createElement("span");
                            const diameter = Math.max(button.clientWidth, button.clientHeight);
                            const radius = diameter / 2;
                            circle.style.width = circle.style.height = `${diameter}px`;
                            circle.style.left = `${e.clientX - button.getBoundingClientRect().left - radius}px`;
                            circle.style.top = `${e.clientY - button.getBoundingClientRect().top - radius}px`;
                            circle.classList.add("ripple");
                            const existingRipple = button.getElementsByClassName("ripple")[0];
                            if (existingRipple) {
                              existingRipple.remove();
                            }
                            button.appendChild(circle);

                            btn.action();
                          }}
                          className={`
                            relative overflow-hidden group rounded-full px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs font-extrabold flex items-center gap-2
                            transition-all duration-200 select-none cursor-pointer active:scale-95 hover:scale-105 min-h-[42px]
                            ${
                              isActive
                                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 text-white border-2 border-emerald-300 ring-2 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)] z-10 scale-102"
                                : `${btn.bgColor} border shadow-2xs`
                            }
                          `}
                        >
                          <span className="text-base leading-none group-hover:scale-115 transition-transform duration-200">
                            {btn.icon}
                          </span>
                          <span className="whitespace-nowrap">{btn.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* DYNAMIC SEARCH RESULTS */}
                <AnimatePresence>
                  {searchQuery && (
                    <motion.div 
                      key="search-results-section"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ 
                        opacity: isSyncingSearch ? 0.65 : 1, 
                        y: 0 
                      }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-6 space-y-4"
                      id="search-results-container"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          Search Results ({filteredStories.length})
                        </h4>
                        <button 
                          onClick={() => setSearchQuery("")}
                          className="text-xs font-bold text-slate-500 hover:text-emerald-600 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Clear Search
                        </button>
                      </div>
                      
                      {filteredStories.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {filteredStories.map((story) => (
                            <StoryCard 
                              key={story.id} 
                              story={story} 
                              onSelect={handleSelectStory} 
                              isOfflineAvailable={offlineStoryIds.includes(story.id)}
                              language={language}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-10 bg-white dark:bg-slate-800/50 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                          <h4 className="text-base font-bold text-slate-700 dark:text-slate-300">No matching stories found</h4>
                          <p className="text-xs text-slate-500 mt-1">Try another keyword or search by category below!</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* 4. CATEGORIES */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-emerald-600" />
                    Browse By Category {language === "ur" ? "• زمرے کے لحاظ سے" : language === "ar" ? "• حسب الفئة" : ""}
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3" id="home-categories-grid">
                    {categoriesList.map((cat) => {
                      if (cat.id === "all") return null;
                      return (
                        <div
                          key={cat.id}
                          onClick={() => {
                            setCurrentView("stories");
                            setActiveCategory(cat.id);
                            setActiveAgeFilter("all");
                            setActiveProphetFilter("all");
                          }}
                          className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-3xl border border-emerald-50/50 dark:border-slate-700 cursor-pointer text-center space-y-2 hover:border-emerald-300 dark:hover:border-slate-600 transition-all hover:scale-101 hover:shadow-xs group"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                            {cat.label}
                          </h4>
                          {language === "ur" && (
                            <p className="text-xs font-urdu text-slate-500 dark:text-slate-400 leading-[1.8]">
                              {cat.labelUr}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* 5. CONTINUE READING */}
              {lastReadStory && (
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                  <div className="bg-amber-500/10 border border-amber-500/20 backdrop-blur-md rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-white flex-shrink-0 animate-bounce">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-widest">Continue Reading</h4>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5 line-clamp-1">
                          "{lastReadStory.titleEn}" {language === "ur" && `/ ${lastReadStory.titleUr}`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSelectStory(lastReadStory)}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-xs transition-colors self-end sm:self-auto min-h-[44px]"
                    >
                      Resume {language === "ur" ? "• جاری رکھیں" : ""}
                    </button>
                  </div>
                </section>
              )}

              {/* 6. RECENTLY ADDED STORIES */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-orange-500" />
                      Recently Added Stories {language === "ur" ? "• نئی کہانیاں" : language === "ar" ? "• أحدث القصص" : ""}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Our newest additions from the story library.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("stories");
                      setActiveCategory("all");
                      setActiveAgeFilter("all");
                      setActiveProphetFilter("all");
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-64 bg-slate-200 animate-pulse rounded-3xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {latestStories.map((story) => (
                      <StoryCard 
                        key={story.id} 
                        story={story} 
                        onSelect={handleSelectStory} 
                        isOfflineAvailable={offlineStoryIds.includes(story.id)}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* 7. POPULAR STORIES */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      Popular Stories {language === "ur" ? "• مقبول کہانیاں" : language === "ar" ? "• الأكثر قراءة" : ""}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Most loved stories with quizzes and completions.</p>
                  </div>
                  <button
                    onClick={() => {
                      setCurrentView("stories");
                      setActiveCategory("all");
                      setActiveAgeFilter("all");
                      setActiveProphetFilter("all");
                    }}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-64 bg-slate-200 animate-pulse rounded-3xl" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {displayPopular.map((story) => (
                      <StoryCard 
                        key={story.id} 
                        story={story} 
                        onSelect={handleSelectStory} 
                        isOfflineAvailable={offlineStoryIds.includes(story.id)}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* 8. FEATURED PROPHETS */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div>
                  <h3 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-600" />
                    Featured Prophets {language === "ur" ? "• انبیاء کرام کے قصص" : language === "ar" ? "• قصص الأنبياء" : ""}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Select and learn from the lives of Allah's messengers.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4" id="prophets-list-grid">
                  {prophetsList.map((prophet) => (
                    <div
                      key={prophet.id}
                      onClick={() => {
                        setActiveProphetFilter(prophet.tag);
                        setActiveCategory("all");
                        setActiveAgeFilter("all");
                        setCurrentView("stories");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-3xl border border-emerald-50/50 dark:border-slate-700 cursor-pointer text-center space-y-2 sm:space-y-3 hover:border-emerald-300 dark:hover:border-slate-600 transition-all hover:scale-101 hover:shadow-xs group"
                    >
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform text-2xl sm:text-3xl shadow-2xs">
                        {prophet.emoji}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                          {prophet.nameEn}
                        </h4>
                        {language === "ur" && (
                          <p className="text-xs font-urdu text-emerald-700 dark:text-emerald-400 font-bold leading-[1.8]">
                            {prophet.nameUr}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 9. MY REWARDS & PROGRESS */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 space-y-6 shadow-lg border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md shrink-0">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                          My Rewards & Progress {language === "ur" ? "• انعامات و ترقی" : language === "ar" ? "• الإنجازات والتقدم" : ""}
                        </h3>
                        <p className="text-xs text-slate-300">Track your learning points, badges, and story completions</p>
                      </div>
                    </div>

                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 self-start sm:self-auto">
                      Level {Math.floor(userProgress.points / 100) + 1} Learner
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">Faith Points</span>
                      <div className="text-2xl font-extrabold text-amber-300 flex items-center gap-2">
                        <Star className="w-6 h-6 text-amber-300 fill-current" />
                        {userProgress.points} Points
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">Stories Finished</span>
                      <div className="text-2xl font-extrabold text-emerald-300 flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-emerald-300" />
                        {userProgress.completedStories.length} Stories
                      </div>
                    </div>

                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                        <span>Level Progress</span>
                        <span className="text-amber-300">{(userProgress.points % 100)} / 100 XP</span>
                      </div>
                      <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(userProgress.points % 100)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Complete quizzes after reading stories to level up!
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Daily Wisdom Widget segment */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <DailyHadith onNavigateToHadiths={() => { setCurrentView("hadiths"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
                <DailyInspirations />
              </section>

              {/* Parents Club Newsletter */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-slate-800 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-md">
                  <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
                    <Mail className="w-80 h-80" />
                  </div>
                  
                  <div className="max-w-2xl space-y-4 relative z-10">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-slate-900 uppercase tracking-widest">
                      Parents Club
                    </span>
                    <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                      Join Our Weekly Islamic Learning Circle
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Subscribe to receive beautifully drafted Islamic moral story ideas, fun printable worksheets, and new quiz updates directly to your inbox. 100% free and strictly child-safe.
                    </p>

                    <AnimatePresence mode="wait">
                      {!newsletterSubscribed ? (
                        <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                          <input
                            type="email"
                            required
                            placeholder="parent@example.com"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="flex-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-400"
                            id="newsletter-email"
                          />
                          <button
                            type="submit"
                            className="px-6 py-3 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-extrabold text-xs tracking-wider uppercase transition-colors min-h-[48px]"
                          >
                            Subscribe & Claim +50 Points!
                          </button>
                        </form>
                      ) : (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-300 text-sm font-semibold flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-emerald-400" />
                          Welcome to the circle! +50 Reward points added to your rewards cabin.
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

            </motion.div>
          )}

          {/* Stories Directory View */}
          {currentView === "stories" && (
            <motion.div
              key="stories-directory"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10"
            >
              {/* Directory Filter Panel */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">
                    Stories Directory
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">تلاش کریں اور عمر یا زمرے کے لحاظ سے منتخب کریں۔</p>
                </div>

                {/* Search & Scope Panel in Directory */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs items-center">
                  {/* Search input with live status */}
                  <div className="md:col-span-6 relative flex items-center bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl px-4 py-2.5">
                    <Search className="w-5 h-5 text-slate-400 mr-2" />
                    <input
                      type="text"
                      placeholder="Type to search stories (e.g. 'Noah', 'Camel', 'Patience')..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent border-0 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-0 text-sm py-1"
                    />
                    {isSyncingSearch && (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent mr-2" />
                    )}
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-1"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Search Scope selectors */}
                  <div className="md:col-span-6 flex flex-wrap gap-1.5 items-center justify-start md:justify-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Search In:</span>
                    {[
                      { id: "all", label: "🔍 All" },
                      { id: "title", label: "📖 Title" },
                      { id: "prophet", label: "🐫 Prophet" },
                      { id: "category", label: "📂 Category" },
                      { id: "moral", label: "🌟 Morals" },
                    ].map((scope) => (
                      <button
                        key={scope.id}
                        onClick={() => setSearchField(scope.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          searchField === scope.id
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-750"
                        }`}
                      >
                        {scope.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter and Search Layout */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200/50 dark:border-slate-700 shadow-xs">
                  {/* Category Pills Slider */}
                  <div className="flex flex-wrap gap-2 items-center" id="directory-category-tabs">
                    {categoriesList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                          activeCategory === cat.id
                            ? "bg-emerald-500 text-white shadow-xs"
                            : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {cat.label} <span className="opacity-70 font-urdu">({cat.labelUr})</span>
                      </button>
                    ))}
                  </div>

                  {/* Age filter toggler */}
                  <div className="flex items-center gap-2 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Ages:</span>
                    <div className="flex gap-1" id="directory-age-filters">
                      {["all", "4-6", "7-9", "10-12"].map((age) => (
                        <button
                          key={age}
                          onClick={() => setActiveAgeFilter(age)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeAgeFilter === age
                              ? "bg-amber-500 text-white"
                              : "bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                          }`}
                        >
                          {age === 'all' ? 'All' : `${age} Yrs`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Active Filters Display */}
                {(activeCategory !== "all" || activeAgeFilter !== "all" || activeProphetFilter !== "all" || searchQuery !== "" || searchField !== "all") && (
                  <div className="flex flex-wrap gap-2 items-center text-xs font-semibold text-slate-500 bg-emerald-500/5 dark:bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-500/10">
                    <span className="text-slate-400 uppercase tracking-wider text-[10px] font-extrabold mr-1">Active Filters:</span>
                    {activeCategory !== "all" && (
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 shadow-2xs">
                        Category: {activeCategory}
                        <button onClick={() => setActiveCategory("all")} className="hover:text-red-500 font-bold text-sm">×</button>
                      </span>
                    )}
                    {activeAgeFilter !== "all" && (
                      <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 shadow-2xs">
                        Ages: {activeAgeFilter} Yrs
                        <button onClick={() => setActiveAgeFilter("all")} className="hover:text-red-500 font-bold text-sm">×</button>
                      </span>
                    )}
                    {activeProphetFilter !== "all" && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center gap-1.5 shadow-2xs">
                        Prophet: {activeProphetFilter}
                        <button onClick={() => setActiveProphetFilter("all")} className="hover:text-red-500 font-bold text-sm">×</button>
                      </span>
                    )}
                    {searchQuery !== "" && (
                      <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 flex items-center gap-1.5 shadow-2xs">
                        Search: "{searchQuery}"
                        <button onClick={() => setSearchQuery("")} className="hover:text-red-500 font-bold text-sm">×</button>
                      </span>
                    )}
                    {searchField !== "all" && (
                      <span className="px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 flex items-center gap-1.5 shadow-2xs">
                        Scope: {searchField.toUpperCase()}
                        <button onClick={() => setSearchField("all")} className="hover:text-red-500 font-bold text-sm">×</button>
                      </span>
                    )}
                    <button
                      onClick={() => {
                        setActiveCategory("all");
                        setActiveAgeFilter("all");
                        setActiveProphetFilter("all");
                        setSearchQuery("");
                        setSearchField("all");
                      }}
                      className="text-emerald-600 hover:text-emerald-700 font-bold underline ml-2 text-xs"
                    >
                      Reset All
                    </button>
                  </div>
                )}
              </div>

              {/* Main Directory grid */}
              {filteredStories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8" id="stories-grid-container">
                  {filteredStories.map((story) => (
                    <StoryCard 
                      key={story.id} 
                      story={story} 
                      onSelect={handleSelectStory} 
                      isOfflineAvailable={offlineStoryIds.includes(story.id)}
                      language={language}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Stories Found</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    No stories match your criteria. Try resetting the filters or write a custom story with our AI storyteller!
                  </p>
                  <button
                    onClick={() => {
                      setActiveCategory("all");
                      setActiveAgeFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs"
                  >
                    Reset All Filters
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* AI Generator View */}
          {currentView === "generator" && (
            <motion.div
              key="generator-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <AiStoryGenerator 
                adminToken={adminToken}
                language={language}
                onStoryGenerated={(newStory) => {
                  // Instantly load the brand-new story
                  fetchStories(); // reload list
                  handleSelectStory(newStory);
                }} 
              />
            </motion.div>
          )}

          {/* Bookmarks View */}
          {currentView === "bookmarks" && (
            <motion.div
              key="bookmarks-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
            >
              <div className="text-center max-w-xl mx-auto mb-12">
                <div className="w-16 h-16 bg-pink-100 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Heart className="w-8 h-8 fill-current" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                  My Bookmarked Stories
                </h1>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                  Your hand-picked collection of lovely Islamic stories to read anytime!
                </p>
              </div>

              {stories.filter(s => userProgress.bookmarkedStories.includes(s.id)).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {stories
                    .filter(s => userProgress.bookmarkedStories.includes(s.id))
                    .map((story) => (
                      <StoryCard 
                        key={story.id} 
                        story={story} 
                        onSelect={handleSelectStory} 
                        isOfflineAvailable={offlineStoryIds.includes(story.id)}
                        language={language}
                      />
                    ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 max-w-2xl mx-auto">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No Bookmarks Yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You haven't bookmarked any stories yet. Click the "♡ Bookmark" button on any story page to save it here!
                  </p>
                  <button
                    onClick={() => setCurrentView("stories")}
                    className="mt-6 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Explore Library
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* About & Contact View */}
          {currentView === "about" && (
            <motion.div
              key="about-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <AboutContact language={language} />
            </motion.div>
          )}

          {/* Ummah Kids Videos View */}
          {currentView === "videos" && (
            <motion.div
              key="videos-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <VideoSection darkMode={darkMode} language={language} />
            </motion.div>
          )}

          {/* AI Teacher View */}
          {(currentView === "teacher" || currentView === "ai-teacher") && (
            <motion.div
              key="teacher-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AiTeacher
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                language={language}
              />
            </motion.div>
          )}

          {/* Quran Section View */}
          {currentView === "quran" && (
            <motion.div
              key="quran-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <QuranSection
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                language={language}
              />
            </motion.div>
          )}

          {/* Salah Section View */}
          {currentView === "salah" && (
            <motion.div
              key="salah-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <SalahSection
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                language={language}
              />
            </motion.div>
          )}

          {/* Dua Section View */}
          {currentView === "duas" && (
            <motion.div
              key="duas-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DuaSection
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                language={language}
              />
            </motion.div>
          )}

          {/* Hadith Section View */}
          {currentView === "hadiths" && (
            <motion.div
              key="hadiths-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <HadithSection
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                language={language}
              />
            </motion.div>
          )}

          {/* Games Section View */}
          {currentView === "games" && (
            <motion.div
              key="games-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GamesSection
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                language={language}
              />
            </motion.div>
          )}

          {/* Scholar Q&A View */}
          {currentView === "scholar" && (
            <motion.div
              key="scholar-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <AskScholar
                activeProfile={activeKidProfile}
                onAddPoints={handleAwardPoints}
                onNavigateHome={() => setCurrentView("home")}
                onNavigateToView={(view) => setCurrentView(view)}
                adminToken={adminToken}
                language={language}
              />
            </motion.div>
          )}

          {/* Parent Dashboard View */}
          {currentView === "parent-dashboard" && (
            <motion.div
              key="parent-dashboard-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <ParentDashboard 
                profiles={kidProfiles}
                stories={stories}
                videos={[]}
                activeProfile={activeKidProfile}
                onSelectProfile={handleSelectKidProfile}
                onCreateProfile={handleCreateKidProfile}
                onClose={() => setCurrentView("home")}
                language={language}
                onStartTour={handleRestartTour}
              />
            </motion.div>
          )}

          {/* Kids Profiles Selector View */}
          {currentView === "kids-profiles" && (
            <motion.div
              key="kids-profiles-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <KidProfileSelector 
                profiles={kidProfiles}
                activeProfile={activeKidProfile}
                onSelectProfile={(p) => {
                  handleSelectKidProfile(p);
                  setCurrentView("home");
                }}
                onOpenParentDashboard={() => setCurrentView("parent-dashboard")}
                language={language}
              />
            </motion.div>
          )}

          {/* Admin Dashboard View */}
          {currentView === "admin" && (
            <motion.div
              key="admin-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12"
            >
              <AdminPanel 
                stories={stories} 
                onRefresh={fetchStories} 
                onNavigateToStory={handleSelectStory}
                language={language}
              />
            </motion.div>
          )}

          {/* Dynamic Story Page Reader view */}
          {selectedStory && currentView === `story:${selectedStory.slug}` && (
            <motion.div
              key={`reader-${selectedStory.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="py-6"
            >
              <StoryPage 
                story={selectedStory}
                language={language}
                onBack={() => {
                  setSelectedStory(null);
                  setCurrentView("home");
                }}
                relatedStories={(() => {
                  const candidates = stories.filter(s => s.status === "published" && s.id !== selectedStory.id);
                  const scored = candidates.map(story => {
                    let score = 0;
                    if (selectedStory.prophetName && story.prophetName && 
                        selectedStory.prophetName.trim() !== "" && 
                        story.prophetName.toLowerCase().trim() === selectedStory.prophetName.toLowerCase().trim()) {
                      score += 10;
                    }
                    if (story.category === selectedStory.category) {
                      score += 5;
                    }
                    const commonTags = (story.tags || []).filter(tag => (selectedStory.tags || []).includes(tag));
                    score += commonTags.length * 2;
                    return { story, score };
                  });
                  scored.sort((a, b) => {
                    if (b.score !== a.score) return b.score - a.score;
                    return (b.story.createdAt || "").localeCompare(a.story.createdAt || "");
                  });
                  const finalRelated = scored.map(item => item.story);
                  return finalRelated.slice(0, Math.min(6, Math.max(4, finalRelated.length)));
                })()}
                onSelectStory={handleSelectStory}
                bookmarked={userProgress.bookmarkedStories.includes(selectedStory.id)}
                onToggleBookmark={handleToggleBookmark}
                onCompleteQuiz={handleCompleteQuiz}
                onCategoryClick={(category) => {
                  setSelectedStory(null);
                  setCurrentView("home");
                  setActiveCategory(category);
                  setActiveProphetFilter("all");
                  setActiveAgeFilter("all");
                  setSearchQuery("");
                }}
                onProphetClick={(prophet) => {
                  setSelectedStory(null);
                  setCurrentView("home");
                  setActiveProphetFilter(prophet);
                  setActiveCategory("all");
                  setActiveAgeFilter("all");
                  setSearchQuery("");
                }}
              />
            </motion.div>
          )}

          {/* 404 Page View */}
          {currentView === "404" && (
            <motion.div
              key="404-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 text-center max-w-lg mx-auto px-4"
            >
              <div className="text-emerald-500 text-7xl font-extrabold mb-4 font-mono">404</div>
              <h2 className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Story or Page Not Found</h2>
              <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                Jazakallah, the path or story slug you are trying to visit is not in our verified database directory. It may have been updated, redirected, or is temporarily offline.
              </p>
              <button
                onClick={() => setCurrentView("home")}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs tracking-wider uppercase rounded-xl shadow-md hover:shadow-emerald-500/15 cursor-pointer transition-all active:scale-95"
              >
                Return to library home
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Polish footer */}
      <footer className="bg-slate-900 border-t border-slate-850 py-16 text-slate-400 print:hidden mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-500" />
              Ummah Kids <span className="text-xs font-normal text-slate-400">by Inaamullah</span>
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Learn Islam with Knowledge, Faith & Fun. An authentic Islamic educational platform where children and families can explore the Quran, Prophets' Stories, Hadith, Daily Duas, Salah, Islamic Videos and an AI Islamic Teacher.
            </p>
            <div className="flex items-center gap-2.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> COPPA COMPLIANT</span>
              <span>•</span>
              <span>NO ADS INSIDE STORIES</span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-200">Reading Directory</h4>
            <ul className="space-y-2 text-xs">
              {categoriesList.slice(1, 5).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      setCurrentView("stories");
                      setActiveCategory(cat.id);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="hover:text-emerald-400 transition-colors text-left"
                  >
                    {cat.label} {language === "ur" ? `• ${cat.labelUr}` : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-200">Support & Vision</h4>
            <p className="text-xs leading-relaxed">
              For story contributions, corrections of citations, school recommendations, or feedback, please contact us via the About Us panel. Let us build a beautiful community of wisdom.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Designed & developed for kids and parents worldwide.
            </p>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 Ummah Kids by Inaamullah. All rights reserved. Jazakallahu Khairan.</p>
          <button
            onClick={() => {
              setCurrentView("admin");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
            id="footer-admin-link"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>{adminToken ? "Admin Dashboard" : "Admin Portal"}</span>
          </button>
        </div>
      </footer>

      {/* Onboarding Tour Overlay */}
      <OnboardingTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        language={language}
      />

      {/* Auth Modal Overlay */}
      <AnimatePresence>
        {authModalOpen && (
          <AuthModal 
            onClose={() => setAuthModalOpen(false)}
            language={language}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
