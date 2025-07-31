// GoFin/routes/portfolio.js
const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const router = express.Router();

const BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const RANGE = '1mo';
const INTERVAL = '1d';
const RISK_FREE_RATE_DAILY = 0.0001;

const fs = require('fs').promises; // 仍可保留，防止其他地方引用

// 创建数据库连接池
const pool = mysql.createPool({
  host: `localhost`,
  port: 3306,
  user: 'root',
  password: '123456',
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

// ======================== 新增API ========================

// 获取最新的两个投资组合及其成分和权重
router.get('/api/portfolio/latest', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        // 查最新的两个组合
        const [portfolios] = await connection.execute('SELECT * FROM portfolios ORDER BY created_at DESC LIMIT 2');
        const results = [];

        for (const portfolio of portfolios) {
            const [stocks] = await connection.execute(
                'SELECT stock_symbol, proportion FROM portfolio_stocks WHERE portfolio_id = ?', 
                [portfolio.id]
            );
            results.push({
                id: portfolio.id,
                name: portfolio.name,
                stocks: stocks.map(s => ({ symbol: s.stock_symbol, proportion: s.proportion }))
            });
        }
        connection.release();
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: '数据库获取组合失败' });
    }
});

// ======================== 修改后的对比API ========================

// GET /api/portfolio/compare
router.get('/api/portfolio/compare', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        // 查最新的两个组合
        const [portfolios] = await connection.execute('SELECT * FROM portfolios ORDER BY created_at DESC LIMIT 2');
        if (portfolios.length < 2) return res.status(400).json({ error: '组合数量不足2个' });

        // 获取各自股票和权重
        let allTickersSet = new Set();
        let portfoliosWithStocks = [];
        for (const p of portfolios) {
            const [stocks] = await connection.execute(
                'SELECT stock_symbol, proportion FROM portfolio_stocks WHERE portfolio_id = ?', 
                [p.id]
            );
            portfoliosWithStocks.push(stocks);
            stocks.forEach(s => allTickersSet.add(s.stock_symbol));
        }
        const allTickers = [...allTickersSet];

        // 获取所有股票的历史数据
        const stocksData = (await Promise.all(allTickers.map(fetchStock))).filter(Boolean);
        const { dates, data } = align(stocksData);

        // 按比例数组转为 {ticker: proportion}
        function toWeightMap(list) {
            const map = {};
            let total = list.reduce((sum, s) => sum + Number(s.proportion), 0);
            list.forEach(s => map[s.stock_symbol] = Number(s.proportion) / total);
            return map;
        }
        const weights1 = toWeightMap(portfoliosWithStocks[0]);
        const weights2 = toWeightMap(portfoliosWithStocks[1]);

        // 计算收益和指标
        const val1 = calcValue(data, weights1, dates);
        const val2 = calcValue(data, weights2, dates);

        const m1 = calcMetrics(val1);
        const m2 = calcMetrics(val2);

        res.json({
            dates,
            portfolio1: val1.map(v => Number(v.toFixed(2))),
            portfolio2: val2.map(v => Number(v.toFixed(2))),
            metrics: { portfolio1: m1, portfolio2: m2 },
            names: [portfolios[0].name, portfolios[1].name],
            stocks: [
                portfoliosWithStocks[0].map(s => ({ symbol: s.stock_symbol, proportion: s.proportion })),
                portfoliosWithStocks[1].map(s => ({ symbol: s.stock_symbol, proportion: s.proportion }))
            ]
        });
        connection.release();
    } catch (err) {
        console.error('? Portfolio API error:', err.message);
        res.status(500).json({ error: 'Failed to calculate metrics' });
    }
});

// ======================== 其它已有API保留 ========================

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


// 删除投资组合
router.delete('/api/portfolio/:id', async (req, res) => {
    try {
        const portfolioId = req.params.id;
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        // 先删除关联的股票
        await connection.execute('DELETE FROM portfolio_stocks WHERE portfolio_id = ?', [portfolioId]);
        
        // 再删除投资组合
        await connection.execute('DELETE FROM portfolios WHERE id = ?', [portfolioId]);
        
        await connection.commit();
        connection.release();
        res.json({ message: '投资组合删除成功' });
    } catch (err) {
        console.error('? Delete portfolio error:', err.message);
        res.status(500).json({ error: 'Failed to delete portfolio' });
    }
});

router.get('/api/portfolio/:id', async (req, res) => {
    try {
        const portfolioId = req.params.id;
        const connection = await pool.getConnection();
        
        // 获取投资组合基本信息
        const [portfolioResult] = await connection.execute('SELECT * FROM portfolios WHERE id = ?', [portfolioId]);
        if (portfolioResult.length === 0) {
            connection.release();
            return res.status(404).json({ error: 'Portfolio not found' });
        }
        
        // 获取投资组合包含的股票
        const [stocks] = await connection.execute('SELECT stock_symbol, proportion FROM portfolio_stocks WHERE portfolio_id = ?', [portfolioId]);
        
        // 获取股票数据
        const stockDataPromises = stocks.map(stock => fetchStock(stock.stock_symbol));
        const stockDataList = await Promise.all(stockDataPromises);
        const validStockData = stockDataList.filter(Boolean);
        
        // 计算投资组合表现
        let portfolioPerformance = null;
        if (validStockData.length > 0) {
            const { dates, data } = align(validStockData);
            
            // 创建权重映射
            const weights = {};
            stocks.forEach(stock => {
                weights[stock.stock_symbol] = stock.proportion / 100; // 转换为小数
            });
            
            // 计算价值和指标
            const values = calcValue(data, weights, dates);
            const metrics = calcMetrics(values);
            
            portfolioPerformance = {
                dates,
                values: values.map(v => Number(v.toFixed(2))),
                metrics
            };
        }
        
        connection.release();
        
        res.json({
            id: portfolioResult[0].id,
            name: portfolioResult[0].name,
            created_at: portfolioResult[0].created_at,
            stocks,
            performance: portfolioPerformance
        });
    } catch (err) {
        console.error('? Get portfolio error:', err.message);
        res.status(500).json({ error: 'Failed to get portfolio details' });
    }
});

// 更新投资组合
router.put('/api/portfolio/:id', async (req, res) => {
    try {
        const portfolioId = req.params.id;
        console.log('Updating portfolio ID:', portfolioId);
        console.log('Request body:', req.body);
        const { name, stocks } = req.body;
        
        const connection = await pool.getConnection();
        await connection.beginTransaction();
        
        // 更新投资组合名称
        await connection.execute('UPDATE portfolios SET name = ? WHERE id = ?', [name, portfolioId]);
        
        // 先删除原有股票关联
        await connection.execute('DELETE FROM portfolio_stocks WHERE portfolio_id = ?', [portfolioId]);
        
        // 添加新的股票关联
        for (const stock of stocks) {
            await connection.execute(
                'INSERT INTO portfolio_stocks (portfolio_id, stock_symbol, proportion) VALUES (?, ?, ?)', 
                [portfolioId, stock.stock_symbol, stock.proportion]
            );
        }
        
        await connection.commit();
        connection.release();
        res.json({ message: '投资组合更新成功' });
    } catch (err) {
        console.error('? Update portfolio error:', err.message);
        // 发生错误时回滚事务
        if (connection) {
            await connection.rollback();
            connection.release();
        }
        res.status(500).json({ error: 'Failed to update portfolio' });
    }
});

module.exports = router;
