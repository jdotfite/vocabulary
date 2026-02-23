import { GoogleOAuthProvider } from "@react-oauth/google";
import { useEffect, useRef } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { useUserProgress } from "@/lib/userProgressStore";
import { LevelPage } from "@/pages/LevelPage";
import { LoginPage } from "@/pages/LoginPage";
import { ModeSelectPage } from "@/pages/ModeSelectPage";
import { PlayPage } from "@/pages/PlayPage";
import { ResultsPage } from "@/pages/ResultsPage";
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

  if (!initialized) {
    return (
      <main className="flex min-h-[80vh] items-center justify-center">
        <p className="text-text-secondary">Loading progress...</p>
      </main>
    );
  }

  return <>{children}</>;
}

function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route element={<LoginPage />} path="/login" />
      <Route
        element={
          <AuthGate>
            <ModeSelectPage />
          </AuthGate>
        }
        path="/modes"
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
