import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { loginWithGoogleIdToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="login-page">
      <div className="panel login-panel">
        <h1>Dispatcher Assistant</h1>
        <p className="muted">Sign in to check brokers before you book.</p>

        <div className="login-button">
          <GoogleLogin
            onSuccess={(credential) => {
              if (!credential.credential) {
                setError("Google didn't return a credential — try again.");
                return;
              }
              setError(null);
              loginWithGoogleIdToken(credential.credential).catch(() =>
                setError("Sign-in failed — the backend rejected that token."),
              );
            }}
            onError={() => setError("Google sign-in failed.")}
          />
        </div>

        {error && <div className="alert alert-error">{error}</div>}
      </div>
    </div>
  );
}
