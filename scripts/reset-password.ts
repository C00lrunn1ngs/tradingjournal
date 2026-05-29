import 'dotenv/config';
import bcrypt from 'bcryptjs';
import sql from 'mssql';

const email = process.argv[2];
const newPassword = process.argv[3];

if (!email || !newPassword) {
  console.error('Gebruik: npx tsx scripts/reset-password.ts <email> <nieuw-wachtwoord>');
  process.exit(1);
}

const config: sql.config = {
  server: process.env.DB_SERVER!,
  ...(process.env.DB_INSTANCE ? {} : { port: parseInt(process.env.DB_PORT ?? '1433') }),
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    trustServerCertificate: process.env.DB_TRUST_CERT === 'true',
    enableArithAbort: true,
    ...(process.env.DB_INSTANCE ? { instanceName: process.env.DB_INSTANCE } : {}),
  },
};

async function resetPassword() {
  const hash = await bcrypt.hash(newPassword, 12);
  const pool = await new sql.ConnectionPool(config).connect();
  const result = await pool.request()
    .input('hash', sql.NVarChar, hash)
    .input('email', sql.NVarChar, email)
    .query('UPDATE users SET password_hash = @hash WHERE email = @email');
  if (result.rowsAffected[0] === 0) {
    console.error('Geen gebruiker gevonden met e-mail:', email);
    process.exit(1);
  }
  console.log('Wachtwoord succesvol gewijzigd voor', email);
  await pool.close();
}

resetPassword().catch(err => { console.error('Fout:', err.message); process.exit(1); });
