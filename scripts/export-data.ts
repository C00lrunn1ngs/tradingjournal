import 'dotenv/config';
import { db } from '../src/lib/db';
import * as fs from 'fs';

function sqlVal(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) return `'${val.toISOString().slice(0, 23).replace('T', ' ')}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function main() {
  const lines: string[] = [
    '-- Data export gegenereerd op ' + new Date().toISOString(),
    'SET NOCOUNT ON;',
    '',
  ];

  // Users
  const users = await db('SELECT * FROM users ORDER BY id');
  lines.push('-- ===== USERS =====');
  lines.push('SET IDENTITY_INSERT users ON;');
  for (const r of users.recordset as Record<string, unknown>[]) {
    lines.push(
      `INSERT INTO users (id, username, email, password_hash, role, starting_balance, max_drawdown, created_at) VALUES (${[
        r.id, r.username, r.email, r.password_hash, r.role,
        r.starting_balance, r.max_drawdown, r.created_at,
      ].map(sqlVal).join(', ')});`
    );
  }
  lines.push('SET IDENTITY_INSERT users OFF;');
  lines.push('');

  // Trades
  const trades = await db('SELECT * FROM trades ORDER BY id');
  lines.push('-- ===== TRADES =====');
  lines.push('SET IDENTITY_INSERT trades ON;');
  for (const r of trades.recordset as Record<string, unknown>[]) {
    lines.push(
      `INSERT INTO trades (id, user_id, trade_date, symbol, trade_type, time_of_trade, strategy, entry_price, stop_loss, shares, exit_price, amount_invested, amount_sold, total_pl, percent_gain, r_multiple, commission, notes, screenshot_url, issue, created_at, updated_at) VALUES (${[
        r.id, r.user_id, r.trade_date, r.symbol, r.trade_type,
        r.time_of_trade, r.strategy, r.entry_price, r.stop_loss, r.shares,
        r.exit_price, r.amount_invested, r.amount_sold, r.total_pl,
        r.percent_gain, r.r_multiple, r.commission, r.notes,
        r.screenshot_url, r.issue, r.created_at, r.updated_at,
      ].map(sqlVal).join(', ')});`
    );
  }
  lines.push('SET IDENTITY_INSERT trades OFF;');

  const output = 'scripts/data-import.sql';
  fs.writeFileSync(output, lines.join('\n'), 'utf8');
  console.log(`✓ Geëxporteerd: ${users.recordset.length} gebruikers, ${trades.recordset.length} trades → ${output}`);
  process.exit(0);
}

main().catch(e => { console.error('Export mislukt:', e); process.exit(1); });
