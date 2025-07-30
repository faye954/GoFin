// routes/finance.js
const express = require('express');
const router = express.Router();
const { getCurrentPrice } = require('../services/priceService');
const yahoo = require('yahoo-finance2').default;

router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const result = await getCurrentPrice(ticker);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/quote-summary/:ticker', async (req, res) => {
  try {
    const data = await yahoo.getSummary(req.params.ticker);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

