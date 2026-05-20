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
