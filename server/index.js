require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { expireReservations } = require('./services/airtable');

const app = express();

app.use(cors({
  origin: [
    'https://harrytanamit.github.io',
    'http://localhost:3000',
    'http://localhost:8080',
  ],
}));

// Raw body for webhook (must come before express.json)
app.use('/api/webhook', require('./routes/webhook'));

app.use(express.json());

app.use('/api/check-availability', require('./routes/check-availability'));
app.use('/api/create-payment',     require('./routes/create-payment'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

// Expire stale reservations every 5 minutes
expireReservations().catch(console.error);
setInterval(() => expireReservations().catch(console.error), 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MM Transfers API running on port ${PORT}`));
