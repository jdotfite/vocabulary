import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  INITIAL_ONBOARDING_DATA,
  type OnboardingData
} from "./onboardingTypes";
import { PlacementTest } from "./PlacementTest";
import { AgeStep } from "./steps/AgeStep";
import { CompletionStep } from "./steps/CompletionStep";
import { GenderStep } from "./steps/GenderStep";
import { NicknameStep } from "./steps/NicknameStep";
import { StreakMotivationStep } from "./steps/StreakMotivationStep";
import { TailorStep } from "./steps/TailorStep";
import { WelcomeStep } from "./steps/WelcomeStep";

import { apiPost } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const TOTAL_STEPS = 8;

const slideVariants = {
  enter: { x: 40, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -40, opacity: 0 }
} as const;

const slideTransition = { duration: 0.2, ease: "easeInOut" } as const;

/** Derive vocabulary_level from placement ability score for backward compat. */
function abilityToVocabLevel(ability: number): string {
  if (ability >= 70) return "advanced";
  if (ability >= 40) return "intermediate";
  return "beginner";
}

export function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const { markOnboardingComplete } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const next = useCallback(() => {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const updateField = useCallback(
    <K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) => {
      setData((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleFinish = useCallback(async () => {
    setSaving(true);
    setSaveError(false);
    try {
      await apiPost("/api/onboarding/complete", {
        ageRange: data.ageRange,
        gender: data.gender,
        nickname: data.nickname,
        vocabularyLevel: data.vocabularyLevel,
        knownWords: data.knownWords,
        abilityScore: data.abilityScore,
      });
      markOnboardingComplete();
      navigate("/modes", { replace: true });
    } catch (err) {
      console.error("Onboarding save error:", err);
      setSaving(false);
      setSaveError(true);
    }
  }, [data, markOnboardingComplete, navigate]);

  const handleAgeSelect = useCallback(
    (val: string) => {
      updateField("ageRange", val);
      setTimeout(next, 200);
    },
    [updateField, next]
  );

  const handleGenderSelect = useCallback(
    (val: string) => {
      updateField("gender", val);
      setTimeout(next, 200);
    },
    [updateField, next]
  );

  const handlePlacementComplete = useCallback(
    (abilityScore: number) => {
      setData((prev) => ({
        ...prev,
        abilityScore,
        vocabularyLevel: abilityToVocabLevel(abilityScore),
      }));
      next();
    },
    [next]
  );

  function renderStep(): JSX.Element {
    switch (step) {
      case 1:
        return <WelcomeStep onNext={next} />;
      case 2:
        return <TailorStep onNext={next} />;
      case 3:
        return (
          <AgeStep
            onSelect={handleAgeSelect}
            onSkip={next}
            value={data.ageRange}
          />
        );
      case 4:
        return (
          <GenderStep onSelect={handleGenderSelect} value={data.gender} />
        );
      case 5:
        return (
          <NicknameStep
            onSkip={next}
            onSubmit={(val) => {
              updateField("nickname", val);
              next();
            }}
            value={data.nickname}
          />
        );
      case 6:
        return <StreakMotivationStep onNext={next} />;
      case 7:
        return <PlacementTest onComplete={handlePlacementComplete} />;
      case 8:
        return (
          <CompletionStep
            onFinish={() => void handleFinish()}
            saving={saving}
          />
        );
      default:
        return <WelcomeStep onNext={next} />;
    }
  }

  return (
    <main className="flex min-h-[80vh] flex-col">
      {saveError && (
        <p className="mt-2 rounded-lg bg-state-incorrect/10 px-3 py-2 text-center text-sm text-state-incorrect">
          Could not save your preferences. Please try again.
        </p>
      )}

      {/* Progress dots — hide during placement test (it has its own progress) */}
      {step !== 7 && (
        <div className="flex items-center justify-center gap-1.5 py-3">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <span
              className={`h-1.5 rounded-full transition-all duration-fast ${
                i + 1 === step
                  ? "w-6 bg-accent-teal"
                  : i + 1 < step
                    ? "w-1.5 bg-accent-teal/60"
                    : "w-1.5 bg-bg-surface"
              }`}
              key={`dot-${i}`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          animate="center"
          className="flex flex-1 flex-col"
          exit="exit"
          initial="enter"
          key={step}
          transition={slideTransition}
          variants={slideVariants}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
