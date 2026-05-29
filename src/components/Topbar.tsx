'use client';
import { useRouter } from 'next/navigation';

interface Props {
  username: string;
  onMenuClick?: () => void;
}

export default function Topbar({ username, onMenuClick }: Props) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <header className="h-[52px] bg-tj-card border-b border-tj-border flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-tj-muted hover:text-tj-text hover:bg-tj-hover transition-colors"
          aria-label="Menu openen"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <line x1="2" y1="4.5" x2="16" y2="4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="9"   x2="16" y2="9"   stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="2" y1="13.5" x2="16" y2="13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

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
      </div>

      <div className="flex items-center gap-2 text-[12px] text-tj-muted">
        <span className="hidden sm:inline">Ingelogd als</span>
        <span className="bg-tj-active border border-tj-border rounded-full px-3 py-1 text-tj-text2 font-medium max-w-[120px] truncate">
          {username}
        </span>
        <button
          onClick={handleLogout}
          className="border border-[#2a1a1a] rounded-full px-3 py-1 text-tj-red hover:bg-[#1a0a0a] transition-colors whitespace-nowrap"
        >
          Uitloggen
        </button>
      </div>
    </header>
  );
}
