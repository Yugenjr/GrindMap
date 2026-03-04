import BaseNormalizer from './common.normalizer.js';
import { normalizeLeetCode } from './leetcode.normalizer.js';
import { normalizeCodeforces } from './codeforces.normalizer.js';
import { normalizeCodeChef } from './codechef.normalizer.js';

describe('Normalizer Tests', () => {
  describe('BaseNormalizer', () => {
    test('should throw error for invalid input', () => {
      expect(() => new BaseNormalizer()).toThrow('Normalizer requires input object with { username, data }');
      expect(() => new BaseNormalizer({})).toThrow('Normalizer requires input object with { username, data }');
      expect(() => new BaseNormalizer({ username: 'test' })).toThrow('Normalizer requires input object with { username, data }');
      expect(() => new BaseNormalizer({ data: {} })).toThrow('Normalizer requires input object with { username, data }');
    });

    test('should initialize correctly with valid input', () => {
      const input = { username: 'testuser', data: { rating: 1500, totalSolved: 100 } };
      const normalizer = new BaseNormalizer(input);

      expect(normalizer.username).toBe('testuser');
      expect(normalizer.rawData).toEqual({ rating: 1500, totalSolved: 100 });
    });

    test('should throw error for platform getter', () => {
      const input = { username: 'testuser', data: {} };
      const normalizer = new BaseNormalizer(input);

      expect(() => normalizer.platform).toThrow('Subclasses must implement platform getter');
    });

    test('should return correct common fields', () => {
      const input = { username: 'testuser', data: { rating: 1500, totalSolved: 100, rank: 500 } };
      const normalizer = new BaseNormalizer(input);

      expect(normalizer.rating).toBe(1500);
      expect(normalizer.totalSolved).toBe(100);
      expect(normalizer.rank).toBe(500);
    });

    test('should handle missing fields gracefully', () => {
      const input = { username: 'testuser', data: {} };
      const normalizer = new BaseNormalizer(input);

      expect(normalizer.rating).toBe(0);
      expect(normalizer.totalSolved).toBe(0);
      expect(normalizer.rank).toBe(null);
    });

    test('should return consistent normalize structure', () => {
      const input = { username: 'testuser', data: { rating: 1500, totalSolved: 100, rank: 500 } };
      const normalizer = new BaseNormalizer(input);

      // Mock platform getter
      Object.defineProperty(normalizer, 'platform', { get: () => 'TEST_PLATFORM' });

      const result = normalizer.normalize();
      expect(result).toEqual({
        platform: 'TEST_PLATFORM',
        username: 'testuser',
        rating: 1500,
        totalSolved: 100,
        rank: 500,
      });
    });
  });

  describe('LeetCode Normalizer', () => {
    const sampleLeetCodeData = {
      ranking: 12345,
      reputation: 250,
      easySolved: 50,
      mediumSolved: 75,
      hardSolved: 25,
      totalSolved: 150,
      rating: 1800,
    };

    test('should normalize LeetCode data correctly', () => {
      const input = { username: 'leetcode_user', data: sampleLeetCodeData };
      const result = normalizeLeetCode(input);

      expect(result).toEqual({
        platform: 'LEETCODE',
        username: 'leetcode_user',
        rating: 1800,
        totalSolved: 150,
        rank: 12345,
        solvedToday: null,
        difficulty: {
          easy: 50,
          medium: 75,
          hard: 25,
        },
        reputation: 250,
      });
    });

    test('should handle missing LeetCode fields', () => {
      const input = { username: 'leetcode_user', data: {} };
      const result = normalizeLeetCode(input);

      expect(result).toEqual({
        platform: 'LEETCODE',
        username: 'leetcode_user',
        rating: 0,
        totalSolved: 0,
        rank: null,
        solvedToday: null,
        difficulty: {
          easy: 0,
          medium: 0,
          hard: 0,
        },
        reputation: 0,
      });
    });
  });

  describe('Codeforces Normalizer', () => {
    const sampleCodeforcesData = {
      rating: 1650,
      maxRating: 1800,
      totalSolved: 200,
      rank: 'specialist',
    };

    test('should normalize Codeforces data correctly', () => {
      const input = { username: 'codeforces_user', data: sampleCodeforcesData };
      const result = normalizeCodeforces(input);

      expect(result).toEqual({
        platform: 'codeforces',
        username: 'codeforces_user',
        rating: 1650,
        totalSolved: 200,
        rank: 'specialist',
        maxRating: 1800,
      });
    });

    test('should handle missing Codeforces fields', () => {
      const input = { username: 'codeforces_user', data: {} };
      const result = normalizeCodeforces(input);

      expect(result).toEqual({
        platform: 'codeforces',
        username: 'codeforces_user',
        rating: 0,
        totalSolved: 0,
        rank: null,
        maxRating: 0,
      });
    });
  });

  describe('CodeChef Normalizer', () => {
    const sampleCodeChefData = {
      rating: 1700,
      problemsSolved: 180,
      globalRank: 5432,
      countryRank: 123,
      stars: 5,
    };

    test('should normalize CodeChef data correctly', () => {
      const input = { username: 'codechef_user', data: sampleCodeChefData };
      const result = normalizeCodeChef(input);

      expect(result).toEqual({
        platform: 'codechef',
        username: 'codechef_user',
        rating: 1700,
        totalSolved: 180,
        rank: 5432,
        countryRank: 123,
        totalStars: 5,
      });
    });

    test('should handle missing CodeChef fields', () => {
      const input = { username: 'codechef_user', data: {} };
      const result = normalizeCodeChef(input);

      expect(result).toEqual({
        platform: 'codechef',
        username: 'codechef_user',
        rating: 0,
        totalSolved: 0,
        rank: null,
        countryRank: null,
        totalStars: 0,
      });
    });
  });

  describe('Output Consistency', () => {
    test('all normalizers should have consistent base structure', () => {
      const leetCodeInput = { username: 'user', data: { rating: 1500, totalSolved: 100, ranking: 500 } };
      const codeforcesInput = { username: 'user', data: { rating: 1500, totalSolved: 100, rank: 500 } };
      const codechefInput = { username: 'user', data: { rating: 1500, problemsSolved: 100, globalRank: 500 } };

      const leetCodeResult = normalizeLeetCode(leetCodeInput);
      const codeforcesResult = normalizeCodeforces(codeforcesInput);
      const codechefResult = normalizeCodeChef(codechefInput);

      // All should have the base fields
      ['platform', 'username', 'rating', 'totalSolved', 'rank'].forEach(field => {
        expect(leetCodeResult).toHaveProperty(field);
        expect(codeforcesResult).toHaveProperty(field);
        expect(codechefResult).toHaveProperty(field);
      });

      // All should have the same username and common values
      expect(leetCodeResult.username).toBe('user');
      expect(codeforcesResult.username).toBe('user');
      expect(codechefResult.username).toBe('user');

      expect(leetCodeResult.rating).toBe(1500);
      expect(codeforcesResult.rating).toBe(1500);
      expect(codechefResult.rating).toBe(1500);

      expect(leetCodeResult.totalSolved).toBe(100);
      expect(codeforcesResult.totalSolved).toBe(100);
      expect(codechefResult.totalSolved).toBe(100);

      expect(leetCodeResult.rank).toBe(500);
      expect(codeforcesResult.rank).toBe(500);
      expect(codechefResult.rank).toBe(500);
    });

    test('platform field should be consistent with platform constants', () => {
      const leetCodeInput = { username: 'user', data: {} };
      const codeforcesInput = { username: 'user', data: {} };
      const codechefInput = { username: 'user', data: {} };

      expect(normalizeLeetCode(leetCodeInput).platform).toBe('LEETCODE');
      expect(normalizeCodeforces(codeforcesInput).platform).toBe('codeforces');
      expect(normalizeCodeChef(codechefInput).platform).toBe('codechef');
    });
  });

  describe('Error Handling', () => {
    test('should throw error for invalid inputs across all normalizers', () => {
      const invalidInputs = [null, undefined, {}, { username: 'test' }, { data: {} }];

      invalidInputs.forEach(invalidInput => {
        expect(() => normalizeLeetCode(invalidInput)).toThrow();
        expect(() => normalizeCodeforces(invalidInput)).toThrow();
        expect(() => normalizeCodeChef(invalidInput)).toThrow();
      });
    });
  });
});
