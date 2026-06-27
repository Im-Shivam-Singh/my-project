"use client";

import { useEffect, useRef, useState } from "react";
import {
  Music,
  Disc3,
  Play,
  Pause,
  Volume2,
  X,
  Headphones,
  ChevronRight,
} from "lucide-react";
import { useMusicStore } from "@/lib/music-store";
import { MUSIC_TRACKS, getTrack } from "@/lib/music-tracks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────
// MusicPlayerButton — the circular icon button placed in the home screen
// header. First tap shows the intro popup; subsequent taps toggle play.
// ─────────────────────────────────────────────────────────────────────
export function MusicPlayerButton() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const hasSeenIntro = useMusicStore((s) => s.hasSeenIntro);
  const play = useMusicStore((s) => s.play);
  const toggle = useMusicStore((s) => s.toggle);
  const dismissIntro = useMusicStore((s) => s.dismissIntro);
  const [introOpen, setIntroOpen] = useState(false);

  const onTap = () => {
    if (!hasSeenIntro) {
      setIntroOpen(true);
      return;
    }
    toggle();
  };

  const startPlaying = () => {
    play();
    dismissIntro();
    setIntroOpen(false);
  };

  return (
    <>
      <button
        onClick={onTap}
        aria-label={isPlaying ? "Pause music" : "Play music"}
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95",
          isPlaying
            ? "border-purple-500/50 bg-purple-500/20 text-purple-300 glow-violet"
            : "border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10",
        )}
      >
        {isPlaying ? (
          <Disc3 className="h-5 w-5 animate-spin [animation-duration:3s]" />
        ) : (
          <Music className="h-5 w-5" />
        )}
      </button>

      {/* Intro popup — shown the first time the user taps the music icon */}
      <Dialog open={introOpen} onOpenChange={setIntroOpen}>
        <DialogContent className="max-w-[420px] rounded-3xl border-purple-500/30 glass-strong">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 ring-2 ring-purple-500/40">
              <Headphones className="h-8 w-8 text-purple-300" />
            </div>
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Play music and explore our app
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Use earphones 🎧
            </DialogDescription>
          </DialogHeader>
          <div className="px-2 pb-2 text-center">
            <p className="text-sm leading-relaxed text-foreground/80">
              Ambient beats to set the vibe. Browse parties, chat with hosts,
              and book your night — all while the music plays in the
              background.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-1.5">
              {MUSIC_TRACKS.slice(0, 3).map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-muted-foreground ring-1 ring-white/10"
                >
                  <span>{t.emoji}</span> {t.mood}
                </span>
              ))}
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              onClick={startPlaying}
              className="w-full rounded-full bg-purple-500 text-white hover:bg-purple-500/90"
            >
              <Play className="h-4 w-4 fill-current" /> Play music
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                dismissIntro();
                setIntroOpen(false);
              }}
              className="w-full rounded-full text-muted-foreground"
            >
              Maybe later
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MusicPlayerBar — the mini player that appears above the bottom nav when
// music is playing. Shows track info, play/pause, volume, and a track
// picker expander.
// ─────────────────────────────────────────────────────────────────────
export function MusicPlayerBar() {
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const currentTrackId = useMusicStore((s) => s.currentTrackId);
  const volume = useMusicStore((s) => s.volume);
  const toggle = useMusicStore((s) => s.toggle);
  const pause = useMusicStore((s) => s.pause);
  const setVolume = useMusicStore((s) => s.setVolume);
  const setTrack = useMusicStore((s) => s.setTrack);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const track = getTrack(currentTrackId);

  // Wire the audio element to the store
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    let srcChanged = false;
    if (audio.src !== track.audioUrl) {
      audio.src = track.audioUrl;
      audio.load();
      srcChanged = true;
    }

    audio.volume = volume;

    if (isPlaying) {
      audio.play().catch(() => {
        // Autoplay blocked or network error — mark the error but KEEP the
        // bar visible so the user can see the track + retry. Don't auto-pause
        // the store; the user explicitly asked to play.
        setAudioError(true);
      });
    } else {
      audio.pause();
    }

    if (srcChanged) {
      // Defer the state update so it doesn't fire synchronously inside the effect
      queueMicrotask(() => setAudioError(false));
    }
  }, [isPlaying, track, volume, pause]);

  // Update volume without reloading the track
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  if (!track) return null;

  return (
    <>
      <audio
        ref={audioRef}
        onEnded={() => pause()}
        onError={() => {
          setAudioError(true);
          pause();
        }}
        preload="none"
       
      />
      {/* The bar — only visible when playing OR expanded */}
      {(isPlaying || expanded) && (
        <div className="fixed inset-x-0 bottom-[76px] z-40 mx-auto max-w-[480px] px-3 animate-screen-in">
          <div className="overflow-hidden rounded-2xl border border-purple-500/30 glass-strong shadow-xl">
            {/* Main row */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              {/* Spinning disc */}
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                style={{ background: `${track.color}30` }}
              >
                <span className={cn(isPlaying && "animate-spin [animation-duration:3s]")}>
                  {track.emoji}
                </span>
              </div>

              {/* Track info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-foreground">
                  {track.title}
                  {audioError && (
                    <span className="ml-1 text-[10px] text-coral">· unavailable</span>
                  )}
                </p>
                <p className="truncate text-[10px] text-muted-foreground">
                  {track.artist} · {track.mood}
                </p>
              </div>

              {/* Volume (only when expanded) */}
              {expanded && (
                <div className="flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="h-1 w-16 cursor-pointer accent-purple-500"
                    aria-label="Volume"
                  />
                </div>
              )}

              {/* Play/pause */}
              <button
                onClick={toggle}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white transition active:scale-90"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 fill-current" />
                ) : (
                  <Play className="h-4 w-4 fill-current" />
                )}
              </button>

              {/* Expand / collapse */}
              <button
                onClick={() => setExpanded((e) => !e)}
                aria-label={expanded ? "Collapse player" : "Expand player"}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    expanded && "rotate-90",
                  )}
                />
              </button>

              {/* Close */}
              <button
                onClick={() => {
                  pause();
                  setExpanded(false);
                }}
                aria-label="Close player"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-white/10 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Expanded track list */}
            {expanded && (
              <div className="border-t border-white/10 px-2 py-2">
                <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Switch vibe
                </p>
                <div className="max-h-40 space-y-0.5 overflow-y-auto fancy-scrollbar">
                  {MUSIC_TRACKS.map((t) => {
                    const active = t.id === currentTrackId;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          setTrack(t.id);
                          setExpanded(false);
                        }}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition",
                          active
                            ? "bg-purple-500/15 ring-1 ring-purple-500/30"
                            : "hover:bg-white/5",
                        )}
                      >
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
                          style={{ background: `${t.color}30` }}
                        >
                          {t.emoji}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "truncate text-xs font-medium",
                              active ? "text-purple-200" : "text-foreground",
                            )}
                          >
                            {t.title}
                          </p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {t.mood} · {t.duration}
                          </p>
                        </div>
                        {active && isPlaying && (
                          <Disc3 className="h-3.5 w-3.5 animate-spin text-purple-300 [animation-duration:3s]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
