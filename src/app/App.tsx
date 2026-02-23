import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useUserProgress } from "@/lib/userProgressStore";
import { ChallengePlayPage } from "@/pages/ChallengePlayPage";
import { HomePage } from "@/pages/HomePage";
import { LevelPage } from "@/pages/LevelPage";
import { LoginPage } from "@/pages/LoginPage";
import { OnboardingPage } from "@/pages/onboarding/OnboardingPage";
import { PlayPage } from "@/pages/PlayPage";
import { ResultsPage } from "@/pages/ResultsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { FavoritesPage } from "@/pages/stats/FavoritesPage";
import { HistoryPage } from "@/pages/stats/HistoryPage";
import { WordsPage } from "@/pages/stats/WordsPage";
import { StatsPage } from "@/pages/StatsPage";
import { SummaryPage } from "@/pages/SummaryPage";

function AuthGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, loading } = useAuth();
  const initialized = useUserProgress((s) => s.initialized);
  const init = useUserProgress((s) => s.init);
  const reset = useUserProgress((s) => s.reset);
  const prevUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      prevUserIdRef.current = null;
      return;
    }

    // If user changed (account switch), reset first
    if (prevUserIdRef.current && prevUserIdRef.current !== user.id) {
      reset();
    }
    prevUserIdRef.current = user.id;

    if (!initialized) {
      void init();
    }
  }, [user, initialized, init, reset]);

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!user.onboardingCompleted) {
    return <Navigate replace to="/onboarding" />;
  }

  if (!initialized) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-text-secondary">Loading progress...</p>
      </main>
    );
  }

  return <>{children}</>;
}

/** Auth-only gate: checks login but NOT onboarding status. Used for /onboarding route. */
function AuthOnlyGate({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-text-secondary">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (user.onboardingCompleted) {
    return <Navigate replace to="/modes" />;
  }

  return <>{children}</>;
}

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route
        element={
          <AuthOnlyGate>
            <OnboardingPage />
          </AuthOnlyGate>
        }
        path="/onboarding"
      />
      <Route
        element={
          <AuthGate>
            <HomePage />
          </AuthGate>
        }
        path="/modes"
      />
      <Route
        element={
          <AuthGate>
            <ChallengePlayPage />
          </AuthGate>
        }
        path="/play/challenge/:challengeType"
      />
      <Route
        element={
          <AuthGate>
            <PlayPage />
          </AuthGate>
        }
        path="/play/:modeId"
      />
      <Route
        element={
          <AuthGate>
            <SummaryPage />
          </AuthGate>
        }
        path="/summary"
      />
      <Route
        element={
          <AuthGate>
            <StatsPage />
          </AuthGate>
        }
        path="/stats"
      />
      <Route
        element={
          <AuthGate>
            <FavoritesPage />
          </AuthGate>
        }
        path="/stats/favorites"
      />
      <Route
        element={
          <AuthGate>
            <WordsPage />
          </AuthGate>
        }
        path="/stats/words"
      />
      <Route
        element={
          <AuthGate>
            <HistoryPage />
          </AuthGate>
        }
        path="/stats/history"
      />
      <Route
        element={
          <AuthGate>
            <ResultsPage />
          </AuthGate>
        }
        path="/results"
      />
      <Route
        element={
          <AuthGate>
            <LevelPage />
          </AuthGate>
        }
        path="/level"
      />
      <Route
        element={
          <AuthGate>
            <SettingsPage />
          </AuthGate>
        }
        path="/settings"
      />
      <Route element={<Navigate replace to="/modes" />} path="*" />
    </Routes>
  );
}

export function App(): JSX.Element {
  const rawGoogleClientId = import.meta.env
    .VITE_GOOGLE_CLIENT_ID as unknown;
  const googleClientId =
    typeof rawGoogleClientId === "string"
      ? rawGoogleClientId.trim()
      : "";

  if (!googleClientId) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-text-secondary">
          Google auth is not configured. Set `VITE_GOOGLE_CLIENT_ID`.
        </p>
      </main>
    );
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col bg-bg-app px-screenX pb-8 pt-4">
          <AppRoutes />
        </div>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
