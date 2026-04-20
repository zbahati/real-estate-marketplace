const db = require('../index');

async function createPayment({ request_id, user_id, amount }) {
  const res = await db.query(
    `
    INSERT INTO payments (request_id, user_id, amount)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [request_id, user_id, amount]
  );

  return res.rows[0];
}

async function markPaymentSuccess(id) {
  await db.query(
    `UPDATE payments SET status = 'success' WHERE id = $1`,
    [id]
  );
}

module.exports = {
  createPayment,
  markPaymentSuccess
};