import { useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export default function LoginOverlay({ onClose }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [priority, setPriority] = useState("safety");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    if (!trimmedEmail || !trimmedUsername || !password) {
      setError("Please fill out all fields.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          username: trimmedUsername,
          password,
          priority
        })
      });

      if (registerResponse.ok) {
        const data = await registerResponse.json();
        localStorage.setItem("pathly_token", data.token);
        localStorage.setItem("pathly_priority", data.user?.priority || priority);
        localStorage.setItem("pathly_user", JSON.stringify(data.user || {}));
        onClose?.();
        return;
      }

      if (registerResponse.status === 409) {
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: trimmedEmail,
            password
          })
        });

        if (loginResponse.ok) {
          const data = await loginResponse.json();
          localStorage.setItem("pathly_token", data.token);
          localStorage.setItem("pathly_priority", data.user?.priority || priority);
          localStorage.setItem("pathly_user", JSON.stringify(data.user || {}));
          onClose?.();
          return;
        }

        const loginError = await loginResponse.json().catch(() => ({}));
        setError(loginError.error || "Login failed.");
        return;
      }

      const registerError = await registerResponse.json().catch(() => ({}));
      setError(registerError.error || "Registration failed.");
    } catch (err) {
      setError("Unable to reach the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />
      <div className="relative z-10 flex min-h-full items-center justify-center px-4 py-10">
        <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-[0_30px_80px_rgba(15,23,42,0.55)]">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Pathly Access</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Sign in to continue</h2>
            <p className="mt-2 text-sm text-slate-400">
              Set your profile and choose how Pathly prioritizes your route.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="text-sm text-slate-200">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@pathly.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label htmlFor="login-username" className="text-sm text-slate-200">
                Username
              </label>
              <input
                id="login-username"
                type="text"
                autoComplete="username"
                placeholder="pathfinder"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="text-sm text-slate-200">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="********"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <p className="text-sm text-slate-200">Prioritize</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPriority("safety")}
                  aria-pressed={priority === "safety"}
                  disabled={isSubmitting}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    priority === "safety"
                      ? "border-teal-300/60 bg-teal-500/15 text-teal-100"
                      : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/20"
                  }`}
                >
                  Safety
                </button>
                <button
                  type="button"
                  onClick={() => setPriority("speed")}
                  aria-pressed={priority === "speed"}
                  disabled={isSubmitting}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    priority === "speed"
                      ? "border-amber-300/60 bg-amber-500/15 text-amber-100"
                      : "border-white/10 bg-slate-950/60 text-slate-200 hover:border-white/20"
                  }`}
                >
                  Speed
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving..." : "Enter Dashboard"}
            </button>
          </form>

          <button
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-2xl border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400 transition hover:border-white/20 hover:text-slate-200"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
