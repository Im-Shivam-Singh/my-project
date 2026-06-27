// Music player state — persisted so the user's play/pause + volume + "intro
// seen" state survives page refreshes.
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface MusicState {
  isPlaying: boolean;
  currentTrackId: string;
  volume: number; // 0..1
  hasSeenIntro: boolean;
  // actions
  play: (trackId?: string) => void;
  pause: () => void;
  toggle: () => void;
  setTrack: (trackId: string) => void;
  setVolume: (v: number) => void;
  dismissIntro: () => void;
}

export const useMusicStore = create<MusicState>()(
  persist(
    (set) => ({
      isPlaying: false,
      currentTrackId: "lofi-chill",
      volume: 0.6,
      hasSeenIntro: false,

      play: (trackId) =>
        set((s) => ({
          isPlaying: true,
          currentTrackId: trackId ?? s.currentTrackId,
        })),
      pause: () => set({ isPlaying: false }),
      toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setTrack: (trackId) =>
        set({ currentTrackId: trackId, isPlaying: true }),
      setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      dismissIntro: () => set({ hasSeenIntro: true }),
    }),
    { name: "vibematch-music" },
  ),
);
