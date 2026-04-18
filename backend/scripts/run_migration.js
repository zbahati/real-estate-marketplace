const path = require('path');
require('dotenv').config({
  path: path.join(__dirname, '..', '.env')
});
const fs = require('fs');
const { Client } = require('pg');


const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function run() {
  const client = new Client({
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
    }

    console.log('All migrations applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();