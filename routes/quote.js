const express = require('express');
const axios = require('axios');
const router = express.Router();
const fs = require('fs'); // 用于读取股票代码文件
const path = require('path');

// 从文件加载扩展的股票代码列表（替代原有的popularTickers）
const tickersPath = path.join(__dirname, '../tickers.json'); // 假设文件在项目根目录
const allTickers = JSON.parse(fs.readFileSync(tickersPath, 'utf8'));

// 保留原有的热门股票（可选，用于兼容旧接口）
const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

// 格式化数字为两位小数
const format2 = num => parseFloat(num.toFixed(2));

// 通用股票数据获取函数（复用逻辑，减少重复代码）
const fetchStockData = async (ticker, isETF = false) => {
  try {
    const url = isETF 
      ? `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`
      : `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
    
    const response = await axios.get(url);
    const data = response.data.chart.result[0];
    if (!data) throw new Error('No data available');

    const price = data.meta.regularMarketPrice;
    const prev = data.meta.chartPreviousClose;
    const changeRaw = price - prev;
    const changePercentRaw = (changeRaw / prev) * 100;

    if (isETF) {
      const closes = data.indicators.quote[0].close.filter(p => p != null);
      return {
        symbol: ticker,
        price: format2(price),
        change: format2(changeRaw),
        changePercent: format2(changePercentRaw),
        trend: closes.map(format2)
      };
    } else {
      const volume = data.indicators.quote[0].volume.pop();
      return {
        ticker,
        price: format2(price),
        change: format2(changeRaw),
        changePercent: format2(changePercentRaw),
        volume
      };
    }
  } catch (err) {
    console.error(`获取 ${ticker} 数据失败:`, err.message);
    return { ticker: ticker, error: '数据获取失败' };
  }
};

// GET /api/quote/market（ETF市场数据，保持不变）
router.get('/market', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];
    const results = await Promise.all(etfTickers.map(ticker => fetchStockData(ticker, true)));
    res.json(results);
  } catch (err) {
    console.error('ETF市场数据获取失败:', err.message);
    res.status(500).json({ error: 'Failed to fetch ETF market data' });
  }
});

// GET /api/quote/all（返回所有股票数据，替代原有的热门股票）
router.get('/all', async (req, res) => {
  try {
    // 使用从文件加载的所有股票代码
    const results = await Promise.all(allTickers.map(ticker => fetchStockData(ticker)));
    res.json(results);
  } catch (err) {
    console.error('全量股票数据获取失败:', err.message);
    res.status(500).json({ error: 'Failed to load all tickers' });
  }
});

// GET /api/quote/popular（新增：保留原热门股票接口）
router.get('/popular', async (req, res) => {
  try {
    const results = await Promise.all(popularTickers.map(ticker => fetchStockData(ticker)));
    res.json(results);
  } catch (err) {
    console.error('热门股票数据获取失败:', err.message);
    res.status(500).json({ error: 'Failed to load popular tickers' });
  }
});

// GET /api/quote/:ticker（单个股票查询，保持不变）
router.get('/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const result = await fetchStockData(ticker);
  if (result.error) {
    res.status(404).json(result);
  } else {
    res.json(result);
  }
});

// POST /api/quote/batch（新增：批量查询自定义股票）
router.post('/batch', async (req, res) => {
  const { tickers } = req.body;
  if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
    return res.status(400).json({ error: '请提供有效的股票代码数组' });
  }
  try {
    const results = await Promise.all(tickers.map(ticker => fetchStockData(ticker)));
    res.json(results);
  } catch (err) {
    console.error('批量查询失败:', err.message);
    res.status(500).json({ error: 'Failed to fetch batch data' });
  }
});

module.exports = router;