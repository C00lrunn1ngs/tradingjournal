'use client';
import { useState, useEffect } from 'react';

interface User {
  id: number; username: string; email: string; role: string;
  starting_balance: number; max_drawdown: number; created_at: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', password:'', role:'user', starting_balance:'45000', max_drawdown:'2000' });

  async function load() {
    const r = await fetch('/api/admin/users');
    if (r.ok) setUsers(await r.json());
  }
  useEffect(() => { load(); }, []);

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, starting_balance: +form.starting_balance, max_drawdown: +form.max_drawdown }),
    });
    setShowForm(false);
    setLoading(false);
    setForm({ username:'', email:'', password:'', role:'user', starting_balance:'45000', max_drawdown:'2000' });
    await load();
  }

  async function deleteUser(id: number) {
    if (!confirm('Gebruiker verwijderen? Dit verwijdert ook al zijn trades.')) return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    await load();
  }

  const inp = 'w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2 text-tj-text text-sm font-mono placeholder-tj-muted focus:outline-none focus:border-tj-teal';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-lg font-bold text-tj-text">Gebruikersbeheer</h1>
        <button onClick={() => setShowForm(s => !s)}
          className="bg-tj-teal text-[#06120f] text-[12px] font-semibold rounded-lg px-4 py-2 hover:opacity-90">
          + Nieuwe gebruiker
        </button>
      </div>

      {showForm && (
        <div className="bg-tj-card border border-tj-border rounded-xl p-5 mb-5">
          <h2 className="text-sm font-semibold text-tj-text mb-4">Nieuwe gebruiker aanmaken</h2>
          <form onSubmit={createUser} className="grid grid-cols-2 gap-4">
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Gebruikersnaam *</label>
              <input required value={form.username} onChange={e => setForm(f=>({...f,username:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">E-mail *</label>
              <input type="email" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Wachtwoord *</label>
              <input type="password" required value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Rol</label>
              <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value}))} className={inp}>
                <option value="user">Gebruiker</option>
                <option value="admin">Admin</option>
              </select></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Startkapitaal (€)</label>
              <input type="number" value={form.starting_balance} onChange={e => setForm(f=>({...f,starting_balance:e.target.value}))} className={inp} /></div>
            <div><label className="block text-[10px] font-semibold text-tj-muted2 uppercase tracking-wide mb-1">Max Drawdown (€)</label>
              <input type="number" value={form.max_drawdown} onChange={e => setForm(f=>({...f,max_drawdown:e.target.value}))} className={inp} /></div>
            <div className="col-span-2 flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-tj-border text-tj-text2 text-sm hover:bg-tj-hover">Annuleren</button>
              <button type="submit" disabled={loading} className="px-4 py-2 rounded-lg bg-tj-teal text-[#06120f] text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {loading ? 'Aanmaken...' : 'Aanmaken'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-tj-card border border-tj-border rounded-xl overflow-hidden">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-tj-border">
              {['Gebruikersnaam','E-mail','Rol','Startkapitaal','Max DD','Aangemaakt','Acties'].map(h => (
                <th key={h} className="text-left px-3 py-2.5 text-[10px] font-semibold text-tj-muted2 uppercase tracking-[.6px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-[#0d1a26] hover:bg-tj-hover">
                <td className="px-3 py-3 font-mono font-semibold text-tj-text">{u.username}</td>
                <td className="px-3 py-3 text-tj-text2">{u.email}</td>
                <td className="px-3 py-3">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${u.role === 'admin' ? 'bg-[#0a2535] text-tj-blue border-[#1a3a50]' : 'bg-tj-hover text-tj-muted border-tj-border'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-3 py-3 font-mono text-tj-text2">€{Number(u.starting_balance).toLocaleString('nl-NL')}</td>
                <td className="px-3 py-3 font-mono text-tj-text2">€{Number(u.max_drawdown).toLocaleString('nl-NL')}</td>
                <td className="px-3 py-3 text-tj-muted">{new Date(u.created_at).toLocaleDateString('nl-NL')}</td>
                <td className="px-3 py-3">
                  <button onClick={() => deleteUser(u.id)}
                    className="border border-tj-border rounded px-2 py-1 text-[11px] text-tj-muted hover:border-tj-red hover:text-tj-red transition-colors">
                    🗑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
