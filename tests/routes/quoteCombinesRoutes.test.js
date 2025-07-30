const request = require('supertest');
const app = require('../../app');
const axios = require('axios');
const NodeCache = require('node-cache');

jest.mock('axios');
jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn()
  }));
});

describe('Combined Quotes Routes', () => {
  const mockCache = new NodeCache();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/getMarketOverview', () => {
    const mockData = {
      chart: {
        result: [{
          meta: {
            regularMarketPrice: 350.25,
            chartPreviousClose: 348.50,
            regularMarketDayHigh: 352.00,
            regularMarketDayLow: 349.00
          },
          indicators: {
            quote: [{
              close: [347.8, 348.2, 348.5, 349.1, 350.25]
            }]
          }
        }]
      }
    };

    test('returns market overview data', async () => {
      axios.get.mockResolvedValue({ data: mockData });

      const res = await request(app).get('/api/getMarketOverview');

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveLength(3);
    });
  });

  describe('GET /api/quote/all', () => {
    test('returns formatted quote data', async () => {
      axios.get.mockResolvedValue({
        data: {
          chart: {
            result: [{
              meta: {
                regularMarketPrice: 175.25,
                chartPreviousClose: 174.00,
                symbol: 'AAPL',
                instrumentType: 'Equity'
              },
              indicators: {
                quote: [{ volume: [1000000, 1200000] }]
              }
            }]
          }
        }
      });

      const res = await request(app).get('/api/quote/all');

      expect(res.statusCode).toBe(200);
      expect(res.body.data[0]).toEqual({
        ticker: 'AAPL',
        shortName: 'AAPL',
        longName: 'Equity',
        price: 175.25,
        change: 1.25,
        changePercent: 0.72,
        volume: 1200000
      });
    });
  });

  describe('GET /api/quote/:ticker', () => {
    test('returns single quote data', async () => {
      axios.get.mockResolvedValue({
        data: {
          chart: {
            result: [{
              meta: {
                regularMarketPrice: 175.25,
                chartPreviousClose: 174.00,
              },
              indicators: {
                quote: [{ volume: [1000000, 1200000] }]
              }
            }]
          }
        }
      });

      const res = await request(app).get('/api/quote/AAPL');

      expect(res.body).toEqual({
        ticker: 'AAPL',
        price: 175.25,
        change: 1.25,
        changePercent: 0.72,
        volume: 1200000
      });
    });
  });
});
