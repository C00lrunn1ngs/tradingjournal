import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { signToken, tokenCookieOptions } from '@/lib/auth';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Gebruikersnaam en wachtwoord zijn verplicht' },
      { status: 400 }
    );
  }

  const result = await db(
    'SELECT id, username, email, password_hash, role FROM users WHERE username = @u OR email = @u',
    { u: username }
  );

  const user = result.recordset[0] as User | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return NextResponse.json(
      { error: 'Gebruikersnaam of wachtwoord onjuist' },
      { status: 401 }
    );
  }

  const token = signToken({ userId: user.id, username: user.username, role: user.role });
  const response = NextResponse.json({ ok: true, username: user.username, role: user.role });
  response.cookies.set(tokenCookieOptions(token));
  return response;
}
