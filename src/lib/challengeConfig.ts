export interface ChallengeRule {
  icon: string;
  text: string;
}

export interface ChallengeConfig {
  title: string;
  rules: ChallengeRule[];
  accentColor: string;
}

export const CHALLENGE_CONFIGS: Record<string, ChallengeConfig> = {
  sprint: {
    title: "Sprint",
    accentColor: "#E8B84A",
    rules: [
      { icon: "pencil", text: "Guess the correct word" },
      { icon: "cards", text: "Answer as many as you can" },
      { icon: "clock", text: "60 seconds total" }
    ]
  },
  rush: {
    title: "Rush",
    accentColor: "#6BCB77",
    rules: [
      { icon: "pencil", text: "Guess the correct word" },
      { icon: "cards", text: "Answer as many as you can" },
      { icon: "heart", text: "3 lives total" },
      { icon: "clock", text: "5 seconds per question" }
    ]
  },
  perfection: {
    title: "Perfection",
    accentColor: "#E8948A",
    rules: [
      { icon: "pencil", text: "Guess the correct word" },
      { icon: "cards", text: "Answer as many as you can" },
      { icon: "heart", text: "3 lives total" },
      { icon: "clock", text: "No time limits or timers" }
    ]
  },
  level_test: {
    title: "Vocabulary level test",
    accentColor: "#93C1C1",
    rules: [
      { icon: "info", text: "Measure your current level" },
      { icon: "chart", text: "See how close you are to leveling up" },
      { icon: "cards", text: "30 questions (5-6 min)" }
    ]
  }
};
