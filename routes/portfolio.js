// GoFin/routes/portfolio.js
const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const router = express.Router();

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const RANGE = '1mo';
const INTERVAL = '1d';
const RISK_FREE_RATE_DAILY = 0.0001;

// 第一组代码中 portfolio.js 的顶部
const fs = require('fs').promises; // 关键：引入了 fs 模块

// 创建数据库连接池
const pool = mysql.createPool({
  host: `localhost`,
  port: 3306,
  user: `root`,
  password: `n3u3da!`,
    database: 'gofin_portfolios'
});

// 获取单个股票数据
async function fetchStock(ticker) {
    const url = `${BASE_URL}${ticker}?range=${RANGE}&interval=${INTERVAL}`;
    try {
        const res = await axios.get(url);
        const result = res.data.chart.result?.[0];
        if (!result) return null;
        const dates = result.timestamp.map(ts => new Date(ts * 1000).toISOString().split('T')[0]);
        const closes = result.indicators.adjclose[0].adjclose;
        return { ticker, dates, closes };
    } catch (err) {
        console.warn(`?? ${ticker} failed: ${err.message}`);
        return null;
    }
}

// 对齐多个股票数据
function align(stockList) {
    const commonDates = stockList.map(s => s.dates).reduce((a, b) => a.filter(d => b.includes(d)));
    const data = {};
    for (const stock of stockList) {
        data[stock.ticker] = commonDates.map(d => {
            const i = stock.dates.indexOf(d);
            return stock.closes[i] ?? null;
        });
    }
    return { dates: commonDates, data };
}

// 计算投资组合价值
function calcValue(data, weights, dates) {
    const tickers = Object.keys(weights);
    return dates.map((_, i) =>
        tickers.reduce((sum, t) => sum + (data[t][i] ?? 0) * weights[t], 0)
    );
}

function computeDailyReturns(values) {
    const returns = [];
    for (let i = 1; i < values.length; i++) {
        const prev = values[i - 1];
        const curr = values[i];
        if (prev !== 0 && prev !== null && curr !== null) {
            returns.push((curr - prev) / prev);
        }
    }
    return returns;
}

// 计算投资组合指标
function calcMetrics(values) {
    if (!Array.isArray(values) || values.length < 2 || values.includes(null)) {
        return {
            totalReturn: 'N/A',
            volatility: 'N/A',
            sharpe: 'N/A',
            maxDrawdown: 'N/A'
        };
    }

    const returns = computeDailyReturns(values);
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const std = Math.sqrt(returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length);
    const sharpe = (mean - RISK_FREE_RATE_DAILY) / std * Math.sqrt(252);
    const totalReturn = (values[values.length - 1] / values[0]) - 1;

    let peak = values[0];
    let maxDrawdown = 0;
    for (let i = 1; i < values.length; i++) {
        if (values[i] > peak) peak = values[i];
        const drawdown = (values[i] - peak) / peak;
        if (drawdown < maxDrawdown) maxDrawdown = drawdown;
    }

    return {
        totalReturn: (totalReturn * 100).toFixed(2) + '%',
        volatility: (std * Math.sqrt(252) * 100).toFixed(2) + '%',
        sharpe: sharpe.toFixed(2),
        maxDrawdown: (maxDrawdown * 100).toFixed(2) + '%'
    };
}

// 创建投资组合
router.post('/api/portfolio/create', async (req, res) => {
    try {
        const { name, stocks } = req.body;
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        // 插入投资组合信息
        const [portfolioResult] = await connection.execute('INSERT INTO portfolios (name) VALUES (?)', [name]);
        const portfolioId = portfolioResult.insertId;

        // 插入投资组合股票关联信息
        for (const stock of stocks) {
            await connection.execute('INSERT INTO portfolio_stocks (portfolio_id, stock_symbol, proportion) VALUES (?, ?, ?)', [portfolioId, stock.symbol, stock.proportion]);
        }

        await connection.commit();
        connection.release();
        res.status(201).json({ message: '投资组合创建成功' });
    } catch (err) {
        console.error('? Portfolio API error:', err.message);
        res.status(500).json({ error: 'Failed to create portfolio' });
    }
});

// 获取所有投资组合
router.get('/api/portfolio/all', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [portfolios] = await connection.execute('SELECT * FROM portfolios');
        const portfolioList = [];

        for (const portfolio of portfolios) {
            const [stocks] = await connection.execute('SELECT stock_symbol, proportion FROM portfolio_stocks WHERE portfolio_id = ?', [portfolio.id]);
            portfolioList.push({
                id: portfolio.id,
                name: portfolio.name,
                created_at: portfolio.created_at,
                stocks
            });
        }

        connection.release();
        res.json(portfolioList);
    } catch (err) {
        console.error('? Portfolio API error:', err.message);
        res.status(500).json({ error: 'Failed to get portfolios' });
    }
});

// GET /api/portfolio/compare
router.get('/api/portfolio/compare', async (req, res) => {
    try {
        const tickers = JSON.parse(await fs.readFile('./tickers.json', 'utf8'));
        const portfolio1 = tickers.slice(0, 10);
        const portfolio2 = tickers.slice(50, 60);
        const all = [...new Set([...portfolio1, ...portfolio2])];

        const stocks = (await Promise.all(all.map(fetchStock))).filter(Boolean);
        const { dates, data } = align(stocks);

        const getWeights = list => {
            const w = {};
            list.forEach(t => w[t] = 1 / list.length);
            return w;
        };

        const val1 = calcValue(data, getWeights(portfolio1), dates);
        const val2 = calcValue(data, getWeights(portfolio2), dates);

        const m1 = calcMetrics(val1);
        const m2 = calcMetrics(val2);

        res.json({
            dates,
            portfolio1: val1.map(v => Number(v.toFixed(2))),
            portfolio2: val2.map(v => Number(v.toFixed(2))),
            metrics: { portfolio1: m1, portfolio2: m2 }
        });
    } catch (err) {
        console.error('? Portfolio API error:', err.message);
        res.status(500).json({ error: 'Failed to calculate metrics' });
    }
});

module.exports = router;