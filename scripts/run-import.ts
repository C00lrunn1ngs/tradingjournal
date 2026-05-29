import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

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

async function runImport() {
  const pool = await new sql.ConnectionPool(config).connect();
  const sqlText = fs.readFileSync(path.join(process.cwd(), 'scripts/data-import.sql'), 'utf8');

  // Execute per statement to handle IDENTITY_INSERT scope correctly
  const statements = sqlText
    .split('\n')
    .filter(line => !line.startsWith('--') && line.trim())
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    await pool.request().query(stmt);
  }

  console.log('✓ Import complete');
  await pool.close();
}

runImport().catch(err => { console.error('Import failed:', err); process.exit(1); });
