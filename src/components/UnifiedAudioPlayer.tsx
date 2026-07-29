import React, { useState, useEffect } from "react";
import { 
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX, 
  RotateCcw, Repeat, Repeat1, Download, Heart, Loader2, Sparkles, X, ChevronUp, ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { AudioTrack, RepeatMode, RecentlyPlayedItem } from "../types/audio";
import AudioNotAvailableNotice from "./AudioNotAvailableNotice";
import { useGlobalAudio } from "../lib/useGlobalAudio";

interface UnifiedAudioPlayerProps {
  currentTrack: AudioTrack | null;
  playlist: AudioTrack[];
  isPlaying: boolean;
  onPlayTrack: (track: AudioTrack) => void;
  onPauseTrack: () => void;
  onStopTrack: () => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  className?: string;
  autoPlayNext?: boolean;
}

export default function UnifiedAudioPlayer({
  currentTrack,
  playlist,
  isPlaying: propIsPlaying,
  onPlayTrack,
  onPauseTrack,
  onStopTrack,
  onNextTrack,
  onPrevTrack,
  favorites,
  onToggleFavorite,
  className = "",
  autoPlayNext = true
}: UnifiedAudioPlayerProps) {
  const globalAudio = useGlobalAudio();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const isFavorite = currentTrack ? favorites.includes(currentTrack.id) : false;

  // Use global audio state values
  const isPlaying = globalAudio.currentTrack?.id === currentTrack?.id ? globalAudio.isPlaying : false;
  const isLoading = globalAudio.currentTrack?.id === currentTrack?.id ? globalAudio.isLoading : false;
  const currentTime = globalAudio.currentTrack?.id === currentTrack?.id ? globalAudio.currentTime : 0;
  const duration = globalAudio.currentTrack?.id === currentTrack?.id ? globalAudio.duration : 0;
  const isSpeechMode = globalAudio.currentTrack?.id === currentTrack?.id ? globalAudio.isSpeechMode : false;
  const audioUnavailable = globalAudio.currentTrack?.id === currentTrack?.id ? globalAudio.audioUnavailable : false;

  // Save to recently played when currentTrack is active
  useEffect(() => {
    if (!currentTrack) return;

    try {
      const existingStr = localStorage.getItem("islamic_kids_recently_played");
      let list: RecentlyPlayedItem[] = existingStr ? JSON.parse(existingStr) : [];
      list = list.filter(item => item.track.id !== currentTrack.id);
      list.unshift({ track: currentTrack, playedAt: new Date().toISOString() });
      if (list.length > 20) list = list.slice(0, 20);
      localStorage.setItem("islamic_kids_recently_played", JSON.stringify(list));
    } catch (e) {
      console.warn("Failed to save recently played item:", e);
    }
  }, [currentTrack]);

  const handlePlayPauseToggle = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      globalAudio.pauseTrack();
      onPauseTrack();
    } else {
      globalAudio.playTrack(currentTrack, autoPlayNext ? onNextTrack : undefined);
      onPlayTrack(currentTrack);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    globalAudio.seek(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    globalAudio.setVolume(val);
  };

  const toggleMute = () => {
    globalAudio.setMuted(!globalAudio.isMuted);
  };

  const cycleRepeatMode = () => {
    if (globalAudio.repeatMode === 'off') globalAudio.setRepeatMode('all');
    else if (globalAudio.repeatMode === 'all') globalAudio.setRepeatMode('one');
    else globalAudio.setRepeatMode('off');
  };

  const cycleSpeed = () => {
    if (globalAudio.playbackSpeed === 1) globalAudio.setPlaybackSpeed(1.25);
    else if (globalAudio.playbackSpeed === 1.25) globalAudio.setPlaybackSpeed(1.5);
    else if (globalAudio.playbackSpeed === 1.5) globalAudio.setPlaybackSpeed(0.75);
    else globalAudio.setPlaybackSpeed(1);
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleDownload = () => {
    if (!currentTrack) return;
    if (currentTrack.audioUrl) {
      const link = document.createElement("a");
      link.href = currentTrack.audioUrl;
      link.download = `${currentTrack.titleEn.replace(/\s+/g, "_")}.mp3`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert("Audio file available for live online streaming.");
    }
  };

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4 pointer-events-auto ${className}`}
      >
        <div className="max-w-5xl mx-auto bg-white/95 dark:bg-slate-950/98 backdrop-blur-xl border border-slate-200/80 dark:border-emerald-500/30 text-slate-800 dark:text-white rounded-3xl shadow-2xl shadow-emerald-950/10 overflow-hidden transition-all">
          
          {audioUnavailable && (
            <div className="p-2 bg-amber-100 dark:bg-amber-950/80 border-b border-amber-300 dark:border-amber-500/40">
              <AudioNotAvailableNotice
                variant="banner"
                title="Audio Not Available"
                reason="Authentic audio pending verification"
                description={`Audio for "${currentTrack.titleEn}" is restricted pending scholar verification to ensure accurate pronunciation.`}
                onRetry={() => onPlayTrack(currentTrack)}
                onDismiss={() => globalAudio.clearNotice()}
                actionText="Expand Text"
                onAction={() => setIsExpanded(true)}
              />
            </div>
          )}

          {/* Top Bar / Track Summary */}
          <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/60">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-xl sm:text-2xl shadow-md shrink-0 relative">
                {currentTrack.iconEmoji || currentTrack.visualEmoji || "🎧"}
                {isPlaying && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                    {currentTrack.categoryEn || "Recitation"}
                  </span>
                  {audioUnavailable ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40">
                      ⚠️ Audio not available
                    </span>
                  ) : isSpeechMode ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30">
                      Authentic Recitation Voice
                    </span>
                  ) : null}
                </div>
                <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 truncate mt-0.5">
                  {currentTrack.titleEn}
                </h4>
                <p className="font-urdu text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 truncate dir-rtl text-right sm:text-left">
                  {currentTrack.arabicText || currentTrack.titleUr}
                </p>
              </div>
            </div>

            {/* Equalizer Animation (When Playing) */}
            {isPlaying && (
              <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-950/40 rounded-xl border border-emerald-300 dark:border-emerald-500/20">
                <span className="w-1 h-4 bg-emerald-500 dark:bg-emerald-400 animate-[bounce_1s_infinite_100ms] rounded-full"></span>
                <span className="w-1 h-6 bg-emerald-500 dark:bg-emerald-400 animate-[bounce_1s_infinite_300ms] rounded-full"></span>
                <span className="w-1 h-3 bg-emerald-500 dark:bg-emerald-400 animate-[bounce_1s_infinite_200ms] rounded-full"></span>
                <span className="w-1 h-5 bg-emerald-500 dark:bg-emerald-400 animate-[bounce_1s_infinite_400ms] rounded-full"></span>
              </div>
            )}

            {/* Action Buttons: Expand Toggle, Favorite & Close */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={() => onToggleFavorite(currentTrack.id)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isFavorite 
                    ? "text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20 border border-rose-200 dark:border-rose-500/30" 
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
                title={isFavorite ? "Remove Favorite" : "Add to Favorites"}
              >
                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
              </button>

              <button
                onClick={handleDownload}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all hidden sm:block cursor-pointer"
                title="Download Audio"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title={isExpanded ? "Collapse Controls" : "Expand Controls"}
              >
                {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>

              <button
                onClick={onStopTrack}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                title="Close Player"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Timeline & Controls */}
          <div className="px-4 py-3 bg-slate-50/80 dark:bg-slate-900/60 flex flex-col gap-2">
            {/* Seek Bar & Timers */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500 hover:accent-emerald-500 transition-all"
              />
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 w-10">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback Controls Row */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {/* Secondary Options Left: Speed & Repeat */}
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={cycleSpeed}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-400 border border-slate-300 dark:border-slate-700/60 transition-all cursor-pointer"
                  title="Playback Speed"
                >
                  {globalAudio.playbackSpeed}x
                </button>

                <button
                  onClick={cycleRepeatMode}
                  className={`p-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    globalAudio.repeatMode !== 'off'
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40"
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  }`}
                  title={`Repeat Mode: ${globalAudio.repeatMode}`}
                >
                  {globalAudio.repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </button>
              </div>

              {/* Main Playback Center Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={onPrevTrack}
                  disabled={!onPrevTrack}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Previous Track"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayPauseToggle}
                  className="p-3 bg-gradient-to-tr from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-slate-950" />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current translate-x-0.5" />
                  )}
                </button>

                <button
                  onClick={onNextTrack}
                  disabled={!onNextTrack}
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Next Track (Auto-Play)"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              {/* Volume & Mute Right */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title={globalAudio.isMuted ? "Unmute" : "Mute"}
                >
                  {globalAudio.isMuted || globalAudio.volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={globalAudio.isMuted ? 0 : globalAudio.volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-500"
                />
              </div>
            </div>

            {/* Expanded Details Panel */}
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-2 text-xs sm:text-sm text-slate-300"
              >
                {currentTrack.transliteration && (
                  <p className="text-slate-300 italic">
                    <strong className="text-emerald-400 font-semibold not-italic">Transliteration:</strong> {currentTrack.transliteration}
                  </p>
                )}
                {currentTrack.translationEn && (
                  <p className="text-slate-200">
                    <strong className="text-emerald-400 font-semibold">English:</strong> {currentTrack.translationEn}
                  </p>
                )}
                {currentTrack.translationUr && (
                  <p className="font-urdu text-emerald-300 text-right dir-rtl leading-relaxed">
                    <strong className="text-slate-400 text-xs">ترجمہ:</strong> {currentTrack.translationUr}
                  </p>
                )}
                {currentTrack.moralLessonEn && (
                  <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-200 text-xs mt-1">
                    🌟 <strong>Moral Lesson:</strong> {currentTrack.moralLessonEn}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
