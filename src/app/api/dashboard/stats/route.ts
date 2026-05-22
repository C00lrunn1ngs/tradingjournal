import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { getDashboardStats } from '@/lib/stats';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });

  const stats = await getDashboardStats(payload.userId);
  if (!stats) return NextResponse.json({ error: 'Gebruiker niet gevonden' }, { status: 404 });

  return NextResponse.json(stats);
}
