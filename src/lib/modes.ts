import type { ModeContent, ModeId, ModeQuestion } from "@/types/content";

type ModeJsonModule = {
  default: ModeContent;
};

const MODE_ORDER: ModeId[] = [
  "kids_beginner",
  "kids_intermediate",
  "kids_advanced",
  "adult_beginner",
  "adult_intermediate",
  "adult_advanced"
];

const rawModeModules = import.meta.glob<ModeJsonModule>("../../content/modes/*.json", {
  eager: true
});

const allModes = Object.values(rawModeModules)
  .map((module) => module.default)
  .sort((a, b) => MODE_ORDER.indexOf(a.modeId) - MODE_ORDER.indexOf(b.modeId));

export function getAllModes(): ModeContent[] {
  return allModes;
}

export function getModeById(modeId: string): ModeContent | undefined {
  return allModes.find((mode) => mode.modeId === modeId);
}

/** Returns all questions across the given tier IDs. */
export function getQuestionsByTiers(tierIds: ModeId[]): ModeQuestion[] {
  return allModes
    .filter((mode) => tierIds.includes(mode.modeId))
    .flatMap((mode) => mode.questions);
}
