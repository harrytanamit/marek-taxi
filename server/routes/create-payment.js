const express = require('express');
const router  = express.Router();
const { createBooking } = require('../services/airtable');

router.post('/', async (req, res) => {
  const { name, phone, email, pickup, dropoff, datetime, price, durationMin, type, notes } = req.body;
  if (!name || !phone || !email || !pickup || !dropoff || !datetime || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Save booking as reserved
    const recordId = await createBooking({ name, phone, email, pickup, dropoff, datetime, price, durationMin, type, notes });

    // 2. Create Revolut payment order
    const checkoutUrl = await createRevolutOrder({ recordId, price, name, email });

    res.json({ checkoutUrl });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: 'Unable to create payment' });
  }
});

async function createRevolutOrder({ recordId, price, name, email }) {
  if (!process.env.REVOLUT_SECRET_KEY || process.env.REVOLUT_SECRET_KEY.startsWith('your_')) {
    // Sandbox stub — return a fake URL for testing
    return `https://sandbox-merchant.revolut.com/payment-link/stub?order=${recordId}`;
  }

  const amountPence = Math.round(price * 100);
  const res = await fetch('https://merchant.revolut.com/api/orders', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REVOLUT_SECRET_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      amount:           amountPence,
      currency:         'GBP',
      capture_mode:     'AUTOMATIC',
      merchant_order_ext_ref: recordId,
      customer_email:   email,
      description:      `MM Edinburgh Transfers — ${name}`,
    }),
  });

  if (!res.ok) throw new Error(`Revolut error: ${await res.text()}`);
  const order = await res.json();
  return order.checkout_url;
}

module.exports = router;
