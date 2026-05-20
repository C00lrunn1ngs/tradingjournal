import * as XLSX from 'xlsx';
import sql from 'mssql';
import bcrypt from 'bcryptjs';
import path from 'path';
import 'dotenv/config';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  port: parseInt(process.env.DB_PORT ?? '1433'),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: { trustServerCertificate: process.env.DB_TRUST_CERT === 'true', enableArithAbort: true },
};

async function main() {
  const pool = await new sql.ConnectionPool(config).connect();
  console.log('✓ Connected to MSSQL');

  // 1. Create admin user
  const password = 'TraderAdmin2026!';
  const hash = await bcrypt.hash(password, 12);

  const existing = await pool.request()
    .input('username', sql.NVarChar(50), 'remco')
    .query('SELECT id FROM users WHERE username = @username');

  let userId: number;
  if (existing.recordset.length > 0) {
    userId = existing.recordset[0].id;
    console.log(`✓ User 'remco' already exists (id=${userId}), skipping creation`);
  } else {
    const userResult = await pool.request()
      .input('username',         sql.NVarChar(50),  'remco')
      .input('email',            sql.NVarChar(100), 'remco@denelzen.net')
      .input('password_hash',    sql.NVarChar(255), hash)
      .input('role',             sql.NVarChar(10),  'admin')
      .input('starting_balance', sql.Decimal(12,2), 45000.00)
      .input('max_drawdown',     sql.Decimal(12,2), 2000.00)
      .query(`INSERT INTO users (username, email, password_hash, role, starting_balance, max_drawdown)
              OUTPUT INSERTED.id
              VALUES (@username, @email, @password_hash, @role, @starting_balance, @max_drawdown)`);
    userId = userResult.recordset[0].id;
    console.log(`✓ Created admin user 'remco' (id=${userId}), password: ${password}`);
    console.log('  ⚠ Change this password immediately after import!');
  }

  // 2. Read Excel
  const xlsxPath = path.join(process.cwd(), 'TradeAcademy Excel Logboek.xlsx');
  const wb = XLSX.readFile(xlsxPath, { cellDates: true });
  const ws = wb.Sheets['TRADES'];
  const allRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 });

  // Row 7 (index 6) = headers, Row 8+ (index 7+) = data
  const dataRows = allRows.slice(7) as unknown[][];

  let imported = 0;
  let skipped  = 0;

  for (const row of dataRows) {
    const rawDate = row[0];
    if (!rawDate) continue;

    let tradeDate: Date;
    if (rawDate instanceof Date) {
      tradeDate = rawDate;
    } else if (typeof rawDate === 'number') {
      tradeDate = new Date((rawDate - 25569) * 86400000);
    } else {
      skipped++;
      continue;
    }

    const tradeDateStr = tradeDate.toISOString().split('T')[0];

    const symbol       = String(row[1] ?? '').trim();
    const tradeType    = String(row[2] ?? '').trim() as 'Long' | 'Short';
    const timeOfTrade  = row[3] ? String(row[3]).trim() : null;
    const strategy     = row[4] ? String(row[4]).trim() : null;
    const entryPrice   = parseFloat(String(row[5]))  || 0;
    const stopLoss     = row[6]  != null ? parseFloat(String(row[6])) : null;
    const shares       = parseInt(String(row[8]))    || 1;
    const exitPrice    = row[11] != null ? parseFloat(String(row[11])) : null;
    const amtInvested  = row[13] != null ? parseFloat(String(row[13])) : entryPrice * shares;
    const amtSold      = row[14] != null ? parseFloat(String(row[14])) : null;
    const totalPl      = row[15] != null ? parseFloat(String(row[15])) : null;
    const percentGain  = row[16] != null ? parseFloat(String(row[16])) : null;
    const rMultiple    = row[17] != null ? parseFloat(String(row[17])) : null;
    const issue        = row[18] ? String(row[18]).trim() : null;
    const notes        = row[19] ? String(row[19]).trim() : null;
    const screenshotUrl = row[20] ? String(row[20]).trim() : null;
    const commission   = row[21] != null ? parseFloat(String(row[21])) : null;

    if (!symbol || !tradeType) { skipped++; continue; }

    await pool.request()
      .input('user_id',        sql.Int,           userId)
      .input('trade_date',     sql.Date,          tradeDateStr)
      .input('symbol',         sql.NVarChar(20),  symbol)
      .input('trade_type',     sql.NVarChar(5),   tradeType)
      .input('time_of_trade',  sql.NVarChar(20),  timeOfTrade)
      .input('strategy',       sql.NVarChar(100), strategy)
      .input('entry_price',    sql.Decimal(12,4), entryPrice)
      .input('stop_loss',      sql.Decimal(12,4), isNaN(stopLoss!) ? null : stopLoss)
      .input('shares',         sql.Int,           shares)
      .input('exit_price',     sql.Decimal(12,4), exitPrice)
      .input('amount_invested',sql.Decimal(12,2), Math.round(amtInvested * 100) / 100)
      .input('amount_sold',    sql.Decimal(12,2), amtSold ? Math.round(amtSold * 100) / 100 : null)
      .input('total_pl',       sql.Decimal(12,2), totalPl  != null ? Math.round(totalPl * 100) / 100 : null)
      .input('percent_gain',   sql.Decimal(10,6), percentGain)
      .input('r_multiple',     sql.Decimal(8,4),  rMultiple)
      .input('commission',     sql.Decimal(8,2),  commission)
      .input('notes',          sql.NVarChar(sql.MAX), notes)
      .input('screenshot_url', sql.NVarChar(500), screenshotUrl)
      .input('issue',          sql.NVarChar(sql.MAX), issue)
      .query(`INSERT INTO trades
        (user_id, trade_date, symbol, trade_type, time_of_trade, strategy,
         entry_price, stop_loss, shares, exit_price, amount_invested, amount_sold,
         total_pl, percent_gain, r_multiple, commission, notes, screenshot_url, issue)
        VALUES
        (@user_id, @trade_date, @symbol, @trade_type, @time_of_trade, @strategy,
         @entry_price, @stop_loss, @shares, @exit_price, @amount_invested, @amount_sold,
         @total_pl, @percent_gain, @r_multiple, @commission, @notes, @screenshot_url, @issue)`);
    imported++;
  }

  console.log(`✓ Imported ${imported} trades (${skipped} skipped)`);
  await pool.close();
}

main().catch(err => { console.error('Import failed:', err); process.exit(1); });
