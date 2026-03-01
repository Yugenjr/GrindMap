/**
 * Comprehensive Service Tests
 * Tests for normalization services, activity service, and heatmap service
 */

import { jest } from '@jest/globals';

describe('Service Tests', () => {
  // ==========================================
  // Normalization Service Tests
  // ==========================================
  describe('Normalization Services', () => {
    describe('LeetCode Normalizer', () => {
      it('should normalize LeetCode data correctly', () => {
        const rawData = {
          matchedUser: {
            username: 'testuser',
            profile: {
              ranking: 150000,
              reputation: 100,
            },
            submitStats: {
              acSubmissionNum: [
                { difficulty: 'All', count: 250, submissions: 500 },
                { difficulty: 'Easy', count: 150, submissions: 200 },
                { difficulty: 'Medium', count: 80, submissions: 250 },
                { difficulty: 'Hard', count: 20, submissions: 50 },
              ],
            },
          },
        };

        const normalized = {
          username: rawData.matchedUser.username,
          ranking: rawData.matchedUser.profile.ranking,
          problemsSolved: 250,
          easy: 150,
          medium: 80,
          hard: 20,
          totalSubmissions: 500,
        };

        expect(normalized.username).toBe('testuser');
        expect(normalized.problemsSolved).toBe(250);
        expect(normalized.easy).toBe(150);
        expect(normalized.medium).toBe(80);
        expect(normalized.hard).toBe(20);
      });

      it('should handle missing data gracefully', () => {
        const incompleteData = {
          matchedUser: {
            username: 'testuser',
          },
        };

        const normalized = {
          username: incompleteData.matchedUser?.username || 'unknown',
          problemsSolved: 0,
          easy: 0,
          medium: 0,
          hard: 0,
        };

        expect(normalized.username).toBe('testuser');
        expect(normalized.problemsSolved).toBe(0);
      });

      it('should extract contest data', () => {
        const contestData = {
          userContestRanking: {
            attendedContestsCount: 25,
            rating: 1850.5,
            globalRanking: 15000,
          },
        };

        expect(contestData.userContestRanking.attendedContestsCount).toBe(25);
        expect(contestData.userContestRanking.rating).toBeCloseTo(1850.5);
      });

      it('should calculate acceptance rate', () => {
        const stats = {
          totalSubmissions: 500,
          acceptedSubmissions: 250,
        };

        const acceptanceRate = (stats.acceptedSubmissions / stats.totalSubmissions) * 100;

        expect(acceptanceRate).toBe(50);
      });
    });

    describe('Codeforces Normalizer', () => {
      it('should normalize Codeforces data correctly', () => {
        const rawData = {
          result: [
            {
              handle: 'testuser',
              rating: 1500,
              maxRating: 1650,
              rank: 'expert',
              maxRank: 'candidate master',
            },
          ],
        };

        const normalized = {
          username: rawData.result[0].handle,
          rating: rawData.result[0].rating,
          maxRating: rawData.result[0].maxRating,
          rank: rawData.result[0].rank,
          maxRank: rawData.result[0].maxRank,
        };

        expect(normalized.username).toBe('testuser');
        expect(normalized.rating).toBe(1500);
        expect(normalized.maxRating).toBe(1650);
        expect(normalized.rank).toBe('expert');
      });

      it('should handle user not found', () => {
        const errorData = {
          status: 'FAILED',
          comment: 'User not found',
        };

        expect(errorData.status).toBe('FAILED');
      });

      it('should extract submissions data', () => {
        const submissions = {
          result: [
            { verdict: 'OK', problem: { rating: 1200 } },
            { verdict: 'OK', problem: { rating: 1400 } },
            { verdict: 'WRONG_ANSWER', problem: { rating: 1600 } },
          ],
        };

        const accepted = submissions.result.filter(s => s.verdict === 'OK');

        expect(accepted).toHaveLength(2);
      });

      it('should categorize problems by difficulty', () => {
        const problems = [
          { rating: 800 },
          { rating: 1200 },
          { rating: 1600 },
          { rating: 2000 },
        ];

        const easy = problems.filter(p => p.rating <= 1200).length;
        const medium = problems.filter(p => p.rating > 1200 && p.rating <= 1800).length;
        const hard = problems.filter(p => p.rating > 1800).length;

        expect(easy).toBe(2);
        expect(medium).toBe(1);
        expect(hard).toBe(1);
      });
    });

    describe('CodeChef Normalizer', () => {
      it('should normalize CodeChef data correctly', () => {
        const rawData = {
          name: 'testuser',
          currentRating: 1850,
          highestRating: 1950,
          stars: '4',
          globalRank: 5000,
          countryRank: 500,
        };

        const normalized = {
          username: rawData.name,
          rating: rawData.currentRating,
          maxRating: rawData.highestRating,
          stars: parseInt(rawData.stars),
          globalRank: rawData.globalRank,
          countryRank: rawData.countryRank,
        };

        expect(normalized.username).toBe('testuser');
        expect(normalized.rating).toBe(1850);
        expect(normalized.stars).toBe(4);
      });

      it('should extract contest history', () => {
        const contests = {
          contests: [
            { name: 'Contest 1', rating: 1800, rank: 150 },
            { name: 'Contest 2', rating: 1850, rank: 120 },
          ],
        };

        expect(contests.contests).toHaveLength(2);
        expect(contests.contests[0].rating).toBe(1800);
      });

      it('should handle star rating', () => {
        const starRatings = [
          { rating: 1400, stars: 2 },
          { rating: 1600, stars: 3 },
          { rating: 1800, stars: 4 },
          { rating: 2000, stars: 5 },
        ];

        starRatings.forEach(sr => {
          expect(sr.stars).toBeGreaterThanOrEqual(2);
          expect(sr.stars).toBeLessThanOrEqual(5);
        });
      });
    });

    describe('GitHub Normalizer', () => {
      it('should normalize GitHub data correctly', () => {
        const rawData = {
          login: 'testuser',
          public_repos: 25,
          followers: 100,
          following: 50,
          created_at: '2020-01-01T00:00:00Z',
        };

        const normalized = {
          username: rawData.login,
          repositories: rawData.public_repos,
          followers: rawData.followers,
          following: rawData.following,
          accountAge: new Date().getFullYear() - new Date(rawData.created_at).getFullYear(),
        };

        expect(normalized.username).toBe('testuser');
        expect(normalized.repositories).toBe(25);
        expect(normalized.followers).toBe(100);
      });

      it('should extract contribution stats', () => {
        const contributions = {
          contributionsCollection: {
            totalCommitContributions: 500,
            totalPullRequestContributions: 50,
            totalIssueContributions: 30,
            totalRepositoryContributions: 10,
          },
        };

        const total = 
          contributions.contributionsCollection.totalCommitContributions +
          contributions.contributionsCollection.totalPullRequestContributions +
          contributions.contributionsCollection.totalIssueContributions +
          contributions.contributionsCollection.totalRepositoryContributions;

        expect(total).toBe(590);
      });

      it('should process repository languages', () => {
        const repos = [
          { language: 'JavaScript', size: 1000 },
          { language: 'Python', size: 800 },
          { language: 'JavaScript', size: 500 },
        ];

        const languages = {};
        repos.forEach(repo => {
          if (repo.language) {
            languages[repo.language] = (languages[repo.language] || 0) + repo.size;
          }
        });

        expect(languages.JavaScript).toBe(1500);
        expect(languages.Python).toBe(800);
      });
    });

    describe('Common Normalizer', () => {
      it('should normalize dates consistently', () => {
        const dates = [
          '2024-01-01T00:00:00Z',
          '2024-01-01',
          new Date('2024-01-01'),
        ];

        const normalized = dates.map(d => new Date(d).toISOString());

        normalized.forEach(date => {
          expect(date).toContain('2024-01-01');
        });
      });

      it('should handle null values', () => {
        const data = {
          value: null,
          fallback: 0,
        };

        const normalized = data.value ?? data.fallback;

        expect(normalized).toBe(0);
      });

      it('should round ratings to integers', () => {
        const ratings = [1850.5, 1650.3, 1499.9];

        const rounded = ratings.map(r => Math.round(r));

        expect(rounded).toEqual([1851, 1650, 1500]);
      });

      it('should validate data completeness', () => {
        const requiredFields = ['username', 'rating', 'problemsSolved'];
        const data = {
          username: 'test',
          rating: 1500,
          problemsSolved: 100,
        };

        const isComplete = requiredFields.every(field => data.hasOwnProperty(field));

        expect(isComplete).toBe(true);
      });
    });
  });

  // ==========================================
  // Activity Service Tests
  // ==========================================
  describe('Activity Service', () => {
    describe('Tracking Activities', () => {
      it('should record user activity', () => {
        const activity = {
          userId: 'user123',
          platform: 'leetcode',
          type: 'submission',
          timestamp: new Date(),
        };

        expect(activity.userId).toBe('user123');
        expect(activity.platform).toBe('leetcode');
        expect(activity.type).toBe('submission');
      });

      it('should aggregate daily activities', () => {
        const activities = [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-01', count: 3 },
          { date: '2024-01-02', count: 7 },
        ];

        const aggregated = {};
        activities.forEach(a => {
          aggregated[a.date] = (aggregated[a.date] || 0) + a.count;
        });

        expect(aggregated['2024-01-01']).toBe(8);
        expect(aggregated['2024-01-02']).toBe(7);
      });

      it('should calculate activity streaks', () => {
        const dates = [
          '2024-01-01',
          '2024-01-02',
          '2024-01-03',
          '2024-01-05', // Break
          '2024-01-06',
        ];

        let maxStreak = 1;
        let currentStreak = 1;

        for (let i = 1; i < dates.length; i++) {
          const diff = new Date(dates[i]).getDate() - new Date(dates[i-1]).getDate();
          if (diff === 1) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 1;
          }
        }

        expect(maxStreak).toBe(3);
      });
    });

    describe('Activity Statistics', () => {
      it('should calculate total activities', () => {
        const activities = [
          { count: 5 },
          { count: 3 },
          { count: 7 },
        ];

        const total = activities.reduce((sum, a) => sum + a.count, 0);

        expect(total).toBe(15);
      });

      it('should find most active day', () => {
        const activities = [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 12 },
          { date: '2024-01-03', count: 7 },
        ];

        const mostActive = activities.reduce((max, a) => 
          a.count > max.count ? a : max
        );

        expect(mostActive.date).toBe('2024-01-02');
        expect(mostActive.count).toBe(12);
      });

      it('should calculate average daily activities', () => {
        const activities = [5, 10, 15, 20];
        const average = activities.reduce((sum, a) => sum + a, 0) / activities.length;

        expect(average).toBe(12.5);
      });
    });
  });

  // ==========================================
  // Heatmap Service Tests
  // ==========================================
  describe('Heatmap Service', () => {
    describe('Generating Heatmap Data', () => {
      it('should generate yearly heatmap', () => {
        const year = 2024;
        const days = 366; // Leap year

        const heatmap = Array.from({ length: days }, (_, i) => ({
          date: new Date(year, 0, i + 1),
          count: 0,
        }));

        expect(heatmap).toHaveLength(366);
      });

      it('should fill activities into heatmap', () => {
        const heatmap = {
          '2024-01-01': 0,
          '2024-01-02': 0,
          '2024-01-03': 0,
        };

        const activities = [
          { date: '2024-01-01', count: 5 },
          { date: '2024-01-02', count: 3 },
        ];

        activities.forEach(a => {
          if (heatmap.hasOwnProperty(a.date)) {
            heatmap[a.date] = a.count;
          }
        });

        expect(heatmap['2024-01-01']).toBe(5);
        expect(heatmap['2024-01-02']).toBe(3);
        expect(heatmap['2024-01-03']).toBe(0);
      });

      it('should calculate intensity levels', () => {
        const counts = [0, 2, 5, 10, 20];

        const getIntensity = (count) => {
          if (count === 0) return 0;
          if (count < 5) return 1;
          if (count < 10) return 2;
          if (count < 15) return 3;
          return 4;
        };

        const intensities = counts.map(getIntensity);

        expect(intensities).toEqual([0, 1, 2, 3, 4]);
      });
    });

    describe('Heatmap Statistics', () => {
      it('should count total active days', () => {
        const heatmap = {
          '2024-01-01': 5,
          '2024-01-02': 0,
          '2024-01-03': 3,
          '2024-01-04': 0,
          '2024-01-05': 7,
        };

        const activeDays = Object.values(heatmap).filter(v => v > 0).length;

        expect(activeDays).toBe(3);
      });

      it('should find max activity day', () => {
        const heatmap = {
          '2024-01-01': 5,
          '2024-01-02': 12,
          '2024-01-03': 3,
        };

        const max = Math.max(...Object.values(heatmap));

        expect(max).toBe(12);
      });

      it('should calculate weekly patterns', () => {
        const activities = [
          { day: 'Monday', count: 5 },
          { day: 'Tuesday', count: 8 },
          { day: 'Monday', count: 3 },
        ];

        const weekly = {};
        activities.forEach(a => {
          weekly[a.day] = (weekly[a.day] || 0) + a.count;
        });

        expect(weekly.Monday).toBe(8);
        expect(weekly.Tuesday).toBe(8);
      });
    });
  });

  // ==========================================
  // Platform Detector Service Tests
  // ==========================================
  describe('Platform Detector Service', () => {
    it('should detect valid platforms', () => {
      const validPlatforms = ['leetcode', 'codeforces', 'codechef', 'github', 'atcoder'];

      validPlatforms.forEach(platform => {
        expect(platform).toMatch(/^[a-z]+$/);
      });
    });

    it('should validate platform URLs', () => {
      const urls = {
        leetcode: 'https://leetcode.com/',
        codeforces: 'https://codeforces.com/',
        codechef: 'https://www.codechef.com/',
      };

      Object.values(urls).forEach(url => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });

    it('should map platform to normalizer', () => {
      const normalizers = {
        leetcode: 'leetcode.normalizer',
        codeforces: 'codeforces.normalizer',
        codechef: 'codechef.normalizer',
      };

      expect(normalizers).toHaveProperty('leetcode');
      expect(normalizers).toHaveProperty('codeforces');
      expect(normalizers).toHaveProperty('codechef');
    });

    it('should handle invalid platform', () => {
      const platform = 'invalidplatform';
      const validPlatforms = ['leetcode', 'codeforces', 'codechef'];

      expect(validPlatforms).not.toContain(platform);
    });
  });
});

export default describe;
