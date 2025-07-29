const express = require('express');
const axios = require('axios');
const router = express.Router();

const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

const format2 = num => parseFloat(num.toFixed(2));

// GET /api/quote/market
router.get('/market', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];

    const results = await Promise.all(etfTickers.map(async ticker => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
      const response = await axios.get(url);
      const data = response.data.chart.result[0];

      const price = data.meta.regularMarketPrice;
      console.log("price", price);

      const prev = data.meta.chartPreviousClose;
      console.log("prev", prev);
      const changeRaw = price - prev;
      console.log("changeRaw", changeRaw);
      const changePercentRaw = (changeRaw / prev) * 100;
      const closes = data.indicators.quote[0].close.filter(p => p != null);

      return {
        symbol: ticker,
        price: format2(price),
        change: format2(changeRaw),             // ✅ 保留正负号
        changePercent: format2(changePercentRaw),
        trend: closes.map(format2)
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('Error fetching ETF market data:', err.message);
    res.status(500).json({ error: 'Failed to fetch ETF market data' });
  }
});

// GET /api/quote/all
router.get('/all', async (req, res) => {
  try {
    const results = await Promise.all(popularTickers.map(async ticker => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      const response = await axios.get(url);
      const data = response.data.chart.result[0];

      const price = data.meta.regularMarketPrice;
      const prev = data.meta.chartPreviousClose;
      const changeRaw = price - prev;
      const changePercentRaw = (changeRaw / prev) * 100;
      const volume = data.indicators.quote[0].volume.pop();

      return {
        ticker,
        price: format2(price),
        change: format2(changeRaw),
        changePercent: format2(changePercentRaw),
        volume
      };
    }));

    res.json(results);
  } catch (err) {
    console.error('Error fetching tickers:', err);
    res.status(500).json({ error: 'Failed to load all tickers' });
  }
});

// GET /api/quote/:ticker
router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
    const response = await axios.get(url);
    const data = response.data.chart.result[0];

    const price = data.meta.regularMarketPrice;
    const prev = data.meta.chartPreviousClose;
    const changeRaw = price - prev;
    const changePercentRaw = (changeRaw / prev) * 100;
    const volume = data.indicators.quote[0].volume.pop();

    res.json({
      ticker,
      price: format2(price),
      change: format2(changeRaw),
      changePercent: format2(changePercentRaw),
      volume
    });
  } catch (err) {
    console.error('Error fetching single ticker:', err.message);
    res.status(500).json({ error: 'Failed to fetch ticker data' });
  }
});

module.exports = router;


console.log(format2(-3.147));
