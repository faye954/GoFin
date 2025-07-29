const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const pLimit = require('p-limit');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 30 }); // 30秒缓存
const limit = pLimit(5); // 限制并发请求数为5

const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

const format2 = num => parseFloat(num.toFixed(2));

// 指数名称映射
const indexNames = {
  'DIA': '道琼斯工业平均指数',
  'QQQ': '纳斯达克综合指数',
  'SPY': '标普500指数'
};

// 获取当前时间字符串 (纽约时间)
function getNewYorkTime() {
  const now = new Date();
  now.setHours(now.getHours() - 4); // 转换为纽约时间 (UTC-4)
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

// 封装API请求，添加缓存和错误处理
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

    // 提取可能缺失的字段
    const peRatio =
      meta.trailingPE !== undefined ? meta.trailingPE :
        meta.forwardPE !== undefined ? meta.forwardPE :
          null;

    const dividendYield =
      meta.dividendYield !== undefined ? meta.dividendYield * 100 :
        meta.trailingAnnualDividendYield !== undefined ? meta.trailingAnnualDividendYield * 100 :
          null;

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
      marketCap: meta.marketCap !== undefined ? meta.marketCap : null,
      peRatio: peRatio,
      dividendYield: dividendYield,
      eps: meta.epsTrailingTwelveMonths !== undefined ? meta.epsTrailingTwelveMonths : null,
      beta: meta.beta !== undefined ? meta.beta : null,
      fiftyTwoWeekHigh: meta.regularMarketDayHigh,
      fiftyTwoWeekLow: meta.regularMarketDayLow
    };

    // 将null转换为"N/A"以便前端展示
    Object.keys(result).forEach(key => {
      if (result[key] === null) {
        result[key] = 'N/A';
      }
    });

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err.message);
    throw err;
  }
}

// GET /api/getMarketOverview (市场概览)
router.get('/api/getMarketOverview', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];
    const updateTime = getNewYorkTime(); // 统一使用纽约时间

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

// GET /api/quote1/all (所有股票数据)
router.get('/api/quote1/all', async (req, res) => {
  try {
    const tickers = req.query.tickers
      ? req.query.tickers.split(',')
      : popularTickers;

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

// GET /api/quote/all (所有股票数据，quote.js中的逻辑)
router.get('/api/quote/all', async (req, res) => {
  try {
    const results = await Promise.all(popularTickers.map(async ticker => {
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
        shortName: meta.symbol, // 使用symbol作为简称
        longName: meta.instrumentType, // 使用类型作为全名
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

// 保留原有的 /api/quote/:ticker 接口
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

module.exports = router;