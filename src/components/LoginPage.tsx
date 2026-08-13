import { GoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { loginWithGoogleIdToken, loginWithPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithPassword(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign-in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <div className="panel login-panel">
        <h1>DA</h1>
        <p className="muted">Sign in to check brokers and view the load board.</p>

        <form className="password-form" onSubmit={handlePasswordSubmit}>
          <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" className="primary-button" disabled={submitting}>
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="login-divider">or</div>

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
