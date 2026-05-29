'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus('loading');
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setStatus('sent');
    } else {
      const data = await res.json().catch(() => ({}));
      setError((data as { error?: string }).error ?? 'Er is een fout opgetreden');
      setStatus('error');
    }
  }

  if (status === 'sent') {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-tj-card border border-tj-border rounded-xl p-8 text-center">
          <p className="text-2xl mb-3">📧</p>
          <h1 className="text-lg font-bold text-tj-teal mb-2">E-mail verzonden</h1>
          <p className="text-tj-muted text-sm">
            Als er een account bestaat voor <span className="text-tj-text">{email}</span>, ontvang je binnen een paar minuten een resetlink.
          </p>
          <Link href="/login" className="block mt-6 text-sm text-tj-teal hover:opacity-80">
            ← Terug naar inloggen
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-tj-card border border-tj-border rounded-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-bold text-tj-teal">Wachtwoord vergeten</h1>
          <p className="text-tj-muted text-sm mt-1">Vul je e-mailadres in</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              E-mailadres
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="jouw@email.nl"
            />
          </div>

          {status === 'error' && (
            <p className="text-sm text-tj-red bg-[#1a0808] border border-[#2a1010] rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full bg-tj-teal hover:opacity-90 text-[#06120f] font-semibold rounded-lg py-2.5 text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Bezig...' : 'Resetlink versturen'}
          </button>
        </form>

        <Link href="/login" className="block mt-4 text-center text-sm text-tj-muted hover:text-tj-text">
          ← Terug naar inloggen
        </Link>
      </div>
    </div>
  );
}
