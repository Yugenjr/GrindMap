import * as platformService from '../services/platform.service.js';

/**
 * Get all connected platforms for a user
 */
export const getPlatforms = async (req, res) => {
  try {
    const userId = req.user.id;
    const platforms = await platformService.getUserPlatforms(userId);
    res.json({
      success: true,
      data: {
        platforms,
        total: platforms.length,
      },
    });
  } catch (error) {
    console.error('Error getting platforms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get platforms',
      error: error.message,
    });
  }
};

/**
 * Connect a platform account
 */
export const connectPlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.params;
    const { username, apiKey, token } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    const platform = await platformService.connectPlatform(
      userId,
      platformId,
      { username, apiKey, token }
    );

    res.status(201).json({
      success: true,
      data: {
        platform,
        message: 'Platform connected successfully',
      },
    });
  } catch (error) {
    console.error('Error connecting platform:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to connect platform',
    });
  }
};

/**
 * Disconnect a platform
 */
export const disconnectPlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.params;

    await platformService.disconnectPlatform(userId, platformId);

    res.json({
      success: true,
      message: 'Platform disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to disconnect platform',
    });
  }
};

/**
 * Test connection to a platform
 */
export const testConnection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.params;
    const { username, apiKey, token } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Username is required',
      });
    }

    const result = await platformService.testConnection(
      platformId,
      { username, apiKey, token }
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Error testing connection:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Connection test failed',
    });
  }
};

/**
 * Sync data from a platform
 */
export const syncPlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.params;

    const result = await platformService.syncPlatform(userId, platformId);

    res.json({
      success: true,
      data: {
        synced: result.synced || 0,
        message: `Synced ${result.synced || 0} items successfully`,
      },
    });
  } catch (error) {
    console.error('Error syncing platform:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to sync platform',
    });
  }
};

/**
 * Update platform sync settings
 */
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.params;
    const { syncProblems, syncSubmissions, syncContests, autoSync } = req.body;

    const platform = await platformService.updateSettings(
      userId,
      platformId,
      {
        syncProblems,
        syncSubmissions,
        syncContests,
        autoSync,
      }
    );

    res.json({
      success: true,
      data: {
        platform,
        message: 'Settings updated successfully',
      },
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update settings',
    });
  }
};

/**
 * Get platform connection status
 */
export const getPlatformStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { platformId } = req.params;

    const status = await platformService.getPlatformStatus(userId, platformId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error getting platform status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to get platform status',
    });
  }
};
