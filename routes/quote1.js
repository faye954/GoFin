const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const pLimit = require('p-limit');

const router = express.Router();
const cache = new NodeCache({ stdTTL: 30 }); // 30秒缓存
const limit = pLimit(5); // 限制并发请求数为5

const popularTickers = ['AAPL', 'TSLA', 'MSFT', 'AMZN', 'NVDA', 'GOOG', 'META', 'NFLX', 'BRK-B', 'JPM'];

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

router.get('/all', async (req, res) => {
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

module.exports = router;