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
