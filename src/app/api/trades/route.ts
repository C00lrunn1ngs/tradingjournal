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

export async function GET(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type   = searchParams.get('type');
  const symbol = searchParams.get('symbol');
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

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const body = await req.json().catch(() => ({})) as Partial<Trade> & {
    exit_price?: number;
    commission?: number;
  };

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
