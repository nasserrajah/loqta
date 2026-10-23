import { createClient } from '@libsql/client';
import fs from 'node:fs';
import path from 'node:path';
import { seedDemoData } from './apps/api/dist/src/infrastructure/database/seed.js';
import { BcryptPasswordHasher } from './apps/api/dist/src/infrastructure/security/index.js';
import { TursoDatabaseClient } from './apps/api/dist/src/infrastructure/database/connection/turso-database.js';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ يرجى تعيين TURSO_DATABASE_URL و TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({ url, authToken });
const db = new TursoDatabaseClient(url, authToken);

async function main() {
  console.log('1. جاري تطبيق الجداول (Schema)...');
  const schemaSql = fs.readFileSync(path.join(process.cwd(), 'database/migrations/000_initial.sql'), 'utf8');
  
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('PRAGMA'));

  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.error('خطأ في:', stmt, '\n', e.message);
      }
    }
  }
  console.log('✅ تم تطبيق الجداول.');
  
  console.log('2. جاري زرع البيانات (Seed)...');
  try {
    const bcryptRounds = 10;
    const result = await seedDemoData(db, new BcryptPasswordHasher(bcryptRounds));
    console.log('✅ تم الزرع بنجاح:', result);
  } catch (e) {
    console.error('❌ خطأ أثناء الزرع:', e.message);
  }
  
  await db.close();
  console.log('🎉 انتهت العملية!');
}

main().catch(console.error);