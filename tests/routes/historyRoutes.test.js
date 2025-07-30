const request = require('supertest');
const app = require('../../app');
const axios = require('axios');

jest.mock('axios');

describe('History Routes', () => {
  const mockResponse = {
    data: {
      chart: {
        result: [{
          timestamp: [1677628800, 1677715200],
          indicators: {
            adjclose: [{ adjclose: [150.25, 152.30] }],
            quote: [{ volume: [1000000, 1200000] }]
          }
        }]
      }
    }
  };

  test('GET /history/:ticker returns historical data', async () => {
    axios.get.mockResolvedValue(mockResponse);

    const res = await request(app).get('/history/AAPL');
    
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([
      { date: '2023-03-01', price: 150.25 },
      { date: '2023-03-02', price: 152.30 }
    ]);
  });

  test('GET /history/:ticker handles null prices', async () => {
    const modifiedResponse = JSON.parse(JSON.stringify(mockResponse));
    modifiedResponse.data.chart.result[0].indicators.adjclose[0].adjclose[1] = null;
    
    axios.get.mockResolvedValue(modifiedResponse);

    const res = await request(app).get('/history/AAPL');
    
    expect(res.body).toEqual([
      { date: '2023-03-01', price: 150.25 }
    ]);
  });

  test('GET /history/:ticker handles API errors', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    
    const res = await request(app).get('/history/AAPL');
    
    expect(res.statusCode).toBe(500);
    expect(res.body).toEqual({ error: 'Failed to fetch price history' });
  });
});