import { jest } from '@jest/globals';
import request from 'supertest';

// Mock the scraper modules
jest.mock('../services/scraping/leetcode.scraper.js', () => ({
  scrapeLeetCode: jest.fn()
}));

jest.mock('../services/scraping/codeforces.scraper.js', () => ({
  fetchCodeforcesStats: jest.fn()
}));

jest.mock('../services/scraping/codechef.scraper.js', () => ({
  fetchCodeChefStats: jest.fn()
}));

// Mock normalizers
jest.mock('../services/normalization/codeforces.normalizer.js', () => ({
  normalizeCodeforces: jest.fn()
}));

jest.mock('../services/normalization/codechef.normalizer.js', () => ({
  normalizeCodeChef: jest.fn()
}));

// Import mocked functions
import { scrapeLeetCode } from '../services/scraping/leetcode.scraper.js';
import { fetchCodeforcesStats } from '../services/scraping/codeforces.scraper.js';
import { fetchCodeChefStats } from '../services/scraping/codechef.scraper.js';
import { normalizeCodeforces } from '../services/normalization/codeforces.normalizer.js';
import { normalizeCodeChef } from '../services/normalization/codechef.normalizer.js';

// Import app AFTER mocks
import app from '../server.js';

describe('API Integration Tests (Scrape Routes)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/scrape/leetcode/:username', () => {
    it('should return LeetCode data on success', async () => {
      const mockData = {
        totalSolved: 150,
        easySolved: 75,
        mediumSolved: 50,
        hardSolved: 25
      };

      scrapeLeetCode.mockResolvedValue(mockData);

      const response = await request(app)
        .get('/api/scrape/leetcode/testuser')
        .expect(200);

      expect(scrapeLeetCode).toHaveBeenCalledWith('testuser');
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/scrape/codeforces/:username', () => {
    it('should return normalized Codeforces data on success', async () => {
      const mockRaw = {
        rating: 1500,
        maxRating: 1600,
        rank: 'specialist',
        totalSolved: 200
      };

      const mockNormalized = {
        platform: 'codeforces',
        username: 'testuser',
        stats: {
          totalSolved: 200,
          rating: 1500,
          rank: 'specialist',
          maxRating: 1600
        },
        streak: { current: 0, max: 0 },
        activity: []
      };

      fetchCodeforcesStats.mockResolvedValue(mockRaw);
      normalizeCodeforces.mockReturnValue(mockNormalized);

      const response = await request(app)
        .get('/api/scrape/codeforces/testuser')
        .expect(200);

      expect(fetchCodeforcesStats).toHaveBeenCalledWith('testuser');
      expect(normalizeCodeforces).toHaveBeenCalled();
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('GET /api/scrape/codechef/:username', () => {
    it('should return normalized CodeChef data on success', async () => {
      const mockRaw = {
        rating: 1800,
        maxRating: 1900,
        rank: '4★',
        totalSolved: 150
      };

      const mockNormalized = {
        platform: 'codechef',
        username: 'testuser',
        stats: {
          totalSolved: 150,
          rating: 1800,
          rank: '4★',
          maxRating: 1900
        },
        streak: { current: 0, max: 0 },
        activity: []
      };

      fetchCodeChefStats.mockResolvedValue(mockRaw);
      normalizeCodeChef.mockReturnValue(mockNormalized);

      const response = await request(app)
        .get('/api/scrape/codechef/testuser')
        .expect(200);

      expect(fetchCodeChefStats).toHaveBeenCalledWith('testuser');
      expect(normalizeCodeChef).toHaveBeenCalled();
      expect(response.body).toHaveProperty('success', true);
    });
  });
});
