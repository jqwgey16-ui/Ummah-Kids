export interface AudioTrack {
  id: string;
  titleEn: string;
  titleUr: string;
  categoryEn?: string;
  categoryUr?: string;
  arabicText: string;
  transliteration?: string;
  translationEn?: string;
  translationUr?: string;
  referenceEn?: string;
  referenceUr?: string;
  moralLessonEn?: string;
  moralLessonUr?: string;
  audioUrl: string;
  fallbackText?: string; // Text used for speech synthesis if audioUrl is unavailable
  iconEmoji?: string;
  visualEmoji?: string;
  sectionType: 'salah' | 'dua' | 'hadith' | 'quran';
  surahNumber?: number;
  ayahNumber?: number;
}

export type RepeatMode = 'off' | 'one' | 'all';

export interface RecentlyPlayedItem {
  track: AudioTrack;
  playedAt: string;
}
