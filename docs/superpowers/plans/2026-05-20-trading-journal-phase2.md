# Trading Journal Dashboard — Implementation Plan: Phase 2
# Auth API · Login Page · Layouts · Sidebar · Topbar · Trades API · Dashboard Stats API

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Prerequisite:** Phase 1 complete (project initialized, DB migrated, auth.ts and calculations.ts passing tests, middleware in place).

**Goal:** Build auth API routes, the login page, the app shell (layouts, sidebar, topbar), and all trade CRUD + dashboard stats API endpoints.

---

## File Map (Phase 2)

- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(auth)/login/page.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Topbar.tsx`
- Create: `src/app/api/trades/route.ts`
- Create: `src/app/api/trades/[id]/route.ts`
- Create: `src/app/api/dashboard/stats/route.ts`

---

## Task 6: Auth API Routes

**Files:**
- Create: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/logout/route.ts`
- Create: `src/app/api/auth/me/route.ts`

- [ ] **Step 6.1: Write `src/app/api/auth/login/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db, sql } from '@/lib/db';
import { signToken, tokenCookieOptions } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Gebruikersnaam en wachtwoord zijn verplicht' },
      { status: 400 }
    );
  }

  const result = await db(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = @u',
    { u: { type: sql.NVarChar(50), value: username } }
  );

  const user = result.recordset[0] as User | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json(
      { error: 'Gebruikersnaam of wachtwoord onjuist' },
      { status: 401 }
    );
  }

  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  const response = NextResponse.json({ ok: true, username: user.username, role: user.role });
  response.cookies.set(tokenCookieOptions(token));
  return response;
}
```

- [ ] **Step 6.2: Write `src/app/api/auth/logout/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { clearCookieOptions } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearCookieOptions());
  return response;
}
```

- [ ] **Step 6.3: Write `src/app/api/auth/me/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Ongeldig token' }, { status: 401 });

  const result = await db(
    'SELECT id, username, email, role, starting_balance, max_drawdown FROM users WHERE id = @id',
    { id: { type: sql.Int, value: payload.userId } }
  );

  const user = result.recordset[0] as Partial<User> | undefined;
  if (!user) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  return NextResponse.json(user);
}
```

- [ ] **Step 6.4: Manual test login (after login page exists — do this after Task 7)**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"remco","password":"YourPassword"}' \
  -c cookies.txt -b cookies.txt
```

Expected: `{"ok":true,"username":"remco","role":"admin"}`

- [ ] **Step 6.5: Commit**

```bash
git add src/app/api/auth/
git commit -m "feat: add login, logout, and me API routes"
```

---

## Task 7: App Layouts, Root Page, Sidebar, Topbar

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/(dashboard)/layout.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Topbar.tsx`

- [ ] **Step 7.1: Write `src/app/layout.tsx`**

```typescript
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TradingJournal',
  description: 'Persoonlijk trading journal dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7.2: Write `src/app/page.tsx`**

```typescript
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

- [ ] **Step 7.3: Write `src/app/(auth)/layout.tsx`**

```typescript
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex items-center justify-center bg-tj-bg px-4">
      {children}
    </div>
  );
}
```

- [ ] **Step 7.4: Write `src/components/Sidebar.tsx`**

```typescript
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
```

- [ ] **Step 7.5: Write `src/components/Topbar.tsx`**

```typescript
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
```

- [ ] **Step 7.6: Write `src/app/(dashboard)/layout.tsx`**

This is a Server Component — it reads the JWT cookie server-side to get user info.

```typescript
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db, sql } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import type { User } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) redirect('/login');

  const result = await db(
    'SELECT id, username, role, starting_balance, max_drawdown FROM users WHERE id = @id',
    { id: { type: sql.Int, value: payload.userId } }
  );
  const user = result.recordset[0] as Pick<User, 'id' | 'username' | 'role' | 'starting_balance' | 'max_drawdown'>;
  if (!user) redirect('/login');

  return (
    <div className="flex flex-col h-full">
      <Topbar username={user.username} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} startingBalance={user.starting_balance} />
        <main className="flex-1 overflow-y-auto p-6 bg-tj-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 7.7: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/app/(auth)/ src/app/(dashboard)/layout.tsx src/components/Sidebar.tsx src/components/Topbar.tsx
git commit -m "feat: add app layouts, sidebar, and topbar"
```

---

## Task 8: Login Page

**Files:**
- Create: `src/app/(auth)/login/page.tsx`

- [ ] **Step 8.1: Write `src/app/(auth)/login/page.tsx`**

```typescript
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
      router.push('/dashboard');
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? 'Inloggen mislukt');
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
              Gebruikersnaam
            </label>
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full bg-tj-bg border border-tj-border rounded-lg px-3 py-2.5 text-tj-text text-sm placeholder-tj-muted focus:outline-none focus:border-tj-teal focus:ring-1 focus:ring-tj-teal"
              placeholder="jouw gebruikersnaam"
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
      </div>
    </div>
  );
}
```

- [ ] **Step 8.2: Start dev server and test login page manually**

```bash
npm run dev
```

Open http://localhost:3000 → should redirect to /login.
Verify the login form renders with the Slate & Teal theme.
(Login will fail until the import script creates users in Task 15.)

- [ ] **Step 8.3: Commit**

```bash
git add src/app/(auth)/login/
git commit -m "feat: add login page"
```

---

## Task 9: Trades API Routes (CRUD)

**Files:**
- Create: `src/app/api/trades/route.ts`
- Create: `src/app/api/trades/[id]/route.ts`

- [ ] **Step 9.1: Write `src/app/api/trades/route.ts`** (GET list + POST create)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { calcTrade } from '@/lib/calculations';
import type { Trade } from '@/lib/types';

// Helper: get authenticated user id from request
function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  return payload?.userId ?? null;
}

// GET /api/trades
export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');   // 'Long' | 'Short' | null
  const symbol = searchParams.get('symbol'); // e.g. 'US500' | null
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
  const limit  = 25;
  const offset = (page - 1) * limit;

  let where = 'WHERE user_id = @userId';
  const params: Record<string, { type: sql.ISqlType; value: unknown }> = {
    userId: { type: sql.Int, value: userId },
  };

  if (type === 'Long' || type === 'Short') {
    where += ' AND trade_type = @type';
    params.type = { type: sql.NVarChar(5), value: type };
  }
  if (symbol) {
    where += ' AND symbol = @symbol';
    params.symbol = { type: sql.NVarChar(20), value: symbol };
  }

  const countResult = await db(
    `SELECT COUNT(*) as total FROM trades ${where}`,
    params
  );
  const total = countResult.recordset[0].total as number;

  const tradesResult = await db(
    `SELECT * FROM trades ${where}
     ORDER BY trade_date DESC, created_at DESC
     OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
    { ...params,
      offset: { type: sql.Int, value: offset },
      limit:  { type: sql.Int, value: limit  },
    }
  );

  return NextResponse.json({
    trades: tradesResult.recordset as Trade[],
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}

// POST /api/trades
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Partial<Trade> & {
    exit_price?: number;
    commission?: number;
  };

  // Required fields
  if (!body.trade_date || !body.symbol || !body.trade_type || !body.entry_price || !body.shares) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  // Auto-calculate if exit price is provided
  let calc = { totalPl: 0, rMultiple: null as number | null, percentGain: null as number | null,
               amountInvested: body.entry_price * body.shares, amountSold: 0 };

  if (body.exit_price) {
    calc = calcTrade(
      body.trade_type,
      body.entry_price,
      body.stop_loss ?? null,
      body.exit_price,
      body.shares,
      body.commission ?? null
    );
  }

  await db(
    `INSERT INTO trades
     (user_id, trade_date, symbol, trade_type, time_of_trade, strategy,
      entry_price, stop_loss, shares, exit_price,
      amount_invested, amount_sold, total_pl, percent_gain, r_multiple,
      commission, notes, screenshot_url, issue)
     VALUES
     (@userId, @trade_date, @symbol, @trade_type, @time_of_trade, @strategy,
      @entry_price, @stop_loss, @shares, @exit_price,
      @amount_invested, @amount_sold, @total_pl, @percent_gain, @r_multiple,
      @commission, @notes, @screenshot_url, @issue)`,
    {
      userId:          { type: sql.Int,          value: userId },
      trade_date:      { type: sql.Date,          value: body.trade_date },
      symbol:          { type: sql.NVarChar(20),  value: body.symbol },
      trade_type:      { type: sql.NVarChar(5),   value: body.trade_type },
      time_of_trade:   { type: sql.NVarChar(20),  value: body.time_of_trade  ?? null },
      strategy:        { type: sql.NVarChar(100), value: body.strategy       ?? null },
      entry_price:     { type: sql.Decimal(12,4), value: body.entry_price },
      stop_loss:       { type: sql.Decimal(12,4), value: body.stop_loss      ?? null },
      shares:          { type: sql.Int,           value: body.shares },
      exit_price:      { type: sql.Decimal(12,4), value: body.exit_price     ?? null },
      amount_invested: { type: sql.Decimal(12,2), value: calc.amountInvested },
      amount_sold:     { type: sql.Decimal(12,2), value: calc.amountSold },
      total_pl:        { type: sql.Decimal(12,2), value: body.exit_price ? calc.totalPl : null },
      percent_gain:    { type: sql.Decimal(10,6), value: calc.percentGain    ?? null },
      r_multiple:      { type: sql.Decimal(8,4),  value: calc.rMultiple      ?? null },
      commission:      { type: sql.Decimal(8,2),  value: body.commission     ?? null },
      notes:           { type: sql.NVarChar(sql.MAX), value: body.notes      ?? null },
      screenshot_url:  { type: sql.NVarChar(500), value: body.screenshot_url ?? null },
      issue:           { type: sql.NVarChar(sql.MAX), value: body.issue      ?? null },
    }
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] **Step 9.2: Write `src/app/api/trades/[id]/route.ts`** (PUT update + DELETE)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { calcTrade } from '@/lib/calculations';
import type { Trade } from '@/lib/types';

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  return payload?.userId ?? null;
}

// Verify trade belongs to user
async function ownsTrade(tradeId: number, userId: number): Promise<boolean> {
  const r = await db(
    'SELECT id FROM trades WHERE id = @id AND user_id = @userId',
    { id: { type: sql.Int, value: tradeId }, userId: { type: sql.Int, value: userId } }
  );
  return r.recordset.length > 0;
}

// PUT /api/trades/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const { id } = await params;
  const tradeId = parseInt(id);
  if (isNaN(tradeId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 });
  if (!(await ownsTrade(tradeId, userId)))
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

  const body = await req.json().catch(() => ({})) as Partial<Trade>;

  if (!body.trade_date || !body.symbol || !body.trade_type || !body.entry_price || !body.shares) {
    return NextResponse.json({ error: 'Verplichte velden ontbreken' }, { status: 400 });
  }

  let calc = { totalPl: 0, rMultiple: null as number | null, percentGain: null as number | null,
               amountInvested: body.entry_price * body.shares, amountSold: 0 };

  if (body.exit_price) {
    calc = calcTrade(
      body.trade_type,
      body.entry_price,
      body.stop_loss ?? null,
      body.exit_price,
      body.shares,
      body.commission ?? null
    );
  }

  await db(
    `UPDATE trades SET
       trade_date      = @trade_date,
       symbol          = @symbol,
       trade_type      = @trade_type,
       time_of_trade   = @time_of_trade,
       strategy        = @strategy,
       entry_price     = @entry_price,
       stop_loss       = @stop_loss,
       shares          = @shares,
       exit_price      = @exit_price,
       amount_invested = @amount_invested,
       amount_sold     = @amount_sold,
       total_pl        = @total_pl,
       percent_gain    = @percent_gain,
       r_multiple      = @r_multiple,
       commission      = @commission,
       notes           = @notes,
       screenshot_url  = @screenshot_url,
       issue           = @issue,
       updated_at      = GETDATE()
     WHERE id = @id AND user_id = @userId`,
    {
      id:              { type: sql.Int,           value: tradeId },
      userId:          { type: sql.Int,           value: userId },
      trade_date:      { type: sql.Date,          value: body.trade_date },
      symbol:          { type: sql.NVarChar(20),  value: body.symbol },
      trade_type:      { type: sql.NVarChar(5),   value: body.trade_type },
      time_of_trade:   { type: sql.NVarChar(20),  value: body.time_of_trade  ?? null },
      strategy:        { type: sql.NVarChar(100), value: body.strategy       ?? null },
      entry_price:     { type: sql.Decimal(12,4), value: body.entry_price },
      stop_loss:       { type: sql.Decimal(12,4), value: body.stop_loss      ?? null },
      shares:          { type: sql.Int,           value: body.shares },
      exit_price:      { type: sql.Decimal(12,4), value: body.exit_price     ?? null },
      amount_invested: { type: sql.Decimal(12,2), value: calc.amountInvested },
      amount_sold:     { type: sql.Decimal(12,2), value: calc.amountSold },
      total_pl:        { type: sql.Decimal(12,2), value: body.exit_price ? calc.totalPl : null },
      percent_gain:    { type: sql.Decimal(10,6), value: calc.percentGain    ?? null },
      r_multiple:      { type: sql.Decimal(8,4),  value: calc.rMultiple      ?? null },
      commission:      { type: sql.Decimal(8,2),  value: body.commission     ?? null },
      notes:           { type: sql.NVarChar(sql.MAX), value: body.notes      ?? null },
      screenshot_url:  { type: sql.NVarChar(500), value: body.screenshot_url ?? null },
      issue:           { type: sql.NVarChar(sql.MAX), value: body.issue      ?? null },
    }
  );

  return NextResponse.json({ ok: true });
}

// DELETE /api/trades/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const { id } = await params;
  const tradeId = parseInt(id);
  if (isNaN(tradeId)) return NextResponse.json({ error: 'Ongeldig ID' }, { status: 400 });
  if (!(await ownsTrade(tradeId, userId)))
    return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 });

  await db(
    'DELETE FROM trades WHERE id = @id AND user_id = @userId',
    { id: { type: sql.Int, value: tradeId }, userId: { type: sql.Int, value: userId } }
  );

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 9.3: Commit**

```bash
git add src/app/api/trades/
git commit -m "feat: add trades CRUD API routes (GET, POST, PUT, DELETE)"
```

---

## Task 10: Dashboard Stats API

**Files:**
- Create: `src/app/api/dashboard/stats/route.ts`

- [ ] **Step 10.1: Write `src/app/api/dashboard/stats/route.ts`**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db, sql } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { User, DashboardStats } from '@/lib/types';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const userId = payload.userId;

  // User info (for startingBalance and maxDrawdown)
  const userResult = await db(
    'SELECT starting_balance, max_drawdown FROM users WHERE id = @id',
    { id: { type: sql.Int, value: userId } }
  );
  const user = userResult.recordset[0] as Pick<User, 'starting_balance' | 'max_drawdown'>;
  if (!user) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  // Aggregate stats
  const aggResult = await db(
    `SELECT
       COUNT(*)                                                     AS trade_count,
       SUM(CASE WHEN total_pl >= 0 THEN 1 ELSE 0 END)              AS win_count,
       SUM(CASE WHEN total_pl <  0 THEN 1 ELSE 0 END)              AS loss_count,
       ISNULL(SUM(total_pl), 0)                                     AS total_pl,
       ISNULL(AVG(NULLIF(r_multiple, NULL)), 0)                     AS avg_r
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL`,
    { userId: { type: sql.Int, value: userId } }
  );
  const agg = aggResult.recordset[0] as {
    trade_count: number; win_count: number; loss_count: number;
    total_pl: number; avg_r: number;
  };

  // Monthly P&L
  const monthlyResult = await db(
    `SELECT
       FORMAT(trade_date, 'MMM yy', 'nl-NL') AS month,
       SUM(total_pl)                          AS pl,
       YEAR(trade_date)                       AS yr,
       MONTH(trade_date)                      AS mo
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL
     GROUP BY FORMAT(trade_date, 'MMM yy', 'nl-NL'), YEAR(trade_date), MONTH(trade_date)
     ORDER BY YEAR(trade_date), MONTH(trade_date)`,
    { userId: { type: sql.Int, value: userId } }
  );
  const monthlyPnl = (monthlyResult.recordset as { month: string; pl: number }[])
    .map(r => ({ month: r.month, pl: Number(r.pl) }));

  // Equity history (cumulative)
  const histResult = await db(
    `SELECT trade_date, total_pl
     FROM trades
     WHERE user_id = @userId AND total_pl IS NOT NULL
     ORDER BY trade_date, created_at`,
    { userId: { type: sql.Int, value: userId } }
  );
  const histRows = histResult.recordset as { trade_date: Date; total_pl: number }[];

  let runningEquity = Number(user.starting_balance);
  const equityHistory: { date: string; equity: number }[] = [
    { date: histRows[0]?.trade_date.toISOString().split('T')[0] ?? new Date().toISOString().split('T')[0], equity: runningEquity },
  ];
  for (const row of histRows) {
    runningEquity = Math.round((runningEquity + Number(row.total_pl)) * 100) / 100;
    equityHistory.push({
      date: row.trade_date.toISOString().split('T')[0],
      equity: runningEquity,
    });
  }

  const startingBalance = Number(user.starting_balance);
  const maxDrawdown     = Number(user.max_drawdown);
  const totalPl         = Number(agg.total_pl);
  const currentEquity   = Math.round((startingBalance + totalPl) * 100) / 100;
  const drawdown        = Math.max(0, Math.round((startingBalance - currentEquity) * 100) / 100);
  const winRate         = agg.trade_count > 0 ? agg.win_count / agg.trade_count : 0;

  const stats: DashboardStats = {
    currentEquity,
    startingBalance,
    maxDrawdown,
    totalPl,
    tradeCount:   Number(agg.trade_count),
    winCount:     Number(agg.win_count),
    lossCount:    Number(agg.loss_count),
    winRate,
    avgRMultiple: Math.round(Number(agg.avg_r) * 1000) / 1000,
    drawdown,
    monthlyPnl,
    equityHistory,
  };

  return NextResponse.json(stats);
}
```

- [ ] **Step 10.2: Commit**

```bash
git add src/app/api/dashboard/
git commit -m "feat: add dashboard stats API with equity history and monthly P&L"
```

---

## Phase 2 Complete

- ✓ Login, logout, me API routes
- ✓ Login page (Slate & Teal theme)
- ✓ Root layout, auth layout, dashboard layout
- ✓ Sidebar with active-state highlighting and admin nav
- ✓ Topbar with logout
- ✓ Trades CRUD API (GET with pagination/filters, POST, PUT, DELETE)
- ✓ Dashboard stats API (equity history, monthly P&L, win rate, drawdown)

**Continue with:** `2026-05-20-trading-journal-phase3.md` (Dashboard UI components + page, Trade log + form)
