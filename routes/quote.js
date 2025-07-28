// routes/quote.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

router.get('/all', async (req, res) => {
  try {
    const results = await Promise.all(popularTickers.map(async ticker => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      const response = await axios.get(url);
      const data = response.data.chart.result[0];

      const price = data.meta.regularMarketPrice;
      const prev = data.meta.chartPreviousClose;
      const change = price - prev;
      const changePercent = (change / prev) * 100;
      const volume = data.indicators.quote[0].volume.pop();

      return {
        ticker,
        price,
        change,
        changePercent,
        volume
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('Error fetching tickers:', err);
    res.status(500).json({ error: 'Failed to load all tickers' });
  }
});

module.exports = router;
