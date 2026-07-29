import { AudioTrack, RepeatMode } from "../types/audio";

export interface GlobalAudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackSpeed: number;
  repeatMode: RepeatMode;
  audioUnavailable: boolean;
  isSpeechMode: boolean;
  audioNotice: string | null;
}

type Listener = (state: GlobalAudioState) => void;

export class GlobalAudioEngine {
  private static instance: GlobalAudioEngine | null = null;
  private audio: HTMLAudioElement;
  private activePlayPromise: Promise<void> | null = null;
  private isPlayPending: boolean = false;
  private isPausePending: boolean = false;
  private currentUrl: string | null = null;
  private listeners: Set<Listener> = new Set();
  
  // Speech Synthesis tracking
  private speechUtterance: SpeechSynthesisUtterance | null = null;
  private speechTimer: any = null;

  // Callback when a track finishes playing naturally
  private onTrackEndedCallback: (() => void) | null = null;

  private state: GlobalAudioState = {
    currentTrack: null,
    isPlaying: false,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: parseFloat(localStorage.getItem("app_audio_volume") || "0.9"),
    isMuted: false,
    playbackSpeed: parseFloat(localStorage.getItem("app_audio_speed") || "1.0"),
    repeatMode: 'off',
    audioUnavailable: false,
    isSpeechMode: false,
    audioNotice: null,
  };

  private constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.setupEventListeners();
  }

  public static getInstance(): GlobalAudioEngine {
    if (!GlobalAudioEngine.instance) {
      GlobalAudioEngine.instance = new GlobalAudioEngine();
    }
    return GlobalAudioEngine.instance;
  }

  public getState(): GlobalAudioState {
    return { ...this.state };
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const currentState = this.getState();
    this.listeners.forEach((listener) => listener(currentState));
  }

  private setupEventListeners() {
    this.audio.addEventListener("loadedmetadata", () => {
      this.state.duration = this.audio.duration || 0;
      this.state.isLoading = false;
      this.notify();
    });

    this.audio.addEventListener("timeupdate", () => {
      this.state.currentTime = this.audio.currentTime || 0;
      this.notify();
    });

    this.audio.addEventListener("waiting", () => {
      this.state.isLoading = true;
      this.notify();
    });

    this.audio.addEventListener("canplaythrough", () => {
      this.state.isLoading = false;
      this.notify();
    });

    this.audio.addEventListener("play", () => {
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.notify();
    });

    this.audio.addEventListener("pause", () => {
      this.state.isPlaying = false;
      this.notify();
    });

    this.audio.addEventListener("ended", () => {
      this.handleEnded();
    });

    this.audio.addEventListener("error", (e) => {
      console.warn("HTMLAudioElement natural error event:", e);
      if (this.currentUrl && this.audio.src && this.state.currentTrack) {
        this.handleNaturalLoadError(this.state.currentTrack);
      }
    });
  }

  /**
   * Helper: safely wait for active play promise to settle before pausing or loading new track.
   * This prevents "The play() request was interrupted by a call to pause()".
   */
  private async awaitActivePlayPromise(): Promise<void> {
    if (this.activePlayPromise) {
      try {
        await this.activePlayPromise;
      } catch (err: any) {
        // Ignore play rejection caused by previous interruption
      }
      this.activePlayPromise = null;
    }
  }

  /**
   * Complete cleanup & stop of any current playback (HTML5 audio or SpeechSynthesis)
   */
  public async stopAll(): Promise<void> {
    this.cancelSpeech();

    await this.awaitActivePlayPromise();

    if (!this.audio.paused && !this.isPausePending) {
      this.isPausePending = true;
      try {
        this.audio.pause();
      } catch (e) {
        // Ignore pause errors
      } finally {
        this.isPausePending = false;
      }
    }

    this.audio.currentTime = 0;
    this.state.isPlaying = false;
    this.state.isLoading = false;
    this.state.currentTime = 0;
    this.notify();
  }

  /**
   * Main entry point to play an audio track cleanly and without race conditions
   */
  public async playTrack(
    track: AudioTrack, 
    onEndedCallback?: () => void
  ): Promise<void> {
    if (!track) return;

    this.onTrackEndedCallback = onEndedCallback || null;

    // If same track is already loaded and currently paused, resume it
    if (
      this.state.currentTrack?.id === track.id && 
      this.currentUrl === track.audioUrl && 
      this.audio.src
    ) {
      if (this.state.isSpeechMode) {
        this.resumeSpeech();
        return;
      }
      if (this.audio.paused) {
        await this.executePlay();
        return;
      } else if (this.state.isPlaying) {
        // Already playing this exact track
        return;
      }
    }

    // Changing to a new track or starting fresh
    // Step 1: Cancel any active speech
    this.cancelSpeech();

    // Step 2: Stop existing audio completely & wait until active play promise resolves
    await this.awaitActivePlayPromise();

    if (!this.audio.paused && !this.isPausePending) {
      this.isPausePending = true;
      try {
        this.audio.pause();
      } catch (e) {
        // Ignore
      } finally {
        this.isPausePending = false;
      }
    }

    // Step 3: Update state for new track
    this.state.currentTrack = track;
    this.state.audioUnavailable = false;
    this.state.audioNotice = null;
    this.state.isSpeechMode = false;
    this.state.isLoading = true;
    this.state.currentTime = 0;
    this.state.duration = 0;
    this.notify();

    // Check if non-Quran track contains Quran reciter domain unexpectedly
    if (track.sectionType !== 'quran' && track.audioUrl) {
      if (
        track.audioUrl.includes('alquran.cloud') || 
        track.audioUrl.includes('ar.alafasy') || 
        track.audioUrl.includes('ar.sudais') ||
        track.audioUrl.includes('ar.mahermuaiqly')
      ) {
        console.warn("Blocked Quran reciter audio for non-Quran section track:", track.titleEn);
        this.startSpeechFallback(track);
        return;
      }
    }

    // If no audio URL, start speech fallback immediately
    if (!track.audioUrl) {
      this.startSpeechFallback(track);
      return;
    }

    // Step 4: Configure HTMLAudioElement source
    this.currentUrl = track.audioUrl;
    this.audio.src = track.audioUrl;
    this.audio.volume = this.state.isMuted ? 0 : this.state.volume;
    this.audio.playbackRate = this.state.playbackSpeed;

    // Step 5: Wait for loadedmetadata then canplay / canplaythrough before calling play()
    try {
      await this.waitForAudioReady();
      await this.executePlay();
    } catch (err: any) {
      console.warn("Audio file failed to load or play:", track.audioUrl, err);
      if (err?.message === "LOAD_ERROR" || err?.message === "TIMEOUT") {
        this.startSpeechFallback(track);
      }
    }
  }

  /**
   * Wait for loadedmetadata then canplay / canplaythrough
   */
  private waitForAudioReady(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.audio.readyState >= 3) { // HAVE_FUTURE_DATA or HAVE_ENOUGH_DATA
        resolve();
        return;
      }

      let timeoutId: any = null;

      const onCanPlay = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("LOAD_ERROR"));
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this.audio.removeEventListener("canplaythrough", onCanPlay);
        this.audio.removeEventListener("canplay", onCanPlay);
        this.audio.removeEventListener("error", onError);
      };

      this.audio.addEventListener("canplaythrough", onCanPlay, { once: true });
      this.audio.addEventListener("canplay", onCanPlay, { once: true });
      this.audio.addEventListener("error", onError, { once: true });

      timeoutId = setTimeout(() => {
        cleanup();
        if (this.audio.readyState >= 2) { // HAVE_CURRENT_DATA
          resolve();
        } else {
          reject(new Error("TIMEOUT"));
        }
      }, 7000);

      this.audio.load();
    });
  }

  /**
   * Internal safe play executor
   */
  private async executePlay(): Promise<void> {
    if (this.isPlayPending) {
      return;
    }

    await this.awaitActivePlayPromise();

    this.isPlayPending = true;
    this.state.isLoading = true;
    this.notify();

    try {
      const promise = this.audio.play();
      this.activePlayPromise = promise;
      await promise;
      this.state.isPlaying = true;
      this.state.isLoading = false;
      this.notify();
    } catch (err: any) {
      this.state.isPlaying = false;
      this.state.isLoading = false;
      this.notify();

      if (err.name === "AbortError") {
        // "The play() request was interrupted by a call to pause()".
        // Never treat AbortError as audio file missing failure!
        console.info("Play request safely interrupted:", err.message);
      } else if (err.name === "NotAllowedError") {
        console.warn("Autoplay blocked by browser rules:", err.message);
      } else {
        console.warn("Audio play error:", err);
        if (this.state.currentTrack) {
          this.startSpeechFallback(this.state.currentTrack);
        }
      }
    } finally {
      this.isPlayPending = false;
      this.activePlayPromise = null;
    }
  }

  /**
   * Safe Pause
   */
  public async pauseTrack(): Promise<void> {
    if (this.state.isSpeechMode) {
      this.pauseSpeech();
      return;
    }

    if (this.isPausePending) {
      return;
    }

    // MUST wait for active play promise to fulfill before calling pause!
    await this.awaitActivePlayPromise();

    if (!this.audio.paused) {
      this.isPausePending = true;
      try {
        this.audio.pause();
      } catch (err) {
        console.warn("Pause error:", err);
      } finally {
        this.isPausePending = false;
      }
    }

    this.state.isPlaying = false;
    this.state.isLoading = false;
    this.notify();
  }

  /**
   * Safe Resume
   */
  public async resumeTrack(): Promise<void> {
    if (this.state.isSpeechMode) {
      this.resumeSpeech();
      return;
    }

    if (this.audio.src) {
      await this.executePlay();
    }
  }

  /**
   * Natural track completion
   */
  private handleEnded() {
    this.state.isPlaying = false;
    this.state.isLoading = false;
    this.notify();

    if (this.state.repeatMode === 'one' && this.state.currentTrack) {
      if (this.state.isSpeechMode) {
        this.startSpeechFallback(this.state.currentTrack);
      } else {
        this.audio.currentTime = 0;
        this.executePlay();
      }
    } else if (this.onTrackEndedCallback) {
      this.onTrackEndedCallback();
    }
  }

  /**
   * Fallback to Speech Synthesis or Audio Not Available notice
   */
  private startSpeechFallback(track: AudioTrack) {
    // Never use speech synthesis for Quran tracks
    if (track.sectionType === 'quran') {
      this.state.isLoading = false;
      this.state.audioUnavailable = true;
      this.state.audioNotice = "Authentic audio pending verification for this reciter or verse.";
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      this.state.isLoading = false;
      this.state.audioUnavailable = true;
      this.state.isPlaying = false;
      this.notify();
      return;
    }

    this.cancelSpeech();

    const textToSpeak = track.arabicText || track.fallbackText || track.titleEn;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = this.state.playbackSpeed * 0.85;
    utterance.volume = this.state.isMuted ? 0 : this.state.volume;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
      utterance.lang = "ar-SA";
    } else {
      utterance.lang = "ar-SA";
    }

    this.state.isSpeechMode = true;
    this.state.isLoading = false;
    this.state.isPlaying = true;

    const approxDuration = Math.max(3, Math.ceil(textToSpeak.length * 0.25));
    this.state.duration = approxDuration;
    this.state.currentTime = 0;
    this.notify();

    let elapsed = 0;
    clearInterval(this.speechTimer);
    this.speechTimer = setInterval(() => {
      elapsed += 0.5;
      this.state.currentTime = Math.min(elapsed, approxDuration);
      this.notify();
    }, 500);

    utterance.onend = () => {
      clearInterval(this.speechTimer);
      this.state.currentTime = approxDuration;
      this.state.isPlaying = false;
      this.notify();
      this.handleEnded();
    };

    utterance.onerror = () => {
      clearInterval(this.speechTimer);
      this.state.isLoading = false;
      this.state.audioUnavailable = true;
      this.state.isSpeechMode = false;
      this.state.isPlaying = false;
      this.notify();
    };

    this.speechUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  private pauseSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
    }
    clearInterval(this.speechTimer);
    this.state.isPlaying = false;
    this.notify();
  }

  private resumeSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.resume();
    }
    this.state.isPlaying = true;
    this.notify();
  }

  private cancelSpeech() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearInterval(this.speechTimer);
    this.speechUtterance = null;
    this.state.isSpeechMode = false;
  }

  private handleNaturalLoadError(track: AudioTrack) {
    if (this.state.isSpeechMode) return;
    console.warn("Natural audio load error for track:", track.titleEn);
    this.startSpeechFallback(track);
  }

  // Settings & Navigation methods
  public setVolume(vol: number) {
    this.state.volume = vol;
    localStorage.setItem("app_audio_volume", vol.toString());
    this.audio.volume = this.state.isMuted ? 0 : vol;
    if (this.speechUtterance) {
      this.speechUtterance.volume = this.state.isMuted ? 0 : vol;
    }
    this.notify();
  }

  public setMuted(muted: boolean) {
    this.state.isMuted = muted;
    this.audio.volume = muted ? 0 : this.state.volume;
    this.notify();
  }

  public setPlaybackSpeed(speed: number) {
    this.state.playbackSpeed = speed;
    localStorage.setItem("app_audio_speed", speed.toString());
    this.audio.playbackRate = speed;
    this.notify();
  }

  public setRepeatMode(mode: RepeatMode) {
    this.state.repeatMode = mode;
    this.notify();
  }

  public seek(seconds: number) {
    if (!this.state.isSpeechMode && this.audio.duration) {
      const targetTime = Math.max(0, Math.min(seconds, this.audio.duration));
      this.audio.currentTime = targetTime;
      this.state.currentTime = targetTime;
      this.notify();
    }
  }

  public dismissNotice() {
    this.state.audioUnavailable = false;
    this.state.audioNotice = null;
    this.notify();
  }
}
