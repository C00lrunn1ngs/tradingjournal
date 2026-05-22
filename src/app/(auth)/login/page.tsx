'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const fd = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: fd.get('username'),
        password: fd.get('password'),
      }),
    });

    if (res.ok) {
      window.location.href = '/dashboard';
      return;
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? 'Inloggen mislukt');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-tj-card border border-tj-border rounded-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-tj-teal">📈 TradingJournal</h1>
          <p className="text-tj-muted text-sm mt-1">Log in om door te gaan</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Gebruikersnaam
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="jouw gebruikersnaam"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Wachtwoord
            </label>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-tj-red bg-[#1a0808] border border-[#2a1010] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-tj-teal hover:opacity-90 text-[#06120f] font-semibold rounded-lg py-2.5 text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
}
