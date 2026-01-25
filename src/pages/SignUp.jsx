import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:3000';

export default function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [priority, setPriority] = useState('safety');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password, priority }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token and navigate to home
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(94,234,212,0.2),_transparent_60%)]" />
      <div className="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />

      <div className="relative mx-auto w-full max-w-lg">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-8 shadow-[0_25px_60px_rgba(15,23,42,0.6)]">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">
            New Account
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Start your Pathly journey
          </h1>
          <p className="mt-3 text-sm text-slate-400">
            Create your account and continue planning safer, smarter routes.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-500/20 border border-red-500/50 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="signup-email" className="text-sm text-slate-200">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="you@pathly.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label htmlFor="signup-username" className="text-sm text-slate-200">
                Username
              </label>
              <input
                id="signup-username"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="text-sm text-slate-200">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                placeholder="Create a secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <div>
              <label className="text-sm text-slate-200">Priority</label>
              <div className="mt-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="radio"
                    name="priority"
                    value="safety"
                    checked={priority === 'safety'}
                    onChange={(e) => setPriority(e.target.value)}
                    className="accent-teal-400"
                  />
                  Safety
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="radio"
                    name="priority"
                    value="speed"
                    checked={priority === 'speed'}
                    onChange={(e) => setPriority(e.target.value)}
                    className="accent-teal-400"
                  />
                  Speed
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-500/25 transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
