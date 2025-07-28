const yahooFinance = require('yahoo-finance2').default;

exports.getCurrentPrice = async (ticker) => {
  try {
    const quote = await yahooFinance.quote(ticker);
    return {
      ticker,
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent,
      timestamp: quote.regularMarketTime
    };
  } catch (error) {
    console.error(`Error fetching price for ${ticker}:`, error);
    throw new Error(`Could not fetch data for ${ticker}`);
  }
};