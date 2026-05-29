'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSuccess] = useState(
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset') === '1'
  );

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
              Gebruikersnaam of e-mailadres
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="gebruikersnaam of e-mail"
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

          {resetSuccess && (
            <p className="text-sm text-tj-teal bg-[#061a12] border border-[#0d3020] rounded-lg px-3 py-2">
              Wachtwoord succesvol gewijzigd. Je kunt nu inloggen.
            </p>
          )}

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

        <Link href="/forgot-password" className="block mt-4 text-center text-xs text-tj-muted hover:text-tj-text">
          Wachtwoord vergeten?
        </Link>
      </div>
    </div>
  );
}
