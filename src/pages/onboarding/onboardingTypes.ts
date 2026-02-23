export interface OnboardingData {
  ageRange: string | null;
  gender: string | null;
  nickname: string | null;
  vocabularyLevel: string | null;
  knownWords: string[];
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  ageRange: null,
  gender: null,
  nickname: null,
  vocabularyLevel: null,
  knownWords: []
};
