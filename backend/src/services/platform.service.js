// Mock data for platform credentials storage
// In production, this would be stored in a secure database with encryption
const platformConnections = new Map();

/**
 * Get all platforms connected by a user
 */
export const getUserPlatforms = async (userId) => {
  if (!platformConnections.has(userId)) {
    return [];
  }
  return Array.from(platformConnections.get(userId).values());
};

/**
 * Connect a platform account
 */
export const connectPlatform = async (userId, platformId, credentials) => {
  if (!credentials.username) {
    throw new Error('Username is required');
  }

  const platformConfig = getPlatformConfig(platformId);
  if (!platformConfig) {
    throw new Error(`Platform ${platformId} is not supported`);
  }

  if (platformConfig.requiresApiKey && !credentials.apiKey) {
    throw new Error('API Key is required for this platform');
  }

  if (platformConfig.requiresToken && !credentials.token) {
    throw new Error('Access Token is required for this platform');
  }

  // Validate credentials by testing connection
  const testResult = await testConnection(platformId, credentials);
  if (!testResult.success) {
    throw new Error('Invalid credentials. Connection test failed.');
  }

  // Store the connection
  const userConnections = platformConnections.get(userId) || new Map();
  const platform = {
    id: `${userId}_${platformId}`,
    platformId,
    name: platformConfig.name,
    username: credentials.username,
    connected: true,
    status: 'connected',
    lastSync: new Date().toISOString(),
    problemsSynced: 0,
    lastSyncError: null,
    syncing: false,
    requiresApiKey: platformConfig.requiresApiKey,
    requiresToken: platformConfig.requiresToken,
    settings: {
      syncProblems: true,
      syncSubmissions: true,
      syncContests: false,
      autoSync: true,
    },
  };

  userConnections.set(platformId, platform);
  platformConnections.set(userId, userConnections);

  return platform;
};

/**
 * Disconnect a platform
 */
export const disconnectPlatform = async (userId, platformId) => {
  const userConnections = platformConnections.get(userId);
  if (!userConnections || !userConnections.has(platformId)) {
    throw new Error('Platform not connected');
  }

  userConnections.delete(platformId);
  if (userConnections.size === 0) {
    platformConnections.delete(userId);
  }
};

/**
 * Test connection to a platform
 */
export const testConnection = async (platformId, credentials) => {
  // Simulate API call to platform
  return new Promise((resolve) => {
    setTimeout(() => {
      const success = credentials.username && credentials.username.length > 0;
      resolve({
        success,
        message: success
          ? `Successfully connected to ${getPlatformName(platformId)}`
          : 'Connection failed. Please check your credentials.',
      });
    }, 1000);
  });
};

/**
 * Sync data from a platform
 */
export const syncPlatform = async (userId, platformId) => {
  const userConnections = platformConnections.get(userId);
  if (!userConnections || !userConnections.has(platformId)) {
    throw new Error('Platform not connected');
  }

  const platform = userConnections.get(platformId);

  // Simulate sync
  platform.syncing = true;
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simulate syncing some problems
      const syncedCount = Math.floor(Math.random() * 20) + 5;
      platform.problemsSynced = (platform.problemsSynced || 0) + syncedCount;
      platform.lastSync = new Date().toISOString();
      platform.lastSyncError = null;
      platform.syncing = false;

      resolve({
        synced: syncedCount,
        total: platform.problemsSynced,
      });
    }, 2000);
  });
};

/**
 * Update platform sync settings
 */
export const updateSettings = async (userId, platformId, settings) => {
  const userConnections = platformConnections.get(userId);
  if (!userConnections || !userConnections.has(platformId)) {
    throw new Error('Platform not connected');
  }

  const platform = userConnections.get(platformId);
  platform.settings = {
    ...platform.settings,
    ...settings,
  };

  return platform;
};

/**
 * Get platform status
 */
export const getPlatformStatus = async (userId, platformId) => {
  const userConnections = platformConnections.get(userId);
  if (!userConnections || !userConnections.has(platformId)) {
    throw new Error('Platform not connected');
  }

  const platform = userConnections.get(platformId);
  return {
    platform: platform.platformId,
    connected: platform.connected,
    lastSync: platform.lastSync,
    status: platform.status,
    healthStatus: getHealthStatus(platform),
  };
};

/**
 * Helper function to get platform configuration
 */
function getPlatformConfig(platformId) {
  const platforms = {
    leetcode: { name: 'LeetCode', requiresApiKey: false, requiresToken: false },
    codeforces: { name: 'Codeforces', requiresApiKey: true, requiresToken: false },
    hackerrank: { name: 'HackerRank', requiresApiKey: true, requiresToken: false },
    codechef: { name: 'CodeChef', requiresApiKey: false, requiresToken: false },
    github: { name: 'GitHub', requiresApiKey: false, requiresToken: true },
    atcoder: { name: 'AtCoder', requiresApiKey: false, requiresToken: false },
    topcoder: { name: 'TopCoder', requiresApiKey: true, requiresToken: false },
  };

  return platforms[platformId.toLowerCase()];
}

/**
 * Helper function to get platform name
 */
function getPlatformName(platformId) {
  const config = getPlatformConfig(platformId);
  return config ? config.name : 'Platform';
}

/**
 * Helper function to get health status
 */
function getHealthStatus(platform) {
  if (!platform.connected) return 'Not Connected';
  if (platform.lastSyncError) return 'Error';
  if (platform.syncing) return 'Syncing...';
  if (!platform.lastSync) return 'Never Synced';

  const lastSync = new Date(platform.lastSync);
  const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

  if (hoursSinceSync < 1) return 'Healthy';
  if (hoursSinceSync < 24) return 'Good';
  return 'Outdated';
}
