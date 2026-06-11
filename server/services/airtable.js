const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_TOKEN })
  .base(process.env.AIRTABLE_BASE_ID);

const BOOKINGS = 'Bookings';
const BLOCKED  = 'Blocked Slots';

async function createBooking(data) {
  const record = await base(BOOKINGS).create({
    Name:          data.name,
    Phone:         data.phone,
    Email:         data.email,
    Pickup:        data.pickup,
    Dropoff:       data.dropoff,
    Datetime:      data.datetime,
    Price:         data.price,
    Duration:      data.durationMin || 90,
    Type:          data.type,
    Notes:         data.notes || '',
    Status:        'Pending',
    ReservedUntil: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    PaymentId:     '',
  });
  return record.id;
}

const STATUS = { reserved: 'Pending', paid: 'Paid', cancelled: 'Cancelled' };

async function updateBookingStatus(recordId, status, paymentId) {
  await base(BOOKINGS).update(recordId, {
    Status:    STATUS[status] || status,
    PaymentId: paymentId || '',
    ...(status === 'paid' ? { ConfirmationSent: false } : {}),
  });
}

async function getBookingByPaymentId(paymentId) {
  const records = await base(BOOKINGS).select({
    filterByFormula: `{PaymentId} = '${paymentId}'`,
    maxRecords: 1,
  }).firstPage();
  return records[0] || null;
}

async function markConfirmationSent(recordId) {
  await base(BOOKINGS).update(recordId, { ConfirmationSent: true });
}

async function checkAvailability(datetime, durationMin) {
  const start = new Date(datetime);
  const end   = new Date(start.getTime() + (durationMin + 60) * 60 * 1000); // +buffer

  // 1. Check existing bookings
  const bookings = await base(BOOKINGS).select({
    filterByFormula: `OR({Status} = 'Pending', {Status} = 'Paid')`,
  }).all();

  for (const b of bookings) {
    const bStart = new Date(b.fields.Datetime);
    const bEnd   = new Date(bStart.getTime() + ((b.fields.Duration || 90) + 60) * 60 * 1000);
    if (start < bEnd && end > bStart) return false;
  }

  // 2. Check blocked slots (using End Datetime — blocked until that time)
  const blocked = await base(BLOCKED).select().all();
  for (const bl of blocked) {
    const blockedUntil = new Date(bl.fields['End Datetime']);
    const blockedFrom  = bl.fields['Start Datetime']
      ? new Date(bl.fields['Start Datetime'])
      : new Date(blockedUntil.setHours(0, 0, 0, 0)); // fallback: whole day
    if (start < blockedUntil && end > blockedFrom) return false;
  }

  return true;
}

// Expire stale reservations (call on server start + periodically)
async function expireReservations() {
  const records = await base(BOOKINGS).select({
    filterByFormula: `AND({Status} = 'Pending', IS_BEFORE({ReservedUntil}, NOW()))`,
  }).all();
  for (const r of records) {
    await base(BOOKINGS).update(r.id, { Status: 'Cancelled' });
  }
}

module.exports = { createBooking, updateBookingStatus, getBookingByPaymentId, markConfirmationSent, checkAvailability, expireReservations };
