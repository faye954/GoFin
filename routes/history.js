// routes/history.js
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 修改后的路径，匹配前端 /api/history/:ticker 请求
router.get('/api/history/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const now = Math.floor(Date.now() / 1000);
  const days = 5;
  const start = now - days * 86400;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${start}&period2=${now}&interval=1d&includeAdjustedClose=true`;

  try {
    const response = await axios.get(url);
    const result = response.data.chart.result[0];

    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const closes = quote.close.filter(p => p != null);
    const volumes = quote.volume.filter(v => v != null);

    const data = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().split('T')[0],
      price: closes[i]
    })).filter(p => p.price != null);

    // 计算指标
    const SMA = closes.reduce((a, b) => a + b, 0) / closes.length;
    const VWAP = closes.reduce((sum, c, i) => sum + c * volumes[i], 0) / volumes.reduce((a, b) => a + b, 0);
    const avg = SMA;
    const variance = closes.reduce((sum, c) => sum + (c - avg) ** 2, 0) / closes.length;
    const volatility = Math.sqrt(variance);

    res.json({
      price: closes[closes.length - 1],
      SMA,
      VWAP,
      volatility,
      history: data
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

module.exports = router;
