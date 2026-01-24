export default function SignUp() {
  const handleSubmit = (event) => {
    event.preventDefault();
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
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-400/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-teal-500/25 transition hover:brightness-110"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
