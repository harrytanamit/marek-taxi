const express = require('express');
const router  = express.Router();
const { checkAvailability } = require('../services/airtable');

router.post('/', async (req, res) => {
  const { datetime, durationMin } = req.body;
  if (!datetime) return res.status(400).json({ error: 'datetime required' });
  try {
    const available = await checkAvailability(datetime, durationMin || 90);
    res.json({ available });
  } catch (err) {
    console.error('Availability check error:', err);
    res.json({ available: true }); // fail open — let Marek handle edge cases
  }
});

module.exports = router;
