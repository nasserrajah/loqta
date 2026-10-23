import { createClient } from '@libsql/client';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('❌ المتغيرات غير موجودة');
  process.exit(1);
}

const client = createClient({ url, authToken });

async function main() {
  try {
    const users = await client.execute("SELECT COUNT(*) as count FROM users");
    console.log('👤 عدد المستخدمين:', users.rows[0].count);
    
    const products = await client.execute("SELECT COUNT(*) as count FROM products");
    console.log('📦 عدد المنتجات:', products.rows[0].count);
    
    if (users.rows[0].count > 0) {
      const admin = await client.execute("SELECT email, role FROM users WHERE email = 'admin@loqta.dev'");
      console.log('👑 حساب المدير:', admin.rows[0]);
    }
  } catch (e) {
    console.error('❌ خطأ:', e.message);
  }
}

main();