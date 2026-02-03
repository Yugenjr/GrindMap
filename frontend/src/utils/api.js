import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Adjust based on your backend

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Mock authentication data for demo purposes
const mockUsers = [
  {
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: 'Demo@123',
  },
];

// Mock login function
const mockLogin = (credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === credentials.email);
      if (user && user.password === credentials.password) {
        resolve({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            token: 'mock_token_' + Date.now(),
          },
        });
      } else {
        reject({
          response: {
            data: {
              message: 'Invalid email or password',
            },
          },
        });
      }
    }, 500);
  });
};

// Mock register function
const mockRegister = (userData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if email already exists
      if (mockUsers.find(u => u.email === userData.email)) {
        reject({
          response: {
            data: {
              message: 'Email already registered',
            },
          },
        });
        return;
      }

      // Add new user
      const newUser = {
        id: String(mockUsers.length + 1),
        name: userData.name,
        email: userData.email,
        password: userData.password,
      };
      mockUsers.push(newUser);

      resolve({
        data: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          token: 'mock_token_' + Date.now(),
        },
      });
    }, 500);
  });
};

// Mock update profile function
const mockUpdateProfile = (userData) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === localStorage.getItem('userEmail'));
      if (user) {
        user.name = userData.name;
        user.email = userData.email;
        user.username = userData.username;
        user.bio = userData.bio;
      }
      resolve({
        data: {
          id: user?.id || '1',
          name: userData.name,
          email: userData.email,
          username: userData.username,
          bio: userData.bio,
          token: localStorage.getItem('token'),
        },
      });
    }, 500);
  });
};

// Mock change password function
const mockChangePassword = (passwordData) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = mockUsers.find(u => u.email === localStorage.getItem('userEmail'));
      if (!user || user.password !== passwordData.currentPassword) {
        reject({
          response: {
            data: {
              message: 'Current password is incorrect',
            },
          },
        });
        return;
      }
      user.password = passwordData.newPassword;
      resolve({ data: { message: 'Password changed successfully' } });
    }, 500);
  });
};

// Mock delete account function
const mockDeleteAccount = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const userEmail = localStorage.getItem('userEmail');
      const index = mockUsers.findIndex(u => u.email === userEmail);
      if (index > -1) {
        mockUsers.splice(index, 1);
      }
      resolve({ data: { message: 'Account deleted successfully' } });
    }, 500);
  });
};

// Mock activities data
const mockActivities = [
  {
    id: '1',
    date: new Date().toISOString(),
    platform: 'LeetCode',
    problemName: 'Two Sum',
    problemLink: 'https://leetcode.com/problems/two-sum',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 25,
    language: 'Python',
    tags: ['Array', 'Hash Table'],
    attempts: 1,
    score: 100,
    notes: 'Used hash map for O(n) solution',
  },
  {
    id: '2',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'Codeforces',
    problemName: 'Beautiful Matrix',
    problemLink: 'https://codeforces.com/problemset/problem/263/A',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 15,
    language: 'C++',
    tags: ['Implementation'],
    attempts: 1,
    score: 500,
  },
  {
    id: '3',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'LeetCode',
    problemName: 'Longest Substring Without Repeating Characters',
    problemLink: 'https://leetcode.com/problems/longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    status: 'Solved',
    timeSpent: 45,
    language: 'JavaScript',
    tags: ['Hash Table', 'String', 'Sliding Window'],
    attempts: 2,
    score: 100,
  },
  {
    id: '4',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'HackerRank',
    problemName: 'Array Manipulation',
    problemLink: 'https://www.hackerrank.com/challenges/crush',
    difficulty: 'Hard',
    status: 'Attempted',
    timeSpent: 60,
    language: 'Java',
    tags: ['Array', 'Prefix Sum'],
    attempts: 3,
  },
  {
    id: '5',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'CodeChef',
    problemName: 'ATM Problem',
    problemLink: 'https://www.codechef.com/problems/HS08TEST',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 10,
    language: 'Python',
    tags: ['Ad-Hoc'],
    attempts: 1,
    score: 100,
  },
  {
    id: '6',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'LeetCode',
    problemName: 'Median of Two Sorted Arrays',
    problemLink: 'https://leetcode.com/problems/median-of-two-sorted-arrays',
    difficulty: 'Hard',
    status: 'Solved',
    timeSpent: 90,
    language: 'Python',
    tags: ['Array', 'Binary Search', 'Divide and Conquer'],
    attempts: 4,
    score: 100,
  },
  {
    id: '7',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'LeetCode',
    problemName: 'Valid Parentheses',
    problemLink: 'https://leetcode.com/problems/valid-parentheses',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 20,
    language: 'JavaScript',
    tags: ['String', 'Stack'],
    attempts: 1,
    score: 100,
  },
  {
    id: '8',
    date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    platform: 'Codeforces',
    problemName: 'Watermelon',
    problemLink: 'https://codeforces.com/problemset/problem/4/A',
    difficulty: 'Easy',
    status: 'Solved',
    timeSpent: 5,
    language: 'C++',
    tags: ['Math', 'Brute Force'],
    attempts: 1,
    score: 500,
  },
];

// Mock get activities
const mockGetActivities = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ 
        data: { 
          activities: mockActivities,
          total: mockActivities.length,
        } 
      });
    }, 500);
  });
};

const toDateKey = (value) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().split('T')[0];
};

const isWithinRange = (dateString, startDate, endDate) => {
  if (!dateString) return false;
  const current = new Date(dateString);
  if (Number.isNaN(current.getTime())) return false;
  if (startDate && current < startDate) return false;
  if (endDate && current > endDate) return false;
  return true;
};

const getWeekNumber = (date) => {
  const tempDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tempDate.getUTCDay() || 7;
  tempDate.setUTCDate(tempDate.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tempDate.getUTCFullYear(), 0, 1));
  return Math.ceil(((tempDate - yearStart) / 86400000 + 1) / 7);
};

const aggregateTimeSeries = (activities, granularity = 'day') => {
  const bucket = {};

  activities.forEach((activity) => {
    const date = new Date(activity.date);
    if (Number.isNaN(date.getTime())) return;

    let key = toDateKey(activity.date);
    if (granularity === 'week') {
      key = `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`;
    }
    if (granularity === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    if (granularity === 'year') {
      key = `${date.getFullYear()}`;
    }

    if (!bucket[key]) {
      bucket[key] = { label: key, solved: 0, attempts: 0, timeSpent: 0, solvedCount: 0 };
    }

    if (activity.status === 'Solved') {
      bucket[key].solved += 1;
      bucket[key].solvedCount += 1;
    }
    bucket[key].attempts += activity.attempts || 1;
    bucket[key].timeSpent += activity.timeSpent || 0;
  });

  return Object.values(bucket)
    .sort((a, b) => (a.label > b.label ? 1 : -1))
    .map((entry) => ({
      ...entry,
      avgTime: entry.solvedCount ? Math.round(entry.timeSpent / entry.solvedCount) : 0,
      successRate: entry.attempts ? Math.round((entry.solved / entry.attempts) * 100) : 0,
    }));
};

const buildDifficultyDistribution = (activities) => {
  const base = {
    Easy: { difficulty: 'Easy', solved: 0, attempts: 0 },
    Medium: { difficulty: 'Medium', solved: 0, attempts: 0 },
    Hard: { difficulty: 'Hard', solved: 0, attempts: 0 },
  };

  activities.forEach((activity) => {
    const target = base[activity.difficulty] || null;
    if (!target) return;
    target.attempts += activity.attempts || 1;
    if (activity.status === 'Solved') {
      target.solved += 1;
    }
  });

  return Object.values(base).map((item) => ({
    ...item,
    successRate: item.attempts ? Math.round((item.solved / item.attempts) * 100) : 0,
  }));
};

const buildPlatformComparison = (activities) => {
  const bucket = {};

  activities.forEach((activity) => {
    const key = activity.platform || 'Unknown';
    if (!bucket[key]) {
      bucket[key] = { platform: key, solved: 0, attempts: 0, timeSpent: 0, solvedCount: 0 };
    }

    if (activity.status === 'Solved') {
      bucket[key].solved += 1;
      bucket[key].solvedCount += 1;
    }
    bucket[key].attempts += activity.attempts || 1;
    bucket[key].timeSpent += activity.timeSpent || 0;
  });

  return Object.values(bucket).map((entry) => ({
    ...entry,
    successRate: entry.attempts ? Math.round((entry.solved / entry.attempts) * 100) : 0,
    avgTime: entry.solvedCount ? Math.round(entry.timeSpent / entry.solvedCount) : 0,
  }));
};

const buildLanguageUsage = (activities) => {
  const bucket = {};

  activities.forEach((activity) => {
    const key = activity.language || 'Unknown';
    bucket[key] = (bucket[key] || 0) + 1;
  });

  return Object.entries(bucket)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

const buildProductivityHeatmap = (activities) => {
  const matrix = Array.from({ length: 7 }, (_, day) => ({ day, hours: Array(24).fill(0) }));

  activities.forEach((activity) => {
    const date = new Date(activity.date);
    if (Number.isNaN(date.getTime())) return;
    const day = date.getDay();
    const hour = date.getHours();
    matrix[day].hours[hour] += 1;
  });

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return matrix.map((row) => ({
    day: dayLabels[row.day],
    values: row.hours.map((count, hour) => ({ hour, count })),
  }));
};

const buildSuccessRateByDifficultyOverTime = (activities) => {
  const bucket = {};

  activities.forEach((activity) => {
    const date = new Date(activity.date);
    if (Number.isNaN(date.getTime())) return;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!bucket[key]) {
      bucket[key] = {
        period: key,
        Easy: { solved: 0, attempts: 0 },
        Medium: { solved: 0, attempts: 0 },
        Hard: { solved: 0, attempts: 0 },
      };
    }

    const target = bucket[key][activity.difficulty] || null;
    if (!target) return;
    target.attempts += activity.attempts || 1;
    if (activity.status === 'Solved') {
      target.solved += 1;
    }
  });

  return Object.values(bucket)
    .sort((a, b) => (a.period > b.period ? 1 : -1))
    .map((entry) => ({
      period: entry.period,
      easy: entry.Easy.attempts ? Math.round((entry.Easy.solved / entry.Easy.attempts) * 100) : 0,
      medium: entry.Medium.attempts ? Math.round((entry.Medium.solved / entry.Medium.attempts) * 100) : 0,
      hard: entry.Hard.attempts ? Math.round((entry.Hard.solved / entry.Hard.attempts) * 100) : 0,
    }));
};

const buildAnalyticsMock = (range = {}) => {
  const startDate = range.startDate ? new Date(range.startDate) : null;
  const endDate = range.endDate ? new Date(range.endDate) : null;

  const filtered = mockActivities.filter((activity) =>
    isWithinRange(activity.date, startDate, endDate)
  );

  const solved = filtered.filter((item) => item.status === 'Solved');
  const attempts = filtered.reduce((sum, item) => sum + (item.attempts || 1), 0);
  const totalTime = solved.reduce((sum, item) => sum + (item.timeSpent || 0), 0);
  const fastestSolve = solved.reduce(
    (min, item) => (item.timeSpent && item.timeSpent < min ? item.timeSpent : min),
    solved[0]?.timeSpent || 0
  );

  const dailyTrends = aggregateTimeSeries(filtered, 'day');
  const weeklyTrends = aggregateTimeSeries(filtered, 'week');
  const monthlyTrends = aggregateTimeSeries(filtered, 'month');
  const yearlyTrends = aggregateTimeSeries(filtered, 'year');

  const heatmap = buildProductivityHeatmap(filtered);
  const difficulty = buildDifficultyDistribution(filtered);
  const platforms = buildPlatformComparison(filtered);
  const languages = buildLanguageUsage(filtered);
  const difficultyRates = buildSuccessRateByDifficultyOverTime(filtered);

  const bestHourBucket = {};
  filtered.forEach((activity) => {
    const date = new Date(activity.date);
    if (Number.isNaN(date.getTime())) return;
    const hour = date.getHours();
    bestHourBucket[hour] = (bestHourBucket[hour] || 0) + 1;
  });

  const peakHour = Object.entries(bestHourBucket).sort((a, b) => b[1] - a[1])[0];

  return {
    summary: {
      totalSolved: solved.length,
      totalAttempts: attempts,
      avgTime: solved.length ? Math.round(totalTime / solved.length) : 0,
      successRate: attempts ? Math.round((solved.length / attempts) * 100) : 0,
      fastestSolve: fastestSolve || 0,
      languagesUsed: languages.length,
      platformCount: platforms.length,
      peakHour: peakHour ? `${peakHour[0]}:00` : 'N/A',
    },
    trends: {
      daily: dailyTrends,
      weekly: weeklyTrends,
      monthly: monthlyTrends,
      yearly: yearlyTrends,
    },
    difficultyDistribution: difficulty,
    platformComparison: platforms,
    languageUsage: languages,
    productivityHeatmap: heatmap,
    successRateByDifficultyOverTime: difficultyRates,
    progressComparison: {
      monthly: monthlyTrends,
      yearly: yearlyTrends,
    },
    speedMetrics: {
      averageSolveTimeByWeek: weeklyTrends.map((item) => ({ week: item.label, minutes: item.avgTime })),
      averageSolveTimeByMonth: monthlyTrends.map((item) => ({ month: item.label, minutes: item.avgTime })),
    },
  };
};

export const authAPI = {
  login: (credentials) => {
    // Try real API first, fall back to mock
    return api
      .post('/auth/login', credentials)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockLogin(credentials);
      });
  },
  register: (userData) => {
    // Try real API first, fall back to mock
    return api
      .post('/auth/register', userData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockRegister(userData);
      });
  },
  updateProfile: (userData) => {
    // Try real API first, fall back to mock
    return api
      .put('/user/profile', userData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockUpdateProfile(userData);
      });
  },
  changePassword: (passwordData) => {
    // Try real API first, fall back to mock
    return api
      .post('/user/change-password', passwordData)
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockChangePassword(passwordData);
      });
  },
  deleteAccount: () => {
    // Try real API first, fall back to mock
    return api
      .delete('/user/account')
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockDeleteAccount();
      });
  },
};

export const activityAPI = {
  getActivities: () => {
    return api
      .get('/activity/history')
      .catch(() => {
        console.warn('Backend not available, using demo mode');
        return mockGetActivities();
      });
  },
};

// Mock platform connections data
const mockPlatformConnections = [
  {
    id: '1',
    platformId: 'leetcode',
    name: 'LeetCode',
    username: 'demo_user',
    connected: true,
    status: 'connected',
    lastSync: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    problemsSynced: 156,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: false,
    requiresToken: false,
    settings: {
      syncProblems: true,
      syncSubmissions: true,
      syncContests: false,
      autoSync: true,
    },
  },
  {
    id: '2',
    platformId: 'codeforces',
    name: 'Codeforces',
    username: 'demo_user',
    connected: true,
    status: 'connected',
    lastSync: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    problemsSynced: 89,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: true,
    requiresToken: false,
    settings: {
      syncProblems: true,
      syncSubmissions: true,
      syncContests: true,
      autoSync: true,
    },
  },
  {
    id: '3',
    platformId: 'github',
    name: 'GitHub',
    username: '',
    connected: false,
    status: 'disconnected',
    lastSync: null,
    problemsSynced: 0,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: false,
    requiresToken: true,
    settings: {
      syncProblems: true,
      syncSubmissions: false,
      syncContests: false,
      autoSync: false,
    },
  },
];

// Mock platform API functions
const mockGetPlatforms = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          platforms: mockPlatformConnections,
          total: mockPlatformConnections.length,
        },
      });
    }, 500);
  });
};

const mockConnectPlatform = (platformId, credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!credentials.username) {
        reject({
          response: {
            data: { message: 'Username is required' },
          },
        });
        return;
      }

      const platform = mockPlatformConnections.find(p => p.platformId === platformId);
      if (platform) {
        platform.connected = true;
        platform.status = 'connected';
        platform.username = credentials.username;
        platform.lastSync = new Date().toISOString();
        resolve({
          data: {
            message: 'Platform connected successfully',
            platform: platform,
          },
        });
      } else {
        // Add new platform
        const newPlatform = {
          id: String(mockPlatformConnections.length + 1),
          platformId: platformId,
          name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          username: credentials.username,
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString(),
          problemsSynced: 0,
          lastSyncError: null,
          syncing: false,
          settings: {
            syncProblems: true,
            syncSubmissions: true,
            syncContests: false,
            autoSync: true,
          },
        };
        mockPlatformConnections.push(newPlatform);
        resolve({
          data: {
            message: 'Platform connected successfully',
            platform: newPlatform,
          },
        });
      }
    }, 800);
  });
};

const mockDisconnectPlatform = (platformId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const platform = mockPlatformConnections.find(p => p.id === platformId);
      if (platform) {
        platform.connected = false;
        platform.status = 'disconnected';
        platform.lastSync = null;
      }
      resolve({
        data: {
          message: 'Platform disconnected successfully',
        },
      });
    }, 500);
  });
};

const mockTestConnection = (platformId, credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!credentials.username) {
        reject({
          response: {
            data: { message: 'Username is required for testing' },
          },
        });
        return;
      }

      // Simulate random success/failure for demo
      const success = Math.random() > 0.2; // 80% success rate
      if (success) {
        resolve({
          data: {
            success: true,
            message: 'Connection test successful! Found user profile.',
          },
        });
      } else {
        resolve({
          data: {
            success: false,
            message: 'Connection test failed. Please check your credentials.',
          },
        });
      }
    }, 1500);
  });
};

const mockSyncPlatform = (platformId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const platform = mockPlatformConnections.find(p => p.id === platformId);
      if (platform) {
        const synced = Math.floor(Math.random() * 20) + 5; // 5-25 problems synced
        platform.problemsSynced += synced;
        platform.lastSync = new Date().toISOString();
        platform.lastSyncError = null;
        resolve({
          data: {
            message: 'Sync completed successfully',
            synced: synced,
          },
        });
      }
    }, 2000);
  });
};

const mockUpdateSettings = (platformId, settings) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const platform = mockPlatformConnections.find(p => p.id === platformId);
      if (platform) {
        platform.settings = { ...platform.settings, ...settings };
      }
      resolve({
        data: {
          message: 'Settings updated successfully',
        },
      });
    }, 500);
  });
};

// Platform API
export const platformAPI = {
  getPlatforms: async () => {
    try {
      const response = await api.get('/platforms');
      return response;
    } catch (error) {
      console.log('Using mock platform data');
      return mockGetPlatforms();
    }
  },

  connectPlatform: async (platformId, credentials) => {
    try {
      const response = await api.post(`/platforms/${platformId}/connect`, credentials);
      return response;
    } catch (error) {
      console.log('Using mock connect platform');
      return mockConnectPlatform(platformId, credentials);
    }
  },

  disconnectPlatform: async (platformId) => {
    try {
      const response = await api.post(`/platforms/${platformId}/disconnect`);
      return response;
    } catch (error) {
      console.log('Using mock disconnect platform');
      return mockDisconnectPlatform(platformId);
    }
  },

  testConnection: async (platformId, credentials) => {
    try {
      const response = await api.post(`/platforms/${platformId}/test`, credentials);
      return response;
    } catch (error) {
      console.log('Using mock test connection');
      return mockTestConnection(platformId, credentials);
    }
  },

  syncPlatform: async (platformId) => {
    try {
      const response = await api.post(`/platforms/${platformId}/sync`);
      return response;
    } catch (error) {
      console.log('Using mock sync platform');
      return mockSyncPlatform(platformId);
    }
  },

  updateSettings: async (platformId, settings) => {
    try {
      const response = await api.put(`/platforms/${platformId}/settings`, settings);
      return response;
    } catch (error) {
      console.log('Using mock update settings');
      return mockUpdateSettings(platformId, settings);
    }
  },
};

export const analyticsAPI = {
  getOverview: async (params = {}) => {
    try {
      const response = await api.get('/analytics/overview', { params });
      return response;
    } catch (error) {
      console.log('Using mock analytics overview');
      return { data: buildAnalyticsMock(params) };
    }
  },
  exportReport: async (payload = {}) => {
    try {
      const response = await api.post('/analytics/export', payload, {
        responseType: 'blob',
      });
      return response;
    } catch (error) {
      console.log('Export report is mocked');
      return { data: buildAnalyticsMock(payload), isMock: true };
    }
  },
};

// Goals mock data and helpers
const mockGoals = [
  {
    id: 'g1',
    title: 'Daily Warmup',
    type: 'problems',
    target: 1,
    progress: 60,
    timeframe: 'daily',
    platform: 'LeetCode',
    difficulty: 'Easy',
    status: 'active',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 4 * 86400000).toISOString(),
    streakGoal: true,
  },
  {
    id: 'g2',
    title: 'Weekly Medium Grind',
    type: 'problems',
    target: 7,
    progress: 40,
    timeframe: 'weekly',
    platform: 'Codeforces',
    difficulty: 'Medium',
    status: 'active',
    startDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 2 * 86400000).toISOString(),
    streakGoal: false,
  },
  {
    id: 'g3',
    title: 'Monthly Hard Push',
    type: 'difficulty',
    target: 10,
    progress: 80,
    timeframe: 'monthly',
    platform: 'All',
    difficulty: 'Hard',
    status: 'active',
    startDate: new Date(Date.now() - 12 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 18 * 86400000).toISOString(),
    streakGoal: false,
  },
  {
    id: 'g4',
    title: 'Contest Participation',
    type: 'contest',
    target: 2,
    progress: 100,
    timeframe: 'monthly',
    platform: 'CodeChef',
    difficulty: 'Any',
    status: 'completed',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    streakGoal: false,
  },
];

const mockAchievements = [
  { id: 'a1', title: 'Consistency Champ', description: 'Maintain a 7-day streak', unlocked: true, icon: '🔥' },
  { id: 'a2', title: 'Medium Mastery', description: 'Finish 10 medium problems in a month', unlocked: true, icon: '🧠' },
  { id: 'a3', title: 'Hardcore', description: 'Complete 5 hard problems in a week', unlocked: false, icon: '💪' },
  { id: 'a4', title: 'Contest Challenger', description: 'Join two contests this month', unlocked: true, icon: '🏆' },
];

const buildGoalStats = () => {
  const total = mockGoals.length;
  const completed = mockGoals.filter((g) => g.status === 'completed').length;
  const active = mockGoals.filter((g) => g.status === 'active').length;
  const paused = mockGoals.filter((g) => g.status === 'paused').length;
  const completionRate = total ? Math.round((completed / total) * 100) : 0;
  const streakDays = 6; // placeholder integration with streak model

  return {
    total,
    completed,
    active,
    paused,
    completionRate,
    streakDays,
  };
};

const mockGetGoals = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          goals: mockGoals,
          achievements: mockAchievements,
          stats: buildGoalStats(),
        },
      });
    }, 400);
  });
};

const mockCreateGoal = (goal) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newGoal = {
        id: `g${mockGoals.length + 1}`,
        progress: 0,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: goal.timeframe === 'daily'
          ? new Date(Date.now() + 86400000).toISOString()
          : goal.timeframe === 'weekly'
            ? new Date(Date.now() + 7 * 86400000).toISOString()
            : new Date(Date.now() + 30 * 86400000).toISOString(),
        ...goal,
      };
      mockGoals.push(newGoal);
      resolve({ data: { goal: newGoal, stats: buildGoalStats() } });
    }, 300);
  });
};

const mockUpdateGoal = (id, updates) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const goal = mockGoals.find((g) => g.id === id);
      if (!goal) {
        reject({ response: { data: { message: 'Goal not found' } } });
        return;
      }
      Object.entries(updates || {}).forEach(([key, value]) => {
        if (typeof value !== 'undefined') {
          goal[key] = value;
        }
      });
      if (goal.progress >= 100) {
        goal.progress = 100;
        goal.status = 'completed';
      }
      resolve({ data: { goal, stats: buildGoalStats() } });
    }, 300);
  });
};

const mockDeleteGoal = (id) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const index = mockGoals.findIndex((g) => g.id === id);
      if (index > -1) {
        mockGoals.splice(index, 1);
      }
      resolve({ data: { success: true, stats: buildGoalStats() } });
    }, 200);
  });
};

export const goalsAPI = {
  getGoals: async () => {
    try {
      const response = await api.get('/goals');
      return response;
    } catch (error) {
      console.log('Using mock goals data');
      return mockGetGoals();
    }
  },
  createGoal: async (goal) => {
    try {
      const response = await api.post('/goals', goal);
      return response;
    } catch (error) {
      console.log('Using mock create goal');
      return mockCreateGoal(goal);
    }
  },
  updateGoal: async (id, updates) => {
    try {
      const response = await api.put(`/goals/${id}`, updates);
      return response;
    } catch (error) {
      console.log('Using mock update goal');
      return mockUpdateGoal(id, updates);
    }
  },
  deleteGoal: async (id) => {
    try {
      const response = await api.delete(`/goals/${id}`);
      return response;
    } catch (error) {
      console.log('Using mock delete goal');
      return mockDeleteGoal(id);
    }
  },
};

// Mock platform connections data
const mockPlatformConnections = [
  {
    id: '1',
    platformId: 'leetcode',
    name: 'LeetCode',
    username: 'demo_user',
    connected: true,
    status: 'connected',
    lastSync: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
    problemsSynced: 156,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: false,
    requiresToken: false,
    settings: {
      syncProblems: true,
      syncSubmissions: true,
      syncContests: false,
      autoSync: true,
    },
  },
  {
    id: '2',
    platformId: 'codeforces',
    name: 'Codeforces',
    username: 'demo_user',
    connected: true,
    status: 'connected',
    lastSync: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
    problemsSynced: 89,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: true,
    requiresToken: false,
    settings: {
      syncProblems: true,
      syncSubmissions: true,
      syncContests: true,
      autoSync: true,
    },
  },
  {
    id: '3',
    platformId: 'github',
    name: 'GitHub',
    username: '',
    connected: false,
    status: 'disconnected',
    lastSync: null,
    problemsSynced: 0,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: false,
    requiresToken: true,
    settings: {
      syncProblems: true,
      syncSubmissions: false,
      syncContests: false,
      autoSync: false,
    },
  },
];

// Mock platform API functions
const mockGetPlatforms = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        data: {
          platforms: mockPlatformConnections,
          total: mockPlatformConnections.length,
        },
      });
    }, 500);
  });
};

const mockConnectPlatform = (platformId, credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!credentials.username) {
        reject({
          response: {
            data: { message: 'Username is required' },
          },
        });
        return;
      }

      const platform = mockPlatformConnections.find(p => p.platformId === platformId);
      if (platform) {
        platform.connected = true;
        platform.status = 'connected';
        platform.username = credentials.username;
        platform.lastSync = new Date().toISOString();
        resolve({
          data: {
            message: 'Platform connected successfully',
            platform: platform,
          },
        });
      } else {
        // Add new platform
        const newPlatform = {
          id: String(mockPlatformConnections.length + 1),
          platformId: platformId,
          name: platformId.charAt(0).toUpperCase() + platformId.slice(1),
          username: credentials.username,
          connected: true,
          status: 'connected',
          lastSync: new Date().toISOString(),
          problemsSynced: 0,
          lastSyncError: null,
          syncing: false,
          settings: {
            syncProblems: true,
            syncSubmissions: true,
            syncContests: false,
            autoSync: true,
          },
        };
        mockPlatformConnections.push(newPlatform);
        resolve({
          data: {
            message: 'Platform connected successfully',
            platform: newPlatform,
          },
        });
      }
    }, 800);
  });
};

const mockDisconnectPlatform = (platformId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const platform = mockPlatformConnections.find(p => p.id === platformId);
      if (platform) {
        platform.connected = false;
        platform.status = 'disconnected';
        platform.lastSync = null;
      }
      resolve({
        data: {
          message: 'Platform disconnected successfully',
        },
      });
    }, 500);
  });
};

const mockTestConnection = (platformId, credentials) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!credentials.username) {
        reject({
          response: {
            data: { message: 'Username is required for testing' },
          },
        });
        return;
      }

      // Simulate random success/failure for demo
      const success = Math.random() > 0.2; // 80% success rate
      if (success) {
        resolve({
          data: {
            success: true,
            message: 'Connection test successful! Found user profile.',
          },
        });
      } else {
        resolve({
          data: {
            success: false,
            message: 'Connection test failed. Please check your credentials.',
          },
        });
      }
    }, 1500);
  });
};

const mockSyncPlatform = (platformId) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const platform = mockPlatformConnections.find(p => p.id === platformId);
      if (platform) {
        const synced = Math.floor(Math.random() * 20) + 5; // 5-25 problems synced
        platform.problemsSynced += synced;
        platform.lastSync = new Date().toISOString();
        platform.lastSyncError = null;
        resolve({
          data: {
            message: 'Sync completed successfully',
            synced: synced,
          },
        });
      }
    }, 2000);
  });
};

const mockUpdateSettings = (platformId, settings) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const platform = mockPlatformConnections.find(p => p.id === platformId);
      if (platform) {
        platform.settings = { ...platform.settings, ...settings };
      }
      resolve({
        data: {
          message: 'Settings updated successfully',
        },
      });
    }, 500);
  });
};

// Platform API
export const platformAPI = {
  getPlatforms: async () => {
    try {
      const response = await api.get('/platforms');
      return response;
    } catch (error) {
      console.log('Using mock platform data');
      return mockGetPlatforms();
    }
  },

  connectPlatform: async (platformId, credentials) => {
    try {
      const response = await api.post(`/platforms/${platformId}/connect`, credentials);
      return response;
    } catch (error) {
      console.log('Using mock connect platform');
      return mockConnectPlatform(platformId, credentials);
    }
  },

  disconnectPlatform: async (platformId) => {
    try {
      const response = await api.post(`/platforms/${platformId}/disconnect`);
      return response;
    } catch (error) {
      console.log('Using mock disconnect platform');
      return mockDisconnectPlatform(platformId);
    }
  },

  testConnection: async (platformId, credentials) => {
    try {
      const response = await api.post(`/platforms/${platformId}/test`, credentials);
      return response;
    } catch (error) {
      console.log('Using mock test connection');
      return mockTestConnection(platformId, credentials);
    }
  },

  syncPlatform: async (platformId) => {
    try {
      const response = await api.post(`/platforms/${platformId}/sync`);
      return response;
    } catch (error) {
      console.log('Using mock sync platform');
      return mockSyncPlatform(platformId);
    }
  },

  updateSettings: async (platformId, settings) => {
    try {
      const response = await api.put(`/platforms/${platformId}/settings`, settings);
      return response;
    } catch (error) {
      console.log('Using mock update settings');
      return mockUpdateSettings(platformId, settings);
    }
  },
};

export default api;