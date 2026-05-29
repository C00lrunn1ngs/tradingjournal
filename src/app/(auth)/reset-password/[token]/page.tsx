'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen'); return; }
    setStatus('loading');
    setError('');

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
    });

    if (res.ok) {
      router.push('/login?reset=1');
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? 'Er is een fout opgetreden');
      setStatus('error');
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-tj-card border border-tj-border rounded-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-tj-teal">Nieuw wachtwoord</h1>
          <p className="text-tj-muted text-sm mt-1">Kies een nieuw wachtwoord</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Nieuw wachtwoord
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="minimaal 8 tekens"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Bevestig wachtwoord
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
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
            disabled={status === 'loading'}
            className="w-full bg-tj-teal hover:opacity-90 text-[#06120f] font-semibold rounded-lg py-2.5 text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Bezig...' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  );
}
