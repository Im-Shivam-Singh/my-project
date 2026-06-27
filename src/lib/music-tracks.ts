// Ambient, copyright-free music tracks for the VibeMatch in-app music player.
// All tracks are sourced from Pixabay's royalty-free music collection (CC0),
// so there are no licensing issues — users can vibe to calm beats while
// browsing parties, which increases dwell time and booking conversion.

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  mood: string; // "Chill" | "Focus" | "Party" | "Deep house" | "Ambient"
  emoji: string;
  color: string; // hex for the track accent
  audioUrl: string; // direct .mp3 URL
  duration: string; // "3:42" display label
}

export const MUSIC_TRACKS: MusicTrack[] = [
  {
    id: "lofi-chill",
    title: "Midnight Lo-fi",
    artist: "VibeMatch Radio",
    mood: "Chill",
    emoji: "🌙",
    color: "#7f77dd",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3",
    duration: "2:14",
  },
  {
    id: "deep-house",
    title: "Deep House Pulse",
    artist: "VibeMatch Radio",
    mood: "Party",
    emoji: "🎛️",
    color: "#d85a30",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/03/15/audio_1a8ea24dMP3.mp3",
    duration: "3:05",
  },
  {
    id: "ambient-focus",
    title: "Ambient Focus",
    artist: "VibeMatch Radio",
    mood: "Focus",
    emoji: "✨",
    color: "#1d9e75",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884f8da1.mp3",
    duration: "4:00",
  },
  {
    id: "chill-hop",
    title: "Chill Hop Nights",
    artist: "VibeMatch Radio",
    mood: "Chill",
    emoji: "🎧",
    color: "#ef9f27",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2023/01/30/audio_946ae1de94.mp3",
    duration: "2:30",
  },
  {
    id: "party-vibe",
    title: "Party Starter",
    artist: "VibeMatch Radio",
    mood: "Party",
    emoji: "🎉",
    color: "#534ab7",
    audioUrl:
      "https://cdn.pixabay.com/download/audio/2022/10/25/audio_946bc6e5.mp3",
    duration: "2:45",
  },
];

export function getTrack(id: string | null | undefined): MusicTrack | null {
  if (!id) return MUSIC_TRACKS[0];
  return MUSIC_TRACKS.find((t) => t.id === id) ?? MUSIC_TRACKS[0];
}
