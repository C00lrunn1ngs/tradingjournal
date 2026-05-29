'use client';
import { useState } from 'react';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

interface Props {
  username: string;
  role: 'admin' | 'user';
  startingBalance: number;
  children: React.ReactNode;
}

export default function MobileShell({ username, role, startingBalance, children }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <Topbar username={username} onMenuClick={() => setOpen(o => !o)} />
      <div className="flex flex-1 overflow-hidden relative">

        {/* Backdrop — mobile only */}
        {open && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Sidebar: slide-in overlay on mobile, static on md+ */}
        <div className={`
          fixed top-0 left-0 h-full z-50
          md:static md:h-auto md:z-auto
          transition-transform duration-200 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0
        `}>
          <Sidebar role={role} startingBalance={startingBalance} onClose={() => setOpen(false)} />
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-tj-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
