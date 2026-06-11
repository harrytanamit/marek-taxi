async function sendConfirmationToCustomer(booking) {
  const body = {
    from:    process.env.EMAIL_FROM,
    to:      booking.email,
    subject: `Booking Confirmed — MM Edinburgh Transfers`,
    html: `
      <h2>Your transfer is confirmed</h2>
      <p>Hi ${booking.name},</p>
      <p>Your booking is confirmed. Here are the details:</p>
      <table>
        <tr><td><strong>Pickup:</strong></td><td>${booking.pickup}</td></tr>
        <tr><td><strong>Drop-off:</strong></td><td>${booking.dropoff}</td></tr>
        <tr><td><strong>Date & Time:</strong></td><td>${new Date(booking.datetime).toLocaleString('en-GB')}</td></tr>
        <tr><td><strong>Price paid:</strong></td><td>£${booking.price.toFixed(2)}</td></tr>
      </table>
      <p>Questions? Call or text: <a href="tel:${process.env.MAREK_PHONE}">${process.env.MAREK_PHONE}</a></p>
      <p>MM Edinburgh Transfers</p>
    `,
  };
  return sendEmail(body);
}

async function sendNewBookingToMarek(booking) {
  const body = {
    from:    process.env.EMAIL_FROM,
    to:      process.env.EMAIL_MAREK,
    subject: `New booking — ${booking.name} — ${new Date(booking.datetime).toLocaleString('en-GB')}`,
    html: `
      <h2>New booking received</h2>
      <table>
        <tr><td><strong>Name:</strong></td><td>${booking.name}</td></tr>
        <tr><td><strong>Phone:</strong></td><td>${booking.phone}</td></tr>
        <tr><td><strong>Email:</strong></td><td>${booking.email}</td></tr>
        <tr><td><strong>Pickup:</strong></td><td>${booking.pickup}</td></tr>
        <tr><td><strong>Drop-off:</strong></td><td>${booking.dropoff}</td></tr>
        <tr><td><strong>Date & Time:</strong></td><td>${new Date(booking.datetime).toLocaleString('en-GB')}</td></tr>
        <tr><td><strong>Price:</strong></td><td>£${booking.price.toFixed(2)}</td></tr>
        <tr><td><strong>Notes:</strong></td><td>${booking.notes || '—'}</td></tr>
      </table>
    `,
  };
  return sendEmail(body);
}

async function sendEmail(body) {
  if (!process.env.RESEND_API_KEY) {
    console.log('[email stub]', body.subject, '→', body.to);
    return;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  if (!res.ok) console.error('Email send failed:', await res.text());
}

module.exports = { sendConfirmationToCustomer, sendNewBookingToMarek };
