import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { db } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import type { User } from '@/lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) redirect('/login');

  const result = await db(
    'SELECT id, username, role, starting_balance, max_drawdown FROM users WHERE id = @id',
    { id: payload.userId }
  );
  const user = result.recordset[0] as Pick<User, 'id' | 'username' | 'role' | 'starting_balance' | 'max_drawdown'>;
  if (!user) redirect('/login');

  return (
    <div className="flex flex-col h-full">
      <Topbar username={user.username} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role={user.role} startingBalance={user.starting_balance} />
        <main className="flex-1 overflow-y-auto p-6 bg-tj-bg">
          {children}
        </main>
      </div>
    </div>
  );
}
