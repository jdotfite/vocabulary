import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WordStat {
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
  streak: number;
  lastSeenAt: string;
}

interface UserProgressState {
  wordStats: Record<string, WordStat>;
  favorites: string[];
  bookmarks: string[];
  recordAnswer: (word: string, isCorrect: boolean) => void;
  toggleFavorite: (word: string) => void;
  toggleBookmark: (word: string) => void;
}

export const useUserProgress = create<UserProgressState>()(
  persist(
    (set) => ({
      wordStats: {},
      favorites: [],
      bookmarks: [],

      recordAnswer: (word: string, isCorrect: boolean) => {
        set((state) => {
          const existing = state.wordStats[word];
          const now = new Date().toISOString();
          const updated: WordStat = existing
            ? {
                timesSeen: existing.timesSeen + 1,
                timesCorrect: existing.timesCorrect + (isCorrect ? 1 : 0),
                timesIncorrect: existing.timesIncorrect + (isCorrect ? 0 : 1),
                streak: isCorrect ? existing.streak + 1 : 0,
                lastSeenAt: now
              }
            : {
                timesSeen: 1,
                timesCorrect: isCorrect ? 1 : 0,
                timesIncorrect: isCorrect ? 0 : 1,
                streak: isCorrect ? 1 : 0,
                lastSeenAt: now
              };
          return { wordStats: { ...state.wordStats, [word]: updated } };
        });
      },

      toggleFavorite: (word: string) => {
        set((state) => ({
          favorites: state.favorites.includes(word)
            ? state.favorites.filter((w) => w !== word)
            : [...state.favorites, word]
        }));
      },

      toggleBookmark: (word: string) => {
        set((state) => ({
          bookmarks: state.bookmarks.includes(word)
            ? state.bookmarks.filter((w) => w !== word)
            : [...state.bookmarks, word]
        }));
      }
    }),
    { name: "vocabdeck.user-progress.v1" }
  )
);

/** Returns words seen within the last `hours` hours. */
export function getRecentlySeenWords(hours: number): Set<string> {
  const { wordStats } = useUserProgress.getState();
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const recent = new Set<string>();

  for (const [word, stat] of Object.entries(wordStats)) {
    if (new Date(stat.lastSeenAt).getTime() > cutoff) {
      recent.add(word);
    }
  }

  return recent;
}
