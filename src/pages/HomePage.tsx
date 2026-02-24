import { useNavigate } from "react-router-dom";

import { ChallengeCard } from "@/design-system/components/ChallengeCard";
import { PracticeModeCard } from "@/design-system/components/PracticeModeCard";
import { StreakBanner } from "@/design-system/components/StreakBanner";
import {
  BoltIcon,
  DiamondIcon,
  RocketIcon,
  GraduateIcon,
  DiceIcon,
  MessageIcon,
  TargetIcon,
  PencilIcon,
  DumbbellIcon
} from "@/design-system/icons";
import { useUserProgress } from "@/lib/userProgressStore";

export function HomePage(): JSX.Element {
  const navigate = useNavigate();
  const nickname = useUserProgress((s) => s.nickname);

  const greeting = nickname ? `Hi, ${nickname}` : "Ready to practice?";

  return (
    <main className="space-y-5 pt-4">
      {/* Header */}
      <header className="flex items-start justify-between gap-3">
        <h1 className="font-display text-4xl font-bold text-text-primary">
          {greeting}
        </h1>
        <button
          className="flex-shrink-0 rounded-full border-2 border-border-strong bg-bg-surface px-3 py-1 text-sm font-bold text-text-primary transition-colors duration-fast hover:bg-bg-surface-alt"
          onClick={() => navigate("/stats")}
          type="button"
        >
          Stats
        </button>
      </header>

      {/* Streak */}
      <StreakBanner />

      {/* Challenges */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
          Challenges
        </h2>
        <div className="-mr-screenX flex gap-3 overflow-x-auto pr-screenX [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:h-0 [&::-webkit-scrollbar]:w-0">
          <ChallengeCard
            accentColor="#E8B84A"
            icon={<BoltIcon />}
            onClick={() => navigate("/play/challenge/sprint")}
            subtitle="60 seconds"
            title="Sprint"
          />
          <ChallengeCard
            accentColor="#E8948A"
            icon={<DiamondIcon />}
            onClick={() => navigate("/play/challenge/perfection")}
            subtitle="3 lives"
            title="Perfection"
          />
          <ChallengeCard
            accentColor="#6BCB77"
            icon={<RocketIcon />}
            onClick={() => navigate("/play/challenge/rush")}
            subtitle="3 lives, 5s timer"
            title="Rush"
          />
          <ChallengeCard
            accentColor="#93C1C1"
            icon={<GraduateIcon />}
            onClick={() => navigate("/play/challenge/level_test")}
            subtitle="30 questions"
            title="Level test"
          />
        </div>
      </section>

      {/* Practice */}
      <section>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-text-secondary">
          Practice
        </h2>
        <div className="space-y-3">
          <PracticeModeCard
            description="Mix of all question types"
            fullWidth
            icon={<DiceIcon className="h-7 w-7" />}
            onClick={() => navigate("/play/shuffle")}
            title="Game shuffle"
          />
          <div className="grid grid-cols-2 gap-3">
            <PracticeModeCard
              description="Pick the word"
              icon={<MessageIcon className="h-5 w-5" />}
              onClick={() => navigate("/play/guess_word")}
              title="Guess the word"
            />
            <PracticeModeCard
              description="Match definitions"
              icon={<TargetIcon className="h-5 w-5" />}
              onClick={() => navigate("/play/meaning_match")}
              title="Meaning match"
            />
            <PracticeModeCard
              description="Complete sentences"
              icon={<PencilIcon className="h-5 w-5" />}
              onClick={() => navigate("/play/fill_gap")}
              title="Fill the gap"
            />
            <PracticeModeCard
              description="Review tough words"
              icon={<DumbbellIcon className="h-5 w-5" />}
              onClick={() => navigate("/play/weak_words")}
              title="Weak words"
            />
          </div>
        </div>
      </section>
    </main>
  );
}
