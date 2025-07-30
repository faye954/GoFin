const yahooFinance = require('yahoo-finance2').default;
const { getCurrentPrice } = require('../../services/priceService');

jest.mock('yahoo-finance2', () => ({
  default: {
    quote: jest.fn()
  }
}));

describe('priceService', () => {
  const mockQuote = {
    regularMarketPrice: 150.25,
    regularMarketChangePercent: 1.5,
    regularMarketTime: 1678901234
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('getCurrentPrice returns valid data for successful request', async () => {
    yahooFinance.quote.mockResolvedValue(mockQuote);
    
    const result = await getCurrentPrice('AAPL');
    
    expect(result).toEqual({
      ticker: 'AAPL',
      price: 150.25,
      changePercent: 1.5,
      timestamp: 1678901234
    });
    expect(yahooFinance.quote).toHaveBeenCalledWith('AAPL');
  });

  test('getCurrentPrice throws error for invalid ticker', async () => {
    yahooFinance.quote.mockRejectedValue(new Error('Invalid symbol'));
    
    await expect(getCurrentPrice('INVALID')).rejects.toThrow('Could not fetch data for INVALID');
  });
});