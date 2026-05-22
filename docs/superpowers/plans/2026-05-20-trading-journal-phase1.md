# Trading Journal Dashboard — Implementation Plan: Phase 1
# Project Setup · Database · Auth · Middleware

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Initialize the Next.js 15 project, set up MSSQL tables, build JWT auth utilities, and protect all routes via middleware.

**Architecture:** Next.js 15 App Router, TypeScript, Tailwind CSS with custom Slate & Teal palette. MSSQL via `mssql` connection pool singleton. JWT stored in httpOnly cookie. Auth validated in both middleware (page redirects) and API route handlers (JSON 401).

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, mssql, bcryptjs, jsonwebtoken, Jest + ts-jest

---

## File Map (Phase 1)

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`
- Create: `jest.config.ts`
- Create: `scripts/migrate.sql`
- Create: `scripts/run-migrate.ts`
- Create: `src/lib/db.ts`
- Create: `src/lib/types.ts`
- Create: `src/lib/auth.ts`
- Create: `src/lib/calculations.ts`
- Create: `src/__tests__/auth.test.ts`
- Create: `src/__tests__/calculations.test.ts`
- Create: `src/middleware.ts`

---

## Task 1: Project Initialization

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `src/app/globals.css`
- Create: `jest.config.ts`

- [ ] **Step 1.1: Install dependencies**

Run in `c:\Projecten\TradingJournal`:

```bash
npm init -y
npm install next@15 react@19 react-dom@19
npm install mssql bcryptjs jsonwebtoken recharts xlsx
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D @types/mssql @types/bcryptjs @types/jsonwebtoken
npm install -D tailwindcss postcss autoprefixer
npm install -D jest ts-jest @types/jest next-jest
npm install tsx --save-dev
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 1.2: Write `package.json` scripts section**

Open `package.json` and replace the `scripts` block with:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test": "jest",
    "test:watch": "jest --watch",
    "migrate": "npx tsx scripts/run-migrate.ts",
    "import-excel": "npx tsx scripts/import-excel.ts"
  }
}
```

- [ ] **Step 1.3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 1.4: Write `next.config.ts`**

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 1.5: Write `tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'tj-bg':     '#080f18',
        'tj-card':   '#0b1520',
        'tj-hover':  '#0f1e2e',
        'tj-border': '#1a2e40',
        'tj-active': '#0f2535',
        'tj-text':   '#e2f0f7',
        'tj-text2':  '#9ab8c8',
        'tj-muted':  '#4a6a7a',
        'tj-muted2': '#3a5a6a',
        'tj-teal':   '#00d4aa',
        'tj-blue':   '#7eb8d4',
        'tj-red':    '#ff6b6b',
        'tj-yellow': '#ffd166',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 1.6: Write `postcss.config.mjs`**

```javascript
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
export default config;
```

- [ ] **Step 1.7: Create `src/app/globals.css`**

First create the directory: `mkdir -p src/app`

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-tj-bg text-tj-text antialiased;
  }
}
```

- [ ] **Step 1.8: Write `jest.config.ts`**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { module: 'commonjs' } }],
  },
};

export default config;
```

- [ ] **Step 1.9: Verify Next.js starts**

```bash
npm run dev
```

Expected: server starts on http://localhost:3000 (404 is fine — no pages yet).
Stop with Ctrl+C.

- [ ] **Step 1.10: Commit**

```bash
git init
git add package.json tsconfig.json next.config.ts tailwind.config.ts postcss.config.mjs jest.config.ts src/app/globals.css
git commit -m "feat: initialize Next.js 15 project with Tailwind and Jest"
```

---

## Task 2: Database Migration

**Files:**
- Create: `scripts/migrate.sql`
- Create: `scripts/run-migrate.ts`

- [ ] **Step 2.1: Write `scripts/migrate.sql`**

```sql
-- Users table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
  id               INT IDENTITY(1,1) PRIMARY KEY,
  username         NVARCHAR(50)   NOT NULL,
  email            NVARCHAR(100)  NOT NULL,
  password_hash    NVARCHAR(255)  NOT NULL,
  role             NVARCHAR(10)   NOT NULL DEFAULT 'user',
  starting_balance DECIMAL(12,2)  NOT NULL DEFAULT 45000.00,
  max_drawdown     DECIMAL(12,2)  NOT NULL DEFAULT 2000.00,
  created_at       DATETIME2      NOT NULL DEFAULT GETDATE(),
  CONSTRAINT uq_users_username UNIQUE (username),
  CONSTRAINT uq_users_email    UNIQUE (email)
);

-- Trades table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'trades')
CREATE TABLE trades (
  id             INT IDENTITY(1,1) PRIMARY KEY,
  user_id        INT            NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trade_date     DATE           NOT NULL,
  symbol         NVARCHAR(20)   NOT NULL,
  trade_type     NVARCHAR(5)    NOT NULL,
  time_of_trade  NVARCHAR(20)   NULL,
  strategy       NVARCHAR(100)  NULL,
  entry_price    DECIMAL(12,4)  NOT NULL,
  stop_loss      DECIMAL(12,4)  NULL,
  shares         INT            NOT NULL DEFAULT 1,
  exit_price     DECIMAL(12,4)  NULL,
  amount_invested DECIMAL(12,2) NULL,
  amount_sold    DECIMAL(12,2)  NULL,
  total_pl       DECIMAL(12,2)  NULL,
  percent_gain   DECIMAL(10,6)  NULL,
  r_multiple     DECIMAL(8,4)   NULL,
  commission     DECIMAL(8,2)   NULL,
  notes          NVARCHAR(MAX)  NULL,
  screenshot_url NVARCHAR(500)  NULL,
  issue          NVARCHAR(MAX)  NULL,
  created_at     DATETIME2      NOT NULL DEFAULT GETDATE(),
  updated_at     DATETIME2      NOT NULL DEFAULT GETDATE()
);

-- Sessions table (for logout invalidation)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'sessions')
CREATE TABLE sessions (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  user_id     INT           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  NVARCHAR(64)  NOT NULL,
  expires_at  DATETIME2     NOT NULL,
  created_at  DATETIME2     NOT NULL DEFAULT GETDATE()
);

PRINT 'Migration complete.';
```

- [ ] **Step 2.2: Write `scripts/run-migrate.ts`**

```typescript
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT ?? '1433'),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
};

async function migrate() {
  const pool = await new sql.ConnectionPool(config).connect();
  const sqlText = fs.readFileSync(path.join(process.cwd(), 'scripts/migrate.sql'), 'utf8');
  await pool.request().query(sqlText);
  console.log('✓ Migration complete');
  await pool.close();
}

migrate().catch(err => { console.error('Migration failed:', err); process.exit(1); });
```

- [ ] **Step 2.3: Install dotenv for scripts**

```bash
npm install dotenv
```

- [ ] **Step 2.4: Run migration**

```bash
npm run migrate
```

Expected output:
```
✓ Migration complete
```

- [ ] **Step 2.5: Verify tables exist**

Connect to SQL Server and run:
```sql
SELECT name FROM sys.tables WHERE name IN ('users','trades','sessions');
```
Expected: 3 rows returned.

- [ ] **Step 2.6: Commit**

```bash
git add scripts/migrate.sql scripts/run-migrate.ts
git commit -m "feat: add MSSQL migration for users, trades, sessions"
```

---

## Task 3: Database Connection Pool

**Files:**
- Create: `src/lib/db.ts`
- Create: `src/lib/types.ts`

- [ ] **Step 3.1: Write `src/lib/types.ts`**

```typescript
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  starting_balance: number;
  max_drawdown: number;
  created_at: Date;
}

export interface Trade {
  id: number;
  user_id: number;
  trade_date: string;          // ISO date string YYYY-MM-DD
  symbol: string;
  trade_type: 'Long' | 'Short';
  time_of_trade: string | null;
  strategy: string | null;
  entry_price: number;
  stop_loss: number | null;
  shares: number;
  exit_price: number | null;
  amount_invested: number | null;
  amount_sold: number | null;
  total_pl: number | null;
  percent_gain: number | null;
  r_multiple: number | null;
  commission: number | null;
  notes: string | null;
  screenshot_url: string | null;
  issue: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'user';
}

export interface DashboardStats {
  currentEquity: number;
  startingBalance: number;
  maxDrawdown: number;
  totalPl: number;
  tradeCount: number;
  winCount: number;
  lossCount: number;
  winRate: number;
  avgRMultiple: number;
  drawdown: number;
  monthlyPnl: { month: string; pl: number }[];
  equityHistory: { date: string; equity: number }[];
}

export interface TradeCalculations {
  totalPl: number;
  rMultiple: number | null;
  percentGain: number | null;
  amountInvested: number;
  amountSold: number;
}
```

- [ ] **Step 3.2: Write `src/lib/db.ts`**

```typescript
import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT ?? '1433'),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
  },
};

// Global singleton to survive Next.js hot reload
declare global {
  // eslint-disable-next-line no-var
  var _sqlPool: sql.ConnectionPool | undefined;
}

async function getPool(): Promise<sql.ConnectionPool> {
  if (!global._sqlPool || !global._sqlPool.connected) {
    global._sqlPool = await new sql.ConnectionPool(config).connect();
  }
  return global._sqlPool;
}

export async function db(
  queryStr: string,
  params?: Record<string, { type: sql.ISqlType; value: unknown }>
): Promise<sql.IResult<unknown>> {
  const pool = await getPool();
  const req = pool.request();
  if (params) {
    for (const [key, { type, value }] of Object.entries(params)) {
      req.input(key, type, value);
    }
  }
  return req.query(queryStr);
}

export { sql };
```

**Usage pattern** (used in every API route):
```typescript
import { db, sql } from '@/lib/db';

const result = await db(
  'SELECT * FROM users WHERE username = @username',
  { username: { type: sql.NVarChar(50), value: 'remco' } }
);
const users = result.recordset;
```

- [ ] **Step 3.3: Commit**

```bash
git add src/lib/db.ts src/lib/types.ts
git commit -m "feat: add MSSQL connection pool and TypeScript types"
```

---

## Task 4: Auth Library and Calculations (TDD)

**Files:**
- Create: `src/lib/auth.ts`
- Create: `src/lib/calculations.ts`
- Create: `src/__tests__/auth.test.ts`
- Create: `src/__tests__/calculations.test.ts`

- [ ] **Step 4.1: Write failing tests for auth — `src/__tests__/auth.test.ts`**

```typescript
import { signToken, verifyToken } from '@/lib/auth';

describe('signToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jest-only';
  });

  it('returns a non-empty string', () => {
    const token = signToken({ userId: 1, username: 'remco', role: 'admin' });
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('contains three dot-separated parts (JWT format)', () => {
    const token = signToken({ userId: 1, username: 'remco', role: 'admin' });
    expect(token.split('.').length).toBe(3);
  });
});

describe('verifyToken', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-for-jest-only';
  });

  it('returns payload for a valid token', () => {
    const token = signToken({ userId: 42, username: 'alice', role: 'user' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe(42);
    expect(payload?.username).toBe('alice');
    expect(payload?.role).toBe('user');
  });

  it('returns null for an invalid token', () => {
    const result = verifyToken('not.a.valid.token');
    expect(result).toBeNull();
  });

  it('returns null for a tampered token', () => {
    const token = signToken({ userId: 1, username: 'remco', role: 'admin' });
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(verifyToken(tampered)).toBeNull();
  });
});
```

- [ ] **Step 4.2: Run test — expect FAIL**

```bash
npm test -- --testPathPattern=auth
```

Expected: `Cannot find module '@/lib/auth'`

- [ ] **Step 4.3: Write `src/lib/auth.ts`**

```typescript
import jwt from 'jsonwebtoken';
import type { JwtPayload } from './types';

export type { JwtPayload };

const COOKIE_NAME = 'tj_token';
const EXPIRES_IN = '7d';

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not set');
  return secret;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload;
  } catch {
    return null;
  }
}

export function tokenCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  };
}

export function clearCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 0,
    path: '/',
  };
}

export { COOKIE_NAME };
```

- [ ] **Step 4.4: Run test — expect PASS**

```bash
npm test -- --testPathPattern=auth
```

Expected: `Tests: 5 passed`

- [ ] **Step 4.5: Write failing tests for calculations — `src/__tests__/calculations.test.ts`**

```typescript
import { calcTrade } from '@/lib/calculations';

describe('calcTrade — Long', () => {
  it('calculates profit correctly', () => {
    const r = calcTrade('Long', 100, 90, 110, 10, null);
    // (110 - 100) * 10 = 100
    expect(r.totalPl).toBeCloseTo(100, 2);
  });

  it('calculates loss correctly', () => {
    const r = calcTrade('Long', 100, 90, 95, 10, null);
    // (95 - 100) * 10 = -50
    expect(r.totalPl).toBeCloseTo(-50, 2);
  });

  it('calculates r_multiple correctly', () => {
    const r = calcTrade('Long', 100, 90, 110, 10, null);
    // totalPl=100, risk = |100-90|*10 = 100 → rMult = 100/100 = 1
    expect(r.rMultiple).toBeCloseTo(1, 4);
  });

  it('returns null rMultiple when no stop loss', () => {
    const r = calcTrade('Long', 100, null, 110, 10, null);
    expect(r.rMultiple).toBeNull();
  });

  it('subtracts commission from totalPl', () => {
    const r = calcTrade('Long', 100, 90, 110, 10, 5);
    expect(r.totalPl).toBeCloseTo(95, 2);
  });
});

describe('calcTrade — Short', () => {
  it('calculates profit correctly', () => {
    const r = calcTrade('Short', 100, 110, 90, 10, null);
    // (100 - 90) * 10 = 100
    expect(r.totalPl).toBeCloseTo(100, 2);
  });

  it('calculates loss correctly', () => {
    const r = calcTrade('Short', 100, 110, 105, 10, null);
    // (100 - 105) * 10 = -50
    expect(r.totalPl).toBeCloseTo(-50, 2);
  });
});

describe('calcTrade — amounts', () => {
  it('calculates amountInvested as entry * shares', () => {
    const r = calcTrade('Long', 6896.3, 6891, 6899.14, 1, null);
    expect(r.amountInvested).toBeCloseTo(6896.3, 2);
  });

  it('calculates amountSold as exit * shares', () => {
    const r = calcTrade('Long', 6896.3, 6891, 6899.14, 1, null);
    expect(r.amountSold).toBeCloseTo(6899.14, 2);
  });
});
```

- [ ] **Step 4.6: Run test — expect FAIL**

```bash
npm test -- --testPathPattern=calculations
```

Expected: `Cannot find module '@/lib/calculations'`

- [ ] **Step 4.7: Write `src/lib/calculations.ts`**

```typescript
import type { TradeCalculations } from './types';

export function calcTrade(
  tradeType: 'Long' | 'Short',
  entryPrice: number,
  stopLoss: number | null,
  exitPrice: number,
  shares: number,
  commission: number | null
): TradeCalculations {
  const amountInvested = round2(entryPrice * shares);
  const amountSold = round2(exitPrice * shares);

  const rawPl =
    tradeType === 'Long'
      ? (exitPrice - entryPrice) * shares
      : (entryPrice - exitPrice) * shares;

  const totalPl = round2(rawPl - (commission ?? 0));

  const rMultiple =
    stopLoss != null
      ? round4(totalPl / (Math.abs(entryPrice - stopLoss) * shares))
      : null;

  const percentGain =
    amountInvested !== 0 ? round6(totalPl / amountInvested) : null;

  return { totalPl, rMultiple, percentGain, amountInvested, amountSold };
}

function round2(n: number) { return Math.round(n * 100) / 100; }
function round4(n: number) { return Math.round(n * 10000) / 10000; }
function round6(n: number) { return Math.round(n * 1000000) / 1000000; }
```

- [ ] **Step 4.8: Run all tests — expect PASS**

```bash
npm test
```

Expected: `Tests: 12 passed, 0 failed`

- [ ] **Step 4.9: Commit**

```bash
git add src/lib/auth.ts src/lib/calculations.ts src/lib/types.ts src/__tests__/
git commit -m "feat: add auth utilities and trade calculations with tests (TDD)"
```

---

## Task 5: Next.js Middleware (Auth Redirect)

**Files:**
- Create: `src/middleware.ts`

- [ ] **Step 5.1: Write `src/middleware.ts`**

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAME } from './lib/auth';

const PUBLIC_PAGE_PATHS = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow auth API routes without a token
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value ?? null;
  const user = token ? verifyToken(token) : null;

  // --- API routes: return 401 JSON ---
  if (pathname.startsWith('/api/')) {
    if (!user) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }
    if (pathname.startsWith('/api/admin') && user.role !== 'admin') {
      return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
    }
    return NextResponse.next();
  }

  // --- Page routes: redirect to /login ---
  if (PUBLIC_PAGE_PATHS.some(p => pathname.startsWith(p))) {
    // Already on a public page: redirect to dashboard if already logged in
    if (user) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Admin-only pages
  if (pathname.startsWith('/admin') && user.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 5.2: Verify middleware compiles**

```bash
npm run build 2>&1 | head -20
```

Expected: no TypeScript errors on the middleware file (build may fail on missing pages — that's expected at this stage).

- [ ] **Step 5.3: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: add Next.js middleware for auth redirect and API protection"
```

---

## Phase 1 Complete

All infrastructure is in place:
- ✓ Next.js 15 project initialized with Tailwind and Jest
- ✓ MSSQL tables created (users, trades, sessions)
- ✓ DB connection pool singleton ready
- ✓ TypeScript types defined
- ✓ Auth utilities tested and passing (12 tests)
- ✓ Trade calculation utilities tested and passing
- ✓ Middleware protects all pages and API routes

**Continue with:** `2026-05-20-trading-journal-phase2.md` (Auth API, Login page, Layouts, Trades API)
