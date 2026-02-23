import { GoogleLogin } from "@react-oauth/google";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/lib/AuthContext";

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback(
    (credential: string) => {
      setError(null);
      login(credential)
        .then(() => navigate("/modes", { replace: true }))
        .catch((err: unknown) => {
          const msg =
            err instanceof Error ? err.message : "Login failed";
          setError(msg);
          console.error("Login error:", err);
        });
    },
    [login, navigate]
  );

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center gap-8">
      <div className="text-center">
        <h1 className="font-display text-5xl font-bold text-text-primary">
          VocabDeck
        </h1>
        <p className="mt-3 font-body text-lg text-text-secondary">
          Master words, one card at a time
        </p>
      </div>

      <GoogleLogin
        onError={() => {
          setError("Google sign-in was cancelled or failed");
        }}
        onSuccess={(response) => {
          if (response.credential) {
            handleSuccess(response.credential);
          }
        }}
        shape="pill"
        size="large"
        theme="filled_black"
      />

      {error ? (
        <p className="text-sm text-state-incorrect">{error}</p>
      ) : null}
    </main>
  );
}
