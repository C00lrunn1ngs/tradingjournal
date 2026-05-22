import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { calcTrade } from '@/lib/calculations';
import type { Trade } from '@/lib/types';

function getUserId(req: NextRequest): number | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  return payload?.userId ?? null;
}

async function ownsTrade(tradeId: number, userId: number): Promise<boolean> {
  const r = await db(
    'SELECT id FROM trades WHERE id = @id AND user_id = @userId',
    { id: tradeId, userId }
  );
  return r.recordset.length > 0;
}

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

  let calc = {
    totalPl: 0,
    rMultiple: null as number | null,
    percentGain: null as number | null,
    amountInvested: body.entry_price * body.shares,
    amountSold: 0,
  };

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
      id:              tradeId,
      userId,
      trade_date:      body.trade_date,
      symbol:          body.symbol,
      trade_type:      body.trade_type,
      time_of_trade:   body.time_of_trade   ?? null,
      strategy:        body.strategy        ?? null,
      entry_price:     body.entry_price,
      stop_loss:       body.stop_loss       ?? null,
      shares:          body.shares,
      exit_price:      body.exit_price      ?? null,
      amount_invested: calc.amountInvested,
      amount_sold:     calc.amountSold,
      total_pl:        body.exit_price ? calc.totalPl : null,
      percent_gain:    calc.percentGain     ?? null,
      r_multiple:      calc.rMultiple       ?? null,
      commission:      body.commission      ?? null,
      notes:           body.notes           ?? null,
      screenshot_url:  body.screenshot_url  ?? null,
      issue:           body.issue           ?? null,
    }
  );

  return NextResponse.json({ ok: true });
}

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
    { id: tradeId, userId }
  );

  return NextResponse.json({ ok: true });
}
