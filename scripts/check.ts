import 'dotenv/config';
import fs from 'fs';
import path from 'path';

console.log('=== Diagnostiek ===');
console.log('node.exe pad:', process.execPath);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('DB_SERVER:', process.env.DB_SERVER);
console.log('DB_INSTANCE:', process.env.DB_INSTANCE);
console.log('DB_DATABASE:', process.env.DB_DATABASE);
console.log('DB_USER:', process.env.DB_USER);

const nextDir = path.join(process.cwd(), '.next');
console.log('\n.next map aanwezig:', fs.existsSync(nextDir));
if (fs.existsSync(nextDir)) {
  const buildId = path.join(nextDir, 'BUILD_ID');
  console.log('BUILD_ID aanwezig:', fs.existsSync(buildId));
  if (fs.existsSync(buildId)) {
    console.log('BUILD_ID:', fs.readFileSync(buildId, 'utf8').trim());
  }
}

console.log('\n=== DB verbindingstest ===');
import('mssql').then(async ({ default: sql }) => {
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
    connectionTimeout: 5000,
  };
  try {
    const pool = await new sql.ConnectionPool(config).connect();
    const result = await pool.request().query('SELECT COUNT(*) AS trades FROM trades');
    console.log('DB verbinding: OK');
    console.log('Aantal trades:', result.recordset[0].trades);
    await pool.close();
  } catch (e: unknown) {
    console.log('DB verbinding: FOUT -', (e as Error).message);
  }
  process.exit(0);
});
