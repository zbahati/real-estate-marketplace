const db = require('../index');

async function createUser({ email, password_hash, full_name, phone }) {
  const sql = `
    INSERT INTO users (email, password_hash, full_name, phone)
    VALUES ($1,$2,$3,$4)
    RETURNING id, email, full_name, phone, created_at
  `;
  const res = await db.query(sql, [email, password_hash, full_name, phone]);
  return res.rows[0];
}

async function getUserById(id) {
  const res = await db.query('SELECT id, email, full_name, phone, created_at FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function findByEmail(email) {
  const res = await db.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0] || null;
}

module.exports = {
  createUser,
  getUserById,
  findByEmail,
};
