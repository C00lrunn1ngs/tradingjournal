'use client';
import { useState } from 'react';

export default function ProfilePage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) { setMessage('Nieuwe wachtwoorden komen niet overeen'); setStatus('error'); return; }
    setStatus('loading');
    setMessage('');

    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus('success');
      setMessage('Wachtwoord succesvol gewijzigd');
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } else {
      setStatus('error');
      setMessage((data as { error?: string }).error ?? 'Er is een fout opgetreden');
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="text-lg font-bold text-tj-text mb-6">Profiel</h1>

      <div className="bg-tj-card border border-tj-border rounded-xl p-6">
        <h2 className="text-sm font-semibold text-tj-text mb-4">Wachtwoord wijzigen</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Huidig wachtwoord
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Nieuw wachtwoord
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="minimaal 8 tekens"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1.5">
              Bevestig nieuw wachtwoord
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

          {message && (
            <p className={`text-sm rounded-lg px-3 py-2 ${
              status === 'success'
                ? 'text-tj-teal bg-[#061a12] border border-[#0d3020]'
                : 'text-tj-red bg-[#1a0808] border border-[#2a1010]'
            }`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-tj-teal hover:opacity-90 text-[#06120f] font-semibold rounded-lg px-4 py-2.5 text-sm transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? 'Bezig...' : 'Wachtwoord opslaan'}
          </button>
        </form>
      </div>
    </div>
  );
}
