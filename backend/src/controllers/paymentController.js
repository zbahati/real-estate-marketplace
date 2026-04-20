const paymentsRepo = require('../db/repos/payments');
const db = require('../db');

async function payForContact(req, res) {
  try {
    const { request_id, phone } = req.body;

    // 1. Create payment record
    const payment = await paymentsRepo.createPayment({
      request_id,
      user_id: req.user.id,
      amount: 1000 // RWF (example)
    });

    // 🔥 TEMP (simulate success)
    await paymentsRepo.markPaymentSuccess(payment.id);

    // 2. Unlock contact
    await db.query(
      `UPDATE requests 
       SET contact_unlocked = true 
       WHERE id = $1`,
      [request_id]
    );

    res.json({
      message: 'Payment successful (simulated)',
      payment_id: payment.id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
}

module.exports = {
  payForContact
};