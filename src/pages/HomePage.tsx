import clsx from "clsx";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ChallengeCard } from "@/design-system/components/ChallengeCard";
import {
  BoltIcon,
  DiamondIcon,
  RocketIcon,
  DiceIcon,
  DumbbellIcon,
  FolderIcon
} from "@/design-system/icons";
import { Surface } from "@/design-system/primitives/Surface";
import {
  getPracticeStatsSnapshot,
  type PracticeStatsSnapshot
} from "@/lib/practiceStats";
import { useUserProgress } from "@/lib/userProgressStore";

/* ------------------------------------------------------------------ */
/*  Local helpers                                                      */
/* ------------------------------------------------------------------ */

function ChevronRightIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="20"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
      width="20"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon(): JSX.Element {
  return (
    <svg
      aria-hidden
      fill="none"
      height="10"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={3}
      viewBox="0 0 24 24"
      width="10"
    >
      <path d="m5 13 4 4 10-10" />
    </svg>
  );
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function getMotivationalSubtext(streak: number): string {
  if (streak === 0) return "Start building your streak today!";
  if (streak === 1) return "Great start — keep the momentum going!";
  if (streak < 7) return "You're on a roll. Don't break the chain!";
  if (streak < 30) return "Consistency is paying off. Keep it up!";
  return "Incredible dedication. You're unstoppable!";
}

function getRankLabel(ability: number): string {
  if (ability >= 85) return "Advanced";
  if (ability >= 70) return "Upper intermediate";
  if (ability >= 50) return "Intermediate";
  if (ability >= 30) return "Elementary";
  return "Beginner";
}

function getLevelNumber(ability: number): number {
  if (ability >= 85) return 5;
  if (ability >= 70) return 4;
  if (ability >= 50) return 3;
  if (ability >= 30) return 2;
  return 1;
}

function computeAccuracy(
  wordStats: Record<string, { timesSeen: number; timesCorrect: number }>
): number {
  let seen = 0;
  let correct = 0;
  for (const s of Object.values(wordStats)) {
    seen += s.timesSeen;
    correct += s.timesCorrect;
  }
  return seen > 0 ? Math.round((correct / seen) * 100) : 0;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const nickname = useUserProgress((s) => s.nickname);
  const wordStats = useUserProgress((s) => s.wordStats);
  const abilityScore = useUserProgress((s) => s.abilityScore);

  const [stats, setStats] = useState<PracticeStatsSnapshot | null>(null);

  useEffect(() => {
    getPracticeStatsSnapshot()
      .then(setStats)
      .catch(() => undefined);
  }, []);

  const streakCount = stats?.streakCount ?? 0;
  const weekActivity = stats?.weekActivity ?? [];
  const wordsMastered = stats?.wordsMastered ?? 0;
  const wordsForReview = stats?.wordsForReview ?? 0;
  const accuracy = computeAccuracy(wordStats);
  const timeOfDay = getTimeOfDay();
  const rankLabel = getRankLabel(abilityScore);
  const levelNumber = getLevelNumber(abilityScore);

  const greeting = nickname
    ? `Good ${timeOfDay}, ${nickname}.`
    : `Good ${timeOfDay}.`;

  return (
    <main className="space-y-5 pt-4">
      {/* ── 1. Motivational Header + Stat Pills ── */}
      <header>
        <h1 className="font-display text-2xl font-bold text-text-primary">
          {greeting}
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          {getMotivationalSubtext(streakCount)}
        </p>

        {/* Stat pills */}
        <button
          className="mt-3 flex gap-2"
          onClick={() => navigate("/stats")}
          type="button"
        >
          <span className="rounded-full bg-bg-surface px-3 py-1 text-xs font-bold text-text-primary shadow-insetSoft">
            🔥 {streakCount}
          </span>
          <span className="rounded-full bg-bg-surface px-3 py-1 text-xs font-bold text-text-primary shadow-insetSoft">
            🎯 {accuracy}%
          </span>
          <span className="rounded-full bg-bg-surface px-3 py-1 text-xs font-bold text-text-primary shadow-insetSoft">
            ⭐ {wordsMastered}
          </span>
        </button>
      </header>

      {/* ── 2. Primary CTA — Continue Streak ── */}
      <button
        className="w-full text-left"
        onClick={() => navigate("/play/shuffle")}
        type="button"
      >
        <Surface className="relative overflow-hidden bg-gradient-to-br from-accent-teal/20 to-accent-teal/5 p-4">
          <div className="relative z-10">
            <p className="text-lg font-bold text-text-primary">
              🔥{" "}
              {streakCount > 0
                ? `Continue ${streakCount}-Day Streak`
                : "Start Your Streak"}
            </p>
            <p className="mt-0.5 text-sm text-text-secondary">
              Daily Mix – 8 Questions
            </p>
            <span className="mt-1 inline-block rounded-full bg-bg-surface/60 px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
              5 min &gt;
            </span>

            {/* Weekly streak bar */}
            <div className="mt-3 flex items-center gap-1.5">
              {weekActivity.map((day) => (
                <div
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold",
                    day.isActive
                      ? "bg-accent-teal text-bg-app"
                      : "bg-bg-app-deep text-text-secondary"
                  )}
                  key={day.label}
                >
                  {day.isActive ? <CheckIcon /> : day.label.charAt(0)}
                </div>
              ))}
              {weekActivity.length > 0 && (
                <span className="ml-1 text-[10px] font-semibold text-text-secondary">
                  {streakCount >= 7 ? "Perfect week!" : `${streakCount}/7 this week`}
                </span>
              )}
            </div>
          </div>
        </Surface>
      </button>

      {/* ── 3. Quick Play — Game Shuffle Hero ── */}
      <button
        className="w-full text-left"
        onClick={() => navigate("/play/shuffle")}
        type="button"
      >
        <Surface className="p-4" variant="card">
          <div className="flex items-center gap-3">
            <span className="text-accent-teal">
              <DiceIcon className="h-8 w-8" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold text-text-primary">
                Game shuffle
              </p>
              <p className="text-xs text-text-secondary">
                Recommended for you
              </p>
            </div>
            <span className="flex items-center rounded-full bg-accent-teal/15 px-3 py-1 text-xs font-bold text-accent-teal">
              Start <ChevronRightIcon />
            </span>
          </div>

          {/* Stats row */}
          <div className="mt-3 flex justify-between border-t border-border-strong/50 pt-3 text-center">
            <div>
              <p className="text-[10px] font-semibold uppercase text-text-secondary">
                Rank
              </p>
              <p className="text-xs font-bold text-text-primary">
                {rankLabel}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-text-secondary">
                Level
              </p>
              <p className="text-xs font-bold text-text-primary">
                {levelNumber}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-text-secondary">
                Mastered
              </p>
              <p className="text-xs font-bold text-text-primary">
                {wordsMastered}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-text-secondary">
                Accuracy
              </p>
              <p className="text-xs font-bold text-text-primary">
                {accuracy}%
              </p>
            </div>
          </div>
        </Surface>
      </button>

      {/* ── 4. Challenges — Horizontal Scroll ── */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
          Challenges
        </h2>
        <div className="-mr-screenX flex gap-3 overflow-x-auto pr-screenX [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
          <ChallengeCard
            accentColor="#E8B84A"
            description="Fast & chaotic"
            icon={<BoltIcon />}
            onClick={() => navigate("/play/challenge/sprint")}
            subtitle="60 seconds"
            title="Sprint"
          />
          <ChallengeCard
            accentColor="#E8948A"
            description="Zero mistakes"
            icon={<DiamondIcon />}
            onClick={() => navigate("/play/challenge/perfection")}
            subtitle="3 lives"
            title="Perfection"
          />
          <ChallengeCard
            accentColor="#6BCB77"
            description="Think quickly or lose it"
            icon={<RocketIcon />}
            onClick={() => navigate("/play/challenge/rush")}
            subtitle="3 lives, 5s timer"
            title="Rush"
          />
        </div>
      </section>

      {/* ── 5. Focus Practice — 2-Column Grid ── */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
          Focus Practice
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Weak words */}
          <button
            className="w-full text-left"
            onClick={() => navigate("/play/weak_words")}
            type="button"
          >
            <Surface className="flex h-[100px] flex-col justify-between p-3">
              <span className="text-accent-teal">
                <DumbbellIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Weak words
                </p>
                <p className="text-xs text-text-secondary">
                  {wordsForReview > 0
                    ? `Review ${wordsForReview} tough words`
                    : "Review tough words"}
                </p>
              </div>
            </Surface>
          </button>

          {/* Study category — locked */}
          <div className="opacity-50">
            <Surface className="flex h-[100px] flex-col justify-between p-3">
              <span className="text-text-secondary">
                <FolderIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-text-primary">
                  Study category
                </p>
                <p className="text-xs text-text-secondary">Coming soon!</p>
              </div>
            </Surface>
          </div>
        </div>
      </section>
    </main>
  );
}
