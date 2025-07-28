const express = require('express');
const axios = require('axios');
const router = express.Router();

// 获取某个股票过去 N 天的历史价格（从 Yahoo Finance 拉）
router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const now = Math.floor(Date.now() / 1000); // 当前时间戳（秒）
  const days = 30;
  const start = now - days * 86400; // N天前时间戳

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${now}&interval=1d&includeAdjustedClose=true`;

  try {
    const response = await axios.get(url);
    const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const prices = result.indicators.adjclose[0].adjclose;

    const data = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: prices[i],
    })).filter(p => p.price !== null);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

module.exports = router;
