'use client';
import { useRouter } from 'next/navigation';

interface Props {
  username: string;
}

export default function Topbar({ username }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-[52px] bg-tj-card border-b border-tj-border flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-2 text-[16px] font-bold text-tj-teal tracking-tight">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <polyline
            points="2,14 6,9 10,12 14,5 18,8"
            stroke="#00d4aa"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        TradingJournal
      </div>

      <div className="flex items-center gap-2.5 text-[12px] text-tj-muted">
        <span>Ingelogd als</span>
        <span className="bg-tj-active border border-tj-border rounded-full px-3.5 py-1 text-tj-text2 font-medium">
          {username}
        </span>
        <button
          onClick={handleLogout}
          className="border border-[#2a1a1a] rounded-full px-3.5 py-1 text-tj-red hover:bg-[#1a0a0a] transition-colors"
        >
          Uitloggen
        </button>
      </div>
    </header>
  );
}
