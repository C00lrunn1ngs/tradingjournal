import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

function getAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const p = token ? verifyToken(token) : null;
  return p?.role === 'admin' ? p : null;
}

export async function GET(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });
  const r = await db('SELECT id, username, email, role, starting_balance, max_drawdown, created_at FROM users ORDER BY created_at');
  return NextResponse.json(r.recordset);
}

export async function POST(req: NextRequest) {
  if (!getAdmin(req)) return NextResponse.json({ error: 'Geen toegang' }, { status: 403 });

  const body = await req.json().catch(() => ({})) as {
    username?: string; email?: string; password?: string; role?: string;
    starting_balance?: number; max_drawdown?: number;
  };

  if (!body.username || !body.email || !body.password) {
    return NextResponse.json({ error: 'username, email en password zijn verplicht' }, { status: 400 });
  }

  const hash = await bcrypt.hash(body.password, 12);

  await db(
    `INSERT INTO users (username, email, password_hash, role, starting_balance, max_drawdown)
     VALUES (@username, @email, @hash, @role, @starting_balance, @max_drawdown)`,
    {
      username:         body.username,
      email:            body.email,
      hash,
      role:             body.role === 'admin' ? 'admin' : 'user',
      starting_balance: body.starting_balance ?? 45000,
      max_drawdown:     body.max_drawdown     ?? 2000,
    }
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
