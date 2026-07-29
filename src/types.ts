export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number; // 0-based index of correct option
  explanation: string;
}

export interface IslamicReference {
  type: 'quran' | 'hadith' | 'historical';
  source: string; // e.g. "Surah Al-Anbya", "Sahih al-Bukhari"
  referenceKey: string; // e.g. "21:76", "Volume 4, Book 54, Number 524"
  verificationStatus: 'verified' | 'pending';
}

export interface Story {
  id: string;
  titleEn: string;
  titleUr: string;
  titleAr?: string; // Arabic story title
  category: string;
  prophetName?: string; // Prophet associated with this story, if any
  readingTime: number; // in minutes
  ageGroup: '4-6' | '7-9' | '10-12' | 'all';
  coverImage: string;
  shortDescriptionEn: string;
  shortDescriptionUr: string;
  shortDescriptionAr?: string; // Arabic short description
  contentEn: string; // English translation / main text
  contentUr: string; // Urdu text
  contentAr?: string; // Arabic text
  lessonsEn: string[];
  lessonsUr: string[];
  lessonsAr?: string[]; // Arabic lessons
  references: IslamicReference[];
  authenticSources?: string[];
  authenticityStatus?: 'Verified' | 'Pending' | 'Unverified';
  parentTeacherNoteEn?: string;
  parentTeacherNoteUr?: string;
  parentTeacherNoteAr?: string; // Arabic parent-teacher note
  quiz: QuizQuestion[];
  isFeatured: boolean;
  status: 'draft' | 'published';
  createdAt: string;
  tags: string[];
  slug: string;
  updatedAt?: string; // Automatically updated when edited
  seoMetaTitle?: string; // SEO meta title for this story
  seoMetaDescription?: string; // SEO meta description for this story
  views?: number; // Real-time view counts
  author?: string; // Story compiled author
  audioUrlEn?: string; // Optional pre-recorded or generated narration audio URL (English)
  audioUrlUr?: string; // Optional pre-recorded or generated narration audio URL (Urdu)
  hasOfflineAudio?: boolean; // Flag indicating offline audio is cached
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // Emoji
  color: string; // Tailwind class
  earnedAt: string;
}

export interface KidProfile {
  id: string;
  parentId: string;
  name: string;
  age: number;
  avatar: string;
  points: number;
  streak: number;
  lastActive: string;
  favoriteStories: string[];
  badges: Badge[];
  completedStories: string[];
  lastStoryRead?: string;
  lastVideoWatched?: string;
  readingPercentage: number;
  readingTime: number; // minutes spent
  quizScores: Record<string, number>;
  createdAt: string;
}

export interface DailyNotification {
  id: string;
  title: string;
  body: string;
  type: "story" | "video" | "quiz" | "general";
  actionUrl?: string;
  createdAt: string;
  read: boolean;
}

export interface UserProgress {
  completedStories: string[]; // List of story IDs completed
  quizScores: Record<string, number>; // storyId -> high score
  bookmarkedStories: string[]; // List of bookmarked story IDs
  lastReadStoryId?: string;
  points: number;
}

export interface Hadith {
  id: string;
  titleEn: string;
  titleUr: string;
  category: string; // e.g. "Kindness", "Manners", "Truthfulness", "Cleanliness", "Faith", "character", "quran", etc.
  arabicText: string;
  translationEn: string;
  translationUr: string;
  book: string; // Hadith Book, e.g. "Sahih al-Bukhari", "Sunan al-Tirmidhi"
  hadithNumber?: string;
  grade?: string; // "Sahih" | "Hasan" | "Da'if"
  narrator?: string; // Sahabi narrator, e.g. "Abu Hurairah (RA)"
  explanationEn?: string;
  explanationUr?: string;
  moralLessonEn?: string;
  moralLessonUr?: string;
  practicalExampleEn?: string;
  practicalExampleUr?: string;
  tags?: string[];
  featuredImage?: string;
  status: "published" | "draft";
  publishedDate?: string;
  createdAt: string;
  updatedAt?: string;
  transliteration?: string;
  iconEmoji?: string;
}

export interface DailyDua {
  id: string;
  titleEn: string;
  titleUr: string;
  category: string; // "Morning", "Evening", "Sleeping", "Eating", "Traveling", "Mosque", "Wudu", "Salah", "daily", etc.
  arabicText: string;
  translationEn: string;
  translationUr: string;
  transliteration?: string;
  reference?: string; // Quran or Hadith citation
  benefitsEn?: string;
  benefitsUr?: string;
  explanationEn?: string;
  explanationUr?: string;
  tags?: string[];
  featuredImage?: string;
  status: "published" | "draft";
  publishedDate?: string;
  createdAt: string;
  updatedAt?: string;
  iconEmoji?: string;
}

export interface DailyHadith {
  hadithUr: string;
  hadithEn: string;
  source: string;
}

export interface DailyQuote {
  quoteUr: string;
  quoteEn: string;
  source: string;
}

export interface Feedback {
  id: string;
  name: string;
  email?: string;
  storyId: string;
  storyTitle: string;
  rating: number; // 1-5 Stars
  message: string;
  status: "unread" | "read";
  createdAt: string;
  approved: boolean;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnail: string;
  duration: string;
  category: string;
  ageGroup: '4-6' | '7-9' | '10-12' | 'all';
  isFeatured: boolean;
  createdAt: string;
  updatedAt?: string;
  uploaderName?: string;
  uploaderEmail?: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reported?: boolean;
  reportCount?: number;
  language?: string;
  tags?: string[];
  publishDate?: string;
  folderId?: string | null;
  views?: number;
}

export interface VideoFolder {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ScholarQuestion {
  id: string;
  name: string;
  childAge: number;
  country: string;
  language: string;
  category: string;
  title: string;
  question: string;
  email?: string;
  status: "pending" | "answered" | "rejected";
  createdAt: string;
  answeredAt?: string;
  answerId?: string;
  viewCount?: number;
  bookmarkCount?: number;
  isFeatured?: boolean;
  isVerified?: boolean;
}

export interface ScholarAnswer {
  id: string;
  questionId: string;
  answerText: string;
  quranReference: string;
  hadithReference: string;
  keyLesson: string;
  actionStep: string;
  verifiedBy: string;
  scholarId?: string;
  createdAt: string;
}

export interface Scholar {
  id: string;
  name: string;
  title: string;
  credentials: string;
  photoUrl: string;
  bio: string;
  isVerified: boolean;
  createdAt: string;
}

