'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard',    icon: '▪' },
  { href: '/trades',    label: 'Trades',        icon: '📋' },
  { href: '/stats',     label: 'Statistieken',  icon: '📊' },
  { href: '/profile',   label: 'Profiel',       icon: '👤' },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/users', label: 'Gebruikers', icon: '👥', adminOnly: true },
];

interface Props {
  role: 'admin' | 'user';
  startingBalance: number;
  onClose?: () => void;
}

export default function Sidebar({ role, startingBalance, onClose }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside className="w-64 md:w-48 h-full bg-tj-card border-r border-tj-border flex flex-col flex-shrink-0">
      {/* Close button — mobile only */}
      <div className="md:hidden flex justify-end p-3 border-b border-tj-border">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-tj-muted hover:text-tj-text hover:bg-tj-hover transition-colors"
          aria-label="Menu sluiten"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <line x1="2" y1="2" x2="14" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="2" x2="2" y2="14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-tj-muted2 tracking-widest uppercase px-2.5 py-2.5 mt-1">
          Menu
        </p>

        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={`flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-lg text-[14px] md:text-[13px] font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-tj-active text-tj-teal font-semibold'
                : 'text-tj-muted hover:bg-tj-hover hover:text-tj-text2'
            }`}
          >
            <span className="w-4 text-center text-[15px]">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {role === 'admin' && (
          <>
            <p className="text-[10px] font-semibold text-tj-muted2 tracking-widest uppercase px-2.5 py-2.5 mt-3">
              Beheer
            </p>
            {ADMIN_NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-lg text-[14px] md:text-[13px] font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-tj-active text-tj-teal font-semibold'
                    : 'text-tj-muted hover:bg-tj-hover hover:text-tj-text2'
                }`}
              >
                <span className="w-4 text-center text-[15px]">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Starting balance chip */}
      <div className="p-3 border-t border-tj-border">
        <p className="text-[10px] text-tj-muted2 mb-1">Startkapitaal</p>
        <p className="text-[13px] font-bold font-mono text-tj-blue">
          €{startingBalance.toLocaleString('nl-NL')}
        </p>
      </div>
    </aside>
  );
}
