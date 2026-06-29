import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-800/60 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-400/10">
            <svg className="h-4 w-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-zinc-100 tracking-tight">
            WFH WatchFace
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-300">Privacy-first employee verification</span>
        </div>

        <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
          Remote Work,{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-400 bg-clip-text text-transparent">
            Verified.
          </span>
        </h1>

        <p className="mt-5 max-w-xl text-lg text-zinc-400 leading-relaxed">
          Local face verification. No photos stored. No video sent. Just a privacy-first
          way for teams to confirm remote presence.
        </p>

        {/* Portal cards */}
        <div className="mt-14 grid w-full max-w-3xl gap-6 sm:grid-cols-2">
          {/* Employee card */}
          <Link
            to="/employee/login"
            id="landing-employee-btn"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-left transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-400/10 transition-colors group-hover:bg-emerald-400/20">
              <svg className="h-7 w-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-emerald-400">Employee Portal</p>
            <h2 className="mt-2 text-xl font-black text-white">I am an Employee</h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Enroll your face once. Your presence is verified privately — no images leave your device.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-emerald-400 transition-all group-hover:gap-3">
              Sign in <span aria-hidden>→</span>
            </div>

            {/* Hover gradient */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-inset ring-emerald-400/20 transition-opacity group-hover:opacity-100" />
          </Link>

          {/* Manager card */}
          <Link
            to="/manager/login"
            id="landing-manager-btn"
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-left transition-all duration-300 hover:border-violet-500/40 hover:shadow-2xl hover:shadow-violet-500/10 hover:-translate-y-1"
          >
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-violet-400/10 transition-colors group-hover:bg-violet-400/20">
              <svg className="h-7 w-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>

            <p className="text-xs font-bold uppercase tracking-widest text-violet-400">Manager Portal</p>
            <h2 className="mt-2 text-xl font-black text-white">I am a Manager</h2>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
              Monitor your team's verification status in real time. Acknowledge alerts and manage employees.
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-violet-400 transition-all group-hover:gap-3">
              Sign in <span aria-hidden>→</span>
            </div>

            <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 ring-1 ring-inset ring-violet-400/20 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>

        {/* Features row */}
        <div className="mt-14 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: '🔒', label: 'No photos stored' },
            { icon: '⚡', label: 'Runs locally on device' },
            { icon: '🛡️', label: 'AES-256 encrypted' },
          ].map(({ icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-1.5">
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-semibold text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-5 text-center">
        <p className="text-xs text-zinc-600">
          remote-watchface — Privacy-first employee verification
        </p>
      </footer>
    </main>
  );
}
