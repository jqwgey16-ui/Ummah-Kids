import React, { useState, useEffect, useRef } from "react";
import { 
  Book, Star, Play, Pause, ChevronRight, CheckCircle, ArrowLeft, 
  Headphones, Heart, Volume2, Search, Bookmark, Settings, 
  VolumeX, RotateCcw, X, ChevronDown, ChevronUp, RefreshCw, 
  Music, Sparkles, HelpCircle, AlertCircle, BookOpen, Clock, Activity, Loader2, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { KidProfile } from "../types";
import { SURAH_LIST, SurahMetadata } from "../lib/quran-metadata";
import AudioNotAvailableNotice from "./AudioNotAvailableNotice";
import { AudioTrack } from "../types/audio";
import { useGlobalAudio } from "../lib/useGlobalAudio";

import { Language, getTranslation } from "../lib/translations";

interface QuranSectionProps {
  activeProfile: KidProfile | null;
  onAddPoints: (points: number) => void;
  onNavigateHome: () => void;
  language?: Language;
}

interface UnifiedAyah {
  numberInSurah: number;
  number: number;
  arabicText: string;
  englishTranslation: string;
  urduTranslation: string;
  transliteration: string;
}

interface WordByWord {
  id: number;
  position: number;
  text_uthmani: string;
  transliteration: { text: string };
  translation: { text: string };
  audio_url?: string;
}

interface VerseWbw {
  verse_number: number;
  words: WordByWord[];
}

interface TafseerData {
  text: string;
  title: string;
  author: string;
}

export default function QuranSection({ activeProfile, onAddPoints, onNavigateHome, language = "en" }: QuranSectionProps) {
  // Dynamic Reciters Database
  const [recitersList, setRecitersList] = useState<{ id: string; name: string; label: string }[]>([]);
  const [loadingReciters, setLoadingReciters] = useState<boolean>(true);
  const [reciterError, setReciterError] = useState<string | null>(null);

  // Settings State
  const [reciter, setReciter] = useState<string>(() => {
    const saved = localStorage.getItem("quran_default_reciter");
    if (saved) {
      if (saved === "alafasy") return "ar.alafasy";
      if (saved === "dosari") return "ar.yasseraddussary";
      if (saved === "muaiqly") return "ar.mahermuaiqly";
      if (saved === "sudais") return "ar.abdurrahmaansudais";
      return saved;
    }
    return "ar.yasseraddussary"; // Default to Yasser Al-Dossary
  });

  // Fetch official reciters list
  useEffect(() => {
    let active = true;
    const fetchReciters = async () => {
      try {
        setLoadingReciters(true);
        const res = await fetch("https://api.alquran.cloud/v1/edition?format=audio");
        if (!res.ok) {
          throw new Error("Failed to fetch official reciters database.");
        }
        const json = await res.json();
        if (!json || json.code !== 200) {
          throw new Error("Invalid reciters database response.");
        }
        if (active) {
          // Filter to only display reciters with valid audio editions (versebyverse format and Arabic)
          const filtered = json.data.filter((item: any) => 
            item.format === "audio" && 
            item.type === "versebyverse" && 
            item.language === "ar"
          );

          const mapped = filtered.map((item: any) => ({
            id: item.identifier,
            name: item.englishName || item.englishNameTranslation || item.identifier,
            label: item.name || ""
          }));

          setRecitersList(mapped);
          setLoadingReciters(false);

          // If Yasser Al-Dossary is available, enable him automatically!
          const hasYasser = mapped.some((r: any) => r.id === "ar.yasseraddussary");
          if (hasYasser) {
            setReciter("ar.yasseraddussary");
            localStorage.setItem("quran_default_reciter", "ar.yasseraddussary");
          } else if (mapped.length > 0) {
            // Check if current or saved reciter is valid in the loaded list
            const savedReciter = localStorage.getItem("quran_default_reciter");
            const isValidCurrent = mapped.some((r: any) => r.id === reciter || r.id === savedReciter);
            if (!isValidCurrent) {
              setReciter(mapped[0].id);
              localStorage.setItem("quran_default_reciter", mapped[0].id);
            }
          }
        }
      } catch (err: any) {
        console.error("Error fetching Quran reciters database:", err);
        if (active) {
          setReciterError("Failed to fetch official reciters. Loading backup.");
          const backup = [
            { id: "ar.yasseraddussary", name: "Yasser Al-Dosari", label: "الدوسري" },
            { id: "ar.alafasy", name: "Mishary Rashid Alafasy", label: "الافاسي" },
            { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly", label: "المعيقلي" },
            { id: "ar.abdurrahmaansudais", name: "Abdul Rahman Al-Sudais", label: "السديس" }
          ];
          setRecitersList(backup);
          setLoadingReciters(false);
          setReciter("ar.yasseraddussary");
          localStorage.setItem("quran_default_reciter", "ar.yasseraddussary");
        }
      }
    };

    fetchReciters();
    return () => {
      active = false;
    };
  }, []);

  // Navigation & Tabs
  const [activeTab, setActiveTab] = useState<"read" | "tracker" | "bookmarks" | "settings">("read");
  const [selectedSurah, setSelectedSurah] = useState<SurahMetadata | null>(null);
  const [ayahs, setAyahs] = useState<UnifiedAyah[]>([]);
  const [loadingSurah, setLoadingSurah] = useState<boolean>(false);
  const [surahError, setSurahError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deepSearchQuery, setDeepSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "Meccan" | "Medinan">("all");

  // Audio State & Refs
  const isPlaybackActiveRef = useRef<boolean>(false);

  const [playingAyahNum, setPlayingAyahNum] = useState<number | null>(null); // absolute ayah number
  const [playingAyahIndex, setPlayingAyahIndex] = useState<number | null>(null); // index in current surah
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem("quran_audio_volume");
    return saved ? parseFloat(saved) : 0.8;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioSpeed, setAudioSpeed] = useState<number>(() => {
    const saved = localStorage.getItem("quran_audio_speed");
    return saved ? parseFloat(saved) : 1.0;
  });
  const [repeatAyah, setRepeatAyah] = useState<boolean>(false);
  const [repeatSurah, setRepeatSurah] = useState<boolean>(false);
  const [lastListened, setLastListened] = useState<{
    surahNumber: number;
    surahNameEn: string;
    ayahNumber: number;
  } | null>(() => {
    const saved = localStorage.getItem("quran_last_listened");
    return saved ? JSON.parse(saved) : null;
  });
  const [translationLang, setTranslationLang] = useState<"en" | "ur" | "both">(() => {
    return (localStorage.getItem("quran_default_translation") as "en" | "ur" | "both") || "both";
  });
  const [autoPlayNext, setAutoPlayNext] = useState<boolean>(() => {
    const saved = localStorage.getItem("quran_autoplay");
    return saved !== "false";
  });

  // State synchronization refs so event listeners operate on fresh data without re-attaching
  const playingAyahIndexRef = useRef<number | null>(playingAyahIndex);
  playingAyahIndexRef.current = playingAyahIndex;

  const ayahsRef = useRef<UnifiedAyah[]>(ayahs);
  ayahsRef.current = ayahs;

  const repeatAyahRef = useRef<boolean>(repeatAyah);
  repeatAyahRef.current = repeatAyah;

  const repeatSurahRef = useRef<boolean>(repeatSurah);
  repeatSurahRef.current = repeatSurah;

  const reciterRef = useRef<string>(reciter);
  reciterRef.current = reciter;

  const selectedSurahRef = useRef<SurahMetadata | null>(selectedSurah);
  selectedSurahRef.current = selectedSurah;

  const volumeRef = useRef<number>(volume);
  volumeRef.current = volume;

  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;

  const audioSpeedRef = useRef<number>(audioSpeed);
  audioSpeedRef.current = audioSpeed;

  // Bookmarks State
  const [bookmarks, setBookmarks] = useState<{
    surahs: number[]; // surah numbers
    ayahs: { surahNumber: number; surahNameEn: string; ayahNumber: number; textAr: string; timestamp: number }[];
  }>(() => {
    const saved = localStorage.getItem("quran_bookmarks");
    return saved ? JSON.parse(saved) : { surahs: [], ayahs: [] };
  });

  // Memorization Tracker State
  // Map of surahNumber:ayahNumber -> "not_started" | "learning" | "memorized" | "completed"
  const [memorization, setMemorization] = useState<Record<string, "not_started" | "learning" | "memorized" | "completed">>(() => {
    const saved = localStorage.getItem("quran_memorization");
    return saved ? JSON.parse(saved) : {};
  });

  // Interactive Word by Word Mode
  const [isWbwMode, setIsWbwMode] = useState<boolean>(false);
  const [wbwData, setWbwData] = useState<Record<number, WordByWord[]>>({}); // ayahIndex -> words
  const [loadingWbw, setLoadingWbw] = useState<boolean>(false);
  const [hoveredWord, setHoveredWord] = useState<{ ayahIdx: number; wordIdx: number } | null>(null);

  // Tafseer Panel / Modal State
  const [activeTafseer, setActiveTafseer] = useState<{
    ayah: UnifiedAyah;
    loading: boolean;
    error: string | null;
    english?: TafseerData;
    arabic?: TafseerData;
  } | null>(null);

  // Global Audio Engine Integration
  const globalAudio = useGlobalAudio();
  const audioNotice = globalAudio.audioNotice;

  const isPlaying = globalAudio.currentTrack?.sectionType === 'quran' && globalAudio.isPlaying;
  const isAudioLoading = globalAudio.currentTrack?.sectionType === 'quran' && globalAudio.isLoading;

  // Auto-scroll logic helper ref
  const ayahRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // Sync settings (volume, speed) to global audio engine
  useEffect(() => {
    globalAudio.setVolume(isMuted ? 0 : volume);
    globalAudio.setPlaybackSpeed(audioSpeed);
  }, [volume, isMuted, audioSpeed]);

  // Core function to play an Ayah at a specific index in current Surah
  const playAyahAtIndex = (index: number) => {
    if (!ayahsRef.current || index < 0 || index >= ayahsRef.current.length) return;
    const targetAyah = ayahsRef.current[index];

    setPlayingAyahIndex(index);
    setPlayingAyahNum(targetAyah.number);
    playingAyahIndexRef.current = index;
    isPlaybackActiveRef.current = true;

    const track: AudioTrack = {
      id: `quran_ayah_${targetAyah.number}`,
      titleEn: `Surah ${selectedSurah.nameEn} - Verse ${targetAyah.numberInSurah}`,
      titleUr: `سورۃ ${selectedSurah.nameEn} - آیت ${targetAyah.numberInSurah}`,
      categoryEn: "Holy Quran",
      categoryUr: "القرآن الكريم",
      arabicText: targetAyah.arabicText || "",
      transliteration: `Verse ${targetAyah.numberInSurah}`,
      translationEn: targetAyah.englishTranslation,
      translationUr: targetAyah.urduTranslation,
      audioUrl: `https://cdn.alquran.cloud/media/audio/ayah/${reciterRef.current}/${targetAyah.number}`,
      sectionType: "quran"
    };

    // Auto scroll to active playing Ayah
    if (ayahRefs.current[targetAyah.number]) {
      ayahRefs.current[targetAyah.number]?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }

    // Save Last Listened Position
    if (selectedSurahRef.current) {
      const pos = {
        surahNumber: selectedSurahRef.current.number,
        surahNameEn: selectedSurahRef.current.nameEn,
        ayahNumber: targetAyah.numberInSurah
      };
      setLastListened(pos);
      localStorage.setItem("quran_last_listened", JSON.stringify(pos));
    }

    globalAudio.playTrack(track, () => {
      if (repeatAyahRef.current && playingAyahIndexRef.current !== null) {
        playAyahAtIndex(playingAyahIndexRef.current);
      } else if (playingAyahIndexRef.current !== null && ayahsRef.current.length > 0) {
        if (playingAyahIndexRef.current < ayahsRef.current.length - 1) {
          playAyahAtIndex(playingAyahIndexRef.current + 1);
        } else if (repeatSurahRef.current) {
          playAyahAtIndex(0);
        } else {
          isPlaybackActiveRef.current = false;
          setPlayingAyahIndex(null);
          setPlayingAyahNum(null);
        }
      }
    });
  };

  // Reload audio if reciter changes while playback is active
  useEffect(() => {
    if (isPlaybackActiveRef.current && playingAyahIndexRef.current !== null) {
      playAyahAtIndex(playingAyahIndexRef.current);
    }
  }, [reciter]);

  // Save Bookmarks Helper
  const saveBookmarks = (newBookmarks: typeof bookmarks) => {
    setBookmarks(newBookmarks);
    localStorage.setItem("quran_bookmarks", JSON.stringify(newBookmarks));
  };

  // Toggle Surah Bookmark
  const toggleSurahBookmark = (surahNum: number) => {
    const updatedSurahs = [...bookmarks.surahs];
    const index = updatedSurahs.indexOf(surahNum);
    if (index > -1) {
      updatedSurahs.splice(index, 1);
    } else {
      updatedSurahs.push(surahNum);
      onAddPoints(5); // Reward for bookmarking a Surah
    }
    saveBookmarks({ ...bookmarks, surahs: updatedSurahs });
  };

  // Toggle Ayah Bookmark
  const toggleAyahBookmark = (ayah: UnifiedAyah, surah: SurahMetadata) => {
    const updatedAyahs = [...bookmarks.ayahs];
    const existingIdx = updatedAyahs.findIndex(
      (b) => b.surahNumber === surah.number && b.ayahNumber === ayah.numberInSurah
    );

    if (existingIdx > -1) {
      updatedAyahs.splice(existingIdx, 1);
    } else {
      updatedAyahs.push({
        surahNumber: surah.number,
        surahNameEn: surah.nameEn,
        ayahNumber: ayah.numberInSurah,
        textAr: ayah.arabicText,
        timestamp: Date.now()
      });
      onAddPoints(5); // Reward for bookmarking an Ayah
    }
    saveBookmarks({ ...bookmarks, ayahs: updatedAyahs });
  };

  // Toggle Memorization Status
  const updateMemorization = (surahNum: number, ayahNum: number, status: typeof memorization[string]) => {
    const key = `${surahNum}:${ayahNum}`;
    const updated = { ...memorization, [key]: status };
    setMemorization(updated);
    localStorage.setItem("quran_memorization", JSON.stringify(updated));

    if (status === "memorized") {
      onAddPoints(15); // Reward points for memorizing an Ayah
    } else if (status === "completed") {
      onAddPoints(20); // Extra points for completion
    }
  };

  // Fetch Surah from API or Cache
  const handleSelectSurah = async (surah: SurahMetadata) => {
    setSelectedSurah(surah);
    setAyahs([]);
    setSurahError(null);
    setLoadingSurah(true);
    setIsWbwMode(false);
    setWbwData({});

    // Stop currently playing audio of previous surah
    globalAudio.stopTrack();
    isPlaybackActiveRef.current = false;
    setPlayingAyahNum(null);
    setPlayingAyahIndex(null);

    const cacheKey = `quran_cached_surah_${surah.number}`;
    const cachedData = localStorage.getItem(cacheKey);

    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        setAyahs(parsed);
        setLoadingSurah(false);
        return;
      } catch (e) {
        console.warn("Failed to parse cached surah, refetching...", e);
      }
    }

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${surah.number}/editions/quran-simple,en.sahih,ur.maududi,en.transliteration`
      );
      if (!response.ok) {
        throw new Error("Could not fetch Surah content. Please check your internet connection.");
      }

      const resJson = await response.json();
      const data = resJson.data;

      const arabicAyahs = data[0].ayahs;
      const englishAyahs = data[1].ayahs;
      const urduAyahs = data[2].ayahs;
      const translitAyahs = data[3].ayahs;

      const combined: UnifiedAyah[] = arabicAyahs.map((ayah: any, index: number) => {
        // Strip out Bismillah from the first verse if it's not Al-Fatiha, and starts with standard Bismillah
        let cleanArabic = ayah.text;
        const bismillahStr = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ";
        if (surah.number !== 1 && surah.number !== 9 && cleanArabic.startsWith(bismillahStr) && cleanArabic.length > bismillahStr.length) {
          cleanArabic = cleanArabic.substring(bismillahStr.length).trim();
        }

        return {
          numberInSurah: ayah.numberInSurah,
          number: ayah.number,
          arabicText: cleanArabic,
          englishTranslation: englishAyahs[index]?.text || "",
          urduTranslation: urduAyahs[index]?.text || "",
          transliteration: translitAyahs[index]?.text || ""
        };
      });

      // Save to cache
      localStorage.setItem(cacheKey, JSON.stringify(combined));
      setAyahs(combined);
    } catch (err: any) {
      setSurahError(err.message || "Failed to load Surah. Please try again.");
    } finally {
      setLoadingSurah(false);
    }
  };

  // Fetch Word By Word Data on Demand
  const loadWordByWordData = async () => {
    if (!selectedSurah) return;
    if (Object.keys(wbwData).length > 0) {
      setIsWbwMode(true);
      return;
    }

    setLoadingWbw(true);
    const wbwCacheKey = `quran_wbw_surah_${selectedSurah.number}`;
    const cachedWbw = localStorage.getItem(wbwCacheKey);

    if (cachedWbw) {
      try {
        setWbwData(JSON.parse(cachedWbw));
        setIsWbwMode(true);
        setLoadingWbw(false);
        return;
      } catch (e) {
        console.warn("Failed parsing cached Word by Word, fetching...");
      }
    }

    try {
      const response = await fetch(
        `https://api.quran.com/api/v4/verses/by_chapter/${selectedSurah.number}?words=true&word_fields=text_uthmani`
      );
      if (!response.ok) {
        throw new Error("Unable to retrieve word-by-word info.");
      }
      const data = await response.json();
      
      const mappedWbw: Record<number, WordByWord[]> = {};
      data.verses.forEach((verse: VerseWbw, index: number) => {
        mappedWbw[index] = verse.words.map((w: any) => ({
          id: w.id,
          position: w.position,
          text_uthmani: w.text_uthmani,
          transliteration: { text: w.transliteration?.text || "" },
          translation: { text: w.translation?.text || "" },
          audio_url: w.audio_url || ""
        }));
      });

      localStorage.setItem(wbwCacheKey, JSON.stringify(mappedWbw));
      setWbwData(mappedWbw);
      setIsWbwMode(true);
    } catch (err) {
      console.error("Word by word error:", err);
    } finally {
      setLoadingWbw(false);
    }
  };

  // Fetch Tafseer details on demand
  const loadTafseer = async (ayah: UnifiedAyah) => {
    if (!selectedSurah) return;

    setActiveTafseer({
      ayah,
      loading: true,
      error: null
    });

    try {
      // Parallel fetch English Ibn Kathir (ID: 10) & Arabic Al-Muyassar (ID: 3)
      const [enRes, arRes] = await Promise.all([
        fetch(`https://api.quran-tafseer.com/tafseer/10/${selectedSurah.number}/${ayah.numberInSurah}`),
        fetch(`https://api.quran-tafseer.com/tafseer/3/${selectedSurah.number}/${ayah.numberInSurah}`)
      ]);

      let englishTafseer: TafseerData | undefined;
      let arabicTafseer: TafseerData | undefined;

      if (enRes.ok) {
        const enData = await enRes.json();
        englishTafseer = {
          text: enData.text,
          title: "Tafsir Ibn Kathir (English)",
          author: "Imam Ibn Kathir"
        };
      }

      if (arRes.ok) {
        const arData = await arRes.json();
        arabicTafseer = {
          text: arData.text,
          title: "Tafsir Al-Muyassar (Arabic)",
          author: "Group of Scholars"
        };
      }

      setActiveTafseer({
        ayah,
        loading: false,
        error: null,
        english: englishTafseer,
        arabic: arabicTafseer
      });
    } catch (err) {
      setActiveTafseer({
        ayah,
        loading: false,
        error: "Failed to load authentic Tafseer from servers. Please check your network connection."
      });
    }
  };

  // Play/Pause Control
  const handlePlayPause = () => {
    if (globalAudio.isPlaying) {
      globalAudio.pauseTrack();
      isPlaybackActiveRef.current = false;
    } else {
      let indexToPlay = playingAyahIndex !== null ? playingAyahIndex : 0;
      if (indexToPlay >= ayahs.length) indexToPlay = 0;
      playAyahAtIndex(indexToPlay);
    }
  };

  // Specific Ayah Recitation Play
  const playSpecificAyah = (ayah: UnifiedAyah, index: number) => {
    if (playingAyahIndex === index && (isPlaying || isAudioLoading)) {
      handlePlayPause();
    } else {
      playAyahAtIndex(index);
    }
  };

  // Next Ayah Button Action
  const handleNextAyah = () => {
    if (playingAyahIndex !== null && playingAyahIndex < ayahs.length - 1) {
      playAyahAtIndex(playingAyahIndex + 1);
    }
  };

  // Previous Ayah Button Action
  const handlePrevAyah = () => {
    if (playingAyahIndex !== null && playingAyahIndex > 0) {
      playAyahAtIndex(playingAyahIndex - 1);
    }
  };

  // Stop Action
  const handleStop = () => {
    globalAudio.stopTrack();
    isPlaybackActiveRef.current = false;
    setPlayingAyahNum(null);
    setPlayingAyahIndex(null);
  };

  // Play Word Sound in Word-by-Word Mode
  const playWordAudio = (word: WordByWord) => {
    if (word.audio_url) {
      const fullUrl = word.audio_url.startsWith("http")
        ? word.audio_url
        : word.audio_url.startsWith("//")
        ? `https:${word.audio_url}`
        : `https://audio.quran.com/${word.audio_url}`;

      const wordTrack: AudioTrack = {
        id: `quran_word_${word.position || Date.now()}`,
        titleEn: word.transliteration?.text || word.text_uthmani || "Word",
        titleUr: word.translation?.text || word.text_uthmani || "Word",
        categoryEn: "Word Pronunciation",
        categoryUr: "تلفظ",
        arabicText: word.text_uthmani || "",
        audioUrl: fullUrl,
        sectionType: "quran"
      };

      globalAudio.playTrack(wordTrack);
    }
  };

  // Resume last listened Surah
  const resumeLastListened = () => {
    if (lastListened) {
      const surahObj = SURAH_LIST.find((s) => s.number === lastListened.surahNumber);
      if (surahObj) {
        handleSelectSurah(surahObj).then(() => {
          setTimeout(() => {
            const index = lastListened.ayahNumber - 1;
            setAyahs((currentAyahs) => {
              if (currentAyahs && currentAyahs[index]) {
                playAyahAtIndex(index);
              }
              return currentAyahs;
            });
          }, 800);
        });
      }
    }
  };

  // Audio helper resolution using AlQuran Cloud CDN with absolute ayah number
  function getAudioUrl(reciterKey: string, absoluteAyahNum: number): string {
    return `https://cdn.alquran.cloud/media/audio/ayah/${reciterKey}/${absoluteAyahNum}`;
  }

  // Filter Surah list based on Search & Revelation Type
  const filteredSurahs = SURAH_LIST.filter((surah) => {
    const matchesSearch =
      surah.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.nameUr.includes(searchQuery) ||
      surah.nameAr.includes(searchQuery) ||
      surah.translationEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.number.toString() === searchQuery.trim();

    const matchesFilter = filterType === "all" || surah.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // Filter verses of currently open surah for deep search
  const filteredAyahs = ayahs.filter((ayah) => {
    if (!deepSearchQuery) return true;
    const cleanQuery = deepSearchQuery.toLowerCase().trim();
    return (
      ayah.englishTranslation.toLowerCase().includes(cleanQuery) ||
      ayah.urduTranslation.includes(cleanQuery) ||
      ayah.arabicText.includes(cleanQuery) ||
      ayah.transliteration.toLowerCase().includes(cleanQuery) ||
      ayah.numberInSurah.toString() === cleanQuery
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6" id="quran-root">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 bg-gradient-to-r from-emerald-50 to-teal-100 dark:from-emerald-950/20 dark:to-teal-950/30 p-6 rounded-3xl border border-emerald-100/60 dark:border-emerald-800/40">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-md shadow-emerald-500/20">
            <Book className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              The Holy Quran
              <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                Kids Edition
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Explore 114 Surahs with beautiful recitations, offline support, memorization tracker, and word meanings! 🌟
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lastListened && (
            <button
              onClick={resumeLastListened}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-2 shadow-sm animate-bounce"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
              Resume Last: Surah {lastListened.surahNameEn} ({lastListened.ayahNumber})
            </button>
          )}
          <button
            onClick={selectedSurah ? () => setSelectedSurah(null) : onNavigateHome}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 rounded-xl font-extrabold text-xs transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" /> {selectedSurah ? "Exit Surah" : "Back to Home"}
          </button>
        </div>
      </div>

      {/* MAIN NAVIGATION TABS */}
      {!selectedSurah && (
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab("read")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "read"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            114 Surahs
          </button>
          <button
            onClick={() => setActiveTab("tracker")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "tracker"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            Memorization Tracker
          </button>
          <button
            onClick={() => setActiveTab("bookmarks")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "bookmarks"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Bookmark className="w-4 h-4" />
            My Bookmarks
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            Quran Settings
          </button>
        </div>
      )}

      {/* SURAH READER VIEW */}
      {selectedSurah ? (
        <div className="space-y-6">
          {/* SURAH PERSISTENT HEADER BANNER */}
          <div className="bg-gradient-to-r from-teal-600 via-emerald-600 to-emerald-700 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-5 pointer-events-none">
              <Book className="w-64 h-64" />
            </div>
            
            <button
              onClick={() => setSelectedSurah(null)}
              className="absolute top-4 left-4 bg-white/20 hover:bg-white/35 text-white p-2 rounded-full backdrop-blur-xs transition-colors"
              title="Back to Surahs List"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 relative z-10 pt-4">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 border border-white/20 uppercase tracking-widest">
                    Surah {selectedSurah.number}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 border border-white/20 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    {selectedSurah.type}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black bg-white/10 border border-white/20 uppercase tracking-widest">
                    {selectedSurah.versesCount} Verses
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold">{selectedSurah.nameEn}</h2>
                <p className="text-xs text-teal-100 max-w-md font-medium leading-relaxed">
                  {selectedSurah.description}
                </p>
              </div>
              <div className="text-center sm:text-right">
                <h2 className="text-5xl font-arabic font-extrabold text-amber-300 drop-shadow-xs">
                  {selectedSurah.nameAr}
                </h2>
                <span className="text-xl font-urdu text-teal-50 block mt-1">
                  {selectedSurah.nameUr}
                </span>
                <span className="text-xs text-teal-100 italic block mt-0.5">
                  ({selectedSurah.translationEn})
                </span>
              </div>
            </div>

            {/* QUICK ACTIONS ON HEADER */}
            <div className="mt-6 pt-4 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 relative z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleSurahBookmark(selectedSurah.number)}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black ${
                    bookmarks.surahs.includes(selectedSurah.number)
                      ? "bg-amber-400 text-slate-900"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5 fill-current" />
                  {bookmarks.surahs.includes(selectedSurah.number) ? "Bookmarked!" : "Bookmark Surah"}
                </button>
                <button
                  onClick={loadWordByWordData}
                  disabled={loadingWbw}
                  className={`p-2 rounded-xl transition-all flex items-center gap-1.5 text-xs font-black ${
                    isWbwMode
                      ? "bg-amber-400 text-slate-900"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {loadingWbw ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {isWbwMode ? "Exit Word-by-Word" : "Word by Word Meaning"}
                </button>
                {isWbwMode && (
                  <button
                    onClick={() => setIsWbwMode(false)}
                    className="p-2 bg-red-500/20 hover:bg-red-500/35 text-red-100 rounded-xl text-xs font-black transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>

              {/* MEMORIZATION STATUS TOGGLE FOR SURAH */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                <span className="text-[10px] font-black uppercase text-teal-100 px-2">Surah Tracker:</span>
                {(["not_started", "learning", "memorized", "completed"] as const).map((st) => {
                  const key = `${selectedSurah.number}:all`;
                  const isCurrent = memorization[key] === st || (st === "not_started" && !memorization[key]);
                  const labelMap = {
                    not_started: "Not Started",
                    learning: "Learning",
                    memorized: "Memorized",
                    completed: "Completed"
                  };
                  return (
                    <button
                      key={st}
                      onClick={() => updateMemorization(selectedSurah.number, 999, st)} // 999 acts as full surah
                      className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                        isCurrent
                          ? st === "completed"
                            ? "bg-emerald-500 text-white"
                            : st === "memorized"
                            ? "bg-amber-400 text-slate-900"
                            : st === "learning"
                            ? "bg-blue-400 text-white"
                            : "bg-white/20 text-white"
                          : "text-white/60 hover:text-white"
                      }`}
                    >
                      {labelMap[st]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* INTERNAL SURAH DEEP SEARCH */}
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Search in this Surah (e.g. English, Urdu, Arabic)..."
              value={deepSearchQuery}
              onChange={(e) => setDeepSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-8 py-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
            />
            {deepSearchQuery && (
              <button
                onClick={() => setDeepSearchQuery("")}
                className="absolute right-3 top-3 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>

          {/* LOADING & ERROR HANDLING */}
          {loadingSurah && (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
              <p className="text-xs text-slate-500 font-bold animate-pulse">
                Retrieving sacred verses from AlQuran Cloud API...
              </p>
            </div>
          )}

          {surahError && (
            <div className="p-8 text-center bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-3xl max-w-md mx-auto space-y-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
              <h3 className="text-lg font-bold text-red-800 dark:text-red-200">Failed to Load</h3>
              <p className="text-xs text-red-600 dark:text-red-300">{surahError}</p>
              <button
                onClick={() => handleSelectSurah(selectedSurah)}
                className="px-4 py-2 bg-red-600 text-white text-xs font-black rounded-xl hover:bg-red-700 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          )}

          {audioNotice && (
            <div className="mb-4">
              <AudioNotAvailableNotice
                variant="card"
                title="Audio Not Available"
                reason={audioNotice}
                description="To ensure 100% accuracy in Quranic recitation, reciter audio streams undergo scholar verification. Full Uthmani Arabic script, transliteration, and English/Urdu translations remain completely accessible."
                onRetry={() => {
                  globalAudio.clearNotice();
                  if (playingAyahIndex !== null) playAyahAtIndex(playingAyahIndex);
                }}
                onDismiss={() => globalAudio.clearNotice()}
                actionText="Read Verses Below"
              />
            </div>
          )}

          {/* BISMILLAH BLOCK (If not Surah Al-Fatiha or At-Tawbah) */}
          {!loadingSurah && !surahError && selectedSurah.number !== 1 && selectedSurah.number !== 9 && (
            <div className="text-center py-8 bg-white dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800/80 shadow-2xs">
              <h3 className="text-4xl font-arabic font-extrabold text-emerald-700 dark:text-emerald-400">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </h3>
              <p className="text-xs text-slate-400 mt-2 font-medium">
                In the name of Allah, the Most Gracious, the Most Merciful
              </p>
            </div>
          )}

          {/* VERSE BY VERSE LIST */}
          {!loadingSurah && !surahError && (
            <div className="space-y-6 pb-40">
              {filteredAyahs.map((ayah, index) => {
                const isPlayingActive = playingAyahNum === ayah.number;
                const ayahKey = `${selectedSurah.number}:${ayah.numberInSurah}`;
                const mStatus = memorization[ayahKey] || "not_started";

                return (
                  <div
                    key={ayah.number}
                    ref={(el) => {
                      ayahRefs.current[ayah.number] = el;
                    }}
                    className={`p-6 bg-white dark:bg-slate-850 rounded-3xl border transition-all duration-300 flex flex-col md:flex-row gap-6 relative group ${
                      isPlayingActive
                        ? "border-emerald-500 ring-2 ring-emerald-500/10 shadow-lg shadow-emerald-500/5 bg-emerald-50/5"
                        : "border-slate-100 dark:border-slate-800/80 hover:border-emerald-200 dark:hover:border-slate-700 shadow-2xs"
                    }`}
                  >
                    {/* LEFT CONTROLS (Number, Play, Bookmark) */}
                    <div className="flex md:flex-col gap-2.5 items-center justify-between w-full md:w-auto md:self-stretch border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800/60 pb-3 md:pb-0 md:pr-4">
                      <div className="flex md:flex-col gap-2 items-center">
                        <div className="w-9 h-9 rounded-2xl bg-emerald-100/50 dark:bg-slate-800 text-xs font-black flex items-center justify-center text-emerald-700 dark:text-teal-400 shadow-3xs">
                          {ayah.numberInSurah}
                        </div>
                        <button
                          onClick={() => playSpecificAyah(ayah, index)}
                          className={`p-3 rounded-2xl transition-all shadow-3xs ${
                            isPlayingActive
                              ? "bg-amber-400 text-slate-900 animate-pulse"
                              : "bg-emerald-50 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white"
                          }`}
                          title={isPlayingActive ? "Pause Audio" : "Play Recitation"}
                        >
                          {isPlayingActive && isAudioLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-slate-900" />
                          ) : isPlayingActive && isPlaying ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current" />
                          )}
                        </button>
                      </div>

                      <div className="flex md:flex-col gap-2">
                        {/* Bookmark Button */}
                        <button
                          onClick={() => toggleAyahBookmark(ayah, selectedSurah)}
                          className={`p-2 rounded-xl transition-colors ${
                            bookmarks.ayahs.some(
                              (b) => b.surahNumber === selectedSurah.number && b.ayahNumber === ayah.numberInSurah
                            )
                              ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                              : "text-slate-400 hover:text-slate-600 bg-slate-50 dark:bg-slate-800"
                          }`}
                          title="Bookmark Ayah"
                        >
                          <Bookmark className="w-4 h-4 fill-current" />
                        </button>

                        {/* Tafseer Button */}
                        <button
                          onClick={() => loadTafseer(ayah)}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 bg-emerald-50/50 dark:bg-slate-800 rounded-xl transition-colors"
                          title="View Authentic Tafseer"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* TEXT CONTENT CONTAINER */}
                    <div className="flex-1 space-y-6 w-full">
                      {/* WORD-BY-WORD LAYOUT OR STANDARD ARABIC */}
                      {isWbwMode && wbwData[index] ? (
                        <div className="flex flex-wrap justify-end gap-x-4 gap-y-6 direction-rtl" dir="rtl">
                          {wbwData[index].map((word, wordIdx) => {
                            const isHovered =
                              hoveredWord?.ayahIdx === index && hoveredWord?.wordIdx === wordIdx;
                            return (
                              <div
                                key={word.id}
                                onMouseEnter={() => setHoveredWord({ ayahIdx: index, wordIdx: wordIdx })}
                                onMouseLeave={() => setHoveredWord(null)}
                                onClick={() => playWordAudio(word)}
                                className={`flex flex-col items-center p-2 rounded-xl cursor-pointer transition-all duration-200 border ${
                                  isHovered
                                    ? "bg-amber-50 border-amber-300 scale-105 shadow-sm dark:bg-amber-950/20"
                                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800"
                                }`}
                              >
                                <span className="text-3xl font-arabic font-extrabold text-slate-850 dark:text-slate-100 select-none">
                                  {word.text_uthmani}
                                </span>
                                <span className="text-[10px] font-sans font-bold text-emerald-600 dark:text-teal-400 mt-1 select-none">
                                  {word.transliteration.text}
                                </span>
                                <span className="text-[11px] font-sans font-black text-slate-700 dark:text-slate-300 select-none text-center max-w-[120px] leading-tight">
                                  {word.translation.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-2">
                          <h3 className="text-2xl sm:text-3xl md:text-4xl font-arabic font-bold text-slate-800 dark:text-slate-50 leading-loose select-text select-all break-words max-w-full overflow-hidden">
                            {ayah.arabicText}
                          </h3>
                        </div>
                      )}

                      {/* TRANSLITERATION */}
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 italic font-sans leading-relaxed">
                        {ayah.transliteration}
                      </p>

                      {/* TRANSLATIONS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-50 dark:border-slate-800/40">
                        {/* English Translation */}
                        {(translationLang === "en" || translationLang === "both") && (
                          <div className="space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block">
                              English Translation
                            </span>
                            <p className="text-sm font-sans font-medium text-slate-700 dark:text-slate-300 leading-relaxed select-text">
                              {ayah.englishTranslation}
                            </p>
                          </div>
                        )}

                        {/* Urdu Translation */}
                        {(translationLang === "ur" || translationLang === "both") && (
                          <div className="space-y-1 sm:text-right">
                            <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest block">
                              اردو ترجمہ
                            </span>
                            <p className="text-base font-urdu font-medium text-emerald-800 dark:text-emerald-400 leading-relaxed select-text">
                              {ayah.urduTranslation}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* INDIVIDUAL AYAH MEMORIZATION TRACKER ROW */}
                      <div className="pt-3 border-t border-dashed border-slate-100 dark:border-slate-800/40 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                          Track Ayah:
                        </span>
                        <div className="flex items-center gap-1">
                          {(["not_started", "learning", "memorized"] as const).map((st) => {
                            const isCurrent = mStatus === st;
                            const colorMap = {
                              not_started: "bg-slate-100 dark:bg-slate-800 text-slate-500",
                              learning: "bg-blue-500 text-white shadow-sm",
                              memorized: "bg-amber-400 text-slate-950 font-black shadow-sm"
                            };
                            return (
                              <button
                                key={st}
                                onClick={() => updateMemorization(selectedSurah.number, ayah.numberInSurah, st)}
                                className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase transition-all ${
                                  isCurrent
                                    ? colorMap[st]
                                    : "text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                }`}
                              >
                                {st.replace("_", " ")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* GRID OF 114 SURAHS LISTING */
        <div>
          {/* GENERAL QURAN SUB-TABS CONTENT */}
          {activeTab === "read" && (
            <div className="space-y-6">
              {/* FILTER BAR & SEARCH BAR */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white dark:bg-slate-850 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by Surah Name (English, Arabic, Urdu), Number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:text-slate-100"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-3 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  )}
                </div>

                <div className="flex gap-1.5 self-stretch sm:self-auto overflow-x-auto">
                  {(["all", "Meccan", "Medinan"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setFilterType(type)}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                        filterType === type
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      {type === "all" ? "All Revelations" : type}
                    </button>
                  ))}
                </div>
              </div>

              {/* SURAH GRID LIST */}
              {filteredSurahs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSurahs.map((surah) => {
                    const isCompleted = memorization[`${surah.number}:999`] === "completed" || bookmarks.surahs.includes(surah.number);
                    return (
                      <motion.div
                        key={surah.number}
                        whileHover={{ y: -4 }}
                        onClick={() => handleSelectSurah(surah)}
                        className="bg-white dark:bg-slate-850 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-3xs hover:border-emerald-300 dark:hover:border-slate-700 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4 group relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-sm shadow-3xs">
                              {surah.number}
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {surah.nameEn}
                              </h3>
                              <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                {surah.versesCount} Verses • {surah.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <h3 className="text-2xl font-bold font-arabic text-emerald-700 dark:text-teal-400 leading-normal">
                              {surah.nameAr}
                            </h3>
                            <span className="text-xs font-urdu font-semibold text-slate-400 block mt-0.5">
                              {surah.nameUr}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                          {surah.description}
                        </p>

                        <div className="pt-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            {isCompleted ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" /> Bookmarked / Tracked
                              </>
                            ) : (
                              "Tap to read & listen"
                            )}
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-white dark:bg-slate-850 rounded-3xl border border-dashed border-slate-200 dark:border-slate-850 space-y-4 max-w-md mx-auto">
                  <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="text-lg font-bold text-slate-700 dark:text-slate-300">No Surahs Found</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Try adjusting your filter or search with another term!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MEMORIZATION TRACKER SUB-TAB */}
          {activeTab === "tracker" && (
            <div className="space-y-6 bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-400 text-slate-900 rounded-xl">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100">
                    My Memorization Tracker
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Keep a record of the beautiful Quranic verses you have learned, memorized, or completed! 🏅
                  </p>
                </div>
              </div>

              {Object.keys(memorization).length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* STATS SUMMARY BOXES */}
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-900">
                      <span className="text-[10px] font-black uppercase text-blue-600 block">Learning Mode</span>
                      <h3 className="text-3xl font-extrabold text-blue-800 dark:text-blue-400 mt-1">
                        {Object.values(memorization).filter(v => v === "learning").length}
                      </h3>
                      <span className="text-xs text-blue-500 mt-1 block">Verses actively in progress</span>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-900">
                      <span className="text-[10px] font-black uppercase text-amber-600 block">Memorized</span>
                      <h3 className="text-3xl font-extrabold text-amber-800 dark:text-amber-400 mt-1">
                        {Object.values(memorization).filter(v => v === "memorized").length}
                      </h3>
                      <span className="text-xs text-amber-500 mt-1 block">Successfully memorized</span>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900">
                      <span className="text-[10px] font-black uppercase text-emerald-600 block">Completed</span>
                      <h3 className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-400 mt-1">
                        {Object.values(memorization).filter(v => v === "completed").length}
                      </h3>
                      <span className="text-xs text-emerald-500 mt-1 block">Fully learned Surahs</span>
                    </div>
                  </div>

                  {/* LIST OF TRACKED ITEMS */}
                  <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3">
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Tracking Progress Details:</h3>
                    <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
                      {Object.entries(memorization).map(([key, value]) => {
                        const [sNumStr, aNumStr] = key.split(":");
                        const sNum = parseInt(sNumStr);
                        const aNum = parseInt(aNumStr);
                        const surah = SURAH_LIST.find(s => s.number === sNum);

                        if (!surah) return null;

                        return (
                          <div
                            key={key}
                            onClick={() => handleSelectSurah(surah)}
                            className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-teal-400 text-xs font-black flex items-center justify-center">
                                {surah.number}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">
                                  {surah.nameEn}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 block uppercase">
                                  {aNum === 999 ? "Entire Surah Track" : `Ayah ${aNum}`}
                                </span>
                              </div>
                            </div>

                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              value === "completed"
                                ? "bg-emerald-500 text-white"
                                : value === "memorized"
                                ? "bg-amber-400 text-slate-900"
                                : "bg-blue-500 text-white"
                            }`}>
                              {(value as string).replace("_", " ")}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 space-y-4">
                  <Activity className="w-16 h-16 text-slate-200 mx-auto animate-pulse" />
                  <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">No tracked items yet!</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    Open any Surah and toggle its status or individual verses to track your learning journey!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* MY BOOKMARKS SUB-TAB */}
          {activeTab === "bookmarks" && (
            <div className="space-y-6">
              {/* BOOKMARKED SURAHS */}
              <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Bookmark className="w-4 h-4 text-amber-500 fill-current" />
                  Bookmarked Surahs ({bookmarks.surahs.length})
                </h3>
                {bookmarks.surahs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {bookmarks.surahs.map((num) => {
                      const surah = SURAH_LIST.find(s => s.number === num);
                      if (!surah) return null;
                      return (
                        <div
                          key={num}
                          onClick={() => handleSelectSurah(surah)}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex items-center justify-between"
                        >
                          <div>
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{surah.nameEn}</h4>
                            <span className="text-[10px] text-slate-400 block uppercase font-bold">Surah {num}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No bookmarked Surahs yet.</p>
                )}
              </div>

              {/* BOOKMARKED AYAHS */}
              <div className="bg-white dark:bg-slate-850 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs">
                <h3 className="text-base font-black text-slate-850 dark:text-slate-100 flex items-center gap-2 mb-4">
                  <Bookmark className="w-4 h-4 text-amber-500 fill-current" />
                  Saved Verses / Ayahs ({bookmarks.ayahs.length})
                </h3>
                {bookmarks.ayahs.length > 0 ? (
                  <div className="space-y-4">
                    {bookmarks.ayahs.map((b, idx) => {
                      const surah = SURAH_LIST.find(s => s.number === b.surahNumber);
                      return (
                        <div
                          key={idx}
                          onClick={() => surah && handleSelectSurah(surah)}
                          className="p-4 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/50 rounded-2xl cursor-pointer transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                        >
                          <div>
                            <span className="text-[9px] font-black uppercase text-emerald-600 dark:text-teal-400 tracking-wider">
                              {b.surahNameEn} : Ayah {b.ayahNumber}
                            </span>
                            <h4 className="text-lg font-arabic text-slate-800 dark:text-slate-100 mt-1 text-right">
                              {b.textAr}
                            </h4>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 self-end sm:self-auto" />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No saved Verses yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SETTINGS SUB-TAB */}
          {activeTab === "settings" && (
            <div className="bg-white dark:bg-slate-850 p-6 sm:p-8 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500 text-white rounded-xl">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-850 dark:text-slate-100">
                    Quran Audio & Reading Settings
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Customize the default reciter, translation language, speed, and automated triggers. ⚙️
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800/60">
                {/* SELECT DEFAULT RECITER */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                    Default Reciter (Qari)
                  </label>
                  {loadingReciters ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Loading official reciter list...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                      {recitersList.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => {
                            setReciter(r.id);
                            localStorage.setItem("quran_default_reciter", r.id);
                          }}
                          className={`p-3.5 rounded-2xl border text-xs font-bold text-left transition-all flex items-center justify-between ${
                            reciter === r.id
                              ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-teal-300"
                              : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <span>{r.name}</span>
                          <span className="font-arabic text-[10px] font-normal opacity-85 whitespace-nowrap">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* SELECT DEFAULT TRANSLATION LANGUAGE */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                      Translation Display Mode
                    </label>
                    <div className="flex gap-2">
                      {(["both", "en", "ur"] as const).map((lang) => {
                        const labels = { both: "English & Urdu", en: "English Only", ur: "Urdu Only" };
                        return (
                          <button
                            key={lang}
                            onClick={() => {
                              setTranslationLang(lang);
                              localStorage.setItem("quran_default_translation", lang);
                            }}
                            className={`flex-1 p-3 rounded-2xl border text-xs font-bold transition-all text-center ${
                              translationLang === lang
                                ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-teal-300"
                                : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {labels[lang]}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* AUTO PLAY TOGGLE */}
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">
                      Auto-Play Next Verse
                    </label>
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl">
                      <input
                        type="checkbox"
                        checked={autoPlayNext}
                        onChange={(e) => {
                          setAutoPlayNext(e.target.checked);
                          localStorage.setItem("quran_autoplay", e.target.checked.toString());
                        }}
                        className="w-4.5 h-4.5 text-emerald-600 border-slate-300 rounded-sm focus:ring-emerald-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block">
                          Automatically transition to next verse
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          When recitation of the current verse ends, the player will start the next one instantly.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PERSISTENT FLOATING QURAN AUDIO PLAYER BANNER (Only shows when playing an Ayah) */}
      {selectedSurah && (playingAyahNum !== null || isPlaying) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/60 shadow-2xl rounded-3xl p-4 sm:p-5 flex flex-col gap-4 z-40 transition-all duration-300">
          {/* PLAYER INFO HEADER */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center animate-spin" style={{ animationDuration: '4s' }}>
                <Music className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-850 dark:text-slate-100">
                  Surah {selectedSurah.nameEn} • {playingAyahIndex !== null ? `Ayah ${ayahs[playingAyahIndex]?.numberInSurah}` : ""}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium">
                  Reciting in voice of: <span className="font-bold text-emerald-600 dark:text-teal-400">{recitersList.find(r => r.id === reciter)?.name || (reciter === "ar.yasseraddussary" ? "Yasser Al-Dosari" : reciter)}</span>
                </p>
              </div>
            </div>
            <button
              onClick={handleStop}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-red-500"
              title="Close Player"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* CONTROLS ROW */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {/* Prev Button */}
              <button
                onClick={handlePrevAyah}
                disabled={playingAyahIndex === 0}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40"
                title="Previous Ayah"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Stop Button */}
              <button
                onClick={handleStop}
                className="p-2 bg-red-50 text-red-500 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 rounded-xl transition-colors"
                title="Stop Audio"
              >
                <X className="w-4.5 h-4.5" />
              </button>

              {/* Play Pause Big Button */}
              <button
                onClick={handlePlayPause}
                className="p-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl shadow-md shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                title={isPlaying ? "Pause Recitation" : "Play Recitation"}
              >
                {isAudioLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current" />
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={handleNextAyah}
                disabled={playingAyahIndex === ayahs.length - 1}
                className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 disabled:opacity-40"
                title="Next Ayah"
              >
                <RotateCcw className="w-4 h-4 transform scale-x-[-1]" />
              </button>
            </div>

            {/* SPEED & REPEAT CONTROLS */}
            <div className="flex items-center gap-2">
              {/* Repeat Ayah */}
              <button
                onClick={() => setRepeatAyah(!repeatAyah)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                  repeatAyah
                    ? "bg-amber-400 text-slate-900 border border-amber-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent"
                }`}
                title="Repeat Current Ayah"
              >
                🔁 One
              </button>

              {/* Repeat Surah */}
              <button
                onClick={() => setRepeatSurah(!repeatSurah)}
                className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${
                  repeatSurah
                    ? "bg-amber-400 text-slate-900 border border-amber-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-transparent"
                }`}
                title="Repeat Entire Surah"
              >
                🔁 Surah
              </button>

              {/* Audio Speed Selection */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                {([0.75, 1.0, 1.25] as const).map((sp) => (
                  <button
                    key={sp}
                    onClick={() => {
                      setAudioSpeed(sp);
                      localStorage.setItem("quran_audio_speed", sp.toString());
                    }}
                    className={`px-2 py-1 rounded-lg text-[9px] font-black transition-all ${
                      audioSpeed === sp
                        ? "bg-emerald-500 text-white shadow-3xs"
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {sp === 1.0 ? "Normal" : `${sp}x`}
                  </button>
                ))}
              </div>
            </div>

            {/* VOLUME CONTROL */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4.5 h-4.5 text-red-500" />
                ) : (
                  <Volume2 className="w-4.5 h-4.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setVolume(val);
                  setIsMuted(false);
                  localStorage.setItem("quran_audio_volume", val.toString());
                }}
                className="w-16 sm:w-24 accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAFSEER EXPANDABLE DIALOG MODAL PANEL */}
      <AnimatePresence>
        {activeTafseer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveTafseer(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
            />

            {/* Modal Content container */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-emerald-100 dark:border-emerald-800 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-6 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white/10 rounded-xl">
                    <Book className="w-5 h-5 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold">Sacred Tafseer Meaning Explorer</h3>
                    <p className="text-[10px] text-teal-100 font-bold uppercase tracking-widest">
                      Surah {selectedSurah?.nameEn} : Verse / Ayah {activeTafseer.ayah.numberInSurah}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTafseer(null)}
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body Scroll Container */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                {/* Verse box wrapper */}
                <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-2xl font-arabic font-extrabold text-right text-slate-800 dark:text-slate-50 leading-relaxed">
                    {activeTafseer.ayah.arabicText}
                  </h4>
                  <p className="text-xs font-bold text-emerald-600 dark:text-teal-400 italic">
                    {activeTafseer.ayah.transliteration}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                    {activeTafseer.ayah.englishTranslation}
                  </p>
                </div>

                {/* Loading State inside modal */}
                {activeTafseer.loading && (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
                    <p className="text-xs text-slate-500 font-bold animate-pulse">
                      Retrieving authentic Tafseer Ibn Kathir text from servers...
                    </p>
                  </div>
                )}

                {/* Error handling inside modal */}
                {activeTafseer.error && (
                  <div className="p-5 text-center bg-red-50 dark:bg-red-950/20 border border-red-150 rounded-2xl space-y-3">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
                    <p className="text-xs text-red-600 dark:text-red-300 font-semibold">{activeTafseer.error}</p>
                    <button
                      onClick={() => loadTafseer(activeTafseer.ayah)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase rounded-lg transition-colors"
                    >
                      Retry Server Connection
                    </button>
                  </div>
                )}

                {/* RENDER DYNAMIC AUTHENTIC TAFSEER TEXT */}
                {!activeTafseer.loading && !activeTafseer.error && (
                  <div className="space-y-6">
                    {/* English Tafseer block */}
                    {activeTafseer.english && (
                      <div className="space-y-2 bg-emerald-50/20 dark:bg-slate-800/20 p-5 rounded-2xl border border-emerald-100/50 dark:border-slate-800">
                        <div className="flex justify-between items-center pb-2 border-b border-emerald-50 dark:border-slate-800/40">
                          <h4 className="text-xs font-black uppercase text-emerald-700 dark:text-teal-300 tracking-wider">
                            {activeTafseer.english.title}
                          </h4>
                          <span className="text-[9px] font-black uppercase text-slate-400">
                            By {activeTafseer.english.author}
                          </span>
                        </div>
                        <p className="text-sm font-sans text-slate-700 dark:text-slate-300 leading-relaxed pt-2 whitespace-pre-line select-text">
                          {activeTafseer.english.text}
                        </p>
                      </div>
                    )}

                    {/* Arabic Tafseer block */}
                    {activeTafseer.arabic && (
                      <div className="space-y-2 bg-emerald-50/20 dark:bg-slate-800/20 p-5 rounded-2xl border border-emerald-100/50 dark:border-slate-800 text-right">
                        <div className="flex justify-between items-center pb-2 border-b border-emerald-50 dark:border-slate-800/40 direction-rtl" dir="rtl">
                          <h4 className="text-xs font-black uppercase text-emerald-700 dark:text-teal-300 tracking-wider">
                            {activeTafseer.arabic.title}
                          </h4>
                          <span className="text-[9px] font-black uppercase text-slate-400">
                            تفسير: {activeTafseer.arabic.author}
                          </span>
                        </div>
                        <p className="text-base font-arabic text-slate-800 dark:text-slate-200 leading-loose pt-2 whitespace-pre-line select-text" dir="rtl">
                          {activeTafseer.arabic.text}
                        </p>
                      </div>
                    )}

                    {/* CHILD FRIENDLY WISDOM NOTICE BANNER */}
                    <div className="p-4 bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-750 rounded-2xl flex gap-3">
                      <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-100 block">
                          Tip for Parents & Teachers:
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block leading-normal mt-0.5">
                          Discuss this authentic Tafseer explanation with your child to help them connect the lesson to daily behaviors like sharing, truthfulness, and kindness!
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
