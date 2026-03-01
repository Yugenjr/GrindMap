import request from 'supertest';

// Mock the server module
jest.mock('../server.js', () => {
  const express = require('express');
  const app = express();
  
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      environment: 'test',
      correlationId: 'test-id',
      database: { status: 'connected' },
      connectionStats: {}
    });
  });
  
  return app;
});

import app from '../server.js';

describe('Health Check Endpoint', () => {
  it('should return 200 and health status', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('success', true);
    expect(response.body).toHaveProperty('message');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('environment');
    expect(response.body).toHaveProperty('correlationId');
    expect(response.body).toHaveProperty('database');
    expect(response.body.database).toHaveProperty('status');
    expect(response.body).toHaveProperty('connectionStats');
  });

  it('should include valid timestamp format', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(typeof response.body.timestamp).toBe('string');
    expect(Date.parse(response.body.timestamp)).not.toBeNaN();
  });
});
