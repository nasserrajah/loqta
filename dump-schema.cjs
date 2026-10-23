const Database = require('./node_modules/better-sqlite3');
const db = new Database('./apps/api/data/loqta.db', { readonly: true });
const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
console.log('Tables: ' + tables.length);
tables.forEach(t => { console.log(''); console.log('-- Table: ' + t.name); console.log(t.sql + ';'); });
const indexes = db.prepare("SELECT sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name").all();
console.log(''); console.log('Indexes: ' + indexes.length);
indexes.forEach(i => console.log(i.sql + ';'));
db.close();
