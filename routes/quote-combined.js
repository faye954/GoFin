const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const pLimit = require('p-limit');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 30 }); // 30秒缓存
const limit = pLimit(5); // 限制并发请求数为5

// 从文件加载扩展的股票代码列表
const tickersPath = path.join(__dirname, '../tickers.json');
const allTickers = JSON.parse(fs.readFileSync(tickersPath, 'utf8'));

// 保留原有热门股票（仅用于特定接口）
const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

// 格式化数字为两位小数
const format2 = num => parseFloat(num.toFixed(2));

// 指数名称映射
const indexNames = {
  'DIA': '道琼斯工业平均指数',
  'QQQ': '纳斯达克综合指数',
  'SPY': '标普500指数'
};

// 获取纽约时间字符串
function getNewYorkTime() {
  const now = new Date();
  now.setHours(now.getHours() - 4); // UTC-4
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// ========== 原有带缓存的详细股票数据获取 ==========
async function fetchStockData(ticker) {
  const cacheKey = `stock:${ticker}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1d`;
    const response = await axios.get(url);

    if (!response.data.chart.result || !response.data.chart.result[0]) {
      throw new Error(`No data found for ${ticker}`);
    }

    const data = response.data.chart.result[0];
    const meta = data.meta;

    const peRatio = meta.trailingPE ?? meta.forwardPE ?? null;
    const dividendYield = (meta.dividendYield ?? meta.trailingAnnualDividendYield) * 100 || null;

    const result = {
      ticker,
      shortName: meta.shortName || '',
      longName: meta.longName || '',
      exchange: meta.exchangeName || '',
      currency: meta.currency || '',
      price: meta.regularMarketPrice,
      change: meta.regularMarketPrice - meta.chartPreviousClose,
      changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
      volume: data.indicators.quote[0].volume.pop(),
      marketCap: meta.marketCap ?? null,
      peRatio: peRatio,
      dividendYield: dividendYield,
      eps: meta.epsTrailingTwelveMonths ?? null,
      beta: meta.beta ?? null,
      fiftyTwoWeekHigh: meta.regularMarketDayHigh,
      fiftyTwoWeekLow: meta.regularMarketDayLow
    };

    // 空值转N/A
    Object.keys(result).forEach(key => {
      if (result[key] === null) result[key] = 'N/A';
    });

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err.message);
    throw err;
  }
}

// ========== 新的简单数据获取 ==========
const fetchStockDataSimple = async (ticker, isETF = false) => {
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
    return { ticker, error: '数据获取失败' };
  }
};

// ========== 接口实现 ==========

// GET /api/getMarketOverview (市场概览)
router.get('/api/getMarketOverview', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];
    const updateTime = getNewYorkTime();

    const results = await Promise.all(etfTickers.map(async ticker => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=5d&interval=1d`;
      const response = await axios.get(url);
      const data = response.data.chart.result[0];

      const price = data.meta.regularMarketPrice;
      const prev = data.meta.chartPreviousClose;
      const changeRaw = price - prev;
      const changePercentRaw = (changeRaw / prev) * 100;
      const closes = data.indicators.quote[0].close.filter(p => p != null);

      return {
        indexCode: ticker,
        indexName: indexNames[ticker] || ticker,
        trend: closes.map(format2),
        currentPoint: format2(price),
        changePoint: format2(changeRaw),
        changePercent: format2(changePercentRaw),
        updateTime: updateTime
      };
    }));

    res.json({
      code: 200,
      message: "success",
      data: results
    });
  } catch (err) {
    console.error('Error fetching ETF market data:', err.message);
    res.status(500).json({
      code: 500,
      message: 'Failed to fetch ETF market data',
      error: err.message
    });
  }
});

// GET /api/quote1/all (所有股票数据 - 详细版)
router.get('/api/quote1/all', async (req, res) => {
  try {
    // 默认使用tickers.json中的全部股票，支持通过query参数覆盖
    const tickers = req.query.tickers
      ? req.query.tickers.split(',')
      : allTickers;

    const results = await Promise.all(
      tickers.map(ticker => limit(() => fetchStockData(ticker)))
    );

    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: 'Failed to load stock data',
      details: err.message
    });
  }
});

// GET /api/quote/all (所有股票数据 - 简化版)
router.get('/api/quote/all', async (req, res) => {
  try {
    // 使用tickers.json中的全部股票
    const results = await Promise.all(allTickers.map(async ticker => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`;
      const response = await axios.get(url);
      const data = response.data.chart.result[0];
      const meta = data.meta;

      const price = meta.regularMarketPrice;
      const prev = meta.chartPreviousClose;
      const changeRaw = price - prev;
      const changePercentRaw = (changeRaw / prev) * 100;
      const volumes = data.indicators.quote[0].volume;
      const volume = volumes[volumes.length - 1];

      return {
        ticker: ticker,
        shortName: meta.symbol,
        longName: meta.instrumentType,
        price: format2(price),
        change: format2(changeRaw),
        changePercent: format2(changePercentRaw),
        volume: volume
      };
    }));

    res.json({
      code: 200,
      message: "success",
      data: results
    });
  } catch (err) {
    console.error('Error fetching tickers:', err);
    res.status(500).json({
      code: 500,
      message: 'Failed to load all tickers',
      error: err.message
    });
  }
});

// GET /api/quote/:ticker (单只股票数据)
router.get('/api/quote/:ticker', async (req, res) => {
  const { ticker } = req.params;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`;
    const response = await axios.get(url);
    const data = response.data.chart.result[0];
    const meta = data.meta;

    const price = meta.regularMarketPrice;
    const prev = meta.chartPreviousClose;
    const changeRaw = price - prev;
    const changePercentRaw = (changeRaw / prev) * 100;
    const volumes = data.indicators.quote[0].volume;
    const volume = volumes[volumes.length - 1];

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

// ========== 新增接口 ==========

// GET /api/quote/market (市场指数)
router.get('/api/quote/market', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];
    const results = await Promise.all(etfTickers.map(ticker => fetchStockDataSimple(ticker, true)));
    res.json(results);
  } catch (err) {
    console.error('ETF市场数据获取失败:', err.message);
    res.status(500).json({ error: 'Failed to fetch ETF market data' });
  }
});

// GET /api/quote/popular (热门股票)
router.get('/api/quote/popular', async (req, res) => {
  try {
    const results = await Promise.all(popularTickers.map(ticker => fetchStockDataSimple(ticker)));
    res.json(results);
  } catch (err) {
    console.error('热门股票数据获取失败:', err.message);
    res.status(500).json({ error: 'Failed to load popular tickers' });
  }
});

// GET /api/quote/full (全量股票 - 使用tickers.json)
router.get('/api/quote/full', async (req, res) => {
  try {
    const results = await Promise.all(allTickers.map(ticker => fetchStockDataSimple(ticker)));
    res.json(results);
  } catch (err) {
    console.error('全量股票数据获取失败:', err.message);
    res.status(500).json({ error: 'Failed to load all tickers' });
  }
});

// POST /api/quote/batch (批量查询)
router.post('/api/quote/batch', async (req, res) => {
  const { tickers } = req.body;
  if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
    return res.status(400).json({ error: '请提供有效的股票代码数组' });
  }
  try {
    const results = await Promise.all(tickers.map(ticker => fetchStockDataSimple(ticker)));
    res.json(results);
  } catch (err) {
    console.error('批量查询失败:', err.message);
    res.status(500).json({ error: 'Failed to fetch batch data' });
  }
});

module.exports = router;
