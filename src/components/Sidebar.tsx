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
];

const ADMIN_NAV: NavItem[] = [
  { href: '/admin/users', label: 'Gebruikers', icon: '👥', adminOnly: true },
];

interface Props {
  role: 'admin' | 'user';
  startingBalance: number;
}

export default function Sidebar({ role, startingBalance }: Props) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href);

  return (
    <aside className="w-48 bg-tj-card border-r border-tj-border flex flex-col flex-shrink-0">
      <nav className="flex-1 p-3 flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold text-tj-muted2 tracking-widest uppercase px-2.5 py-2.5 mt-1">
          Menu
        </p>

        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
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
