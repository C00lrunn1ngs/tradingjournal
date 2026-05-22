# Trading Journal Dashboard — Design Spec
*Datum: 2026-05-19*

## Overzicht

Een beveiligd, multi-user trading journal dashboard gebouwd met Next.js 15 (App Router), MSSQL en JWT-authenticatie. Het dashboard biedt inzicht in handelsresultaten, bewaakt de drawdown-limiet en biedt volledige CRUD voor trades.

**Randvoorwaarden:**
- Startkapitaal: €45.000
- Max drawdown: €2.000
- Gebruikers: 2–5, elk ziet alleen eigen trades
- 22 bestaande trades (uit Excel) worden geïmporteerd naar de eerste admin-gebruiker
- Stack: Node.js 24, Next.js 15, MSSQL (server: CLAUDE, db: TradingJournal)

---

## 1. Architectuur

**Stack:**
- **Next.js 15** (App Router) — frontend + API routes in één codebase
- **mssql** — Node.js driver voor SQL Server
- **bcryptjs** — wachtwoord hashing
- **jsonwebtoken** — JWT tokens (secret uit `.env`)
- **recharts** — grafieken (equity curve, maandelijkse P&L)
- **Tailwind CSS** — styling

**Auth-strategie:**
- JWT opgeslagen in een httpOnly cookie (niet leesbaar via JavaScript)
- Elke API route valideert het cookie via een centrale `auth`-middleware
- Alle trade-queries filteren op `user_id` uit het token
- Admin-routes controleren aanvullend op `role === 'admin'`

**Projectstructuur:**
```
TradingJournal/
├── .env
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # loginpagina
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/        # hoofddashboard
│   │   │   ├── trades/           # trade log + CRUD
│   │   │   │   ├── new/          # nieuwe trade
│   │   │   │   └── [id]/edit/    # trade bewerken
│   │   │   ├── stats/            # uitgebreide statistieken
│   │   │   └── admin/users/      # gebruikersbeheer (admin)
│   │   └── api/
│   │       ├── auth/             # login, logout, me
│   │       ├── trades/           # CRUD
│   │       ├── dashboard/stats/  # dashboard statistieken
│   │       └── admin/users/      # gebruikersbeheer
│   ├── lib/
│   │   ├── db.ts                 # MSSQL connectie (pool)
│   │   └── auth.ts               # JWT helpers + middleware
│   └── components/               # herbruikbare UI-componenten
├── scripts/
│   └── import-excel.ts           # eenmalige Excel-import
└── package.json
```

---

## 2. Database Schema

### Tabel: `users`
```sql
CREATE TABLE users (
  id               INT IDENTITY(1,1) PRIMARY KEY,
  username         NVARCHAR(50)  NOT NULL UNIQUE,
  email            NVARCHAR(100) NOT NULL UNIQUE,
  password_hash    NVARCHAR(255) NOT NULL,
  role             NVARCHAR(10)  NOT NULL DEFAULT 'user',  -- 'admin' | 'user'
  starting_balance DECIMAL(12,2) NOT NULL DEFAULT 45000.00,
  max_drawdown     DECIMAL(12,2) NOT NULL DEFAULT 2000.00,
  created_at       DATETIME2     NOT NULL DEFAULT GETDATE()
);
```

### Tabel: `trades`
```sql
CREATE TABLE trades (
  id               INT IDENTITY(1,1) PRIMARY KEY,
  user_id          INT           NOT NULL REFERENCES users(id),
  trade_date       DATE          NOT NULL,
  symbol           NVARCHAR(20)  NOT NULL,
  trade_type       NVARCHAR(5)   NOT NULL,  -- 'Long' | 'Short'
  time_of_trade    NVARCHAR(20),            -- 'Morning' | 'Mid Day' | 'Afternoon'
  strategy         NVARCHAR(100),
  entry_price      DECIMAL(12,4) NOT NULL,
  stop_loss        DECIMAL(12,4),
  shares           INT           NOT NULL DEFAULT 1,
  exit_price       DECIMAL(12,4),
  amount_invested  DECIMAL(12,2),
  amount_sold      DECIMAL(12,2),
  total_pl         DECIMAL(12,2),           -- gerealiseerde P&L
  percent_gain     DECIMAL(10,6),
  r_multiple       DECIMAL(8,4),            -- R-units
  commission       DECIMAL(8,2),
  notes            NVARCHAR(MAX),
  screenshot_url   NVARCHAR(500),
  issue            NVARCHAR(MAX),
  created_at       DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at       DATETIME2     NOT NULL DEFAULT GETDATE()
);
```

### Tabel: `sessions`
```sql
CREATE TABLE sessions (
  id          INT IDENTITY(1,1) PRIMARY KEY,
  user_id     INT          NOT NULL REFERENCES users(id),
  token_hash  NVARCHAR(64) NOT NULL,
  expires_at  DATETIME2    NOT NULL
);
```

---

## 3. Pagina's & API Routes

### Pagina's
| Route | Beschrijving | Toegang |
|---|---|---|
| `/login` | Inlogformulier | Publiek |
| `/dashboard` | Hoofddashboard | Ingelogd |
| `/trades` | Volledige trade log | Ingelogd |
| `/trades/new` | Nieuwe trade invoeren | Ingelogd |
| `/trades/[id]/edit` | Trade bewerken | Ingelogd (eigenaar) |
| `/stats` | Uitgebreide statistieken | Ingelogd |
| `/admin/users` | Gebruikersbeheer | Alleen admin |

### API Routes
| Endpoint | Methode | Functie |
|---|---|---|
| `/api/auth/login` | POST | Inloggen, JWT httpOnly cookie zetten |
| `/api/auth/logout` | POST | Cookie wissen |
| `/api/auth/me` | GET | Ingelogde gebruiker ophalen |
| `/api/trades` | GET | Trades van ingelogde gebruiker (paginatie + filters) |
| `/api/trades` | POST | Nieuwe trade opslaan |
| `/api/trades/[id]` | PUT | Trade bijwerken |
| `/api/trades/[id]` | DELETE | Trade verwijderen |
| `/api/dashboard/stats` | GET | Statistieken voor dashboard |
| `/api/admin/users` | GET | Alle gebruikers (admin) |
| `/api/admin/users` | POST | Nieuwe gebruiker aanmaken (admin) |
| `/api/admin/users/[id]` | DELETE | Gebruiker verwijderen (admin) |

---

## 4. Dashboard Componenten & Gedrag

### Visueel ontwerp
- **Layout:** Sidebar-navigatie links, brede content rechts, topbar met gebruikersnaam + uitlogknop
- **Kleurschema:** Slate & Teal — achtergrond `#080f18`, cards `#0b1520`, accenten `#00d4aa` (teal), verlies `#ff6b6b`, winst `#00d4aa`
- **Typografie:** Inter (labels/tekst), JetBrains Mono (getallen/waardes)

### Equity Curve
- Lijndiagram met cumulatief saldo over tijd, beginpunt €45.000
- Gebied **boven** de €45.000-lijn: groene fill
- Gebied **onder** de €45.000-lijn: rode fill
- Rode stippellijn bij −€2.000 (max drawdown grens)
- Vloeiende Catmull-Rom spline (geen rechte hoeken)

### Drawdown Meter
- Berekening: `max(0, startkapitaal − huidig saldo)` — toont de huidige daling ten opzichte van het startkapitaal
- Progressiebalk met drie stadia:
  - **Veilig** (groen): 0%–50% van €2.000
  - **Waarschuwing** (geel): 50%–80%
  - **Gevaar** (rood): 80%–100%
- Bij overschrijding van €2.000: rode banner bovenaan het dashboard

### Statistieken kaarten (dashboard)
- Huidig saldo, Totaal P&L, Win rate (%), Gem. R-multiple, Huidige drawdown

### Maandelijkse P&L
- Balkengrafiek per maand, groen voor positieve maanden, rood voor negatieve

### Trade Log Tabel
- Kolommen: Datum, Symbool, Type (Long/Short badge), Entry, P&L, R-multiple, Acties
- Sorteerbaar op alle kolommen
- Filterbaar: Long/Short, symbool (dropdown), datumbereik
- Paginatie: 25 trades per pagina
- Per rij: bewerkknop (✏) en verwijderknop (🗑) met bevestigingsdialoog

### Trade Formulier (nieuw & bewerken)
- Velden: datum, symbool, type, tijdstip, entry, stop loss, shares, exitprijs, commissie, notes, screenshot URL, issue
- **Auto-berekend** (client-side preview + server-side opgeslagen):
  - Long:  `total_pl = (exit_price − entry_price) × shares`
  - Short: `total_pl = (entry_price − exit_price) × shares`
  - `r_multiple = total_pl / (|entry_price − stop_loss| × shares)`
  - `percent_gain = total_pl / amount_invested`
- Validatie: datum verplicht, entry > 0, stop loss verplicht, shares ≥ 1

### Login Pagina
- Username + wachtwoord formulier, zelfde Slate & Teal thema
- Foutmelding bij mislukte login: "Gebruikersnaam of wachtwoord onjuist" (geen hint welk veld fout is)
- Redirect naar `/dashboard` na succesvolle login

### Gebruikersbeheer (admin)
- Tabel van alle gebruikers met username, email, rol, aanmaakdatum
- Admin kan nieuwe gebruikers aanmaken met tijdelijk wachtwoord
- Admin kan gebruikers verwijderen (niet zichzelf)

---

## 5. Excel Import Script

Eenmalig uit te voeren script (`scripts/import-excel.ts`):
1. Leest `TradeAcademy Excel Logboek.xlsx`, sheet `TRADES`, rij 8 t/m einde
2. Maakt admin-gebruiker aan (username: `remco`, rol: `admin`, startkapitaal €45.000, max drawdown €2.000)
3. Importeert alle 22 trades gekoppeld aan `user_id = 1`
4. Slaat berekende velden op (total_pl, r_multiple, percent_gain) vanuit de Excel-waarden

---

## 6. Beveiliging

- Wachtwoorden gehasht met bcrypt (rounds: 12)
- JWT in httpOnly, Secure, SameSite=Strict cookie — niet toegankelijk via JavaScript
- API routes valideren token server-side bij elke request
- Trade-endpoints filteren altijd op `user_id` — gebruikers kunnen elkaars data niet benaderen
- Admin-endpoints controleren aanvullend `role === 'admin'`
- SQL-queries uitsluitend via geparametriseerde queries (geen string interpolatie)
