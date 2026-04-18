const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  // Tunable pool settings for scalability
  max: process.env.PG_MAX_CLIENTS ? Number(process.env.PG_MAX_CLIENTS) : 20,
  idleTimeoutMillis: process.env.PG_IDLE_TIMEOUT ? Number(process.env.PG_IDLE_TIMEOUT) : 30000,
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT ? Number(process.env.PG_CONN_TIMEOUT) : 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err);
});

async function query(text, params) {
  return pool.query(text, params);
}

async function getClient() {
  return pool.connect();
}

async function transaction(work) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function testConnection() {
  const client = await getClient();
  try {
    await client.query('SELECT 1');
    console.log('Database connected');
  } finally {
    client.release();
  }
}

// Programmatic migration runner: runs all .sql files in backend/db/migrations
async function migrate() {
  const migrationsDir = path.join(__dirname, '..', '..', 'db', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (!files.length) {
    console.log('No migration files found.');
    return;
  }

  const client = await getClient();
  try {
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log('Applying migration:', file);
      await client.query(sql);
    }
    console.log('Migrations completed.');
  } finally {
    client.release();
  }
}

async function shutdown() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  testConnection,
  migrate,
  shutdown,
};
