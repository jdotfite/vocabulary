import { create } from "zustand";

import { apiGet, apiPost } from "@/lib/api";

interface WordStat {
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
  streak: number;
  lastSeenAt: string;
}

interface InitResponse {
  wordStats: Record<string, WordStat>;
  favorites: string[];
  bookmarks: string[];
  nickname: string | null;
  vocabularyLevel: string | null;
  ageRange: string | null;
  splashDismissed: string[];
  abilityScore: number;
}

interface UserProgressState {
  initialized: boolean;
  wordStats: Record<string, WordStat>;
  favorites: string[];
  bookmarks: string[];
  nickname: string | null;
  vocabularyLevel: string | null;
  ageRange: string | null;
  splashDismissed: string[];
  abilityScore: number;
  init: () => Promise<void>;
  recordAnswer: (word: string, isCorrect: boolean) => void;
  toggleFavorite: (word: string) => void;
  toggleBookmark: (word: string) => void;
  setSplashDismissed: (modeId: string) => void;
  reset: () => void;
}

export const useUserProgress = create<UserProgressState>()((set, get) => ({
  initialized: false,
  wordStats: {},
  favorites: [],
  bookmarks: [],
  nickname: null,
  vocabularyLevel: null,
  ageRange: null,
  splashDismissed: [],
  abilityScore: 50,

  init: async () => {
    if (get().initialized) return;
    try {
      const data = await apiGet<InitResponse>("/api/progress/init");
      set({
        initialized: true,
        wordStats: data.wordStats,
        favorites: data.favorites,
        bookmarks: data.bookmarks,
        nickname: data.nickname,
        vocabularyLevel: data.vocabularyLevel,
        ageRange: data.ageRange,
        splashDismissed: data.splashDismissed,
        abilityScore: data.abilityScore,
      });
    } catch {
      // If fetching fails, still mark initialized so we don't loop
      set({ initialized: true });
    }
  },

  recordAnswer: (word: string, isCorrect: boolean) => {
    // Optimistic update
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

    // Fire-and-forget API call
    apiPost("/api/progress/answer", { word, isCorrect }).catch(() => undefined);
  },

  toggleFavorite: (word: string) => {
    set((state) => ({
      favorites: state.favorites.includes(word)
        ? state.favorites.filter((w) => w !== word)
        : [...state.favorites, word]
    }));

    apiPost("/api/progress/favorite", { word }).catch(() => undefined);
  },

  toggleBookmark: (word: string) => {
    set((state) => ({
      bookmarks: state.bookmarks.includes(word)
        ? state.bookmarks.filter((w) => w !== word)
        : [...state.bookmarks, word]
    }));

    apiPost("/api/progress/bookmark", { word }).catch(() => undefined);
  },

  setSplashDismissed: (modeId: string) => {
    set((state) => {
      if (state.splashDismissed.includes(modeId)) return state;
      const updated = [...state.splashDismissed, modeId];
      apiPost("/api/progress/splash", { dismissed: updated }).catch(() => undefined);
      return { splashDismissed: updated };
    });
  },

  reset: () => {
    set({
      initialized: false,
      wordStats: {},
      favorites: [],
      bookmarks: [],
      nickname: null,
      vocabularyLevel: null,
      ageRange: null,
      splashDismissed: [],
      abilityScore: 50,
    });
  }
}));

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
