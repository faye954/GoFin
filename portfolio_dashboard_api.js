// server.js
const express = require('express');
const app = express();
const portfolioRoutes = require('./routes/portfolio');
const cors = require('cors');

app.use(cors());
app.use(express.json());

app.use('/api/portfolio', portfolioRoutes);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// routes/portfolio.js
const express = require('express');
const router = express.Router();
const { getCurrentPrice } = require('../services/priceService');
const { calculatePortfolio } = require('../utils/calc');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/portfolios.json');

const readPortfolios = () => {
  const data = fs.readFileSync(DATA_FILE);
  return JSON.parse(data);
};

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const portfolios = readPortfolios();
  const selected = portfolios[id];
  if (!selected) return res.status(404).json({ error: 'Portfolio not found' });

  const result = await calculatePortfolio(selected, getCurrentPrice);
  res.json(result);
});

router.get('/compare', async (req, res) => {
  const { id1, id2 } = req.query;
  const portfolios = readPortfolios();

  const p1 = await calculatePortfolio(portfolios[id1], getCurrentPrice);
  const p2 = await calculatePortfolio(portfolios[id2], getCurrentPrice);

  res.json({ portfolioA: p1, portfolioB: p2 });
});

router.post('/', (req, res) => {
  const { portfolioId, stocks } = req.body;
  const portfolios = readPortfolios();
  portfolios[portfolioId] = stocks;
  fs.writeFileSync(DATA_FILE, JSON.stringify(portfolios, null, 2));
  res.json({ message: 'Saved successfully' });
});

module.exports = router;

// services/priceService.js
const yahooFinance = require('yahoo-finance2').default;

exports.getCurrentPrice = async (ticker) => {
  try {
    const quote = await yahooFinance.quote(ticker);
    return {
      ticker,
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent
    };
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    return { ticker, price: 0, changePercent: 0 };
  }
};

// utils/calc.js
exports.calculatePortfolio = async (portfolio, getPriceFn) => {
  let totalCost = 0;
  let totalValue = 0;

  const enriched = await Promise.all(
    portfolio.map(async (item) => {
      const quote = await getPriceFn(item.ticker);
      const cost = item.purchasePrice * item.volume;
      const value = quote.price * item.volume;
      const profit = value - cost;

      totalCost += cost;
      totalValue += value;

      return {
        ...item,
        currentPrice: quote.price,
        changePercent: quote.changePercent,
        value,
        profit
      };
    })
  );

  return {
    stocks: enriched,
    totalCost,
    totalValue,
    totalProfit: totalValue - totalCost
  };
};

// data/portfolios.json
{
  "A": [
    { "ticker": "AAPL", "volume": 10, "purchasePrice": 150 },
    { "ticker": "TSLA", "volume": 5, "purchasePrice": 600 }
  ],
  "B": [
    { "ticker": "MSFT", "volume": 8, "purchasePrice": 250 },
    { "ticker": "GOOG", "volume": 3, "purchasePrice": 1200 }
  ]
}
