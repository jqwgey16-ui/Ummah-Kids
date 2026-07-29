import { useState, useEffect } from 'react';
import { GlobalAudioEngine, GlobalAudioState } from './globalAudioEngine';
import { AudioTrack, RepeatMode } from '../types/audio';

export function useGlobalAudio() {
  const engine = GlobalAudioEngine.getInstance();
  const [state, setState] = useState<GlobalAudioState>(() => engine.getState());

  useEffect(() => {
    const unsubscribe = engine.subscribe((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, [engine]);

  return {
    ...state,
    playTrack: (track: AudioTrack, onEnded?: () => void) => engine.playTrack(track, onEnded),
    pauseTrack: () => engine.pauseTrack(),
    resumeTrack: () => engine.resumeTrack(),
    stopTrack: () => engine.stopAll(),
    setVolume: (vol: number) => engine.setVolume(vol),
    setMuted: (muted: boolean) => engine.setMuted(muted),
    setPlaybackSpeed: (speed: number) => engine.setPlaybackSpeed(speed),
    setRepeatMode: (mode: RepeatMode) => engine.setRepeatMode(mode),
    seek: (sec: number) => engine.seek(sec),
    dismissNotice: () => engine.dismissNotice(),
    clearNotice: () => engine.dismissNotice(),
  };
}
