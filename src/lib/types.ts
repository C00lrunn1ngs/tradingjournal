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
