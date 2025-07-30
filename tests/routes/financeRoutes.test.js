const request = require('supertest');
const app = require('../../app'); // Your express app
const { getCurrentPrice } = require('../../services/priceService');

jest.mock('../../services/priceService');

describe('Finance Routes', () => {
  test('GET /finance/:ticker returns stock data', async () => {
    getCurrentPrice.mockResolvedValue({
      ticker: 'AAPL',
      price: 175.25,
      changePercent: 2.1,
      timestamp: 1678905678
    });

    const res = await request(app).get('/finance/AAPL');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      ticker: 'AAPL',
      price: 175.25,
      changePercent: 2.1,
      timestamp: 1678905678
    });
  });

  test('GET /finance/:ticker handles errors', async () => {
    getCurrentPrice.mockRejectedValue(new Error('Service error'));
    
    const res = await request(app).get('/finance/INVALID');
    
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Service error' });
  });
});