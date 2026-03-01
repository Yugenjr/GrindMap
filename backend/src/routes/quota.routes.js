import express from 'express';
import QuotaManager from '../services/quotaManager.service.js';
import UserQuota from '../models/userQuota.model.js';
import { verifyJWT } from '../middlewares/jwtManager.middleware.js';
import { quotaAnalytics } from '../middlewares/quota.middleware.js';
import Logger from '../utils/logger.js';

const router = express.Router();

// Get user's quota status
router.get('/status', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const userQuota = await UserQuota.findOne({ userId });
    
    if (!userQuota) {
      return res.json({
        success: true,
        data: {
          tier: 'free',
          quotas: null,
          message: 'No quota record found'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        tier: userQuota.tier,
        quotas: userQuota.quotas,
        rateLimits: userQuota.rateLimits,
        isBlocked: userQuota.isBlocked,
        blockReason: userQuota.blockReason,
        blockUntil: userQuota.blockUntil,
        lastActivity: userQuota.lastActivity
      }
    });
  } catch (error) {
    Logger.error('Quota status failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get quota status'
    });
  }
});

// Get usage analytics
router.get('/analytics', verifyJWT, quotaAnalytics, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user.id;
    
    const analytics = await QuotaManager.getUsageAnalytics(userId, parseInt(days));
    
    if (!analytics) {
      return res.json({
        success: true,
        data: {
          message: 'No usage data found'
        }
      });
    }
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    Logger.error('Usage analytics failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get usage analytics'
    });
  }
});

// Upgrade user tier (admin only)
router.post('/upgrade/:userId', verifyJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    const { tier } = req.body;
    
    if (!['free', 'premium', 'enterprise'].includes(tier)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid tier. Must be free, premium, or enterprise'
      });
    }
    
    const userQuota = await QuotaManager.upgradeTier(userId, tier);
    
    res.json({
      success: true,
      data: {
        userId,
        tier: userQuota.tier,
        quotas: userQuota.quotas,
        rateLimits: userQuota.rateLimits
      },
      message: `User upgraded to ${tier} tier`
    });
  } catch (error) {
    Logger.error('Tier upgrade failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to upgrade tier'
    });
  }
});

// Block user (admin only)
router.post('/block/:userId', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    const { reason, duration = 3600000 } = req.body; // 1 hour default
    
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Block reason is required'
      });
    }
    
    await QuotaManager.blockUser(userId, reason, duration);
    
    res.json({
      success: true,
      message: `User blocked for ${Math.round(duration / 60000)} minutes`,
      data: {
        userId,
        reason,
        duration,
        blockedUntil: new Date(Date.now() + duration)
      }
    });
  } catch (error) {
    Logger.error('User blocking failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to block user'
    });
  }
});

// Unblock user (admin only)
router.post('/unblock/:userId', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    await QuotaManager.unblockUser(userId);
    
    res.json({
      success: true,
      message: 'User unblocked successfully',
      data: { userId }
    });
  } catch (error) {
    Logger.error('User unblocking failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to unblock user'
    });
  }
});

// Get system-wide quota statistics (admin only)
router.get('/system-stats', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const stats = await UserQuota.aggregate([
      {
        $group: {
          _id: '$tier',
          count: { $sum: 1 },
          totalDailyUsage: { $sum: '$quotas.daily.used' },
          totalMonthlyUsage: { $sum: '$quotas.monthly.used' },
          avgDailyUsage: { $avg: '$quotas.daily.used' },
          avgMonthlyUsage: { $avg: '$quotas.monthly.used' }
        }
      }
    ]);
    
    const blockedUsers = await UserQuota.countDocuments({ isBlocked: true });
    const totalUsers = await UserQuota.countDocuments();
    
    res.json({
      success: true,
      data: {
        tierStats: stats,
        totalUsers,
        blockedUsers,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    Logger.error('System stats failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get system stats'
    });
  }
});

// Reset user quotas (admin only)
router.post('/reset/:userId', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { userId } = req.params;
    const { type = 'daily' } = req.body; // 'daily', 'monthly', or 'both'
    
    const userQuota = await UserQuota.findOne({ userId });
    if (!userQuota) {
      return res.status(404).json({
        success: false,
        error: 'User quota not found'
      });
    }
    
    if (type === 'daily' || type === 'both') {
      userQuota.resetDailyQuota();
    }
    
    if (type === 'monthly' || type === 'both') {
      userQuota.resetMonthlyQuota();
    }
    
    await userQuota.save();
    
    res.json({
      success: true,
      message: `${type} quota reset successfully`,
      data: {
        userId,
        quotas: userQuota.quotas
      }
    });
  } catch (error) {
    Logger.error('Quota reset failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to reset quota'
    });
  }
});

// Get top API consumers (admin only)
router.get('/top-consumers', verifyJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }
    
    const { limit = 10, period = 'daily' } = req.query;
    
    const sortField = period === 'monthly' ? 'quotas.monthly.used' : 'quotas.daily.used';
    
    const topConsumers = await UserQuota.find({})
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'email username')
      .select('userId tier quotas.daily.used quotas.monthly.used lastActivity');
    
    res.json({
      success: true,
      data: {
        period,
        consumers: topConsumers.map(quota => ({
          user: quota.userId,
          tier: quota.tier,
          dailyUsage: quota.quotas.daily.used,
          monthlyUsage: quota.quotas.monthly.used,
          lastActivity: quota.lastActivity
        }))
      }
    });
  } catch (error) {
    Logger.error('Top consumers query failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to get top consumers'
    });
  }
});

export default router;