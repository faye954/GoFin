const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const pLimit = require('p-limit');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// 缓存配置（30秒过期）
const cache = new NodeCache({ stdTTL: 30 });
// 并发请求限制（最多5个同时请求）
const limit = pLimit(5);

// 从tickers.json加载所有股票代码
const tickersPath = path.join(__dirname, '../tickers.json');
const allTickers = JSON.parse(fs.readFileSync(tickersPath, 'utf8'));

// 热门股票列表（兼容原有功能）
const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

// 数字格式化（保留两位小数）
const format2 = num => parseFloat(num.toFixed(2));

// 指数名称映射（市场概览用）
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

// 通用股票数据获取函数（带缓存和错误处理）
// 通用股票数据获取函数（带缓存和错误处理）
async function fetchStockData(ticker, isETF = false) {
  const cacheKey = isETF ? `etf:${ticker}` : `stock:${ticker}`;
  const cachedData = cache.get(cacheKey);

  if (cachedData) {
    return cachedData;
  }

  try {
    // 根据类型设置不同的请求参数
    const urlParams = isETF ? 'range=5d&interval=1d' : 'range=1d&interval=1d';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?${urlParams}`;
    const response = await axios.get(url);

    if (!response.data.chart.result || !response.data.chart.result[0]) {
      throw new Error(`No data found for ${ticker}`);
    }

    const data = response.data.chart.result[0];
    const meta = data.meta;
    const price = meta.regularMarketPrice;
    const prevPrice = meta.chartPreviousClose;
    const changeRaw = price - prevPrice;
    const changePercentRaw = (changeRaw / prevPrice) * 100;

    // ETF数据格式（用于市场概览）
    if (isETF) {
      const closes = data.indicators.quote[0].close.filter(p => p != null);
      const result = {
        indexCode: ticker,
        indexName: indexNames[ticker] || ticker,
        trend: closes.map(format2),
        currentPoint: format2(price),
        changePoint: format2(changeRaw),
        changePercent: format2(changePercentRaw),
        updateTime: getNewYorkTime()
      };
      cache.set(cacheKey, result);
      return result;
    }

    // 股票数据格式（详细信息）
    // 提取成交量数据，添加防御性检查
    const volumeData = data.indicators.quote[0].volume;
    const volume = volumeData ? volumeData.pop() : 0;
    
    // 提取可能缺失的财务指标
    const peRatio = meta.trailingPE ?? meta.forwardPE ?? 'N/A';
    const dividendYield = meta.dividendYield !== undefined 
      ? meta.dividendYield * 100 
      : meta.trailingAnnualDividendYield !== undefined 
        ? meta.trailingAnnualDividendYield * 100 
        : 'N/A';

    const result = {
      ticker,
      shortName: meta.shortName || meta.symbol || '',
      longName: meta.longName || meta.instrumentType || '',
      exchange: meta.exchangeName || '',
      currency: meta.currency || '',
      price: format2(price),
      change: format2(changeRaw),
      changePercent: format2(changePercentRaw),
      volume,
      marketCap: meta.marketCap ?? 'N/A',
      peRatio: peRatio !== 'N/A' ? format2(peRatio) : 'N/A',
      dividendYield: dividendYield !== 'N/A' ? format2(dividendYield) : 'N/A',
      eps: meta.epsTrailingTwelveMonths ?? 'N/A',
      beta: meta.beta ?? 'N/A',
      fiftyTwoWeekHigh: meta.regularMarketDayHigh ?? 'N/A',
      fiftyTwoWeekLow: meta.regularMarketDayLow ?? 'N/A'
    };

    cache.set(cacheKey, result);
    return result;
  } catch (err) {
    console.error(`Error fetching ${ticker}:`, err.message);
    return { ticker, error: '数据获取失败' };
  }
}

// 1. 市场概览接口（原/getMarketOverview）
router.get('/api/getMarketOverview', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];
    const results = await Promise.all(
      etfTickers.map(ticker => limit(() => fetchStockData(ticker, true)))
    );

    res.json({
      code: 200,
      message: "success",
      data: results
    });
  } catch (err) {
    console.error('Error fetching market overview:', err.message);
    res.status(500).json({
      code: 500,
      message: '获取市场概览失败',
      error: err.message
    });
  }
});

// 2. 获取所有股票数据
router.get('/api/quote1/all', async (req, res) => {
  try {
    const results = await Promise.all(allTickers.map(ticker => limit(() => fetchStockData(ticker))));
    res.json(results);
  } catch (err) {
    res.status(500).json({
      error: '获取股票数据失败',
      details: err.message
    });
  }
});

// 3. quote.js的市场接口（兼容原/market）
router.get('/api/quote/market', async (req, res) => {
  try {
    const etfTickers = ['DIA', 'QQQ', 'SPY'];
    const results = await Promise.all(
      etfTickers.map(ticker => limit(() => fetchStockData(ticker, true)))
    );
    res.json(results);
  } catch (err) {
    console.error('ETF市场数据获取失败:', err.message);
    res.status(500).json({ error: '获取ETF市场数据失败' });
  }
});

// 4. 所有股票数据（来自tickers.json）
router.get('/api/quote/all', async (req, res) => {
  try {
    const results = await Promise.all(
      allTickers.map(ticker => limit(() => fetchStockData(ticker)))
    );
    res.json({
      code: 200,
      message: "success",
      data: results
    });
  } catch (err) {
    console.error('全量股票数据获取失败:', err.message);
    res.status(500).json({
      code: 500,
      message: '获取全量股票数据失败',
      error: err.message
    });
  }
});

// 5. 热门股票数据
router.get('/api/quote/popular', async (req, res) => {
  try {
    const results = await Promise.all(
      popularTickers.map(ticker => limit(() => fetchStockData(ticker)))
    );
    res.json(results);
  } catch (err) {
    console.error('热门股票数据获取失败:', err.message);
    res.status(500).json({ error: '获取热门股票数据失败' });
  }
});

// 6. 单个股票查询
router.get('/api/quote/:ticker', async (req, res) => {
  const { ticker } = req.params;
  const result = await fetchStockData(ticker);
  if (result.error) {
    res.status(404).json(result);
  } else {
    res.json(result);
  }
});

// 7. 批量股票查询（POST）
router.post('/api/quote/batch', async (req, res) => {
  const { tickers } = req.body;
  if (!tickers || !Array.isArray(tickers) || tickers.length === 0) {
    return res.status(400).json({ error: '请提供有效的股票代码数组' });
  }

  try {
    const results = await Promise.all(
      tickers.map(ticker => limit(() => fetchStockData(ticker)))
    );
    res.json(results);
  } catch (err) {
    console.error('批量查询失败:', err.message);
    res.status(500).json({ error: '批量获取股票数据失败' });
  }
});

module.exports = router;