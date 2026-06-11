const express = require('express');
const router  = express.Router();
const { getBookingByPaymentId, updateBookingStatus, markConfirmationSent } = require('../services/airtable');
const { sendConfirmationToCustomer, sendNewBookingToMarek } = require('../services/email');

// Revolut sends JSON webhook — use raw body for signature verification when key is set
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  let event;
  try {
    event = JSON.parse(req.body.toString());
  } catch {
    return res.status(400).send('Invalid JSON');
  }

  // Optional: verify Revolut webhook signature
  if (process.env.REVOLUT_WEBHOOK_SECRET) {
    const sig = req.headers['revolut-signature'];
    if (!verifySignature(req.body, sig, process.env.REVOLUT_WEBHOOK_SECRET)) {
      return res.status(401).send('Invalid signature');
    }
  }

  if (event.event === 'ORDER_COMPLETED') {
    const orderId  = event.order_id;
    const extRef   = event.merchant_order_ext_ref; // this is our Airtable record ID

    try {
      await updateBookingStatus(extRef, 'paid', orderId);

      const booking = await getBookingByPaymentId(orderId);
      if (booking) {
        const fields = booking.fields;
        await sendConfirmationToCustomer(fields);
        await sendNewBookingToMarek(fields);
        await markConfirmationSent(booking.id);
      }
    } catch (err) {
      console.error('Webhook processing error:', err);
    }
  }

  res.json({ received: true });
});

function verifySignature(rawBody, signature, secret) {
  const crypto = require('crypto');
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return signature === `v1=${expected}`;
}

module.exports = router;
